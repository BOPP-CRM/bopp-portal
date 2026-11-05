"use client";

import ActionMenu from "@/components/util/ActionMenu";
import TableExport from "@/components/util/TableExport";
import { compactTableClassName } from "@/components/util/data-table";
import { TableSkeleton } from "@/components/util/Skeleton";
import {
  exportCouponCodes,
  getCoupons,
} from "@/services/coupons/coupons";
import type { PortalCoupon } from "@/services/coupons/types";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { Download, History, Pencil, Plus, TicketPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function CouponsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [coupons, setCoupons] = useState<PortalCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [exportingCouponId, setExportingCouponId] = useState<number | null>(
    null,
  );

  const loadCoupons = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    const added = searchParams.get("added");
    if (searchParams.get("saved") !== "1" && !added) return;
    setSuccessMessage(
      added
        ? `เพิ่มโค้ดสำเร็จ ${formatNumber(Number(added))} รายการ`
        : "บันทึกคูปองสำเร็จ",
    );
    router.replace("/dashboard/coupons");
  }, [router, searchParams]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const handleExportCodes = async (coupon: PortalCoupon) => {
    setExportingCouponId(coupon.id);
    setError(null);
    try {
      await exportCouponCodes(coupon.id, coupon.name);
    } catch (exportError) {
      setError(handleError(exportError).message);
    } finally {
      setExportingCouponId(null);
    }
  };

  return (
    <div className="p-3 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            จัดการคูปอง
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            สร้างและจัดการคูปองสำหรับลูกค้าแลก point
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
        <TableExport
          filename="coupons"
          columns={[
            { id: "name", label: "คูปอง", value: (coupon) => coupon.name },
            { id: "value", label: "มูลค่า", value: (coupon) => coupon.value },
            { id: "currency", label: "สกุล Point", value: (coupon) => coupon.currency_name },
            { id: "start", label: "เริ่ม", value: (coupon) => formatDateTime(coupon.start_time) },
            { id: "end", label: "สิ้นสุด", value: (coupon) => formatDateTime(coupon.end_time) },
            { id: "codes", label: "โค้ดทั้งหมด", value: (coupon) => coupon.total_code_count },
            { id: "available", label: "โค้ดคงเหลือ", value: (coupon) => coupon.available_code_count },
            { id: "redeemed", label: "แลกแล้ว", value: (coupon) => coupon.redeemed_count },
            { id: "show", label: "แสดงใน UI", value: (coupon) => (coupon.is_show_in_ui ? "ใช่" : "ไม่") },
          ]}
          loadRows={async () => coupons}
        />
        <button
          type="button"
          onClick={() => router.push("/dashboard/coupons/new")}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
        >
          <Plus className="size-4" />
          เพิ่มคูปอง
        </button>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-3 py-2 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={6} columns={7} avatarColumn />
        ) : error ? (
          <div className="p-6 text-sm text-red-100">{error}</div>
        ) : coupons.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ยังไม่มีคูปอง</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full text-left ${compactTableClassName}`}>
              <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                <tr>
                  <th className="px-4 py-4 font-medium">คูปอง</th>
                  <th className="px-4 py-4 font-medium">มูลค่า</th>
                  <th className="px-4 py-4 font-medium">ช่วงเวลา</th>
                  <th className="px-4 py-4 font-medium">โค้ด</th>
                  <th className="px-4 py-4 font-medium">แลก/ใช้</th>
                  <th className="px-4 py-4 font-medium">แสดงใน UI</th>
                  <th className="px-4 py-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    onClick={() => router.push(`/dashboard/coupons/${coupon.id}`)}
                    className="cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 hover:bg-gray-10"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {coupon.image_url ? (
                          <img
                            src={String(coupon.image_url)}
                            alt={coupon.name}
                            className="size-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="size-8 rounded-lg bg-brown-yellow-5" />
                        )}
                        <div>
                          <p className="font-medium text-defualt-text">
                            {coupon.name}
                          </p>
                          <p className="text-xs text-gray-100">
                            {coupon.code_source === "generate"
                              ? "Generate"
                              : "Import"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {formatNumber(coupon.value)}{" "}
                      <span className="text-gray-100">
                        {coupon.currency_name}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      <div>{formatDateTime(coupon.start_time)}</div>
                      <div className="text-gray-100">
                        {coupon.end_time
                          ? formatDateTime(coupon.end_time)
                          : "ไม่จำกัด"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {formatNumber(coupon.available_code_count)} /{" "}
                      {formatNumber(coupon.total_code_count)}
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {formatNumber(coupon.redeemed_count)} /{" "}
                      {formatNumber(coupon.used_code_count)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          coupon.is_show_in_ui
                            ? "bg-brown-yellow-5 text-brown-100"
                            : "bg-gray-10 text-gray-100"
                        }`}
                      >
                        {coupon.is_show_in_ui ? "แสดง" : "ซ่อน"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ActionMenu
                        ariaLabel={`ตัวเลือกคูปอง ${coupon.name}`}
                        items={[
                          {
                            label: "เพิ่มโค้ด",
                            icon: <TicketPlus className="size-4" />,
                            onClick: () =>
                              router.push(`/dashboard/coupons/${coupon.id}/codes`),
                          },
                          {
                            label:
                              exportingCouponId === coupon.id
                                ? "กำลังส่งออก..."
                                : "ส่งออกโค้ด",
                            icon: <Download className="size-4" />,
                            disabled: exportingCouponId === coupon.id,
                            onClick: () => void handleExportCodes(coupon),
                          },
                          {
                            label: "ประวัติ",
                            icon: <History className="size-4" />,
                            onClick: () =>
                              router.push(
                                `/dashboard/coupons/${coupon.id}/redemptions`,
                              ),
                          },
                          {
                            label: "แก้ไข",
                            icon: <Pencil className="size-4" />,
                            onClick: () =>
                              router.push(`/dashboard/coupons/${coupon.id}`),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
