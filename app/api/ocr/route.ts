import { NextRequest, NextResponse } from "next/server";

const TYPHOON_OCR_URL = "https://api.opentyphoon.ai/v1/ocr";

type TyphoonOcrChoice = {
  message: { content: string };
};

type TyphoonOcrPageResult = {
  success: boolean;
  filename?: string;
  error?: string;
  message?: { choices: TyphoonOcrChoice[] };
};

type TyphoonOcrResponse = {
  results?: TyphoonOcrPageResult[];
};

function extractText(result: TyphoonOcrResponse) {
  const extractedTexts: string[] = [];

  for (const pageResult of result.results ?? []) {
    if (!pageResult.success || !pageResult.message) continue;

    const content = pageResult.message.choices[0]?.message.content ?? "";
    try {
      const parsed = JSON.parse(content) as { natural_text?: string };
      extractedTexts.push(parsed.natural_text ?? content);
    } catch {
      extractedTexts.push(content);
    }
  }

  return extractedTexts.join("\n");
}

function flattenHtmlTables(text: string) {
  return text
    .replace(/<\/tr>/gi, "\n")
    .replace(/<tr[^>]*>/gi, "")
    .replace(/<\/t[dh]>/gi, " | ")
    .replace(/<t[dh][^>]*>/gi, "")
    .replace(/<\/?table[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\|(?:\s*\|)+/g, "|")
    .replace(/[ \t]*\|[ \t]*/g, " | ")
    .replace(/^\s*\|\s*|\s*\|\s*$/gm, "");
}

const RECEIPT_NUMBER_PATTERN =
  /(?:เลขที่\s*ใบเสร็จ|เลขที่\s*บิล|เลขใบเสร็จ|เลขที่|หมายเลขคำสั่งซื้อ|Invoice Number|receipt\s*no\.?|invoice\s*no\.?|ref(?:erence)?\s*no\.?|no\.?)\s*[:：]?\s*([A-Za-z0-9][A-Za-z0-9/-]{3,})/i;

function extractReceiptNumber(text: string) {
  const match = text.match(RECEIPT_NUMBER_PATTERN);
  return match?.[1]?.trim() ?? null;
}

type ReceiptOcrItem = {
  no: string;
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
};

const NUMERIC_TOKEN_PATTERN = /^[\d,]+(?:\.\d+)?$/;

function parseAmountToken(token: string) {
  const value = Number(token.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function splitTableColumns(line: string) {
  const columns = line.includes("|")
    ? line.split("|")
    : line.split(/\t+|\s{2,}/);

  return columns.map((column) => column.trim()).filter((column) => column.length > 0);
}

function extractReceiptItems(text: string) {
  const items: ReceiptOcrItem[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const columns = splitTableColumns(line);
    if (columns.length < 4) continue;

    const noMatch = columns[0].match(/^(\d{1,3})\.?$/);
    if (!noMatch) continue;

    const trailing = columns.slice(-3);
    if (!trailing.every((column) => NUMERIC_TOKEN_PATTERN.test(column))) continue;

    const description = columns.slice(1, -3).join(" ").trim();
    if (!description) continue;

    const [quantityToken, unitPriceToken, amountToken] = trailing;
    items.push({
      no: noMatch[1],
      description,
      quantity: parseAmountToken(quantityToken),
      unitPrice: parseAmountToken(unitPriceToken),
      amount: parseAmountToken(amountToken),
    });
  }

  return items;
}

const TOTAL_LABEL_PATTERN =
  /(?:grand\s*total|total\s*amount|ยอดรวมทั้งสิ้น|รวมทั้งสิ้น|ราคารวมภาษีมูลค่าเพิ่ม|ราคารวม|ยอดสุทธิ|ยอดรวม|รวมเงิน|total|รวม)[\s|:：]*([\d,]+\.\d{2})/i;

const VAT_EXCLUSIVE_LINE_PATTERN =
  /^มูลค่าสินค้าไม่รวมภาษีมูลค่าเพิ่ม[\s|:：]*([\d,]+\.\d{2})/i;
const VAT_AMOUNT_LINE_PATTERN = /^ภาษีมูลค่าเพิ่ม[\s|:：]*([\d,]+\.\d{2})/i;

function amountsClose(a: number, b: number) {
  return Math.abs(a - b) < 1;
}

function sumItemAmounts(items: ReceiptOcrItem[]) {
  if (items.length === 0) return null;
  const sum = items.reduce((total, item) => total + (item.amount ?? 0), 0);
  return sum > 0 ? sum : null;
}

function extractLabeledLineAmount(text: string, pattern: RegExp) {
  for (const rawLine of text.split("\n")) {
    const match = rawLine.trim().match(pattern);
    if (match?.[1]) return parseAmountToken(match[1]);
  }
  return null;
}

function extractReceiptTotal(text: string, items: ReceiptOcrItem[]) {
  const match = text.match(TOTAL_LABEL_PATTERN);
  const labeledTotal = match?.[1] ? parseAmountToken(match[1]) : null;

  const itemSum = sumItemAmounts(items);
  const preVat = extractLabeledLineAmount(text, VAT_EXCLUSIVE_LINE_PATTERN);
  const vatAmount = extractLabeledLineAmount(text, VAT_AMOUNT_LINE_PATTERN);
  const reconstructedTotal =
    preVat !== null && vatAmount !== null ? preVat + vatAmount : null;

  // Trust the labeled total only when it agrees with an independently
  // derived total (item sum, or pre-VAT + VAT) — OCR sometimes misreads
  // this single figure while the corroborating figures stay correct.
  if (
    labeledTotal !== null &&
    ((itemSum !== null && amountsClose(labeledTotal, itemSum)) ||
      (reconstructedTotal !== null &&
        amountsClose(labeledTotal, reconstructedTotal)))
  ) {
    return labeledTotal;
  }

  if (
    itemSum !== null &&
    reconstructedTotal !== null &&
    amountsClose(itemSum, reconstructedTotal)
  ) {
    return itemSum;
  }

  return itemSum ?? reconstructedTotal ?? labeledTotal;
}

const THAI_MONTH_MAP: Record<string, number> = {
  "มกราคม": 1, "ม.ค.": 1, "ม.ค": 1,
  "กุมภาพันธ์": 2, "ก.พ.": 2, "ก.พ": 2,
  "มีนาคม": 3, "มี.ค.": 3, "มี.ค": 3,
  "เมษายน": 4, "เม.ย.": 4, "เม.ย": 4,
  "พฤษภาคม": 5, "พ.ค.": 5, "พ.ค": 5,
  "มิถุนายน": 6, "มิ.ย.": 6, "มิ.ย": 6,
  "กรกฎาคม": 7, "ก.ค.": 7, "ก.ค": 7,
  "สิงหาคม": 8, "ส.ค.": 8, "ส.ค": 8,
  "กันยายน": 9, "ก.ย.": 9, "ก.ย": 9,
  "ตุลาคม": 10, "ต.ค.": 10, "ต.ค": 10,
  "พฤศจิกายน": 11, "พ.ย.": 11, "พ.ย": 11,
  "ธันวาคม": 12, "ธ.ค.": 12, "ธ.ค": 12,
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const THAI_MONTH_PATTERN = Object.keys(THAI_MONTH_MAP)
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp)
  .join("|");

const EN_MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const EN_MONTH_PATTERN =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

const DATE_LABEL_PATTERN =
  /(?:transaction\s*date\s*\/?\s*time|วันที่สำเร็จ|transaction\s*date|date\s*\/?\s*time|วันที่\s*ออกใบเสร็จ|วันที่\s*ใบเสร็จ|วันที่|date)\s*[:：]?\s*/i;

const TIME_PATTERN =
  /([01]?\d|2[0-3])[:.]([0-5]\d)(?:[:.]([0-5]\d))?\s*(AM|PM)?(?:\s*น\.?)?/i;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toGregorianYear(rawYear: number) {
  if (rawYear < 100) return 2500 + rawYear - 543;
  if (rawYear >= 2400) return rawYear - 543;
  return rawYear;
}

function parseNumericDate(text: string) {
  const isoMatch = text.match(/\b(\d{4})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{1,2})\b/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return { year: toGregorianYear(Number(y)), month: Number(m), day: Number(d) };
  }

  const dmyMatch = text.match(/\b(\d{1,2})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{2,4})\b/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return { year: toGregorianYear(Number(y)), month: Number(m), day: Number(d) };
  }

  return null;
}

function parseThaiMonthNameDate(text: string) {
  const pattern = new RegExp(`(\\d{1,2})\\s*(?:${THAI_MONTH_PATTERN})\\s*(\\d{2,4})`);
  const monthMatch = text.match(new RegExp(THAI_MONTH_PATTERN));
  const fullMatch = text.match(pattern);
  if (!fullMatch || !monthMatch) return null;

  const month = THAI_MONTH_MAP[monthMatch[0]];
  if (!month) return null;

  const [, d, y] = fullMatch;
  return { year: toGregorianYear(Number(y)), month, day: Number(d) };
}

function parseEnglishMonthNameDate(text: string) {
  const pattern = new RegExp(
    `(\\d{1,2})[\\s-]+(${EN_MONTH_PATTERN})[a-z]*[\\s-]+(\\d{2,4})`,
    "i",
  );
  const match = text.match(pattern);
  if (!match) return null;

  const [, d, monthName, y] = match;
  const month = EN_MONTH_MAP[monthName.toLowerCase()];
  if (!month) return null;

  return { year: toGregorianYear(Number(y)), month, day: Number(d) };
}

function extractTime(text: string) {
  const match = text.match(TIME_PATTERN);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[4]?.toUpperCase();
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return `${pad(hour)}:${minute}`;
}

function extractReceiptDate(text: string) {
  const labelMatch = text.match(DATE_LABEL_PATTERN);
  const searchScope = labelMatch
    ? text.slice(labelMatch.index! + labelMatch[0].length, labelMatch.index! + labelMatch[0].length + 40)
    : text;

  const dateParts =
    parseNumericDate(searchScope) ??
    parseThaiMonthNameDate(searchScope) ??
    parseEnglishMonthNameDate(searchScope) ??
    parseNumericDate(text) ??
    parseThaiMonthNameDate(text) ??
    parseEnglishMonthNameDate(text);
  if (!dateParts) return null;

  const { year, month, day } = dateParts;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const datePart = `${year}-${pad(month)}-${pad(day)}`;
  const time = extractTime(text);
  return time ? `${datePart} ${time}` : datePart;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.TYPHOON_OCR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OCR is not configured" },
      { status: 500 },
    );
  }

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof Blob)) {
    console.error(
      "[/api/ocr] missing file field, got keys:",
      Array.from(incoming.keys()),
    );
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const outgoing = new FormData();
  outgoing.append("file", file);
  outgoing.append("model", "typhoon-ocr");
  outgoing.append("task_type", "default");
  outgoing.append("max_tokens", "16384");
  outgoing.append("temperature", "0.1");
  outgoing.append("top_p", "0.6");
  outgoing.append("repetition_penalty", "1.2");

  const response = await fetch(TYPHOON_OCR_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: outgoing,
  });

  if (!response.ok) {
    const bodyText = await response.text();
    console.error(`[/api/ocr] Typhoon request failed (${response.status}):`, bodyText);
    return NextResponse.json(
      { error: "OCR request failed", detail: bodyText },
      { status: response.status },
    );
  }

  const result = (await response.json()) as TyphoonOcrResponse;
  const text = extractText(result);
  const parsedText = flattenHtmlTables(text);
  const items = extractReceiptItems(parsedText);
  return NextResponse.json({
    text,
    receiptNumber: extractReceiptNumber(parsedText),
    date: extractReceiptDate(parsedText),
    items,
    total: extractReceiptTotal(parsedText, items),
  });
}
