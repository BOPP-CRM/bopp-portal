"use client";

import {
  disableApiKey,
  enableApiKey,
  generateApiKey,
  getApiKeyStatus,
  getApiKeyUsage,
  rotateApiKey,
} from "@/services/auth/api-key";
import type {
  ApiKeyStatus,
  ApiKeyUsage,
  PortalMeResponse,
} from "@/services/auth/types";
import dialog from "@/components/util/dialog";
import { Skeleton } from "@/components/util/Skeleton";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { Copy, Info, Plug, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const MODAL_EXIT_MS = 250;

type ConnectionModalProps = {
  me: PortalMeResponse;
  onClose: () => void;
};

type ConnectionData = {
  status: ApiKeyStatus;
  usage: ApiKeyUsage;
  history: ApiKeyUsage[];
};

export default function ConnectionModal({ me, onClose }: ConnectionModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [data, setData] = useState<ConnectionData | null>(null);

  const closeModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => onClose(), MODAL_EXIT_MS);
  }, [onClose]);

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
        history: usageRes.history,
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

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) closeModal();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeModal, isSubmitting]);

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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-300/50 p-4 ${
        isClosing
          ? "opacity-0 transition-opacity duration-250 ease-in"
          : "animate-dialog-backdrop-in"
      }`}
      onClick={isSubmitting ? undefined : closeModal}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brown-yellow-5 text-brown-100">
            <Plug className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-defualt-text">BOPP MCP</h2>
            <p className="mt-1 text-sm text-gray-100">
              เชื่อมต่อ MCP ของ {me.partner.name}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : data ? (
          <div className="mt-6 space-y-5">
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
                  <h3 className="text-sm font-semibold text-defualt-text">
                    BOPP MCP
                  </h3>
                  <p className="mt-1 text-xs text-gray-100">
                    เชื่อมต่อ BOPP Portal กับ MCP ของ {me.partner.name}
                  </p>
                </div>
                <StatusBadge status={data.status} />
              </div>
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-100">MCP URL</p>
                <div className="mt-2 flex items-start gap-2">
                  <code className="flex-1 break-all rounded-lg bg-white px-3 py-2 text-xs text-defualt-text">
                    https://bopp-mcp.fly.dev/mcp
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      void copyToClipboard("https://bopp-mcp.fly.dev/mcp")
                    }
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
                  {copyMessage ? (
                    <p className="mt-2 text-xs text-brown-100">{copyMessage}</p>
                  ) : null}
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
                      label={
                        isSubmitting ? "กำลัง Rotate..." : "Rotate API Key"
                      }
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
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-100">{error}</p> : null}

        <div className="mt-6">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={closeModal}
            className="w-full cursor-pointer rounded-4xl bg-gray-10 px-4 py-2.5 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}

function UsageProgressTube({
  usage,
  compact = false,
}: {
  usage: ApiKeyUsage;
  compact?: boolean;
}) {
  const percent = getUsagePercent(usage);
  const tone = getUsageTone(percent, usage.unlimited);
  const statusText = getUsageStatusText(usage, percent);

  if (usage.unlimited) {
    return (
      <div className={`${compact ? "mt-0" : "mt-4"} rounded-2xl bg-white p-4`}>
        {!compact ? (
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-defualt-text">โควต้า</p>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              ไม่จำกัด
            </span>
          </div>
        ) : null}
        <div
          className={`overflow-hidden rounded-full bg-gray-10 ${
            compact ? "h-3" : "h-5"
          }`}
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-brown-100 to-brown-100/70"
            style={{ width: usage.used > 0 ? "100%" : "0%" }}
          />
        </div>
        {!compact ? (
          <p className="mt-2 text-xs text-gray-100">
            ใช้ไปแล้ว {formatNumber(usage.used)} tokens ในเดือนนี้
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${compact ? "mt-0" : "mt-4"} rounded-2xl bg-white p-4`}>
      {!compact ? (
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
      ) : null}

      <div
        className={`relative overflow-hidden rounded-full bg-gray-10 ring-1 ring-gray-200/80 ${
          compact ? "h-3" : "h-5"
        }`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone.barClass}`}
          style={{ width: `${percent}%` }}
        />
        {!compact && percent >= 75 ? (
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-white/70"
            style={{ left: "75%" }}
          />
        ) : null}
        {!compact && percent >= 90 ? (
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-white/70"
            style={{ left: "90%" }}
          />
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-3 flex items-center justify-between text-xs text-gray-100">
          <span>
            {formatNumber(usage.used)} / {formatNumber(usage.limit ?? 0)} tokens
          </span>
          <span>เหลือ {formatNumber(usage.remaining ?? 0)}</span>
        </div>
      ) : null}
    </div>
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
  if (usage.unlimited) {
    return "ไม่จำกัดจำนวน request";
  }
  if (percent >= 100) {
    return "ใช้โควต้าครบแล้ว";
  }
  if (percent >= 90) {
    return "ใกล้หมดโควต้าแล้ว";
  }
  if (percent >= 75) {
    return "ใช้โควต้าไปมากแล้ว";
  }
  if (usage.used === 0) {
    return "ยังไม่มีการใช้งานในเดือนนี้";
  }
  return "ยังใช้ได้อีก";
}

function UsageStat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-white px-3 py-3 ${className}`}>
      <p className="text-xs text-gray-100">{label}</p>
      <p className="mt-1 text-lg font-semibold text-defualt-text">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ApiKeyStatus }) {
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

function ActionButton({
  label,
  onClick,
  disabled,
  icon,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: "primary" | "outlined";
}) {
  const className =
    variant === "primary"
      ? "bg-brown-100 text-white hover:bg-brown-100/80"
      : "border border-gray-200 bg-white text-defualt-text hover:bg-gray-10";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-4xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {icon}
      {label}
    </button>
  );
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
