export type DashboardGranularity = "day" | "week" | "month";

export type DashboardParams = {
  date_from?: string;
  date_to?: string;
  granularity?: DashboardGranularity;
};

export type MembersByTierItem = {
  tier_id: number;
  tier_code: string;
  tier_name: string;
  count: number;
  color?: string | false;
};

export type PeriodCountItem = {
  period: string;
  count: number;
};

export type HourCountItem = {
  hour: number;
  count: number;
};

export type ReceiptAmountItem = {
  period: string;
  amount: number;
  count?: number;
};

export type CouponByNameItem = {
  coupon_id: number;
  coupon_name: string;
  redeemed_count: number;
  used_count: number;
  expired_count: number;
  total_count: number;
};

export type PointsSeriesItem = {
  period: string;
  earned: number;
  used: number;
};

export type DashboardPoints = {
  currency: {
    id: number;
    name: string;
    code?: string;
  };
  series: PointsSeriesItem[];
};

export type DashboardResponse = {
  date_from: string;
  date_to: string;
  granularity: DashboardGranularity;
  members_by_tier: MembersByTierItem[];
  user_registrations: PeriodCountItem[];
  user_registrations_by_hour: HourCountItem[];
  receipt_amounts: ReceiptAmountItem[];
  coupons_by_name: CouponByNameItem[];
  points: DashboardPoints;
};
