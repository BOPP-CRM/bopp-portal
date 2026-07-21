export type OmisellStatus = {
  enabled: boolean;
  configured: boolean;
  webhook_url: string | null;
  authorization: string | null;
  api_key: string | null;
  api_secret: string | null;
  seller_id: string | null;
  country: string | null;
};

export type OmisellStatusResponse = {
  omisell: OmisellStatus;
};

export type OmisellMutationResponse = {
  omisell: OmisellStatus;
  message?: string;
};

export type OmisellConfigPayload = {
  api_key: string;
  api_secret: string;
  seller_id: string;
  country: string;
};

export type OmisellWebhookLogMember = {
  id: number;
  display_name: string;
  phone: string | false;
  email: string | false;
};

export type OmisellWebhookLog = {
  id: number;
  received_at: string;
  http_status: number;
  result_status: string | false;
  message: string | false;
  warning: string | false;
  order_number: string | false;
  amount: number;
  payment_status: string | false;
  customer_name: string | false;
  customer_phone: string | false;
  customer_email: string | false;
  points_awarded: boolean;
  reward_points: number;
  member: OmisellWebhookLogMember | false;
};

export type OmisellWebhookLogsResponse = {
  logs: OmisellWebhookLog[];
  total: number;
  limit: number;
  offset: number;
};

export type OmisellWebhookLogsParams = {
  limit?: number;
  offset?: number;
};
