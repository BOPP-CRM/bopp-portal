"use client";

import { ActionButton } from "@/components/connections/shared";
import { ContentSkeleton } from "@/components/util/Skeleton";
import {
  getOpenAiStatus,
  removeOpenAiApiKey,
  saveOpenAiApiKey,
} from "@/services/openai/openai";
import type { OpenAiStatus } from "@/services/openai/types";
import { handleError } from "@/utils/errors";
import { Info, KeyRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import dialog from "@/components/util/dialog";

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

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50">
          <KeyRound className="size-6 text-emerald-700" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-defualt-text">OpenAI</h2>
          <p className="mt-1 text-sm text-gray-100">
            ใช้ API Key ของท่านเพื่อให้ AI อ่านรูปใบเสร็จและสร้างรายการขาย
            ข้อมูล API Key จัดเก็บในระบบของ Partner และไม่แสดงให้ผู้อื่นเห็น
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {status?.configured && !isEditing ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
            <p className="text-gray-100">API Key ที่บันทึกไว้</p>
            <p className="mt-1 font-mono text-defualt-text">
              {status.masked_key || "sk-..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              label="เปลี่ยน API Key"
              onClick={() => {
                setApiKey("");
                setIsEditing(true);
              }}
              disabled={isSubmitting}
            />
            <ActionButton
              label="ลบ API Key"
              onClick={() => void handleRemove()}
              disabled={isSubmitting}
              variant="outlined"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-defualt-text">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brown-100"
              autoComplete="off"
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
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              label={status?.configured ? "บันทึก API Key ใหม่" : "บันทึก API Key"}
              onClick={() => void handleSave()}
              disabled={isSubmitting}
            />
            {status?.configured ? (
              <ActionButton
                label="ยกเลิก"
                onClick={() => {
                  setApiKey("");
                  setIsEditing(false);
                }}
                disabled={isSubmitting}
                variant="outlined"
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
