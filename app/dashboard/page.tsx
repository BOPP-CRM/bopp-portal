"use client";

import DashboardPage from "@/components/dashboard/DashboardPage";
import { DashboardShellSkeleton } from "@/components/util/Skeleton";
import { useApp } from "@/providers/app-provider";
import { getDefaultDashboardPath, getUserRole, isAdmin } from "@/utils/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { me } = useApp();
  const router = useRouter();
  const role = getUserRole(me);

  useEffect(() => {
    if (!me || isAdmin(me)) return;
    router.replace(getDefaultDashboardPath(role));
  }, [me, role, router]);

  if (!me) {
    return <DashboardShellSkeleton />;
  }

  if (!isAdmin(me)) {
    return <DashboardShellSkeleton />;
  }

  return <DashboardPage />;
}
