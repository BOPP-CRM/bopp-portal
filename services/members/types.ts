import type { PortalCurrency } from "@/services/currencies/types";

export type { PortalCurrency };

export type PortalUserPoint = {
  currency: PortalCurrency;
  balance: number;
};

export type PortalTier = {
  code: string;
  name: string;
};

export type PortalUser = {
  id: number;
  display_name: string;
  picture_url: string | false;
  line_user_id: string;
  email: string | false;
  is_email_verified: boolean;
  phone: string | false;
  is_phone_verified: boolean;
  birth_date: string | false;
  gender: string | false;
  address: string | false;
  tier: PortalTier;
  points: PortalUserPoint[];
  create_date: string;
};

export type UsersListResponse = {
  users: PortalUser[];
  total: number;
};

export type UserDetailResponse = {
  user: PortalUser;
};

export type AdjustPointRequest = {
  value: number;
  type: "earn" | "burn";
  note: string;
  currency_id: number;
};

export type AdjustPointResponse = {
  point: {
    id: number;
    name: string;
    value: number;
    type: string;
    admin_note: string;
    given_date: string;
    expiration_date: string | false;
    currency: PortalCurrency;
  };
};

export type UsersListParams = {
  search?: string;
  limit?: number;
  offset?: number;
};

export type PointSourceKind =
  | "admin"
  | "redeem_qr"
  | "receipt"
  | "member_reward"
  | "redeem";

export type PortalPointRecord = {
  id: number;
  name: string;
  value: number;
  type: "earn" | "burn" | string;
  admin_note: string | false;
  given_date: string;
  expiration_date: string | false;
  currency: PortalCurrency;
  source: {
    kind: PointSourceKind | string;
    note?: string;
    point_id?: number;
  };
};

export type UserPointsListResponse = {
  points: PortalPointRecord[];
  total: number;
};

export type UserPointsListParams = {
  currency_id?: number;
  type?: "earn" | "burn";
  limit?: number;
  offset?: number;
};

export type PortalUserCoupon = {
  id: number;
  name: string;
  code: string;
  value: number;
  admin_note: string | false;
  acquired_date: string;
  expiration_date: string | false;
  is_used: boolean;
  used_date: string | false;
  coupon: {
    id: number;
    name: string;
    term_and_condition: string | false;
    image_url: string | false;
  };
  currency: PortalCurrency;
  point: {
    id: number;
    value: number;
    type: string;
  } | false;
  source: {
    kind: PointSourceKind | string;
    point_id?: number;
  };
};

export type UserCouponsListResponse = {
  coupons: PortalUserCoupon[];
  total: number;
};

export type UserCouponsListParams = {
  is_used?: boolean;
  limit?: number;
  offset?: number;
};

export type UserCouponDetailResponse = {
  coupon: PortalUserCoupon;
};
