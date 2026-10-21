import apiClient from "@/services/api-client";
import type {
  DistributionPreviewRequest,
  DistributionPreviewResponse,
  DistributionRulePayload,
  DistributionRunResult,
  DistributionRunsResponse,
  PortalDistributionRule,
} from "./types";

const BASE_PATH = "/portal/coupon-distribution-rules";
const mutationConfig = { skipErrorAlert: true };

export const getDistributionRules = async () => {
  const res = await apiClient.client.get<{ rules: PortalDistributionRule[] }>(
    BASE_PATH,
  );
  return res.data.rules ?? [];
};

export const createDistributionRule = async (
  payload: DistributionRulePayload,
) => {
  const res = await apiClient.client.post<{ rule: PortalDistributionRule }>(
    BASE_PATH,
    payload,
    mutationConfig,
  );
  return res.data.rule;
};

export const updateDistributionRule = async (
  id: number,
  payload: Partial<DistributionRulePayload>,
) => {
  const res = await apiClient.client.put<{ rule: PortalDistributionRule }>(
    `${BASE_PATH}/${id}`,
    payload,
    mutationConfig,
  );
  return res.data.rule;
};

export const deleteDistributionRule = async (id: number) => {
  await apiClient.client.delete(`${BASE_PATH}/${id}`, mutationConfig);
};

export const previewDistribution = async (
  payload: DistributionPreviewRequest,
) => {
  const res = await apiClient.client.post<DistributionPreviewResponse>(
    `${BASE_PATH}/preview`,
    payload,
    mutationConfig,
  );
  return res.data;
};

export const runDistributionRule = async (id: number) => {
  const res = await apiClient.client.post<DistributionRunResult>(
    `${BASE_PATH}/${id}/run`,
    {},
    mutationConfig,
  );
  return res.data;
};

export const getDistributionRuns = async (
  id: number,
  params: { limit?: number; offset?: number } = {},
) => {
  const res = await apiClient.client.get<DistributionRunsResponse>(
    `${BASE_PATH}/${id}/runs`,
    { params: { limit: params.limit ?? 20, offset: params.offset ?? 0 } },
  );
  return res.data;
};
