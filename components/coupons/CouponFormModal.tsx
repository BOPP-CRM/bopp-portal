"use client";

import {
  buildCouponUpdatePayload,
  createCoupon,
  downloadCouponCodesImportTemplate,
  getCoupon,
  updateCoupon,
  type CreateCouponRequest,
  type PortalCoupon,
} from "@/services/coupons/coupons";
import { getCurrencies } from "@/services/currencies/currencies";
import type { PortalCurrency } from "@/services/currencies/types";
import Select from "@/components/util/Select";
import { FormFieldsSkeleton } from "@/components/util/Skeleton";
import { handleError } from "@/utils/errors";
import { toApiDateTime, toDatetimeLocalValue } from "@/utils/datetime";
import { readFileAsBase64 } from "@/utils/file";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CouponFormPageProps = {
  couponId: number | null;
};

type CodeSourceMode = "generate" | "import";

const COUPON_CSV_TEMPLATE_PREVIEW = `code
example_code_1
example_code_2`;

const MAX_CODE_BATCH = 2000;

type CouponFormState = {
  name: string;
  currencyId: number;
  value: string;
  codeSource: CodeSourceMode;
  codeQuantity: string;
  randomRange: string;
  prefixCode: string;
  suffixCode: string;
  startTime: string;
  endTime: string;
  codeExpiryInterval: string;
  termAndCondition: string;
  isShowInUi: boolean;
  maxRedeemPerUser: string;
  importFilename: string;
};

const emptyForm = (currencyId = 0): CouponFormState => ({
  name: "",
  currencyId,
  value: "0",
  codeSource: "generate",
  codeQuantity: "100",
  randomRange: "6",
  prefixCode: "",
  suffixCode: "",
  startTime: "",
  endTime: "",
  codeExpiryInterval: "15",
  termAndCondition: "",
  isShowInUi: true,
  maxRedeemPerUser: "0",
  importFilename: "",
});

function toFormState(coupon: PortalCoupon): CouponFormState {
  return {
    name: coupon.name,
    currencyId: coupon.currency_id,
    value: String(coupon.value),
    codeSource: coupon.code_source,
    codeQuantity: "0",
    randomRange: String(coupon.random_range || 6),
    prefixCode: coupon.prefix_code ? String(coupon.prefix_code) : "",
    suffixCode: coupon.suffix_code ? String(coupon.suffix_code) : "",
    startTime: toDatetimeLocalValue(coupon.start_time),
    endTime: toDatetimeLocalValue(coupon.end_time),
    codeExpiryInterval: String(coupon.code_expiry_interval || 0),
    termAndCondition: coupon.term_and_condition
      ? String(coupon.term_and_condition)
      : "",
    isShowInUi: coupon.is_show_in_ui,
    maxRedeemPerUser: String(coupon.max_redeem_per_user),
    importFilename: "",
  };
}

export default function CouponFormModal({ couponId }: CouponFormPageProps) {
  const router = useRouter();
  const isEdit = couponId !== null;
  const [coupon, setCoupon] = useState<PortalCoupon | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [currencies, setCurrencies] = useState<PortalCurrency[]>([]);
  const [importFileBase64, setImportFileBase64] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFilename, setImageFilename] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<CouponFormState>(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (couponId === null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getCoupon(couponId)
      .then((data) => {
        if (cancelled) return;
        setCoupon(data);
        setForm(toFormState(data));
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(handleError(loadError).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [couponId]);

  useEffect(() => {
    void getCurrencies()
      .then((data) => {
        setCurrencies(data);
        if (!coupon && data[0]) {
          setForm((prev) =>
            prev.currencyId ? prev : { ...prev, currencyId: data[0].id },
          );
        }
      })
      .catch(() => {
        setCurrencies([]);
      });
  }, [coupon]);

  useEffect(() => {
    setImageBase64(null);
    setImageFilename("");
    setImagePreviewUrl(coupon?.image_url ? String(coupon.image_url) : null);
  }, [coupon]);

  const currencyOptions = useMemo(
    () =>
      currencies.map((currency) => ({
        value: currency.id,
        label: currency.name,
      })),
    [currencies],
  );

  const showInUiOptions = useMemo(
    () => [
      { value: "true" as const, label: "แสดงใน UI" },
      { value: "false" as const, label: "ไม่แสดงใน UI" },
    ],
    [],
  );

  const codeSourceOptions = useMemo(
    () => [
      { value: "generate" as const, label: "สร้างโค้ดอัตโนมัติ" },
      { value: "import" as const, label: "นำเข้า CSV" },
    ],
    [],
  );

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const hasChanges = useMemo(() => {
    if (!coupon) return true;

    const updatePayload = buildCouponUpdatePayload(coupon, {
      name: form.name.trim(),
      value: Number(form.value),
      start_time: toApiDateTime(form.startTime),
      end_time: form.endTime ? toApiDateTime(form.endTime) : false,
      code_expiry_interval: Number(form.codeExpiryInterval),
      term_and_condition: form.termAndCondition.trim(),
      is_show_in_ui: form.isShowInUi,
      max_redeem_per_user: Number(form.maxRedeemPerUser),
      image_base64: imageBase64 ?? undefined,
    });

    return Object.keys(updatePayload).length > 0;
  }, [coupon, form, imageBase64]);

  const isSaveDisabled = isSubmitting || loading || (isEdit && !hasChanges);

  const finish = () => {
    router.push("/dashboard/coupons?saved=1");
  };

  const updateField = <K extends keyof CouponFormState>(
    key: K,
    value: CouponFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageBase64(null);
      setImageFilename("");
      setImagePreviewUrl(coupon?.image_url ? String(coupon.image_url) : null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      setImageBase64(base64);
      setImageFilename(file.name);
      setImagePreviewUrl(URL.createObjectURL(file));
      setError(null);
    } catch {
      setError("อ่านไฟล์รูปภาพไม่สำเร็จ");
      setImageBase64(null);
      setImageFilename("");
      setImagePreviewUrl(coupon?.image_url ? String(coupon.image_url) : null);
    }
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

    if (!form.name.trim()) {
      setError("กรุณาระบุชื่อคูปอง");
      return;
    }

    if (!form.currencyId) {
      setError("กรุณาเลือกสกุล point");
      return;
    }

    const value = Number(form.value);
    const maxRedeemPerUser = Number(form.maxRedeemPerUser);
    const codeExpiryInterval = Number(form.codeExpiryInterval);
    const startTime = toApiDateTime(form.startTime);
    const endTime = form.endTime ? toApiDateTime(form.endTime) : undefined;

    if (Number.isNaN(value) || value < 0) {
      setError("กรุณาระบุมูลค่าที่ถูกต้อง");
      return;
    }

    if (!startTime) {
      setError("กรุณาระบุวันเริ่มต้น");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && coupon) {
        const updatePayload = buildCouponUpdatePayload(coupon, {
          name: form.name.trim(),
          value,
          start_time: startTime,
          end_time: endTime ?? false,
          code_expiry_interval: codeExpiryInterval,
          term_and_condition: form.termAndCondition.trim(),
          is_show_in_ui: form.isShowInUi,
          max_redeem_per_user: maxRedeemPerUser,
          image_base64: imageBase64 ?? undefined,
        });
        await updateCoupon(coupon.id, updatePayload);
      } else if (form.codeSource === "generate") {
        const codeQuantity = Number(form.codeQuantity);
        const randomRange = Number(form.randomRange);

        if (
          Number.isNaN(codeQuantity) ||
          codeQuantity < 1 ||
          codeQuantity > MAX_CODE_BATCH
        ) {
          setError(`จำนวนโค้ดต้องอยู่ระหว่าง 1-${MAX_CODE_BATCH}`);
          return;
        }

        const payload: CreateCouponRequest = {
          name: form.name.trim(),
          currency_id: form.currencyId,
          value,
          code_source: "generate",
          code_quantity: codeQuantity,
          random_range: randomRange,
          prefix_code: form.prefixCode.trim() || undefined,
          suffix_code: form.suffixCode.trim() || undefined,
          start_time: startTime,
          ...(endTime ? { end_time: endTime } : {}),
          code_expiry_interval: codeExpiryInterval || undefined,
          term_and_condition: form.termAndCondition.trim() || undefined,
          is_show_in_ui: form.isShowInUi,
          max_redeem_per_user: maxRedeemPerUser,
          image_base64: imageBase64 ?? undefined,
        };
        await createCoupon(payload);
      } else {
        if (!importFileBase64 || !form.importFilename) {
          setError("กรุณาเลือกไฟล์ CSV");
          return;
        }

        const payload: CreateCouponRequest = {
          name: form.name.trim(),
          currency_id: form.currencyId,
          value,
          code_source: "import",
          import_file: importFileBase64,
          import_filename: form.importFilename,
          start_time: startTime,
          ...(endTime ? { end_time: endTime } : {}),
          code_expiry_interval: codeExpiryInterval || undefined,
          term_and_condition: form.termAndCondition.trim() || undefined,
          is_show_in_ui: form.isShowInUi,
          max_redeem_per_user: maxRedeemPerUser,
          image_base64: imageBase64 ?? undefined,
        };
        await createCoupon(payload);
      }

      finish();
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 md:p-5">
      <Link
        href="/dashboard/coupons"
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-100 hover:text-brown-100"
      >
        <ArrowLeft className="size-4" />
        กลับไปจัดการคูปอง
      </Link>
      <div className="rounded-md border border-gray-200 bg-white p-4 md:p-5">
        <h1 id="coupon-form-title" className="text-xl font-bold text-defualt-text">
          {isEdit ? "แก้ไขคูปอง" : "เพิ่มคูปอง"}
        </h1>
        <p className="mt-1 text-sm text-gray-100">
          {isEdit
            ? "แก้ไขรายละเอียดคูปอง (ไม่สามารถเปลี่ยนชุดโค้ดได้)"
            : "สร้างคูปองใหม่ด้วยการ generate หรือนำเข้า CSV"}
        </p>

        {loading ? (
          <div className="mt-5">
            <FormFieldsSkeleton fields={6} />
          </div>
        ) : error && isEdit && !coupon ? (
          <p className="mt-5 text-sm text-red-100">{error}</p>
        ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <Section title="ข้อมูลทั่วไป">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="ชื่อคูปอง">
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="เช่น Summer Sale"
                  className={inputClassName}
                />
              </Field>

              <Field label="สกุล Point">
                {isEdit && coupon ? (
                  <input
                    value={coupon.currency_name}
                    disabled
                    className={`${inputClassName} bg-gray-10 text-gray-100`}
                  />
                ) : (
                  <Select
                    value={form.currencyId}
                    options={currencyOptions}
                    onChange={(value) => updateField("currencyId", value)}
                  />
                )}
              </Field>

              <Field label="มูลค่า">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.value}
                  onChange={(event) => updateField("value", event.target.value)}
                  className={inputClassName}
                />
              </Field>

              <Field label="การแสดงผล">
                <Select
                  value={form.isShowInUi ? "true" : "false"}
                  options={showInUiOptions}
                  onChange={(value) =>
                    updateField("isShowInUi", value === "true")
                  }
                />
              </Field>

              <Field label="รูปภาพ" className="md:col-span-2">
                <div className="space-y-3">
                  {imagePreviewUrl || coupon?.image_url ? (
                    <img
                      src={imagePreviewUrl ?? String(coupon?.image_url)}
                      alt="ตัวอย่างรูปคูปอง"
                      className="size-20 rounded-xl border border-gray-200 object-cover"
                    />
                  ) : null}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handleImageFileChange(event)}
                    className={fileInputClassName}
                  />
                  {imageFilename ? (
                    <p className="text-xs text-gray-100">{imageFilename}</p>
                  ) : null}
                </div>
              </Field>

              <Field label="เงื่อนไข" className="md:col-span-2">
                <textarea
                  value={form.termAndCondition}
                  onChange={(event) =>
                    updateField("termAndCondition", event.target.value)
                  }
                  rows={10}
                  className={`${inputClassName} min-h-52 resize-y`}
                />
              </Field>
            </div>
          </Section>

          <Section title="ช่วงเวลาและการแลก">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="วันเริ่มต้น">
                <input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(event) =>
                    updateField("startTime", event.target.value)
                  }
                  className={inputClassName}
                />
              </Field>

              <Field label="วันสิ้นสุด (ไม่บังคับ)">
                <input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(event) =>
                    updateField("endTime", event.target.value)
                  }
                  className={inputClassName}
                />
                <p className="mt-1 text-xs text-gray-100">
                  เว้นว่าง = ไม่มีวันหมดอายุ
                </p>
              </Field>

              <Field label="อายุโค้ด (นาที)">
                <input
                  type="number"
                  min="0"
                  value={form.codeExpiryInterval}
                  onChange={(event) =>
                    updateField("codeExpiryInterval", event.target.value)
                  }
                  className={inputClassName}
                />
              </Field>

              <Field label="แลกได้สูงสุด/คน (0 = ไม่จำกัด)">
                <input
                  type="number"
                  min="0"
                  value={form.maxRedeemPerUser}
                  onChange={(event) =>
                    updateField("maxRedeemPerUser", event.target.value)
                  }
                  className={inputClassName}
                />
              </Field>
            </div>
          </Section>

          {!isEdit ? (
            <Section title="โค้ดคูปอง">
              <div className="space-y-4">
                <Field label="วิธีสร้างโค้ด">
                  <Select
                    value={form.codeSource}
                    options={codeSourceOptions}
                    onChange={(value) => updateField("codeSource", value)}
                  />
                </Field>

                {form.codeSource === "generate" ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="จำนวนโค้ด">
                      <input
                        type="number"
                        min="1"
                        max={MAX_CODE_BATCH}
                        value={form.codeQuantity}
                        onChange={(event) =>
                          updateField("codeQuantity", event.target.value)
                        }
                        className={inputClassName}
                      />
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
                        placeholder="เช่น SUM"
                        className={inputClassName}
                      />
                    </Field>
                    <Field label="Suffix">
                      <input
                        value={form.suffixCode}
                        onChange={(event) =>
                          updateField("suffixCode", event.target.value)
                        }
                        className={inputClassName}
                      />
                    </Field>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-10 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-defualt-text">
                            Template CSV
                          </p>
                          <p className="mt-1 text-xs text-gray-100">
                            ไฟล์ต้องมีคอลัมน์ <code className="text-brown-100">code</code>{" "}
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
                      <pre className="mt-3 overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-xs text-defualt-text">
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
              </div>
            </Section>
          ) : null}

          {error ? <p className="text-sm text-red-100">{error}</p> : null}

          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/coupons"
              className="inline-flex w-full items-center justify-center rounded-4xl bg-gray-10 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={isSaveDisabled}
              className="w-full cursor-pointer rounded-4xl bg-brown-100 px-3 py-2 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
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

const inputClassName =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brown-100";

const fileInputClassName =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-brown-yellow-5 file:px-3 file:py-1.5 file:text-sm file:text-brown-100";

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
