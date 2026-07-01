import apiClient from "@/services/api-client";
import type {
  CreateRedeemQrcodeRequest,
  PortalRedeemQrcode,
  RedeemQrcodeDetailResponse,
  RedeemQrcodesListParams,
  RedeemQrcodesListResponse,
  UpdateRedeemQrcodeRequest,
} from "./types";

const mutationConfig = { skipErrorAlert: true };

export const getRewardCouponId = (qrcode: PortalRedeemQrcode): number => {
  if (typeof qrcode.reward_coupon_id === "number" && qrcode.reward_coupon_id > 0) {
    return qrcode.reward_coupon_id;
  }
  if (qrcode.reward_coupon && typeof qrcode.reward_coupon === "object") {
    return qrcode.reward_coupon.id;
  }
  return 0;
};

export const getRedeemQrcodes = async (params: RedeemQrcodesListParams = {}) => {
  const res = await apiClient.client.get<RedeemQrcodesListResponse>(
    "/portal/redeem-qrcodes",
    {
      params: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        ...(params.active !== undefined ? { active: params.active } : {}),
      },
    },
  );
  return {
    redeemQrcodes: res.data.redeem_qrcodes ?? [],
    total: res.data.total ?? 0,
  };
};

export const getRedeemQrcode = async (id: number) => {
  const res = await apiClient.client.get<RedeemQrcodeDetailResponse>(
    `/portal/redeem-qrcodes/${id}`,
  );
  return res.data.redeem_qrcode;
};

export const createRedeemQrcode = async (payload: CreateRedeemQrcodeRequest) => {
  const res = await apiClient.client.post<RedeemQrcodeDetailResponse>(
    "/portal/redeem-qrcodes",
    payload,
    mutationConfig,
  );
  return res.data.redeem_qrcode;
};

export const buildRedeemQrcodeUpdatePayload = (
  original: PortalRedeemQrcode,
  next: UpdateRedeemQrcodeRequest,
): UpdateRedeemQrcodeRequest => {
  const payload: UpdateRedeemQrcodeRequest = {};

  if (next.name !== undefined && next.name !== original.name) {
    payload.name = next.name;
  }
  if (next.value !== undefined && next.value !== original.value) {
    payload.value = next.value;
  }
  if (next.type !== undefined && next.type !== original.type) {
    payload.type = next.type;
  }
  if (
    next.currency_id !== undefined &&
    next.currency_id !== (original.currency_id ?? 0)
  ) {
    payload.currency_id = next.currency_id;
  }
  if (
    next.limit_per_user !== undefined &&
    next.limit_per_user !== original.limit_per_user
  ) {
    payload.limit_per_user = next.limit_per_user;
  }
  if (
    next.limit_per_qr !== undefined &&
    next.limit_per_qr !== original.limit_per_qr
  ) {
    payload.limit_per_qr = next.limit_per_qr;
  }
  if (next.expiration_date !== undefined) {
    const originalExpiration = original.expiration_date || "";
    if (next.expiration_date !== originalExpiration) {
      payload.expiration_date = next.expiration_date;
    }
  }
  if (next.reward_coupon_id !== undefined) {
    const originalCouponId = getRewardCouponId(original);
    const nextCouponId = next.reward_coupon_id || 0;
    if (nextCouponId !== originalCouponId) {
      payload.reward_coupon_id = next.reward_coupon_id;
    }
  }

  return payload;
};

export const updateRedeemQrcode = async (
  id: number,
  payload: UpdateRedeemQrcodeRequest,
) => {
  const res = await apiClient.client.put<RedeemQrcodeDetailResponse>(
    `/portal/redeem-qrcodes/${id}`,
    payload,
    mutationConfig,
  );
  return res.data.redeem_qrcode;
};

export type {
  CreateRedeemQrcodeRequest,
  PortalRedeemQrcode,
  RedeemQrcodesListParams,
  UpdateRedeemQrcodeRequest,
} from "./types";
