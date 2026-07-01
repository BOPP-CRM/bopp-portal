import apiClient from "@/services/api-client";
import type {
  AddWarrantyCommentRequest,
  CreateWarrantyContributorRequest,
  CreateWarrantyProductRequest,
  CreateWarrantyStatusRequest,
  UpdateWarrantyContributorRequest,
  UpdateWarrantyProductRequest,
  UpdateWarrantyRequest,
  UpdateWarrantyStatusRequest,
  WarrantyCommentResponse,
  WarrantyConfigResponse,
  WarrantyContributor,
  WarrantyDetailResponse,
  WarrantyProduct,
  WarrantiesListParams,
  WarrantiesListResponse,
  WarrantyStatus,
} from "./types";

const mutationConfig = { skipErrorAlert: true };

export const getWarrantyConfig = async () => {
  const res = await apiClient.client.get<WarrantyConfigResponse>(
    "/portal/warranty/config",
  );
  return res.data;
};

export const getWarranties = async (params: WarrantiesListParams = {}) => {
  const res = await apiClient.client.get<WarrantiesListResponse>(
    "/portal/warranties",
    {
      params: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        ...(params.status_id ? { status_id: params.status_id } : {}),
        ...(params.user_id ? { user_id: params.user_id } : {}),
        ...(params.search ? { search: params.search } : {}),
      },
    },
  );
  return {
    warranties: res.data.warranties ?? [],
    total: res.data.total ?? 0,
  };
};

export const getWarranty = async (id: number) => {
  const res = await apiClient.client.get<WarrantyDetailResponse>(
    `/portal/warranties/${id}`,
  );
  return res.data.warranty;
};

export const updateWarrantyStatus = async (
  id: number,
  payload: UpdateWarrantyRequest,
) => {
  const res = await apiClient.client.put<WarrantyDetailResponse>(
    `/portal/warranties/${id}`,
    payload,
    mutationConfig,
  );
  return res.data.warranty;
};

export const addWarrantyComment = async (
  id: number,
  payload: AddWarrantyCommentRequest,
) => {
  const res = await apiClient.client.post<WarrantyCommentResponse>(
    `/portal/warranties/${id}/comments`,
    payload,
    mutationConfig,
  );
  return res.data.comment;
};

export const getWarrantyProducts = async (includeInactive = false) => {
  const res = await apiClient.client.get<{ products: WarrantyProduct[] }>(
    "/portal/warranty-products",
    {
      params: includeInactive ? { include_inactive: "true" } : {},
    },
  );
  return res.data.products ?? [];
};

export const createWarrantyProduct = async (
  payload: CreateWarrantyProductRequest,
) => {
  const res = await apiClient.client.post<{ product: WarrantyProduct }>(
    "/portal/warranty-products",
    payload,
    mutationConfig,
  );
  return res.data.product;
};

export const updateWarrantyProduct = async (
  id: number,
  payload: UpdateWarrantyProductRequest,
) => {
  const res = await apiClient.client.put<{ product: WarrantyProduct }>(
    `/portal/warranty-products/${id}`,
    payload,
    mutationConfig,
  );
  return res.data.product;
};

export const deleteWarrantyProduct = async (id: number) => {
  await apiClient.client.delete(`/portal/warranty-products/${id}`, mutationConfig);
};

export const getWarrantyContributors = async (includeInactive = false) => {
  const res = await apiClient.client.get<{ contributors: WarrantyContributor[] }>(
    "/portal/warranty-contributors",
    {
      params: includeInactive ? { include_inactive: "true" } : {},
    },
  );
  return res.data.contributors ?? [];
};

export const createWarrantyContributor = async (
  payload: CreateWarrantyContributorRequest,
) => {
  const res = await apiClient.client.post<{ contributor: WarrantyContributor }>(
    "/portal/warranty-contributors",
    payload,
    mutationConfig,
  );
  return res.data.contributor;
};

export const updateWarrantyContributor = async (
  id: number,
  payload: UpdateWarrantyContributorRequest,
) => {
  const res = await apiClient.client.put<{ contributor: WarrantyContributor }>(
    `/portal/warranty-contributors/${id}`,
    payload,
    mutationConfig,
  );
  return res.data.contributor;
};

export const deleteWarrantyContributor = async (id: number) => {
  await apiClient.client.delete(
    `/portal/warranty-contributors/${id}`,
    mutationConfig,
  );
};

export const getWarrantyStatuses = async (includeInactive = false) => {
  const res = await apiClient.client.get<{ statuses: WarrantyStatus[] }>(
    "/portal/warranty-statuses",
    {
      params: includeInactive ? { include_inactive: "true" } : {},
    },
  );
  return res.data.statuses ?? [];
};

export const createWarrantyStatus = async (
  payload: CreateWarrantyStatusRequest,
) => {
  const res = await apiClient.client.post<{ status: WarrantyStatus }>(
    "/portal/warranty-statuses",
    payload,
    mutationConfig,
  );
  return res.data.status;
};

export const updateWarrantyStatusConfig = async (
  id: number,
  payload: UpdateWarrantyStatusRequest,
) => {
  const res = await apiClient.client.put<{ status: WarrantyStatus }>(
    `/portal/warranty-statuses/${id}`,
    payload,
    mutationConfig,
  );
  return res.data.status;
};

export const deleteWarrantyStatus = async (id: number) => {
  await apiClient.client.delete(`/portal/warranty-statuses/${id}`, mutationConfig);
};

export type {
  PortalWarranty,
  WarrantyComment,
  WarrantyContributor,
  WarrantyProduct,
  WarrantyStatus,
} from "./types";
