"use client";

import {
  connectZortout,
  disableZortout,
  getZortoutStatus,
  regenerateZortoutKeys,
  syncZortoutWebhook,
} from "@/services/zortout/zortout";
import type { ZortoutStatus } from "@/services/zortout/types";
import { ActionButton, CopyField } from "@/components/connections/shared";
import ZortoutWebhookLogs from "@/components/connections/ZortoutWebhookLogs";
import dialog from "@/components/util/dialog";
import { ContentSkeleton } from "@/components/util/Skeleton";
import { handleError } from "@/utils/errors";
import { Info, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const ZORTOUT_LOGO = "/zoutout.png";

export default function ZortoutPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<ZortoutStatus | null>(null);

  const [storename, setStorename] = useState("");
  const [apikey, setApikey] = useState("");
  const [apisecret, setApisecret] = useState("");

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const response = await getZortoutStatus();
      const next = response.zortout;
      setStatus(next);
      if (next.store_name) {
        setStorename(next.store_name);
      }
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

  const handleConnect = async () => {
    if (!storename.trim() || !apikey.trim() || !apisecret.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    if (isEditing) {
      const result = await dialog.fire({
        title: "บันทึกข้อมูลการเชื่อมต่อใหม่",
        description:
          "ระบบจะใช้ Store Name / API Key / Secret ใหม่แทนค่าเดิมทันที ตรวจสอบให้แน่ใจว่าข้อมูลถูกต้องก่อนบันทึก",
        icon: <Info className="text-brown-100" />,
        confirmText: "บันทึก",
        confirmVariant: "primary",
      });
      if (!result.isConfirmed) return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await connectZortout({
        storename: storename.trim(),
        apikey: apikey.trim(),
        apisecret: apisecret.trim(),
      });
      setStatus(response.zortout);
      setApikey("");
      setApisecret("");
      setIsEditing(false);
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEditing = () => {
    setError(null);
    setApikey("");
    setApisecret("");
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setError(null);
    if (status?.store_name) {
      setStorename(status.store_name);
    }
    setApikey("");
    setApisecret("");
    setIsEditing(false);
  };

  const handleResync = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await syncZortoutWebhook();
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
        "ระบบจะสร้าง key1 / key2 / key3 ใหม่แล้ว sync ไป Zortout อัตโนมัติ",
      icon: <Info className="text-brown-100" />,
      confirmText: "สร้าง Key ใหม่",
      confirmVariant: "primary",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const regenerated = await regenerateZortoutKeys();
      setStatus(regenerated.zortout);
      const synced = await syncZortoutWebhook();
      setStatus(synced.zortout);
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
        "Webhook จะหยุดรับออเดอร์จาก Zortout จนกว่าจะเปิดการเชื่อมต่ออีกครั้ง",
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
      setIsEditing(false);
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
  const needsCredentials = isEnabled && !status.api_credentials_configured;
  const formEditable = !isEnabled || needsCredentials || isEditing;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <img
            src={ZORTOUT_LOGO}
            alt="Zortout"
            className="size-14 shrink-0 rounded-2xl bg-white object-contain shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-defualt-text">
                Zortout Integration
              </h2>
              <ZortoutStatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-gray-100">
              เชื่อมต่อกับ Zortout เพื่อให้คะแนนสมาชิกเมื่อออเดอร์ชำระเงินแล้ว
            </p>
          </div>
        </div>

        {isEnabled && !needsCredentials && !isEditing ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <ActionButton
              disabled={isSubmitting}
              onClick={handleStartEditing}
              label="แก้ไขข้อมูลการเชื่อมต่อ"
              variant="outlined"
            />
            <ActionButton
              disabled={isSubmitting || !status.api_credentials_configured}
              onClick={() => void handleResync()}
              label={isSubmitting ? "กำลังอัปเดต..." : "อัปเดต"}
              icon={<RefreshCw className="size-4" />}
              variant="outlined"
            />
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
          </div>
        ) : null}
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-defualt-text">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-brown-100 text-xs font-semibold text-white">
            1
          </span>
          กรอกข้อมูลการเชื่อมต่อ
        </h3>

        <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              label="Store Name"
              required
              value={storename}
              onChange={setStorename}
              placeholder="กรอก Store Name"
              disabled={!formEditable}
            />
            <FormField
              label="API Key"
              required
              value={apikey}
              onChange={setApikey}
              placeholder={
                isEnabled && !isEditing && !needsCredentials
                  ? "••••••••"
                  : "กรอก API Key"
              }
              disabled={!formEditable}
            />
            <FormField
              label="API Secret"
              required
              type="password"
              value={apisecret}
              onChange={setApisecret}
              placeholder={
                isEnabled && !isEditing && !needsCredentials
                  ? "••••••••"
                  : "กรอก API Secret"
              }
              disabled={!formEditable}
            />
          </div>

          {formEditable ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <ActionButton
                disabled={isSubmitting}
                onClick={() => void handleConnect()}
                label={
                  isSubmitting
                    ? "กำลังบันทึก..."
                    : isEditing
                      ? "บันทึกการเปลี่ยนแปลง"
                      : needsCredentials
                        ? "บันทึกและเชื่อมต่อ"
                        : "บันทึกและเปิดการเชื่อมต่อ"
                }
              />
              {isEditing ? (
                <ActionButton
                  disabled={isSubmitting}
                  onClick={handleCancelEditing}
                  label="ยกเลิก"
                  variant="outlined"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {isEnabled ? (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-defualt-text">
            <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-brown-100 text-xs font-semibold text-white">
              2
            </span>
            Webhook URL และ Keys
          </h3>

          <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
            <div className="space-y-5">
              <CopyField
                label="Webhook URL"
                value={status.webhook_base_url ?? ""}
                onCopy={(value) => void copyToClipboard(value, " Webhook URL ")}
              />
              <div className="border-t border-gray-200" />
              <div className="grid gap-5 sm:grid-cols-3">
                <CopyField
                  label="key1"
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
        </section>
      ) : null}

      {copyMessage ? (
        <p className="text-xs text-brown-100">{copyMessage}</p>
      ) : null}
      {error ? <p className="text-sm text-red-100">{error}</p> : null}

      {isEnabled ? <ZortoutWebhookLogs /> : null}
    </div>
  );
}

function FormField({
  label,
  required,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "password";
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-defualt-text">
        {label}
        {required ? (
          <span className="ml-1 text-xs text-gray-100">(บังคับกรอก)</span>
        ) : null}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-defualt-text placeholder-gray-100 outline-none transition focus:border-brown-100 focus:ring-1 focus:ring-brown-100 disabled:cursor-not-allowed disabled:bg-gray-10 disabled:opacity-70"
      />
    </div>
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
