"use client";

import AiSyncConfirmDialog, {
  useAiSyncGate,
} from "@/components/sales/AiSyncConfirmDialog";
import MemberAvatar from "@/components/members/MemberAvatar";
import SourceBadge from "@/components/sales/SourceBadge";
import { ModalDetailSkeleton } from "@/components/util/Skeleton";
import {
  AI_SALE_REGENERATE_DESCRIPTION,
  AI_SALE_REGENERATE_TITLE,
} from "@/services/openai/types";
import { getSale, getReceiptSaleSyncStatus, regenerateSaleWithAi, type PortalSale } from "@/services/sales/sales";
import { SALE_STATUS_LABELS, type SaleStatus } from "@/services/sales/types";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { displayValue, formatNumber } from "@/utils/format";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type SaleDetailPageProps = {
  saleId: number;
};

export function StatusBadge({
  status,
  className = "",
}: {
  status: SaleStatus;
  className?: string;
}) {
  const styles =
    status === "paid"
      ? "bg-brown-yellow-5 text-brown-100"
      : "bg-red-100/10 text-red-100";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${styles} ${className}`}
    >
      {SALE_STATUS_LABELS[status]}
    </span>
  );
}

export default function SaleDetailModal({ saleId }: SaleDetailPageProps) {
  const [sale, setSale] = useState<PortalSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAiConfigured, setOpenAiConfigured] = useState<boolean | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { requireOpenAiConfigured } = useAiSyncGate(openAiConfigured);

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

  useEffect(() => {
    void loadSale();
  }, [saleId]);

  useEffect(() => {
    void getReceiptSaleSyncStatus()
      .then((status) => setOpenAiConfigured(status.openai_configured))
      .catch(() => setOpenAiConfigured(false));
  }, []);

  const handleRequestRegenerate = () => {
    requireOpenAiConfigured(() => setShowRegenerateConfirm(true));
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const response = await regenerateSaleWithAi(saleId, true);
      setSale(response.sale);
      setShowRegenerateConfirm(false);
    } catch (regenerateError) {
      setError(handleError(regenerateError).message);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
    <div className="p-3 md:p-5">
      <Link
        href="/dashboard/sales"
        className="mb-3 inline-flex items-center gap-1 text-sm text-gray-100 hover:text-brown-100"
      >
        <ArrowLeft className="size-4" />
        กลับไปรายการขาย
      </Link>
      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-defualt-text">
              รายละเอียดการขาย
            </h2>
            {sale ? (
              <p className="mt-0.5 truncate text-sm text-gray-100">
                {displayValue(sale.order_number || sale.external_id)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {loading ? (
            <ModalDetailSkeleton />
          ) : error ? (
            <div className="rounded-xl bg-red-100/10 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          ) : sale ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={sale.status} />
                <SourceBadge source={sale.source} label={sale.source_label} />
                {sale.ai_generated ? (
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                    AI
                  </span>
                ) : null}
              </div>

              {sale.can_regenerate_ai ? (
                <div>
                  <button
                    type="button"
                    onClick={handleRequestRegenerate}
                    disabled={isRegenerating}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-defualt-text hover:bg-gray-10 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`size-4${isRegenerating ? " animate-spin" : ""}`}
                    />
                    สร้างข้อมูลจาก AI ใหม่
                  </button>
                  {sale.ai_generated_at ? (
                    <p className="mt-2 text-xs text-gray-100">
                      สร้างด้วย AI ล่าสุด: {formatDateTime(sale.ai_generated_at)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <Section title="ข้อมูลออเดอร์">
                <dl className="grid gap-4 text-sm md:grid-cols-2">
                  <DetailItem
                    label="เลขออเดอร์"
                    value={displayValue(sale.order_number || sale.external_id)}
                  />
                  <DetailItem
                    label="วันที่สั่งซื้อ"
                    value={displayValue(sale.order_date)}
                  />
                  <DetailItem
                    label="ชื่อลูกค้า"
                    value={displayValue(sale.customer_name)}
                  />
                  <DetailItem
                    label="เบอร์โทร"
                    value={displayValue(sale.customer_phone)}
                  />
                  <DetailItem
                    label="อีเมล"
                    value={displayValue(sale.customer_email)}
                  />
                  <DetailItem
                    label="สถานะชำระเงิน"
                    value={displayValue(sale.payment_status)}
                  />
                  <DetailItem
                    label="อัปเดตล่าสุด"
                    value={
                      sale.last_sync_at
                        ? formatDateTime(sale.last_sync_at)
                        : "-"
                    }
                  />
                </dl>
              </Section>

              <Section title="ยอดเงิน">
                <dl className="grid gap-4 text-sm md:grid-cols-2">
                  <DetailItem
                    label="ยอดรวม"
                    value={formatNumber(sale.amount)}
                    valueClassName="text-brown-100"
                  />
                  <DetailItem
                    label="ยอดชำระ"
                    value={formatNumber(sale.payment_amount)}
                  />
                  <DetailItem
                    label="ส่วนลด"
                    value={formatNumber(sale.discount)}
                  />
                  <DetailItem
                    label="VAT"
                    value={formatNumber(sale.vat_amount)}
                  />
                </dl>
              </Section>

              {sale.user ? (
                <Section title="สมาชิกที่ผูกกับออเดอร์">
                  <div className="flex items-center gap-3">
                    <MemberAvatar
                      name={sale.user.display_name}
                      pictureUrl={sale.user.picture_url}
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/members/${sale.user.id}`}
                        className="font-medium text-defualt-text hover:text-brown-100"
                      >
                        {sale.user.display_name}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-gray-100">
                        {displayValue(
                          sale.user.phone ||
                            sale.user.email ||
                            sale.user.line_user_id,
                        )}
                      </p>
                      {sale.user.tier ? (
                        <span className="mt-2 inline-block rounded-full bg-brown-yellow-5 px-3 py-1 text-xs font-medium text-brown-100">
                          {sale.user.tier.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Section>
              ) : null}

              <Section title="รายการสินค้า">
                {sale.lines && sale.lines.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-gray-200 bg-gray-10 text-xs text-gray-100">
                        <tr>
                          <th className="px-3 py-2.5 font-medium">SKU</th>
                          <th className="px-3 py-2.5 font-medium">สินค้า</th>
                          <th className="px-3 py-2.5 font-medium text-right">
                            จำนวน
                          </th>
                          <th className="px-3 py-2.5 font-medium text-right">
                            ราคา/หน่วย
                          </th>
                          <th className="px-3 py-2.5 font-medium text-right">
                            ส่วนลด
                          </th>
                          <th className="px-3 py-2.5 font-medium text-right">
                            รวม
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.lines.map((line) => (
                          <tr
                            key={line.id}
                            className="border-b border-gray-200 last:border-b-0"
                          >
                            <td className="px-3 py-3 text-gray-100">
                              {displayValue(line.sku)}
                            </td>
                            <td className="px-3 py-3 text-defualt-text">
                              {line.name}
                            </td>
                            <td className="px-3 py-3 text-right text-defualt-text">
                              {formatNumber(line.quantity)}
                            </td>
                            <td className="px-3 py-3 text-right text-defualt-text">
                              {formatNumber(line.price_per_unit)}
                            </td>
                            <td className="px-3 py-3 text-right text-defualt-text">
                              {formatNumber(line.discount)}
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-brown-100">
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
              </Section>
            </div>
          ) : null}
        </div>
      </div>
    </div>

    <AiSyncConfirmDialog
      open={showRegenerateConfirm}
      title={AI_SALE_REGENERATE_TITLE}
      description={AI_SALE_REGENERATE_DESCRIPTION}
      onClose={() => setShowRegenerateConfirm(false)}
      onConfirm={() => void handleRegenerate()}
      loading={isRegenerating}
      confirmText="สร้างใหม่"
    />
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
      <h3 className="mb-4 text-sm font-semibold text-defualt-text">{title}</h3>
      {children}
    </section>
  );
}

function DetailItem({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <dt className="text-gray-100">{label}</dt>
      <dd
        className={`mt-0.5 font-medium break-all text-defualt-text ${valueClassName ?? ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
