export const RECEIPT_POS_MODE_KEY = "crm_receipt_pos_mode";
export const RECEIPT_POS_MODE_EVENT = "receipt-pos-mode-change";

export function readReceiptPosMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(RECEIPT_POS_MODE_KEY) === "true";
}

export function writeReceiptPosMode(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(RECEIPT_POS_MODE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(
    new CustomEvent(RECEIPT_POS_MODE_EVENT, { detail: enabled }),
  );
}
