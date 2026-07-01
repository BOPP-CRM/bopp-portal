"use client";

import { ModalDetailSkeleton } from "@/components/util/Skeleton";
import {
  approveReceipt,
  getReceipt,
  rejectReceipt,
  updateReceipt,
  type PortalReceipt,
} from "@/services/receipts/receipts";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { displayValue, formatNumber, formatReviewedBy } from "@/utils/format";
import { Check, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const MODAL_EXIT_MS = 250;

type ReceiptDetailModalProps = {
  receiptId: number;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

export function calcRewardPoints(amount: number, convertPoints: number) {
  if (!convertPoints || amount <= 0) return 0;
  return Math.floor(amount / convertPoints);
}

export default function ReceiptDetailModal({
  receiptId,
  onClose,
  onSuccess,
}: ReceiptDetailModalProps) {
  const [receipt, setReceipt] = useState<PortalReceipt | null>(null);
  const [amount, setAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const loadReceipt = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReceipt(receiptId);
      setReceipt(data);
      setAmount(String(data.amount || ""));
    } catch (loadError) {
      setError(handleError(loadError).message);
      setReceipt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReceipt();
  }, [receiptId]);

  const isPending = receipt?.state === "pending";
  const amountNumber = Number(amount);
  const convertPoints =
    receipt?.tier.convert_points ?? receipt?.tier_convert_points ?? 0;
  const previewRewardPoints = useMemo(
    () =>
      calcRewardPoints(
        Number.isNaN(amountNumber) ? 0 : amountNumber,
        convertPoints,
      ),
    [amountNumber, convertPoints],
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

  const validateAmount = () => {
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      setError("กรุณาระบุมูลค่าสินค้าให้ถูกต้อง");
      return false;
    }
    return true;
  };

  const handleSaveAmount = async () => {
    if (!receipt || !validateAmount()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await updateReceipt(receipt.id, { amount: amountNumber });
      setReceipt(updated);
      setAmount(String(updated.amount || ""));
      onSuccess();
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!receipt || !validateAmount()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await approveReceipt(receipt.id, { amount: amountNumber });
      setReceipt(updated);
      onSuccess();
      closeModal();
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!receipt) return;
    if (!rejectReason.trim()) {
      setError("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await rejectReceipt(receipt.id, {
        reject_reason: rejectReason.trim(),
      });
      setReceipt(updated);
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
        aria-labelledby="receipt-detail-title"
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
              id="receipt-detail-title"
              className="text-xl font-bold text-defualt-text"
            >
              ตรวจสอบใบเสร็จ
            </h2>
            <p className="mt-1 text-sm text-gray-100">
              {receipt?.receipt_number ?? "กำลังโหลด..."}
            </p>
          </div>
          {receipt ? (
            <StateBadge state={receipt.state} className="shrink-0" />
          ) : null}
        </div>

        {loading ? (
          <ModalDetailSkeleton />
        ) : error && !receipt ? (
          <div className="mt-5 rounded-xl bg-red-100/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : receipt ? (
          <div className="mt-5 space-y-4">
            <UserSection user={receipt.user} />

            <Section title="รูปใบเสร็จ">
              {receipt.receipt_image_url ? (
                <a
                  href={String(receipt.receipt_image_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img
                    src={String(receipt.receipt_image_url)}
                    alt={receipt.receipt_number}
                    className="max-h-[420px] w-full rounded-xl border border-gray-200 object-contain bg-gray-10"
                  />
                </a>
              ) : (
                <p className="text-sm text-gray-100">ไม่มีรูปใบเสร็จ</p>
              )}
            </Section>

            <Section title="ข้อมูลใบเสร็จ">
              <dl className="grid gap-4 text-sm md:grid-cols-2">
                <DetailItem
                  label="เลขใบเสร็จ"
                  value={receipt.receipt_number}
                />
                <DetailItem
                  label="วันที่ส่ง"
                  value={formatDateTime(
                    receipt.submitted_date ?? receipt.create_date,
                  )}
                />
                <DetailItem label="ระดับสมาชิก" value={receipt.tier.name} />
                <DetailItem
                  label="อัตราแปลง Point"
                  value={`${formatNumber(convertPoints)} บาท / 1 Point`}
                />
                {receipt.reviewed_by ? (
                  <DetailItem
                    label="ตรวจสอบโดย"
                    value={formatReviewedBy(receipt.reviewed_by)}
                  />
                ) : null}
                {receipt.reviewed_date ? (
                  <DetailItem
                    label="วันที่ตรวจสอบ"
                    value={formatDateTime(receipt.reviewed_date)}
                  />
                ) : null}
                {receipt.reject_reason ? (
                  <DetailItem
                    label="เหตุผลที่ปฏิเสธ"
                    value={String(receipt.reject_reason)}
                    className="md:col-span-2"
                  />
                ) : null}
              </dl>
            </Section>

            {isPending ? (
              <Section title="มูลค่าและรางวัล">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="มูลค่าสินค้า (บาท)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="Reward Point (คำนวณอัตโนมัติ)">
                    <div className="rounded-xl border border-gray-200 bg-gray-10 px-4 py-3 text-sm font-medium text-brown-100">
                      {formatNumber(previewRewardPoints)} Point
                    </div>
                  </Field>
                </div>
                <p className="mt-3 text-xs text-gray-100">
                  ระบบจะสร้าง Spending point และ Reward point = floor(มูลค่า
                  ÷ {formatNumber(convertPoints)}) เมื่ออนุมัติ
                </p>
              </Section>
            ) : (
              <Section title="มูลค่าและรางวัล">
                <dl className="grid gap-4 text-sm md:grid-cols-2">
                  <DetailItem
                    label="มูลค่าสินค้า"
                    value={`${formatNumber(receipt.amount)} บาท`}
                  />
                  <DetailItem
                    label="Reward Point"
                    value={formatNumber(receipt.reward_points)}
                  />
                  {receipt.spending_point && typeof receipt.spending_point === "object" ? (
                    <DetailItem
                      label="Spending Point"
                      value={formatNumber(receipt.spending_point.value)}
                    />
                  ) : null}
                  {receipt.reward_point && typeof receipt.reward_point === "object" ? (
                    <DetailItem
                      label="Reward Point (บันทึก)"
                      value={formatNumber(receipt.reward_point.value)}
                    />
                  ) : null}
                </dl>
              </Section>
            )}

            {error ? <p className="text-sm text-red-100">{error}</p> : null}

            {isPending ? (
              showRejectForm ? (
                <Section title="ปฏิเสธใบเสร็จ">
                  <Field label="เหตุผล">
                    <textarea
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      rows={3}
                      className={`${inputClassName} resize-none`}
                      placeholder="เช่น รูปไม่ชัด / เลขใบเสร็จซ้ำ"
                    />
                  </Field>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason("");
                        setError(null);
                      }}
                      className="w-full cursor-pointer rounded-4xl bg-gray-10 px-4 py-2.5 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleReject()}
                      className="w-full cursor-pointer rounded-4xl bg-red-100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-100/80 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "กำลังปฏิเสธ..." : "ยืนยันปฏิเสธ"}
                    </button>
                  </div>
                </Section>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={closeModal}
                    className="w-full cursor-pointer rounded-4xl bg-gray-10 px-4 py-2.5 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    ปิด
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleSaveAmount()}
                    className="w-full cursor-pointer rounded-4xl border border-brown-100 px-4 py-2.5 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "กำลังบันทึก..." : "บันทึกมูลค่า"}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowRejectForm(true)}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-4xl border border-red-100 px-4 py-2.5 text-sm font-medium text-red-100 transition hover:bg-red-100/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <X className="size-4" />
                    ปฏิเสธ
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleApprove()}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="size-4" />
                    {isSubmitting ? "กำลังอนุมัติ..." : "อนุมัติ"}
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={closeModal}
                className="w-full cursor-pointer rounded-4xl bg-brown-100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
              >
                ปิด
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function UserSection({ user }: { user: PortalReceipt["user"] }) {
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

export function StateBadge({
  state,
  className = "",
}: {
  state: PortalReceipt["state"];
  className?: string;
}) {
  const styles = {
    pending: "bg-brown-yellow-5 text-brown-100",
    approved: "bg-gray-10 text-defualt-text",
    rejected: "bg-red-100/10 text-red-100",
  } as const;

  const labels = {
    pending: "รอตรวจสอบ",
    approved: "อนุมัติแล้ว",
    rejected: "ปฏิเสธ",
  } as const;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[state]} ${className}`}
    >
      {labels[state]}
    </span>
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
