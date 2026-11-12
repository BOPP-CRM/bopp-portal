import dialog from "@/components/util/dialog";
import axios from "axios";

export type AppError = {
  message: string;
  status?: number;
  traceId?: string;
  raw: unknown;
};

const TRACE_ID_HEADER = "x-trace-id";
const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/i;

const traceReference = (traceId: string) => `(รหัสอ้างอิง: ${traceId})`;

function withTraceReference(message: string, traceId?: string) {
  if (!traceId) return message;
  const suffix = ` ${traceReference(traceId)}`;
  return message.endsWith(suffix) ? message : `${message}${suffix}`;
}

function withoutTraceReference(message: string, traceId?: string) {
  if (!traceId) return message;
  const suffix = ` ${traceReference(traceId)}`;
  return message.endsWith(suffix) ? message.slice(0, -suffix.length) : message;
}

function headerStrings(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => headerStrings(entry));
  }

  return [];
}

function readHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;

  const record = headers as {
    get?: (headerName: string) => unknown;
  } & Record<string, unknown>;

  const candidates: string[] = [];

  if (typeof record.get === "function") {
    candidates.push(...headerStrings(record.get(name)));
  }

  for (const [key, value] of Object.entries(record)) {
    if (key.toLowerCase() === name) {
      candidates.push(...headerStrings(value));
    }
  }

  return candidates.find((candidate) => TRACE_ID_PATTERN.test(candidate));
}

export function readTraceId(headers: unknown): string | undefined {
  return readHeader(headers, TRACE_ID_HEADER);
}

const isAppError = (error: unknown): error is AppError => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { message?: unknown; raw?: unknown };
  return typeof candidate.message === "string" && "raw" in candidate;
};

const isHtmlResponse = (value: string) => /^\s*<(!doctype|html)/i.test(value);

export function handleError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const body = error.response?.data as Record<string, unknown> | undefined;

    const serverMessage =
      typeof body === "string"
        ? isHtmlResponse(body)
          ? undefined
          : body
        : ((body?.message as string | undefined) ??
          (body?.error as string | undefined));

    const message =
      serverMessage ??
      (error.code === "ECONNABORTED"
        ? "Request timed out. Please try again."
        : !error.response
          ? "Network error. Please check your connection."
          : status === 504
            ? "เซิร์ฟเวอร์ตอบช้าเกินไป กรุณาลองใหม่อีกครั้ง"
            : status && status >= 500
              ? "เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่อีกครั้ง"
              : `Request failed with status ${status}.`);

    const traceId = error.response
      ? readTraceId(error.response.headers)
      : undefined;

    return {
      message: withTraceReference(message, traceId),
      status,
      traceId,
      raw: error,
    };
  }

  if (error instanceof Error) {
    return { message: error.message, raw: error };
  }

  return { message: "An unexpected error occurred.", raw: error };
}

export async function showErrorAlert(error: unknown, title = "เกิดข้อผิดพลาด") {
  const appError = handleError(error);
  const { traceId } = appError;

  dialog.fire({
    title: traceId ? `${title} (รหัสอ้างอิง: ${traceId})` : title,
    description: withoutTraceReference(appError.message, traceId),
    confirmText: "ตกลง",
    confirmVariant: "danger",
    showCancel: false,
    traceId,
  });
}
