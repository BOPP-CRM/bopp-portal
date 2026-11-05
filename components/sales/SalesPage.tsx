"use client";

import AiSyncConfirmDialog, {
  useAiSyncGate,
} from "@/components/sales/AiSyncConfirmDialog";
import SalesExportModal from "@/components/sales/SalesExportModal";
import MemberAvatar from "@/components/members/MemberAvatar";
import { StatusBadge } from "@/components/sales/SaleDetailModal";
import SourceBadge from "@/components/sales/SourceBadge";
import {
  getReceiptSaleSyncProgress,
  useReceiptSaleSyncJob,
} from "@/components/sales/useReceiptSaleSyncJob";
import {
  getZortoutSaleSyncProgress,
  useZortoutSaleSyncJob,
} from "@/components/sales/useZortoutSaleSyncJob";
import FilterGroup, { FilterBar } from "@/components/util/FilterGroup";
import TableExport from "@/components/util/TableExport";
import { collectPages } from "@/utils/csv";
import { compactTableClassName } from "@/components/util/data-table";
import { TableSkeleton } from "@/components/util/Skeleton";
import { useApp } from "@/providers/app-provider";
import {
  exportSales,
  getSales,
  getReceiptSaleSyncStatus,
  getZortoutSaleSyncStatus,
  startReceiptSaleSync,
  startZortoutSaleSync,
} from "@/services/sales/sales";
import type {
  PortalSale,
  SaleMember,
  SaleSource,
  SaleStatus,
} from "@/services/sales/types";
import { SALE_STATUS_LABELS } from "@/services/sales/types";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { displayValue, formatNumber } from "@/utils/format";
import { isAdmin } from "@/utils/roles";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;
const OPENAI_LOGO = "/openai.png";

type StatusFilter = SaleStatus | "all";
type SourceFilter = SaleSource | "all";

export default function SalesPage() {
  const { me } = useApp();
  const router = useRouter();
  const [sales, setSales] = useState<PortalSale[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("paid");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingCount, setMissingCount] = useState(0);
  const [receiptMissingCount, setReceiptMissingCount] = useState(0);
  const [zortoutConfigured, setZortoutConfigured] = useState(false);
  const [openAiConfigured, setOpenAiConfigured] = useState<boolean | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isStartingSync, setIsStartingSync] = useState(false);
  const [isStartingReceiptSync, setIsStartingReceiptSync] = useState(false);
  const [showReceiptAiConfirm, setShowReceiptAiConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const canSync = isAdmin(me);
  const { requireOpenAiConfigured } = useAiSyncGate(openAiConfigured);

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
      const [zortoutStatus, receiptStatus] = await Promise.all([
        getZortoutSaleSyncStatus(),
        getReceiptSaleSyncStatus(),
      ]);
      setMissingCount(zortoutStatus.missing_count);
      setZortoutConfigured(zortoutStatus.zortout_configured);
      setReceiptMissingCount(receiptStatus.missing_count);
      setOpenAiConfigured(receiptStatus.openai_configured);
    } catch {
      setMissingCount(0);
      setZortoutConfigured(false);
      setReceiptMissingCount(0);
      setOpenAiConfigured(false);
    }
  }, [canSync]);

  const loadRequestId = useRef(0);

  const loadSales = useCallback(async () => {
    const requestId = ++loadRequestId.current;
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
      if (requestId !== loadRequestId.current) return;
      setSales(data.sales);
      setTotal(data.total);
    } catch (loadError) {
      if (requestId !== loadRequestId.current) return;
      setError(handleError(loadError).message);
      setSales([]);
      setTotal(0);
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }, [offset, search, sourceParam, statusParam]);

  const handleSyncComplete = useCallback(async () => {
    await Promise.all([loadSales(), loadSyncStatus()]);
    setSyncMessage("Sync รายการขายจาก Zortout เสร็จแล้ว");
    setTimeout(() => setSyncMessage(null), 4000);
  }, [loadSales, loadSyncStatus]);

  const handleReceiptSyncComplete = useCallback(async () => {
    await Promise.all([loadSales(), loadSyncStatus()]);
    setSyncMessage("Sync ใบเสร็จไปรายการขายด้วย AI เสร็จแล้ว");
    setTimeout(() => setSyncMessage(null), 4000);
  }, [loadSales, loadSyncStatus]);

  const {
    job: syncJob,
    isActive: isSyncActive,
    error: syncJobError,
    setJob: setSyncJob,
    refreshJob: refreshSyncJob,
  } = useZortoutSaleSyncJob(handleSyncComplete);

  const {
    job: receiptSyncJob,
    isActive: isReceiptSyncActive,
    error: receiptSyncJobError,
    setJob: setReceiptSyncJob,
    refreshJob: refreshReceiptSyncJob,
  } = useReceiptSaleSyncJob(handleReceiptSyncComplete);

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

  const handleStartReceiptSync = async () => {
    setIsStartingReceiptSync(true);
    setError(null);
    setSyncMessage(null);

    try {
      const response = await startReceiptSaleSync(true);
      setReceiptSyncJob(response.job);
      await refreshReceiptSyncJob(response.job.id);
      setShowReceiptAiConfirm(false);
    } catch (startError) {
      setError(handleError(startError).message);
    } finally {
      setIsStartingReceiptSync(false);
    }
  };

  const handleRequestReceiptSync = () => {
    requireOpenAiConfigured(() => {
      if (receiptMissingCount <= 0) return;
      setShowReceiptAiConfirm(true);
    });
  };

  const handleExportSales = async (year: number, month: number) => {
    setIsExporting(true);
    setError(null);

    try {
      await exportSales(year, month);
      setShowExportModal(false);
      setSyncMessage("Export รายการขายสำเร็จ");
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (exportError) {
      setError(handleError(exportError).message);
    } finally {
      setIsExporting(false);
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
    { value: "receipt", label: "ใบเสร็จ" },
    { value: "omisell", label: "Omisell" },
    { value: "other", label: "Other" },
  ];

  const syncProgress = syncJob ? getZortoutSaleSyncProgress(syncJob) : 0;
  const receiptSyncProgress = receiptSyncJob
    ? getReceiptSaleSyncProgress(receiptSyncJob)
    : 0;
  const showSyncButton =
    canSync &&
    zortoutConfigured &&
    (missingCount > 0 || isSyncActive || isStartingSync);
  const showReceiptSyncButton =
    canSync &&
    (receiptMissingCount > 0 || isReceiptSyncActive || isStartingReceiptSync);

  return (
    <div className="p-3 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            รายการขาย
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            ทั้งหมด {formatNumber(total)} รายการ
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-3">
          <TableExport
            filename="sales"
            columns={[
              { id: "order", label: "เลขที่", value: (sale) => sale.order_number || sale.external_id },
              { id: "source", label: "แหล่งที่มา", value: (sale) => sale.source_label },
              { id: "status", label: "สถานะ", value: (sale) => SALE_STATUS_LABELS[sale.status] },
              { id: "member", label: "สมาชิก", value: (sale) => sale.user ? sale.user.display_name : displayValue(sale.customer_name) },
              { id: "phone", label: "เบอร์โทร", value: (sale) => displayValue(sale.user ? sale.user.phone : sale.customer_phone) },
              { id: "amount", label: "มูลค่า", value: (sale) => sale.amount },
              { id: "payment", label: "ยอดชำระ", value: (sale) => sale.payment_amount },
              { id: "payment_status", label: "สถานะชำระ", value: (sale) => displayValue(sale.payment_status) },
              { id: "date", label: "วันที่", value: (sale) => formatDateTime(sale.order_date) },
            ]}
            loadRows={() =>
              collectPages(async (pageOffset, limit) => {
                const data = await getSales({
                  status: statusParam,
                  source: sourceParam,
                  search,
                  limit,
                  offset: pageOffset,
                });
                return { rows: data.sales, total: data.total };
              })
            }
          />
          {canSync ? (
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-4xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-defualt-text transition hover:bg-gray-10"
            >
              <Download className="size-4" />
              Export Excel
            </button>
          ) : null}

          {showReceiptSyncButton ? (
            <button
              type="button"
              onClick={handleRequestReceiptSync}
              disabled={
                isStartingReceiptSync ||
                isReceiptSyncActive ||
                receiptMissingCount <= 0
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-4xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStartingReceiptSync || isReceiptSyncActive ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <img
                  src={OPENAI_LOGO}
                  alt=""
                  className="size-4 shrink-0 object-contain"
                />
              )}
              Sync จากใบเสร็จ
              {receiptMissingCount > 0
                ? ` (${formatNumber(receiptMissingCount)})`
                : ""}
            </button>
          ) : null}

          {showSyncButton ? (
            <button
              type="button"
              onClick={() => void handleStartSync()}
              disabled={isStartingSync || isSyncActive || missingCount <= 0}
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-4xl bg-brown-100 px-3 py-2 text-sm font-medium text-white transition hover:bg-brown-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4${isStartingSync || isSyncActive ? " animate-spin" : ""}`}
              />
              Sync จาก Zortout
              {missingCount > 0 ? ` (${formatNumber(missingCount)})` : ""}
            </button>
          ) : null}

          <form onSubmit={handleSearch} className="relative w-full min-w-56 sm:w-96">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-100" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-10 text-base outline-none focus:border-brown-100"
            />
          </form>
        </div>
      </div>

      {showReceiptSyncButton &&
      receiptMissingCount > 0 &&
      !isReceiptSyncActive ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-3 py-2 text-sm text-brown-100">
          มีใบเสร็จที่อนุมัติแล้ว {formatNumber(receiptMissingCount)} รายการ
          ที่ยังไม่ได้ sync เป็นรายการขาย
        </div>
      ) : null}

      {showSyncButton && missingCount > 0 && !isSyncActive ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-3 py-2 text-sm text-brown-100">
          มีออเดอร์ Zortout ที่ชำระแล้ว {formatNumber(missingCount)} รายการ
          ที่ยังไม่ได้ sync เป็นรายการขาย
        </div>
      ) : null}

      {isReceiptSyncActive && receiptSyncJob ? (
        <div className="mb-4 rounded-2xl border border-brown-yellow-20 bg-brown-yellow-5 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-defualt-text">
                Sync ใบเสร็จไปรายการขาย
              </p>
              <p className="mt-1 text-sm text-gray-100">
                กำลัง sync... {formatNumber(receiptSyncJob.processed)} /{" "}
                {formatNumber(receiptSyncJob.total)}
              </p>
            </div>
            <Loader2 className="size-5 shrink-0 animate-spin text-brown-100" />
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-gray-100">
              <span>
                สำเร็จ {formatNumber(receiptSyncJob.synced)} · ข้าม{" "}
                {formatNumber(receiptSyncJob.skipped)} · ล้มเหลว{" "}
                {formatNumber(receiptSyncJob.failed)}
              </span>
              <span>{receiptSyncProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-brown-100 transition-all duration-300"
                style={{ width: `${receiptSyncProgress}%` }}
              />
            </div>
          </div>
          {receiptSyncJob.current_receipt ? (
            <p className="mt-3 text-xs text-gray-100">
              กำลังอ่านใบเสร็จ {receiptSyncJob.current_receipt.receipt_number}
            </p>
          ) : null}
          {receiptSyncJob.last_error ? (
            <p className="mt-3 text-xs text-red-100">
              {receiptSyncJob.last_error}
            </p>
          ) : null}
        </div>
      ) : null}

      {isSyncActive && syncJob ? (
        <div className="mb-4 rounded-2xl border border-brown-yellow-20 bg-brown-yellow-5 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-defualt-text">
                Sync รายการขายจาก Zortout
              </p>
              <p className="mt-1 text-sm text-gray-100">
                กำลัง sync... {formatNumber(syncJob.processed)} /{" "}
                {formatNumber(syncJob.total)}
              </p>
            </div>
            <Loader2 className="size-5 shrink-0 animate-spin text-brown-100" />
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-gray-100">
              <span>
                สำเร็จ {formatNumber(syncJob.synced)} · ข้าม{" "}
                {formatNumber(syncJob.skipped)} · ล้มเหลว{" "}
                {formatNumber(syncJob.failed)}
              </span>
              <span>{syncProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-brown-100 transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
          {syncJob.current_order ? (
            <p className="mt-3 text-xs text-gray-100">
              กำลังดึงออเดอร์{" "}
              {syncJob.current_order.order_number ||
                syncJob.current_order.zortout_order_id}
            </p>
          ) : null}
          {syncJob.last_error ? (
            <p className="mt-3 text-xs text-red-100">{syncJob.last_error}</p>
          ) : null}
        </div>
      ) : null}

      {syncMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-3 py-2 text-sm text-brown-100">
          {syncMessage}
        </div>
      ) : null}

      <FilterBar>
        <FilterGroup
          label="สถานะ"
          options={statusTabs}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <FilterGroup
          label="แหล่งที่มา"
          options={sourceTabs}
          value={sourceFilter}
          onChange={setSourceFilter}
        />
      </FilterBar>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={6} columns={7} />
        ) : error || syncJobError || receiptSyncJobError ? (
          <div className="p-6 text-sm text-red-100">
            {error || syncJobError || receiptSyncJobError}
          </div>
        ) : sales.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ไม่พบรายการขาย</div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 lg:hidden">
              {sales.map((sale) => (
                <SaleCard
                  key={sale.id}
                  sale={sale}
                  onOpen={() => router.push(`/dashboard/sales/${sale.id}`)}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className={`w-full min-w-[860px] text-left ${compactTableClassName}`}>
                <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                  <tr>
                    <th className="px-4 py-4 font-medium">เลขออเดอร์</th>
                    <th className="px-4 py-4 font-medium">แหล่งที่มา</th>
                    <th className="px-4 py-4 font-medium whitespace-nowrap">
                      วันที่
                    </th>
                    <th className="px-4 py-4 font-medium">ลูกค้า</th>
                    <th className="min-w-[160px] px-4 py-4 font-medium">
                      สมาชิก
                    </th>
                    <th className="px-4 py-4 font-medium whitespace-nowrap">
                      ยอดรวม
                    </th>
                    <th className="px-4 py-4 font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      onClick={() => router.push(`/dashboard/sales/${sale.id}`)}
                      className="cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 hover:bg-gray-10"
                    >
                      <td className="max-w-[160px] truncate px-4 py-4 font-medium text-defualt-text">
                        {displayValue(sale.order_number || sale.external_id)}
                      </td>
                      <td className="px-4 py-4">
                        <SourceBadge
                          source={sale.source}
                          label={sale.source_label}
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-100">
                        {displayValue(sale.order_date)}
                      </td>
                      <td className="px-4 py-4 text-defualt-text">
                        {displayValue(sale.customer_name)}
                      </td>
                      <td className="px-4 py-4">
                        {sale.user ? (
                          <MemberCell user={sale.user} />
                        ) : (
                          <span className="text-gray-100">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap font-medium text-brown-100">
                        {formatNumber(sale.amount)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={sale.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && !error && total > 0 ? (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
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

      <AiSyncConfirmDialog
        open={showReceiptAiConfirm}
        onClose={() => setShowReceiptAiConfirm(false)}
        onConfirm={() => void handleStartReceiptSync()}
        loading={isStartingReceiptSync}
        confirmText="เริ่ม Sync"
      />

      <SalesExportModal
        open={showExportModal}
        loading={isExporting}
        onClose={() => {
          if (!isExporting) {
            setShowExportModal(false);
          }
        }}
        onConfirm={(year, month) => void handleExportSales(year, month)}
      />
    </div>
  );
}

function MemberCell({ user }: { user: SaleMember }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <MemberAvatar
        name={user.display_name}
        pictureUrl={user.picture_url}
        size="xs"
      />
      <div className="min-w-0">
        <Link
          href={`/dashboard/members/${user.id}`}
          onClick={(event) => event.stopPropagation()}
          className="block truncate font-medium text-defualt-text hover:text-brown-100"
        >
          {user.display_name}
        </Link>
        <p className="truncate text-xs text-gray-100">
          {displayValue(user.phone || user.email || user.line_user_id)}
        </p>
      </div>
    </div>
  );
}

function SaleCard({
  sale,
  onOpen,
}: {
  sale: PortalSale;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer space-y-2.5 p-3 text-sm transition-colors hover:bg-gray-10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-defualt-text">
            {displayValue(sale.order_number || sale.external_id)}
          </p>
          <p className="mt-1 text-xs text-gray-100">
            {displayValue(sale.order_date)}
          </p>
        </div>
        <StatusBadge status={sale.status} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SourceBadge source={sale.source} label={sale.source_label} />
      </div>

      {sale.user ? <MemberCell user={sale.user} /> : null}

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-gray-100">ลูกค้า</dt>
          <dd className="font-medium text-defualt-text">
            {displayValue(sale.customer_name)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-100">ยอดรวม</dt>
          <dd className="font-medium text-brown-100">
            {formatNumber(sale.amount)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
