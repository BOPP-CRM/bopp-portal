import apiClient from "@/services/api-client";
import type {
  ZortoutConnectPayload,
  ZortoutMemberSyncActiveResponse,
  ZortoutMemberSyncJobResponse,
  ZortoutMemberSyncUserResponse,
  ZortoutMutationResponse,
  ZortoutStatusResponse,
  ZortoutWebhookLogsParams,
  ZortoutWebhookLogsResponse,
} from "@/services/zortout/types";
import { handleError } from "@/utils/errors";

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

export const startZortoutMemberSync = async (userIds?: number[]) => {
  const res = await apiClient.client.post<ZortoutMemberSyncJobResponse>(
    "/portal/zortout/members/sync",
    userIds && userIds.length > 0 ? { user_ids: userIds } : {},
    mutationConfig,
  );
  return res.data;
};

export const getActiveZortoutMemberSyncJob = async () => {
  try {
    const res = await apiClient.client.get<ZortoutMemberSyncActiveResponse>(
      "/portal/zortout/members/sync/active",
      mutationConfig,
    );
    return res.data;
  } catch (error) {
    const appError = handleError(error);
    // No active job, or endpoint not deployed yet — treat as idle.
    if (appError.status === 404) {
      return { job: false as const };
    }
    throw appError;
  }
};

export const getZortoutMemberSyncJob = async (jobId: number) => {
  const res = await apiClient.client.get<ZortoutMemberSyncJobResponse>(
    `/portal/zortout/members/sync/${jobId}`,
    mutationConfig,
  );
  return res.data;
};

export const syncUserToZortout = async (userId: number) => {
  const res = await apiClient.client.post<ZortoutMemberSyncUserResponse>(
    `/portal/users/${userId}/zortout/sync`,
    {},
    mutationConfig,
  );
  return res.data;
};

export type {
  ZortoutConnectPayload,
  ZortoutMemberSyncJob,
  ZortoutMemberSyncUserResult,
  ZortoutStatus,
  ZortoutWebhookLog,
} from "@/services/zortout/types";
