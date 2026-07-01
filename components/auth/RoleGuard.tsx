"use client";

import { useApp } from "@/providers/app-provider";
import {
  canAccessPath,
  getDefaultDashboardPath,
  getUserRole,
} from "@/utils/roles";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { me, authStatus } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const role = getUserRole(me);
  const allowed = canAccessPath(role, pathname);

  useEffect(() => {
    if (authStatus !== "authenticated" || !me || allowed) return;
    router.replace(getDefaultDashboardPath(role));
  }, [allowed, authStatus, me, role, router]);

  if (authStatus === "authenticated" && me && !allowed) {
    return null;
  }

  return children;
}
