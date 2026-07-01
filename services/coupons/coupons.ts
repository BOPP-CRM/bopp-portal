import apiClient from "@/services/api-client";
import {
  downloadBlob,
  getFilenameFromContentDisposition,
} from "@/utils/file";
import type {
  AddCouponCodesRequest,
  AddCouponCodesResponse,
  CouponDetailResponse,
  CouponRedemptionsParams,
  CouponRedemptionsResponse,
  CouponsListResponse,
  CreateCouponRequest,
  PortalCoupon,
  UpdateCouponRequest,
} from "./types";

const couponMutationConfig = { skipErrorAlert: true };

export const getCoupons = async () => {
  const res = await apiClient.client.get<CouponsListResponse>("/portal/coupons");
  return res.data.coupons ?? [];
};

export const getCoupon = async (id: number) => {
  const res = await apiClient.client.get<CouponDetailResponse>(
    `/portal/coupons/${id}`,
  );
  return res.data.coupon;
};

export const getCouponRedemptions = async (
  id: number,
  params: CouponRedemptionsParams = {},
) => {
  const res = await apiClient.client.get<CouponRedemptionsResponse>(
    `/portal/coupons/${id}/redemptions`,
    {
      params: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        ...(params.is_used !== undefined ? { is_used: params.is_used } : {}),
      },
    },
  );
  return res.data;
};

export const createCoupon = async (payload: CreateCouponRequest) => {
  const res = await apiClient.client.post<CouponDetailResponse>(
    "/portal/coupons",
    payload,
    couponMutationConfig,
  );
  return res.data.coupon;
};

export const buildCouponUpdatePayload = (
  original: PortalCoupon,
  next: UpdateCouponRequest,
): UpdateCouponRequest => {
  const payload: UpdateCouponRequest = {};

  if (next.name !== undefined && next.name !== original.name) {
    payload.name = next.name;
  }
  if (next.value !== undefined && next.value !== original.value) {
    payload.value = next.value;
  }
  if (
    next.start_time !== undefined &&
    next.start_time !== (original.start_time || "")
  ) {
    payload.start_time = next.start_time;
  }
  if (next.end_time !== undefined) {
    const originalEnd = original.end_time || false;
    const nextEnd = next.end_time || false;
    if (nextEnd !== originalEnd) payload.end_time = next.end_time;
  }
  if (
    next.code_expiry_interval !== undefined &&
    next.code_expiry_interval !== (original.code_expiry_interval || 0)
  ) {
    payload.code_expiry_interval = next.code_expiry_interval;
  }
  if (
    next.term_and_condition !== undefined &&
    next.term_and_condition !== (original.term_and_condition || "")
  ) {
    payload.term_and_condition = next.term_and_condition;
  }
  if (
    next.is_show_in_ui !== undefined &&
    next.is_show_in_ui !== original.is_show_in_ui
  ) {
    payload.is_show_in_ui = next.is_show_in_ui;
  }
  if (
    next.max_redeem_per_user !== undefined &&
    next.max_redeem_per_user !== original.max_redeem_per_user
  ) {
    payload.max_redeem_per_user = next.max_redeem_per_user;
  }
  if (next.image_base64 !== undefined) {
    payload.image_base64 = next.image_base64;
  } else if (next.image !== undefined) {
    payload.image = next.image;
  }

  return payload;
};

export const updateCoupon = async (id: number, payload: UpdateCouponRequest) => {
  const res = await apiClient.client.put<CouponDetailResponse>(
    `/portal/coupons/${id}`,
    payload,
    couponMutationConfig,
  );
  return res.data.coupon;
};

export const addCouponCodes = async (
  id: number,
  payload: AddCouponCodesRequest,
) => {
  const res = await apiClient.client.post<AddCouponCodesResponse>(
    `/portal/coupons/${id}/codes`,
    payload,
    couponMutationConfig,
  );
  return res.data;
};

export const exportCouponCodes = async (id: number, couponName: string) => {
  const res = await apiClient.client.get<Blob>(
    `/portal/coupons/${id}/codes/export`,
    {
      responseType: "blob",
      ...couponMutationConfig,
    },
  );

  const filename = getFilenameFromContentDisposition(
    res.headers["content-disposition"],
    `coupon_${id}_codes.csv`,
  );
  downloadBlob(res.data, filename || `coupon_${couponName}_codes.csv`);
};

export const downloadCouponCodesImportTemplate = async () => {
  const res = await apiClient.client.get<Blob>(
    "/portal/coupons/codes/import-template",
    {
      responseType: "blob",
      ...couponMutationConfig,
    },
  );

  const filename = getFilenameFromContentDisposition(
    res.headers["content-disposition"],
    "coupon_code_import_template.csv",
  );
  downloadBlob(res.data, filename);
};

export type {
  AddCouponCodesRequest,
  AddCouponCodesResponse,
  CouponRedemption,
  CouponRedemptionSummary,
  CouponRedemptionsParams,
  CreateCouponRequest,
  PortalCoupon,
  UpdateCouponRequest,
} from "./types";
