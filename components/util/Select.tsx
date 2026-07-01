"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type SelectProps<T extends string | number> = {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export default function Select<T extends string | number>({
  value,
  options,
  onChange,
  placeholder = "เลือก",
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selectedOption = (options ?? []).find((option) => option.value === value);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(224, openUpward ? spaceAbove : spaceBelow);

    setMenuPosition({
      left: rect.left,
      width: rect.width,
      top: openUpward ? rect.top - maxHeight - 6 : rect.bottom + 6,
      maxHeight,
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();

    const handleReposition = () => updateMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const menu =
    isOpen && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              maxHeight: menuPosition.maxHeight,
            }}
            className="fixed z-70 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-2 shadow-[0_8px_24px_0_rgba(0,0,0,0.12)]"
          >
            {(options ?? []).map((option) => {
              const isSelected = option.value === value;

              return (
                <li
                  key={String(option.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${
                      isSelected
                        ? "bg-brown-yellow-5 text-brown-100"
                        : "text-defualt-text hover:bg-gray-10"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <Check className="size-4 shrink-0 text-brown-100" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left text-sm transition outline-none ${
          isOpen
            ? "border-brown-100 ring-2 ring-brown-100/20"
            : "border-gray-200 hover:border-gray-50"
        }`}
      >
        <span
          className={selectedOption ? "text-defualt-text" : "text-gray-100"}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-gray-100 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {menu}
    </div>
  );
}
