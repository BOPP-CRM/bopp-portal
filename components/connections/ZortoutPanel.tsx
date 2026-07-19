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
import { displayValue } from "@/utils/format";
import { CheckCircle2, Info, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const ZORTOUT_LOGO = "/zoutout.png";

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

export default function ZortoutPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<ZortoutStatus | null>(null);
  const [storename, setStorename] = useState("");
  const [apikey, setApikey] = useState("");
  const [apisecret, setApisecret] = useState("");

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

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await connectZortout({
        storename: storename.trim(),
        apikey: apikey.trim(),
        apisecret: apisecret.trim(),
      });
      setStatus(response.zortout);
      setStorename("");
      setApikey("");
      setApisecret("");
      setSuccessMessage("เชื่อมต่อสำเร็จ");
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResync = async () => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await syncZortoutWebhook();
      setStatus(response.zortout);
      setSuccessMessage("อัปเดต Webhook แล้ว");
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisable = async () => {
    const result = await dialog.fire({
      title: "ปิดการเชื่อมต่อ",
      description: "Webhook จาก ZORT จะหยุดทำงานจนกว่าจะเชื่อมต่อใหม่",
      icon: <Info className="text-brown-100" />,
      confirmText: "ปิดการเชื่อมต่อ",
      confirmVariant: "primary",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
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
      description: "ระบบจะสร้าง Key ใหม่แล้ว sync ไปที่ Zortout ให้อัตโนมัติ",
      icon: <Info className="text-brown-100" />,
      confirmText: "สร้าง Key ใหม่",
      confirmVariant: "primary",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const regenerated = await regenerateZortoutKeys();
      setStatus(regenerated.zortout);
      const synced = await syncZortoutWebhook();
      setStatus(synced.zortout);
      setSuccessMessage("อัปเดต Key และ sync Webhook แล้ว");
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
  const needsCredentials = isActive && !status.api_credentials_configured;

  return (
    <div className="space-y-8 p-6 md:p-8">
      <ZortoutHeader status={status} />

      {!isActive || needsCredentials ? (
        <ConnectForm
          storename={storename}
          apikey={apikey}
          apisecret={apisecret}
          isSubmitting={isSubmitting}
          submitLabel={
            needsCredentials ? "บันทึกและเชื่อมต่อ" : "เชื่อมต่อ"
          }
          onStorenameChange={setStorename}
          onApikeyChange={setApikey}
          onApisecretChange={setApisecret}
          onSubmit={handleConnect}
        />
      ) : (
        <ConnectedSummary
          status={status}
          isSubmitting={isSubmitting}
          onCopy={(value, label) => void copyToClipboard(value, label)}
          onResync={() => void handleResync()}
          onRegenerateKeys={() => void handleRegenerateKeys()}
          onDisable={() => void handleDisable()}
        />
      )}

      <ZortoutWebhookLogs />

      {copyMessage ? (
        <p className="text-xs text-brown-100">{copyMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="text-sm text-green-700">{successMessage}</p>
      ) : null}
      {error ? <p className="text-sm text-red-100">{error}</p> : null}
    </div>
  );
}

function ZortoutHeader({ status }: { status: ZortoutStatus }) {
  return (
    <div className="flex items-center gap-4">
      <img
        src={ZORTOUT_LOGO}
        alt="Zortout"
        className="size-14 shrink-0 rounded-2xl object-cover shadow-sm"
      />
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-defualt-text">Zortout</h2>
        <ZortoutStatusBadge status={status} />
      </div>
    </div>
  );
}

function ConnectForm({
  storename,
  apikey,
  apisecret,
  isSubmitting,
  submitLabel,
  onStorenameChange,
  onApikeyChange,
  onApisecretChange,
  onSubmit,
}: {
  storename: string;
  apikey: string;
  apisecret: string;
  isSubmitting: boolean;
  submitLabel: string;
  onStorenameChange: (value: string) => void;
  onApikeyChange: (value: string) => void;
  onApisecretChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <section className="max-w-md">
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="text"
          value={storename}
          onChange={(event) => onStorenameChange(event.target.value)}
          className={inputClassName}
          placeholder="Store Name"
          autoComplete="off"
          required
        />
        <input
          type="text"
          value={apikey}
          onChange={(event) => onApikeyChange(event.target.value)}
          className={inputClassName}
          placeholder="API Key"
          autoComplete="off"
          required
        />
        <input
          type="password"
          value={apisecret}
          onChange={(event) => onApisecretChange(event.target.value)}
          className={inputClassName}
          placeholder="API Secret"
          autoComplete="off"
          required
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full cursor-pointer rounded-4xl bg-brown-100 px-4 py-3 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "กำลังเชื่อมต่อ..." : submitLabel}
        </button>
      </form>
    </section>
  );
}

function ConnectedSummary({
  status,
  isSubmitting,
  onCopy,
  onResync,
  onRegenerateKeys,
  onDisable,
}: {
  status: ZortoutStatus;
  isSubmitting: boolean;
  onCopy: (value: string, label?: string) => void;
  onResync: () => void;
  onRegenerateKeys: () => void;
  onDisable: () => void;
}) {
  return (
    <section className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50/50 px-4 py-3">
        <CheckCircle2 className="size-5 shrink-0 text-green-700" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-defualt-text">
            {displayValue(status.store_name)}
          </p>
          <p className="text-xs text-gray-100">
            {status.webhook_synced ? "Webhook พร้อมใช้งาน" : "รอ sync Webhook"}
          </p>
        </div>
      </div>

      <CopyField
        label="Webhook URL (ระบบ)"
        description="URL ที่ sync ไปยัง Zortout สำหรับทุก event"
        value={status.webhook_base_url ?? ""}
        onCopy={(value) => onCopy(value, " URL ")}
      />

      <div>
        <p className="text-sm font-medium text-defualt-text">
          Webhook Keys (Zortout)
        </p>
        <p className="mt-1 text-xs text-gray-100">
          Key ของระบบที่ sync ไปยัง Zortout · key1 จำเป็น · key2 / key3
          ใส่ได้ตามต้องการ
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <CopyField
            label="key1"
            required
            value={status.key1 ?? ""}
            onCopy={(value) => onCopy(value, " key1 ")}
          />
          <CopyField
            label="key2"
            value={status.key2 ?? ""}
            onCopy={(value) => onCopy(value, " key2 ")}
          />
          <CopyField
            label="key3"
            value={status.key3 ?? ""}
            onCopy={(value) => onCopy(value, " key3 ")}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton
          disabled={isSubmitting || !status.api_credentials_configured}
          onClick={onResync}
          label={isSubmitting ? "..." : "อัปเดต"}
          icon={<RefreshCw className="size-4" />}
          variant="outlined"
        />
        <ActionButton
          disabled={isSubmitting}
          onClick={onRegenerateKeys}
          label={isSubmitting ? "..." : "Key ใหม่"}
          icon={<RefreshCw className="size-4" />}
          variant="outlined"
        />
        <ActionButton
          disabled={isSubmitting}
          onClick={onDisable}
          label="ปิด"
          variant="outlined"
        />
      </div>
    </section>
  );
}

function ZortoutStatusBadge({ status }: { status: ZortoutStatus }) {
  if (!status.configured) {
    return (
      <span className="rounded-full bg-gray-10 px-2.5 py-0.5 text-xs font-medium text-gray-100">
        ยังไม่เชื่อมต่อ
      </span>
    );
  }

  if (status.enabled) {
    return (
      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
        เชื่อมต่อแล้ว
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-100">
      ปิดอยู่
    </span>
  );
}
