"use client";

import { Download, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const THAI_TIMEZONE = "Asia/Bangkok";

type SalesExportModalProps = {
  open: boolean;
  loading?: boolean;
  onConfirm: (year: number, month: number) => void;
  onClose: () => void;
};

function getCurrentMonthValue(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: THAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  return `${year}-${month}`;
}

function parseMonthValue(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

function formatMonthLabel(value: string) {
  const parsed = parseMonthValue(value);
  if (!parsed) return value;

  const date = new Date(parsed.year, parsed.month - 1, 1);
  return new Intl.DateTimeFormat("th-TH", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function SalesExportModal({
  open,
  loading = false,
  onConfirm,
  onClose,
}: SalesExportModalProps) {
  const [monthValue, setMonthValue] = useState(getCurrentMonthValue());

  useEffect(() => {
    if (open) {
      setMonthValue(getCurrentMonthValue());
    }
  }, [open]);

  const monthLabel = useMemo(() => formatMonthLabel(monthValue), [monthValue]);

  if (!open) {
    return null;
  }

  const handleConfirm = () => {
    const parsed = parseMonthValue(monthValue);
    if (!parsed) return;
    onConfirm(parsed.year, parsed.month);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-300/50 p-4 animate-dialog-backdrop-in"
      onClick={loading ? undefined : onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sales-export-title"
        className="w-full max-w-lg rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] animate-dialog-pop-in"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-brown-yellow-5 text-brown-100">
            <Download className="size-6" />
          </div>
          <h2
            id="sales-export-title"
            className="mt-4 text-xl font-bold text-defualt-text"
          >
            Export รายการขาย
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-100">
            เลือกเดือนที่ต้องการ export ระบบจะสร้างไฟล์ Excel ที่มี 2 แท็บ
            คือ order และ order line พร้อมข้อมูลสมาชิก
          </p>
        </div>

        <div className="mt-5">
          <label
            htmlFor="sales-export-month"
            className="mb-2 block text-sm font-medium text-defualt-text"
          >
            เดือนที่ต้องการ export
          </label>
          <input
            id="sales-export-month"
            type="month"
            value={monthValue}
            onChange={(event) => setMonthValue(event.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-2 text-xs text-gray-100">
            จะ export รายการขายทั้งหมดในเดือน {monthLabel}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-4xl bg-gray-10 px-4 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !parseMonthValue(monthValue)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-4xl bg-brown-100 px-4 py-2 text-sm font-medium text-white transition hover:bg-brown-100/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {loading ? "กำลัง export..." : "Export Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}
