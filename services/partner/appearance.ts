import apiClient from "@/services/api-client";
import type {
  AppearanceImageTarget,
  PartnerAppearance,
  UpdatePartnerAppearanceRequest,
  UploadAppearanceImageResponse,
} from "@/services/partner/types";

const mutationConfig = { skipErrorAlert: true };

export const getAppearance = async () => {
  const res = await apiClient.client.get<PartnerAppearance>(
    "/portal/appearance",
  );
  return res.data;
};

export const updateAppearance = async (
  payload: UpdatePartnerAppearanceRequest,
) => {
  const res = await apiClient.client.patch<PartnerAppearance>(
    "/portal/appearance",
    payload,
    mutationConfig,
  );
  return res.data;
};

export const uploadAppearanceImage = async (
  target: AppearanceImageTarget,
  imageBase64: string,
) => {
  const res = await apiClient.client.post<UploadAppearanceImageResponse>(
    "/portal/appearance/image",
    { target, image_base64: imageBase64 },
    mutationConfig,
  );
  return res.data;
};

export type {
  AppearanceColorKey,
  AppearanceImageTarget,
  PartnerAppearance,
  UpdatePartnerAppearanceRequest,
  UploadAppearanceImageResponse,
} from "@/services/partner/types";
