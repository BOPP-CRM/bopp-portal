"use client";

import TierRewardsEditor, {
  formItemsToRewardInputs,
  rewardsToFormItems,
  type RewardFormItem,
} from "@/components/tiers/TierRewardsEditor";
import Select from "@/components/util/Select";
import { FormFieldsSkeleton } from "@/components/util/Skeleton";
import { getCoupons } from "@/services/coupons/coupons";
import type { PortalCoupon } from "@/services/coupons/types";
import { getCurrencies } from "@/services/currencies/currencies";
import type { PortalCurrency } from "@/services/currencies/types";
import {
  buildTierUpdatePayload,
  createTier,
  getTier,
  getTierRewards,
  rewardInputsEqual,
  rewardsToInputs,
  updateTier,
  updateTierRewards,
  type CreateTierRequest,
  type PortalTier,
} from "@/services/tiers/tiers";
import { handleError } from "@/utils/errors";
import { getThaiWeekdayIndex } from "@/utils/tier-points";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const DAY_MULTIPLIER_FIELDS = [
  { key: "pointMultiplierMon", apiKey: "point_multiplier_mon", label: "จันทร์" },
  { key: "pointMultiplierTue", apiKey: "point_multiplier_tue", label: "อังคาร" },
  { key: "pointMultiplierWed", apiKey: "point_multiplier_wed", label: "พุธ" },
  { key: "pointMultiplierThu", apiKey: "point_multiplier_thu", label: "พฤหัส" },
  { key: "pointMultiplierFri", apiKey: "point_multiplier_fri", label: "ศุกร์" },
  { key: "pointMultiplierSat", apiKey: "point_multiplier_sat", label: "เสาร์" },
  { key: "pointMultiplierSun", apiKey: "point_multiplier_sun", label: "อาทิตย์" },
] as const;

const WEEKDAY_FIELDS = DAY_MULTIPLIER_FIELDS.slice(0, 5);
const WEEKEND_FIELDS = DAY_MULTIPLIER_FIELDS.slice(5);

const CHANNEL_FIELDS = [
  { key: "applyMultiplierReceipt", label: "ใบเสร็จ" },
  { key: "applyMultiplierZortout", label: "Zortout" },
  { key: "applyMultiplierOmisell", label: "Omisell" },
] as const;

type DayMultiplierFormKey = (typeof DAY_MULTIPLIER_FIELDS)[number]["key"];
type DayMultiplierApiKey = (typeof DAY_MULTIPLIER_FIELDS)[number]["apiKey"];
type ChannelFormKey = (typeof CHANNEL_FIELDS)[number]["key"];

type TierFormPageProps = {
  tierId: number | null;
};

type TierFormState = {
  name: string;
  code: string;
  minSpending: string;
  maxSpending: string;
  convertPoints: string;
  color: string;
  isShowInUi: boolean;
  pointMultiplierMon: string;
  pointMultiplierTue: string;
  pointMultiplierWed: string;
  pointMultiplierThu: string;
  pointMultiplierFri: string;
  pointMultiplierSat: string;
  pointMultiplierSun: string;
  applyMultiplierReceipt: boolean;
  applyMultiplierZortout: boolean;
  applyMultiplierOmisell: boolean;
};

const emptyForm: TierFormState = {
  name: "",
  code: "",
  minSpending: "0",
  maxSpending: "0",
  convertPoints: "0",
  color: "#d3966c",
  isShowInUi: true,
  pointMultiplierMon: "1",
  pointMultiplierTue: "1",
  pointMultiplierWed: "1",
  pointMultiplierThu: "1",
  pointMultiplierFri: "1",
  pointMultiplierSat: "1",
  pointMultiplierSun: "1",
  applyMultiplierReceipt: true,
  applyMultiplierZortout: true,
  applyMultiplierOmisell: true,
};

function dayMultiplierValue(
  tier: PortalTier,
  apiKey: DayMultiplierApiKey,
): number {
  const value = tier[apiKey];
  return typeof value === "number" && !Number.isNaN(value) ? value : 1;
}

function channelApplyValue(value: boolean | undefined): boolean {
  return value ?? true;
}

function toFormState(tier: PortalTier): TierFormState {
  return {
    name: tier.name,
    code: tier.code,
    minSpending: String(tier.min_spending),
    maxSpending: String(tier.max_spending),
    convertPoints: String(tier.convert_points),
    color: tier.color,
    isShowInUi: tier.is_show_in_ui,
    pointMultiplierMon: String(dayMultiplierValue(tier, "point_multiplier_mon")),
    pointMultiplierTue: String(dayMultiplierValue(tier, "point_multiplier_tue")),
    pointMultiplierWed: String(dayMultiplierValue(tier, "point_multiplier_wed")),
    pointMultiplierThu: String(dayMultiplierValue(tier, "point_multiplier_thu")),
    pointMultiplierFri: String(dayMultiplierValue(tier, "point_multiplier_fri")),
    pointMultiplierSat: String(dayMultiplierValue(tier, "point_multiplier_sat")),
    pointMultiplierSun: String(dayMultiplierValue(tier, "point_multiplier_sun")),
    applyMultiplierReceipt: channelApplyValue(
      tier.point_multiplier_apply_receipt,
    ),
    applyMultiplierZortout: channelApplyValue(
      tier.point_multiplier_apply_zortout,
    ),
    applyMultiplierOmisell: channelApplyValue(
      tier.point_multiplier_apply_omisell,
    ),
  };
}

function buildTierPayload(
  form: TierFormState,
): Omit<CreateTierRequest, "rewards"> {
  return {
    name: form.name.trim(),
    code: form.code.trim(),
    min_spending: Number(form.minSpending),
    max_spending: Number(form.maxSpending),
    convert_points: Number(form.convertPoints),
    point_multiplier_mon: Number(form.pointMultiplierMon),
    point_multiplier_tue: Number(form.pointMultiplierTue),
    point_multiplier_wed: Number(form.pointMultiplierWed),
    point_multiplier_thu: Number(form.pointMultiplierThu),
    point_multiplier_fri: Number(form.pointMultiplierFri),
    point_multiplier_sat: Number(form.pointMultiplierSat),
    point_multiplier_sun: Number(form.pointMultiplierSun),
    point_multiplier_apply_receipt: form.applyMultiplierReceipt,
    point_multiplier_apply_zortout: form.applyMultiplierZortout,
    point_multiplier_apply_omisell: form.applyMultiplierOmisell,
    color: form.color,
    is_show_in_ui: form.isShowInUi,
  };
}

function sharedMultiplier(
  form: TierFormState,
  fields: readonly { key: DayMultiplierFormKey }[],
): string | null {
  const first = form[fields[0].key];
  return fields.every((field) => form[field.key] === first) ? first : null;
}

export default function TierFormPage({ tierId }: TierFormPageProps) {
  const router = useRouter();
  const isEdit = tierId !== null;
  const [tier, setTier] = useState<PortalTier | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [form, setForm] = useState<TierFormState>(emptyForm);
  const [rewardItems, setRewardItems] = useState<RewardFormItem[]>([]);
  const [initialRewardInputs, setInitialRewardInputs] = useState(
    rewardsToInputs([]),
  );
  const [currencies, setCurrencies] = useState<PortalCurrency[]>([]);
  const [coupons, setCoupons] = useState<PortalCoupon[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([getCurrencies(), getCoupons()])
      .then(([currencyData, couponData]) => {
        setCurrencies(currencyData);
        setCoupons(couponData);
      })
      .catch(() => {
        setCurrencies([]);
        setCoupons([]);
      });
  }, []);

  useEffect(() => {
    if (tierId === null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getTier(tierId)
      .then((data) => {
        if (cancelled) return;
        setTier(data);
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
  }, [tierId]);

  useEffect(() => {
    const loadRewards = async () => {
      if (!tier) {
        setRewardItems([]);
        setInitialRewardInputs([]);
        return;
      }

      try {
        const rewards =
          tier.rewards && tier.rewards.length > 0
            ? tier.rewards
            : await getTierRewards(tier.id);
        const inputs = rewardsToInputs(rewards);
        setInitialRewardInputs(inputs);
        setRewardItems(rewardsToFormItems(inputs));
      } catch {
        setInitialRewardInputs([]);
        setRewardItems([]);
      }
    };

    void loadRewards();
  }, [tier]);

  const showInUiOptions = useMemo(
    () => [
      { value: "true" as const, label: "แสดงใน UI" },
      { value: "false" as const, label: "ไม่แสดงใน UI" },
    ],
    [],
  );

  const currentRewardInputs = useMemo(
    () => formItemsToRewardInputs(rewardItems),
    [rewardItems],
  );

  const hasChanges = useMemo(() => {
    if (!tier) return true;

    const payload = buildTierPayload(form);
    const tierChanged =
      Object.keys(buildTierUpdatePayload(tier, payload)).length > 0;
    const rewardsChanged = !rewardInputsEqual(
      initialRewardInputs,
      currentRewardInputs,
    );

    return tierChanged || rewardsChanged;
  }, [currentRewardInputs, form, initialRewardInputs, tier]);

  const isSaveDisabled = isSubmitting || loading || (isEdit && !hasChanges);

  const updateField = <K extends keyof TierFormState>(
    key: K,
    value: TierFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateDays = (keys: readonly DayMultiplierFormKey[], value: string) => {
    setForm((prev) => {
      const next = { ...prev };
      for (const key of keys) next[key] = value;
      return next;
    });
  };

  const collapseToGroups = () => {
    setForm((prev) => {
      const next = { ...prev };
      for (const field of WEEKDAY_FIELDS) {
        next[field.key] = prev.pointMultiplierMon;
      }
      for (const field of WEEKEND_FIELDS) {
        next[field.key] = prev.pointMultiplierSat;
      }
      return next;
    });
  };

  const validateRewards = () => {
    for (const reward of rewardItems) {
      if (reward.rewardType === "point") {
        const value = Number(reward.pointValue);
        if (!reward.pointCurrencyId || Number.isNaN(value) || value <= 0) {
          return "กรุณาระบุ point และสกุลให้ถูกต้องในรางวัล";
        }
      } else if (!reward.couponId) {
        return "กรุณาเลือกคูปองในรางวัล";
      }
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.code.trim()) {
      setError("กรุณาระบุชื่อและรหัสระดับ");
      return;
    }

    const payload = buildTierPayload(form);

    if (
      Number.isNaN(payload.min_spending) ||
      Number.isNaN(payload.max_spending) ||
      Number.isNaN(payload.convert_points) ||
      DAY_MULTIPLIER_FIELDS.some(({ apiKey }) => Number.isNaN(payload[apiKey]))
    ) {
      setError("กรุณาระบุตัวเลขให้ถูกต้อง");
      return;
    }

    if (payload.min_spending > payload.max_spending) {
      setError("ยอดใช้จ่ายขั้นต่ำต้องไม่มากกว่ายอดสูงสุด");
      return;
    }

    if (DAY_MULTIPLIER_FIELDS.some(({ apiKey }) => payload[apiKey] < 0)) {
      setError("ตัวคูณ point ในแต่ละวันต้องไม่น้อยกว่า 0");
      return;
    }

    const rewardError = validateRewards();
    if (rewardError) {
      setError(rewardError);
      return;
    }

    const rewardPayload = currentRewardInputs;

    setIsSubmitting(true);
    try {
      if (isEdit && tier) {
        const updatePayload = buildTierUpdatePayload(tier, payload);
        if (Object.keys(updatePayload).length > 0) {
          await updateTier(tier.id, updatePayload);
        }
        if (!rewardInputsEqual(initialRewardInputs, rewardPayload)) {
          await updateTierRewards(tier.id, rewardPayload);
        }
      } else {
        await createTier({
          ...payload,
          rewards: rewardPayload.length > 0 ? rewardPayload : undefined,
        });
      }
      router.push("/dashboard/tier?saved=1");
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3 md:p-5">
      <Link
        href="/dashboard/tier"
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-100 hover:text-brown-100"
      >
        <ArrowLeft className="size-4" />
        กลับไประดับสมาชิก
      </Link>

      <div className="rounded-md border border-gray-200 bg-white p-4 md:p-5">
        <h1 className="text-xl font-bold text-defualt-text">
          {isEdit ? "แก้ไขระดับสมาชิก" : "เพิ่มระดับสมาชิก"}
        </h1>
        <p className="mt-1 text-sm text-gray-100">
          กำหนดเงื่อนไขยอดใช้จ่าย อัตราแปลง point และรางวัลเมื่อเลื่อน Tier
        </p>

        {loading ? (
          <div className="mt-5">
            <FormFieldsSkeleton fields={6} />
          </div>
        ) : error && !tier && isEdit ? (
          <p className="mt-5 text-sm text-red-100">{error}</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <Section title="ข้อมูลระดับ">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="ชื่อระดับ">
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="เช่น Gold"
                    className={inputClassName}
                  />
                </Field>

                <Field label="รหัสระดับ">
                  <input
                    value={form.code}
                    onChange={(event) => updateField("code", event.target.value)}
                    placeholder="เช่น gold"
                    className={inputClassName}
                  />
                </Field>

                <Field label="ยอดใช้จ่ายขั้นต่ำ">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.minSpending}
                    onChange={(event) =>
                      updateField("minSpending", event.target.value)
                    }
                    className={inputClassName}
                  />
                </Field>

                <Field label="ยอดใช้จ่ายสูงสุด">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.maxSpending}
                    onChange={(event) =>
                      updateField("maxSpending", event.target.value)
                    }
                    className={inputClassName}
                  />
                </Field>

                <Field label="อัตราแปลง Point">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.convertPoints}
                    onChange={(event) =>
                      updateField("convertPoints", event.target.value)
                    }
                    className={inputClassName}
                  />
                </Field>

                <Field label="สี">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(event) =>
                        updateField("color", event.target.value)
                      }
                      className="size-11 cursor-pointer rounded-lg border border-gray-200 bg-white p-1"
                    />
                    <input
                      value={form.color}
                      onChange={(event) =>
                        updateField("color", event.target.value)
                      }
                      placeholder="#FFD700"
                      className={inputClassName}
                    />
                  </div>
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
              </div>
            </Section>

            <Section title="ตัวคูณ Point รายวัน">
              <DayMultiplierEditor
                form={form}
                onChangeDay={(key, value) => updateField(key, value)}
                onChangeDays={updateDays}
                onCollapseToGroups={collapseToGroups}
                onToggleChannel={(key) => updateField(key, !form[key])}
              />
            </Section>

            <Section title="รางวัลเมื่อเข้า Tier">
              <p className="mb-4 text-sm text-gray-100">
                สมาชิกจะได้รับรางวัลเหล่านี้เมื่อเลื่อนขึ้นมาถึงระดับนี้
              </p>
              <TierRewardsEditor
                rewards={rewardItems}
                currencies={currencies}
                coupons={coupons}
                onChange={setRewardItems}
              />
            </Section>

            {error ? <p className="text-sm text-red-100">{error}</p> : null}

            <div className="flex gap-3 pt-2">
              <Link
                href="/dashboard/tier"
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-4xl bg-gray-10 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80"
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

function DayMultiplierEditor({
  form,
  onChangeDay,
  onChangeDays,
  onCollapseToGroups,
  onToggleChannel,
}: {
  form: TierFormState;
  onChangeDay: (key: DayMultiplierFormKey, value: string) => void;
  onChangeDays: (keys: readonly DayMultiplierFormKey[], value: string) => void;
  onCollapseToGroups: () => void;
  onToggleChannel: (key: ChannelFormKey) => void;
}) {
  const weekdayValue = sharedMultiplier(form, WEEKDAY_FIELDS);
  const weekendValue = sharedMultiplier(form, WEEKEND_FIELDS);
  const daysDiffer = weekdayValue === null || weekendValue === null;
  const [preferSplit, setPreferSplit] = useState<boolean | null>(null);
  const showSplit = preferSplit ?? daysDiffer;
  const today = DAY_MULTIPLIER_FIELDS[getThaiWeekdayIndex()];
  const convertPoints = Number(form.convertPoints);
  const todayMultiplier = Number(form[today.key]);
  const samplePoints =
    convertPoints > 0 && Number.isFinite(todayMultiplier)
      ? Math.floor((100 * todayMultiplier) / convertPoints)
      : null;
  const activeChannels = CHANNEL_FIELDS.filter((channel) => form[channel.key]);

  const applyPreset = (value: string) => {
    onChangeDays(
      DAY_MULTIPLIER_FIELDS.map((field) => field.key),
      value,
    );
    setPreferSplit(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-100">
        วันไหนที่ตัวคูณมากกว่า 1 สมาชิกจะได้ point มากขึ้นในวันนั้น
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-100">ทั้งสัปดาห์</span>
        {["1", "2", "5", "10"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => applyPreset(value)}
            className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-defualt-text transition hover:border-brown-100 hover:text-brown-100"
          >
            x{value}
          </button>
        ))}
      </div>

      {showSplit ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {DAY_MULTIPLIER_FIELDS.map((field) => (
            <MultiplierStepper
              key={field.key}
              label={field.label}
              value={form[field.key]}
              highlighted={field.key === today.key}
              onChange={(value) => onChangeDay(field.key, value)}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <MultiplierStepper
            label="จันทร์ – ศุกร์"
            value={weekdayValue ?? "1"}
            onChange={(value) =>
              onChangeDays(
                WEEKDAY_FIELDS.map((field) => field.key),
                value,
              )
            }
          />
          <MultiplierStepper
            label="เสาร์ – อาทิตย์"
            value={weekendValue ?? "1"}
            onChange={(value) =>
              onChangeDays(
                WEEKEND_FIELDS.map((field) => field.key),
                value,
              )
            }
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (showSplit && daysDiffer) onCollapseToGroups();
          setPreferSplit(!showSplit);
        }}
        className="cursor-pointer text-sm font-medium text-brown-100 hover:underline"
      >
        {showSplit ? "จัดเป็นวันธรรมดาและวันหยุด" : "ปรับแยกแต่ละวัน"}
      </button>

      <div>
        <p className="mb-2 text-sm text-gray-100">ใช้ตัวคูณกับ</p>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_FIELDS.map((channel) => {
            const selected = form[channel.key];
            return (
              <button
                key={channel.key}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggleChannel(channel.key)}
                className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                  selected
                    ? "border-brown-100 bg-brown-100 text-white"
                    : "border-gray-200 bg-white text-defualt-text hover:border-brown-100"
                }`}
              >
                {channel.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-gray-100">
        วันนี้ ({today.label}) ใช้ตัวคูณ x{form[today.key] || "0"}
        {activeChannels.length > 0
          ? ` กับ${activeChannels.map((channel) => channel.label).join(", ")}`
          : " แต่ยังไม่ได้เลือกช่องทาง"}
        {samplePoints !== null
          ? ` · ใช้จ่าย 100 บาทได้ ${samplePoints} point`
          : ""}
      </p>
    </div>
  );
}

function MultiplierStepper({
  label,
  value,
  onChange,
  highlighted = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  highlighted?: boolean;
}) {
  const bump = (delta: number) => {
    const current = Number(value);
    const base = Number.isFinite(current) ? current : 1;
    const next = Math.max(0, Math.round((base + delta) * 100) / 100);
    onChange(String(next));
  };

  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        highlighted
          ? "border-brown-100 bg-brown-yellow-5"
          : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-sm font-medium text-defualt-text">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => bump(-1)}
          className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-defualt-text hover:border-brown-100"
          aria-label={`ลดตัวคูณ${label}`}
        >
          <Minus className="size-4" />
        </button>
        <label className="flex min-w-0 flex-1 items-center justify-center gap-1">
          <span className="text-sm text-gray-100">x</span>
          <input
            type="number"
            min="0"
            step="1"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-14 bg-transparent text-center text-lg font-semibold text-defualt-text outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label={`ตัวคูณ${label}`}
          />
        </label>
        <button
          type="button"
          onClick={() => bump(1)}
          className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-gray-200 bg-white text-defualt-text hover:border-brown-100"
          aria-label={`เพิ่มตัวคูณ${label}`}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brown-100";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 p-4 md:p-5">
      <h2 className="mb-4 text-sm font-semibold text-defualt-text">{title}</h2>
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
