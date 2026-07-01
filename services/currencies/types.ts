export type PortalCurrency = {
  id: number;
  name: string;
  is_default: boolean;
  is_total_spending: boolean;
};

export type CurrenciesListResponse = {
  currencies: PortalCurrency[];
};

export type CurrencyDetailResponse = {
  currency: PortalCurrency;
};
