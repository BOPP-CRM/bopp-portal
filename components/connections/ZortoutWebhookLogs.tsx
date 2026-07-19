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
    <section className="border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-defualt-text">
          ประวัติ Webhook
        </h3>
        <p className="text-xs text-gray-100">{formatNumber(total)} รายการ</p>
      </div>

      {loading ? (
        <div className="mt-4">
          <TableSkeleton rows={5} columns={5} cellClassName="px-3 py-3" />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-red-100">{error}</p>
      ) : logs.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-10/40 px-4 py-8 text-center text-sm text-gray-100">
          ยังไม่มี webhook logs
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-3 md:hidden">
            {logs.map((log) => (
              <LogCard key={log.id} log={log} />
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-100">
                <tr>
                  <th className="px-3 py-2.5 font-medium whitespace-nowrap">
                    เวลา
                  </th>
                  <th className="px-3 py-2.5 font-medium">ออเดอร์</th>
                  <th className="px-3 py-2.5 font-medium">ลูกค้า</th>
                  <th className="px-3 py-2.5 font-medium">คะแนน</th>
                  <th className="px-3 py-2.5 font-medium">ผลลัพธ์</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-gray-100">
                      <div>{formatDateTime(log.received_at)}</div>
                      <div className="text-xs">
                        {displayValue(log.method)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-defualt-text">
                      <div className="font-medium">
                        {displayValue(log.order_number)}
                      </div>
                      <div className="text-xs text-gray-100">
                        {formatNumber(log.amount)} บาท
                        {log.payment_status
                          ? ` · ${displayValue(log.payment_status)}`
                          : ""}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-defualt-text">
                      <CustomerCell log={log} />
                    </td>
                    <td className="px-3 py-3 text-defualt-text">
                      {log.points_awarded ? (
                        <span className="font-medium text-green-700">
                          +{formatNumber(log.reward_points)}
                        </span>
                      ) : log.points_revoked && log.reward_points > 0 ? (
                        <span className="font-medium text-red-100">
                          -{formatNumber(log.reward_points)}
                        </span>
                      ) : (
                        <span className="text-gray-100">-</span>
                      )}
                    </td>
                    <td className="max-w-xs px-3 py-3">
                      <LogStatusBadge log={log} />
                      {log.message ? (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-100">
                          {displayValue(log.message)}
                        </p>
                      ) : null}
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
                onClick={() =>
                  setOffset((prev) => Math.max(prev - PAGE_SIZE, 0))
                }
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

function CustomerCell({ log }: { log: ZortoutWebhookLog }) {
  if (log.member) {
    return (
      <>
        <div>{log.member.display_name}</div>
        <div className="text-xs text-gray-100">
          {displayValue(log.member.phone || log.member.email || "-")}
        </div>
      </>
    );
  }

  return (
    <>
      <div>{displayValue(log.customer_name)}</div>
      <div className="text-xs text-gray-100">
        {displayValue(log.customer_phone || log.customer_email || "-")}
      </div>
    </>
  );
}

function LogCard({ log }: { log: ZortoutWebhookLog }) {
  return (
    <article className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-defualt-text">
            {displayValue(log.order_number)}
          </p>
          <p className="mt-0.5 text-xs text-gray-100">
            {formatDateTime(log.received_at)}
            {log.method ? ` · ${displayValue(log.method)}` : ""}
          </p>
        </div>
        <LogStatusBadge log={log} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-gray-100">ลูกค้า</dt>
          <dd className="mt-0.5 text-defualt-text">
            <CustomerCell log={log} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-100">ยอด / คะแนน</dt>
          <dd className="mt-0.5 text-defualt-text">
            {formatNumber(log.amount)} บาท
            {log.points_awarded ? (
              <span className="ml-1 font-medium text-green-700">
                (+{formatNumber(log.reward_points)})
              </span>
            ) : log.points_revoked && log.reward_points > 0 ? (
              <span className="ml-1 font-medium text-red-100">
                (-{formatNumber(log.reward_points)})
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      {log.message ? (
        <p className="mt-3 line-clamp-2 text-xs text-gray-100">
          {displayValue(log.message)}
        </p>
      ) : null}
    </article>
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
        ได้คะแนน
      </span>
    );
  }

  if (log.points_revoked) {
    return (
      <span className="inline-block rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-100">
        ลดคะแนน
      </span>
    );
  }

  if (log.warning || log.message) {
    return (
      <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
        เตือน
      </span>
    );
  }

  return (
    <span className="inline-block rounded-full bg-gray-10 px-2.5 py-1 text-xs font-medium text-gray-100">
      รับแล้ว
    </span>
  );
}
