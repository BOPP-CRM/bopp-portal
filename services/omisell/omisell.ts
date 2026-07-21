import apiClient from "@/services/api-client";
import type {
  OmisellConfigPayload,
  OmisellMutationResponse,
  OmisellStatusResponse,
  OmisellWebhookLogsParams,
  OmisellWebhookLogsResponse,
} from "@/services/omisell/types";

const mutationConfig = { skipErrorAlert: true };

export const getOmisellStatus = async () => {
  const res =
    await apiClient.client.get<OmisellStatusResponse>("/portal/omisell");
  return res.data;
};

export const enableOmisell = async (payload: OmisellConfigPayload) => {
  const res = await apiClient.client.post<OmisellMutationResponse>(
    "/portal/omisell/enable",
    payload,
    mutationConfig,
  );
  return res.data;
};

export const disableOmisell = async () => {
  const res = await apiClient.client.post<OmisellMutationResponse>(
    "/portal/omisell/disable",
    {},
    mutationConfig,
  );
  return res.data;
};

export const regenerateOmisellSecret = async () => {
  const res = await apiClient.client.post<OmisellMutationResponse>(
    "/portal/omisell/regenerate-secret",
    {},
    mutationConfig,
  );
  return res.data;
};

export const getOmisellWebhookLogs = async (
  params: OmisellWebhookLogsParams = {},
) => {
  const res = await apiClient.client.get<OmisellWebhookLogsResponse>(
    "/portal/omisell/logs",
    {
      params: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      },
    },
  );
  return res.data;
};

export type {
  OmisellStatus,
  OmisellWebhookLog,
} from "@/services/omisell/types";
