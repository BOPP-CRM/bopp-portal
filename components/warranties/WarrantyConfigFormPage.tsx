"use client";

import { FormFieldsSkeleton } from "@/components/util/Skeleton";
import {
  createWarrantyContributor,
  createWarrantyStatus,
  getWarrantyConfig,
  updateWarrantyContributor,
  updateWarrantyStatusConfig,
  type WarrantyContributor,
  type WarrantyStatus,
} from "@/services/warranties/warranties";
import { handleError } from "@/utils/errors";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brown-100";

type WarrantyConfigFormPageProps = {
  kind: "contributor" | "status";
  itemId: number | null;
};

export default function WarrantyConfigFormPage({
  kind,
  itemId,
}: WarrantyConfigFormPageProps) {
  const router = useRouter();
  const [contributor, setContributor] = useState<WarrantyContributor | null>(
    null,
  );
  const [status, setStatus] = useState<WarrantyStatus | null>(null);
  const [loading, setLoading] = useState(itemId !== null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (itemId === null) return;
    let cancelled = false;
    void getWarrantyConfig()
      .then((config) => {
        if (cancelled) return;
        if (kind === "contributor") {
          const found =
            config.contributors?.find((item) => item.id === itemId) ?? null;
          setContributor(found);
          if (!found) setError("ไม่พบช่องทาง");
        } else {
          const found =
            config.statuses?.find((item) => item.id === itemId) ?? null;
          setStatus(found);
          if (!found) setError("ไม่พบสถานะ");
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
  }, [itemId, kind]);

  const title =
    kind === "contributor"
      ? itemId
        ? "แก้ไขช่องทาง"
        : "เพิ่มช่องทาง"
      : itemId
        ? "แก้ไขสถานะ"
        : "เพิ่มสถานะ";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError(null);

    try {
      if (kind === "contributor") {
        const payload = {
          name: String(formData.get("name") || "").trim(),
          sequence: Number(formData.get("sequence") || 10),
          active: formData.get("active") === "on",
        };
        if (contributor) {
          await updateWarrantyContributor(contributor.id, payload);
        } else {
          await createWarrantyContributor(payload);
        }
      } else {
        const payload = {
          code: String(formData.get("code") || "").trim(),
          label: String(formData.get("label") || "").trim(),
          sequence: Number(formData.get("sequence") || 10),
          color: String(formData.get("color") || "").trim() || undefined,
          is_default: formData.get("is_default") === "on",
          active: formData.get("active") === "on",
        };
        if (status) {
          await updateWarrantyStatusConfig(status.id, payload);
        } else {
          await createWarrantyStatus(payload);
        }
      }
      router.push("/dashboard/warranties/config?saved=1");
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 md:p-5">
      <Link
        href="/dashboard/warranties/config"
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-100 hover:text-brown-100"
      >
        <ArrowLeft className="size-4" />
        กลับไปตั้งค่ารับประกัน
      </Link>
      <div className="rounded-md border border-gray-200 bg-white p-4 md:p-5">
        <h1 className="text-xl font-bold text-defualt-text">{title}</h1>
        {loading ? (
          <div className="mt-5">
            <FormFieldsSkeleton fields={4} />
          </div>
        ) : error && itemId && !contributor && !status ? (
          <p className="mt-5 text-sm text-red-100">{error}</p>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            {kind === "contributor" ? (
              <>
                <FormField label="ชื่อช่องทาง *">
                  <input
                    name="name"
                    required
                    defaultValue={contributor?.name ?? ""}
                    className={inputClassName}
                  />
                </FormField>
                <FormField label="ลำดับ">
                  <input
                    name="sequence"
                    type="number"
                    defaultValue={contributor?.sequence ?? 10}
                    className={inputClassName}
                  />
                </FormField>
                <label className="flex items-center gap-2 text-sm text-defualt-text">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={contributor?.active ?? true}
                  />
                  เปิดใช้งาน
                </label>
              </>
            ) : (
              <>
                <FormField label="Code *">
                  <input
                    name="code"
                    required
                    defaultValue={status?.code ?? ""}
                    className={inputClassName}
                    placeholder="pending"
                  />
                </FormField>
                <FormField label="Label *">
                  <input
                    name="label"
                    required
                    defaultValue={status?.label ?? ""}
                    className={inputClassName}
                    placeholder="รอตรวจสอบ"
                  />
                </FormField>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="ลำดับ">
                    <input
                      name="sequence"
                      type="number"
                      defaultValue={status?.sequence ?? 10}
                      className={inputClassName}
                    />
                  </FormField>
                  <FormField label="สี (Hex)">
                    <input
                      name="color"
                      defaultValue={status?.color ? String(status.color) : ""}
                      className={inputClassName}
                      placeholder="#FFC107"
                    />
                  </FormField>
                </div>
                <label className="flex items-center gap-2 text-sm text-defualt-text">
                  <input
                    type="checkbox"
                    name="is_default"
                    defaultChecked={status?.is_default ?? false}
                  />
                  สถานะเริ่มต้นเมื่อ member ส่งฟอร์ม
                </label>
                <label className="flex items-center gap-2 text-sm text-defualt-text">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={status?.active ?? true}
                  />
                  เปิดใช้งาน
                </label>
              </>
            )}

            {error ? <p className="text-sm text-red-100">{error}</p> : null}

            <div className="flex gap-3 pt-2">
              <Link
                href="/dashboard/warranties/config"
                className="inline-flex w-full items-center justify-center rounded-4xl bg-gray-10 px-3 py-2 text-sm font-medium text-gray-100"
              >
                ยกเลิก
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer rounded-4xl bg-brown-100 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function FormField({
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
