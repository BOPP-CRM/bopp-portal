"use client";

import { createTeamUser } from "@/services/team/team";
import type { PortalRole } from "@/services/team/types";
import Select from "@/components/util/Select";
import { handleError } from "@/utils/errors";
import { PORTAL_ROLE_OPTIONS } from "@/utils/roles";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brown-100";

export default function CreateTeamUserModal() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<PortalRole>("operation");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push("/dashboard/team?saved=1");
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-xl font-bold text-defualt-text">เพิ่มสมาชิกทีม</h1>
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
