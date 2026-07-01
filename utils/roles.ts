import type { PortalMeResponse } from "@/services/auth/types";

export type PortalRole = "admin" | "operation";

export const PORTAL_ROLE_LABELS: Record<PortalRole, string> = {
  admin: "Admin",
  operation: "Operation",
};

export const PORTAL_ROLE_OPTIONS = [
  { value: "admin" as const, label: "Admin — ทำได้ทุกอย่าง" },
  { value: "operation" as const, label: "Operation — ตรวจสอบใบเสร็จและรับประกัน" },
];

const OPERATION_ALLOWED_PREFIXES = [
  "/dashboard/receipts",
  "/dashboard/warranties",
];

export function getUserRole(
  me: PortalMeResponse | null | undefined,
): PortalRole {
  return me?.user.role ?? "admin";
}

export function isAdmin(me: PortalMeResponse | null | undefined): boolean {
  return getUserRole(me) === "admin";
}

export function canAccessPath(
  role: PortalRole | undefined,
  pathname: string,
): boolean {
  const resolvedRole = role ?? "admin";
  if (resolvedRole === "admin") return true;
  return OPERATION_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getDefaultDashboardPath(
  role: PortalRole | undefined,
): string {
  return role === "operation" ? "/dashboard/receipts" : "/dashboard";
}
