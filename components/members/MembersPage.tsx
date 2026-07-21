"use client";

import ZortoutMemberSyncProgress, {
  ZortoutSyncStatusBadge,
} from "@/components/members/ZortoutMemberSyncProgress";
import ActionMenu from "@/components/util/ActionMenu";
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
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

  const loadUsers = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await getUsers({
        search,
        limit: PAGE_SIZE,
        offset,
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
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
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            รายชื่อสมาชิก
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            ทั้งหมด {formatNumber(total)} คน
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {zortoutReady ? (
            <button
              type="button"
              disabled={syncAllLoading}
              onClick={() => void handleSyncAll()}
              className="inline-flex items-center justify-center gap-2 rounded-4xl bg-brown-100 px-4 py-3 text-sm font-medium text-white transition hover:bg-brown-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${syncAllLoading ? "animate-spin" : ""}`}
              />
              Sync ทั้งหมดไป Zortout
            </button>
          ) : null}

          <form onSubmit={handleSearch} className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-100" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ค้นหาชื่อ, เบอร์โทร..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pr-4 pl-10 text-sm outline-none focus:border-brown-100"
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
            <table className="min-w-full text-left text-sm">
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
                  <th className="px-4 py-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {user.picture_url ? (
                          <img
                            src={user.picture_url}
                            alt={user.display_name}
                            className="size-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-full bg-brown-100 text-xs font-medium text-white">
                            {user.display_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-defualt-text">
                            {user.display_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {displayValue(user.phone)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-brown-yellow-5 px-3 py-1 text-xs font-medium text-brown-100">
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
                    <td className="px-4 py-4">
                      <ActionMenu
                        ariaLabel={`ตัวเลือกสมาชิก ${user.display_name}`}
                        items={[
                          {
                            label: "ดูรายละเอียด",
                            icon: <Eye className="size-4" />,
                            onClick: () =>
                              router.push(`/dashboard/members/${user.id}`),
                          },
                          ...(zortoutReady
                            ? [
                                {
                                  label:
                                    syncingUserId === user.id
                                      ? "กำลัง sync..."
                                      : "Sync ไป Zortout",
                                  icon: (
                                    <RefreshCw
                                      className={`size-4 ${syncingUserId === user.id ? "animate-spin" : ""}`}
                                    />
                                  ),
                                  onClick: () => void handleSyncUser(user),
                                  disabled: syncingUserId === user.id,
                                },
                              ]
                            : []),
                        ]}
                      />
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
