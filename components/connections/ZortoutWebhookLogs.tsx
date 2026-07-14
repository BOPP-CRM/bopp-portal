"use client";

import { getZortoutWebhookLogs } from "@/services/zortout/zortout";
import type { ZortoutWebhookLog } from "@/services/zortout/types";
import { TableSkeleton } from "@/components/util/Skeleton";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { displayValue, formatNumber } from "@/utils/format";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 20;

export default function ZortoutWebhookLogs() {
  const [logs, setLogs] = useState<ZortoutWebhookLog[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getZortoutWebhookLogs({
        limit: PAGE_SIZE,
        offset,
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canGoPrev = offset > 0;
  const canGoNext = offset + PAGE_SIZE < total;

  return (
    <section className="rounded-2xl border border-gray-200 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-defualt-text">Webhook Logs</h3>
          <p className="mt-1 text-xs text-gray-100">
            ประวัติ webhook ที่ ZORT ส่งเข้ามา
          </p>
        </div>
        <p className="text-xs text-gray-100">
          ทั้งหมด {formatNumber(total)} รายการ
        </p>
      </div>

      {loading ? (
        <div className="mt-4">
          <TableSkeleton rows={5} />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-red-100">{error}</p>
      ) : logs.length === 0 ? (
        <p className="mt-4 text-sm text-gray-100">ยังไม่มี webhook logs</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                <tr>
                  <th className="px-3 py-3 font-medium whitespace-nowrap">
                    เวลา
                  </th>
                  <th className="px-3 py-3 font-medium">Method</th>
                  <th className="px-3 py-3 font-medium">ออเดอร์</th>
                  <th className="px-3 py-3 font-medium">ลูกค้า</th>
                  <th className="px-3 py-3 font-medium">การชำระ</th>
                  <th className="px-3 py-3 font-medium">คะแนน</th>
                  <th className="px-3 py-3 font-medium">สถานะ</th>
                  <th className="px-3 py-3 font-medium">ข้อความ</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-gray-100">
                      {formatDateTime(log.received_at)}
                    </td>
                    <td className="px-3 py-3 font-medium text-defualt-text">
                      {displayValue(log.method)}
                    </td>
                    <td className="px-3 py-3 text-defualt-text">
                      <div>{displayValue(log.order_number)}</div>
                      <div className="text-xs text-gray-100">
                        {formatNumber(log.amount)} บาท
                      </div>
                    </td>
                    <td className="px-3 py-3 text-defualt-text">
                      {log.member ? (
                        <>
                          <div>{log.member.display_name}</div>
                          <div className="text-xs text-gray-100">
                            {displayValue(
                              log.member.phone || log.member.email || "-",
                            )}
                          </div>
                        </>
                      ) : (
                        <div>
                          <div>{displayValue(log.customer_name)}</div>
                          <div className="text-xs text-gray-100">
                            {displayValue(
                              log.customer_phone || log.customer_email || "-",
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-defualt-text">
                      {displayValue(log.payment_status)}
                    </td>
                    <td className="px-3 py-3 text-defualt-text">
                      {log.points_awarded ? (
                        <span className="text-green-700">
                          +{formatNumber(log.reward_points)}
                        </span>
                      ) : (
                        <span className="text-gray-100">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <LogStatusBadge log={log} />
                    </td>
                    <td className="max-w-xs px-3 py-3 text-xs text-gray-100">
                      <p className="line-clamp-2">{displayValue(log.message)}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-100">
              หน้า {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => setOffset((prev) => Math.max(prev - PAGE_SIZE, 0))}
                className="inline-flex cursor-pointer items-center gap-1 rounded-4xl border border-gray-200 px-3 py-2 text-xs font-medium text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="size-4" />
                ก่อนหน้า
              </button>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-4xl border border-gray-200 px-3 py-2 text-xs font-medium text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function LogStatusBadge({ log }: { log: ZortoutWebhookLog }) {
  if (log.http_status >= 500 || log.result_status === "error") {
    return (
      <span className="inline-block rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-100">
        Error
      </span>
    );
  }

  if (log.http_status === 401 || log.result_status === "unauthorized") {
    return (
      <span className="inline-block rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-100">
        Unauthorized
      </span>
    );
  }

  if (log.http_status >= 400) {
    return (
      <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        Failed
      </span>
    );
  }

  if (log.points_awarded) {
    return (
      <span className="inline-block rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
        Points Added
      </span>
    );
  }

  if (log.warning || log.message) {
    return (
      <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        Warning
      </span>
    );
  }

  return (
    <span className="inline-block rounded-full bg-gray-10 px-2.5 py-1 text-xs font-medium text-gray-100">
      Received
    </span>
  );
}
