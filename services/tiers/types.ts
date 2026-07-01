export type TierRewardType = "point" | "coupon";

export type PortalTierReward = {
  id: number;
  reward_type: TierRewardType;
  point_value?: number;
  point_currency_id?: number;
  point_currency_name?: string;
  coupon_id?: number;
  coupon_name?: string;
  coupon_value?: number;
  coupon_image_url?: string | false;
  sequence?: number;
};

export type TierRewardInput = {
  id?: number;
  reward_type: TierRewardType;
  point_value?: number;
  point_currency_id?: number;
  coupon_id?: number;
  sequence?: number;
};

export type PortalTier = {
  id: number;
  code: string;
  name: string;
  color: string;
  image_url: string | false;
  convert_points: number;
  min_spending: number;
  max_spending: number;
  is_show_in_ui: boolean;
  rewards?: PortalTierReward[];
};

export type TiersListResponse = {
  tiers: PortalTier[];
};

export type TierDetailResponse = {
  tier: PortalTier;
};

export type TierRewardsResponse = {
  rewards?: PortalTierReward[];
};

export type JoinRewardsResponse = {
  rewards?: PortalTierReward[];
  join_rewards?: PortalTierReward[];
};

export type CreateTierRequest = {
  name: string;
  code: string;
  min_spending: number;
  max_spending: number;
  convert_points: number;
  color: string;
  is_show_in_ui: boolean;
  rewards?: TierRewardInput[];
};

export type UpdateTierRequest = Partial<CreateTierRequest> & {
  icon?: string | false;
};

export type UpdateTierRewardsRequest = {
  rewards: TierRewardInput[];
};

export type UpdateJoinRewardsRequest = {
  join_rewards: TierRewardInput[];
};
