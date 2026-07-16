"use client";

import {
  disableApiKey,
  enableApiKey,
  generateApiKey,
  getApiKeyStatus,
  getApiKeyUsage,
  rotateApiKey,
} from "@/services/auth/api-key";
import type { ApiKeyStatus, ApiKeyUsage } from "@/services/auth/types";
import { ActionButton } from "@/components/connections/shared";
import dialog from "@/components/util/dialog";
import { ContentSkeleton } from "@/components/util/Skeleton";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { Copy, Info, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const MCP_URL = "https://bopp-mcp.fly.dev/mcp";

type ConnectionData = {
  status: ApiKeyStatus;
  usage: ApiKeyUsage;
};

export default function BoppMcpPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [data, setData] = useState<ConnectionData | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [statusRes, usageRes] = await Promise.all([
        getApiKeyStatus(),
        getApiKeyUsage(),
      ]);
      setData({
        status: statusRes.api_key,
        usage: usageRes.usage,
      });
    } catch (loadError) {
      setError(handleError(loadError).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("คัดลอกแล้ว");
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("ไม่สามารถคัดลอกได้");
      setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  const handleGenerate = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await generateApiKey();
      setRevealedKey(result.api_key.key ?? null);
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: {
                has_api_key: result.api_key.has_api_key,
                enabled: result.api_key.enabled,
              },
            }
          : prev,
      );
      await loadData();
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRotate = async () => {
    const result = await dialog.fire({
      title: "ยืนยันการ Rotate API Key",
      description:
        "API Key เดิมจะใช้งานไม่ได้ทันที ระบบที่เชื่อมต่ออยู่ต้องอัปเดต key ใหม่",
      icon: <Info className="text-brown-100" />,
      confirmText: "Rotate",
      confirmVariant: "primary",
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await rotateApiKey();
      setRevealedKey(response.api_key.key ?? null);
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: {
                has_api_key: response.api_key.has_api_key,
                enabled: response.api_key.enabled,
              },
            }
          : prev,
      );
      await loadData();
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!data) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = data.status.enabled
        ? await disableApiKey()
        : await enableApiKey();
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: response.api_key,
            }
          : prev,
      );
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ContentSkeleton />;
  }

  if (!data) {
    return error ? <p className="p-6 text-sm text-red-100">{error}</p> : null;
  }

  return (
    <div className="space-y-5 p-6">
      <section className="rounded-2xl border border-gray-200 bg-gray-10 p-4">
        <h3 className="text-sm font-semibold text-defualt-text">
          การใช้งาน Token
        </h3>
        <p className="mt-1 text-xs text-gray-100">
          จำนวน Token ที่ใช้ในเดือน {formatMonth(data.usage.month)}
        </p>
        <UsageProgressTube usage={data.usage} />
      </section>

      <section className="rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-defualt-text">BOPP MCP</h3>
            <p className="mt-1 text-xs text-gray-100">
              เชื่อมต่อ BOPP Portal กับ MCP Server
            </p>
          </div>
          <ApiKeyStatusBadge status={data.status} />
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-gray-100">MCP URL</p>
          <div className="mt-2 flex items-start gap-2">
            <code className="flex-1 break-all rounded-lg bg-gray-10 px-3 py-2 text-xs text-defualt-text">
              {MCP_URL}
            </code>
            <button
              type="button"
              onClick={() => void copyToClipboard(MCP_URL)}
              className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-brown-100 hover:bg-gray-10"
            >
              <Copy className="size-4" />
            </button>
          </div>
        </div>

        {revealedKey ? (
          <div className="mt-4 rounded-xl border border-brown-100/30 bg-brown-yellow-5 p-4">
            <p className="text-xs font-medium text-brown-100">
              บันทึก API Key นี้ทันที — จะไม่แสดงอีกครั้ง
            </p>
            <div className="mt-2 flex items-start gap-2">
              <code className="flex-1 break-all rounded-lg bg-white px-3 py-2 text-xs text-defualt-text">
                {revealedKey}
              </code>
              <button
                type="button"
                onClick={() => void copyToClipboard(revealedKey)}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-brown-100 hover:bg-gray-10"
                aria-label="คัดลอก API Key"
              >
                <Copy className="size-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {!data.status.has_api_key ? (
            <ActionButton
              disabled={isSubmitting}
              onClick={() => void handleGenerate()}
              label={isSubmitting ? "กำลังสร้าง..." : "สร้าง API Key"}
            />
          ) : (
            <>
              <ActionButton
                disabled={isSubmitting}
                onClick={() => void handleRotate()}
                label={isSubmitting ? "กำลัง Rotate..." : "Rotate API Key"}
                icon={<RefreshCw className="size-4" />}
                variant="outlined"
              />
              <ActionButton
                disabled={isSubmitting}
                onClick={() => void handleToggleEnabled()}
                label={
                  isSubmitting
                    ? "กำลังอัปเดต..."
                    : data.status.enabled
                      ? "ปิดใช้งาน"
                      : "เปิดใช้งาน"
                }
                variant="outlined"
              />
            </>
          )}
        </div>
      </section>

      {copyMessage ? (
        <p className="text-xs text-brown-100">{copyMessage}</p>
      ) : null}
      {error ? <p className="text-sm text-red-100">{error}</p> : null}
    </div>
  );
}

function UsageProgressTube({ usage }: { usage: ApiKeyUsage }) {
  const percent = getUsagePercent(usage);
  const tone = getUsageTone(percent, usage.unlimited);
  const statusText = getUsageStatusText(usage, percent);

  if (usage.unlimited) {
    return (
      <div className="mt-4 rounded-2xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-defualt-text">โควต้า</p>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            ไม่จำกัด
          </span>
        </div>
        <div className="h-5 overflow-hidden rounded-full bg-gray-10">
          <div
            className="h-full rounded-full bg-linear-to-r from-brown-100 to-brown-100/70"
            style={{ width: usage.used > 0 ? "100%" : "0%" }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-100">
          ใช้ไปแล้ว {formatNumber(usage.used)} tokens ในเดือนนี้
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-defualt-text">โควต้า</p>
          <p className={`mt-1 text-xs font-medium ${tone.textClass}`}>
            {statusText}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold leading-none ${tone.textClass}`}>
            {percent.toFixed(0)}%
          </p>
          <p className="mt-1 text-xs text-gray-100">ใช้ไปแล้ว</p>
        </div>
      </div>
      <div className="relative h-5 overflow-hidden rounded-full bg-gray-10 ring-1 ring-gray-200/80">
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone.barClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-100">
        <span>
          {formatNumber(usage.used)} / {formatNumber(usage.limit ?? 0)} tokens
        </span>
        <span>เหลือ {formatNumber(usage.remaining ?? 0)}</span>
      </div>
    </div>
  );
}

function ApiKeyStatusBadge({ status }: { status: ApiKeyStatus }) {
  if (!status.has_api_key) {
    return (
      <span className="rounded-full bg-gray-10 px-3 py-1 text-xs font-medium text-gray-100">
        ยังไม่มี Key
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

function getUsagePercent(usage: ApiKeyUsage) {
  if (usage.unlimited || !usage.limit) return 0;
  return Math.min((usage.used / usage.limit) * 100, 100);
}

function getUsageTone(percent: number, unlimited: boolean) {
  if (unlimited) {
    return {
      barClass: "bg-linear-to-r from-brown-100 to-brown-100/70",
      textClass: "text-brown-100",
    };
  }
  if (percent >= 100) {
    return {
      barClass: "bg-linear-to-r from-red-100 to-red-100/80",
      textClass: "text-red-100",
    };
  }
  if (percent >= 90) {
    return {
      barClass: "bg-linear-to-r from-red-100 to-orange-400",
      textClass: "text-red-100",
    };
  }
  if (percent >= 75) {
    return {
      barClass: "bg-linear-to-r from-amber-400 to-brown-100",
      textClass: "text-amber-600",
    };
  }
  return {
    barClass: "bg-linear-to-r from-brown-100 to-brown-100/70",
    textClass: "text-brown-100",
  };
}

function getUsageStatusText(usage: ApiKeyUsage, percent: number) {
  if (usage.unlimited) return "ไม่จำกัดจำนวน request";
  if (percent >= 100) return "ใช้โควต้าครบแล้ว";
  if (percent >= 90) return "ใกล้หมดโควต้าแล้ว";
  if (percent >= 75) return "ใช้โควต้าไปมากแล้ว";
  if (usage.used === 0) return "ยังไม่มีการใช้งานในเดือนนี้";
  return "ยังใช้ได้อีก";
}

function formatMonth(month: string) {
  const [year, monthNum] = month.split("-");
  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const index = Number.parseInt(monthNum, 10) - 1;
  if (index < 0 || index > 11 || !year) return month;
  return `${monthNames[index]} ${year}`;
}
