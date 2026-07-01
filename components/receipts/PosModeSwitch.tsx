"use client";

type PosModeSwitchProps = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  className?: string;
};

export default function PosModeSwitch({
  enabled,
  onChange,
  label = "POS Mode",
  className = "",
}: PosModeSwitchProps) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2.5 ${className}`}
    >
      <span className="text-sm font-medium text-defualt-text">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-brown-100" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
