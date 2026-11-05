"use client";

import { getCoupon, getCouponRedemptions } from "@/services/coupons/coupons";
import type {
  CouponRedemption,
  CouponRedemptionSummary,
} from "@/services/coupons/types";
import Select from "@/components/util/Select";
import TableExport from "@/components/util/TableExport";
import { collectPages } from "@/utils/csv";
import { compactTableClassName } from "@/components/util/data-table";
import { TableSkeleton } from "@/components/util/Skeleton";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import {
  displayValue,
  formatNumber,
  formatPointSource,
} from "@/utils/format";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type CouponRedemptionsPageProps = {
  couponId: number;
};

type UsedFilter = "all" | "unused" | "used";

const PAGE_SIZE = 20;

export default function CouponRedemptionsModal({
  couponId,
}: CouponRedemptionsPageProps) {
  const [couponName, setCouponName] = useState("");
  const [summary, setSummary] = useState<CouponRedemptionSummary | null>(null);
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [usedFilter, setUsedFilter] = useState<UsedFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRedemptions = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await getCouponRedemptions(couponId, {
        limit: PAGE_SIZE,
        offset,
        is_used:
          usedFilter === "all"
            ? undefined
            : usedFilter === "used"
              ? true
              : false,
      });
      setSummary(data.summary);
      setRedemptions(data.redemptions);
      setTotal(data.total);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setSummary(null);
      setRedemptions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [couponId, offset, usedFilter]);

  useEffect(() => {
    void loadRedemptions();
  }, [loadRedemptions]);

  useEffect(() => {
    setOffset(0);
  }, [usedFilter, couponId]);

  useEffect(() => {
    void getCoupon(couponId)
      .then((coupon) => setCouponName(coupon.name))
      .catch(() => setCouponName(""));
  }, [couponId]);

  const usedOptions = useMemo(
    () => [
      { value: "all" as const, label: "ทั้งหมด" },
      { value: "unused" as const, label: "ยังไม่ใช้" },
      { value: "used" as const, label: "ใช้แล้ว" },
    ],
    [],
  );

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  return (
    <div className="p-3 md:p-5">
      <Link
        href="/dashboard/coupons"
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-100 hover:text-brown-100"
      >
        <ArrowLeft className="size-4" />
        กลับไปจัดการคูปอง
      </Link>
      <div className="rounded-md border border-gray-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1
              id="coupon-redemptions-title"
              className="text-xl font-bold text-defualt-text"
            >
              ประวัติการแลกคูปอง
            </h1>
            <p className="mt-1 text-sm text-gray-100">{couponName}</p>
          </div>
          <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
          <TableExport
            filename="coupon-redemptions"
            columns={[
              { id: "code", label: "โค้ด", value: (item) => item.code },
              { id: "member", label: "สมาชิก", value: (item) => item.user.display_name },
              { id: "phone", label: "เบอร์โทร", value: (item) => displayValue(item.user.phone) },
              { id: "value", label: "มูลค่า", value: (item) => item.value },
              { id: "acquired", label: "วันที่แลก", value: (item) => formatDateTime(item.acquired_date) },
              { id: "expires", label: "หมดอายุ", value: (item) => formatDateTime(item.expiration_date) },
              { id: "used", label: "สถานะ", value: (item) => (item.is_used ? "ใช้แล้ว" : "ยังไม่ใช้") },
              { id: "used_date", label: "วันที่ใช้", value: (item) => formatDateTime(item.used_date) },
              { id: "source", label: "ที่มา", value: (item) => formatPointSource(item.source.kind) },
            ]}
            loadRows={() =>
              collectPages(async (pageOffset, limit) => {
                const data = await getCouponRedemptions(couponId, {
                  limit,
                  offset: pageOffset,
                  is_used:
                    usedFilter === "all"
                      ? undefined
                      : usedFilter === "used"
                        ? true
                        : false,
                });
                return { rows: data.redemptions, total: data.total };
              })
            }
          />
          <div className="w-full md:w-48">
            <Select
              value={usedFilter}
              options={usedOptions}
              onChange={setUsedFilter}
            />
          </div>
          </div>
        </div>

        {summary ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="แลกทั้งหมด"
              value={formatNumber(summary.total_redemptions)}
            />
            <SummaryCard
              label="ใช้แล้ว"
              value={formatNumber(summary.used_count)}
            />
            <SummaryCard
              label="ยังไม่ใช้"
              value={formatNumber(summary.unused_count)}
            />
            <SummaryCard
              label="สมาชิกที่แลก"
              value={formatNumber(summary.unique_users)}
            />
          </div>
        ) : null}

        <div className="mt-5">
          {loading ? (
            <TableSkeleton rows={5} columns={6} cellClassName="px-3 py-2" />
          ) : error ? (
            <p className="text-sm text-red-100">{error}</p>
          ) : redemptions.length === 0 ? (
            <p className="text-sm text-gray-100">ยังไม่มีประวัติการแลก</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className={`min-w-full text-left ${compactTableClassName}`}>
                <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                  <tr>
                    <th className="px-3 py-2 font-medium">สมาชิก</th>
                    <th className="px-3 py-2 font-medium">โค้ด</th>
                    <th className="px-3 py-2 font-medium">ได้รับเมื่อ</th>
                    <th className="px-3 py-2 font-medium">หมดอายุ</th>
                    <th className="px-3 py-2 font-medium">สถานะ</th>
                    <th className="px-3 py-2 font-medium">แหล่งที่มา</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((redemption) => (
                    <tr
                      key={redemption.id}
                      className="border-b border-gray-200 last:border-b-0"
                    >
                      <td className="px-3 py-2">
                        <Link
                          href={`/dashboard/members/${redemption.user.id}`}
                          className="font-medium text-brown-100 hover:underline"
                        >
                          {redemption.user.display_name}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-100">
                          {displayValue(redemption.user.phone)}
                        </p>
                      </td>
                      <td className="px-3 py-2 font-mono text-defualt-text">
                        {redemption.code}
                      </td>
                      <td className="px-3 py-2 text-defualt-text">
                        {formatDateTime(redemption.acquired_date)}
                      </td>
                      <td className="px-3 py-2 text-defualt-text">
                        {formatDateTime(redemption.expiration_date)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            redemption.is_used
                              ? "bg-gray-10 text-gray-100"
                              : "bg-brown-yellow-5 text-brown-100"
                          }`}
                        >
                          {redemption.is_used ? "ใช้แล้ว" : "ยังไม่ใช้"}
                        </span>
                        {redemption.is_used ? (
                          <p className="mt-1 text-xs text-gray-100">
                            {formatDateTime(redemption.used_date)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-defualt-text">
                        {formatPointSource(redemption.source.kind)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {total > PAGE_SIZE ? (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-100">
            <span>
              หน้า {currentPage} / {totalPages} ({formatNumber(total)} รายการ)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
                className="inline-flex cursor-pointer items-center gap-1 rounded-4xl border border-gray-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="size-4" />
                ก่อนหน้า
              </button>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-4xl border border-gray-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          <Link
            href="/dashboard/coupons"
            className="inline-flex w-full items-center justify-center rounded-4xl bg-gray-10 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80"
          >
            กลับ
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-10 px-3 py-2">
      <p className="text-xs text-gray-100">{label}</p>
      <p className="mt-1 text-lg font-semibold text-defualt-text">{value}</p>
    </div>
  );
}
