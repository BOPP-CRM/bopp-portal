"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  LayoutDashboard,
  Menu as MenuIcon,
  QrCode,
  Receipt,
  ShieldCheck,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import MenuItem from "./MenuItem";
import Profile from "./Profile";
import { useApp } from "@/providers/app-provider";
import { canAccessPath, getUserRole } from "@/utils/roles";
import { useMemo } from "react";

const iconClassName = "size-6 shrink-0";

export default function Menu() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { me } = useApp();

  useEffect(() => {
    if (!isMobileOpen) return;

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleResize = () => {
      if (mediaQuery.matches) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    mediaQuery.addEventListener("change", handleResize);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, [isMobileOpen]);

  const menuItems = [
    {
      icon: <LayoutDashboard className={iconClassName} />,
      label: "แดชบอร์ด",
      path: "/dashboard",
    },
    {
      icon: <Building2 className={iconClassName} />,
      label: "ข้อมูล Partner",
      path: "/dashboard/partner",
    },
    {
      icon: <Users className={iconClassName} />,
      label: "รายชื่อสมาชิก",
      path: "/dashboard/members",
    },
    {
      icon: <Receipt className={iconClassName} />,
      label: "ตรวจสอบใบเสร็จ",
      path: "/dashboard/receipts",
    },
    {
      icon: <ShieldCheck className={iconClassName} />,
      label: "รับประกันสินค้า",
      path: "/dashboard/warranties",
      requiresWarranty: true,
    },
    {
      icon: <BadgeCheck className={iconClassName} />,
      label: "ระดับสมาชิก",
      path: "/dashboard/tier",
    },
    {
      icon: <Ticket className={iconClassName} />,
      label: "จัดการคูปอง",
      path: "/dashboard/coupons",
    },
    {
      icon: <QrCode className={iconClassName} />,
      label: "รางวัล QR Code",
      path: "/dashboard/redeem-qrcodes",
    },
    {
      icon: <UserCog className={iconClassName} />,
      label: "จัดการทีม",
      path: "/dashboard/team",
    },
  ];

  const visibleMenuItems = useMemo(() => {
    const role = getUserRole(me);
    return menuItems.filter((item) => {
      if (
        "requiresWarranty" in item &&
        item.requiresWarranty &&
        !me?.partner.warranty_enabled
      ) {
        return false;
      }
      return canAccessPath(role, item.path);
    });
  }, [me]);

  const handleSidebarToggle = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
      return;
    }

    setIsCollapsed((prev) => !prev);
  };

  return (
    <>
      <header className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-white shadow-[0_4px_10px_0_rgba(0,0,0,0.1)]">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="size-6 shrink-0 flex items-center justify-center cursor-pointer [&_svg]:shrink-0"
          aria-label="เปิดเมนู"
        >
          <MenuIcon className="text-gray-100 size-6" />
        </button>
        <Profile />
      </header>

      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ease-in-out${isMobileOpen ? " opacity-100" : " opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden={!isMobileOpen}
      />

      <div
        className={`bg-white min-h-screen overflow-scroll shrink-0 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-50 w-66 -translate-x-full md:static md:translate-x-0 md:transition-[width]${isMobileOpen ? " translate-x-0" : ""}${isCollapsed ? " md:w-20" : " md:w-66"}`}
      >
        <div
          className={`flex items-center gap-2 transition-all duration-300 ease-in-out justify-between p-6 pb-7${isCollapsed ? " md:flex-col md:justify-center md:px-4 md:py-6 md:gap-4" : ""}`}
        >
          {me?.partner.logo_url && (
            <img
              src="/logo.png"
              alt="logo"
              className={`size-20 shrink-0 object-contain ${isCollapsed ? "md:hidden" : ""}`}
              onClick={() => window.location.assign("/")}
            />
          )}
          <button
            type="button"
            onClick={handleSidebarToggle}
            className="size-6 shrink-0 flex items-center justify-center cursor-pointer [&_svg]:shrink-0"
            aria-label={
              isMobileOpen ? "ปิดเมนู" : isCollapsed ? "ขยายเมนู" : "หุบเมนู"
            }
          >
            <MenuIcon className="text-gray-100 size-6" />
          </button>
        </div>

        <div>
          {visibleMenuItems.map((item) => (
            <MenuItem
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={
                item.path === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.path)
              }
              isCollapsed={isCollapsed}
              onClick={() => setIsMobileOpen(false)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
