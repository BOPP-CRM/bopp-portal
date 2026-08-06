"use client";

import {
  AI_SALE_SYNC_CHECKBOX_LABEL,
  AI_SALE_SYNC_DESCRIPTION,
  AI_SALE_SYNC_TITLE,
} from "@/services/openai/types";
import { useEffect, useState } from "react";

type AiSyncConfirmDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  checkboxLabel?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function AiSyncConfirmDialog({
  open,
  title = AI_SALE_SYNC_TITLE,
  description = AI_SALE_SYNC_DESCRIPTION,
  checkboxLabel = AI_SALE_SYNC_CHECKBOX_LABEL,
  confirmText = "ดำเนินการ",
  cancelText = "ยกเลิก",
  loading = false,
  onConfirm,
  onClose,
}: AiSyncConfirmDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmed(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-defualt-text">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-100">{description}</p>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1 size-4 shrink-0 accent-brown-100"
          />
          <span className="text-sm leading-relaxed text-defualt-text">
            {checkboxLabel}
          </span>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-100 hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed || loading}
            className="rounded-xl bg-brown-100 px-4 py-2.5 text-sm font-medium text-white hover:bg-brown-100/90 disabled:opacity-50"
          >
            {loading ? "กำลังดำเนินการ..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useAiSyncGate(openAiConfigured: boolean | null) {
  const requireOpenAiConfigured = (onReady: () => void) => {
    if (openAiConfigured === false) {
      window.location.assign("/dashboard/connections?tab=openai");
      return;
    }
    if (openAiConfigured === true) {
      onReady();
    }
  };

  return { requireOpenAiConfigured };
}
