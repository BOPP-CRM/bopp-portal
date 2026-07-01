import apiClient from "@/services/api-client";
import type {
  ApproveReceiptRequest,
  CreateManualReceiptRequest,
  CreateManualReceiptResponse,
  MemberLookupResponse,
  ReceiptDetailResponse,
  ReceiptsListParams,
  ReceiptsListResponse,
  RejectReceiptRequest,
  UpdateReceiptRequest,
} from "./types";

const mutationConfig = { skipErrorAlert: true };

export const getReceipts = async (params: ReceiptsListParams = {}) => {
  const res = await apiClient.client.get<ReceiptsListResponse>(
    "/portal/receipts",
    {
      params: {
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        ...(params.state ? { state: params.state } : {}),
        ...(params.user_id ? { user_id: params.user_id } : {}),
        ...(params.search ? { search: params.search } : {}),
      },
    },
  );
  return {
    receipts: res.data.receipts ?? [],
    total: res.data.total ?? 0,
  };
};

export const getReceipt = async (id: number) => {
  const res = await apiClient.client.get<ReceiptDetailResponse>(
    `/portal/receipts/${id}`,
  );
  return res.data.receipt;
};

export const updateReceipt = async (
  id: number,
  payload: UpdateReceiptRequest,
) => {
  const res = await apiClient.client.put<ReceiptDetailResponse>(
    `/portal/receipts/${id}`,
    payload,
    mutationConfig,
  );
  return res.data.receipt;
};

export const approveReceipt = async (
  id: number,
  payload: ApproveReceiptRequest = {},
) => {
  const res = await apiClient.client.post<ReceiptDetailResponse>(
    `/portal/receipts/${id}/approve`,
    payload,
    mutationConfig,
  );
  return res.data.receipt;
};

export const rejectReceipt = async (
  id: number,
  payload: RejectReceiptRequest,
) => {
  const res = await apiClient.client.post<ReceiptDetailResponse>(
    `/portal/receipts/${id}/reject`,
    payload,
    mutationConfig,
  );
  return res.data.receipt;
};

export const lookupReceiptMember = async (query: string) => {
  const res = await apiClient.client.get<MemberLookupResponse>(
    "/portal/receipts/members/lookup",
    {
      params: { q: query },
      ...mutationConfig,
    },
  );
  return res.data.user;
};

export const createManualReceipt = async (
  payload: CreateManualReceiptRequest,
) => {
  const res = await apiClient.client.post<CreateManualReceiptResponse>(
    "/portal/receipts/manual",
    payload,
    mutationConfig,
  );
  return res.data.receipt;
};

export type {
  ApproveReceiptRequest,
  CreateManualReceiptRequest,
  PortalReceipt,
  ReceiptMember,
  ReceiptsListParams,
  ReceiptState,
  RejectReceiptRequest,
  UpdateReceiptRequest,
} from "./types";
