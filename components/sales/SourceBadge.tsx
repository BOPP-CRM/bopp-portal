import {
  SALE_SOURCE_LABELS,
  SALE_SOURCE_STYLES,
  type SaleSource,
} from "@/services/sales/types";

type SourceBadgeProps = {
  source: SaleSource;
  label?: string;
  className?: string;
};

export default function SourceBadge({
  source,
  label,
  className = "",
}: SourceBadgeProps) {
  const styles = SALE_SOURCE_STYLES[source] ?? SALE_SOURCE_STYLES.other;
  const text = label || SALE_SOURCE_LABELS[source] || source;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles.badge} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} aria-hidden />
      {text}
    </span>
  );
}
