"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Copy } from "lucide-react";
import Button from "./Button";
import type { ButtonVariant } from "./dialog";

interface DialogPopupProps {
  icon?: ReactNode;
  open: boolean;
  title: string;
  description: ReactNode;
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: ButtonVariant;
  onCancel: () => void;
  onConfirm: () => void;
  showCancel?: boolean;
  traceId?: string;
}

export const DIALOG_EXIT_ANIMATION_MS = 250;

function CopyTraceIdButton({ traceId }: { traceId: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const onCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(traceId);
      } else {
        const field = document.createElement("textarea");
        field.value = traceId;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.left = "-9999px";
        document.body.appendChild(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) {
          setStatus("failed");
          return;
        }
      }
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  };

  const label =
    status === "copied"
      ? "คัดลอกแล้ว"
      : status === "failed"
        ? "ไม่สามารถคัดลอกได้"
        : "คัดลอกรหัสอ้างอิง";

  return (
    <div className="mt-3 flex justify-center">
      <button
        type="button"
        onClick={() => {
          void onCopy();
        }}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-brown-100 hover:bg-gray-10"
        aria-label="คัดลอกรหัสอ้างอิง"
      >
        <Copy className="size-3.5" aria-hidden="true" />
        <span aria-live="polite">{label}</span>
      </button>
    </div>
  );
}

export default function DialogPopup({
  icon,
  open,
  title,
  description,
  cancelText = "ยกเลิก",
  confirmText = "ยืนยัน",
  confirmVariant = "danger",
  showCancel = true,
  traceId,
  onCancel,
  onConfirm,
}: DialogPopupProps) {
  const [isMounted, setIsMounted] = useState(open);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      setIsClosing(false);
      return;
    }

    if (!isMounted) return;

    setIsClosing(true);
    const timer = setTimeout(() => {
      setIsMounted(false);
      setIsClosing(false);
    }, DIALOG_EXIT_ANIMATION_MS);

    return () => clearTimeout(timer);
  }, [open, isMounted]);

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center bg-gray-300/50 ${
        isClosing
          ? " opacity-0 transition-opacity duration-250 ease-in"
          : " animate-dialog-backdrop-in"
      }`}
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          traceId
            ? "w-[min(28rem,calc(100vw-2rem))]"
            : "min-w-[363px]"
        }${
          isClosing
            ? " opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : " animate-dialog-pop-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {icon && (
          <div
            className={`flex justify-center items-center${
              isClosing
                ? " opacity-0 scale-75 transition-all duration-200 ease-in"
                : " animate-dialog-icon-in"
            }`}
          >
            {icon}
          </div>
        )}
        <div
          id="dialog-title"
          className="text-defualt-text font-bold text-xl text-center mt-4 wrap-break-word"
        >
          {title}
        </div>
        <div className="text-gray-100 mt-2 text-center text-md wrap-break-word">
          {description}
        </div>
        {traceId ? (
          <CopyTraceIdButton key={traceId} traceId={traceId} />
        ) : null}
        <div className="mt-4 flex flex-row gap-4">
          {showCancel && (
            <Button variant="tertiary" text={cancelText} onClick={onCancel} />
          )}
          <Button
            variant={confirmVariant}
            text={confirmText}
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  );
}
