"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useReceiptPosMode } from "@/hooks/useReceiptPosMode";

export default function ReceiptPosModeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { posMode, hydrated } = useReceiptPosMode();
  const isActive =
    hydrated && posMode && pathname === "/dashboard/receipts/create";

  useEffect(() => {
    document.documentElement.classList.toggle("receipt-pos-mode", isActive);
    return () => {
      document.documentElement.classList.remove("receipt-pos-mode");
    };
  }, [isActive]);

  return children;
}
