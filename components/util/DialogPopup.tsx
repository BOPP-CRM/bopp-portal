"use client";

import { useEffect, useState, type ReactNode } from "react";
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
}

export const DIALOG_EXIT_ANIMATION_MS = 250;

export default function DialogPopup({
  icon,
  open,
  title,
  description,
  cancelText = "ยกเลิก",
  confirmText = "ยืนยัน",
  confirmVariant = "danger",
  showCancel = true,
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
        className={`rounded-4xl bg-white p-6 min-w-[363px] shadow-[0_4px_10px_0_rgba(0,0,0,0.1)]${
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
          className="text-defualt-text font-bold text-xl text-center mt-4"
        >
          {title}
        </div>
        <div className="text-gray-100 mt-2 text-md text-center">
          {description}
        </div>
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
