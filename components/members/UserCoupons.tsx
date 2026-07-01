"use client";

import { getUserCoupons } from "@/services/members/members";
import type { PortalUserCoupon } from "@/services/members/types";
import Select from "@/components/util/Select";
import { CardListSkeleton } from "@/components/util/Skeleton";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import {
  displayValue,
  formatNumber,
  formatPointSource,
} from "@/utils/format";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 20;

type UserCouponsProps = {
  userId: number;
  refreshKey?: number;
};

type UsedFilter = "all" | "unused" | "used";

export default function UserCoupons({
  userId,
  refreshKey = 0,
}: UserCouponsProps) {
  const [coupons, setCoupons] = useState<PortalUserCoupon[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [usedFilter, setUsedFilter] = useState<UsedFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCoupons = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await getUserCoupons(userId, {
        limit: PAGE_SIZE,
        offset,
        is_used:
          usedFilter === "all"
            ? undefined
            : usedFilter === "used"
              ? true
              : false,
      });
      setCoupons(data.coupons);
      setTotal(data.total);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setCoupons([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, usedFilter, userId]);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons, refreshKey]);

  useEffect(() => {
    setOffset(0);
  }, [usedFilter, userId]);

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
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-defualt-text">
          คูปองของสมาชิก
        </h2>
        <div className="w-full md:w-48">
          <Select
            value={usedFilter}
            options={usedOptions}
            onChange={setUsedFilter}
          />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <CardListSkeleton count={4} />
        ) : error ? (
          <p className="text-sm text-red-100">{error}</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-gray-100">ไม่มีคูปอง</p>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
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
    </section>
  );
}

function CouponCard({ coupon }: { coupon: PortalUserCoupon }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          {coupon.coupon.image_url ? (
            <img
              src={String(coupon.coupon.image_url)}
              alt={coupon.name}
              className="size-14 rounded-lg object-cover"
            />
          ) : (
            <div className="size-14 rounded-lg bg-brown-yellow-5" />
          )}
          <div>
            <p className="font-medium text-defualt-text">{coupon.name}</p>
            <p className="mt-0.5 font-mono text-sm text-brown-100">
              {coupon.code}
            </p>
            <p className="mt-1 text-xs text-gray-100">
              {coupon.coupon.name}
            </p>
          </div>
        </div>

        <span
          className={`self-start rounded-full px-3 py-1 text-xs font-medium ${
            coupon.is_used
              ? "bg-gray-10 text-gray-100"
              : "bg-brown-yellow-5 text-brown-100"
          }`}
        >
          {coupon.is_used ? "ใช้แล้ว" : "ยังไม่ใช้"}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem
          label="มูลค่า"
          value={`${formatNumber(coupon.value)} ${coupon.currency.name}`}
        />
        <InfoItem
          label="ได้รับเมื่อ"
          value={formatDateTime(coupon.acquired_date)}
        />
        <InfoItem
          label="หมดอายุ"
          value={formatDateTime(coupon.expiration_date)}
        />
        <InfoItem
          label="ใช้เมื่อ"
          value={formatDateTime(coupon.used_date)}
        />
        <InfoItem
          label="แหล่งที่มา"
          value={formatPointSource(coupon.source.kind)}
        />
        <InfoItem
          label="หมายเหตุ"
          value={displayValue(coupon.admin_note)}
        />
      </dl>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-100">{label}</dt>
      <dd className="mt-0.5 font-medium text-defualt-text">{value}</dd>
    </div>
  );
}
