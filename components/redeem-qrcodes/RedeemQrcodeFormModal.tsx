"use client";

import {
  buildRedeemQrcodeUpdatePayload,
  createRedeemQrcode,
  getRewardCouponId,
  updateRedeemQrcode,
  type CreateRedeemQrcodeRequest,
  type PortalRedeemQrcode,
} from "@/services/redeem-qrcodes/redeem-qrcodes";
import { getCoupons } from "@/services/coupons/coupons";
import type { PortalCoupon } from "@/services/coupons/types";
import { getCurrencies } from "@/services/currencies/currencies";
import type { PortalCurrency } from "@/services/currencies/types";
import Select from "@/components/util/Select";
import {
  formatDateTime,
  toApiDateTime,
  toDatetimeLocalValue,
} from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const MODAL_EXIT_MS = 250;

type RedeemQrcodeFormModalProps = {
  qrcode?: PortalRedeemQrcode | null;
  onClose: () => void;
  onSuccess: () => void;
};

type RedeemQrcodeFormState = {
  name: string;
  type: "earn" | "spend";
  value: string;
  currencyId: number;
  rewardCouponId: number;
  limitPerUser: string;
  limitPerQr: string;
  expirationDate: string;
};

const emptyForm = (currencyId = 0): RedeemQrcodeFormState => ({
  name: "",
  type: "earn",
  value: "0",
  currencyId,
  rewardCouponId: 0,
  limitPerUser: "1",
  limitPerQr: "100",
  expirationDate: "",
});

function toFormState(qrcode: PortalRedeemQrcode): RedeemQrcodeFormState {
  return {
    name: qrcode.name,
    type: qrcode.type,
    value: String(qrcode.value),
    currencyId: qrcode.currency_id ?? 0,
    rewardCouponId: getRewardCouponId(qrcode),
    limitPerUser: String(qrcode.limit_per_user),
    limitPerQr: String(qrcode.limit_per_qr),
    expirationDate: toDatetimeLocalValue(qrcode.expiration_date),
  };
}

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

function formatRewardSummary(qrcode: PortalRedeemQrcode) {
  const parts: string[] = [];
  if (qrcode.value > 0) {
    parts.push(
      `${formatNumber(qrcode.value)} ${qrcode.currency_name ?? "point"}`,
    );
  }
  if (qrcode.reward_coupon && typeof qrcode.reward_coupon === "object") {
    parts.push(`คูปอง: ${qrcode.reward_coupon.name}`);
  }
  return parts.length > 0 ? parts.join(" + ") : "-";
}

export default function RedeemQrcodeFormModal({
  qrcode,
  onClose,
  onSuccess,
}: RedeemQrcodeFormModalProps) {
  const isEdit = Boolean(qrcode);
  const [isClosing, setIsClosing] = useState(false);
  const [currencies, setCurrencies] = useState<PortalCurrency[]>([]);
  const [coupons, setCoupons] = useState<PortalCoupon[]>([]);
  const [form, setForm] = useState<RedeemQrcodeFormState>(
    qrcode ? toFormState(qrcode) : emptyForm(),
  );
  const [displayQrcode, setDisplayQrcode] = useState<PortalRedeemQrcode | null>(
    qrcode ?? null,
  );
  const [showCreateResult, setShowCreateResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (qrcode) {
      setForm(toFormState(qrcode));
      setDisplayQrcode(qrcode);
    }
  }, [qrcode]);

  useEffect(() => {
    void Promise.all([getCurrencies(), getCoupons()])
      .then(([currencyData, couponData]) => {
        setCurrencies(currencyData);
        setCoupons(couponData);
        if (!qrcode && currencyData[0]) {
          const defaultCurrency =
            currencyData.find((currency) => currency.is_default) ??
            currencyData[0];
          setForm((prev) =>
            prev.currencyId ? prev : { ...prev, currencyId: defaultCurrency.id },
          );
        }
      })
      .catch(() => {
        setCurrencies([]);
        setCoupons([]);
      });
  }, [qrcode]);

  const currencyOptions = useMemo(
    () =>
      (currencies ?? []).map((currency) => ({
        value: currency.id,
        label: currency.name,
      })),
    [currencies],
  );

  const couponOptions = useMemo(
    () => [
      { value: 0, label: "ไม่แจกคูปอง" },
      ...(coupons ?? []).map((coupon) => ({
        value: coupon.id,
        label: `${coupon.name} (${formatNumber(coupon.value)} ${coupon.currency_name})`,
      })),
    ],
    [coupons],
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

  const buildPayload = (): CreateRedeemQrcodeRequest | null => {
    if (!form.name.trim()) {
      setError("กรุณาระบุชื่อ");
      return null;
    }

    const value = Number(form.value);
    const limitPerUser = Number(form.limitPerUser);
    const limitPerQr = Number(form.limitPerQr);

    if (
      Number.isNaN(value) ||
      Number.isNaN(limitPerUser) ||
      Number.isNaN(limitPerQr)
    ) {
      setError("กรุณาระบุตัวเลขให้ถูกต้อง");
      return null;
    }

    if (value <= 0 && !form.rewardCouponId) {
      setError("กรุณาระบุจำนวน Point หรือเลือกคูปองรางวัลอย่างน้อย 1 รายการ");
      return null;
    }

    if (!form.expirationDate) {
      setError("กรุณาระบุวันหมดอายุ");
      return null;
    }

    const payload: CreateRedeemQrcodeRequest = {
      name: form.name.trim(),
      type: "earn",
      value,
      limit_per_user: limitPerUser,
      limit_per_qr: limitPerQr,
      expiration_date: toApiDateTime(form.expirationDate),
    };

    if (form.currencyId) {
      payload.currency_id = form.currencyId;
    }
    payload.reward_coupon_id = form.rewardCouponId
      ? form.rewardCouponId
      : false;

    return payload;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload = buildPayload();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      if (isEdit && qrcode) {
        const updatePayload = buildRedeemQrcodeUpdatePayload(qrcode, payload);
        if (Object.keys(updatePayload).length === 0) {
          closeModal();
          return;
        }
        const updated = await updateRedeemQrcode(qrcode.id, updatePayload);
        setDisplayQrcode(updated);
        onSuccess();
        closeModal();
      } else {
        const created = await createRedeemQrcode(payload);
        setDisplayQrcode(created);
        setShowCreateResult(true);
        onSuccess();
      }
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`คัดลอก${label}แล้ว`);
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("ไม่สามารถคัดลอกได้");
      setTimeout(() => setCopyMessage(null), 2000);
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
        aria-labelledby="redeem-qrcode-form-title"
        className={`max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="redeem-qrcode-form-title"
          className="text-xl font-bold text-defualt-text"
        >
          {showCreateResult
            ? "สร้าง Redeem QR สำเร็จ"
            : isEdit
              ? "แก้ไข Redeem QR"
              : "สร้าง Redeem QR"}
        </h2>
        <p className="mt-1 text-sm text-gray-100">
          {showCreateResult
            ? "QR Code พร้อมใช้งานแล้ว"
            : "กำหนดรางวัลที่สมาชิกจะได้รับเมื่อสแกน QR Code"}
        </p>

        {showCreateResult && displayQrcode ? (
          <div className="mt-5 space-y-4">
            <CreateResultView
              qrcode={displayQrcode}
              copyMessage={copyMessage}
              onCopy={copyToClipboard}
            />
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
            {isEdit && displayQrcode?.qr_code_url ? (
              <QrCodeSection
                qrcode={displayQrcode}
                copyMessage={copyMessage}
                onCopy={copyToClipboard}
              />
            ) : null}

            <Section title="ข้อมูลทั่วไป">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="ชื่อ" className="md:col-span-2">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className={inputClassName}
                    placeholder="เช่น Event QR 100pts"
                  />
                </Field>

                <Field label="ประเภท">
                  <input
                    type="text"
                    value="รับ Point"
                    readOnly
                    className={`${inputClassName} cursor-not-allowed bg-gray-10 text-gray-100`}
                  />
                </Field>

                <Field label="วันหมดอายุ">
                  <input
                    type="datetime-local"
                    value={form.expirationDate}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        expirationDate: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  />
                </Field>
              </div>
            </Section>

            <Section title="รางวัล">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="จำนวน Point">
                  <input
                    type="number"
                    min="0"
                    value={form.value}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, value: event.target.value }))
                    }
                    className={inputClassName}
                  />
                </Field>

                <Field label="สกุล Point">
                  <Select
                    value={form.currencyId}
                    options={currencyOptions}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, currencyId: value }))
                    }
                  />
                </Field>

                <Field label="คูปองรางวัล (ถ้ามี)" className="md:col-span-2">
                  <Select
                    value={form.rewardCouponId}
                    options={couponOptions}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, rewardCouponId: value }))
                    }
                  />
                </Field>
              </div>
            </Section>

            <Section title="ข้อจำกัด">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="จำกัดต่อคน">
                  <input
                    type="number"
                    min="0"
                    value={form.limitPerUser}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        limitPerUser: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  />
                </Field>

                <Field label="จำกัดต่อ QR">
                  <input
                    type="number"
                    min="0"
                    value={form.limitPerQr}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        limitPerQr: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  />
                </Field>
              </div>
            </Section>

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
        )}
      </div>
    </div>
  );
}

function CreateResultView({
  qrcode,
  copyMessage,
  onCopy,
}: {
  qrcode: PortalRedeemQrcode;
  copyMessage: string | null;
  onCopy: (text: string, label: string) => void;
}) {
  return (
    <>
      <Section title="รายละเอียด">
        <dl className="grid gap-3 text-sm md:grid-cols-2">
          <DetailItem label="ชื่อ" value={qrcode.name} />
          <DetailItem
            label="ประเภท"
            value={qrcode.type === "earn" ? "รับ Point" : "ใช้ Point"}
          />
          <DetailItem label="รางวัล" value={formatRewardSummary(qrcode)} />
          <DetailItem
            label="หมดอายุ"
            value={formatDateTime(qrcode.expiration_date)}
          />
          <DetailItem
            label="จำกัดต่อคน"
            value={formatNumber(qrcode.limit_per_user)}
          />
          <DetailItem
            label="จำกัดต่อ QR"
            value={formatNumber(qrcode.limit_per_qr)}
          />
        </dl>
      </Section>

      <QrCodeSection qrcode={qrcode} copyMessage={copyMessage} onCopy={onCopy} />
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-100">{label}</dt>
      <dd className="mt-0.5 font-medium text-defualt-text">{value}</dd>
    </div>
  );
}

function QrCodeSection({
  qrcode,
  copyMessage,
  onCopy,
}: {
  qrcode: PortalRedeemQrcode;
  copyMessage: string | null;
  onCopy: (text: string, label: string) => void;
}) {
  if (!qrcode.qr_code_url) return null;

  return (
    <Section title="QR Code">
      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
        <img
          src={qrcode.qr_code_url}
          alt={`QR Code ${qrcode.name}`}
          className="size-44 shrink-0 rounded-xl border border-gray-200 bg-white p-2"
        />
        <div className="min-w-0 w-full space-y-3 text-sm">
          <div>
            <p className="mb-1 font-medium text-defualt-text">Code</p>
            <div className="flex min-w-0 items-start gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-gray-10 px-3 py-2 text-xs">
                {qrcode.code}
              </code>
              <button
                type="button"
                onClick={() => void onCopy(qrcode.code, " Code ")}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-4xl border border-gray-200 px-3 py-2 text-xs text-defualt-text transition hover:bg-gray-10"
              >
                <Copy className="size-3.5" />
                คัดลอก
              </button>
            </div>
          </div>
          <div>
            <p className="mb-1 font-medium text-defualt-text">Redeem URL</p>
            <div className="flex min-w-0 items-start gap-2">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-gray-10 px-3 py-2 text-xs leading-relaxed">
                {qrcode.redeem_url}
              </code>
              <button
                type="button"
                onClick={() => void onCopy(qrcode.redeem_url, " URL ")}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-4xl border border-gray-200 px-3 py-2 text-xs text-defualt-text transition hover:bg-gray-10"
              >
                <Copy className="size-3.5" />
                คัดลอก
              </button>
            </div>
          </div>
        </div>
      </div>
      {copyMessage ? (
        <p className="mt-3 text-xs text-brown-100">{copyMessage}</p>
      ) : null}
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
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-defualt-text">
        {label}
      </label>
      {children}
    </div>
  );
}
