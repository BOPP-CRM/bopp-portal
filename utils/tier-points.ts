import type { PortalTier } from "@/services/tiers/types";

const DAY_MULTIPLIER_FIELDS = [
  "point_multiplier_mon",
  "point_multiplier_tue",
  "point_multiplier_wed",
  "point_multiplier_thu",
  "point_multiplier_fri",
  "point_multiplier_sat",
  "point_multiplier_sun",
] as const;

const THAI_DAY_LABELS = [
  "จันทร์",
  "อังคาร",
  "พุธ",
  "พฤหัส",
  "ศุกร์",
  "เสาร์",
  "อาทิตย์",
] as const;

export type PointMultiplierChannel = "receipt" | "zortout" | "omisell";

type DayMultiplierTier = Partial<
  Pick<
    PortalTier,
    | (typeof DAY_MULTIPLIER_FIELDS)[number]
    | "point_multiplier_apply_receipt"
    | "point_multiplier_apply_zortout"
    | "point_multiplier_apply_omisell"
  >
>;

const CHANNEL_APPLY_FIELDS: Record<
  PointMultiplierChannel,
  keyof DayMultiplierTier
> = {
  receipt: "point_multiplier_apply_receipt",
  zortout: "point_multiplier_apply_zortout",
  omisell: "point_multiplier_apply_omisell",
};

/** Monday = 0 … Sunday = 6, using Asia/Bangkok (matches Odoo). */
export function getThaiWeekdayIndex(date = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[weekday] ?? 0;
}

export function getThaiWeekdayLabel(date = new Date()): string {
  return THAI_DAY_LABELS[getThaiWeekdayIndex(date)];
}

export function appliesDayPointMultiplier(
  tier: DayMultiplierTier | null | undefined,
  channel?: PointMultiplierChannel,
): boolean {
  if (!tier || !channel) return true;
  const field = CHANNEL_APPLY_FIELDS[channel];
  const value = tier[field];
  return typeof value === "boolean" ? value : true;
}

export function getDayPointMultiplier(
  tier: DayMultiplierTier | null | undefined,
  date = new Date(),
  channel?: PointMultiplierChannel,
): number {
  if (!tier) return 1;
  if (!appliesDayPointMultiplier(tier, channel)) return 1;
  const field = DAY_MULTIPLIER_FIELDS[getThaiWeekdayIndex(date)];
  const value = tier[field];
  if (typeof value !== "number" || Number.isNaN(value)) return 1;
  return value;
}

/** Lower effective rate = more points (convert_points / multiplier). */
export function getEffectiveConvertPoints(
  convertPoints: number,
  multiplier: number,
): number {
  if (convertPoints <= 0 || multiplier <= 0) return 0;
  return convertPoints / multiplier;
}

export function calcRewardPoints(amount: number, convertPoints: number) {
  if (!convertPoints || amount <= 0) return 0;
  return Math.floor(amount / convertPoints);
}
