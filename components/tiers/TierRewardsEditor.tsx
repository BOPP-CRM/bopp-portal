"use client";

import type { PortalCoupon } from "@/services/coupons/types";
import type { PortalCurrency } from "@/services/currencies/types";
import type { TierRewardInput, TierRewardType } from "@/services/tiers/types";
import Select from "@/components/util/Select";
import { formatNumber } from "@/utils/format";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";

export type RewardFormItem = {
  key: string;
  id?: number;
  rewardType: TierRewardType;
  pointValue: string;
  pointCurrencyId: number;
  couponId: number;
  sequence: string;
};

const inputClassName =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brown-100";

export function rewardsToFormItems(rewards: TierRewardInput[]): RewardFormItem[] {
  return rewards.map((reward, index) => ({
    key: reward.id ? `reward-${reward.id}` : `reward-new-${index}`,
    id: reward.id,
    rewardType: reward.reward_type,
    pointValue: reward.point_value !== undefined ? String(reward.point_value) : "",
    pointCurrencyId: reward.point_currency_id ?? 0,
    couponId: reward.coupon_id ?? 0,
    sequence: String(reward.sequence ?? (index + 1) * 10),
  }));
}

export function formItemsToRewardInputs(items: RewardFormItem[]): TierRewardInput[] {
  return items.map((item, index) => {
    const base: TierRewardInput = {
      ...(item.id ? { id: item.id } : {}),
      reward_type: item.rewardType,
      sequence: Number(item.sequence) || (index + 1) * 10,
    };

    if (item.rewardType === "point") {
      return {
        ...base,
        point_value: Number(item.pointValue),
        point_currency_id: item.pointCurrencyId,
      };
    }

    return {
      ...base,
      coupon_id: item.couponId,
    };
  });
}

export function createEmptyRewardItem(
  currencies: PortalCurrency[],
  index: number,
): RewardFormItem {
  const defaultCurrency =
    currencies.find((currency) => currency.is_default) ?? currencies[0];

  return {
    key: `reward-new-${Date.now()}-${index}`,
    rewardType: "point",
    pointValue: "0",
    pointCurrencyId: defaultCurrency?.id ?? 0,
    couponId: 0,
    sequence: String((index + 1) * 10),
  };
}

type TierRewardsEditorProps = {
  rewards: RewardFormItem[];
  currencies: PortalCurrency[];
  coupons: PortalCoupon[];
  onChange: (rewards: RewardFormItem[]) => void;
};

export default function TierRewardsEditor({
  rewards,
  currencies,
  coupons,
  onChange,
}: TierRewardsEditorProps) {
  const rewardTypeOptions = useMemo(
    () => [
      { value: "point" as const, label: "Point" },
      { value: "coupon" as const, label: "Coupon" },
    ],
    [],
  );

  const currencyOptions = useMemo(
    () =>
      (currencies ?? []).map((currency) => ({
        value: currency.id,
        label: currency.name,
      })),
    [currencies],
  );

  const couponOptions = useMemo(
    () =>
      (coupons ?? []).map((coupon) => ({
        value: coupon.id,
        label: `${coupon.name} (${formatNumber(coupon.value)} ${coupon.currency_name})`,
      })),
    [coupons],
  );

  const updateReward = (
    key: string,
    patch: Partial<RewardFormItem>,
  ) => {
    onChange(
      (rewards ?? []).map((reward) =>
        reward.key === key ? { ...reward, ...patch } : reward,
      ),
    );
  };

  const removeReward = (key: string) => {
    onChange((rewards ?? []).filter((reward) => reward.key !== key));
  };

  const addReward = () => {
    onChange([
      ...(rewards ?? []),
      createEmptyRewardItem(currencies ?? [], (rewards ?? []).length),
    ]);
  };

  const rewardList = rewards ?? [];

  return (
    <div className="space-y-3">
      {rewardList.length === 0 ? (
        <p className="text-sm text-gray-100">ยังไม่มีรางวัล</p>
      ) : (
        rewardList.map((reward) => (
          <div
            key={reward.key}
            className="rounded-xl border border-gray-200 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-defualt-text">
                รางวัล #{reward.sequence || "-"}
              </p>
              <button
                type="button"
                onClick={() => removeReward(reward.key)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-4xl px-3 py-1.5 text-sm text-red-100 transition hover:bg-red-100/10"
              >
                <Trash2 className="size-4" />
                ลบ
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="ประเภทรางวัล">
                <Select
                  value={reward.rewardType}
                  options={rewardTypeOptions}
                  onChange={(value) =>
                    updateReward(reward.key, { rewardType: value })
                  }
                />
              </Field>

              <Field label="ลำดับ">
                <input
                  type="number"
                  min="0"
                  value={reward.sequence}
                  onChange={(event) =>
                    updateReward(reward.key, { sequence: event.target.value })
                  }
                  className={inputClassName}
                />
              </Field>

              {reward.rewardType === "point" ? (
                <>
                  <Field label="จำนวน Point">
                    <input
                      type="number"
                      min="0"
                      value={reward.pointValue}
                      onChange={(event) =>
                        updateReward(reward.key, {
                          pointValue: event.target.value,
                        })
                      }
                      className={inputClassName}
                    />
                  </Field>
                  <Field label="สกุล Point">
                    <Select
                      value={reward.pointCurrencyId}
                      options={currencyOptions}
                      onChange={(value) =>
                        updateReward(reward.key, { pointCurrencyId: value })
                      }
                    />
                  </Field>
                </>
              ) : (
                <Field label="คูปอง" className="md:col-span-2">
                  <Select
                    value={reward.couponId}
                    options={couponOptions}
                    onChange={(value) =>
                      updateReward(reward.key, { couponId: value })
                    }
                    placeholder="เลือกคูปอง"
                  />
                </Field>
              )}
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={addReward}
        className="inline-flex cursor-pointer items-center gap-2 rounded-4xl border border-brown-100 px-4 py-2 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5"
      >
        <Plus className="size-4" />
        เพิ่มรางวัล
      </button>
    </div>
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
