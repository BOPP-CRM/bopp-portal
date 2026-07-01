import apiClient, {
  clearToken,
  getToken,
  redirectToLogin,
  setToken,
} from "@/services/api-client";
import type {
  AcceptInviteRequest,
  PublicInviteResponse,
} from "@/services/team/types";
import type {
  PortalLoginRequest,
  PortalLoginResponse,
  PortalMeResponse,
  UpdateMeRequest,
} from "./types";

const mutationConfig = { skipErrorAlert: true };

export const login = async (payload: PortalLoginRequest) => {
  const res = await apiClient.client.post<PortalLoginResponse>(
    "/portal/login",
    payload,
    mutationConfig,
  );
  setToken(res.data.token);
  return res.data;
};

export const getMe = async () => {
  const token = getToken();
  if (!token) {
    return Promise.reject({
      message: "Not authenticated",
      status: 401,
      raw: null,
    });
  }

  const res = await apiClient.client.get<PortalMeResponse>("/portal/me");
  return res.data;
};

export const updateMe = async (payload: UpdateMeRequest) => {
  const res = await apiClient.client.put<PortalMeResponse>(
    "/portal/me",
    payload,
    mutationConfig,
  );
  return res.data;
};

export const getPublicInvite = async (token: string) => {
  const res = await apiClient.client.get<PublicInviteResponse>(
    `/portal/invite/${token}`,
    mutationConfig,
  );
  return res.data.invite;
};

export const acceptInvite = async (
  token: string,
  payload: AcceptInviteRequest,
) => {
  const res = await apiClient.client.post<PortalLoginResponse>(
    `/portal/invite/${token}/accept`,
    payload,
    mutationConfig,
  );
  setToken(res.data.token);
  return res.data;
};

export const logout = () => {
  clearToken();
  redirectToLogin();
};

export type {
  PortalLoginRequest,
  PortalLoginResponse,
  PortalMeResponse,
  UpdateMeRequest,
} from "./types";
