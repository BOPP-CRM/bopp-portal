"use client";

import StatusBadge from "@/components/warranties/StatusBadge";
import MemberAvatar from "@/components/members/MemberAvatar";
import FilterGroup, { FilterBar } from "@/components/util/FilterGroup";
import { compactTableClassName } from "@/components/util/data-table";
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
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;

type StatusFilter = number | "all";

export default function WarrantiesPage() {
  const router = useRouter();
  const [warranties, setWarranties] = useState<PortalWarranty[]>([]);
  const [statuses, setStatuses] = useState<WarrantyStatus[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadRequestId = useRef(0);

  const loadWarranties = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setError(null);
    setLoading(true);

    try {
      const data = await getWarranties({
        status_id: statusParam,
        search,
        limit: PAGE_SIZE,
        offset,
      });
      if (requestId !== loadRequestId.current) return;
      setWarranties(data.warranties);
      setTotal(data.total);
    } catch (loadError) {
      if (requestId !== loadRequestId.current) return;
      setError(handleError(loadError).message);
      setWarranties([]);
      setTotal(0);
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
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

  const statusTabs: { value: StatusFilter; label: string }[] = [
    ...statuses.map((status) => ({
      value: status.id as StatusFilter,
      label: status.label,
    })),
    { value: "all", label: "ทั้งหมด" },
  ];

  return (
    <div className="p-3 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            ลงทะเบียนรับประกันสินค้า
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            ตรวจสอบรายการที่สมาชิกส่งเข้ามาและอัปเดตสถานะ
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 md:max-w-3xl md:justify-end">
          <form onSubmit={handleSearch} className="relative min-w-72 flex-1 md:min-w-96">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-100" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ค้นหา Serial, เลขใบเสร็จ, ชื่อสมาชิก..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-10 text-base outline-none focus:border-brown-100"
            />
          </form>

          <Link
            href="/dashboard/warranties/config"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brown-100 px-3 py-2 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5"
          >
            <Settings className="size-4" />
            ตั้งค่า
          </Link>
        </div>
      </div>

      <FilterBar>
        <FilterGroup
          ariaLabel="สถานะรับประกัน"
          options={statusTabs}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </FilterBar>

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
                  onOpen={() => router.push(`/dashboard/warranties/${warranty.id}`)}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className={`w-full min-w-[920px] text-left ${compactTableClassName}`}>
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
                  </tr>
                </thead>
                <tbody>
                  {warranties.map((warranty) => (
                    <tr
                      key={warranty.id}
                      onClick={() => router.push(`/dashboard/warranties/${warranty.id}`)}
                      className="cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 hover:bg-gray-10"
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
    </div>
  );
}

function MemberCell({ user }: { user: PortalWarranty["user"] }) {
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
          {displayValue(user.line_user_id)}
        </p>
      </div>
    </div>
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
            {warranty.serial_number}
          </p>
          <p className="mt-1 text-xs text-gray-100">
            {formatDateTime(warranty.submitted_date)}
          </p>
        </div>
        <StatusBadge status={warranty.status} />
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
