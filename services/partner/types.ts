export type PartnerLine = {
  liff_id: string;
};

export type PartnerUi = {
  banner: string | false;
  background_color: string;
  background_white_color: string;
  primary_color: string;
  secondary_color: string;
  surface_color: string;
  text_color: string;
  text_white_color: string;
  text_gray_color: string;
  text_success_color: string;
  text_error_color: string;
  button_color: string;
  button_text_color: string;
  welcome_title: string;
  crm_required_phone: boolean;
  crm_required_email: boolean;
  ui_custom_fields: boolean | false;
  warranty_enabled?: boolean;
};

export type PartnerAd = {
  id: number;
  title: string;
  action: string | false;
  image_url: string | false;
  message: string;
  start_date: string;
  end_date: string;
};

export type PartnerTier = {
  code: string;
  name: string;
  min_spending: number;
  max_spending: number;
  color: string;
  image_url: string | false;
};

export type PartnerDetail = {
  name: string;
  slug: string;
  description: string | false;
  active: boolean;
  logo_url: string | false;
  line: PartnerLine;
  ui: PartnerUi;
  ads: PartnerAd[];
  tier: PartnerTier[];
};
