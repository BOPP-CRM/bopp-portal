import { Copy } from "lucide-react";

export function ActionButton({
  label,
  onClick,
  disabled,
  icon,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: "primary" | "outlined";
}) {
  const className =
    variant === "primary"
      ? "bg-brown-100 text-white hover:bg-brown-100/80"
      : "border border-gray-200 bg-white text-defualt-text hover:bg-gray-10";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-4xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}

export function CopyField({
  label,
  value,
  onCopy,
  description,
  required = false,
}: {
  label: string;
  value: string;
  onCopy: (value: string) => void;
  description?: string;
  required?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-defualt-text">
        {label}
        {required ? (
          <span className="ml-1 text-xs text-gray-100">(บังคับกรอก)</span>
        ) : null}
      </p>
      {description ? (
        <p className="mt-1 text-xs text-gray-100">{description}</p>
      ) : null}
      <div className="mt-2 flex items-start gap-2">
        <code className="flex-1 break-all rounded-lg bg-gray-10 px-3 py-2 text-xs text-defualt-text">
          {value}
        </code>
        <button
          type="button"
          onClick={() => onCopy(value)}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-brown-100 hover:bg-gray-10"
          aria-label={`คัดลอก ${label}`}
        >
          <Copy className="size-4" />
        </button>
      </div>
    </div>
  );
}
