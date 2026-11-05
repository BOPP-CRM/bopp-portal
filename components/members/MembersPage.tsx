"use client";

import ZortoutMemberSyncProgress, {
  ZortoutSyncStatusBadge,
} from "@/components/members/ZortoutMemberSyncProgress";
import MemberAvatar from "@/components/members/MemberAvatar";
import ActionMenu from "@/components/util/ActionMenu";
import { compactTableClassName } from "@/components/util/data-table";
import TableExport from "@/components/util/TableExport";
import { collectPages } from "@/utils/csv";
import { TableSkeleton } from "@/components/util/Skeleton";
import dialog from "@/components/util/dialog";
import { getUsers } from "@/services/members/members";
import type { PortalUser } from "@/services/members/types";
import {
  getZortoutStatus,
  startZortoutMemberSync,
  syncUserToZortout,
} from "@/services/zortout/zortout";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import {
  displayValue,
  formatNumber,
  getDefaultPointBalance,
} from "@/utils/format";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

export default function MembersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zortoutReady, setZortoutReady] = useState(false);
  const [syncingUserId, setSyncingUserId] = useState<number | null>(null);
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [syncJobRefreshKey, setSyncJobRefreshKey] = useState(0);
  const [activeSyncJobId, setActiveSyncJobId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadRequestId = useRef(0);

  const loadUsers = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setError(null);
    setLoading(true);

    try {
      const data = await getUsers({
        search,
        limit: PAGE_SIZE,
        offset,
      });
      if (requestId !== loadRequestId.current) return;
      setUsers(data.users);
      setTotal(data.total);
    } catch (loadError) {
      if (requestId !== loadRequestId.current) return;
      setError(handleError(loadError).message);
      setUsers([]);
      setTotal(0);
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }, [offset, search]);

  const loadZortoutStatus = useCallback(async () => {
    try {
      const response = await getZortoutStatus();
      setZortoutReady(
        response.zortout.enabled && response.zortout.api_credentials_configured,
      );
    } catch {
      setZortoutReady(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers, refreshKey]);

  useEffect(() => {
    void loadZortoutStatus();
  }, [loadZortoutStatus]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void loadUsers();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [loadUsers]);

  const handleSyncAll = async () => {
    const result = await dialog.fire({
      title: "Sync สมาชิกทั้งหมดไป Zortout",
      description: `จะ sync สมาชิกทั้งหมด ${formatNumber(total)} คนไป Zortout โดยค้นหาจากเบอร์โทรหรืออีเมลก่อน แล้วอัปเดตหรือเพิ่ม contact ให้อัตโนมัติ`,
      confirmText: "เริ่ม sync",
      cancelText: "ยกเลิก",
    });
    if (!result.isConfirmed) {
      return;
    }

    setSyncAllLoading(true);
    setError(null);
    try {
      const response = await startZortoutMemberSync();
      setActiveSyncJobId(response.job.id);
      setSyncJobRefreshKey((key) => key + 1);
    } catch (syncError) {
      setError(handleError(syncError).message);
    } finally {
      setSyncAllLoading(false);
    }
  };

  const handleSyncUser = async (user: PortalUser) => {
    setSyncingUserId(user.id);
    setError(null);
    try {
      await syncUserToZortout(user.id);
      setRefreshKey((key) => key + 1);
    } catch (syncError) {
      setError(handleError(syncError).message);
    } finally {
      setSyncingUserId(null);
    }
  };

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setSearch(searchInput.trim());
  };

  return (
    <div className="p-3 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            รายชื่อสมาชิก
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            ทั้งหมด {formatNumber(total)} คน
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TableExport
            filename="members"
            columns={[
              { id: "name", label: "สมาชิก", value: (user) => user.display_name },
              { id: "phone", label: "เบอร์โทร", value: (user) => displayValue(user.phone) },
              { id: "email", label: "อีเมล", value: (user) => displayValue(user.email) },
              { id: "line", label: "LINE ID", value: (user) => user.line_user_id },
              { id: "tier", label: "ระดับ", value: (user) => user.tier?.name },
              {
                id: "point",
                label: "Point",
                value: (user) => getDefaultPointBalance(user.points),
              },
              {
                id: "zortout",
                label: "Zortout",
                value: (user) => user.zortout?.sync_status || "",
              },
              {
                id: "created",
                label: "วันที่สมัคร",
                value: (user) => formatDateTime(user.create_date),
              },
            ]}
            loadRows={() =>
              collectPages(async (pageOffset, limit) => {
                const data = await getUsers({
                  search,
                  limit,
                  offset: pageOffset,
                });
                return { rows: data.users, total: data.total };
              })
            }
          />
          {zortoutReady ? (
            <button
              type="button"
              disabled={syncAllLoading}
              onClick={() => void handleSyncAll()}
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-4xl bg-brown-100 px-3 py-2 text-sm font-medium text-white transition hover:bg-brown-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${syncAllLoading ? "animate-spin" : ""}`}
              />
              Sync ข้อมูลไป Zortout
            </button>
          ) : null}

          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-100" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ค้นหาชื่อ, เบอร์โทร..."
              className="w-full rounded-4xl border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-brown-100"
            />
          </form>
        </div>
      </div>

      {zortoutReady ? (
        <div className="mb-4">
          <ZortoutMemberSyncProgress
            refreshKey={syncJobRefreshKey}
            initialJobId={activeSyncJobId}
            onComplete={() => setRefreshKey((key) => key + 1)}
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={6} columns={7} avatarColumn />
        ) : error ? (
          <div className="p-6 text-sm text-red-100">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ไม่พบสมาชิก</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full text-left ${compactTableClassName}`}>
              <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                <tr>
                  <th className="px-4 py-4 font-medium">สมาชิก</th>
                  <th className="px-4 py-4 font-medium">เบอร์โทร</th>
                  <th className="px-4 py-4 font-medium">ระดับ</th>
                  <th className="px-4 py-4 font-medium">Point</th>
                  {zortoutReady ? (
                    <th className="px-4 py-4 font-medium">Zortout</th>
                  ) : null}
                  <th className="px-4 py-4 font-medium">วันที่สมัคร</th>
                  {zortoutReady ? <th className="px-4 py-4 font-medium" /> : null}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/dashboard/members/${user.id}`)}
                    className="cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 hover:bg-gray-10"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <MemberAvatar
                          name={user.display_name}
                          pictureUrl={user.picture_url}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-defualt-text">
                            {user.display_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {displayValue(user.phone)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-brown-yellow-5 px-2 py-0.5 text-[11px] font-medium text-brown-100">
                        {user.tier.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-brown-100">
                      {formatNumber(getDefaultPointBalance(user.points))}
                    </td>
                    {zortoutReady ? (
                      <td className="px-4 py-4">
                        <ZortoutSyncStatusBadge
                          syncedAt={user.zortout?.synced_at ?? false}
                          syncStatus={user.zortout?.sync_status ?? false}
                          syncError={user.zortout?.sync_error ?? false}
                        />
                      </td>
                    ) : null}
                    <td className="px-4 py-4 text-gray-100">
                      {formatDateTime(user.create_date)}
                    </td>
                    {zortoutReady ? (
                      <td className="px-4 py-4 text-sm">
                        <ActionMenu
                          ariaLabel={`ตัวเลือกสมาชิก ${user.display_name}`}
                          items={[
                            {
                              label:
                                syncingUserId === user.id
                                  ? "กำลัง sync..."
                                  : "Sync",
                              icon: (
                                <RefreshCw
                                  className={`size-2 ${syncingUserId === user.id ? "animate-spin" : ""}`}
                                />
                              ),
                              onClick: () => void handleSyncUser(user),
                              disabled: syncingUserId === user.id,
                            },
                          ]}
                        />
                      </td>
                    ) : null}
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
