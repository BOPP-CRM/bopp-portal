"use client";

import { ActionButton } from "@/components/connections/shared";
import dialog from "@/components/util/dialog";
import { ContentSkeleton } from "@/components/util/Skeleton";
import {
  getOpenAiStatus,
  removeOpenAiApiKey,
  saveOpenAiApiKey,
} from "@/services/openai/openai";
import type { OpenAiStatus } from "@/services/openai/types";
import { handleError } from "@/utils/errors";
import { Info } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const OPENAI_LOGO = "/openai.png";

export default function OpenAiPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<OpenAiStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const loadStatus = useCallback(async () => {
    setError(null);
    try {
      const next = await getOpenAiStatus();
      setStatus(next);
      if (!next.configured) {
        setIsEditing(true);
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

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError("กรุณาระบุ OpenAI API Key");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await saveOpenAiApiKey(apiKey.trim());
      setStatus(response.openai);
      setApiKey("");
      setIsEditing(false);
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    const result = await dialog.fire({
      title: "ลบ OpenAI API Key",
      description:
        "การ sync ใบเสร็จไปรายการขายด้วย AI จะไม่สามารถใช้งานได้จนกว่าจะตั้งค่า API Key ใหม่",
      icon: <Info className="text-brown-100" />,
      confirmText: "ลบ API Key",
      confirmVariant: "primary",
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await removeOpenAiApiKey();
      setStatus(response.openai);
      setIsEditing(true);
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ContentSkeleton />;
  }

  const isConfigured = Boolean(status?.configured);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <img
            src={OPENAI_LOGO}
            alt="OpenAI"
            className="size-14 shrink-0 rounded-2xl bg-white object-contain shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-defualt-text">
                OpenAI Integration
              </h2>
              <OpenAiStatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-gray-100">
              ใช้ API Key ของท่านเพื่อให้ AI อ่านรูปใบเสร็จและสร้างรายการขาย
            </p>
          </div>
        </div>

        {isConfigured && !isEditing ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <ActionButton
              disabled={isSubmitting}
              onClick={() => {
                setApiKey("");
                setError(null);
                setIsEditing(true);
              }}
              label="เปลี่ยน API Key"
              variant="outlined"
            />
            <ActionButton
              disabled={isSubmitting}
              onClick={() => void handleRemove()}
              label={isSubmitting ? "กำลังลบ..." : "ลบ API Key"}
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
          ตั้งค่า API Key
        </h3>

        <div className="rounded-2xl border border-gray-200 p-4 sm:p-5">
          {isConfigured && !isEditing ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-defualt-text">
                API Key ที่บันทึกไว้
              </p>
              <code className="block break-all rounded-lg bg-gray-10 px-3 py-2 font-mono text-sm text-defualt-text">
                {status?.masked_key || "sk-..."}
              </code>
            </div>
          ) : (
            <>
              <label className="mb-1.5 block text-sm font-medium text-defualt-text">
                OpenAI API Key
                <span className="ml-1 text-xs text-gray-100">(บังคับกรอก)</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-..."
                disabled={isSubmitting}
                autoComplete="off"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-defualt-text placeholder-gray-100 outline-none transition focus:border-brown-100 focus:ring-1 focus:ring-brown-100 disabled:cursor-not-allowed disabled:bg-gray-10 disabled:opacity-70"
              />
              <p className="mt-2 text-xs text-gray-100">
                สร้าง API Key ได้ที่{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brown-100 underline"
                >
                  platform.openai.com
                </a>
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <ActionButton
                  disabled={isSubmitting}
                  onClick={() => void handleSave()}
                  label={
                    isSubmitting
                      ? "กำลังบันทึก..."
                      : isConfigured
                        ? "บันทึก API Key ใหม่"
                        : "บันทึก API Key"
                  }
                />
                {isConfigured ? (
                  <ActionButton
                    disabled={isSubmitting}
                    onClick={() => {
                      setApiKey("");
                      setError(null);
                      setIsEditing(false);
                    }}
                    label="ยกเลิก"
                    variant="outlined"
                  />
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>

      {error ? <p className="text-sm text-red-100">{error}</p> : null}
    </div>
  );
}

function OpenAiStatusBadge({ status }: { status: OpenAiStatus | null }) {
  if (!status?.configured) {
    return (
      <span className="rounded-full bg-gray-10 px-2.5 py-1 text-xs font-medium text-gray-100">
        ยังไม่ได้ตั้งค่า
      </span>
    );
  }

  return (
    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
      ตั้งค่าแล้ว
    </span>
  );
}
