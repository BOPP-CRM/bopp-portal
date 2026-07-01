export function displayValue(value: string | false | null | undefined) {
  if (value === false || value === null || value === undefined || value === "") {
    return "-";
  }
  return value;
}

const LINE_USER_ID_PATTERN = /U[0-9a-f]{32}/i;

export function normalizeMemberLookupQuery(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  const lineUserId = trimmed.match(LINE_USER_ID_PATTERN)?.[0];
  if (lineUserId) return lineUserId;

  return trimmed;
}

type UserAddress = {
  province?: string;
  district?: string;
  sub_district?: string;
  postal_code?: string;
};

export function formatUserAddress(address: string | false | null | undefined) {
  if (address === false || address === null || address === undefined || address === "") {
    return "-";
  }

  try {
    const parsed = JSON.parse(address) as UserAddress;
    const parts = [
      parsed.sub_district,
      parsed.district,
      parsed.province,
      parsed.postal_code,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(" ") : "-";
  } catch {
    return address;
  }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

export function formatReviewedBy(
  reviewedBy: { name: string } | string | false | null | undefined,
) {
  if (!reviewedBy) return "-";
  if (typeof reviewedBy === "object") return reviewedBy.name;
  return reviewedBy;
}

export function getDefaultPointBalance(
  points: { currency: { is_default: boolean }; balance: number }[],
) {
  const defaultPoint = points.find((point) => point.currency.is_default);
  return defaultPoint?.balance ?? points[0]?.balance ?? 0;
}

export function getDefaultCurrency(
  points: { currency: { is_default: boolean; id: number; name: string } }[],
) {
  return (
    points.find((point) => point.currency.is_default)?.currency ??
    points[0]?.currency ??
    null
  );
}

const POINT_SOURCE_LABELS: Record<string, string> = {
  admin: "แอดมิน",
  redeem_qr: "แลก QR",
  receipt: "ใบเสร็จ",
  member_reward: "รางวัลสมาชิก",
  redeem: "แลกคูปอง",
  point_redeem: "แลกด้วย Point",
};

const POINT_TYPE_LABELS: Record<string, string> = {
  earn: "เพิ่ม",
  burn: "ลด",
  spend: "ลด",
};

export function isPointEarn(type: string) {
  return type === "earn";
}

export function toApiPointType(type: "earn" | "spend" | "burn") {
  return type === "earn" ? "earn" : "burn";
}

export function matchesPointTypeFilter(
  pointType: string,
  filter: "all" | "earn" | "spend",
) {
  if (filter === "all") return true;
  if (filter === "earn") return pointType === "earn";
  return pointType === "burn" || pointType === "spend";
}

export function formatPointSource(kind: string) {
  return POINT_SOURCE_LABELS[kind] ?? kind;
}

export function formatPointType(type: string) {
  return POINT_TYPE_LABELS[type] ?? type;
}
