export type RedeemQrcodeType = "earn" | "spend";

export type RedeemQrcodeRewardCoupon = {
  id: number;
  name: string;
  image_url: string | false;
  value: number;
};

export type PortalRedeemQrcode = {
  id: number;
  name: string;
  code: string;
  value: number;
  type: RedeemQrcodeType;
  currency_id?: number;
  currency_name?: string;
  limit_per_user: number;
  limit_per_qr: number;
  expiration_date: string | false;
  redeem_url: string;
  qr_code_url: string;
  reward_coupon_id?: number | false;
  reward_coupon?: RedeemQrcodeRewardCoupon | false;
  active?: boolean;
  redeemed_count?: number;
};

export type RedeemQrcodesListParams = {
  active?: boolean;
  limit?: number;
  offset?: number;
};

export type RedeemQrcodesListResponse = {
  redeem_qrcodes: PortalRedeemQrcode[];
  total: number;
};

export type RedeemQrcodeDetailResponse = {
  redeem_qrcode: PortalRedeemQrcode;
};

export type CreateRedeemQrcodeRequest = {
  name: string;
  value: number;
  type: RedeemQrcodeType;
  currency_id?: number;
  limit_per_user: number;
  limit_per_qr: number;
  expiration_date: string;
  reward_coupon_id?: number | false;
};

export type UpdateRedeemQrcodeRequest = Partial<CreateRedeemQrcodeRequest>;
