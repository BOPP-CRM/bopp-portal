"use client";

import {
  disableOmisell,
  enableOmisell,
  getOmisellStatus,
  regenerateOmisellSecret,
} from "@/services/omisell/omisell";
import type { OmisellStatus } from "@/services/omisell/types";
import { ActionButton, CopyField } from "@/components/connections/shared";
import OmisellWebhookLogs from "@/components/connections/OmisellWebhookLogs";
import dialog from "@/components/util/dialog";
import { ContentSkeleton } from "@/components/util/Skeleton";
import { handleError } from "@/utils/errors";
import { Info, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const COUNTRY_OPTIONS = [{ value: "TH", label: "TH - Thailand" }];

export default function OmisellPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<OmisellStatus | null>(null);

  // Form state
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [country, setCountry] = useState("TH");

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const response = await getOmisellStatus();
      const s = response.omisell;
      setStatus(s);
      // Pre-fill form with existing values
      if (s.api_key) setApiKey(s.api_key);
      if (s.api_secret) setApiSecret(s.api_secret);
      if (s.seller_id) setSellerId(s.seller_id);
      if (s.country) setCountry(s.country);
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
    if (!apiKey || !apiSecret || !sellerId || !country) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await enableOmisell({
        api_key: apiKey,
        api_secret: apiSecret,
        seller_id: sellerId,
        country,
      });
      setStatus(response.omisell);
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateSecret = async () => {
    const result = await dialog.fire({
      title: "สร้าง Webhook Secret ใหม่",
      description:
        "ต้องอัปเดต secret ใน Omisell Portal ด้วย มิฉะนั้น webhook จะไม่ทำงาน",
      icon: <Info className="text-brown-100" />,
      confirmText: "สร้างใหม่",
      confirmVariant: "primary",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await regenerateOmisellSecret();
      setStatus(response.omisell);
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async () => {
    const result = await dialog.fire({
      title: "ปิดการเชื่อมต่อ Omisell",
      description:
        "การรับออเดอร์จาก Omisell จะหยุดลงจนกว่าจะเปิดการเชื่อมต่ออีกครั้ง",
      icon: <Info className="text-brown-100" />,
      confirmText: "ปิดการเชื่อมต่อ",
      confirmVariant: "primary",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await disableOmisell();
      setStatus(response.omisell);
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-defualt-text">
              Omisell Integration
            </h2>
            <OmisellStatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-gray-100">
            เชื่อมต่อกับ Omisell เพื่อให้คะแนนสมาชิกเมื่อออเดอร์ชำระเงินแล้ว
          </p>
        </div>

        {isEnabled && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <ActionButton
              disabled={isSubmitting}
              onClick={() => void handleRegenerateSecret()}
              label={isSubmitting ? "กำลังสร้าง..." : "สร้าง Secret ใหม่"}
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
        )}
      </div>

      {/* Step 1: Configuration form */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-defualt-text">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-brown-100 text-xs font-semibold text-white">
            1
          </span>
          กรอกข้อมูลการเชื่อมต่อ
        </h3>

        <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Omisell API Key"
              required
              value={apiKey}
              onChange={setApiKey}
              placeholder="กรอก API Key"
              disabled={isEnabled}
            />
            <FormField
              label="Omisell API Secret"
              required
              value={apiSecret}
              onChange={setApiSecret}
              placeholder="กรอก API Secret"
              disabled={isEnabled}
            />
            <FormField
              label="Omisell Seller ID"
              required
              value={sellerId}
              onChange={setSellerId}
              placeholder="กรอก Seller ID"
              disabled={isEnabled}
            />
            <CountrySelect
              label="Omisell Country"
              required
              value={country}
              onChange={setCountry}
              disabled={isEnabled}
            />
          </div>

          {!isEnabled && (
            <div className="mt-5">
              <ActionButton
                disabled={isSubmitting}
                onClick={() => void handleEnable()}
                label={
                  isSubmitting
                    ? "กำลังเปิดการเชื่อมต่อ..."
                    : "บันทึกและเปิด Omisell Enabled"
                }
              />
            </div>
          )}
        </div>
      </section>

      {isEnabled && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-defualt-text">
            <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-brown-100 text-xs font-semibold text-white">
              2
            </span>
            Webhook URL และ Client Secret
          </h3>

          <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
            <div className="space-y-5">
              <CopyField
                label="Webhook URL"
                value={status.webhook_url ?? ""}
                onCopy={(value) => void copyToClipboard(value, " Webhook URL ")}
              />
              <div className="border-t border-gray-200" />
              <CopyField
                label="Client Secret"
                value={status.authorization ?? ""}
                onCopy={(value) => void copyToClipboard(value, " Client Secret ")}
              />
            </div>
          </div>
        </section>
      )}

      {copyMessage ? (
        <p className="text-xs text-brown-100">{copyMessage}</p>
      ) : null}
      {error ? <p className="text-sm text-red-100">{error}</p> : null}

      {isEnabled && <OmisellWebhookLogs />}
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
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
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
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-defualt-text placeholder-gray-100 outline-none transition focus:border-brown-100 focus:ring-1 focus:ring-brown-100 disabled:cursor-not-allowed disabled:bg-gray-10 disabled:opacity-70"
      />
    </div>
  );
}

function CountrySelect({
  label,
  required,
  value,
  onChange,
  disabled,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-defualt-text">
        {label}
        {required ? (
          <span className="ml-1 text-xs text-gray-100">(บังคับกรอก)</span>
        ) : null}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-defualt-text outline-none transition focus:border-brown-100 focus:ring-1 focus:ring-brown-100 disabled:cursor-not-allowed disabled:bg-gray-10 disabled:opacity-70"
      >
        {COUNTRY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function OmisellStatusBadge({ status }: { status: OmisellStatus }) {
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
