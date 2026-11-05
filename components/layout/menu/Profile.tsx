"use client";

import ProfileSettingsModal from "@/components/profile/ProfileSettingsModal";
import { Info, ChevronDown, Settings } from "lucide-react";
import dialog from "@/components/util/dialog";
import { useApp } from "@/providers/app-provider";
import { logout } from "@/services/auth/auth";
import { PORTAL_ROLE_LABELS, getUserRole } from "@/utils/roles";
import { useEffect, useRef, useState } from "react";

function getInitials(fullName?: string): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return parts[0][0]?.toUpperCase() ?? "";
}

type ProfileProps = {
  variant?: "header" | "sidebar";
  collapsed?: boolean;
};

export default function Profile({
  variant = "header",
  collapsed = false,
}: ProfileProps) {
  const { me, fetchMe } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
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

  const handleLogout = async () => {
    const result = await dialog.fire({
      title: "ยืนยันการออกจากระบบ",
      description: "คุณต้องการออกจากระบบหรือไม่",
      icon: <Info className="text-red-100" />,
      confirmText: "ออกจากระบบ",
      confirmVariant: "danger",
    });
    setIsOpen(false);

    if (result.isConfirmed) {
      logout();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex cursor-pointer items-center font-medium ${
        variant === "sidebar"
          ? `w-full gap-2.5 rounded-xl px-2 py-1.5 hover:bg-gray-10${collapsed ? " md:justify-center md:px-0" : ""}`
          : "gap-3"
      }`}
      onClick={() => setIsOpen((prev) => !prev)}
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brown-100 text-xs font-medium text-white"
        aria-hidden
      >
        {getInitials(me?.user.name)}
      </div>
      <div className={`min-w-0 flex-1 text-sm${collapsed ? " md:hidden" : ""}`}>
        <div className="truncate font-medium text-gray-100">
          {me?.user.name}
        </div>
        {me ? (
          <div className="truncate text-xs text-gray-100/80">
            {PORTAL_ROLE_LABELS[getUserRole(me)]}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className={`flex size-6 shrink-0 cursor-pointer items-center justify-center text-brown-100 [&_svg]:shrink-0${collapsed ? " md:hidden" : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="เมนูโปรไฟล์"
      >
        <ChevronDown
          className={`transition-transform duration-200${isOpen ? " rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          onClick={(event) => event.stopPropagation()}
          className={`absolute z-50 min-w-44 rounded-2xl border border-gray-200 bg-white py-2 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
            variant === "sidebar"
              ? "bottom-full left-0 mb-2"
              : "top-full right-0 mt-2"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setShowSettings(true);
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-100 hover:text-brown-100 cursor-pointer"
          >
            <Settings className="size-4" />
            ตั้งค่าบัญชี
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full px-3 py-2 text-left text-sm hover:text-brown-100 cursor-pointer text-gray-100"
          >
            ออกจากระบบ
          </button>
        </div>
      )}

      {showSettings && me ? (
        <ProfileSettingsModal
          me={me}
          onClose={() => setShowSettings(false)}
          onSuccess={() => void fetchMe()}
        />
      ) : null}
    </div>
  );
}
