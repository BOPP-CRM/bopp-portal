"use client";

import { updateMe } from "@/services/auth/auth";
import type { PortalMeResponse } from "@/services/auth/types";
import { handleError } from "@/utils/errors";
import { useEffect, useState } from "react";

const MODAL_EXIT_MS = 250;

type ProfileSettingsModalProps = {
  me: PortalMeResponse;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

export default function ProfileSettingsModal({
  me,
  onClose,
  onSuccess,
}: ProfileSettingsModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState(me.user.name);
  const [email, setEmail] = useState(me.user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload: {
      name?: string;
      email?: string;
      current_password?: string;
      password?: string;
    } = {};

    if (name.trim() !== me.user.name) {
      payload.name = name.trim();
    }

    const emailChanged = email.trim() !== me.user.email;
    const passwordChanged = password.length > 0;

    if (emailChanged) {
      if (!currentPassword) {
        setError("กรุณาระบุรหัสผ่านปัจจุบันเพื่อเปลี่ยนอีเมล");
        return;
      }
      payload.email = email.trim();
      payload.current_password = currentPassword;
    }

    if (passwordChanged) {
      if (!currentPassword) {
        setError("กรุณาระบุรหัสผ่านปัจจุบันเพื่อเปลี่ยนรหัสผ่าน");
        return;
      }
      if (password.length < 8) {
        setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
        return;
      }
      payload.current_password = currentPassword;
      payload.password = password;
    }

    if (Object.keys(payload).length === 0) {
      closeModal();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateMe(payload);

      if (passwordChanged) {
        window.location.replace("/login");
        return;
      }

      onSuccess();
      closeModal();
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
        className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-defualt-text">ตั้งค่าบัญชี</h2>
        <p className="mt-1 text-sm text-gray-100">
          แก้ไขชื่อ อีเมล หรือรหัสผ่านของคุณ
        </p>

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

          <div className="rounded-xl border border-gray-200 bg-gray-10 p-4 text-xs text-gray-100">
            เปลี่ยนอีเมลหรือรหัสผ่านต้องระบุรหัสผ่านปัจจุบัน
            หากเปลี่ยนรหัสผ่านจะต้อง login ใหม่
          </div>

          <Field label="รหัสผ่านปัจจุบัน">
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={inputClassName}
              autoComplete="current-password"
            />
          </Field>

          <Field label="รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              minLength={8}
              autoComplete="new-password"
            />
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
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
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
