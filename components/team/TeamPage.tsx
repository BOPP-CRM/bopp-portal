"use client";

import FilterGroup, { FilterBar } from "@/components/util/FilterGroup";
import TableExport from "@/components/util/TableExport";
import { collectPages } from "@/utils/csv";
import ActionMenu from "@/components/util/ActionMenu";
import { compactTableClassName } from "@/components/util/data-table";
import { TableSkeleton } from "@/components/util/Skeleton";
import {
  cancelTeamInvite,
  getTeamInvites,
  getTeamUsers,
} from "@/services/team/team";
import type { InviteState, PortalTeamInvite, PortalTeamUser } from "@/services/team/types";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { PORTAL_ROLE_LABELS } from "@/utils/roles";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Link2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 20;

type Tab = "users" | "invites";

type ActiveFilter = "all" | "active" | "inactive";

export default function TeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("users");
  const [teamUsers, setTeamUsers] = useState<
    Awaited<ReturnType<typeof getTeamUsers>>["teamUsers"]
  >([]);
  const [invites, setInvites] = useState<PortalTeamInvite[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [inviteStateFilter, setInviteStateFilter] = useState<
    InviteState | "all"
  >("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cancellingInviteId, setCancellingInviteId] = useState<number | null>(
    null,
  );
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const activeParam = useMemo(() => {
    if (activeFilter === "active") return true;
    if (activeFilter === "inactive") return false;
    return undefined;
  }, [activeFilter]);

  const loadRequestId = useRef(0);

  const loadData = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setError(null);
    setLoading(true);

    try {
      if (tab === "users") {
        const data = await getTeamUsers({
          search,
          active: activeParam,
          limit: PAGE_SIZE,
          offset,
        });
        if (requestId !== loadRequestId.current) return;
        setTeamUsers(data.teamUsers);
        setTotal(data.total);
      } else {
        const data = await getTeamInvites({
          state: inviteStateFilter,
          limit: PAGE_SIZE,
          offset,
        });
        if (requestId !== loadRequestId.current) return;
        setInvites(data.invites);
        setTotal(data.total);
      }
    } catch (loadError) {
      if (requestId !== loadRequestId.current) return;
      setError(handleError(loadError).message);
      setTeamUsers([]);
      setInvites([]);
      setTotal(0);
    } finally {
      if (requestId === loadRequestId.current) setLoading(false);
    }
  }, [activeParam, inviteStateFilter, offset, search, tab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setOffset(0);
  }, [tab, search, activeFilter, inviteStateFilter]);

  useEffect(() => {
    if (searchParams.get("tab") === "invites") setTab("invites");
    if (searchParams.get("saved") !== "1") return;
    setSuccessMessage("บันทึกข้อมูลทีมสำเร็จ");
    router.replace("/dashboard/team");
  }, [router, searchParams]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleSuccess = async (message: string) => {
    setSuccessMessage(message);
    await loadData();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("คัดลอกลิงก์แล้ว");
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("ไม่สามารถคัดลอกได้");
      setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  const handleCancelInvite = async (inviteId: number) => {
    setCancellingInviteId(inviteId);
    setError(null);
    try {
      await cancelTeamInvite(inviteId);
      await handleSuccess("ยกเลิกคำเชิญสำเร็จ");
    } catch (cancelError) {
      setError(handleError(cancelError).message);
    } finally {
      setCancellingInviteId(null);
    }
  };

  const activeFilterOptions = useMemo(
    () => [
      { value: "all" as const, label: "ทั้งหมด" },
      { value: "active" as const, label: "ใช้งาน" },
      { value: "inactive" as const, label: "ปิดใช้งาน" },
    ],
    [],
  );

  const inviteStateOptions = useMemo(
    () => [
      { value: "pending" as const, label: "รอตอบรับ" },
      { value: "accepted" as const, label: "ตอบรับแล้ว" },
      { value: "cancelled" as const, label: "ยกเลิก" },
      { value: "expired" as const, label: "หมดอายุ" },
      { value: "all" as const, label: "ทั้งหมด" },
    ],
    [],
  );

  const inviteStateLabel: Record<InviteState, string> = {
    pending: "รอตอบรับ",
    accepted: "ตอบรับแล้ว",
    cancelled: "ยกเลิก",
    expired: "หมดอายุ",
  };

  return (
    <div className="p-3 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            จัดการทีม Portal
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            เพิ่มสมาชิกทีมหรือเชิญผ่านลิงก์
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {tab === "users" ? (
            <TableExport
              filename="team-users"
              columns={[
                { id: "name", label: "ชื่อ", value: (user) => user.name },
                { id: "email", label: "อีเมล", value: (user) => user.email },
                { id: "role", label: "Role", value: (user) => PORTAL_ROLE_LABELS[user.role] },
                { id: "active", label: "สถานะ", value: (user) => (user.active ? "ใช้งาน" : "ปิดใช้งาน") },
                { id: "created", label: "วันที่สร้าง", value: (user) => formatDateTime(user.create_date) },
              ]}
              loadRows={() =>
                collectPages(async (pageOffset, limit) => {
                  const data = await getTeamUsers({
                    search,
                    active: activeParam,
                    limit,
                    offset: pageOffset,
                  });
                  return { rows: data.teamUsers, total: data.total };
                })
              }
            />
          ) : (
            <TableExport
              filename="team-invites"
              columns={[
                { id: "name", label: "ชื่อ", value: (invite) => invite.name },
                { id: "email", label: "อีเมล", value: (invite) => invite.email },
                { id: "state", label: "สถานะ", value: (invite) => inviteStateLabel[invite.state] },
                { id: "expires", label: "หมดอายุ", value: (invite) => formatDateTime(invite.expires_at) },
                { id: "url", label: "ลิงก์", value: (invite) => invite.invite_url },
                { id: "invited_by", label: "เชิญโดย", value: (invite) => invite.invited_by?.name },
              ]}
              loadRows={() =>
                collectPages(async (pageOffset, limit) => {
                  const data = await getTeamInvites({
                    state: inviteStateFilter,
                    limit,
                    offset: pageOffset,
                  });
                  return { rows: data.invites, total: data.total };
                })
              }
            />
          )}
          <button
            type="button"
            onClick={() => router.push("/dashboard/team/invite")}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl border border-brown-100 px-3.5 py-1.5 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5"
          >
            <Link2 className="size-4" />
            เชิญด้วยลิงก์
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/team/new")}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
          >
            <Plus className="size-4" />
            เพิ่มสมาชิก
          </button>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-3 py-2 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}

      {copyMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-3 py-2 text-sm text-brown-100">
          {copyMessage}
        </div>
      ) : null}

      <FilterBar>
        <FilterGroup
          ariaLabel="รายการทีม"
          options={[
            { value: "users", label: "สมาชิกทีม" },
            { value: "invites", label: "คำเชิญ" },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "users" ? (
          <FilterGroup
            label="สถานะ"
            options={activeFilterOptions}
            value={activeFilter}
            onChange={setActiveFilter}
          />
        ) : (
          <FilterGroup
            label="สถานะคำเชิญ"
            options={inviteStateOptions}
            value={inviteStateFilter}
            onChange={setInviteStateFilter}
          />
        )}
      </FilterBar>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-100">
          ทั้งหมด {formatNumber(total)} รายการ
        </p>
        {tab === "users" ? (
          <form onSubmit={handleSearch} className="relative w-full sm:w-96">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-100" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pr-4 pl-10 text-base outline-none focus:border-brown-100"
            />
          </form>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : error ? (
          <div className="p-6 text-sm text-red-100">{error}</div>
        ) : tab === "users" ? (
          teamUsers.length === 0 ? (
            <div className="p-6 text-sm text-gray-100">ไม่พบสมาชิกทีม</div>
          ) : (
            <UsersTable
              users={teamUsers}
              onEdit={(user) => router.push(`/dashboard/team/${user.id}`)}
            />
          )
        ) : invites.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ไม่พบคำเชิญ</div>
        ) : (
          <InvitesTable
            invites={invites}
            inviteStateLabel={inviteStateLabel}
            cancellingInviteId={cancellingInviteId}
            onCopy={copyUrl}
            onCancel={handleCancelInvite}
          />
        )}

        {!loading && !error && total > 0 ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrev={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
            onNext={() => setOffset((prev) => prev + PAGE_SIZE)}
          />
        ) : null}
      </div>
    </div>
  );
}

function UsersTable({
  users,
  onEdit,
}: {
  users: Awaited<ReturnType<typeof getTeamUsers>>["teamUsers"];
  onEdit: (user: PortalTeamUser) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full text-left ${compactTableClassName}`}>
        <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
          <tr>
            <th className="px-4 py-4 font-medium">ชื่อ</th>
            <th className="px-4 py-4 font-medium">อีเมล</th>
            <th className="px-4 py-4 font-medium">Role</th>
            <th className="px-4 py-4 font-medium">สถานะ</th>
            <th className="px-4 py-4 font-medium">วันที่สร้าง</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              onClick={() => onEdit(user)}
              className="cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 hover:bg-gray-10"
            >
              <td className="px-4 py-4 font-medium text-defualt-text">
                {user.name}
              </td>
              <td className="px-4 py-4 text-defualt-text">{user.email}</td>
              <td className="px-4 py-4 text-defualt-text">
                {PORTAL_ROLE_LABELS[user.role ?? "admin"]}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    user.active
                      ? "bg-brown-yellow-5 text-brown-100"
                      : "bg-gray-10 text-gray-100"
                  }`}
                >
                  {user.active ? "ใช้งาน" : "ปิดใช้งาน"}
                </span>
              </td>
              <td className="px-4 py-4 text-gray-100">
                {formatDateTime(user.create_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvitesTable({
  invites,
  inviteStateLabel,
  cancellingInviteId,
  onCopy,
  onCancel,
}: {
  invites: PortalTeamInvite[];
  inviteStateLabel: Record<InviteState, string>;
  cancellingInviteId: number | null;
  onCopy: (url: string) => void;
  onCancel: (id: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full text-left ${compactTableClassName}`}>
        <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
          <tr>
            <th className="px-4 py-4 font-medium">ชื่อ / อีเมล</th>
            <th className="px-4 py-4 font-medium">สถานะ</th>
            <th className="px-4 py-4 font-medium">หมดอายุ</th>
            <th className="px-4 py-4 font-medium">เชิญโดย</th>
            <th className="px-4 py-4 font-medium" />
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => (
            <tr
              key={invite.id}
              className="border-b border-gray-200 last:border-b-0"
            >
              <td className="px-4 py-4">
                <p className="font-medium text-defualt-text">{invite.name}</p>
                <p className="text-xs text-gray-100">{invite.email}</p>
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-gray-10 px-2 py-0.5 text-[11px] font-medium text-defualt-text">
                  {inviteStateLabel[invite.state]}
                </span>
              </td>
              <td className="px-4 py-4 text-gray-100">
                {formatDateTime(invite.expires_at)}
              </td>
              <td className="px-4 py-4 text-defualt-text">
                {invite.invited_by.name}
              </td>
              <td className="px-4 py-4">
                {invite.state === "pending" ? (
                  <ActionMenu
                    ariaLabel={`ตัวเลือกคำเชิญ ${invite.name}`}
                    items={[
                      ...(invite.invite_url
                        ? [
                            {
                              label: "คัดลอกลิงก์",
                              icon: <Copy className="size-4" />,
                              onClick: () => void onCopy(invite.invite_url),
                            },
                          ]
                        : []),
                      {
                        label:
                          cancellingInviteId === invite.id
                            ? "กำลังยกเลิก..."
                            : "ยกเลิก",
                        icon: <X className="size-4" />,
                        disabled: cancellingInviteId === invite.id,
                        onClick: () => void onCancel(invite.id),
                      },
                    ]}
                  />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4">
      <p className="text-sm text-gray-100">
        หน้า {currentPage} จาก {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={onPrev}
          className="inline-flex items-center gap-1 rounded-4xl border border-gray-200 px-4 py-2 text-sm text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="size-4" />
          ก่อนหน้า
        </button>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={onNext}
          className="inline-flex items-center gap-1 rounded-4xl border border-gray-200 px-4 py-2 text-sm text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ถัดไป
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
