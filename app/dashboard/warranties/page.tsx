"use client";

import { useApp } from "@/providers/app-provider";
import WarrantiesPage from "@/components/warranties/WarrantiesPage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { me, authStatus } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    if (!me?.partner.warranty_enabled) {
      router.replace("/dashboard");
    }
  }, [authStatus, me, router]);

  if (authStatus !== "authenticated" || !me?.partner.warranty_enabled) {
    return null;
  }

  return <WarrantiesPage />;
}
