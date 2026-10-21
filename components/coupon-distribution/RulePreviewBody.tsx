import { GENDER_LABELS } from "@/components/coupon-distribution/utils";
import type { DistributionPreviewResponse } from "@/services/coupon-distribution/types";
import { formatNumber } from "@/utils/format";

export default function RulePreviewBody({
  preview,
}: {
  preview: DistributionPreviewResponse;
}) {
  return (
    <div className="space-y-3 text-left text-sm text-defualt-text">
      <p>
        สมาชิกที่เข้าเงื่อนไขและยังไม่เคยได้รับ:{" "}
        <span className="font-semibold">{formatNumber(preview.count)}</span> คน
      </p>
      {preview.coupon_pool ? (
        <p
          className={
            preview.coupon_pool.sufficient ? "text-gray-100" : "text-red-100"
          }
        >
          โค้ดคงเหลือ {formatNumber(preview.coupon_pool.available)} ใบ
          {preview.coupon_pool.sufficient ? "" : " (ไม่พอ กรุณาเพิ่มโค้ดก่อนแจก)"}
        </p>
      ) : null}
      {preview.sample.length > 0 ? (
        <ul className="max-h-48 divide-y divide-gray-200 overflow-y-auto rounded-xl border border-gray-200">
          {preview.sample.map((user) => (
            <li key={user.id} className="flex justify-between px-3 py-2">
              <span>{user.display_name}</span>
              <span className="text-gray-100">
                {user.gender ? GENDER_LABELS[user.gender] : "-"}
                {user.tier ? ` • ${user.tier}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {preview.count > preview.sample.length ? (
        <p className="text-xs text-gray-100">
          แสดงตัวอย่าง {preview.sample.length} คนแรก
        </p>
      ) : null}
    </div>
  );
}
