"use client";

import StatusBadge from "@/components/warranties/StatusBadge";
import WarrantyDetailModal from "@/components/warranties/WarrantyDetailModal";
import ActionMenu from "@/components/util/ActionMenu";
import { TableSkeleton } from "@/components/util/Skeleton";
import {
  getWarranties,
  getWarrantyConfig,
} from "@/services/warranties/warranties";
import type { PortalWarranty, WarrantyStatus } from "@/services/warranties/types";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { displayValue, formatNumber } from "@/utils/format";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 20;

type StatusFilter = number | "all";

export default function WarrantiesPage() {
  const [warranties, setWarranties] = useState<PortalWarranty[]>([]);
  const [statuses, setStatuses] = useState<WarrantyStatus[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<number | null>(
    null,
  );

  const statusParam = useMemo(
    () => (statusFilter === "all" ? undefined : statusFilter),
    [statusFilter],
  );

  const loadStatuses = useCallback(async () => {
    try {
      const config = await getWarrantyConfig();
      setStatuses(config.statuses ?? []);
    } catch {
      setStatuses([]);
    }
  }, []);

  const loadWarranties = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await getWarranties({
        status_id: statusParam,
        search,
        limit: PAGE_SIZE,
        offset,
      });
      setWarranties(data.warranties);
      setTotal(data.total);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setWarranties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, search, statusParam]);

  useEffect(() => {
    void loadStatuses();
  }, [loadStatuses]);

  useEffect(() => {
    void loadWarranties();
  }, [loadWarranties]);

  useEffect(() => {
    setOffset(0);
  }, [statusFilter, search]);

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleSuccess = async () => {
    setSuccessMessage("บันทึกข้อมูลสำเร็จ");
    await loadWarranties();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const statusTabs: { value: StatusFilter; label: string }[] = [
    ...statuses.map((status) => ({
      value: status.id as StatusFilter,
      label: status.label,
    })),
    { value: "all", label: "ทั้งหมด" },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            ลงทะเบียนรับประกันสินค้า
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            ตรวจสอบรายการที่สมาชิกส่งเข้ามาและอัปเดตสถานะ
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row md:items-center">
          <form onSubmit={handleSearch} className="relative w-full md:flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-100" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ค้นหา Serial, เลขใบเสร็จ, ชื่อสมาชิก..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pr-4 pl-10 text-sm outline-none focus:border-brown-100"
            />
          </form>

          <Link
            href="/dashboard/warranties/config"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brown-100 px-4 py-3 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5"
          >
            <Settings className="size-4" />
            ตั้งค่า
          </Link>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-4 py-3 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={String(tab.value)}
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

      <p className="mb-4 text-sm text-gray-100">
        ทั้งหมด {formatNumber(total)} รายการ
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={6} columns={8} avatarColumn />
        ) : error ? (
          <div className="p-6 text-sm text-red-100">{error}</div>
        ) : warranties.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ไม่พบรายการรับประกัน</div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 lg:hidden">
              {warranties.map((warranty) => (
                <WarrantyCard
                  key={warranty.id}
                  warranty={warranty}
                  onOpen={() => setSelectedWarrantyId(warranty.id)}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                  <tr>
                    <th className="px-4 py-4 font-medium">Serial Number</th>
                    <th className="px-4 py-4 font-medium">สินค้า</th>
                    <th className="min-w-[200px] px-4 py-4 font-medium">
                      สมาชิก
                    </th>
                    <th className="px-4 py-4 font-medium">เลขใบเสร็จ</th>
                    <th className="px-4 py-4 font-medium">ช่องทางซื้อ</th>
                    <th className="px-4 py-4 font-medium">วันที่ซื้อ</th>
                    <th className="px-4 py-4 font-medium">สถานะ</th>
                    <th className="px-4 py-4 font-medium whitespace-nowrap">
                      วันที่ส่ง
                    </th>
                    <th className="px-4 py-4 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {warranties.map((warranty) => (
                    <tr
                      key={warranty.id}
                      className="border-b border-gray-200 last:border-b-0"
                    >
                      <td className="px-4 py-4 font-medium text-defualt-text">
                        {warranty.serial_number}
                      </td>
                      <td className="px-4 py-4 text-defualt-text">
                        {warranty.product.name}
                      </td>
                      <td className="px-4 py-4">
                        <MemberCell user={warranty.user} />
                      </td>
                      <td className="px-4 py-4 text-defualt-text">
                        {warranty.receipt_number}
                      </td>
                      <td className="px-4 py-4 text-defualt-text">
                        {warranty.contributor.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-100">
                        {warranty.purchase_date}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={warranty.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-gray-100">
                        {formatDateTime(warranty.submitted_date)}
                      </td>
                      <td className="px-4 py-4">
                        <WarrantyActionsMenu
                          onOpen={() => setSelectedWarrantyId(warranty.id)}
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

      {selectedWarrantyId ? (
        <WarrantyDetailModal
          warrantyId={selectedWarrantyId}
          onClose={() => setSelectedWarrantyId(null)}
          onSuccess={handleSuccess}
        />
      ) : null}
    </div>
  );
}

function MemberCell({ user }: { user: PortalWarranty["user"] }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {user.picture_url ? (
        <img
          src={String(user.picture_url)}
          alt={user.display_name}
          className="size-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brown-100 text-xs font-medium text-white">
          {user.display_name.charAt(0)}
        </div>
      )}
      <div className="min-w-0">
        <Link
          href={`/dashboard/members/${user.id}`}
          className="block truncate font-medium text-defualt-text hover:text-brown-100"
        >
          {user.display_name}
        </Link>
        <p className="truncate text-xs text-gray-100">
          {displayValue(user.line_user_id)}
        </p>
      </div>
    </div>
  );
}

function WarrantyActionsMenu({ onOpen }: { onOpen: () => void }) {
  return (
    <ActionMenu
      ariaLabel="ดูรายละเอียดการรับประกัน"
      items={[
        {
          label: "ดูรายละเอียด",
          icon: <Eye className="size-4" />,
          onClick: onOpen,
        },
      ]}
    />
  );
}

function WarrantyCard({
  warranty,
  onOpen,
}: {
  warranty: PortalWarranty;
  onOpen: () => void;
}) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-defualt-text">
            {warranty.serial_number}
          </p>
          <p className="mt-1 text-xs text-gray-100">
            {formatDateTime(warranty.submitted_date)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={warranty.status} />
          <WarrantyActionsMenu onOpen={onOpen} />
        </div>
      </div>

      <MemberCell user={warranty.user} />

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-gray-100">สินค้า</dt>
          <dd className="font-medium text-defualt-text">
            {warranty.product.name}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-100">เลขใบเสร็จ</dt>
          <dd className="font-medium text-defualt-text">
            {warranty.receipt_number}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-100">ช่องทางซื้อ</dt>
          <dd className="font-medium text-defualt-text">
            {warranty.contributor.name}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-100">วันที่ซื้อ</dt>
          <dd className="font-medium text-defualt-text">
            {warranty.purchase_date}
          </dd>
        </div>
      </dl>
    </div>
  );
}
