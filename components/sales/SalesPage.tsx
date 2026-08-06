"use client";

import SaleDetailModal, { StatusBadge } from "@/components/sales/SaleDetailModal";
import SourceBadge from "@/components/sales/SourceBadge";
import {
  getZortoutSaleSyncProgress,
  useZortoutSaleSyncJob,
} from "@/components/sales/useZortoutSaleSyncJob";
import { TableSkeleton } from "@/components/util/Skeleton";
import {
  getSales,
  getZortoutSaleSyncStatus,
  startZortoutSaleSync,
} from "@/services/sales/sales";
import type { PortalSale, SaleSource, SaleStatus } from "@/services/sales/types";
import { useApp } from "@/providers/app-provider";
import { handleError } from "@/utils/errors";
import { displayValue, formatNumber } from "@/utils/format";
import { isAdmin } from "@/utils/roles";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 20;

type StatusFilter = SaleStatus | "all";
type SourceFilter = SaleSource | "all";

export default function SalesPage() {
  const { me } = useApp();
  const [sales, setSales] = useState<PortalSale[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("paid");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [missingCount, setMissingCount] = useState(0);
  const [zortoutConfigured, setZortoutConfigured] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isStartingSync, setIsStartingSync] = useState(false);

  const canSync = isAdmin(me);

  const statusParam = useMemo(
    () => (statusFilter === "all" ? undefined : statusFilter),
    [statusFilter],
  );
  const sourceParam = useMemo(
    () => (sourceFilter === "all" ? undefined : sourceFilter),
    [sourceFilter],
  );

  const loadSyncStatus = useCallback(async () => {
    if (!canSync) return;

    try {
      const status = await getZortoutSaleSyncStatus();
      setMissingCount(status.missing_count);
      setZortoutConfigured(status.zortout_configured);
    } catch {
      setMissingCount(0);
      setZortoutConfigured(false);
    }
  }, [canSync]);

  const loadSales = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await getSales({
        status: statusParam,
        source: sourceParam,
        search,
        limit: PAGE_SIZE,
        offset,
      });
      setSales(data.sales);
      setTotal(data.total);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setSales([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, search, sourceParam, statusParam]);

  const handleSyncComplete = useCallback(async () => {
    await Promise.all([loadSales(), loadSyncStatus()]);
    setSyncMessage("Sync รายการขายจาก Zortout เสร็จแล้ว");
    setTimeout(() => setSyncMessage(null), 4000);
  }, [loadSales, loadSyncStatus]);

  const {
    job: syncJob,
    isActive: isSyncActive,
    error: syncJobError,
    setJob: setSyncJob,
    refreshJob: refreshSyncJob,
  } = useZortoutSaleSyncJob(handleSyncComplete);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  useEffect(() => {
    void loadSyncStatus();
  }, [loadSyncStatus]);

  useEffect(() => {
    setOffset(0);
  }, [statusFilter, sourceFilter, search]);

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleStartSync = async () => {
    setIsStartingSync(true);
    setError(null);
    setSyncMessage(null);

    try {
      const response = await startZortoutSaleSync();
      setSyncJob(response.job);
      await refreshSyncJob(response.job.id);
    } catch (startError) {
      setError(handleError(startError).message);
    } finally {
      setIsStartingSync(false);
    }
  };

  const statusTabs: { value: StatusFilter; label: string }[] = [
    { value: "paid", label: "ชำระแล้ว" },
    { value: "void", label: "ยกเลิก" },
    { value: "all", label: "ทั้งหมด" },
  ];

  const sourceTabs: { value: SourceFilter; label: string }[] = [
    { value: "all", label: "ทุกแหล่งที่มา" },
    { value: "zortout", label: "Zortout" },
    { value: "omisell", label: "Omisell" },
    { value: "manual", label: "Manual" },
    { value: "other", label: "Other" },
  ];

  const syncProgress = syncJob ? getZortoutSaleSyncProgress(syncJob) : 0;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            รายการขาย
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            รายการขายที่ชำระแล้วจาก Zortout และแหล่งอื่น ๆ
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row md:items-center">
          <form onSubmit={handleSearch} className="relative w-full md:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-100" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า, สมาชิก..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pr-4 pl-10 text-sm outline-none focus:border-brown-100"
            />
          </form>

          {canSync && zortoutConfigured && (
            <button
              type="button"
              onClick={() => void handleStartSync()}
              disabled={
                isStartingSync ||
                isSyncActive ||
                missingCount <= 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-defualt-text hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4${isStartingSync || isSyncActive ? " animate-spin" : ""}`}
              />
              Sync Zortout
              {missingCount > 0 ? ` (${missingCount})` : ""}
            </button>
          )}
        </div>
      </div>

      {canSync && zortoutConfigured && missingCount > 0 && !isSyncActive && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          มีออเดอร์ Zortout ที่ชำระแล้วจาก webhook {missingCount} รายการ
          ที่ยังไม่ได้ sync เป็นรายการขาย
        </div>
      )}

      {isSyncActive && syncJob && (
        <div className="mb-4 rounded-xl border border-brown-100/30 bg-brown-50 px-4 py-3 text-sm text-defualt-text">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span>
              กำลัง sync จาก Zortout... {syncJob.processed}/{syncJob.total}
            </span>
            <span>{syncProgress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-brown-100 transition-all"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
          {syncJob.current_order && (
            <p className="mt-2 text-xs text-gray-100">
              กำลังดึงออเดอร์{" "}
              {syncJob.current_order.order_number ||
                syncJob.current_order.zortout_order_id}
            </p>
          )}
        </div>
      )}

      {syncMessage && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {syncMessage}
        </div>
      )}

      {(error || syncJobError) && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || syncJobError}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-brown-100 text-white"
                : "bg-white text-gray-100 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {sourceTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setSourceFilter(tab.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              sourceFilter === tab.value
                ? "border-brown-100 bg-brown-50 text-brown-100"
                : "border-gray-200 bg-white text-gray-100 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton columns={8} rows={8} />
        ) : sales.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-100">
            ไม่พบรายการขาย
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-100">
                <tr>
                  <th className="px-4 py-3 font-medium">เลขออเดอร์</th>
                  <th className="px-4 py-3 font-medium">แหล่งที่มา</th>
                  <th className="px-4 py-3 font-medium">วันที่</th>
                  <th className="px-4 py-3 font-medium">ลูกค้า</th>
                  <th className="px-4 py-3 font-medium">สมาชิก</th>
                  <th className="px-4 py-3 font-medium text-right">ยอดรวม</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium text-center">ดู</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-defualt-text">
                      {displayValue(sale.order_number || sale.external_id)}
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge
                        source={sale.source}
                        label={sale.source_label}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      {displayValue(sale.order_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-100">
                      {displayValue(sale.customer_name)}
                    </td>
                    <td className="px-4 py-3">
                      {sale.user ? (
                        <Link
                          href={`/dashboard/members/${sale.user.id}`}
                          className="text-brown-100 hover:underline"
                        >
                          {sale.user.display_name}
                        </Link>
                      ) : (
                        <span className="text-gray-100">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatNumber(sale.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={sale.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSaleId(sale.id)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-gray-100 hover:bg-gray-100 hover:text-brown-100"
                        aria-label="ดูรายละเอียด"
                      >
                        <Eye className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-100">
          <span>
            หน้า {currentPage} / {totalPages} ({total} รายการ)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
              ก่อนหน้า
            </button>
            <button
              type="button"
              disabled={!canGoNext}
              onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 disabled:opacity-40"
            >
              ถัดไป
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {selectedSaleId && (
        <SaleDetailModal
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
        />
      )}
    </div>
  );
}
