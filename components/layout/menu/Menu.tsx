"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  LayoutDashboard,
  Menu as MenuIcon,
  Package,
  Plug,
  QrCode,
  Receipt,
  ShoppingCart,
  ShieldCheck,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";
import MenuSection from "./MenuSection";
import Profile from "./Profile";
import { useApp } from "@/providers/app-provider";
import { canAccessPath, getUserRole, isAdmin } from "@/utils/roles";

const iconClassName = "size-4 shrink-0";

type MenuLeaf = {
  icon: React.ReactNode;
  label: string;
  path: string;
  requiresWarranty?: boolean;
  requiresAdmin?: boolean;
};

type MenuGroup = {
  id: string;
  label: string;
  items: MenuLeaf[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    id: "overview",
    label: "ภาพรวม",
    items: [
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
    ],
  },
  {
    id: "members",
    label: "สมาชิก",
    items: [
      {
        icon: <Users className={iconClassName} />,
        label: "รายชื่อสมาชิก",
        path: "/dashboard/members",
      },
      {
        icon: <BadgeCheck className={iconClassName} />,
        label: "ระดับสมาชิก",
        path: "/dashboard/tier",
      },
    ],
  },
  {
    id: "rewards",
    label: "รางวัล",
    items: [
      {
        icon: <Receipt className={iconClassName} />,
        label: "ตรวจสอบใบเสร็จ",
        path: "/dashboard/receipts",
      },
      {
        icon: <ShoppingCart className={iconClassName} />,
        label: "รายการขาย",
        path: "/dashboard/sales",
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
    ],
  },
  {
    id: "warranty",
    label: "รับประกัน",
    items: [
      {
        icon: <ShieldCheck className={iconClassName} />,
        label: "รับประกันสินค้า",
        path: "/dashboard/warranties",
        requiresWarranty: true,
      },
      {
        icon: <Package className={iconClassName} />,
        label: "สินค้ารับประกัน",
        path: "/dashboard/warranties/products",
        requiresWarranty: true,
      },
    ],
  },
  {
    id: "system",
    label: "ระบบ",
    items: [
      {
        icon: <UserCog className={iconClassName} />,
        label: "จัดการทีม",
        path: "/dashboard/team",
      },
      {
        icon: <Plug className={iconClassName} />,
        label: "การเชื่อมต่อ",
        path: "/dashboard/connections",
        requiresAdmin: true,
      },
    ],
  },
];

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

  const visibleGroups = useMemo(() => {
    const role = getUserRole(me);

    return MENU_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.requiresWarranty && !me?.partner.warranty_enabled) {
          return false;
        }
        if (item.requiresAdmin && !isAdmin(me)) {
          return false;
        }
        return canAccessPath(role, item.path);
      }),
    })).filter((group) => group.items.length > 0);
  }, [me]);

  const activePath = useMemo(() => {
    const allPaths = visibleGroups.flatMap((group) =>
      group.items.map((item) => item.path),
    );
    const matches = allPaths
      .filter((path) =>
        path === "/dashboard"
          ? pathname === "/dashboard"
          : pathname === path || pathname.startsWith(`${path}/`),
      )
      .sort((a, b) => b.length - a.length);
    return matches[0] ?? null;
  }, [pathname, visibleGroups]);

  const handleSidebarToggle = () => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
      return;
    }

    setIsCollapsed((prev) => !prev);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center [&_svg]:shrink-0"
          aria-label="เปิดเมนู"
        >
          <MenuIcon className="size-5 text-gray-100" />
        </button>
        <Profile />
      </header>

      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ease-in-out md:hidden${isMobileOpen ? " opacity-100" : " pointer-events-none opacity-0"}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden={!isMobileOpen}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 min-h-screen w-66 shrink-0 overflow-y-auto bg-white shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out -translate-x-full md:relative md:h-full md:translate-x-0 md:transition-[width]${isMobileOpen ? " translate-x-0" : ""}${isCollapsed ? " md:w-16" : " md:w-60"}`}
      >
        <div
          className={`flex items-center justify-between gap-2 p-4 pb-5 transition-all duration-300 ease-in-out${isCollapsed ? " md:flex-col md:justify-center md:gap-3 md:px-2 md:py-4" : ""}`}
        >
          {me?.partner.logo_url && (
            <img
              src="/logo.png"
              alt="logo"
              className={`size-14 shrink-0 cursor-pointer object-contain${isCollapsed ? " md:hidden" : ""}`}
              onClick={() => window.location.assign("/")}
            />
          )}
          <button
            type="button"
            onClick={handleSidebarToggle}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center [&_svg]:shrink-0"
            aria-label={
              isMobileOpen ? "ปิดเมนู" : isCollapsed ? "ขยายเมนู" : "หุบเมนู"
            }
          >
            <MenuIcon className="size-5 text-gray-100" />
          </button>
        </div>

        <nav className="px-1 pb-6">
          {visibleGroups.map((group) => (
            <MenuSection
              key={group.id}
              label={group.label}
              items={group.items}
              activePath={activePath}
              isCollapsed={isCollapsed}
              defaultOpen
              onItemClick={() => setIsMobileOpen(false)}
            />
          ))}
        </nav>
      </div>
    </>
  );
}
