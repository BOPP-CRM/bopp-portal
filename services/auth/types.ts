import type { PortalRole } from "@/services/team/types";

export type { PortalRole } from "@/services/team/types";

export type PortalMeUser = {
  name: string;
  email: string;
  role: PortalRole;
};

export type PortalMePartner = {
  name: string;
  slug: string;
  logo_url: string | null;
  manual_receipt_require_image?: boolean;
  warranty_enabled?: boolean;
};

export type PortalMeResponse = {
  user: PortalMeUser;
  partner: PortalMePartner;
};

export type UpdateMeRequest = {
  name?: string;
  email?: string;
  current_password?: string;
  password?: string;
};

export type PortalLoginRequest = {
  domain: string;
  email: string;
  password: string;
};

export type PortalLoginResponse = {
  token: string;
  expires_at: string;
  user: PortalMeUser;
  partner: PortalMePartner;
};

export type ApiKeyStatus = {
  has_api_key: boolean;
  enabled: boolean;
};

export type ApiKeyStatusResponse = {
  api_key: ApiKeyStatus;
};

export type ApiKeyWithSecret = ApiKeyStatus & {
  key?: string;
};

export type ApiKeyMutationResponse = {
  api_key: ApiKeyWithSecret;
  message?: string;
};

export type ApiKeyUsage = {
  month: string;
  limit: number | null;
  used: number;
  remaining: number | null;
  unlimited: boolean;
};

export type ApiKeyUsageResponse = {
  usage: ApiKeyUsage;
  history: ApiKeyUsage[];
  partner: {
    id: number;
    name: string;
    slug: string;
  };
};

export type {
  AcceptInviteRequest,
  PublicInvite,
  PublicInviteResponse,
} from "@/services/team/types";
