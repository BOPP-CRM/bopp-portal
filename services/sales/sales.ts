import apiClient from "@/services/api-client";
import type {
  PortalSale,
  SaleDetailResponse,
  SalesListParams,
  SalesListResponse,
  ZortoutSaleSyncJobResponse,
  ZortoutSaleSyncStatusResponse,
  ReceiptSaleSyncJobResponse,
  ReceiptSaleSyncStatusResponse,
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

export const getReceiptSaleSyncStatus = async () => {
  const res = await apiClient.client.get<ReceiptSaleSyncStatusResponse>(
    "/portal/sales/sync-receipts/status",
    mutationConfig,
  );
  return res.data;
};

export const startReceiptSaleSync = async (aiConfirmed = true) => {
  const res = await apiClient.client.post<ReceiptSaleSyncJobResponse>(
    "/portal/sales/sync-receipts",
    { ai_confirmed: aiConfirmed },
    mutationConfig,
  );
  return res.data;
};

export const getActiveReceiptSaleSyncJob = async () => {
  try {
    const res = await apiClient.client.get<{
      job: ReceiptSaleSyncStatusResponse["active_job"];
    }>("/portal/sales/sync-receipts/active", mutationConfig);
    return res.data;
  } catch {
    return { job: false as const };
  }
};

export const getReceiptSaleSyncJob = async (jobId: number) => {
  const res = await apiClient.client.get<ReceiptSaleSyncJobResponse>(
    `/portal/sales/sync-receipts/${jobId}`,
    mutationConfig,
  );
  return res.data;
};

export const regenerateSaleWithAi = async (saleId: number, aiConfirmed = true) => {
  const res = await apiClient.client.post<SaleDetailResponse & { message?: string }>(
    `/portal/sales/${saleId}/regenerate-ai`,
    { ai_confirmed: aiConfirmed },
    mutationConfig,
  );
  return res.data;
};

export type { PortalSale, SaleLine, SaleSource, SaleStatus, ZortoutSaleSyncJob, ReceiptSaleSyncJob } from "./types";
