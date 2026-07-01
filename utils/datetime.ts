const THAI_TIMEZONE = "Asia/Bangkok";
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function parseApiDate(
  value: string | false | null | undefined,
): Date | null {
  if (!value) return null;

  const normalized = value.trim().replace(" ", "T");
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized);
  const date = new Date(hasTimezone ? normalized : `${normalized}Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateInTimezone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

export function formatDateTime(value: string | false | null | undefined) {
  const date = parseApiDate(value);
  if (!date) return "-";

  const { year, month, day, hour, minute } = formatDateInTimezone(
    date,
    THAI_TIMEZONE,
  );
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function toDatetimeLocalValue(value: string | false | null | undefined) {
  const date = parseApiDate(value);
  if (!date) return "";

  const { year, month, day, hour, minute } = formatDateInTimezone(
    date,
    THAI_TIMEZONE,
  );
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function toApiDateTime(value: string) {
  if (!value) return "";

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - BANGKOK_OFFSET_MS;
  const date = new Date(utcMs);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

export function getThaiDateInputValue(date = new Date()) {
  const { year, month, day } = formatDateInTimezone(date, THAI_TIMEZONE);
  return `${year}-${month}-${day}`;
}

export function toApiDateStartFromDateInput(date: string) {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcMs = Date.UTC(year, month - 1, day, 0, 0, 0) - BANGKOK_OFFSET_MS;
  const parsed = new Date(utcMs);

  if (Number.isNaN(parsed.getTime())) return "";

  return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())} ${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}:${pad(parsed.getUTCSeconds())}`;
}

export function toApiDateEndFromDateInput(date: string) {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcMs = Date.UTC(year, month - 1, day, 23, 59, 59) - BANGKOK_OFFSET_MS;
  const parsed = new Date(utcMs);

  if (Number.isNaN(parsed.getTime())) return "";

  return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())} ${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}:${pad(parsed.getUTCSeconds())}`;
}

export function formatChartPeriodLabel(period: string) {
  const dateOnly = period.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}`;

  const parsed = parseApiDate(period);
  if (!parsed) return period;

  const { day, month } = formatDateInTimezone(parsed, THAI_TIMEZONE);
  return `${day}/${month}`;
}

export function isApiDateAfterNow(value: string | false | null | undefined) {
  const date = parseApiDate(value);
  if (!date) return true;
  return date.getTime() > Date.now();
}
