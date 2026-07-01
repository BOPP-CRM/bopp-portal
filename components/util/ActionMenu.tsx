"use client";

import { MoreVertical } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ActionMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
};

type ActionMenuProps = {
  items: ActionMenuItem[];
  ariaLabel?: string;
};

const MENU_WIDTH = 200;

type MenuPosition = {
  top: number;
  left: number;
};

export default function ActionMenu({
  items,
  ariaLabel = "ตัวเลือกเพิ่มเติม",
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const estimatedHeight = items.length * 44 + 16;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    setMenuPosition({
      left: Math.max(12, rect.right - MENU_WIDTH),
      top: openUpward ? rect.top - estimatedHeight - 6 : rect.bottom + 6,
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
  }, [isOpen, items.length]);

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
      if (event.key === "Escape") setIsOpen(false);
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
            id={menuId}
            role="menu"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: MENU_WIDTH,
            }}
            className="fixed z-70 overflow-hidden rounded-2xl border border-gray-200 bg-white py-2 shadow-[0_8px_24px_0_rgba(0,0,0,0.12)]"
          >
            {items.map((item) => (
              <li key={item.label} role="none">
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    setIsOpen(false);
                    item.onClick();
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-sm text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {item.icon ? (
                    <span className="shrink-0 text-gray-100">{item.icon}</span>
                  ) : null}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={containerRef} className="relative flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex cursor-pointer items-center justify-center rounded-full border p-2 transition ${
          isOpen
            ? "border-brown-100 bg-brown-yellow-5 text-brown-100"
            : "border-gray-200 text-gray-100 hover:bg-gray-10 hover:text-defualt-text"
        }`}
      >
        <MoreVertical className="size-4" />
      </button>
      {menu}
    </div>
  );
}
