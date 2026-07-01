export type CouponCodeSource = "generate" | "import";

export type CouponRedemptionSummary = {
  total_redemptions: number;
  used_count: number;
  unused_count: number;
  unique_users: number;
};

export type PortalCoupon = {
  id: number;
  name: string;
  image_url: string | false;
  value: number;
  currency_id: number;
  currency_name: string;
  code_source: CouponCodeSource;
  prefix_code: string | false;
  random_range: number | false;
  suffix_code: string | false;
  start_time: string | false;
  end_time: string | false;
  code_expiry_interval: number | false;
  term_and_condition: string | false;
  total_code_count: number;
  available_code_count: number;
  redeemed_count: number;
  used_code_count: number;
  is_show_in_ui: boolean;
  max_redeem_per_user: number;
  max_code_batch_size: number;
  redemption_summary?: CouponRedemptionSummary;
};

export type CouponRedemptionUser = {
  id: number;
  display_name: string;
  line_user_id: string;
  email: string | false;
  phone: string | false;
  picture_url: string | false;
};

export type CouponRedemption = {
  id: number;
  code: string;
  value: number;
  acquired_date: string;
  expiration_date: string | false;
  is_used: boolean;
  used_date: string | false;
  user: CouponRedemptionUser;
  source: {
    kind: string;
    point_id?: number;
  };
};

export type CouponRedemptionsResponse = {
  coupon: { id: number; name: string };
  summary: CouponRedemptionSummary;
  redemptions: CouponRedemption[];
  total: number;
};

export type CouponRedemptionsParams = {
  is_used?: boolean;
  limit?: number;
  offset?: number;
};

export type CouponsListResponse = {
  coupons: PortalCoupon[];
};

export type CouponDetailResponse = {
  coupon: PortalCoupon;
};

export type CreateCouponGenerateRequest = {
  name: string;
  currency_id: number;
  value: number;
  code_source: "generate";
  code_quantity: number;
  random_range: number;
  prefix_code?: string;
  suffix_code?: string;
  start_time: string;
  end_time?: string;
  code_expiry_interval?: number;
  term_and_condition?: string;
  is_show_in_ui?: boolean;
  max_redeem_per_user?: number;
  image?: string;
  image_base64?: string;
};

export type CreateCouponImportRequest = {
  name: string;
  currency_id: number;
  value: number;
  code_source: "import";
  import_file: string;
  import_filename: string;
  start_time: string;
  end_time?: string;
  code_expiry_interval?: number;
  term_and_condition?: string;
  is_show_in_ui?: boolean;
  max_redeem_per_user?: number;
  image?: string;
  image_base64?: string;
};

export type CreateCouponRequest =
  | CreateCouponGenerateRequest
  | CreateCouponImportRequest;

export type UpdateCouponRequest = Partial<{
  name: string;
  value: number;
  start_time: string;
  end_time: string | false;
  code_expiry_interval: number;
  term_and_condition: string;
  is_show_in_ui: boolean;
  max_redeem_per_user: number;
  image: string;
  image_base64: string;
}>;

export type AddCouponCodesGenerateRequest = {
  add_source: "generate";
  code_quantity: number;
  random_range: number;
  prefix_code?: string;
  suffix_code?: string;
};

export type AddCouponCodesImportRequest = {
  add_source: "import";
  import_file: string;
  import_filename: string;
};

export type AddCouponCodesRequest =
  | AddCouponCodesGenerateRequest
  | AddCouponCodesImportRequest;

export type AddCouponCodesResponse = {
  coupon: PortalCoupon;
  added_code_count: number;
};
