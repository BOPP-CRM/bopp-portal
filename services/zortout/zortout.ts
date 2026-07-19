import apiClient from "@/services/api-client";
import type {
  ZortoutConnectPayload,
  ZortoutMutationResponse,
  ZortoutStatusResponse,
  ZortoutWebhookLogsParams,
  ZortoutWebhookLogsResponse,
} from "@/services/zortout/types";

const mutationConfig = { skipErrorAlert: true };

export const getZortoutStatus = async () => {
  const res = await apiClient.client.get<ZortoutStatusResponse>(
    "/portal/zortout",
  );
  return res.data;
};

export const enableZortout = async () => {
  const res = await apiClient.client.post<ZortoutMutationResponse>(
    "/portal/zortout/enable",
    {},
    mutationConfig,
  );
  return res.data;
};

export const connectZortout = async (payload: ZortoutConnectPayload) => {
  const res = await apiClient.client.post<ZortoutMutationResponse>(
    "/portal/zortout/connect",
    payload,
    mutationConfig,
  );
  return res.data;
};

export const syncZortoutWebhook = async (
  payload: Partial<ZortoutConnectPayload> = {},
) => {
  const res = await apiClient.client.post<ZortoutMutationResponse>(
    "/portal/zortout/sync-webhook",
    payload,
    mutationConfig,
  );
  return res.data;
};

export const disableZortout = async () => {
  const res = await apiClient.client.post<ZortoutMutationResponse>(
    "/portal/zortout/disable",
    {},
    mutationConfig,
  );
  return res.data;
};

export const regenerateZortoutKeys = async () => {
  const res = await apiClient.client.post<ZortoutMutationResponse>(
    "/portal/zortout/regenerate-keys",
    {},
    mutationConfig,
  );
  return res.data;
};

export const getZortoutWebhookLogs = async (params: ZortoutWebhookLogsParams = {}) => {
  const res = await apiClient.client.get<ZortoutWebhookLogsResponse>(
    "/portal/zortout/logs",
    {
      params: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    },
  );
  return res.data;
};

export type { ZortoutConnectPayload, ZortoutStatus, ZortoutWebhookLog } from "@/services/zortout/types";
