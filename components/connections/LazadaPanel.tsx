"use client";

import { disableLazada, getLazadaStatus, startLazadaConnect } from "@/services/lazada/lazada";
import type { LazadaStatus } from "@/services/lazada/types";
import { getOmisellStatus } from "@/services/omisell/omisell";
import type { OmisellStatus } from "@/services/omisell/types";
import { ActionButton } from "@/components/connections/shared";
import dialog from "@/components/util/dialog";
import { ContentSkeleton } from "@/components/util/Skeleton";
import { handleError } from "@/utils/errors";
import { AlertTriangle, Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function LazadaPanel({
  onSwitchToOmisell,
}: {
  onSwitchToOmisell: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<LazadaStatus | null>(null);
  const [omisellStatus, setOmisellStatus] = useState<OmisellStatus | null>(null);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const [lazadaRes, omisellRes] = await Promise.all([
        getLazadaStatus(),
        getOmisellStatus(),
      ]);
      setStatus(lazadaRes.lazada);
      setOmisellStatus(omisellRes.omisell);
    } catch (loadError) {
      setError(handleError(loadError).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleConnect = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await startLazadaConnect();
      window.location.href = res.authorize_url;
    } catch (submitError) {
      setError(handleError(submitError).message);
      setIsSubmitting(false);
    }
  };

  const handleDisable = async () => {
    const result = await dialog.fire({
      title: "ปิดการเชื่อมต่อ Lazada",
      description:
        "การรับออเดอร์จาก Lazada จะหยุดลงจนกว่าจะเชื่อมต่ออีกครั้ง",
      icon: <Info className="text-brown-100" />,
      confirmText: "ปิดการเชื่อมต่อ",
      confirmVariant: "primary",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await disableLazada();
      setStatus(res.lazada);
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ContentSkeleton />;
  }

  if (!status) {
    return error ? <p className="p-6 text-sm text-red-100">{error}</p> : null;
  }

  const isEnabled = status.configured && status.enabled;
  const omisellBlocking = omisellStatus?.enabled === true;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <img
            src="/lazada.png"
            alt="Lazada"
            className="size-14 shrink-0 rounded-2xl bg-white object-contain shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-defualt-text">
                Lazada Integration
              </h2>
              <LazadaStatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-gray-100">
              เชื่อมต่อกับ Lazada เพื่อให้คะแนนสมาชิกเมื่อมีออเดอร์ใหม่
            </p>
          </div>
        </div>

        {isEnabled && !omisellBlocking && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <ActionButton
              disabled={isSubmitting}
              onClick={() => void handleDisable()}
              label={isSubmitting ? "กำลังปิด..." : "ปิดการเชื่อมต่อ"}
              variant="outlined"
            />
          </div>
        )}
      </div>

      {omisellBlocking && (
        <div className="flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-600" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-yellow-800">
              Omisell ยังเปิดอยู่
            </p>
            <p className="mt-1 text-sm text-yellow-700">
              ไม่สามารถเชื่อมต่อ Lazada ได้ขณะที่ Omisell กำลังทำงานอยู่
              เพราะระบบใช้ได้เพียงช่องทางเดียวพร้อมกัน
            </p>
            <button
              type="button"
              onClick={onSwitchToOmisell}
              className="mt-2 text-sm font-medium text-yellow-800 underline hover:text-yellow-900"
            >
              ไปปิด Omisell
            </button>
          </div>
        </div>
      )}

      {!omisellBlocking && !isEnabled && (
        <div className="rounded-2xl border border-gray-200 p-5">
          <p className="mb-4 text-sm text-gray-100">
            เริ่มต้นเชื่อมต่อร้านค้า Lazada ผ่าน OAuth — ระบบจะนำไปยังหน้า
            Lazada เพื่อยืนยันสิทธิ์การเข้าถึง
          </p>
          <ActionButton
            disabled={isSubmitting}
            onClick={() => void handleConnect()}
            label={isSubmitting ? "กำลังเชื่อมต่อ..." : "เชื่อมต่อ Lazada"}
          />
        </div>
      )}

      {isEnabled && !omisellBlocking && (
        <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoField label="Seller ID" value={status.seller_id ?? "-"} />
            <InfoField label="Country" value={status.country ?? "-"} />
            <InfoField
              label="Token หมดอายุ"
              value={status.access_token_expires_at ?? "-"}
            />
            <InfoField
              label="Token (masked)"
              value={status.token_masked ?? "-"}
            />
          </div>
        </div>
      )}

      {error ? <p className="text-sm text-red-100">{error}</p> : null}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-100">{label}</p>
      <p className="mt-0.5 text-sm text-defualt-text">{value}</p>
    </div>
  );
}

function LazadaStatusBadge({ status }: { status: LazadaStatus }) {
  if (!status.configured) {
    return (
      <span className="rounded-full bg-gray-10 px-2.5 py-1 text-xs font-medium text-gray-100">
        ยังไม่ได้ตั้งค่า
      </span>
    );
  }

  if (status.enabled) {
    return (
      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
        เปิดใช้งาน
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-100">
      ปิดใช้งาน
    </span>
  );
}
