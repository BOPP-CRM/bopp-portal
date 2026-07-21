"use client";

import {
  getZortoutMemberSyncProgress,
  useZortoutMemberSyncJob,
} from "@/components/members/useZortoutMemberSyncJob";
import type { ZortoutMemberSyncJob } from "@/services/zortout/types";
import { formatDateTime } from "@/utils/datetime";
import { formatNumber } from "@/utils/format";
import { Loader2 } from "lucide-react";

type ZortoutMemberSyncProgressProps = {
  onComplete?: () => void;
  refreshKey?: number;
  initialJobId?: number | null;
};

export default function ZortoutMemberSyncProgress({
  onComplete,
  refreshKey = 0,
  initialJobId = null,
}: ZortoutMemberSyncProgressProps) {
  const { job, isActive, error } = useZortoutMemberSyncJob(
    onComplete,
    refreshKey,
    initialJobId,
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-100">
        {error}
      </div>
    );
  }

  if (!job) {
    return null;
  }

  if (!isActive && job.state === "done" && job.processed === 0) {
    return null;
  }

  return <ProgressCard job={job} isActive={isActive} />;
}

function ProgressCard({
  job,
  isActive,
}: {
  job: ZortoutMemberSyncJob;
  isActive: boolean;
}) {
  const progress = getZortoutMemberSyncProgress(job);
  const statusLabel = getStatusLabel(job);

  return (
    <div className="rounded-2xl border border-brown-yellow-20 bg-brown-yellow-5 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-defualt-text">
            Sync สมาชิกไป Zortout
          </p>
          <p className="mt-1 text-sm text-gray-100">{statusLabel}</p>
        </div>
        {isActive ? (
          <Loader2 className="size-5 shrink-0 animate-spin text-brown-100" />
        ) : null}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-gray-100">
          <span>
            {formatNumber(job.processed)} / {formatNumber(job.total)} คน
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-brown-100 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-100">
        <span>สำเร็จ {formatNumber(job.succeeded)}</span>
        <span>ล้มเหลว {formatNumber(job.failed)}</span>
        {job.started_at ? (
          <span>เริ่ม {formatDateTime(job.started_at)}</span>
        ) : null}
        {job.finished_at ? (
          <span>เสร็จ {formatDateTime(job.finished_at)}</span>
        ) : null}
      </div>

      {job.last_error ? (
        <p className="mt-3 text-xs text-red-100">{job.last_error}</p>
      ) : null}
    </div>
  );
}

function getStatusLabel(job: ZortoutMemberSyncJob) {
  if (job.state === "pending") {
    return "กำลังเตรียม sync...";
  }
  if (job.state === "running") {
    if (job.current_user) {
      return `กำลัง sync: ${job.current_user.display_name}`;
    }
    return "กำลัง sync สมาชิก...";
  }
  if (job.state === "done") {
    return "Sync เสร็จสมบูรณ์";
  }
  if (job.state === "failed") {
    return "Sync ล้มเหลว";
  }
  return "ยกเลิกแล้ว";
}

export function ZortoutSyncStatusBadge({
  syncedAt,
  syncStatus,
  syncError,
}: {
  syncedAt: string | false;
  syncStatus: "pending" | "synced" | "failed" | "skipped" | false;
  syncError?: string | false;
}) {
  if (syncStatus === "synced" && syncedAt) {
    return (
      <div>
        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
          Sync แล้ว
        </span>
        <p className="mt-1 text-xs text-gray-100">{formatDateTime(syncedAt)}</p>
      </div>
    );
  }

  if (syncStatus === "failed") {
    return (
      <div>
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
          Sync ล้มเหลว
        </span>
        {syncError ? (
          <p className="mt-1 text-xs text-red-100">{syncError}</p>
        ) : null}
      </div>
    );
  }

  if (syncStatus === "skipped") {
    return (
      <div>
        <span className="rounded-full bg-gray-10 px-2.5 py-1 text-xs font-medium text-gray-100">
          ข้าม
        </span>
        {syncError ? (
          <p className="mt-1 text-xs text-gray-100">{syncError}</p>
        ) : null}
      </div>
    );
  }

  if (syncStatus === "pending") {
    return (
      <span className="rounded-full bg-brown-yellow-5 px-2.5 py-1 text-xs font-medium text-brown-100">
        กำลัง sync
      </span>
    );
  }

  return <span className="text-xs text-gray-100">ยังไม่ sync</span>;
}
