export type PortalRole = "admin" | "operation";

export type PortalTeamUser = {
  id: number;
  name: string;
  email: string;
  role: PortalRole;
  active: boolean;
  create_date: string;
};

export type TeamUsersListParams = {
  search?: string;
  active?: boolean;
  limit?: number;
  offset?: number;
};

export type TeamUsersListResponse = {
  team_users: PortalTeamUser[];
  total: number;
};

export type TeamUserDetailResponse = {
  team_user: PortalTeamUser;
};

export type CreateTeamUserRequest = {
  name: string;
  email: string;
  password: string;
  role: PortalRole;
};

export type UpdateTeamUserRequest = {
  name?: string;
  role?: PortalRole;
  active?: boolean;
  password?: string;
};

export type InviteState = "pending" | "accepted" | "cancelled" | "expired";

export type PortalTeamInviteUser = {
  id: number;
  name: string;
  email: string;
};

export type PortalTeamInvite = {
  id: number;
  email: string;
  name: string;
  state: InviteState;
  token: string;
  invite_url: string;
  expires_at: string;
  invited_by: PortalTeamInviteUser;
};

export type TeamInvitesListParams = {
  state?: InviteState | "all";
  limit?: number;
  offset?: number;
};

export type TeamInvitesListResponse = {
  invites: PortalTeamInvite[];
  total: number;
};

export type TeamInviteDetailResponse = {
  invite: PortalTeamInvite;
};

export type CreateTeamInviteRequest = {
  email: string;
  name: string;
  role: PortalRole;
};

export type PublicInvitePartner = {
  name: string;
  slug: string;
  logo_url: string | null;
};

export type PublicInvite = {
  email: string;
  name: string;
  expires_at: string;
  partner: PublicInvitePartner;
};

export type PublicInviteResponse = {
  invite: PublicInvite;
};

export type AcceptInviteRequest = {
  password: string;
  name: string;
};
