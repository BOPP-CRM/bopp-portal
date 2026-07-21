"use client";

import AdjustPointModal from "@/components/members/AdjustPointModal";
import UserCoupons from "@/components/members/UserCoupons";
import UserPointHistory from "@/components/members/UserPointHistory";
import ZortoutMemberSyncProgress, {
  ZortoutSyncStatusBadge,
} from "@/components/members/ZortoutMemberSyncProgress";
import { MemberDetailSkeleton } from "@/components/util/Skeleton";
import { getUser } from "@/services/members/members";
import type { PortalUser, PortalUserPoint } from "@/services/members/types";
import {
  getZortoutStatus,
  syncUserToZortout,
} from "@/services/zortout/zortout";
import { handleError } from "@/utils/errors";
import { formatDateTime } from "@/utils/datetime";
import { displayValue, formatNumber, formatUserAddress } from "@/utils/format";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type MemberDetailPageProps = {
  userId: number;
};

export default function MemberDetailPage({ userId }: MemberDetailPageProps) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [zortoutReady, setZortoutReady] = useState(false);
  const [syncingZortout, setSyncingZortout] = useState(false);

  const loadUser = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await getUser(userId);
      setUser(data);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    const loadZortoutStatus = async () => {
      try {
        const response = await getZortoutStatus();
        setZortoutReady(
          response.zortout.enabled &&
            response.zortout.api_credentials_configured,
        );
      } catch {
        setZortoutReady(false);
      }
    };
    void loadZortoutStatus();
  }, []);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void loadUser();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [loadUser]);

  const handlePointAdjusted = async () => {
    setSuccessMessage("ปรับ point สำเร็จ");
    await loadUser();
    setActivityRefreshKey((key) => key + 1);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSyncZortout = async () => {
    setSyncingZortout(true);
    setSyncError(null);
    try {
      await syncUserToZortout(userId);
      setSuccessMessage("Sync ไป Zortout สำเร็จ");
      await loadUser();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (syncFailure) {
      setSyncError(handleError(syncFailure).message);
      await loadUser();
    } finally {
      setSyncingZortout(false);
    }
  };

  if (loading) {
    return <MemberDetailSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <Link
          href="/dashboard/members"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-100 hover:text-brown-100"
        >
          <ArrowLeft className="size-4" />
          กลับไปรายชื่อสมาชิก
        </Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-red-100">
          {error ?? "ไม่พบข้อมูลสมาชิก"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Link
        href="/dashboard/members"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-100 hover:text-brown-100"
      >
        <ArrowLeft className="size-4" />
        กลับไปรายชื่อสมาชิก
      </Link>

      {successMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-4 py-3 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}

      {syncError ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-100">
          {syncError}
        </div>
      ) : null}

      {zortoutReady ? (
        <div className="mb-4">
          <ZortoutMemberSyncProgress onComplete={() => void loadUser()} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            {user.picture_url ? (
              <img
                src={user.picture_url}
                alt={user.display_name}
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-full bg-brown-100 text-lg font-semibold text-white">
                {user.display_name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-defualt-text">
                {user.display_name}
              </h1>
              <p className="mt-1 text-sm text-gray-100">
                {user.tier.name} ({user.tier.code})
              </p>
              <p className="mt-1 text-sm text-gray-100">
                สมัครเมื่อ {formatDateTime(user.create_date)}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoItem label="เบอร์โทร" value={displayValue(user.phone)} />
            <InfoItem
              label="ยืนยันเบอร์โทร"
              value={user.is_phone_verified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}
            />
            <InfoItem label="อีเมล" value={displayValue(user.email)} />
            <InfoItem
              label="ยืนยันอีเมล"
              value={user.is_email_verified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}
            />
            <InfoItem label="วันเกิด" value={displayValue(user.birth_date)} />
            <InfoItem label="เพศ" value={displayValue(user.gender)} />
            <InfoItem label="LINE User ID" value={user.line_user_id} />
            <InfoItem
              label="ที่อยู่"
              value={formatUserAddress(user.address)}
              className="sm:col-span-2"
            />
          </dl>

          {zortoutReady ? (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-10 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <img src="/images/zortout.png" alt="Zortout" className="size-10" />
                  <div className="mt-2">
                    <ZortoutSyncStatusBadge
                      syncedAt={user.zortout?.synced_at ?? false}
                      syncStatus={user.zortout?.sync_status ?? false}
                      syncError={user.zortout?.sync_error ?? false}
                    />
                  </div>
                  {user.zortout?.contact_id ? (
                    <p className="mt-2 text-xs text-gray-100">
                      Contact ID: {user.zortout.contact_id}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={syncingZortout}
                  onClick={() => void handleSyncZortout()}
                  className="inline-flex items-center justify-center gap-2 rounded-4xl border border-brown-100 px-4 py-2 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    className={`size-4 ${syncingZortout ? "animate-spin" : ""}`}
                  />
                  {syncingZortout ? "กำลัง sync..." : "Sync ไป Zortout"}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-defualt-text">
              Point คงเหลือ
            </h2>
            <AdjustPointModal user={user} onSuccess={handlePointAdjusted} />
          </div>
          <PointBalances points={user.points} />
        </section>
      </div>

      <div className="mt-6 space-y-6">
        <UserPointHistory userId={userId} refreshKey={activityRefreshKey} />
        <UserCoupons userId={userId} refreshKey={activityRefreshKey} />
      </div>
    </div>
  );
}

function PointBalances({ points }: { points: PortalUserPoint[] }) {
  const primaryPoint =
    points.find((point) => point.currency.is_default) ?? points[0] ?? null;
  const secondaryPoints = points.filter((point) => point !== primaryPoint);

  if (!primaryPoint) {
    return (
      <p className="mt-4 text-sm text-gray-100">ยังไม่มี Point คงเหลือ</p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl bg-brown-50 px-5 py-5 text-center">
        <p className="text-sm text-gray-100">
          {primaryPoint.currency.name}
          {primaryPoint.currency.is_default ? (
            <span> · ค่าเริ่มต้น</span>
          ) : null}
        </p>
        <p className="mt-1 text-4xl font-semibold text-brown-100">
          {formatNumber(primaryPoint.balance)}
        </p>
      </div>

      {secondaryPoints.length > 0 ? (
        <dl className="divide-y divide-gray-200 rounded-xl border border-gray-200">
          {secondaryPoints.map((point) => (
            <div
              key={point.currency.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <dt className="text-sm text-gray-100">
                {point.currency.name}
                {point.currency.is_total_spending ? (
                  <span className="mt-0.5 block text-xs">ยอดใช้จ่ายสะสม</span>
                ) : null}
              </dt>
              <dd className="text-base font-semibold text-defualt-text">
                {formatNumber(point.balance)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-sm text-gray-100">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-all text-defualt-text">
        {value}
      </dd>
    </div>
  );
}
