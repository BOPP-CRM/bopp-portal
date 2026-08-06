"use client";

import {
  AI_SALE_SYNC_CHECKBOX_LABEL,
  AI_SALE_SYNC_DESCRIPTION,
  AI_SALE_SYNC_TITLE,
} from "@/services/openai/types";
import { useEffect, useState } from "react";

const OPENAI_LOGO = "/openai.png";

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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-300/50 p-4 animate-dialog-backdrop-in"
      onClick={loading ? undefined : onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-sync-confirm-title"
        className="w-full max-w-lg rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] animate-dialog-pop-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <img
            src={OPENAI_LOGO}
            alt="OpenAI"
            className="size-14 shrink-0 rounded-2xl bg-white object-contain shadow-sm"
          />
          <h2
            id="ai-sync-confirm-title"
            className="mt-4 text-xl font-bold text-defualt-text"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-100">
            {description}
          </p>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-10 p-4 text-left">
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

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full cursor-pointer rounded-4xl bg-gray-10 px-4 py-2.5 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!confirmed || loading}
            className="w-full cursor-pointer rounded-4xl bg-brown-100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
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
