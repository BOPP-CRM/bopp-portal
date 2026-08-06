"use client";

import SourceBadge from "@/components/sales/SourceBadge";
import { ModalDetailSkeleton } from "@/components/util/Skeleton";
import { getSale, type PortalSale } from "@/services/sales/sales";
import { SALE_STATUS_LABELS, type SaleStatus } from "@/services/sales/types";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { displayValue, formatNumber } from "@/utils/format";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const MODAL_EXIT_MS = 250;

type SaleDetailModalProps = {
  saleId: number;
  onClose: () => void;
};

export function StatusBadge({ status }: { status: SaleStatus }) {
  const styles =
    status === "paid"
      ? "bg-green-50 text-green-700"
      : "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      {SALE_STATUS_LABELS[status]}
    </span>
  );
}

export default function SaleDetailModal({ saleId, onClose }: SaleDetailModalProps) {
  const [sale, setSale] = useState<PortalSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSale = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSale(saleId);
        setSale(data);
      } catch (loadError) {
        setError(handleError(loadError).message);
        setSale(null);
      } finally {
        setLoading(false);
      }
    };

    void loadSale();
  }, [saleId]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, MODAL_EXIT_MS);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4${
        isClosing ? " animate-fade-out" : " animate-fade-in"
      }`}
      onClick={handleClose}
    >
      <div
        className={`flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl md:rounded-2xl${
          isClosing ? " animate-slide-down" : " animate-slide-up"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-defualt-text">
              รายละเอียดการขาย
            </h2>
            {sale && (
              <p className="mt-0.5 text-sm text-gray-100">
                {displayValue(sale.order_number || sale.external_id)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-9 items-center justify-center rounded-lg text-gray-100 hover:bg-gray-100"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {loading ? (
            <ModalDetailSkeleton />
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : sale ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={sale.status} />
                <SourceBadge
                  source={sale.source}
                  label={sale.source_label}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InfoItem label="เลขออเดอร์" value={sale.order_number || sale.external_id} />
                <InfoItem label="วันที่สั่งซื้อ" value={sale.order_date} />
                <InfoItem label="ชื่อลูกค้า" value={sale.customer_name} />
                <InfoItem label="เบอร์โทร" value={sale.customer_phone} />
                <InfoItem label="อีเมล" value={sale.customer_email} />
                <InfoItem label="สถานะชำระเงิน" value={sale.payment_status} />
                <InfoItem label="ยอดรวม" value={formatNumber(sale.amount)} />
                <InfoItem label="ยอดชำระ" value={formatNumber(sale.payment_amount)} />
                <InfoItem label="ส่วนลด" value={formatNumber(sale.discount)} />
                <InfoItem label="VAT" value={formatNumber(sale.vat_amount)} />
                <InfoItem
                  label="อัปเดตล่าสุด"
                  value={sale.last_sync_at ? formatDateTime(sale.last_sync_at) : "-"}
                />
              </div>

              {sale.user && (
                <section className="rounded-xl border border-gray-200 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-defualt-text">
                    สมาชิกที่ผูกกับออเดอร์
                  </h3>
                  <div className="flex items-center gap-3">
                    {sale.user.picture_url && (
                      <img
                        src={sale.user.picture_url}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <Link
                        href={`/dashboard/members/${sale.user.id}`}
                        className="font-medium text-brown-100 hover:underline"
                      >
                        {sale.user.display_name}
                      </Link>
                      <p className="text-xs text-gray-100">
                        {sale.user.phone || sale.user.email || sale.user.line_user_id}
                      </p>
                      {sale.user.tier && (
                        <p className="text-xs text-gray-100">
                          Tier: {sale.user.tier.name}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-3 text-sm font-semibold text-defualt-text">
                  รายการสินค้า
                </h3>
                {sale.lines && sale.lines.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-100">
                        <tr>
                          <th className="px-3 py-2 font-medium">SKU</th>
                          <th className="px-3 py-2 font-medium">สินค้า</th>
                          <th className="px-3 py-2 font-medium text-right">จำนวน</th>
                          <th className="px-3 py-2 font-medium text-right">ราคา/หน่วย</th>
                          <th className="px-3 py-2 font-medium text-right">ส่วนลด</th>
                          <th className="px-3 py-2 font-medium text-right">รวม</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sale.lines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-3 py-2 text-gray-100">
                              {displayValue(line.sku)}
                            </td>
                            <td className="px-3 py-2">{line.name}</td>
                            <td className="px-3 py-2 text-right">
                              {formatNumber(line.quantity)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNumber(line.price_per_unit)}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatNumber(line.discount)}
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {formatNumber(line.total_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-100">ไม่มีรายการสินค้า</p>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number | false | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-gray-100">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-defualt-text">
        {displayValue(value)}
      </p>
    </div>
  );
}
