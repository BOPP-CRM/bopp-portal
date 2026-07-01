"use client";

import StatusBadge from "@/components/warranties/StatusBadge";
import { ModalDetailSkeleton } from "@/components/util/Skeleton";
import Select from "@/components/util/Select";
import {
  addWarrantyComment,
  getWarranty,
  getWarrantyStatuses,
  updateWarrantyStatus,
  type PortalWarranty,
  type WarrantyStatus,
} from "@/services/warranties/warranties";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { displayValue } from "@/utils/format";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const MODAL_EXIT_MS = 250;

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

type WarrantyDetailModalProps = {
  warrantyId: number;
  onClose: () => void;
  onSuccess: () => void;
};

export default function WarrantyDetailModal({
  warrantyId,
  onClose,
  onSuccess,
}: WarrantyDetailModalProps) {
  const [warranty, setWarranty] = useState<PortalWarranty | null>(null);
  const [statuses, setStatuses] = useState<WarrantyStatus[]>([]);
  const [statusId, setStatusId] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [warrantyData, statusList] = await Promise.all([
        getWarranty(warrantyId),
        getWarrantyStatuses(),
      ]);
      setWarranty(warrantyData);
      setStatuses(statusList);
      setStatusId(warrantyData.status.id);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setWarranty(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [warrantyId]);

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

  const handleUpdateStatus = async () => {
    if (!warranty || !statusId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await updateWarrantyStatus(warranty.id, {
        status_id: statusId,
      });
      setWarranty(updated);
      onSuccess();
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!warranty) return;
    if (!comment.trim()) {
      setError("กรุณาระบุข้อความ");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await addWarrantyComment(warranty.id, { body: comment.trim() });
      setComment("");
      const updated = await getWarranty(warranty.id);
      setWarranty(updated);
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
        aria-labelledby="warranty-detail-title"
        className={`max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="warranty-detail-title"
              className="text-xl font-bold text-defualt-text"
            >
              รายละเอียดการรับประกัน
            </h2>
            <p className="mt-1 text-sm text-gray-100">
              {warranty?.serial_number ?? "กำลังโหลด..."}
            </p>
          </div>
          {warranty ? (
            <StatusBadge status={warranty.status} className="shrink-0" />
          ) : null}
        </div>

        {loading ? (
          <ModalDetailSkeleton />
        ) : error && !warranty ? (
          <div className="mt-5 rounded-xl bg-red-100/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : warranty ? (
          <div className="mt-5 space-y-4">
            <UserSection user={warranty.user} />

            <Section title="รูปใบเสร็จ">
              {warranty.receipt_image_url ? (
                <a
                  href={String(warranty.receipt_image_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={String(warranty.receipt_image_url)}
                    alt={warranty.receipt_number}
                    className="max-h-[420px] w-full rounded-xl border border-gray-200 bg-gray-10 object-contain"
                  />
                </a>
              ) : (
                <p className="text-sm text-gray-100">ไม่มีรูปใบเสร็จ</p>
              )}
            </Section>

            <Section title="ข้อมูลสินค้า">
              {warranty.product.image_url ? (
                <img
                  src={String(warranty.product.image_url)}
                  alt={warranty.product.name}
                  className="mb-4 max-h-48 rounded-xl border border-gray-200 object-contain"
                />
              ) : null}
              <dl className="grid gap-4 text-sm md:grid-cols-2">
                <DetailItem label="สินค้า" value={warranty.product.name} />
                <DetailItem
                  label="SKU"
                  value={displayValue(warranty.product.sku)}
                />
                <DetailItem
                  label="Serial Number"
                  value={warranty.serial_number}
                />
                <DetailItem
                  label="เลขใบเสร็จ"
                  value={warranty.receipt_number}
                />
                <DetailItem
                  label="ช่องทางการซื้อ"
                  value={warranty.contributor.name}
                />
                <DetailItem
                  label="วันที่ซื้อ"
                  value={warranty.purchase_date}
                />
                <DetailItem
                  label="วันที่ส่ง"
                  value={formatDateTime(warranty.submitted_date)}
                />
              </dl>
            </Section>

            <Section title="อัปเดตสถานะ">
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Field label="สถานะ">
                  <Select
                    value={statusId}
                    options={statuses.map((status) => ({
                      value: status.id,
                      label: status.label,
                    }))}
                    onChange={setStatusId}
                  />
                </Field>
                <button
                  type="button"
                  disabled={isSubmitting || statusId === warranty.status.id}
                  onClick={() => void handleUpdateStatus()}
                  className="cursor-pointer rounded-4xl bg-brown-100 px-5 py-3 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "กำลังบันทึก..." : "บันทึกสถานะ"}
                </button>
              </div>
            </Section>

            <Section title="ความคิดเห็น">
              {warranty.comments && warranty.comments.length > 0 ? (
                <div className="mb-4 space-y-3">
                  {warranty.comments.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-gray-10 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-gray-100">
                        <span>{item.author_name || "เจ้าหน้าที่"}</span>
                        <span>{formatDateTime(item.created_at)}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap text-defualt-text">
                        {item.body}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-sm text-gray-100">ยังไม่มีความคิดเห็น</p>
              )}

              <Field label="เพิ่มความคิดเห็น">
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={3}
                  className={`${inputClassName} resize-none`}
                  placeholder="บันทึกหมายเหตุสำหรับรายการนี้"
                />
              </Field>
              <button
                type="button"
                disabled={isSubmitting || !comment.trim()}
                onClick={() => void handleAddComment()}
                className="mt-3 cursor-pointer rounded-4xl border border-brown-100 px-5 py-2.5 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
              </button>
            </Section>

            {error ? <p className="text-sm text-red-100">{error}</p> : null}

            <button
              type="button"
              onClick={closeModal}
              className="w-full cursor-pointer rounded-4xl bg-brown-100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
            >
              ปิด
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function UserSection({ user }: { user: PortalWarranty["user"] }) {
  return (
    <Section title="ข้อมูลสมาชิก">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {user.picture_url ? (
            <img
              src={String(user.picture_url)}
              alt={user.display_name}
              className="size-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-brown-100 text-lg font-medium text-white">
              {user.display_name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-defualt-text">{user.display_name}</p>
            <p className="text-sm text-gray-100">
              LINE: {displayValue(user.line_user_id)}
            </p>
            {user.phone ? (
              <p className="text-sm text-gray-100">
                โทร: {displayValue(user.phone)}
              </p>
            ) : null}
            {user.email ? (
              <p className="text-sm text-gray-100">
                อีเมล: {displayValue(user.email)}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          href={`/dashboard/members/${user.id}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-4xl border border-brown-100 px-4 py-2 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5"
        >
          ดูโปรไฟล์สมาชิก
          <ExternalLink className="size-4" />
        </Link>
      </div>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
      <h3 className="mb-4 text-sm font-semibold text-defualt-text">{title}</h3>
      {children}
    </section>
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

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-gray-100">{label}</dt>
      <dd className="mt-0.5 font-medium text-defualt-text">{value}</dd>
    </div>
  );
}
