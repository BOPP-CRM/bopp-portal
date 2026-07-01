"use client";

import { useApp } from "@/providers/app-provider";
import { redirectToLogin } from "@/services/api-client";
import { DashboardShellSkeleton } from "@/components/util/Skeleton";
import { useEffect, useRef } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authStatus, me, isAuthenticated } = useApp();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      hasRedirected.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authStatus !== "unauthenticated" || hasRedirected.current) return;
    hasRedirected.current = true;
    redirectToLogin();
  }, [authStatus]);

  if (authStatus === "unauthenticated") {
    return null;
  }

  if (authStatus === "loading" && !me) {
    return <DashboardShellSkeleton />;
  }

  return children;
}
