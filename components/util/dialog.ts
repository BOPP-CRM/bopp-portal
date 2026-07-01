import type { ReactNode } from "react";
import { DIALOG_EXIT_ANIMATION_MS } from "./DialogPopup";

export type ButtonVariant = "primary" | "tertiary" | "danger" | "outlined";

export interface DialogFireOptions {
  title: string;
  description?: ReactNode;
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: ButtonVariant;
  icon?: ReactNode;
  showCancel?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
}

export interface DialogResult {
  isConfirmed: boolean;
}

type DialogState = {
  icon?: ReactNode;
  options: DialogFireOptions;
  open: boolean;
  resolve: (result: DialogResult) => void;
};

let state: DialogState | null = null;
let version = 0;
let isClosing = false;

const listeners = new Set<() => void>();

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

export function subscribeDialog(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDialogState() {
  return state;
}

export function getDialogVersion() {
  return version;
}

function closeDialog(isConfirmed: boolean) {
  if (!state || isClosing) return;

  isClosing = true;
  const { resolve } = state;
  state = { ...state, open: false };
  emit();

  setTimeout(() => {
    resolve({ isConfirmed });
    state = null;
    isClosing = false;
    emit();
  }, DIALOG_EXIT_ANIMATION_MS);
}

function fire(options: DialogFireOptions): Promise<DialogResult> {
  return new Promise((resolve) => {
    state = {
      options,
      open: true,
      resolve,
    };
    isClosing = false;
    emit();
  });
}

const dialog = {
  fire,
};

export default dialog;

export { closeDialog };
