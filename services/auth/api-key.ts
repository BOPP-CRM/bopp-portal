import apiClient from "@/services/api-client";
import type {
  ApiKeyMutationResponse,
  ApiKeyStatusResponse,
  ApiKeyUsageResponse,
} from "./types";

const mutationConfig = { skipErrorAlert: true };

export const getApiKeyStatus = async () => {
  const res = await apiClient.client.get<ApiKeyStatusResponse>(
    "/portal/api-key",
  );
  return res.data;
};

export const getApiKeyUsage = async () => {
  const res = await apiClient.client.get<ApiKeyUsageResponse>(
    "/portal/api-key/usage",
  );
  return res.data;
};

export const generateApiKey = async () => {
  const res = await apiClient.client.post<ApiKeyMutationResponse>(
    "/portal/api-key/generate",
    {},
    mutationConfig,
  );
  return res.data;
};

export const rotateApiKey = async () => {
  const res = await apiClient.client.post<ApiKeyMutationResponse>(
    "/portal/api-key/rotate",
    {},
    mutationConfig,
  );
  return res.data;
};

export const enableApiKey = async () => {
  const res = await apiClient.client.post<ApiKeyStatusResponse>(
    "/portal/api-key/enable",
    {},
    mutationConfig,
  );
  return res.data;
};

export const disableApiKey = async () => {
  const res = await apiClient.client.post<ApiKeyStatusResponse>(
    "/portal/api-key/disable",
    {},
    mutationConfig,
  );
  return res.data;
};
