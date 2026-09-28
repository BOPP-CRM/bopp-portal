export type LazadaStatus = {
  enabled: boolean;
  configured: boolean;
  seller_id: string | null;
  country: string | null;
  access_token_expires_at: string | null;
  token_masked: string | null;
};

export type LazadaStatusResponse = { lazada: LazadaStatus };
export type LazadaMutationResponse = { lazada: LazadaStatus };
export type LazadaConnectStartResponse = { authorize_url: string };
