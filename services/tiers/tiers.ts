import apiClient from "@/services/api-client";
import type {
  CreateTierRequest,
  JoinRewardsResponse,
  PortalTier,
  PortalTierReward,
  TierDetailResponse,
  TierRewardInput,
  TierRewardsResponse,
  TiersListResponse,
  UpdateTierRequest,
} from "./types";

const tierMutationConfig = { skipErrorAlert: true };

const extractRewards = (data: {
  rewards?: PortalTierReward[];
  join_rewards?: PortalTierReward[];
}) => data.rewards ?? data.join_rewards ?? [];

export const updateTier = async (id: number, payload: UpdateTierRequest) => {
  const res = await apiClient.client.put<TierDetailResponse>(
    `/portal/tiers/${id}`,
    payload,
    tierMutationConfig,
  );
  return res.data.tier;
};

export const updateTierRewards = async (
  id: number,
  rewards: TierRewardInput[],
) => {
  const res = await apiClient.client.put<TierRewardsResponse>(
    `/portal/tiers/${id}/rewards`,
    { rewards },
    tierMutationConfig,
  );
  return extractRewards(res.data);
};

export const updateJoinRewards = async (rewards: TierRewardInput[]) => {
  const res = await apiClient.client.put<JoinRewardsResponse>(
    "/portal/tiers/join-rewards",
    { join_rewards: rewards },
    tierMutationConfig,
  );
  return extractRewards(res.data);
};

export const getTiers = async () => {
  const res = await apiClient.client.get<TiersListResponse>("/portal/tiers");
  return res.data.tiers;
};

export const getTier = async (id: number) => {
  const res = await apiClient.client.get<TierDetailResponse>(
    `/portal/tiers/${id}`,
  );
  return res.data.tier;
};

export const getTierRewards = async (id: number) => {
  const res = await apiClient.client.get<TierRewardsResponse>(
    `/portal/tiers/${id}/rewards`,
  );
  return extractRewards(res.data);
};

export const getJoinRewards = async () => {
  const res = await apiClient.client.get<JoinRewardsResponse>(
    "/portal/tiers/join-rewards",
  );
  return extractRewards(res.data);
};

export const createTier = async (payload: CreateTierRequest) => {
  const res = await apiClient.client.post<TierDetailResponse>(
    "/portal/tiers",
    payload,
    tierMutationConfig,
  );
  return res.data.tier;
};

export const buildTierUpdatePayload = (
  original: PortalTier,
  next: Omit<CreateTierRequest, "rewards">,
): UpdateTierRequest => {
  const payload: UpdateTierRequest = {};

  if (next.name !== original.name) payload.name = next.name;
  if (next.code !== original.code) payload.code = next.code;
  if (next.color !== original.color) payload.color = next.color;
  if (next.min_spending !== original.min_spending) {
    payload.min_spending = next.min_spending;
  }
  if (next.max_spending !== original.max_spending) {
    payload.max_spending = next.max_spending;
  }
  if (next.convert_points !== original.convert_points) {
    payload.convert_points = next.convert_points;
  }
  if (next.is_show_in_ui !== original.is_show_in_ui) {
    payload.is_show_in_ui = next.is_show_in_ui;
  }

  return payload;
};

export const rewardsToInputs = (
  rewards: PortalTierReward[] | null | undefined,
): TierRewardInput[] =>
  (rewards ?? []).map((reward, index) => {
    const base: TierRewardInput = {
      ...(reward.id ? { id: reward.id } : {}),
      reward_type: reward.reward_type,
      sequence: reward.sequence ?? (index + 1) * 10,
    };

    if (reward.reward_type === "point") {
      return {
        ...base,
        point_value: reward.point_value,
        point_currency_id: reward.point_currency_id,
      };
    }

    return {
      ...base,
      coupon_id: reward.coupon_id,
    };
  });

export const rewardInputsEqual = (
  left: TierRewardInput[],
  right: TierRewardInput[],
) => JSON.stringify(left) === JSON.stringify(right);

export type {
  CreateTierRequest,
  PortalTier,
  PortalTierReward,
  TierRewardInput,
  UpdateTierRequest,
} from "./types";
