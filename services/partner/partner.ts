import apiClient from "@/services/api-client";
import type { PartnerDetail } from "@/services/partner/types";

export const getPartner = async (slug: string) => {
  const res = await apiClient.client.get<PartnerDetail>(`/partner/${slug}`);
  return res.data;
};

export type { PartnerDetail } from "@/services/partner/types";
