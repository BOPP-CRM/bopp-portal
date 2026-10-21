export type RuleGender = "any" | "M" | "F" | "O";
export type RuleTrigger = "manual" | "scheduled";
export type RuleVerifiedFilter = "any" | "yes" | "no";
export type RuleMessageType = "text" | "flex";

export type PortalDistributionRule = {
  id: number;
  name: string;
  active: boolean;
  coupon: {
    id: number;
    name: string;
    available_code_count: number;
  };
  trigger: RuleTrigger;
  schedule_interval_days: number;
  last_run_at: string | false;
  last_error: string | false;
  seg_gender: RuleGender;
  seg_age_min: number;
  seg_age_max: number;
  seg_tiers: { id: number; name: string }[];
  seg_signup_from: string | false;
  seg_signup_to: string | false;
  seg_email_verified: RuleVerifiedFilter;
  seg_phone_verified: RuleVerifiedFilter;
  notify_line: boolean;
  message_type: RuleMessageType;
  message_text: string | false;
  flex_payload: string | false;
  granted_count: number;
  has_active_job: boolean;
  create_date: string;
};

export type DistributionRulePayload = {
  name: string;
  active: boolean;
  coupon_id: number;
  trigger: RuleTrigger;
  schedule_interval_days: number;
  seg_gender: RuleGender;
  seg_age_min: number;
  seg_age_max: number;
  seg_tier_ids: number[];
  seg_signup_from: string;
  seg_signup_to: string;
  seg_email_verified: RuleVerifiedFilter;
  seg_phone_verified: RuleVerifiedFilter;
  notify_line: boolean;
  message_type: RuleMessageType;
  message_text: string;
  flex_payload: string;
};

export type DistributionPreviewRequest = Partial<DistributionRulePayload> & {
  rule_id?: number;
};

export type DistributionPreviewResponse = {
  count: number;
  sample: {
    id: number;
    display_name: string;
    gender: "M" | "F" | "O" | false;
    tier: string | false;
  }[];
  coupon_pool: { available: number; sufficient: boolean } | false;
};

export type DistributionRunState =
  | "draft"
  | "pending"
  | "running"
  | "done"
  | "failed"
  | "cancelled";

export type DistributionRun = {
  id: number;
  name: string;
  state: DistributionRunState;
  source: string;
  total_recipients: number;
  processed: number;
  coupon_granted: number;
  line_sent: number;
  line_failed: number;
  preflight_error: string | false;
  last_error: string | false;
  started_at: string | false;
  finished_at: string | false;
  create_date: string;
};

export type DistributionRunsResponse = {
  runs: DistributionRun[];
  total: number;
};

export type DistributionRunResult = {
  broadcast: DistributionRun | false;
  message: string | null;
  rule: PortalDistributionRule;
};
