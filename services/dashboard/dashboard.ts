import apiClient from "@/services/api-client";
import type { DashboardParams, DashboardResponse } from "./types";

export const getDashboard = async (params: DashboardParams = {}) => {
  const res = await apiClient.client.get<DashboardResponse>(
    "/portal/dashboard",
    {
      params: {
        ...(params.date_from ? { date_from: params.date_from } : {}),
        ...(params.date_to ? { date_to: params.date_to } : {}),
        ...(params.granularity ? { granularity: params.granularity } : {}),
      },
    },
  );
  return res.data;
};

export type {
  DashboardGranularity,
  DashboardParams,
  DashboardResponse,
} from "./types";
