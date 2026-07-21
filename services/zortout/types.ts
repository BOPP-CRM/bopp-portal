export type ZortoutStatus = {
  enabled: boolean;
  configured: boolean;
  webhook_synced: boolean;
  api_credentials_configured: boolean;
  store_name: string | null;
  webhook_base_url: string | null;
  addorder_url: string | null;
  updateorder_url: string | null;
  deleteorder_url: string | null;
  key1: string | null;
  key2: string | null;
  key3: string | null;
};

export type ZortoutConnectPayload = {
  storename: string;
  apikey: string;
  apisecret: string;
};

export type ZortoutWebhookEvent = {
  field: string;
  method: string;
  description: string;
};

export const ZORTOUT_WEBHOOK_EVENTS: ZortoutWebhookEvent[] = [
  {
    field: "addorderurl",
    method: "ADDORDER",
    description: "สร้างออเดอร์ใหม่ — ให้คะแนนเมื่อชำระเงินแล้ว (Paid)",
  },
  {
    field: "updateorderurl",
    method: "UPDATEORDER",
    description:
      "แก้ไขออเดอร์หรือเปลี่ยนสถานะ — ใช้ลบคะแนนเมื่อ void หรือยกเลิกการชำระเงิน",
  },
];

export type ZortoutStatusResponse = {
  zortout: ZortoutStatus;
};

export type ZortoutMutationResponse = {
  zortout: ZortoutStatus;
  message?: string;
};

export type ZortoutWebhookLogMember = {
  id: number;
  display_name: string;
  phone: string | false;
  email: string | false;
};

export type ZortoutWebhookLog = {
  id: number;
  received_at: string;
  method: string | false;
  http_status: number;
  result_status: string | false;
  message: string | false;
  warning: string | false;
  zortout_order_id: number | false;
  order_number: string | false;
  amount: number;
  payment_status: string | false;
  order_status: string | false;
  customer_name: string | false;
  customer_phone: string | false;
  customer_email: string | false;
  points_awarded: boolean;
  points_revoked?: boolean;
  reward_points: number;
  member: ZortoutWebhookLogMember | false;
};

export type ZortoutWebhookLogsResponse = {
  logs: ZortoutWebhookLog[];
  total: number;
  limit: number;
  offset: number;
};

export type ZortoutWebhookLogsParams = {
  limit?: number;
  offset?: number;
};

export type ZortoutMemberSyncJobUser = {
  id: number;
  display_name: string;
};

export type ZortoutMemberSyncJob = {
  id: number;
  state: "pending" | "running" | "done" | "failed" | "cancelled";
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  last_error: string | false;
  started_at: string | false;
  finished_at: string | false;
  current_user: ZortoutMemberSyncJobUser | false;
};

export type ZortoutMemberSyncJobResponse = {
  job: ZortoutMemberSyncJob;
  message?: string;
};

export type ZortoutMemberSyncActiveResponse = {
  job: ZortoutMemberSyncJob | false;
};

export type ZortoutMemberSyncUserResult = {
  contact_id: number | false;
  synced_at: string | false;
  sync_status: "pending" | "synced" | "failed" | "skipped" | false;
  sync_error: string | false;
};

export type ZortoutMemberSyncUserResponse = {
  result?: {
    action: "created" | "updated";
    contact_id: number;
  };
  user: ZortoutMemberSyncUserResult;
  message?: string;
};
