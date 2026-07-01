"use client";

import ConnectionModal from "@/components/profile/ConnectionModal";
import ProfileSettingsModal from "@/components/profile/ProfileSettingsModal";
import { Info, ChevronDown, Settings, Plug } from "lucide-react";
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

export default function Profile() {
  const { me, fetchMe } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
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
      className="relative flex items-center gap-4 font-medium cursor-pointer"
      onClick={() => setIsOpen((prev) => !prev)}
    >
      <div
        className="size-8 shrink-0 rounded-full bg-brown-100 flex items-center justify-center text-white text-xs font-medium"
        aria-hidden
      >
        {getInitials(me?.user.name)}
      </div>
      <div className="min-w-0 text-sm">
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
        className="size-6 shrink-0 flex items-center justify-center text-brown-100 cursor-pointer [&_svg]:shrink-0"
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
          className="absolute top-full right-0 mt-2 min-w-44 bg-white rounded-2xl border border-gray-200 py-2 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] z-50"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setShowSettings(true);
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-100 hover:text-brown-100 cursor-pointer"
          >
            <Settings className="size-4" />
            ตั้งค่าบัญชี
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setShowConnection(true);
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-100 hover:text-brown-100 cursor-pointer"
          >
            <Plug className="size-4" />
            BOPP MCP
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-sm hover:text-brown-100 cursor-pointer text-gray-100"
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

      {showConnection && me ? (
        <ConnectionModal me={me} onClose={() => setShowConnection(false)} />
      ) : null}
    </div>
  );
}
