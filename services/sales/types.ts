export type SaleStatus = "paid" | "void";
export type SaleSource = "zortout" | "omisell" | "receipt" | "manual" | "other";

export type SaleMember = {
  id: number;
  display_name: string;
  line_user_id: string;
  email: string | false;
  phone: string | false;
  picture_url: string | false;
  tier: {
    id: number;
    code: string;
    name: string;
  } | false;
};

export type SaleLine = {
  id: number;
  external_product_id: number | false;
  sku: string | false;
  name: string;
  quantity: number;
  price_per_unit: number;
  discount: number;
  total_price: number;
};

export type PortalSale = {
  id: number;
  source: SaleSource;
  source_label: string;
  external_id: string;
  order_number: string | false;
  status: SaleStatus;
  order_date: string | false;
  discount: number;
  vat_amount: number;
  amount: number;
  payment_amount: number;
  payment_status: string | false;
  customer_name: string | false;
  customer_phone: string | false;
  customer_email: string | false;
  last_sync_at: string | false;
  receipt_redeem_id: number | false;
  ai_generated: boolean;
  ai_generated_at: string | false;
  can_regenerate_ai: boolean;
  user: SaleMember | false;
  lines?: SaleLine[];
};

export type SalesListParams = {
  status?: SaleStatus;
  source?: SaleSource;
  user_id?: number;
  search?: string;
  limit?: number;
  offset?: number;
};

export type SalesListResponse = {
  sales: PortalSale[];
  total: number;
};

export type SaleDetailResponse = {
  sale: PortalSale;
};

export const SALE_SOURCE_LABELS: Record<SaleSource, string> = {
  zortout: "Zortout",
  omisell: "Omisell",
  receipt: "ใบเสร็จ (AI)",
  manual: "Manual",
  other: "Other",
};

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  paid: "ชำระแล้ว",
  void: "ยกเลิก",
};

export type ZortoutSaleSyncJob = {
  id: number;
  state: "pending" | "running" | "done" | "failed";
  total: number;
  processed: number;
  synced: number;
  skipped: number;
  failed: number;
  last_error: string | false;
  started_at: string | false;
  finished_at: string | false;
  current_order: {
    id: number;
    order_number: string | false;
    zortout_order_id: number;
  } | false;
};

export type ZortoutSaleSyncStatusResponse = {
  missing_count: number;
  zortout_configured: boolean;
  active_job: ZortoutSaleSyncJob | false;
};

export type ZortoutSaleSyncJobResponse = {
  job: ZortoutSaleSyncJob;
  message?: string;
};

export type ReceiptSaleSyncJob = {
  id: number;
  state: "pending" | "running" | "done" | "failed";
  total: number;
  processed: number;
  synced: number;
  skipped: number;
  failed: number;
  last_error: string | false;
  started_at: string | false;
  finished_at: string | false;
  current_receipt: {
    id: number;
    receipt_number: string;
  } | false;
};

export type ReceiptSaleSyncStatusResponse = {
  missing_count: number;
  openai_configured: boolean;
  active_job: ReceiptSaleSyncJob | false;
};

export type ReceiptSaleSyncJobResponse = {
  job: ReceiptSaleSyncJob;
  message?: string;
};

export const SALE_SOURCE_STYLES: Record<
  SaleSource,
  { badge: string; dot: string }
> = {
  zortout: {
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  omisell: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  receipt: {
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  manual: {
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  other: {
    badge: "bg-gray-50 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
};
