import apiClient from "@/services/api-client";
import type {
  LazadaConnectStartResponse,
  LazadaMutationResponse,
  LazadaStatusResponse,
} from "@/services/lazada/types";

const mutationConfig = { skipErrorAlert: true };

export const getLazadaStatus = async () => {
  const res =
    await apiClient.client.get<LazadaStatusResponse>("/portal/lazada");
  return res.data;
};

export const startLazadaConnect = async () => {
  const res = await apiClient.client.post<LazadaConnectStartResponse>(
    "/portal/lazada/connect/start",
    {},
    mutationConfig,
  );
  return res.data;
};

export const disableLazada = async () => {
  const res = await apiClient.client.post<LazadaMutationResponse>(
    "/portal/lazada/disable",
    {},
    mutationConfig,
  );
  return res.data;
};

export type { LazadaStatus } from "@/services/lazada/types";
