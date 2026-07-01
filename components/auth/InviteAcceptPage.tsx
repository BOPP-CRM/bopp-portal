"use client";

import { FormFieldsSkeleton } from "@/components/util/Skeleton";
import { acceptInvite, getPublicInvite } from "@/services/auth/auth";
import type { PublicInvite } from "@/services/team/types";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { getDefaultDashboardPath } from "@/utils/roles";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-defualt-text outline-none transition focus:border-brown-100";

export default function InviteAcceptPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [invite, setInvite] = useState<PublicInvite | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("ลิงก์เชิญไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    void getPublicInvite(token)
      .then((data) => {
        setInvite(data);
        setName(data.name);
      })
      .catch((loadError) => {
        setError(handleError(loadError).message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) return;

    if (!name.trim()) {
      setError("กรุณาระบุชื่อ");
      return;
    }

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await acceptInvite(token, {
        name: name.trim(),
        password,
      });
      window.localStorage.setItem("partner_domain", result.partner.slug);
      window.location.replace(getDefaultDashboardPath(result.user.role));
    } catch (submitError) {
      setError(handleError(submitError).message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {invite?.partner.logo_url ? (
            <img
              src={invite.partner.logo_url}
              alt={invite.partner.name}
              className="mx-auto mb-4 size-16 object-contain"
            />
          ) : null}
          <h1 className="text-2xl font-semibold text-defualt-text">
            เข้าร่วมทีม Portal
          </h1>
          {invite ? (
            <p className="mt-2 text-sm text-gray-100">
              {invite.partner.name} เชิญคุณเข้าร่วม CRM Portal
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {loading ? (
            <FormFieldsSkeleton fields={3} />
          ) : invite ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-xl bg-gray-10 px-4 py-3 text-sm">
                <p className="text-gray-100">อีเมล</p>
                <p className="font-medium text-defualt-text">{invite.email}</p>
                <p className="mt-2 text-gray-100">หมดอายุ</p>
                <p className="font-medium text-defualt-text">
                  {formatDateTime(invite.expires_at)}
                </p>
              </div>

              <Field label="ชื่อ">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
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

              <Field label="ยืนยันรหัสผ่าน">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClassName}
                  minLength={8}
                  required
                />
              </Field>

              {error ? <p className="text-sm text-red-100">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer rounded-4xl bg-brown-100 px-4 py-3 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "กำลังตั้งรหัสผ่าน..." : "ยอมรับคำเชิญ"}
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-red-100">
              {error ?? "ไม่พบคำเชิญ"}
            </p>
          )}
        </div>
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
