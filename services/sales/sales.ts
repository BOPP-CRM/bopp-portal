import apiClient from "@/services/api-client";
import type {
  PortalSale,
  SaleDetailResponse,
  SalesListParams,
  SalesListResponse,
  ZortoutSaleSyncJobResponse,
  ZortoutSaleSyncStatusResponse,
} from "./types";

const mutationConfig = { skipErrorAlert: true };

export const getSales = async (params: SalesListParams = {}) => {
  const res = await apiClient.client.get<SalesListResponse>("/portal/sales", {
    params: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      ...(params.status ? { status: params.status } : {}),
      ...(params.source ? { source: params.source } : {}),
      ...(params.user_id ? { user_id: params.user_id } : {}),
      ...(params.search ? { search: params.search } : {}),
    },
  });
  return {
    sales: res.data.sales ?? [],
    total: res.data.total ?? 0,
  };
};

export const getSale = async (id: number) => {
  const res = await apiClient.client.get<SaleDetailResponse>(
    `/portal/sales/${id}`,
  );
  return res.data.sale;
};

export const getZortoutSaleSyncStatus = async () => {
  const res = await apiClient.client.get<ZortoutSaleSyncStatusResponse>(
    "/portal/sales/sync-zortout/status",
    mutationConfig,
  );
  return res.data;
};

export const startZortoutSaleSync = async () => {
  const res = await apiClient.client.post<ZortoutSaleSyncJobResponse>(
    "/portal/sales/sync-zortout",
    {},
    mutationConfig,
  );
  return res.data;
};

export const getActiveZortoutSaleSyncJob = async () => {
  try {
    const res = await apiClient.client.get<{
      job: ZortoutSaleSyncStatusResponse["active_job"];
    }>("/portal/sales/sync-zortout/active", mutationConfig);
    return res.data;
  } catch (error) {
    return { job: false as const };
  }
};

export const getZortoutSaleSyncJob = async (jobId: number) => {
  const res = await apiClient.client.get<ZortoutSaleSyncJobResponse>(
    `/portal/sales/sync-zortout/${jobId}`,
    mutationConfig,
  );
  return res.data;
};

export type { PortalSale, SaleLine, SaleSource, SaleStatus, ZortoutSaleSyncJob } from "./types";
