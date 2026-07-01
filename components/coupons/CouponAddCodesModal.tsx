"use client";

import {
  addCouponCodes,
  downloadCouponCodesImportTemplate,
} from "@/services/coupons/coupons";
import type { PortalCoupon } from "@/services/coupons/types";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { readFileAsBase64 } from "@/utils/file";
import { useEffect, useState } from "react";

const MODAL_EXIT_MS = 250;
const DEFAULT_MAX_CODE_BATCH = 2000;
const COUPON_CSV_TEMPLATE_PREVIEW = `code
example_code_1
example_code_2`;

type CouponAddCodesModalProps = {
  coupon: PortalCoupon;
  onClose: () => void;
  onSuccess: (addedCount: number) => void;
};

type AddCodesFormState = {
  codeQuantity: string;
  randomRange: string;
  prefixCode: string;
  suffixCode: string;
  importFilename: string;
};

function toFormState(coupon: PortalCoupon): AddCodesFormState {
  return {
    codeQuantity: "100",
    randomRange: String(coupon.random_range || 6),
    prefixCode: coupon.prefix_code ? String(coupon.prefix_code) : "",
    suffixCode: coupon.suffix_code ? String(coupon.suffix_code) : "",
    importFilename: "",
  };
}

function getCodeSourceLabel(codeSource: PortalCoupon["code_source"]) {
  return codeSource === "generate" ? "สร้างโค้ดอัตโนมัติ" : "นำเข้า CSV";
}

const inputClassName =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brown-100";

const fileInputClassName =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-brown-yellow-5 file:px-3 file:py-1.5 file:text-sm file:text-brown-100";

export default function CouponAddCodesModal({
  coupon,
  onClose,
  onSuccess,
}: CouponAddCodesModalProps) {
  const maxCodeBatch = coupon.max_code_batch_size || DEFAULT_MAX_CODE_BATCH;
  const [isClosing, setIsClosing] = useState(false);
  const [form, setForm] = useState<AddCodesFormState>(() => toFormState(coupon));
  const [importFileBase64, setImportFileBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockedCodeSource = coupon.code_source;

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

  const updateField = <K extends keyof AddCodesFormState>(
    key: K,
    value: AddCodesFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImportFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImportFileBase64(null);
      updateField("importFilename", "");
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      setImportFileBase64(base64);
      updateField("importFilename", file.name);
      setError(null);
    } catch {
      setError("อ่านไฟล์ไม่สำเร็จ");
      setImportFileBase64(null);
      updateField("importFilename", "");
    }
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    setError(null);
    try {
      await downloadCouponCodesImportTemplate();
    } catch (downloadError) {
      setError(handleError(downloadError).message);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (lockedCodeSource === "generate") {
        const codeQuantity = Number(form.codeQuantity);
        const randomRange = Number(form.randomRange);

        if (
          Number.isNaN(codeQuantity) ||
          codeQuantity < 1 ||
          codeQuantity > maxCodeBatch
        ) {
          setError(`จำนวนโค้ดต้องอยู่ระหว่าง 1-${formatNumber(maxCodeBatch)}`);
          return;
        }

        if (Number.isNaN(randomRange) || randomRange < 1) {
          setError("กรุณาระบุความยาวสุ่มที่ถูกต้อง");
          return;
        }

        const result = await addCouponCodes(coupon.id, {
          add_source: "generate",
          code_quantity: codeQuantity,
          random_range: randomRange,
          prefix_code: form.prefixCode.trim() || undefined,
          suffix_code: form.suffixCode.trim() || undefined,
        });
        onSuccess(result.added_code_count);
      } else {
        if (!importFileBase64 || !form.importFilename) {
          setError("กรุณาเลือกไฟล์ CSV");
          return;
        }

        const result = await addCouponCodes(coupon.id, {
          add_source: "import",
          import_file: importFileBase64,
          import_filename: form.importFilename,
        });
        onSuccess(result.added_code_count);
      }

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
        aria-labelledby="coupon-add-codes-title"
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="coupon-add-codes-title"
          className="text-xl font-bold text-defualt-text"
        >
          เพิ่มโค้ดคูปอง
        </h2>
        <p className="mt-1 text-sm text-gray-100">
          เพิ่มโค้ดให้คูปอง <span className="font-medium">{coupon.name}</span>{" "}
          (ปัจจุบัน {formatNumber(coupon.available_code_count)} /{" "}
          {formatNumber(coupon.total_code_count)} โค้ด)
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
            <Field label="วิธีเพิ่มโค้ด">
              <input
                value={getCodeSourceLabel(lockedCodeSource)}
                disabled
                className={`${inputClassName} bg-gray-10 text-gray-100`}
              />
              <p className="mt-1 text-xs text-gray-100">
                วิธีนี้ถูกกำหนดตอนสร้างคูปองและไม่สามารถเปลี่ยนได้
              </p>
            </Field>

            {lockedCodeSource === "generate" ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="จำนวนโค้ด">
                  <input
                    type="number"
                    min="1"
                    max={maxCodeBatch}
                    value={form.codeQuantity}
                    onChange={(event) =>
                      updateField("codeQuantity", event.target.value)
                    }
                    className={inputClassName}
                  />
                  <p className="mt-1 text-xs text-gray-100">
                    สูงสุด {formatNumber(maxCodeBatch)} โค้ดต่อครั้ง
                  </p>
                </Field>
                <Field label="ความยาวสุ่ม">
                  <input
                    type="number"
                    min="1"
                    value={form.randomRange}
                    onChange={(event) =>
                      updateField("randomRange", event.target.value)
                    }
                    className={inputClassName}
                  />
                </Field>
                <Field label="Prefix">
                  <input
                    value={form.prefixCode}
                    onChange={(event) =>
                      updateField("prefixCode", event.target.value)
                    }
                    placeholder="เช่น PROMO"
                    className={inputClassName}
                  />
                </Field>
                <Field label="Suffix">
                  <input
                    value={form.suffixCode}
                    onChange={(event) =>
                      updateField("suffixCode", event.target.value)
                    }
                    placeholder="เช่น 2026"
                    className={inputClassName}
                  />
                </Field>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-defualt-text">
                        Template CSV
                      </p>
                      <p className="mt-1 text-xs text-gray-100">
                        ไฟล์ต้องมีคอลัมน์{" "}
                        <code className="text-brown-100">code</code>{" "}
                        ตามตัวอย่างด้านล่าง
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isDownloadingTemplate}
                      onClick={() => void handleDownloadTemplate()}
                      className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-4xl border border-brown-100 px-4 py-2 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDownloadingTemplate
                        ? "กำลังดาวน์โหลด..."
                        : "ดาวน์โหลด template"}
                    </button>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-white px-4 py-3 font-mono text-xs text-defualt-text">
                    {COUPON_CSV_TEMPLATE_PREVIEW}
                  </pre>
                </div>

                <Field label="อัปโหลดไฟล์ CSV">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => void handleImportFileChange(event)}
                    className={fileInputClassName}
                  />
                  {form.importFilename ? (
                    <p className="mt-2 text-xs text-gray-100">
                      {form.importFilename}
                    </p>
                  ) : null}
                </Field>
              </div>
            )}
          </section>

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
              {isSubmitting ? "กำลังเพิ่ม..." : "เพิ่มโค้ด"}
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
