"use client";

import { useSyncExternalStore } from "react";
import DialogPopup from "./DialogPopup";
import { closeDialog, getDialogState, subscribeDialog } from "./dialog";

export default function DialogHost() {
  const dialogState = useSyncExternalStore(
    subscribeDialog,
    getDialogState,
    () => null,
  );

  if (!dialogState) return null;

  const { options, open } = dialogState;

  return (
    <DialogPopup
      icon={options.icon ? options.icon : undefined}
      open={open}
      title={options.title}
      description={options.description ?? ""}
      cancelText={options.cancelText}
      confirmText={options.confirmText}
      confirmVariant={options.confirmVariant}
      showCancel={options.showCancel}
      onCancel={options.onCancel ?? (() => closeDialog(false))}
      onConfirm={options.onConfirm ?? (() => closeDialog(true))}
    />
  );
}
