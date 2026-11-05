"use client";

import { getTeamUsers, updateTeamUser } from "@/services/team/team";
import type { PortalRole, PortalTeamUser } from "@/services/team/types";
import Select from "@/components/util/Select";
import { FormFieldsSkeleton } from "@/components/util/Skeleton";
import { handleError } from "@/utils/errors";
import { PORTAL_ROLE_OPTIONS } from "@/utils/roles";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type EditTeamUserPageProps = {
  userId: number;
};

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brown-100";

export default function EditTeamUserModal({ userId }: EditTeamUserPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<PortalTeamUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [role, setRole] = useState<PortalRole>("operation");
  const [active, setActive] = useState(true);
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

  useEffect(() => {
    let cancelled = false;
    void getTeamUsers({ limit: 200 })
      .then((data) => {
        if (cancelled) return;
        const found = data.teamUsers.find((item) => item.id === userId) ?? null;
        setUser(found);
        if (found) {
          setName(found.name);
          setRole(found.role ?? "admin");
          setActive(found.active);
        } else {
          setError("ไม่พบสมาชิกทีม");
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(handleError(loadError).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const goBack = (saved = false) => {
    router.push(saved ? "/dashboard/team?saved=1" : "/dashboard/team");
  };

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

    if (!user) return;

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
      goBack();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTeamUser(user.id, payload);
      goBack(true);
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="p-3 md:p-5">
        <Link
          href="/dashboard/team"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-100 hover:text-brown-100"
        >
          <ArrowLeft className="size-4" />
          กลับไปจัดการทีม
        </Link>
        <div className="rounded-md border border-gray-200 bg-white p-4 md:p-5">
          {error ? (
            <p className="text-sm text-red-100">{error}</p>
          ) : (
            <FormFieldsSkeleton fields={4} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-5">
      <Link
        href="/dashboard/team"
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-100 hover:text-brown-100"
      >
        <ArrowLeft className="size-4" />
        กลับไปจัดการทีม
      </Link>
      <div className="rounded-md border border-gray-200 bg-white p-4 md:p-5">
        <h1 className="text-xl font-bold text-defualt-text">แก้ไขสมาชิกทีม</h1>
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
            <Link
              href="/dashboard/team"
              className="inline-flex w-full items-center justify-center rounded-4xl bg-gray-10 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer rounded-4xl bg-brown-100 px-3 py-2 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
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
