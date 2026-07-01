"use client";

import { getUserPoints } from "@/services/members/members";
import type { PortalPointRecord } from "@/services/members/types";
import { getCurrencies } from "@/services/currencies/currencies";
import type { PortalCurrency } from "@/services/currencies/types";
import Select from "@/components/util/Select";
import { TableSkeleton } from "@/components/util/Skeleton";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import {
  formatNumber,
  formatPointSource,
  formatPointType,
  isPointEarn,
  matchesPointTypeFilter,
  toApiPointType,
} from "@/utils/format";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;

type UserPointHistoryProps = {
  userId: number;
  refreshKey?: number;
};

type TypeFilter = "all" | "earn" | "spend";

export default function UserPointHistory({
  userId,
  refreshKey = 0,
}: UserPointHistoryProps) {
  const [points, setPoints] = useState<PortalPointRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [currencies, setCurrencies] = useState<PortalCurrency[]>([]);
  const [currencyId, setCurrencyId] = useState<number | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pointsRequestIdRef = useRef(0);

  useEffect(() => {
    void getCurrencies()
      .then(setCurrencies)
      .catch(() => setCurrencies([]));
  }, []);

  const loadPoints = useCallback(async () => {
    const requestId = ++pointsRequestIdRef.current;
    setError(null);
    setLoading(true);

    try {
      const data = await getUserPoints(userId, {
        limit: PAGE_SIZE,
        offset,
        currency_id: currencyId === "all" ? undefined : currencyId,
        type:
          typeFilter === "all" ? undefined : toApiPointType(typeFilter),
      });
      if (requestId !== pointsRequestIdRef.current) return;

      setPoints(data.points);
      setTotal(data.total);
    } catch (loadError) {
      if (requestId !== pointsRequestIdRef.current) return;
      setError(handleError(loadError).message);
      setPoints([]);
      setTotal(0);
    } finally {
      if (requestId === pointsRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [currencyId, offset, typeFilter, userId]);

  const visiblePoints = useMemo(() => {
    if (typeFilter === "all") return points;
    return points.filter((point) => matchesPointTypeFilter(point.type, typeFilter));
  }, [points, typeFilter]);

  useEffect(() => {
    void loadPoints();
  }, [loadPoints, refreshKey]);

  useEffect(() => {
    setOffset(0);
  }, [currencyId, typeFilter, userId]);

  const currencyOptions = useMemo(
    () => [
      { value: "all" as const, label: "ทุกสกุล" },
      ...currencies.map((currency) => ({
        value: currency.id,
        label: currency.name,
      })),
    ],
    [currencies],
  );

  const typeOptions = useMemo(
    () => [
      { value: "all" as const, label: "ทุกประเภท" },
      { value: "earn" as const, label: "เพิ่ม" },
      { value: "spend" as const, label: "ลด" },
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
          ประวัติ Point
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            value={currencyId}
            options={currencyOptions}
            onChange={(value) => {
              setCurrencyId(value);
              setOffset(0);
            }}
          />
          <Select
            value={typeFilter}
            options={typeOptions}
            onChange={(value) => {
              setTypeFilter(value);
              setOffset(0);
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <TableSkeleton rows={4} columns={6} cellClassName="px-3 py-3" />
        ) : error ? (
          <p className="text-sm text-red-100">{error}</p>
        ) : visiblePoints.length === 0 ? (
          <p className="text-sm text-gray-100">ไม่มีประวัติ point</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                <tr>
                  <th className="px-3 py-3 font-medium">วันที่</th>
                  <th className="px-3 py-3 font-medium">รายการ</th>
                  <th className="px-3 py-3 font-medium">สกุล</th>
                  <th className="px-3 py-3 font-medium">ประเภท</th>
                  <th className="px-3 py-3 font-medium">แหล่งที่มา</th>
                  <th className="px-3 py-3 font-medium text-right">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {visiblePoints.map((point) => (
                  <tr
                    key={point.id}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <td className="px-3 py-3 text-defualt-text">
                      {formatDateTime(point.given_date)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-defualt-text">
                        {point.name}
                      </p>
                      {point.admin_note ? (
                        <p className="mt-0.5 text-xs text-gray-100">
                          {String(point.admin_note)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-defualt-text">
                      {point.currency.name}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          isPointEarn(point.type)
                            ? "bg-brown-yellow-5 text-brown-100"
                            : "bg-gray-10 text-gray-100"
                        }`}
                      >
                        {formatPointType(point.type)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-defualt-text">
                      {formatPointSource(point.source.kind)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-semibold ${
                        isPointEarn(point.type) ? "text-brown-100" : "text-red-100"
                      }`}
                    >
                      {isPointEarn(point.type) ? "+" : "-"}
                      {formatNumber(point.value)}
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
    </section>
  );
}
