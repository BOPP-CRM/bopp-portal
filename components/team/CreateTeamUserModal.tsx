"use client";

import { createTeamUser } from "@/services/team/team";
import type { PortalRole } from "@/services/team/types";
import Select from "@/components/util/Select";
import { handleError } from "@/utils/errors";
import { PORTAL_ROLE_OPTIONS } from "@/utils/roles";
import { useEffect, useState } from "react";

const MODAL_EXIT_MS = 250;

type CreateTeamUserModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

export default function CreateTeamUserModal({
  onClose,
  onSuccess,
}: CreateTeamUserModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<PortalRole>("operation");
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

    if (!name.trim() || !email.trim() || !password) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTeamUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
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
        className={`w-full max-w-md rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-defualt-text">เพิ่มสมาชิกทีม</h2>
        <p className="mt-1 text-sm text-gray-100">
          สร้างบัญชี Portal โดยกำหนดรหัสผ่านให้เลย
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
          <Field label="รหัสผ่าน">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              minLength={8}
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
              {isSubmitting ? "กำลังสร้าง..." : "สร้าง"}
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
