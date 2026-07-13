"use client";

import { CaseLower, CaseUpper } from "lucide-react";

type CaseToggleInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  disabled?: boolean;
};

export default function CaseToggleInput({
  value,
  onChange,
  className = "",
  inputClassName = "",
  placeholder,
  disabled = false,
}: CaseToggleInputProps) {
  const willUppercase = /[a-z]/.test(value) || value === "";
  const toggleLabel = willUppercase
    ? "แปลงเป็นตัวพิมพ์ใหญ่"
    : "แปลงเป็นตัวพิมพ์เล็ก";

  const toggleCase = () => {
    onChange(willUppercase ? value.toUpperCase() : value.toLowerCase());
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputClassName} pr-12`}
      />
      <button
        type="button"
        onClick={toggleCase}
        disabled={disabled || !value.trim()}
        title={toggleLabel}
        aria-label={toggleLabel}
        className="absolute right-2 top-1/2 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-gray-100 transition hover:bg-gray-10 hover:text-brown-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {willUppercase ? (
          <CaseUpper className="size-4" aria-hidden="true" />
        ) : (
          <CaseLower className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
