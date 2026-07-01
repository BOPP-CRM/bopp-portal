"use client";

import type { ReceiptMember } from "@/services/receipts/receipts";
import { formatNumber, getDefaultPointBalance } from "@/utils/format";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Loader2,
  QrCode,
  RotateCcw,
  Search,
} from "lucide-react";
import PosModeSwitch from "@/components/receipts/PosModeSwitch";

type PosStep = "member" | "photo" | "amount" | "success";

const POS_QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const posPrimaryButtonClassName =
  "flex w-full items-center justify-center gap-3 rounded-3xl bg-brown-100 px-6 py-5 text-xl font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

const posSecondaryButtonClassName =
  "flex w-full items-center justify-center gap-3 rounded-3xl border border-gray-200 bg-white px-6 py-5 text-lg font-medium text-defualt-text transition active:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-60";

const posInputClassName =
  "w-full rounded-3xl border border-gray-200 bg-white px-5 py-5 text-lg outline-none focus:border-brown-100";

type CreateManualReceiptPosViewProps = {
  step: PosStep;
  member: ReceiptMember | null;
  amount: string;
  setAmount: (value: string) => void;
  previewRewardPoints: number;
  requireImage: boolean;
  imagePreviewUrl: string | null;
  error: string | null;
  lookupLoading: boolean;
  submitLoading: boolean;
  createdReceiptNumber: string | null;
  rewardPoints: number;
  amountNumber: number;
  canContinuePhoto: boolean;
  onTogglePosMode: (enabled: boolean) => void;
  onOpenScanner: () => void;
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onContinuePhoto: () => void;
  onSubmit: () => void;
  onResetFlow: () => void;
  onGoBack: () => void;
  queryInput: string;
  onQueryInputChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function PosMemberAvatar({
  member,
}: {
  member: Pick<ReceiptMember, "display_name" | "picture_url">;
}) {
  return member.picture_url ? (
    <img
      src={String(member.picture_url)}
      alt={member.display_name}
      className="size-12 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brown-100 text-base font-semibold text-white">
      {member.display_name.charAt(0)}
    </div>
  );
}

export default function CreateManualReceiptPosView({
  step,
  member,
  amount,
  setAmount,
  previewRewardPoints,
  requireImage,
  imagePreviewUrl,
  error,
  lookupLoading,
  submitLoading,
  createdReceiptNumber,
  rewardPoints,
  amountNumber,
  canContinuePhoto,
  onTogglePosMode,
  onOpenScanner,
  onImageChange,
  onContinuePhoto,
  onSubmit,
  onResetFlow,
  onGoBack,
  queryInput,
  onQueryInputChange,
  onSearchSubmit,
}: CreateManualReceiptPosViewProps) {
  const appendQuickAmount = (value: number) => {
    const current = Number(amount);
    const next =
      Number.isNaN(current) || current <= 0 ? value : current + value;
    setAmount(String(next));
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-gray-10">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {step !== "member" && step !== "success" ? (
            <button
              type="button"
              onClick={onGoBack}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-100"
              aria-label="ย้อนกลับ"
            >
              <ArrowLeft className="size-5" />
            </button>
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-defualt-text">
              เพิ่มใบเสร็จ
            </p>
            <p className="truncate text-xs text-gray-100">
              {step === "member"
                ? "สแกน QR หรือค้นหาสมาชิก"
                : step === "photo"
                  ? "ถ่ายรูปใบเสร็จ"
                  : step === "amount"
                    ? "ระบุยอดเงิน"
                    : "บันทึกสำเร็จ"}
            </p>
          </div>
        </div>
        <PosModeSwitch
          enabled
          label="POS"
          onChange={(enabled) => {
            if (!enabled) onTogglePosMode(false);
          }}
        />
      </header>

      {error ? (
        <div className="mx-4 mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        {step === "member" ? (
          <div className="flex min-h-full flex-1 flex-col justify-center gap-4">
            <button
              type="button"
              onClick={onOpenScanner}
              disabled={lookupLoading}
              className={`${posPrimaryButtonClassName} min-h-[40vh] flex-col`}
            >
              {lookupLoading ? (
                <>
                  <Loader2 className="size-16 animate-spin" />
                  <span>กำลังค้นหาสมาชิก...</span>
                </>
              ) : (
                <>
                  <QrCode className="size-20" />
                  <span>แตะเพื่อสแกน QR</span>
                  <span className="text-sm font-normal text-white/80">
                    จัด QR ให้อยู่กลางจอ
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3 px-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-100">หรือ</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={onSearchSubmit} className="space-y-3">
              <input
                type="search"
                value={queryInput}
                onChange={(event) => onQueryInputChange(event.target.value)}
                placeholder="เบอร์โทร, อีเมล หรือ LINE User ID"
                enterKeyHint="search"
                className={posInputClassName}
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className={posSecondaryButtonClassName}
              >
                <Search className="size-5" />
                {lookupLoading ? "กำลังค้นหา..." : "ค้นหาสมาชิก"}
              </button>
            </form>
          </div>
        ) : null}

        {step === "photo" && requireImage && member ? (
          <div className="flex min-h-full flex-1 flex-col gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
              <PosMemberAvatar member={member} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-defualt-text">
                  {member.display_name}
                </p>
                <p className="text-sm text-gray-100">
                  {member.tier ? member.tier.name : "ยังไม่มี Tier"} ·{" "}
                  {formatNumber(getDefaultPointBalance(member.points))} คะแนน
                </p>
              </div>
            </div>

            {imagePreviewUrl ? (
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-black/5">
                <img
                  src={imagePreviewUrl}
                  alt="ตัวอย่างใบเสร็จ"
                  className="max-h-[48vh] w-full object-contain"
                />
              </div>
            ) : (
              <label className="flex min-h-[48vh] flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-brown-100 bg-brown-50/50 px-6 py-10 text-center">
                <Camera className="size-16 text-brown-100" />
                <div>
                  <p className="text-xl font-semibold text-defualt-text">
                    แตะเพื่อถ่ายรูปใบเสร็จ
                  </p>
                  <p className="mt-1 text-sm text-gray-100">
                    ใช้กล้องหลังของอุปกรณ์
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onImageChange}
                  className="hidden"
                />
              </label>
            )}

            {imagePreviewUrl ? (
              <label className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-medium text-defualt-text">
                <RotateCcw className="size-5" />
                ถ่ายใหม่
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onImageChange}
                  className="hidden"
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {step === "amount" && member ? (
          <div className="flex min-h-full flex-1 flex-col gap-5">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
              <PosMemberAvatar member={member} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-defualt-text">
                  {member.display_name}
                </p>
                <p className="text-sm text-gray-100">
                  {member.tier ? member.tier.name : "ยังไม่มี Tier"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-5">
              <p className="text-center text-sm text-gray-100">
                มูลค่าใบเสร็จ (บาท)
              </p>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0"
                autoFocus
                className="mt-2 w-full border-0 bg-transparent text-center text-5xl font-semibold text-defualt-text outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {POS_QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => appendQuickAmount(value)}
                  className="rounded-2xl border border-gray-200 bg-white px-3 py-4 text-base font-semibold text-defualt-text active:bg-gray-10"
                >
                  +{formatNumber(value)}
                </button>
              ))}
            </div>

            <div className="rounded-3xl bg-brown-50 px-5 py-5 text-center">
              <p className="text-sm text-gray-100">คะแนนที่จะได้รับ</p>
              <p className="mt-1 text-4xl font-semibold text-brown-100">
                {formatNumber(previewRewardPoints)}
              </p>
              {member.tier ? (
                <p className="mt-2 text-xs text-gray-100">
                  {formatNumber(member.tier.convert_points)} บาท = 1 คะแนน
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="flex min-h-full flex-1 flex-col items-center justify-center py-6 text-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-green-50 text-green-500">
              <CheckCircle2 className="size-12" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold text-defualt-text">
              บันทึกสำเร็จ
            </h2>
            <p className="mt-2 text-5xl font-semibold text-brown-100">
              +{formatNumber(rewardPoints)} คะแนน
            </p>
            <p className="mt-2 text-sm text-gray-100">
              ยอด {formatNumber(amountNumber)} บาท
            </p>
            {createdReceiptNumber ? (
              <p className="mt-4 break-all px-4 text-xs text-gray-100">
                เลขที่ใบเสร็จ: {createdReceiptNumber}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {step === "photo" && requireImage ? (
        <div className="shrink-0 border-t border-gray-200 bg-white p-4">
          <button
            type="button"
            disabled={!canContinuePhoto}
            onClick={onContinuePhoto}
            className={posPrimaryButtonClassName}
          >
            ถัดไป · ระบุยอดเงิน
          </button>
        </div>
      ) : null}

      {step === "amount" ? (
        <div className="shrink-0 border-t border-gray-200 bg-white p-4">
          <button
            type="button"
            disabled={
              Number.isNaN(amountNumber) || amountNumber <= 0 || submitLoading
            }
            onClick={onSubmit}
            className={posPrimaryButtonClassName}
          >
            {submitLoading ? (
              <>
                <Loader2 className="size-6 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึกและอนุมัติ"
            )}
          </button>
        </div>
      ) : null}

      {step === "success" ? (
        <div className="shrink-0 border-t border-gray-200 bg-white p-4">
          <button
            type="button"
            onClick={onResetFlow}
            className={posPrimaryButtonClassName}
          >
            <QrCode className="size-6" />
            รายการถัดไป
          </button>
        </div>
      ) : null}
    </div>
  );
}
