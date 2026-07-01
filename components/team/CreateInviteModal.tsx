"use client";

import { createTeamInvite } from "@/services/team/team";
import type { PortalRole, PortalTeamInvite } from "@/services/team/types";
import Select from "@/components/util/Select";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { PORTAL_ROLE_OPTIONS } from "@/utils/roles";
import { Copy } from "lucide-react";
import { useEffect, useState } from "react";

const MODAL_EXIT_MS = 250;

type CreateInviteModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

export default function CreateInviteModal({
  onClose,
  onSuccess,
}: CreateInviteModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PortalRole>("operation");
  const [createdInvite, setCreatedInvite] = useState<PortalTeamInvite | null>(
    null,
  );
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), MODAL_EXIT_MS);
  };

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
  }, [isSubmitting]);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("คัดลอกลิงก์แล้ว");
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("ไม่สามารถคัดลอกได้");
      setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setIsSubmitting(true);
    try {
      const invite = await createTeamInvite({
        name: name.trim(),
        email: email.trim(),
        role,
      });
      setCreatedInvite(invite);
      onSuccess();
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
        className={`w-full max-w-lg rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-defualt-text">
          {createdInvite ? "สร้าง Invite สำเร็จ" : "เชิญสมาชิกทีม"}
        </h2>
        <p className="mt-1 text-sm text-gray-100">
          {createdInvite
            ? "ส่งลิงก์นี้ให้ผู้ใช้เพื่อตั้งรหัสผ่านและเข้าระบบ"
            : "สร้างลิงก์เชิญหมดอายุใน 72 ชม."}
        </p>

        {createdInvite ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-10 p-4 text-sm">
              <p className="text-gray-100">อีเมล</p>
              <p className="font-medium text-defualt-text">
                {createdInvite.email}
              </p>
              <p className="mt-3 text-gray-100">หมดอายุ</p>
              <p className="font-medium text-defualt-text">
                {formatDateTime(createdInvite.expires_at)}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-defualt-text">
                Invite Link
              </p>
              <div className="flex min-w-0 items-start gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-gray-10 px-3 py-2 text-xs">
                  {createdInvite.invite_url}
                </code>
                <button
                  type="button"
                  onClick={() => void copyUrl(createdInvite.invite_url)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-4xl border border-gray-200 px-3 py-2 text-xs text-defualt-text transition hover:bg-gray-10"
                >
                  <Copy className="size-3.5" />
                  คัดลอก
                </button>
              </div>
              {copyMessage ? (
                <p className="mt-2 text-xs text-brown-100">{copyMessage}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="w-full cursor-pointer rounded-4xl bg-brown-100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
            >
              ปิด
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Field label="ชื่อ">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClassName}
                required
              />
            </Field>
            <Field label="อีเมล">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
                required
              />
            </Field>

            <Field label="Role">
              <Select value={role} options={PORTAL_ROLE_OPTIONS} onChange={setRole} />
            </Field>

            {error ? <p className="text-sm text-red-100">{error}</p> : null}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={closeModal}
                className="w-full cursor-pointer rounded-4xl bg-gray-10 px-4 py-2.5 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer rounded-4xl bg-brown-100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "กำลังสร้าง..." : "สร้าง Invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-defualt-text">
        {label}
      </label>
      {children}
    </div>
  );
}
