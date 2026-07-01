"use client";

import CreateManualReceiptPosView from "@/components/receipts/CreateManualReceiptPosView";
import PosModeSwitch from "@/components/receipts/PosModeSwitch";
import QrScannerModal from "@/components/receipts/QrScannerModal";
import { calcRewardPoints } from "@/components/receipts/ReceiptDetailModal";
import {
  createManualReceipt,
  lookupReceiptMember,
  type ReceiptMember,
} from "@/services/receipts/receipts";
import { useApp } from "@/providers/app-provider";
import { useReceiptPosMode } from "@/hooks/useReceiptPosMode";
import { handleError } from "@/utils/errors";
import { formatNumber, getDefaultPointBalance, normalizeMemberLookupQuery } from "@/utils/format";
import { readFileAsBase64 } from "@/utils/file";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  QrCode,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Step = "member" | "photo" | "amount" | "success";

type FlowStep = Exclude<Step, "success">;

type FlowStepConfig = { key: FlowStep; label: string };

function getFlowSteps(requireImage: boolean): FlowStepConfig[] {
  const steps: FlowStepConfig[] = [
    { key: "member", label: "สมาชิก" },
  ];
  if (requireImage) {
    steps.push({ key: "photo", label: "รูปใบเสร็จ" });
  }
  steps.push({ key: "amount", label: "ยอดเงิน" });
  return steps;
}

const inputClassName =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base outline-none focus:border-brown-100";

const primaryButtonClassName =
  "flex w-full items-center justify-center gap-2 rounded-2xl bg-brown-100 px-4 py-4 text-base font-semibold text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClassName =
  "flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-base font-medium text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-60";

function StepIndicator({
  step,
  steps,
}: {
  step: Step;
  steps: FlowStepConfig[];
}) {
  if (step === "success") return null;

  const currentIndex = steps.findIndex((item) => item.key === step);

  return (
    <div className="mb-6 flex w-full">
      {steps.map((item, index) => {
        const isActive = index === currentIndex;
        const isDone = index < currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <div
            key={item.key}
            className={`flex items-start ${isLast ? "shrink-0" : "min-w-0 flex-1"}`}
          >
            <div className="flex shrink-0 flex-col items-center">
              <div
                className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${
                  isActive || isDone
                    ? "bg-brown-100 text-white"
                    : "bg-gray-200 text-gray-100"
                }`}
              >
                {isDone ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-2 text-center text-xs font-medium ${
                  isActive ? "text-defualt-text" : "text-gray-100"
                }`}
              >
                {item.label}
              </span>
            </div>
            {!isLast ? (
              <div className="mt-[17px] flex min-w-4 flex-1 items-center px-2">
                <div
                  className={`h-0.5 w-full rounded-full ${
                    index < currentIndex ? "bg-brown-100" : "bg-gray-200"
                  }`}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function MemberAvatar({
  member,
}: {
  member: Pick<ReceiptMember, "display_name" | "picture_url">;
}) {
  const [imageError, setImageError] = useState(false);
  const showImage = member.picture_url && !imageError;

  if (showImage) {
    return (
      <img
        src={String(member.picture_url)}
        alt={member.display_name}
        onError={() => setImageError(true)}
        className="size-14 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brown-100 text-lg font-semibold text-white">
      {member.display_name.charAt(0)}
    </div>
  );
}

function MemberSummary({ member }: { member: ReceiptMember }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <MemberAvatar member={member} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-defualt-text">
          {member.display_name}
        </p>
        <p className="mt-1 text-sm text-gray-100">
          {member.tier ? member.tier.name : "ยังไม่มี Tier"} ·{" "}
          {formatNumber(getDefaultPointBalance(member.points))} คะแนน
        </p>
      </div>
    </div>
  );
}

export default function CreateManualReceiptPage() {
  const { me } = useApp();
  const { posMode, setPosMode, hydrated } = useReceiptPosMode();
  const requireImage = me?.partner.manual_receipt_require_image ?? true;
  const flowSteps = useMemo(
    () => getFlowSteps(requireImage),
    [requireImage],
  );

  const [step, setStep] = useState<Step>("member");
  const [queryInput, setQueryInput] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [member, setMember] = useState<ReceiptMember | null>(null);
  const [amount, setAmount] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdReceiptNumber, setCreatedReceiptNumber] = useState<
    string | null
  >(null);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [showScanner, setShowScanner] = useState(false);

  const amountNumber = Number(amount);
  const convertPoints =
    typeof member?.tier === "object" ? member.tier.convert_points : 0;
  const previewRewardPoints = useMemo(
    () =>
      calcRewardPoints(
        Number.isNaN(amountNumber) ? 0 : amountNumber,
        convertPoints,
      ),
    [amountNumber, convertPoints],
  );

  const resetFlow = () => {
    setStep("member");
    setQueryInput("");
    setShowSearch(false);
    setMember(null);
    setAmount("");
    setImageBase64(null);
    setImagePreviewUrl(null);
    setCreatedReceiptNumber(null);
    setRewardPoints(0);
    setError(null);
  };

  const handlePosModeChange = (enabled: boolean) => {
    setPosMode(enabled);
    if (!enabled) {
      setShowScanner(false);
    }
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  const handleLookup = async (
    query: string,
  ): Promise<{ ok: true } | { ok: false; message: string }> => {
    const trimmed = normalizeMemberLookupQuery(query);
    if (!trimmed) {
      const message = "กรุณาระบุเบอร์โทร อีเมล หรือ LINE User ID";
      setError(message);
      return { ok: false, message };
    }

    setLookupLoading(true);
    setError(null);

    try {
      const user = await lookupReceiptMember(trimmed);
      setMember(user);
      setQueryInput(trimmed);
      setStep(requireImage ? "photo" : "amount");
      return { ok: true };
    } catch (lookupError) {
      const message = handleError(lookupError).message;
      setMember(null);
      setError(message);
      return { ok: false, message };
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleLookup(queryInput);
  };

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("กรุณาเลือกไฟล์รูปภาพ");
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      setImageBase64(base64);
      setImagePreviewUrl(URL.createObjectURL(file));
      setError(null);
    } catch {
      setError("อ่านไฟล์รูปภาพไม่สำเร็จ");
      setImageBase64(null);
      setImagePreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!member) return;
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      setError("กรุณาระบุมูลค่าใบเสร็จให้ถูกต้อง");
      setStep("amount");
      return;
    }
    if (requireImage && !imageBase64) {
      setError("กรุณาถ่ายรูปใบเสร็จ");
      setStep("photo");
      return;
    }

    setSubmitLoading(true);
    setError(null);

    try {
      const receipt = await createManualReceipt({
        user_id: member.id,
        amount: amountNumber,
        ...(imageBase64 ? { receipt_image: imageBase64 } : {}),
      });
      setCreatedReceiptNumber(receipt.receipt_number);
      setRewardPoints(receipt.reward_points || previewRewardPoints);
      setStep("success");
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const goBack = () => {
    setError(null);
    if (step === "photo") {
      setStep("member");
      setMember(null);
      setImageBase64(null);
      setImagePreviewUrl(null);
      return;
    }
    if (step === "amount") {
      if (requireImage) {
        setStep("photo");
        return;
      }
      setStep("member");
      setMember(null);
    }
  };

  const canContinuePhoto = Boolean(imageBase64) && !lookupLoading;

  if (hydrated && posMode) {
    return (
      <>
        <CreateManualReceiptPosView
          step={step}
          member={member}
          amount={amount}
          setAmount={setAmount}
          previewRewardPoints={previewRewardPoints}
          requireImage={requireImage}
          imagePreviewUrl={imagePreviewUrl}
          error={error}
          lookupLoading={lookupLoading}
          submitLoading={submitLoading}
          createdReceiptNumber={createdReceiptNumber}
          rewardPoints={rewardPoints}
          amountNumber={amountNumber}
          canContinuePhoto={canContinuePhoto}
          onTogglePosMode={handlePosModeChange}
          onOpenScanner={() => setShowScanner(true)}
          onImageChange={(event) => void handleImageChange(event)}
          onContinuePhoto={() => {
            setError(null);
            setStep("amount");
          }}
          onSubmit={() => void handleSubmit()}
          onResetFlow={resetFlow}
          onGoBack={goBack}
          queryInput={queryInput}
          onQueryInputChange={setQueryInput}
          onSearchSubmit={handleSearchSubmit}
        />

        {showScanner ? (
          <QrScannerModal
            onClose={handleCloseScanner}
            onScan={async (value) => {
              const result = await handleLookup(value);
              if (!result.ok) {
                throw new Error(result.message);
              }
            }}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col px-4 pb-28 pt-4 md:min-h-0 md:max-w-2xl md:px-8 md:pb-8 md:pt-8">
      {step !== "success" ? (
        <div className="mb-4 flex items-center gap-3">
          {step === "member" ? (
            <Link
              href="/dashboard/receipts"
              className="inline-flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-100"
              aria-label="กลับ"
            >
              <ArrowLeft className="size-5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-100"
              aria-label="ย้อนกลับ"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-defualt-text">
              เพิ่มใบเสร็จ
            </h1>
            <p className="mt-0.5 text-sm text-gray-100">
              {step === "member"
                ? "เลือกสมาชิกก่อนบันทึกใบเสร็จ"
                : step === "photo"
                  ? "ถ่ายหรืออัปโหลดรูปใบเสร็จ"
                  : "ระบุยอดใบเสร็จแล้วบันทึก"}
            </p>
          </div>
          {hydrated ? (
            <PosModeSwitch enabled={posMode} onChange={handlePosModeChange} />
          ) : null}
        </div>
      ) : null}

      <StepIndicator step={step} steps={flowSteps} />

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {step === "member" ? (
        <div className="flex flex-1 flex-col gap-4">
          <button
            type="button"
            onClick={() => setShowScanner(true)}
            disabled={lookupLoading}
            className={`${primaryButtonClassName} min-h-28 flex-col py-8`}
          >
            <QrCode className="size-10" />
            <span>สแกน QR Code สมาชิก</span>
          </button>

          {!showSearch ? (
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className={secondaryButtonClassName}
            >
              <Search className="size-5" />
              ค้นหาด้วยเบอร์ / อีเมล
            </button>
          ) : (
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <input
                type="search"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="เบอร์โทร, อีเมล หรือ LINE User ID"
                autoFocus
                enterKeyHint="search"
                className={inputClassName}
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className={primaryButtonClassName}
              >
                {lookupLoading ? "กำลังค้นหา..." : "ค้นหาสมาชิก"}
              </button>
            </form>
          )}
        </div>
      ) : null}

      {step === "photo" && requireImage && member ? (
        <div className="flex flex-1 flex-col gap-5">
          <MemberSummary member={member} />

          {imagePreviewUrl ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/5">
              <img
                src={imagePreviewUrl}
                alt="ตัวอย่างใบเสร็จ"
                className="max-h-[42vh] w-full object-contain"
              />
            </div>
          ) : (
            <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brown-100 bg-brown-50/40 px-6 py-10 text-center">
              <Camera className="size-12 text-brown-100" />
              <div>
                <p className="text-base font-semibold text-defualt-text">
                  แตะเพื่อถ่ายรูปใบเสร็จ
                </p>
                <p className="mt-1 text-sm text-gray-100">
                  ใช้กล้องหลังของโทรศัพท์
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}

          {imagePreviewUrl ? (
            <label className={secondaryButtonClassName}>
              <Camera className="size-5" />
              ถ่ายใหม่
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {step === "amount" && member ? (
        <div className="flex flex-1 flex-col gap-5">
          <MemberSummary member={member} />

          {requireImage && imagePreviewUrl ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/5">
              <img
                src={imagePreviewUrl}
                alt="ตัวอย่างใบเสร็จ"
                className="max-h-40 w-full object-contain"
              />
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm font-medium text-defualt-text">
              มูลค่าใบเสร็จ (บาท)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              autoFocus
              className={`${inputClassName} text-center text-3xl font-semibold`}
            />
          </div>

          <div className="rounded-2xl bg-brown-50 px-4 py-4 text-center text-sm text-defualt-text">
            <p className="text-gray-100">คะแนนที่จะได้รับ</p>
            <p className="mt-1 text-3xl font-semibold">
              {formatNumber(previewRewardPoints)}
            </p>
            {member.tier ? (
              <p className="mt-2 text-xs text-gray-100">
                Tier {member.tier.name} ·{" "}
                {formatNumber(member.tier.convert_points)} บาท = 1 คะแนน
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step === "success" ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-green-50 text-green-500">
            <CheckCircle2 className="size-10" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-defualt-text">
            บันทึกสำเร็จ
          </h2>
          <p className="mt-2 text-sm text-gray-100">
            อนุมัติใบเสร็จและเพิ่มคะแนนให้สมาชิกแล้ว
          </p>

          <div className="mt-8 w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm">
            {member ? <MemberSummary member={member} /> : null}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-gray-10 px-3 py-3">
                <p className="text-gray-100">ยอดใบเสร็จ</p>
                <p className="mt-1 font-semibold text-defualt-text">
                  {formatNumber(amountNumber)} บาท
                </p>
              </div>
              <div className="rounded-xl bg-brown-50 px-3 py-3">
                <p className="text-gray-100">คะแนนที่ได้</p>
                <p className="mt-1 font-semibold text-defualt-text">
                  {formatNumber(rewardPoints)}
                </p>
              </div>
            </div>
            {createdReceiptNumber ? (
              <p className="mt-4 break-all text-xs text-gray-100">
                เลขที่ใบเสร็จ: {createdReceiptNumber}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {step !== "member" && step !== "success" ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
          {step === "photo" && requireImage ? (
            <button
              type="button"
              disabled={!canContinuePhoto}
              onClick={() => {
                setError(null);
                setStep("amount");
              }}
              className={primaryButtonClassName}
            >
              ถัดไป
              <ChevronRight className="size-5" />
            </button>
          ) : null}

          {step === "amount" ? (
            <button
              type="button"
              disabled={
                Number.isNaN(amountNumber) || amountNumber <= 0 || submitLoading
              }
              onClick={() => void handleSubmit()}
              className={primaryButtonClassName}
            >
              {submitLoading ? "กำลังบันทึก..." : "บันทึกและอนุมัติ"}
            </button>
          ) : null}
        </div>
      ) : null}

      {step === "success" ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
          <div className="mx-auto flex max-w-lg flex-col gap-3 md:max-w-2xl">
            <button
              type="button"
              onClick={resetFlow}
              className={primaryButtonClassName}
            >
              เพิ่มใบเสร็จอีก
            </button>
            <Link
              href="/dashboard/receipts"
              className={secondaryButtonClassName}
            >
              กลับรายการใบเสร็จ
            </Link>
          </div>
        </div>
      ) : null}

      {showScanner ? (
        <QrScannerModal
          onClose={handleCloseScanner}
          onScan={async (value) => {
            const result = await handleLookup(value);
            if (!result.ok) {
              throw new Error(result.message);
            }
          }}
        />
      ) : null}
    </div>
  );
}
