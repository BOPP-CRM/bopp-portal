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
import { useEffect, useMemo, useState } from "react";

const MODAL_EXIT_MS = 250;

type JoinRewardsModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function JoinRewardsModal({
  onClose,
  onSuccess,
}: JoinRewardsModalProps) {
  const [isClosing, setIsClosing] = useState(false);
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
        aria-labelledby="join-rewards-title"
        className={`max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="join-rewards-title"
          className="text-xl font-bold text-defualt-text"
        >
          รางวัลสมาชิกใหม่
        </h2>
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
