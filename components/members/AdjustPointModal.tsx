"use client";

import { adjustUserPoint } from "@/services/members/members";
import type { PortalUser } from "@/services/members/types";
import { getCurrencies } from "@/services/currencies/currencies";
import type { PortalCurrency } from "@/services/currencies/types";
import Select from "@/components/util/Select";
import { handleError } from "@/utils/errors";
import { formatNumber, toApiPointType } from "@/utils/format";
import { useEffect, useMemo, useState } from "react";

const MODAL_EXIT_MS = 250;

type AdjustPointModalProps = {
  user: PortalUser;
  onSuccess: () => void;
};

export default function AdjustPointModal({
  user,
  onSuccess,
}: AdjustPointModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currencies, setCurrencies] = useState<PortalCurrency[]>([]);

  const balanceByCurrencyId = useMemo(
    () =>
      new Map(
        user.points.map((point) => [point.currency.id, point.balance]),
      ),
    [user.points],
  );

  const defaultCurrency =
    currencies.find((currency) => currency.is_default) ?? currencies[0];

  const [currencyId, setCurrencyId] = useState(0);
  const [type, setType] = useState<"earn" | "spend">("earn");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencyOptions = useMemo(
    () =>
      currencies.map((currency) => {
        const balance = balanceByCurrencyId.get(currency.id);
        const balanceLabel =
          balance !== undefined
            ? ` (คงเหลือ ${formatNumber(balance)})`
            : "";

        return {
          value: currency.id,
          label: `${currency.name}${balanceLabel}`,
        };
      }),
    [balanceByCurrencyId, currencies],
  );

  const typeOptions = useMemo(
    () => [
      { value: "earn" as const, label: "เพิ่ม Point" },
      { value: "spend" as const, label: "ลด Point" },
    ],
    [],
  );

  const resetForm = () => {
    setCurrencyId(defaultCurrency?.id ?? 0);
    setType("earn");
    setValue("");
    setNote("");
    setError(null);
  };

  const openModal = () => {
    resetForm();
    setIsOpen(true);
    void getCurrencies()
      .then((data) => {
        setCurrencies(data);
        const initial =
          data.find((currency) => currency.is_default) ?? data[0];
        if (initial) setCurrencyId(initial.id);
      })
      .catch((loadError) => {
        setError(handleError(loadError).message);
        setCurrencies([]);
      });
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setIsClosing(false);
      return;
    }

    if (!isMounted) return;

    setIsClosing(true);
    const timer = setTimeout(() => {
      setIsMounted(false);
      setIsClosing(false);
    }, MODAL_EXIT_MS);

    return () => clearTimeout(timer);
  }, [isOpen, isMounted]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        closeModal();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSubmitting]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedValue = Number(value);
    if (!parsedValue || parsedValue <= 0) {
      setError("กรุณาระบุจำนวน point ที่ถูกต้อง");
      return;
    }

    if (!note.trim()) {
      setError("กรุณาระบุเหตุผล");
      return;
    }

    if (!currencyId) {
      setError("กรุณาเลือกประเภท point");
      return;
    }

    setIsSubmitting(true);
    try {
      await adjustUserPoint(user.id, {
        value: parsedValue,
        type: toApiPointType(type),
        note: note.trim(),
        currency_id: currencyId,
      });
      closeModal();
      onSuccess();
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="cursor-pointer rounded-4xl bg-brown-100 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
      >
        ปรับ Point
      </button>

      {isMounted ? (
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
            aria-labelledby="adjust-point-title"
            className={`w-full max-w-lg rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
              isClosing
                ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
                : "animate-dialog-pop-in"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="adjust-point-title"
              className="text-xl font-bold text-defualt-text"
            >
              ปรับ Point
            </h2>
            <p className="mt-1 text-sm text-gray-100">
              {user.display_name} — ต้องระบุเหตุผลทุกครั้ง
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-defualt-text">
                  ประเภท Point
                </label>
                <Select
                  value={currencyId}
                  options={currencyOptions}
                  onChange={setCurrencyId}
                  placeholder="เลือกประเภท Point"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-defualt-text">
                  ประเภทรายการ
                </label>
                <Select
                  value={type}
                  options={typeOptions}
                  onChange={setType}
                  placeholder="เลือกประเภทรายการ"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-defualt-text">
                  จำนวน Point
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brown-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-defualt-text">
                  เหตุผล <span className="text-red-100">*</span>
                </label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  required
                  placeholder="ระบุเหตุผลในการปรับ point"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brown-100"
                />
              </div>

              {error ? (
                <p className="text-sm text-red-100">{error}</p>
              ) : null}

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
      ) : null}
    </>
  );
}
