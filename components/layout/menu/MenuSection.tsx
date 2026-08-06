"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import MenuItem from "./MenuItem";

export type MenuSectionItem = {
  icon: React.ReactNode;
  label: string;
  path: string;
};

type MenuSectionProps = {
  label: string;
  items: MenuSectionItem[];
  activePath: string | null;
  isCollapsed: boolean;
  defaultOpen?: boolean;
  onItemClick?: () => void;
};

export default function MenuSection({
  label,
  items,
  activePath,
  isCollapsed,
  defaultOpen = false,
  onItemClick,
}: MenuSectionProps) {
  const hasActiveChild = items.some((item) => item.path === activePath);
  const [isOpen, setIsOpen] = useState(defaultOpen || hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  if (items.length === 0) {
    return null;
  }

  if (isCollapsed) {
    return (
      <div className="space-y-0.5 py-1">
        {items.map((item) => (
          <MenuItem
            key={item.path}
            path={item.path}
            icon={item.icon}
            label={item.label}
            isActive={item.path === activePath}
            isCollapsed
            onClick={onItemClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-5 py-2 text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-[11px] font-semibold tracking-wide text-gray-100 uppercase">
          {label}
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-gray-100 transition-transform duration-200${isOpen ? " rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out${isOpen ? " grid-rows-[1fr]" : " grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5 pb-1">
            {items.map((item) => (
              <MenuItem
                key={item.path}
                path={item.path}
                icon={item.icon}
                label={item.label}
                isActive={item.path === activePath}
                isCollapsed={false}
                onClick={onItemClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
