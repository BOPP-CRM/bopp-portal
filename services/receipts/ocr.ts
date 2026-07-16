export type ReceiptOcrItem = {
  no: string;
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number | null;
};

export type ReceiptOcrData = {
  text: string;
  receiptNumber: string | null;
  date: string | null;
  items: ReceiptOcrItem[];
  total: number | null;
};

const OCR_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/tiff": "tiff",
  "image/bmp": "bmp",
  "application/pdf": "pdf",
};

function getOcrFileName(mimeType: string) {
  return `receipt.${OCR_MIME_EXTENSIONS[mimeType] ?? "jpg"}`;
}

export const fetchImageAsOcrFile = async (imageUrl: string) => {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("โหลดรูปไม่สำเร็จ");

  const blob = await response.blob();
  return new File([blob], getOcrFileName(blob.type), { type: blob.type });
};

export const extractReceiptOcrData = async (
  file: File,
): Promise<ReceiptOcrData | null> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/ocr", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) return null;

  const result = (await response.json()) as {
    text?: string;
    receiptNumber?: string | null;
    date?: string | null;
    items?: ReceiptOcrItem[];
    total?: number | null;
  };

  return {
    text: result.text ?? "",
    receiptNumber: result.receiptNumber ?? null,
    date: result.date ?? null,
    items: result.items ?? [],
    total: result.total ?? null,
  };
};
