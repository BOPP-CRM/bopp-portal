"use client";

import { RUN_STATE_LABELS } from "@/components/coupon-distribution/utils";
import { TableSkeleton } from "@/components/util/Skeleton";
import { getDistributionRuns } from "@/services/coupon-distribution/coupon-distribution";
import type { DistributionRun } from "@/services/coupon-distribution/types";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const MODAL_EXIT_MS = 250;
const PAGE_SIZE = 10;

type RuleRunsModalProps = {
  ruleId: number;
  ruleName: string;
  onClose: () => void;
};

export default function RuleRunsModal({
  ruleId,
  ruleName,
  onClose,
}: RuleRunsModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [runs, setRuns] = useState<DistributionRun[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getDistributionRuns(ruleId, {
        limit: PAGE_SIZE,
        offset,
      });
      setRuns(data.runs);
      setTotal(data.total);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [ruleId, offset]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), MODAL_EXIT_MS);
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-300/50 p-4 ${
        isClosing
          ? "opacity-0 transition-opacity duration-250 ease-in"
          : "animate-dialog-backdrop-in"
      }`}
      onClick={closeModal}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rule-runs-title"
        className={`max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)] ${
          isClosing
            ? "opacity-0 scale-95 translate-y-2 transition-all duration-250 ease-in"
            : "animate-dialog-pop-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="rule-runs-title" className="text-xl font-bold text-defualt-text">
          ประวัติการแจก
        </h2>
        <p className="mt-1 text-sm text-gray-100">{ruleName}</p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
          {loading ? (
            <TableSkeleton rows={4} columns={6} />
          ) : error ? (
            <div className="p-6 text-sm text-red-100">{error}</div>
          ) : runs.length === 0 ? (
            <div className="p-6 text-sm text-gray-100">ยังไม่เคยแจก</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-medium">เวลา</th>
                    <th className="px-4 py-3 font-medium">ประเภท</th>
                    <th className="px-4 py-3 font-medium">สถานะ</th>
                    <th className="px-4 py-3 font-medium">เป้าหมาย</th>
                    <th className="px-4 py-3 font-medium">แจกแล้ว</th>
                    <th className="px-4 py-3 font-medium">LINE</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr
                      key={run.id}
                      className="border-b border-gray-200 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-defualt-text">
                        {formatDateTime(run.create_date)}
                      </td>
                      <td className="px-4 py-3 text-defualt-text">
                        {run.source === "rule_auto" ? "อัตโนมัติ" : "กดแจกเอง"}
                      </td>
                      <td className="px-4 py-3 text-defualt-text">
                        {RUN_STATE_LABELS[run.state] ?? run.state}
                        {run.preflight_error || run.last_error ? (
                          <p className="max-w-56 text-xs text-red-100">
                            {run.preflight_error || run.last_error}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-defualt-text">
                        {formatNumber(run.total_recipients)}
                      </td>
                      <td className="px-4 py-3 text-defualt-text">
                        {formatNumber(run.coupon_granted)}
                      </td>
                      <td className="px-4 py-3 text-defualt-text">
                        {formatNumber(run.line_sent)}
                        {run.line_failed ? (
                          <span className="text-red-100">
                            {" "}
                            / ล้มเหลว {formatNumber(run.line_failed)}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!hasPrev || loading}
              onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
              className="cursor-pointer rounded-full border border-gray-200 p-2 text-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="ก่อนหน้า"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
              className="cursor-pointer rounded-full border border-gray-200 p-2 text-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="ถัดไป"
            >
              <ChevronRight className="size-4" />
            </button>
            <span className="text-xs text-gray-100">
              ทั้งหมด {formatNumber(total)} ครั้ง
            </span>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="cursor-pointer rounded-4xl bg-gray-10 px-5 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-10/80"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
