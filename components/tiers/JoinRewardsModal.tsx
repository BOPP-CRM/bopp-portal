"use client";

import {
  getJoinRewards,
  rewardInputsEqual,
  rewardsToInputs,
  updateJoinRewards,
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
import { FormFieldsSkeleton } from "@/components/util/Skeleton";
import { handleError } from "@/utils/errors";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function JoinRewardsModal() {
  const router = useRouter();
  const [rewardItems, setRewardItems] = useState<RewardFormItem[]>([]);
  const [initialRewardInputs, setInitialRewardInputs] = useState(
    rewardsToInputs([]),
  );
  const [currencies, setCurrencies] = useState<PortalCurrency[]>([]);
  const [coupons, setCoupons] = useState<PortalCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [currencyData, couponData, rewards] = await Promise.all([
          getCurrencies(),
          getCoupons(),
          getJoinRewards(),
        ]);
        setCurrencies(currencyData);
        setCoupons(couponData);
        const inputs = rewardsToInputs(rewards);
        setInitialRewardInputs(inputs);
        setRewardItems(rewardsToFormItems(inputs));
      } catch (loadError) {
        setError(handleError(loadError).message);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const currentRewardInputs = useMemo(
    () => formItemsToRewardInputs(rewardItems),
    [rewardItems],
  );

  const hasChanges = !rewardInputsEqual(initialRewardInputs, currentRewardInputs);
  const isSaveDisabled = isSubmitting || loading || !hasChanges;

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

    const rewardError = validateRewards();
    if (rewardError) {
      setError(rewardError);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateJoinRewards(currentRewardInputs);
      setInitialRewardInputs(currentRewardInputs);
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
        <h1
          id="join-rewards-title"
          className="text-xl font-bold text-defualt-text"
        >
          รางวัลสมาชิกใหม่
        </h1>
        <p className="mt-1 text-sm text-gray-100">
          รางวัลที่แจกเมื่อสมาชิกสมัครครั้งแรก (แยกจากรางวัลตอนเลื่อน Tier)
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {loading ? (
            <FormFieldsSkeleton fields={3} />
          ) : (
            <TierRewardsEditor
              rewards={rewardItems}
              currencies={currencies}
              coupons={coupons}
              onChange={setRewardItems}
            />
          )}

          {error ? <p className="text-sm text-red-100">{error}</p> : null}

          <div className="flex gap-3 pt-2">
            <Link
              href="/dashboard/tier"
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
      </div>
    </div>
  );
}
