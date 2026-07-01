"use client";

import {
  buildTierUpdatePayload,
  createTier,
  getTierRewards,
  rewardInputsEqual,
  rewardsToInputs,
  updateTier,
  updateTierRewards,
  type CreateTierRequest,
  type PortalTier,
} from "@/services/tiers/tiers";
import { getCoupons } from "@/services/coupons/coupons";
import type { PortalCoupon } from "@/services/coupons/types";
import { getCurrencies } from "@/services/currencies/currencies";
import type { PortalCurrency } from "@/services/currencies/types";
import TierRewardsEditor, {
  formItemsToRewardInputs,
  rewardsToFormItems,
  type RewardFormItem,
} from "@/components/tiers/TierRewardsEditor";
import Select from "@/components/util/Select";
import { handleError } from "@/utils/errors";
import { useEffect, useMemo, useState } from "react";

const MODAL_EXIT_MS = 250;

type TierFormModalProps = {
  tier?: PortalTier | null;
  onClose: () => void;
  onSuccess: () => void;
};

type TierFormState = {
  name: string;
  code: string;
  minSpending: string;
  maxSpending: string;
  convertPoints: string;
  color: string;
  isShowInUi: boolean;
};

const emptyForm: TierFormState = {
  name: "",
  code: "",
  minSpending: "0",
  maxSpending: "0",
  convertPoints: "0",
  color: "#d3966c",
  isShowInUi: true,
};

function toFormState(tier: PortalTier): TierFormState {
  return {
    name: tier.name,
    code: tier.code,
    minSpending: String(tier.min_spending),
    maxSpending: String(tier.max_spending),
    convertPoints: String(tier.convert_points),
    color: tier.color,
    isShowInUi: tier.is_show_in_ui,
  };
}

export default function TierFormModal({
  tier,
  onClose,
  onSuccess,
}: TierFormModalProps) {
  const isEdit = Boolean(tier);
  const [isClosing, setIsClosing] = useState(false);
  const [form, setForm] = useState<TierFormState>(
    tier ? toFormState(tier) : emptyForm,
  );
  const [rewardItems, setRewardItems] = useState<RewardFormItem[]>([]);
  const [initialRewardInputs, setInitialRewardInputs] = useState(
    rewardsToInputs(tier?.rewards ?? []),
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

    const payload: Omit<CreateTierRequest, "rewards"> = {
      name: form.name.trim(),
      code: form.code.trim(),
      min_spending: Number(form.minSpending),
      max_spending: Number(form.maxSpending),
      convert_points: Number(form.convertPoints),
      color: form.color,
      is_show_in_ui: form.isShowInUi,
    };

    const tierChanged =
      Object.keys(buildTierUpdatePayload(tier, payload)).length > 0;
    const rewardsChanged = !rewardInputsEqual(
      initialRewardInputs,
      currentRewardInputs,
    );

    return tierChanged || rewardsChanged;
  }, [currentRewardInputs, form, initialRewardInputs, tier]);

  const isSaveDisabled = isSubmitting || (isEdit && !hasChanges);

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

  const updateField = <K extends keyof TierFormState>(
    key: K,
    value: TierFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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

    const payload: Omit<CreateTierRequest, "rewards"> = {
      name: form.name.trim(),
      code: form.code.trim(),
      min_spending: Number(form.minSpending),
      max_spending: Number(form.maxSpending),
      convert_points: Number(form.convertPoints),
      color: form.color,
      is_show_in_ui: form.isShowInUi,
    };

    if (
      Number.isNaN(payload.min_spending) ||
      Number.isNaN(payload.max_spending) ||
      Number.isNaN(payload.convert_points)
    ) {
      setError("กรุณาระบุตัวเลขให้ถูกต้อง");
      return;
    }

    if (payload.min_spending > payload.max_spending) {
      setError("ยอดใช้จ่ายขั้นต่ำต้องไม่มากกว่ายอดสูงสุด");
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
        aria-labelledby="tier-form-title"
        className={`max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="tier-form-title"
          className="text-xl font-bold text-defualt-text"
        >
          {isEdit ? "แก้ไขระดับสมาชิก" : "เพิ่มระดับสมาชิก"}
        </h2>
        <p className="mt-1 text-sm text-gray-100">
          กำหนดเงื่อนไขยอดใช้จ่าย อัตราแปลง point และรางวัลเมื่อเลื่อน Tier
        </p>

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
              disabled={isSaveDisabled}
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
    <section className="rounded-2xl border border-gray-200 p-4 md:p-5">
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
