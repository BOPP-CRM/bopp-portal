"use client";

import AiSyncConfirmDialog, {
  useAiSyncGate,
} from "@/components/sales/AiSyncConfirmDialog";
import MemberAvatar from "@/components/members/MemberAvatar";
import SaleDetailModal, { StatusBadge } from "@/components/sales/SaleDetailModal";
import SourceBadge from "@/components/sales/SourceBadge";
import {
  getReceiptSaleSyncProgress,
  useReceiptSaleSyncJob,
} from "@/components/sales/useReceiptSaleSyncJob";
import {
  getZortoutSaleSyncProgress,
  useZortoutSaleSyncJob,
} from "@/components/sales/useZortoutSaleSyncJob";
import ActionMenu from "@/components/util/ActionMenu";
import { TableSkeleton } from "@/components/util/Skeleton";
import { useApp } from "@/providers/app-provider";
import {
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
import { handleError } from "@/utils/errors";
import { displayValue, formatNumber } from "@/utils/format";
import { isAdmin } from "@/utils/roles";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 20;
const OPENAI_LOGO = "/openai.png";

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
  const [receiptMissingCount, setReceiptMissingCount] = useState(0);
  const [zortoutConfigured, setZortoutConfigured] = useState(false);
  const [openAiConfigured, setOpenAiConfigured] = useState<boolean | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isStartingSync, setIsStartingSync] = useState(false);
  const [isStartingReceiptSync, setIsStartingReceiptSync] = useState(false);
  const [showReceiptAiConfirm, setShowReceiptAiConfirm] = useState(false);

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
  const showSyncButton = canSync && zortoutConfigured;
  const showReceiptSyncButton = canSync;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            รายการขาย
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            ทั้งหมด {formatNumber(total)} รายการ
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {showReceiptSyncButton ? (
            <button
              type="button"
              onClick={handleRequestReceiptSync}
              disabled={
                isStartingReceiptSync ||
                isReceiptSyncActive ||
                receiptMissingCount <= 0
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-4xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-50"
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
              Sync จากใบเสร็จ (AI)
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
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-4xl bg-brown-100 px-4 py-3 text-sm font-medium text-white transition hover:bg-brown-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4${isStartingSync || isSyncActive ? " animate-spin" : ""}`}
              />
              Sync ข้อมูลจาก Zortout
              {missingCount > 0 ? ` (${formatNumber(missingCount)})` : ""}
            </button>
          ) : null}

          <form onSubmit={handleSearch} className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-100" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ค้นหาเลขออเดอร์, ชื่อลูกค้า..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pr-4 pl-10 text-sm outline-none focus:border-brown-100"
            />
          </form>
        </div>
      </div>

      {showReceiptSyncButton &&
      receiptMissingCount > 0 &&
      !isReceiptSyncActive ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-4 py-3 text-sm text-brown-100">
          มีใบเสร็จที่อนุมัติแล้ว {formatNumber(receiptMissingCount)} รายการ
          ที่ยังไม่ได้ sync เป็นรายการขาย
        </div>
      ) : null}

      {showSyncButton && missingCount > 0 && !isSyncActive ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-4 py-3 text-sm text-brown-100">
          มีออเดอร์ Zortout ที่ชำระแล้ว {formatNumber(missingCount)} รายการ
          ที่ยังไม่ได้ sync เป็นรายการขาย
        </div>
      ) : null}

      {isReceiptSyncActive && receiptSyncJob ? (
        <div className="mb-4 rounded-2xl border border-brown-yellow-20 bg-brown-yellow-5 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-defualt-text">
                Sync ใบเสร็จไปรายการขาย (AI)
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
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-4 py-3 text-sm text-brown-100">
          {syncMessage}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`cursor-pointer rounded-4xl px-4 py-2 text-sm font-medium transition ${
              statusFilter === tab.value
                ? "bg-brown-100 text-white"
                : "border border-gray-200 bg-white text-defualt-text hover:bg-gray-10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {sourceTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setSourceFilter(tab.value)}
            className={`cursor-pointer rounded-4xl px-3 py-1.5 text-xs font-medium transition ${
              sourceFilter === tab.value
                ? "bg-brown-yellow-5 text-brown-100"
                : "border border-gray-200 bg-white text-gray-100 hover:bg-gray-10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={6} columns={8} />
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
                  onOpen={() => setSelectedSaleId(sale.id)}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] text-left text-sm">
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
                    <th className="px-4 py-4 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-gray-200 last:border-b-0"
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
                      <td className="px-4 py-4">
                        <ActionMenu
                          ariaLabel="ดูรายละเอียดการขาย"
                          items={[
                            {
                              label: "ดูรายละเอียด",
                              icon: <Eye className="size-4" />,
                              onClick: () => setSelectedSaleId(sale.id),
                            },
                          ]}
                        />
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

      {selectedSaleId ? (
        <SaleDetailModal
          saleId={selectedSaleId}
          openAiConfigured={openAiConfigured}
          onClose={() => setSelectedSaleId(null)}
          onUpdated={() => void loadSales()}
        />
      ) : null}

      <AiSyncConfirmDialog
        open={showReceiptAiConfirm}
        onClose={() => setShowReceiptAiConfirm(false)}
        onConfirm={() => void handleStartReceiptSync()}
        loading={isStartingReceiptSync}
        confirmText="เริ่ม Sync"
      />
    </div>
  );
}

function MemberCell({ user }: { user: SaleMember }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <MemberAvatar
        name={user.display_name}
        pictureUrl={user.picture_url}
        size="sm"
      />
      <div className="min-w-0">
        <Link
          href={`/dashboard/members/${user.id}`}
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
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-defualt-text">
            {displayValue(sale.order_number || sale.external_id)}
          </p>
          <p className="mt-1 text-xs text-gray-100">
            {displayValue(sale.order_date)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={sale.status} />
          <ActionMenu
            ariaLabel="ดูรายละเอียดการขาย"
            items={[
              {
                label: "ดูรายละเอียด",
                icon: <Eye className="size-4" />,
                onClick: onOpen,
              },
            ]}
          />
        </div>
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
