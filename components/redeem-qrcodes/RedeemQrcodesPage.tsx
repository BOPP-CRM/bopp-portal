"use client";

import FilterGroup from "@/components/util/FilterGroup";
import TableExport from "@/components/util/TableExport";
import { collectPages } from "@/utils/csv";
import { compactTableClassName } from "@/components/util/data-table";
import { TableSkeleton } from "@/components/util/Skeleton";
import {
  getRedeemQrcodes,
} from "@/services/redeem-qrcodes/redeem-qrcodes";
import type { PortalRedeemQrcode } from "@/services/redeem-qrcodes/types";
import { formatDateTime, isApiDateAfterNow } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;

type ActiveFilter = "all" | "active" | "inactive";

export default function RedeemQrcodesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [qrcodes, setQrcodes] = useState<PortalRedeemQrcode[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeParam = useMemo(() => {
    if (activeFilter === "active") return true;
    if (activeFilter === "inactive") return false;
    return undefined;
  }, [activeFilter]);

  const loadRequestId = useRef(0);

  const loadQrcodes = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setError(null);
    setLoading(true);

    try {
      const data = await getRedeemQrcodes({
        active: activeParam,
        limit: PAGE_SIZE,
        offset,
      });
      if (requestId !== loadRequestId.current) return;
      setQrcodes(data.redeemQrcodes);
      setTotal(data.total);
    } catch (loadError) {
      if (requestId !== loadRequestId.current) return;
      setError(handleError(loadError).message);
      setQrcodes([]);
      setTotal(0);
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }, [activeParam, offset]);

  useEffect(() => {
    void loadQrcodes();
  }, [loadQrcodes]);

  useEffect(() => {
    setOffset(0);
  }, [activeFilter]);

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  const filterOptions = useMemo(
    () => [
      { value: "all" as const, label: "ทั้งหมด" },
      { value: "active" as const, label: "ใช้งานอยู่" },
      { value: "inactive" as const, label: "หมดอายุ/ปิด" },
    ],
    [],
  );

  useEffect(() => {
    if (searchParams.get("saved") !== "1") return;
    setSuccessMessage("บันทึก Redeem QR สำเร็จ");
    router.replace("/dashboard/redeem-qrcodes");
  }, [router, searchParams]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const formatReward = (qrcode: PortalRedeemQrcode) => {
    const parts: string[] = [];
    if (qrcode.value > 0) {
      parts.push(
        `${formatNumber(qrcode.value)} ${qrcode.currency_name ?? "point"}`,
      );
    }
    if (qrcode.reward_coupon && typeof qrcode.reward_coupon === "object") {
      parts.push(`คูปอง: ${qrcode.reward_coupon.name}`);
    }
    return parts.length > 0 ? parts.join(" + ") : "-";
  };

  const formatType = (type: PortalRedeemQrcode["type"]) =>
    type === "earn" ? "รับ Point" : "ใช้ Point";

  const isActive = (qrcode: PortalRedeemQrcode) => {
    if (qrcode.active === false) return false;
    if (!qrcode.expiration_date) return true;
    return isApiDateAfterNow(qrcode.expiration_date);
  };

  return (
    <div className="p-3 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            รางวัล QR Code
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            สร้างและจัดการรางวัลเมื่อสมาชิกสแกน QR Code
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <TableExport
            filename="redeem-qrcodes"
            columns={[
              { id: "name", label: "ชื่อ", value: (qrcode) => qrcode.name },
              { id: "reward", label: "รางวัล", value: (qrcode) => formatReward(qrcode) },
              { id: "type", label: "ประเภท", value: (qrcode) => formatType(qrcode.type) },
              { id: "per_user", label: "จำกัดต่อคน", value: (qrcode) => qrcode.limit_per_user },
              { id: "per_qr", label: "จำกัดต่อ QR", value: (qrcode) => qrcode.limit_per_qr },
              { id: "expires", label: "หมดอายุ", value: (qrcode) => formatDateTime(qrcode.expiration_date) },
              { id: "active", label: "สถานะ", value: (qrcode) => (isActive(qrcode) ? "ใช้งาน" : "ไม่ใช้งาน") },
              { id: "code", label: "Code", value: (qrcode) => qrcode.code },
              { id: "url", label: "Redeem URL", value: (qrcode) => qrcode.redeem_url },
            ]}
            loadRows={() =>
              collectPages(async (pageOffset, limit) => {
                const data = await getRedeemQrcodes({
                  active: activeParam,
                  limit,
                  offset: pageOffset,
                });
                return { rows: data.redeemQrcodes, total: data.total };
              })
            }
          />
          <button
            type="button"
            onClick={() => router.push("/dashboard/redeem-qrcodes/new")}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
          >
            <Plus className="size-4" />
            สร้าง Redeem QR
          </button>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-3 py-2 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterGroup
          ariaLabel="สถานะ Redeem QR"
          options={filterOptions}
          value={activeFilter}
          onChange={setActiveFilter}
        />
        <p className="text-sm text-gray-100">ทั้งหมด {formatNumber(total)} รายการ</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : error ? (
          <div className="p-6 text-sm text-red-100">{error}</div>
        ) : qrcodes.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ยังไม่มี Redeem QR</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full text-left ${compactTableClassName}`}>
              <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                <tr>
                  <th className="px-4 py-4 font-medium">ชื่อ</th>
                  <th className="px-4 py-4 font-medium">รางวัล</th>
                  <th className="px-4 py-4 font-medium">ประเภท</th>
                  <th className="px-4 py-4 font-medium">จำกัด</th>
                  <th className="px-4 py-4 font-medium">หมดอายุ</th>
                  <th className="px-4 py-4 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {qrcodes.map((qrcode) => (
                  <tr
                    key={qrcode.id}
                    onClick={() => router.push(`/dashboard/redeem-qrcodes/${qrcode.id}`)}
                    className="cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 hover:bg-gray-10"
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-defualt-text">{qrcode.name}</p>
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {formatReward(qrcode)}
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {formatType(qrcode.type)}
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      <div>คนละ {formatNumber(qrcode.limit_per_user)}</div>
                      <div className="text-gray-100">
                        QR {formatNumber(qrcode.limit_per_qr)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {formatDateTime(qrcode.expiration_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          isActive(qrcode)
                            ? "bg-brown-yellow-5 text-brown-100"
                            : "bg-gray-10 text-gray-100"
                        }`}
                      >
                        {isActive(qrcode) ? "ใช้งาน" : "ไม่ใช้งาน"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && total > 0 ? (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4">
            <p className="text-sm text-gray-100">
              หน้า {currentPage} จาก {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() =>
                  setOffset((prev) => Math.max(0, prev - PAGE_SIZE))
                }
                className="inline-flex items-center gap-1 rounded-4xl border border-gray-200 px-4 py-2 text-sm text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="size-4" />
                ก่อนหน้า
              </button>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                className="inline-flex items-center gap-1 rounded-4xl border border-gray-200 px-4 py-2 text-sm text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
