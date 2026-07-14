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

const WEBHOOK_EVENTS = [
  {
    method: "ADDORDER",
    label: "ADDORDER",
    description: "เมื่อมีการสร้างออเดอร์ใหม่",
  },
  {
    method: "UPDATEORDER",
    label: "UPDATEORDER",
    description: "เมื่อออเดอร์ถูกแก้ไขหรือสถานะเปลี่ยน",
  },
] as const;

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

  return (
    <div className="space-y-5 p-6">
      <section className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-defualt-text">
              สถานะการเชื่อมต่อ
            </h3>
            <p className="mt-1 text-xs text-gray-100">
              เปิดใช้งานแล้วนำ URL และ Key ไปตั้งค่าใน ZORT → Setting →
              Integration → API Reference → Webhook
            </p>
          </div>
          <ZortoutStatusBadge status={status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!status.configured || !status.enabled ? (
            <ActionButton
              disabled={isSubmitting}
              onClick={() => void handleEnable()}
              label={
                isSubmitting
                  ? "กำลังเปิดการเชื่อมต่อ..."
                  : status.configured
                    ? "เปิดการเชื่อมต่อ"
                    : "เปิดการเชื่อมต่อและสร้าง Key"
              }
            />
          ) : (
            <>
              <ActionButton
                disabled={isSubmitting}
                onClick={() => void handleRegenerateKeys()}
                label={isSubmitting ? "กำลังสร้าง Key..." : "สร้าง Key ใหม่"}
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
      </section>

      {status.configured && status.enabled ? (
        <>
          <section className="rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-defualt-text">
              Webhook URL
            </h3>
            <p className="mt-1 text-xs text-gray-100">
              ใช้ URL ของ Portal นี้ ระบบจะส่งต่อ request ไปยัง Odoo อัตโนมัติ
              ใส่ URL เดียวกันในช่อง ADDORDER และ UPDATEORDER ของ ZORT
            </p>

            <div className="mt-4 space-y-4">
              {WEBHOOK_EVENTS.map((event) => (
                <CopyField
                  key={event.method}
                  label={event.label}
                  description={event.description}
                  value={status.webhook_base_url ?? ""}
                  onCopy={(value) =>
                    void copyToClipboard(value, ` ${event.label} `)
                  }
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-defualt-text">
              Webhook Keys
            </h3>
            <p className="mt-1 text-xs text-gray-100">
              นำค่า key1, key2, key3 ไปใส่ในแท็บ Webhook ของ ZORT (key1
              บังคับกรอก)
            </p>

            <div className="mt-4 space-y-4">
              <CopyField
                label="key1"
                required
                value={status.key1 ?? ""}
                description="ทุก Request จะส่งค่านี้ใน Header"
                onCopy={(value) => void copyToClipboard(value, " key1 ")}
              />
              <CopyField
                label="key2"
                value={status.key2 ?? ""}
                description="ทุก Request จะส่งค่านี้ใน Header"
                onCopy={(value) => void copyToClipboard(value, " key2 ")}
              />
              <CopyField
                label="key3"
                value={status.key3 ?? ""}
                description="ทุก Request จะส่งค่านี้ใน Header"
                onCopy={(value) => void copyToClipboard(value, " key3 ")}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-brown-100/30 bg-brown-yellow-5 p-4 text-xs text-brown-100">
            เมื่อออเดอร์มี paymentstatus เป็น Paid
            ระบบจะค้นหาสมาชิกจากเบอร์โทรหรืออีเมลในออเดอร์
            แล้วเพิ่มคะแนนตาม Tier Convert Points ของสมาชิก
          </section>
        </>
      ) : null}

      <ZortoutWebhookLogs />

      {copyMessage ? (
        <p className="text-xs text-brown-100">{copyMessage}</p>
      ) : null}
      {error ? <p className="text-sm text-red-100">{error}</p> : null}
    </div>
  );
}

function ZortoutStatusBadge({ status }: { status: ZortoutStatus }) {
  if (!status.configured) {
    return (
      <span className="rounded-full bg-gray-10 px-3 py-1 text-xs font-medium text-gray-100">
        ยังไม่ได้ตั้งค่า
      </span>
    );
  }

  if (status.enabled) {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        เปิดใช้งาน
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-100">
      ปิดใช้งาน
    </span>
  );
}
