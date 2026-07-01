import apiClient from "@/services/api-client";
import type {
  AdjustPointRequest,
  AdjustPointResponse,
  UserCouponDetailResponse,
  UserCouponsListParams,
  UserCouponsListResponse,
  UserDetailResponse,
  UserPointsListParams,
  UserPointsListResponse,
  UsersListParams,
  UsersListResponse,
} from "./types";

export const getUsers = async (params: UsersListParams = {}) => {
  const res = await apiClient.client.get<UsersListResponse>("/portal/users", {
    params: {
      search: params.search ?? "",
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });
  return res.data;
};

export const getUser = async (id: number) => {
  const res = await apiClient.client.get<UserDetailResponse>(
    `/portal/users/${id}`,
  );
  return res.data.user;
};

export const adjustUserPoint = async (
  id: number,
  payload: AdjustPointRequest,
) => {
  const res = await apiClient.client.post<AdjustPointResponse>(
    `/portal/users/${id}/point`,
    payload,
  );
  return res.data;
};

export const getUserPoints = async (
  id: number,
  query: UserPointsListParams = {},
) => {
  const requestParams: Record<string, string | number> = {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
  };

  if (query.currency_id !== undefined) {
    requestParams.currency_id = query.currency_id;
  }
  if (query.type !== undefined) {
    requestParams.type = query.type;
  }

  const res = await apiClient.client.get<UserPointsListResponse>(
    `/portal/users/${id}/points`,
    {
      params: requestParams,
    },
  );
  return res.data;
};

export const getUserCoupons = async (
  id: number,
  params: UserCouponsListParams = {},
) => {
  const res = await apiClient.client.get<UserCouponsListResponse>(
    `/portal/users/${id}/coupons`,
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

export const getUserCoupon = async (userId: number, couponId: number) => {
  const res = await apiClient.client.get<UserCouponDetailResponse>(
    `/portal/users/${userId}/coupons/${couponId}`,
  );
  return res.data.coupon;
};

export type {
  AdjustPointRequest,
  PortalPointRecord,
  PortalUser,
  PortalUserCoupon,
  PortalUserPoint,
  UserCouponsListParams,
  UserPointsListParams,
  UsersListParams,
} from "./types";
