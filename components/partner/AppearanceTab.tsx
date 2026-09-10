"use client";

import { FormFieldsSkeleton } from "@/components/util/Skeleton";
import {
  getAppearance,
  updateAppearance,
  uploadAppearanceImage,
} from "@/services/partner/appearance";
import type {
  AppearanceColorKey,
  AppearanceImageTarget,
  PartnerAppearance,
  PartnerUi,
} from "@/services/partner/types";
import { handleError } from "@/utils/errors";
import { readFileAsDataUrl } from "@/utils/file";
import { getProxiedImageUrl } from "@/utils/image";
import {
  ImagePlus,
  Pencil,
  QrCode,
  RefreshCw,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const COLOR_FIELDS: { key: AppearanceColorKey; label: string }[] = [
  { key: "primary_color", label: "สีหลัก (Primary)" },
  { key: "secondary_color", label: "สีรอง (Secondary)" },
  { key: "surface_color", label: "พื้นผิว (Surface)" },
  { key: "background_color", label: "พื้นหลัง" },
  { key: "background_white_color", label: "พื้นหลัง (ขาว)" },
  { key: "button_color", label: "ปุ่ม" },
  { key: "button_text_color", label: "ข้อความปุ่ม" },
  { key: "text_color", label: "ข้อความ" },
  { key: "text_white_color", label: "ข้อความ (ขาว)" },
  { key: "text_gray_color", label: "ข้อความ (เทา)" },
  { key: "text_success_color", label: "ข้อความ (สำเร็จ)" },
  { key: "text_error_color", label: "ข้อความ (แจ้งเตือน)" },
];

type AppearanceForm = Record<AppearanceColorKey, string> & {
  logo_url: string;
  banner_url: string;
  welcome_title: string;
  crm_required_phone: boolean;
  crm_required_email: boolean;
};

const EMPTY_FORM: AppearanceForm = {
  background_color: "",
  background_white_color: "",
  primary_color: "",
  secondary_color: "",
  surface_color: "",
  text_color: "",
  text_white_color: "",
  text_gray_color: "",
  text_success_color: "",
  text_error_color: "",
  button_color: "",
  button_text_color: "",
  logo_url: "",
  banner_url: "",
  welcome_title: "",
  crm_required_phone: false,
  crm_required_email: false,
};

const str = (value: string | false | null | undefined) =>
  typeof value === "string" ? value : "";

function toForm(data: PartnerAppearance): AppearanceForm {
  const next = { ...EMPTY_FORM };
  for (const { key } of COLOR_FIELDS) {
    next[key] = str(data[key]);
  }
  next.logo_url = str(data.logo_url);
  next.banner_url = str(data.banner_url);
  next.welcome_title = str(data.welcome_title);
  next.crm_required_phone = Boolean(data.crm_required_phone);
  next.crm_required_email = Boolean(data.crm_required_email);
  return next;
}

export default function AppearanceTab({ ui }: { ui: PartnerUi }) {
  const [form, setForm] = useState<AppearanceForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] =
    useState<AppearanceImageTarget | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setError(null);
    setLoading(true);
    try {
      const data = await getAppearance();
      setForm(toForm(data));
    } catch (err) {
      setLoadError(handleError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const updateField = <K extends keyof AppearanceForm>(
    key: K,
    value: AppearanceForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = async (
    target: AppearanceImageTarget,
    file: File | null,
  ) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }

    setError(null);
    setUploadingTarget(target);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const { appearance } = await uploadAppearanceImage(target, dataUrl);
      setForm(toForm(appearance));
      showSuccess(
        target === "logo" ? "อัปโหลดโลโก้แล้ว" : "อัปโหลดแบนเนอร์แล้ว",
      );
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSave = async () => {
    const badColor = COLOR_FIELDS.find(
      ({ key }) => form[key] !== "" && !HEX_COLOR.test(form[key]),
    );
    if (badColor) {
      setError(`${badColor.label}: ต้องเป็นรหัสสีรูปแบบ #RRGGBB`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const colorPayload = Object.fromEntries(
        COLOR_FIELDS.map(({ key }) => [key, form[key]]),
      ) as Record<AppearanceColorKey, string>;

      const data = await updateAppearance({
        ...colorPayload,
        welcome_title: form.welcome_title,
        logo: form.logo_url,
        banner: form.banner_url,
      });
      setForm(toForm(data));
      showSuccess("บันทึกธีมเรียบร้อยแล้ว");
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <FormFieldsSkeleton fields={6} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-red-100/10 px-4 py-3 text-sm text-red-100">
          {loadError}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 cursor-pointer rounded-4xl border border-gray-200 px-4 py-2 text-sm text-defualt-text hover:bg-gray-10"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  const busy = isSaving || uploadingTarget !== null;

  return (
    <form
      className="p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
    >
      {successMessage ? (
        <div className="mb-6 rounded-xl bg-brown-yellow-5 px-4 py-3 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl bg-red-100/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_23rem]">
        {/* Settings */}
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <ImageField
              label="โลโก้"
              hint="แนะนำเป็นไฟล์ PNG พื้นหลังโปร่งใส"
              value={form.logo_url}
              uploading={uploadingTarget === "logo"}
              boxClassName="aspect-[4/3] w-full bg-gray-10"
              imgClassName="object-contain p-4"
              onSelect={(file) => void handleImageChange("logo", file)}
              onRemove={() => updateField("logo_url", "")}
            />
            <ImageField
              label="แบนเนอร์"
              hint="แสดงด้านบนของหน้า portal สมาชิก"
              value={form.banner_url}
              uploading={uploadingTarget === "banner"}
              boxClassName="aspect-[4/3] w-full bg-gray-10"
              imgClassName="object-cover"
              onSelect={(file) => void handleImageChange("banner", file)}
              onRemove={() => updateField("banner_url", "")}
            />
          </div>

          <Field label="ข้อความต้อนรับ">
            <input
              value={form.welcome_title}
              onChange={(event) =>
                updateField("welcome_title", event.target.value)
              }
              placeholder="ยินดีต้อนรับ"
              className={inputClassName}
            />
          </Field>

          <div>
            <p className="mb-3 text-sm font-medium text-defualt-text">สีธีม</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {COLOR_FIELDS.map(({ key, label }) => (
                <ColorField
                  key={key}
                  label={label}
                  value={form[key]}
                  onChange={(value) => updateField(key, value)}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-defualt-text">
              ข้อมูลอื่น
            </p>
            <p className="mb-3 text-xs text-gray-100">
              แสดงผลอย่างเดียว โปรดติดต่อทีมงานหากต้องการแก้ไข
            </p>
            <dl className="grid gap-4 rounded-2xl border border-gray-200 p-4 sm:grid-cols-2">
              <InfoItem
                label="บังคับกรอกเบอร์โทร"
                value={<BooleanBadge value={ui.crm_required_phone} />}
              />
              <InfoItem
                label="บังคับกรอกอีเมล"
                value={<BooleanBadge value={ui.crm_required_email} />}
              />
              <InfoItem
                label="Custom Fields"
                value={<BooleanBadge value={Boolean(ui.ui_custom_fields)} />}
              />
              <InfoItem
                label="ระบบรับประกันสินค้า"
                value={<BooleanBadge value={Boolean(ui.warranty_enabled)} />}
              />
            </dl>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => void load()}
              disabled={busy}
              className="cursor-pointer rounded-4xl bg-gray-10 px-5 py-2.5 text-sm font-medium text-gray-100 disabled:opacity-60"
            >
              รีเซ็ต
            </button>
            <button
              type="submit"
              disabled={busy}
              className="cursor-pointer rounded-4xl bg-brown-100 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:opacity-60"
            >
              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ThemePreview form={form} />
        </div>
      </div>
    </form>
  );
}

function ImageField({
  label,
  hint,
  value,
  uploading,
  boxClassName,
  imgClassName,
  onSelect,
  onRemove,
}: {
  label: string;
  hint: string;
  value: string;
  uploading: boolean;
  boxClassName: string;
  imgClassName: string;
  onSelect: (file: File | null) => void;
  onRemove: () => void;
}) {
  const previewUrl = getProxiedImageUrl(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  return (
    <Field label={label}>
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          disabled={uploading}
          onChange={(event) => {
            onSelect(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />

        {previewUrl ? (
          <div
            className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-white ${boxClassName}`}
          >
            <img
              src={previewUrl}
              alt={label}
              className={`size-full ${imgClassName}`}
            />
            <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {uploading ? (
                <span className="text-xs font-medium text-white">
                  กำลังอัปโหลด...
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={openPicker}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-defualt-text shadow-sm transition hover:bg-gray-10"
                  >
                    <Pencil className="size-3.5" />
                    เปลี่ยนรูป
                  </button>
                  <button
                    type="button"
                    onClick={onRemove}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-red-100 shadow-sm transition hover:bg-gray-10"
                  >
                    <Trash2 className="size-3.5" />
                    ลบ
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-gray-200 text-xs text-gray-100 transition hover:border-brown-100 hover:bg-gray-10 disabled:opacity-60 ${boxClassName}`}
          >
            {uploading ? (
              "กำลังอัปโหลด..."
            ) : (
              <>
                <ImagePlus className="size-5" />
                เพิ่มรูป
              </>
            )}
          </button>
        )}

        <p className="text-xs text-gray-100">{hint}</p>
      </div>
    </Field>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const swatch = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff";

  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={swatch}
          onChange={(event) => onChange(event.target.value)}
          className="size-11 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-gray-200 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-0"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#000000"
          className={inputClassName}
        />
      </div>
    </Field>
  );
}

function ThemePreview({ form }: { form: AppearanceForm }) {
  const color = (value: string, fallback: string) =>
    HEX_COLOR.test(value) ? value : fallback;

  const primary = color(form.primary_color, "#71329A");
  const secondary = color(form.secondary_color, "#4C1D95");
  const onPrimary = color(form.button_text_color, "#FFFFFF");
  const titleColor = color(form.text_white_color, "#FFFFFF");
  const nameColor = color(form.text_gray_color, "#6A7282");
  const surface = color(form.surface_color, "#FFFFFF");
  const tierColor = "#FFD700";

  const bannerUrl = getProxiedImageUrl(form.banner_url);
  const logoUrl = getProxiedImageUrl(form.logo_url);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-defualt-text">
        ตัวอย่างหน้าสมาชิก
      </p>
      <div
        className="mx-auto max-w-sm overflow-hidden rounded-[28px] border border-gray-200 shadow-sm"
        style={{ backgroundColor: surface }}
      >
        {/* Banner */}
        <div className="pointer-events-none relative -mb-45 h-80">
          {bannerUrl ? (
            <img
              alt="banner"
              src={bannerUrl}
              className="absolute inset-0 block size-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})`,
              }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 30%, rgb(10,10,10) 100%)",
            }}
          />
        </div>

        {/* Profile row */}
        <div className="relative z-2 flex items-center gap-4 px-4.5 pt-24 pb-5.5">
          <div
            className="flex h-12.5 w-12.5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/20"
            style={{ border: `1px solid ${primary}` }}
          >
            <User className="size-6 text-white/80" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-base font-semibold tracking-[-0.17px]"
              style={{ color: titleColor }}
            >
              {form.welcome_title || "สวัสดีสมาชิก"}
            </div>
            <div
              className="truncate text-sm font-medium tracking-[0.02em]"
              style={{ color: nameColor }}
            >
              ชื่อสมาชิก
            </div>
          </div>
          {logoUrl ? (
            <img
              alt="logo"
              src={logoUrl}
              className="h-9.5 w-auto shrink-0 rounded-xl bg-white"
              style={{
                boxShadow: `color-mix(in oklch, ${primary} 60%, transparent) 0px 4px 18px -4px`,
              }}
            />
          ) : (
            <div
              className="flex h-9.5 shrink-0 items-center rounded-xl bg-white px-2 text-[10px] font-bold"
              style={{ color: primary }}
            >
              LOGO
            </div>
          )}
        </div>

        {/* Point card */}
        <section
          className="relative z-2 mx-4.5 mb-5.5 overflow-hidden rounded-[22px] px-5.5 pt-5.5 pb-5"
          style={{
            backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})`,
            boxShadow: `color-mix(in oklch, ${secondary} 60%, transparent) 10px 10px 40px -10px, rgba(255,255,255,0.18) 0px 1px 0px inset`,
          }}
        >
          <div
            className="pointer-events-none absolute top-[-40%] right-[-20%] h-[140%] w-[70%] blur-lg"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.25), transparent 60%)",
            }}
          />
          <div className="relative flex items-center justify-between">
            <div
              className="flex items-center gap-1.5"
              style={{ color: onPrimary }}
            >
              <p className="text-sm font-medium">พ้อยคงเหลือ</p>
              <RefreshCw className="size-4" />
            </div>
            <div
              className="flex items-center gap-1.25 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ color: tierColor, border: `1px solid ${tierColor}` }}
            >
              <div
                className="h-1.25 w-1.25 rounded-full"
                style={{ backgroundColor: tierColor }}
              />
              ระดับสมาชิก
            </div>
          </div>
          <div className="relative mt-1.5 flex items-end justify-between">
            <div className="mt-1 text-white">
              <p className="text-[54px] leading-none font-semibold">517</p>
              <p className="mt-1 text-[11px] font-semibold tracking-[0.16em] uppercase">
                Point
              </p>
            </div>
            <div className="z-10">
              <div className="rounded-lg bg-white p-0.5">
                <QrCode className="size-9" style={{ color: secondary }} />
              </div>
            </div>
          </div>
        </section>
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

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm text-gray-100">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-defualt-text">{value}</dd>
    </div>
  );
}

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        value ? "bg-brown-yellow-5 text-brown-100" : "bg-gray-10 text-gray-100"
      }`}
    >
      {value ? "เปิด" : "ปิด"}
    </span>
  );
}
