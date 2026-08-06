import apiClient from "@/services/api-client";
import type {
  OpenAiMutationResponse,
  OpenAiStatusResponse,
} from "./types";

const mutationConfig = { skipErrorAlert: true };

export const getOpenAiStatus = async () => {
  const res = await apiClient.client.get<OpenAiStatusResponse>(
    "/portal/openai",
    mutationConfig,
  );
  return res.data.openai;
};

export const saveOpenAiApiKey = async (apiKey: string) => {
  const res = await apiClient.client.post<OpenAiMutationResponse>(
    "/portal/openai",
    { api_key: apiKey },
    mutationConfig,
  );
  return res.data;
};

export const removeOpenAiApiKey = async () => {
  const res = await apiClient.client.post<OpenAiMutationResponse>(
    "/portal/openai/remove",
    {},
    mutationConfig,
  );
  return res.data;
};

export type { OpenAiStatus } from "./types";
