"use client";

import { updateTeamUser } from "@/services/team/team";
import type { PortalRole, PortalTeamUser } from "@/services/team/types";
import Select from "@/components/util/Select";
import { handleError } from "@/utils/errors";
import { PORTAL_ROLE_OPTIONS } from "@/utils/roles";
import { useEffect, useMemo, useState } from "react";

const MODAL_EXIT_MS = 250;

type EditTeamUserModalProps = {
  user: PortalTeamUser;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

export default function EditTeamUserModal({
  user,
  onClose,
  onSuccess,
}: EditTeamUserModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<PortalRole>(user.role ?? "admin");
  const [active, setActive] = useState(user.active);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeOptions = useMemo(
    () => [
      { value: "true" as const, label: "ใช้งาน" },
      { value: "false" as const, label: "ปิดใช้งาน" },
    ],
    [],
  );

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

    if (!name.trim()) {
      setError("กรุณาระบุชื่อ");
      return;
    }

    if (password && password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    const payload = {
      name: name.trim(),
      role,
      active,
      ...(password ? { password } : {}),
    };

    const hasChanges =
      payload.name !== user.name ||
      payload.role !== (user.role ?? "admin") ||
      payload.active !== user.active ||
      Boolean(password);

    if (!hasChanges) {
      closeModal();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTeamUser(user.id, payload);
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
        <h2 className="text-xl font-bold text-defualt-text">แก้ไขสมาชิกทีม</h2>
        <p className="mt-1 text-sm text-gray-100">{user.email}</p>

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

          <Field label="Role">
            <Select value={role} options={PORTAL_ROLE_OPTIONS} onChange={setRole} />
          </Field>

          <Field label="สถานะ">
            <Select
              value={active ? "true" : "false"}
              options={activeOptions}
              onChange={(value) => setActive(value === "true")}
            />
          </Field>

          <Field label="รหัสผ่านใหม่ (ไม่บังคับ)">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              minLength={8}
              placeholder="เว้นว่างหากไม่เปลี่ยน"
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
