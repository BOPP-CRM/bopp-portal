import apiClient from "@/services/api-client";
import type {
  CurrenciesListResponse,
  CurrencyDetailResponse,
  PortalCurrency,
} from "./types";

export const getCurrencies = async () => {
  const res =
    await apiClient.client.get<CurrenciesListResponse>("/portal/currencies");
  return res.data.currencies ?? [];
};

export const getCurrency = async (id: number) => {
  const res = await apiClient.client.get<CurrencyDetailResponse>(
    `/portal/currencies/${id}`,
  );
  return res.data.currency;
};

export type { PortalCurrency } from "./types";
