type FilterOption<T extends string | number> = {
  value: T;
  label: string;
};

type FilterGroupProps<T extends string | number> = {
  label?: string;
  ariaLabel?: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-end gap-2">{children}</div>;
}

export default function FilterGroup<T extends string | number>({
  label,
  ariaLabel,
  options,
  value,
  onChange,
}: FilterGroupProps<T>) {
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-1.5">
      {label ? (
        <span className="px-1 text-xs font-medium text-gray-100">{label}</span>
      ) : null}
      <div
        role="tablist"
        aria-label={ariaLabel ?? label}
        className="inline-flex max-w-full flex-wrap gap-0.5 rounded-md border border-gray-200 bg-white p-0.5 shadow-sm"
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(option.value)}
              className={`cursor-pointer rounded-sm px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                selected
                  ? "bg-brown-100 text-white"
                  : "bg-white text-defualt-text hover:bg-gray-10"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
