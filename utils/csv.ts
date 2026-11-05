import { downloadBlob } from "@/utils/file";

function csvCell(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === false) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
) {
  const body = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${body}`], {
    type: "text/csv;charset=utf-8",
  });
  const safeName = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  downloadBlob(blob, safeName);
}

export async function collectPages<T>(
  fetchPage: (
    offset: number,
    limit: number,
  ) => Promise<{ rows: T[]; total: number }>,
  limit = 100,
) {
  const rows: T[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const page = await fetchPage(offset, limit);
    total = page.total;
    if (page.rows.length === 0) break;
    rows.push(...page.rows);
    offset += page.rows.length;
    if (page.rows.length < limit) break;
  }

  return rows;
}
