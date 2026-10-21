"use client";

import RulePreviewBody from "@/components/coupon-distribution/RulePreviewBody";
import {
  GENDER_LABELS,
  VERIFIED_LABELS,
} from "@/components/coupon-distribution/utils";
import Select from "@/components/util/Select";
import {
  createDistributionRule,
  previewDistribution,
  updateDistributionRule,
} from "@/services/coupon-distribution/coupon-distribution";
import type {
  DistributionPreviewResponse,
  DistributionRulePayload,
  PortalDistributionRule,
  RuleGender,
  RuleMessageType,
  RuleTrigger,
  RuleVerifiedFilter,
} from "@/services/coupon-distribution/types";
import { getCoupons } from "@/services/coupons/coupons";
import type { PortalCoupon } from "@/services/coupons/types";
import { getTiers } from "@/services/tiers/tiers";
import type { PortalTier } from "@/services/tiers/types";
import { toApiDateTime, toDatetimeLocalValue } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { useEffect, useMemo, useState } from "react";

const MODAL_EXIT_MS = 250;

type RuleFormModalProps = {
  rule?: PortalDistributionRule | null;
  onClose: () => void;
  onSuccess: () => void;
};

type RuleFormState = {
  name: string;
  active: boolean;
  couponId: number;
  trigger: RuleTrigger;
  scheduleIntervalDays: string;
  gender: RuleGender;
  tierIds: number[];
  ageMin: string;
  ageMax: string;
  signupFrom: string;
  signupTo: string;
  emailVerified: RuleVerifiedFilter;
  phoneVerified: RuleVerifiedFilter;
  notifyLine: boolean;
  messageType: RuleMessageType;
  messageText: string;
  flexPayload: string;
};

const emptyForm = (): RuleFormState => ({
  name: "",
  active: true,
  couponId: 0,
  trigger: "manual",
  scheduleIntervalDays: "1",
  gender: "any",
  tierIds: [],
  ageMin: "",
  ageMax: "",
  signupFrom: "",
  signupTo: "",
  emailVerified: "any",
  phoneVerified: "any",
  notifyLine: false,
  messageType: "text",
  messageText: "",
  flexPayload: "",
});

const toFormState = (rule: PortalDistributionRule): RuleFormState => ({
  name: rule.name,
  active: rule.active,
  couponId: rule.coupon.id,
  trigger: rule.trigger,
  scheduleIntervalDays: String(rule.schedule_interval_days),
  gender: rule.seg_gender,
  tierIds: rule.seg_tiers.map((tier) => tier.id),
  ageMin: rule.seg_age_min ? String(rule.seg_age_min) : "",
  ageMax: rule.seg_age_max ? String(rule.seg_age_max) : "",
  signupFrom: toDatetimeLocalValue(rule.seg_signup_from),
  signupTo: toDatetimeLocalValue(rule.seg_signup_to),
  emailVerified: rule.seg_email_verified,
  phoneVerified: rule.seg_phone_verified,
  notifyLine: rule.notify_line,
  messageType: rule.message_type,
  messageText: rule.message_text || "",
  flexPayload: rule.flex_payload || "",
});

const toPayload = (form: RuleFormState): DistributionRulePayload => ({
  name: form.name.trim(),
  active: form.active,
  coupon_id: form.couponId,
  trigger: form.trigger,
  schedule_interval_days: Number(form.scheduleIntervalDays) || 1,
  seg_gender: form.gender,
  seg_age_min: Number(form.ageMin) || 0,
  seg_age_max: Number(form.ageMax) || 0,
  seg_tier_ids: form.tierIds,
  seg_signup_from: toApiDateTime(form.signupFrom),
  seg_signup_to: toApiDateTime(form.signupTo),
  seg_email_verified: form.emailVerified,
  seg_phone_verified: form.phoneVerified,
  notify_line: form.notifyLine,
  message_type: form.messageType,
  message_text: form.messageText,
  flex_payload: form.flexPayload,
});

const genderOptions = (Object.keys(GENDER_LABELS) as RuleGender[]).map(
  (value) => ({ value, label: GENDER_LABELS[value] }),
);
const verifiedOptions = (
  Object.keys(VERIFIED_LABELS) as RuleVerifiedFilter[]
).map((value) => ({ value, label: VERIFIED_LABELS[value] }));
const triggerOptions: { value: RuleTrigger; label: string }[] = [
  { value: "manual", label: "กดแจกเอง" },
  { value: "scheduled", label: "แจกอัตโนมัติ (ตามรอบเวลา)" },
];
const messageTypeOptions: { value: RuleMessageType; label: string }[] = [
  { value: "text", label: "ข้อความ" },
  { value: "flex", label: "Flex Message (JSON)" },
];

export default function RuleFormModal({
  rule,
  onClose,
  onSuccess,
}: RuleFormModalProps) {
  const isEdit = Boolean(rule);
  const [isClosing, setIsClosing] = useState(false);
  const [coupons, setCoupons] = useState<PortalCoupon[]>([]);
  const [tiers, setTiers] = useState<PortalTier[]>([]);
  const [form, setForm] = useState<RuleFormState>(
    rule ? toFormState(rule) : emptyForm(),
  );
  const [preview, setPreview] = useState<DistributionPreviewResponse | null>(
    null,
  );
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getCoupons()
      .then(setCoupons)
      .catch(() => setCoupons([]));
    void getTiers()
      .then(setTiers)
      .catch(() => setTiers([]));
  }, []);

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

  const couponOptions = useMemo(
    () => coupons.map((coupon) => ({ value: coupon.id, label: coupon.name })),
    [coupons],
  );

  const updateField = <K extends keyof RuleFormState>(
    key: K,
    value: RuleFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setPreview(null);
  };

  const toggleTier = (tierId: number) => {
    updateField(
      "tierIds",
      form.tierIds.includes(tierId)
        ? form.tierIds.filter((id) => id !== tierId)
        : [...form.tierIds, tierId],
    );
  };

  const validate = () => {
    if (!form.name.trim()) return "กรุณาระบุชื่อกฎ";
    if (!form.couponId) return "กรุณาเลือกคูปอง";
    const ageMin = Number(form.ageMin) || 0;
    const ageMax = Number(form.ageMax) || 0;
    if (ageMin < 0 || ageMax < 0) return "อายุต้องไม่ติดลบ";
    if (ageMin && ageMax && ageMin > ageMax) {
      return "อายุขั้นต่ำต้องไม่มากกว่าอายุสูงสุด";
    }
    if (form.trigger === "scheduled" && Number(form.scheduleIntervalDays) < 1) {
      return "ความถี่ต้องอย่างน้อย 1 วัน";
    }
    if (
      form.notifyLine &&
      form.messageType === "text" &&
      !form.messageText.trim()
    ) {
      return "กรุณาระบุข้อความที่จะส่งทาง LINE";
    }
    return null;
  };

  const handlePreview = async () => {
    setError(null);
    setIsPreviewing(true);
    try {
      setPreview(
        await previewDistribution({ ...toPayload(form), rule_id: rule?.id }),
      );
    } catch (previewError) {
      setError(handleError(previewError).message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      if (rule) {
        await updateDistributionRule(rule.id, toPayload(form));
      } else {
        await createDistributionRule(toPayload(form));
      }
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
        aria-labelledby="rule-form-title"
        className={`max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="rule-form-title"
          className="text-xl font-bold text-defualt-text"
        >
          {isEdit ? "แก้ไขกฎแจกคูปอง" : "เพิ่มกฎแจกคูปอง"}
        </h2>
        <p className="mt-1 text-sm text-gray-100">
          สมาชิกที่เข้าเงื่อนไขจะได้รับคูปอง 1 ใบต่อกฎ (ไม่แจกซ้ำ)
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <Section title="ข้อมูลทั่วไป">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="ชื่อกฎ">
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="เช่น คูปองเครื่องสำอางสำหรับผู้หญิง"
                  className={inputClassName}
                />
              </Field>
              <Field label="คูปองที่จะแจก">
                <Select
                  value={form.couponId}
                  options={couponOptions}
                  onChange={(value) => updateField("couponId", value)}
                  placeholder="เลือกคูปอง"
                />
              </Field>
              <Field label="การทำงาน">
                <Select
                  value={form.trigger}
                  options={triggerOptions}
                  onChange={(value) => updateField("trigger", value)}
                />
              </Field>
              {form.trigger === "scheduled" ? (
                <Field label="ตรวจสอบและแจกทุก (วัน)">
                  <input
                    type="number"
                    min="1"
                    value={form.scheduleIntervalDays}
                    onChange={(event) =>
                      updateField("scheduleIntervalDays", event.target.value)
                    }
                    className={inputClassName}
                  />
                </Field>
              ) : null}
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-defualt-text">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => updateField("active", event.target.checked)}
              />
              เปิดใช้งานกฎนี้
            </label>
          </Section>

          <Section title="เงื่อนไขสมาชิก">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="เพศ">
                <Select
                  value={form.gender}
                  options={genderOptions}
                  onChange={(value) => updateField("gender", value)}
                />
              </Field>
              <Field label="Tier (ไม่เลือก = ทุก tier)" className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {tiers.length === 0 ? (
                    <span className="text-sm text-gray-100">ไม่มี tier</span>
                  ) : null}
                  {tiers.map((tier) => {
                    const selected = form.tierIds.includes(tier.id);
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => toggleTier(tier.id)}
                        className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition ${
                          selected
                            ? "border-brown-100 bg-brown-yellow-5 text-brown-100"
                            : "border-gray-200 text-gray-100 hover:border-brown-100"
                        }`}
                      >
                        {tier.name}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="อายุขั้นต่ำ (ปี)">
                <input
                  type="number"
                  min="0"
                  value={form.ageMin}
                  onChange={(event) => updateField("ageMin", event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="อายุสูงสุด (ปี)">
                <input
                  type="number"
                  min="0"
                  value={form.ageMax}
                  onChange={(event) => updateField("ageMax", event.target.value)}
                  className={inputClassName}
                />
              </Field>
              <Field label="สมัครตั้งแต่">
                <input
                  type="datetime-local"
                  value={form.signupFrom}
                  onChange={(event) =>
                    updateField("signupFrom", event.target.value)
                  }
                  className={inputClassName}
                />
              </Field>
              <Field label="สมัครถึง">
                <input
                  type="datetime-local"
                  value={form.signupTo}
                  onChange={(event) =>
                    updateField("signupTo", event.target.value)
                  }
                  className={inputClassName}
                />
              </Field>
              <Field label="ยืนยันอีเมล">
                <Select
                  value={form.emailVerified}
                  options={verifiedOptions}
                  onChange={(value) => updateField("emailVerified", value)}
                />
              </Field>
              <Field label="ยืนยันเบอร์โทร">
                <Select
                  value={form.phoneVerified}
                  options={verifiedOptions}
                  onChange={(value) => updateField("phoneVerified", value)}
                />
              </Field>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={isPreviewing || !form.couponId}
                onClick={() => void handlePreview()}
                className="cursor-pointer rounded-4xl border border-brown-100 px-4 py-2 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPreviewing ? "กำลังตรวจสอบ..." : "ดูผู้ที่จะได้รับ"}
              </button>
              {!form.couponId ? (
                <span className="text-xs text-gray-100">เลือกคูปองก่อน</span>
              ) : null}
            </div>
            {preview ? (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-10 p-4">
                <RulePreviewBody preview={preview} />
              </div>
            ) : null}
          </Section>

          <Section title="แจ้งเตือนทาง LINE">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-defualt-text">
              <input
                type="checkbox"
                checked={form.notifyLine}
                onChange={(event) =>
                  updateField("notifyLine", event.target.checked)
                }
              />
              ส่งข้อความ LINE แจ้งสมาชิกเมื่อได้รับคูปอง
            </label>
            {form.notifyLine ? (
              <div className="mt-4 space-y-4">
                <Field label="รูปแบบข้อความ">
                  <Select
                    value={form.messageType}
                    options={messageTypeOptions}
                    onChange={(value) => updateField("messageType", value)}
                  />
                </Field>
                {form.messageType === "text" ? (
                  <Field label="ข้อความ">
                    <textarea
                      rows={4}
                      value={form.messageText}
                      onChange={(event) =>
                        updateField("messageText", event.target.value)
                      }
                      placeholder="คุณได้รับคูปองใหม่! ดูได้ที่เมนูคูปองของฉัน"
                      className={inputClassName}
                    />
                  </Field>
                ) : (
                  <Field label="Flex payload (JSON)">
                    <textarea
                      rows={6}
                      value={form.flexPayload}
                      onChange={(event) =>
                        updateField("flexPayload", event.target.value)
                      }
                      className={`${inputClassName} font-mono`}
                    />
                  </Field>
                )}
                <p className="text-xs text-gray-100">
                  ต้องเชื่อมต่อ LINE Messaging API ของแบรนด์ก่อน
                  หากไม่ได้เชื่อมต่อ ระบบจะไม่แจกคูปอง
                </p>
              </div>
            ) : null}
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
      </div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brown-100";

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
