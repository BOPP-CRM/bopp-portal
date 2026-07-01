import type { WarrantyStatus } from "@/services/warranties/types";

const FALLBACK_STYLE = "bg-brown-yellow-5 text-brown-100";

export default function StatusBadge({
  status,
  className = "",
}: {
  status: WarrantyStatus;
  className?: string;
}) {
  const color = status.color && /^#[0-9A-Fa-f]{6}$/.test(status.color)
    ? status.color
    : null;

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${color ? "" : FALLBACK_STYLE} ${className}`}
      style={
        color
          ? {
              backgroundColor: `${color}20`,
              color,
            }
          : undefined
      }
    >
      {status.label}
    </span>
  );
}
