"use client";

import { ContentSkeleton } from "@/components/util/Skeleton";
import { getPartner } from "@/services/partner/partner";
import type { PartnerAd, PartnerDetail, PartnerUi } from "@/services/partner/types";
import { useApp } from "@/providers/app-provider";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { displayValue, formatNumber } from "@/utils/format";
import { getProxiedImageUrl } from "@/utils/image";
import { buildLiffUrl } from "@/utils/line";
import { Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";

type Tab = "general" | "ui" | "line" | "ads" | "tiers";

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "ทั่วไป" },
  { id: "ui", label: "ธีม UI" },
  { id: "line", label: "LINE" },
  { id: "ads", label: "โฆษณา" },
  { id: "tiers", label: "ระดับสมาชิก" },
];

export default function PartnerPage() {
  const { me } = useApp();
  const [tab, setTab] = useState<Tab>("general");
  const [partner, setPartner] = useState<PartnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPartner = useCallback(async () => {
    const slug = me?.partner.slug;
    if (!slug) {
      setError("ไม่พบข้อมูล Partner");
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await getPartner(slug);
      setPartner(data);
    } catch (loadError) {
      setError(handleError(loadError).message);
      setPartner(null);
    } finally {
      setLoading(false);
    }
  }, [me?.partner.slug]);

  useEffect(() => {
    void loadPartner();
  }, [loadPartner]);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-defualt-text">
          ข้อมูล Partner
        </h1>
        <p className="mt-1 text-sm text-gray-100">
          ดูข้อมูลการตั้งค่าระบบ โปรดติดต่อทีมงานหากต้องการแก้ไขข้อมูล
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`cursor-pointer rounded-4xl px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-brown-100 text-white"
                : "border border-gray-200 bg-white text-defualt-text hover:bg-gray-10"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <ContentSkeleton />
        ) : error ? (
          <div className="p-6 text-sm text-red-100">{error}</div>
        ) : partner ? (
          <>
            {tab === "general" ? <GeneralTab partner={partner} /> : null}
            {tab === "ui" ? <UiTab ui={partner.ui} /> : null}
            {tab === "line" ? <LineTab line={partner.line} /> : null}
            {tab === "ads" ? <AdsTab ads={partner.ads} /> : null}
            {tab === "tiers" ? <TiersTab tiers={partner.tier} /> : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function GeneralTab({ partner }: { partner: PartnerDetail }) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const liffUrl = partner.line.liff_id
    ? buildLiffUrl(partner.line.liff_id)
    : null;
  const logoUrl = getProxiedImageUrl(partner.logo_url);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(`คัดลอก${label}แล้ว`);
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("ไม่สามารถคัดลอกได้");
      setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={partner.name}
            className="size-24 rounded-2xl border border-gray-200 object-contain p-2"
          />
        ) : null}
        <dl className="grid flex-1 gap-4 sm:grid-cols-2">
          <InfoItem label="ชื่อ" value={partner.name} />
          <InfoItem label="Slug" value={partner.slug} />
          <InfoItem label="คำอธิบาย" value={displayValue(partner.description)} />
          <InfoItem
            label="สถานะ"
            value={
              <StatusBadge active={partner.active} activeLabel="ใช้งาน" inactiveLabel="ปิดใช้งาน" />
            }
          />
        </dl>
      </div>

      {liffUrl ? (
        <section className="rounded-2xl border border-gray-200 p-4 md:p-5">
          <h3 className="mb-4 text-sm font-semibold text-defualt-text">
            QR Code LINE LIFF
          </h3>
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <QRCode value={liffUrl} size={176} />
            </div>
            <div className="min-w-0 w-full space-y-3 text-sm">
              <InfoItem label="LIFF ID" value={partner.line.liff_id} />
              <div>
                <p className="text-sm text-gray-100">LIFF URL</p>
                <div className="mt-1 flex min-w-0 items-start gap-2">
                  <code className="min-w-0 flex-1 break-all rounded-lg bg-gray-10 px-3 py-2 text-xs leading-relaxed">
                    {liffUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(liffUrl, " URL ")}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-4xl border border-gray-200 px-3 py-2 text-xs text-defualt-text transition hover:bg-gray-10"
                  >
                    <Copy className="size-3.5" />
                    คัดลอก
                  </button>
                </div>
              </div>
              {copyMessage ? (
                <p className="text-xs text-brown-100">{copyMessage}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function UiTab({ ui }: { ui: PartnerUi }) {
  return (
    <div className="p-6 space-y-6">
      {ui.banner ? (
        <div>
          <p className="mb-2 text-sm text-gray-100">แบนเนอร์</p>
          <img
            src={getProxiedImageUrl(ui.banner) ?? undefined}
            alt="Partner banner"
            className="max-h-48 w-full rounded-2xl border border-gray-200 object-cover"
          />
        </div>
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-2">
        <InfoItem label="ข้อความต้อนรับ" value={ui.welcome_title} />
        <InfoItem
          label="บังคับกรอกเบอร์โทร"
          value={<BooleanBadge value={ui.crm_required_phone} />}
        />
        <InfoItem
          label="บังคับกรอกอีเมล"
          value={<BooleanBadge value={ui.crm_required_email} />}
        />
        <InfoItem
          label="Custom Fields"
          value={<BooleanBadge value={Boolean(ui.ui_custom_fields)} />}
        />
        <InfoItem
          label="ระบบรับประกันสินค้า"
          value={<BooleanBadge value={Boolean(ui.warranty_enabled)} />}
        />
      </dl>

      <div>
        <p className="mb-3 text-sm font-medium text-defualt-text">สีธีม</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ColorItem label="พื้นหลัง" value={ui.background_color} />
          <ColorItem label="พื้นหลัง (ขาว)" value={ui.background_white_color} />
          <ColorItem label="Primary" value={ui.primary_color} />
          <ColorItem label="Secondary" value={ui.secondary_color} />
          <ColorItem label="Surface" value={ui.surface_color} />
          <ColorItem label="ข้อความ" value={ui.text_color} />
          <ColorItem label="ข้อความ (ขาว)" value={ui.text_white_color} />
          <ColorItem label="ข้อความ (เทา)" value={ui.text_gray_color} />
          <ColorItem label="ข้อความ (สำเร็จ)" value={ui.text_success_color} />
          <ColorItem label="ข้อความ (ผิดพลาด)" value={ui.text_error_color} />
          <ColorItem label="ปุ่ม" value={ui.button_color} />
          <ColorItem label="ข้อความปุ่ม" value={ui.button_text_color} />
        </div>
      </div>
    </div>
  );
}

function LineTab({ line }: { line: PartnerDetail["line"] }) {
  return (
    <div className="p-6">
      <dl className="grid gap-4 sm:grid-cols-2">
        <InfoItem label="LIFF ID" value={line.liff_id} />
      </dl>
    </div>
  );
}

function AdsTab({ ads }: { ads: PartnerAd[] }) {
  if (ads.length === 0) {
    return <EmptyState message="ยังไม่มีโฆษณา" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
          <tr>
            <th className="px-4 py-4 font-medium">รูป</th>
            <th className="px-4 py-4 font-medium">หัวข้อ</th>
            <th className="px-4 py-4 font-medium">ข้อความ</th>
            <th className="px-4 py-4 font-medium">Action</th>
            <th className="px-4 py-4 font-medium">เริ่ม</th>
            <th className="px-4 py-4 font-medium">สิ้นสุด</th>
          </tr>
        </thead>
        <tbody>
          {ads.map((ad) => (
            <tr
              key={ad.id}
              className="border-b border-gray-200 last:border-b-0"
            >
              <td className="px-4 py-4">
                <PartnerImage
                  src={ad.image_url}
                  alt={ad.title}
                  className="size-16 rounded-xl border border-gray-200 object-cover"
                />
              </td>
              <td className="px-4 py-4 font-medium text-defualt-text">
                {ad.title}
              </td>
              <td className="max-w-xs px-4 py-4 text-defualt-text">
                <p className="line-clamp-3">{ad.message}</p>
              </td>
              <td className="px-4 py-4 text-defualt-text">
                {displayValue(ad.action)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-gray-100">
                {formatDateTime(ad.start_date)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-gray-100">
                {formatDateTime(ad.end_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TiersTab({ tiers }: { tiers: PartnerDetail["tier"] }) {
  if (tiers.length === 0) {
    return <EmptyState message="ยังไม่มีระดับสมาชิก" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
          <tr>
            <th className="px-4 py-4 font-medium">ระดับ</th>
            <th className="px-4 py-4 font-medium">รหัส</th>
            <th className="px-4 py-4 font-medium">ยอดใช้จ่าย</th>
            <th className="px-4 py-4 font-medium">รูป</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr
              key={tier.code}
              className="border-b border-gray-200 last:border-b-0"
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
              <td className="px-4 py-4">
                {tier.image_url ? (
                  <PartnerImage
                    src={tier.image_url}
                    alt={tier.name}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-100">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm text-gray-100">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-all text-defualt-text">
        {value}
      </dd>
    </div>
  );
}

function ColorItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
      <span
        className="size-8 shrink-0 rounded-lg border border-gray-200"
        style={{ backgroundColor: value }}
      />
      <div className="min-w-0">
        <p className="text-sm text-gray-100">{label}</p>
        <p className="text-sm font-medium text-defualt-text">{value}</p>
      </div>
    </div>
  );
}

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        value
          ? "bg-brown-yellow-5 text-brown-100"
          : "bg-gray-10 text-gray-100"
      }`}
    >
      {value ? "เปิด" : "ปิด"}
    </span>
  );
}

function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-brown-yellow-5 text-brown-100"
          : "bg-gray-10 text-gray-100"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="p-6 text-sm text-gray-100">{message}</div>;
}

function PartnerImage({
  src,
  alt,
  className,
}: {
  src: string | false;
  alt: string;
  className: string;
}) {
  const imageUrl = getProxiedImageUrl(src);
  if (!imageUrl) {
    return <span className="text-gray-100">-</span>;
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
