"use client";

import { compactTableClassName } from "@/components/util/data-table";
import { TableSkeleton } from "@/components/util/Skeleton";
import { getTiers } from "@/services/tiers/tiers";
import type { PortalTier } from "@/services/tiers/types";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { Gift, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function TiersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tiers, setTiers] = useState<PortalTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTiers = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await getTiers();
      setTiers(data);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setTiers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTiers();
  }, [loadTiers]);

  useEffect(() => {
    if (searchParams.get("saved") !== "1") return;
    setSuccessMessage("บันทึกระดับสมาชิกสำเร็จ");
    router.replace("/dashboard/tier");
  }, [router, searchParams]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  return (
    <div className="p-3 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            ระดับสมาชิก
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            จัดการเงื่อนไขและการแสดงผลของแต่ละระดับ
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/tier/join-rewards")}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl border border-brown-100 px-3.5 py-1.5 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5"
          >
            <Gift className="size-4" />
            รางวัลสมาชิกใหม่
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/tier/new")}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
          >
            <Plus className="size-4" />
            เพิ่มระดับ
          </button>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-3 py-2 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : error ? (
          <div className="p-6 text-sm text-red-100">{error}</div>
        ) : tiers.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ยังไม่มีระดับสมาชิก</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full text-left ${compactTableClassName}`}>
              <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                <tr>
                  <th className="px-4 py-4 font-medium">ระดับ</th>
                  <th className="px-4 py-4 font-medium">รหัส</th>
                  <th className="px-4 py-4 font-medium">ยอดใช้จ่าย</th>
                  <th className="px-4 py-4 font-medium">แปลง Point</th>
                  <th className="px-4 py-4 font-medium">รางวัล</th>
                  <th className="px-4 py-4 font-medium">แสดงใน UI</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr
                    key={tier.id}
                    onClick={() => router.push(`/dashboard/tier/${tier.id}`)}
                    className="cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 hover:bg-gray-10"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="size-4 rounded-full border border-gray-200"
                          style={{ backgroundColor: tier.color }}
                        />
                        <span className="font-medium text-defualt-text">
                          {tier.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-defualt-text">{tier.code}</td>
                    <td className="px-4 py-4 text-defualt-text">
                      {formatNumber(tier.min_spending)} -{" "}
                      {formatNumber(tier.max_spending)}
                    </td>
                    <td className="px-4 py-4 text-brown-100">
                      {formatNumber(tier.convert_points)}
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {formatNumber(tier.rewards?.length ?? 0)} รายการ
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          tier.is_show_in_ui
                            ? "bg-brown-yellow-5 text-brown-100"
                            : "bg-gray-10 text-gray-100"
                        }`}
                      >
                        {tier.is_show_in_ui ? "แสดง" : "ซ่อน"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
