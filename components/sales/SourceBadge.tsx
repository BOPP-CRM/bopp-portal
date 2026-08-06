import {
  SALE_SOURCE_LABELS,
  type SaleSource,
} from "@/services/sales/types";

type SourceBadgeProps = {
  source: SaleSource;
  label?: string;
  className?: string;
};

const SOURCE_STYLES: Record<SaleSource, string> = {
  zortout: "bg-brown-yellow-5 text-brown-100",
  omisell: "bg-gray-10 text-defualt-text",
  manual: "bg-gray-10 text-defualt-text",
  other: "bg-gray-10 text-gray-100",
};

export default function SourceBadge({
  source,
  label,
  className = "",
}: SourceBadgeProps) {
  const text = label || SALE_SOURCE_LABELS[source] || source;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${SOURCE_STYLES[source] ?? SOURCE_STYLES.other} ${className}`}
    >
      {text}
    </span>
  );
}
