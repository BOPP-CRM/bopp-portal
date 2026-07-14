"use client";

import {
  disableZortout,
  enableZortout,
  getZortoutStatus,
  regenerateZortoutKeys,
} from "@/services/zortout/zortout";
import type { ZortoutStatus } from "@/services/zortout/types";
import { ActionButton, CopyField } from "@/components/connections/shared";
import ZortoutWebhookLogs from "@/components/connections/ZortoutWebhookLogs";
import dialog from "@/components/util/dialog";
import { ContentSkeleton } from "@/components/util/Skeleton";
import { handleError } from "@/utils/errors";
import { Info, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function ZortoutPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<ZortoutStatus | null>(null);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const response = await getZortoutStatus();
      setStatus(response.zortout);
    } catch (loadError) {
      setError(handleError(loadError).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const copyToClipboard = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(label ? `คัดลอก${label}แล้ว` : "คัดลอกแล้ว");
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("ไม่สามารถคัดลอกได้");
      setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  const handleEnable = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await enableZortout();
      setStatus(response.zortout);
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async () => {
    const result = await dialog.fire({
      title: "ปิดการเชื่อมต่อ Zortout",
      description:
        "Webhook จาก ZORT จะไม่ถูกประมวลผลจนกว่าจะเปิดการเชื่อมต่ออีกครั้ง",
      icon: <Info className="text-brown-100" />,
      confirmText: "ปิดการเชื่อมต่อ",
      confirmVariant: "primary",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await disableZortout();
      setStatus(response.zortout);
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateKeys = async () => {
    const result = await dialog.fire({
      title: "สร้าง Key ใหม่",
      description:
        "ต้องอัปเดต key1, key2, key3 ใน ZORT Portal ด้วย มิฉะนั้น webhook จะไม่ทำงาน",
      icon: <Info className="text-brown-100" />,
      confirmText: "สร้าง Key ใหม่",
      confirmVariant: "primary",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await regenerateZortoutKeys();
      setStatus(response.zortout);
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

  const isActive = status.configured && status.enabled;
  const webhookUrl = status.webhook_base_url ?? "";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-defualt-text">
              ZORT Integration
            </h2>
            <ZortoutStatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-gray-100">
            เชื่อมต่อ webhook จาก ZORT เพื่อให้คะแนนเมื่อออเดอร์ชำระเงินแล้ว
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {!isActive ? (
            <ActionButton
              disabled={isSubmitting}
              onClick={() => void handleEnable()}
              label={
                isSubmitting
                  ? "กำลังเปิด..."
                  : status.configured
                    ? "เปิดการเชื่อมต่อ"
                    : "เริ่มเชื่อมต่อ"
              }
            />
          ) : (
            <>
              <ActionButton
                disabled={isSubmitting}
                onClick={() => void handleRegenerateKeys()}
                label={isSubmitting ? "กำลังสร้าง..." : "สร้าง Key ใหม่"}
                icon={<RefreshCw className="size-4" />}
                variant="outlined"
              />
              <ActionButton
                disabled={isSubmitting}
                onClick={() => void handleDisable()}
                label={isSubmitting ? "กำลังปิด..." : "ปิดการเชื่อมต่อ"}
                variant="outlined"
              />
            </>
          )}
        </div>
      </div>

      {!isActive ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-10/60 px-5 py-8 text-center">
          <p className="text-sm font-medium text-defualt-text">
            ยังไม่ได้เปิดใช้งาน
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-100">
            กดเริ่มเชื่อมต่อเพื่อสร้าง Webhook URL และ Key
            จากนั้นนำไปตั้งค่าใน ZORT
          </p>
        </div>
      ) : (
        <section className="space-y-5">
          <ol className="grid gap-3 sm:grid-cols-3">
            <SetupStep
              step={1}
              title="คัดลอก URL และ Key"
              detail="ใช้ค่าด้านล่างนี้"
            />
            <SetupStep
              step={2}
              title="ไปที่ ZORT"
              detail="Setting → Integration → Webhook"
            />
            <SetupStep
              step={3}
              title="วางค่า"
              detail="URL ทั้ง ADDORDER และ UPDATEORDER · ใส่ key1 เป็นอย่างน้อย"
            />
          </ol>

          <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
            <CopyField
              label="Webhook URL"
              description="ใช้ URL เดียวกันทั้ง ADDORDER และ UPDATEORDER"
              value={webhookUrl}
              onCopy={(value) => void copyToClipboard(value, " URL ")}
            />

            <div className="my-5 border-t border-gray-200" />

            <div>
              <p className="text-sm font-medium text-defualt-text">
                Webhook Keys
              </p>
              <p className="mt-1 text-xs text-gray-100">
                key1 จำเป็น · key2 / key3 ใส่ได้ตามต้องการ
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <CopyField
                  label="key1"
                  required
                  value={status.key1 ?? ""}
                  onCopy={(value) => void copyToClipboard(value, " key1 ")}
                />
                <CopyField
                  label="key2"
                  value={status.key2 ?? ""}
                  onCopy={(value) => void copyToClipboard(value, " key2 ")}
                />
                <CopyField
                  label="key3"
                  value={status.key3 ?? ""}
                  onCopy={(value) => void copyToClipboard(value, " key3 ")}
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-100">
            เมื่อออเดอร์มีสถานะชำระเงิน Paid
            ระบบจะหาสมาชิกจากเบอร์หรืออีเมลแล้วให้คะแนนตาม Tier
          </p>
        </section>
      )}

      <ZortoutWebhookLogs />

      {copyMessage ? (
        <p className="text-xs text-brown-100">{copyMessage}</p>
      ) : null}
      {error ? <p className="text-sm text-red-100">{error}</p> : null}
    </div>
  );
}

function SetupStep({
  step,
  title,
  detail,
}: {
  step: number;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brown-100 text-xs font-semibold text-white">
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-defualt-text">{title}</p>
        <p className="mt-0.5 text-xs text-gray-100">{detail}</p>
      </div>
    </li>
  );
}

function ZortoutStatusBadge({ status }: { status: ZortoutStatus }) {
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
