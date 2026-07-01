"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readReceiptPosMode,
  RECEIPT_POS_MODE_EVENT,
  writeReceiptPosMode,
} from "@/utils/receipt-pos-mode";

export function useReceiptPosMode() {
  const [posMode, setPosModeState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPosModeState(readReceiptPosMode());
    setHydrated(true);

    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setPosModeState(Boolean(customEvent.detail));
    };

    window.addEventListener(RECEIPT_POS_MODE_EVENT, handleChange);
    return () => window.removeEventListener(RECEIPT_POS_MODE_EVENT, handleChange);
  }, []);

  const setPosMode = useCallback((enabled: boolean) => {
    setPosModeState(enabled);
    writeReceiptPosMode(enabled);
  }, []);

  const togglePosMode = useCallback(() => {
    setPosMode(!posMode);
  }, [posMode, setPosMode]);

  return { posMode, setPosMode, togglePosMode, hydrated };
}
