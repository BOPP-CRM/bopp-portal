export type WarrantyUser = {
  id: number;
  display_name: string;
  line_user_id: string;
  picture_url?: string | false;
  phone?: string | false;
  email?: string | false;
};

export type WarrantyProduct = {
  id: number;
  name: string;
  description: string | false;
  sku: string | false;
  cost_price: number;
  sell_price: number;
  image_url?: string | false;
  active?: boolean;
};

export type WarrantyContributor = {
  id: number;
  name: string;
  sequence?: number;
  active?: boolean;
};

export type WarrantyStatus = {
  id: number;
  code: string;
  label: string;
  sequence?: number;
  color: string | false;
  is_default?: boolean;
  active?: boolean;
};

export type WarrantyComment = {
  id: number;
  body: string;
  author_name: string | false;
  author_id: number | false;
  created_at: string;
};

export type PortalWarranty = {
  id: number;
  serial_number: string;
  receipt_number: string;
  purchase_date: string;
  receipt_image_url: string | false;
  submitted_date: string;
  product: WarrantyProduct;
  contributor: WarrantyContributor;
  status: WarrantyStatus;
  user: WarrantyUser;
  comments?: WarrantyComment[];
};

export type WarrantiesListParams = {
  status_id?: number;
  user_id?: number;
  search?: string;
  limit?: number;
  offset?: number;
};

export type WarrantiesListResponse = {
  warranties: PortalWarranty[];
  total: number;
};

export type WarrantyDetailResponse = {
  warranty: PortalWarranty;
};

export type UpdateWarrantyRequest = {
  status_id: number;
};

export type AddWarrantyCommentRequest = {
  body: string;
};

export type WarrantyCommentResponse = {
  comment: WarrantyComment;
};

export type WarrantyConfigResponse = {
  enabled: boolean;
  products: WarrantyProduct[];
  contributors: WarrantyContributor[];
  statuses: WarrantyStatus[];
};

export type CreateWarrantyProductRequest = {
  name: string;
  description?: string;
  sku?: string;
  cost_price?: number;
  sell_price?: number;
  image_base64?: string;
  active?: boolean;
};

export type UpdateWarrantyProductRequest = Partial<CreateWarrantyProductRequest>;

export type CreateWarrantyContributorRequest = {
  name: string;
  sequence?: number;
  active?: boolean;
};

export type UpdateWarrantyContributorRequest = Partial<CreateWarrantyContributorRequest>;

export type CreateWarrantyStatusRequest = {
  code: string;
  label: string;
  sequence?: number;
  color?: string;
  is_default?: boolean;
  active?: boolean;
};

export type UpdateWarrantyStatusRequest = Partial<CreateWarrantyStatusRequest>;
