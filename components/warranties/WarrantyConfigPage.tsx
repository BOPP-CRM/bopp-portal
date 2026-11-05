"use client";

import StatusBadge from "@/components/warranties/StatusBadge";
import ActionMenu from "@/components/util/ActionMenu";
import { compactTableClassName } from "@/components/util/data-table";
import TableExport from "@/components/util/TableExport";
import { TableSkeleton } from "@/components/util/Skeleton";
import {
  deleteWarrantyContributor,
  deleteWarrantyStatus,
  getWarrantyConfig,
  type WarrantyContributor,
  type WarrantyStatus,
} from "@/services/warranties/warranties";
import { handleError } from "@/utils/errors";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function WarrantyConfigPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contributors, setContributors] = useState<WarrantyContributor[]>([]);
  const [statuses, setStatuses] = useState<WarrantyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const config = await getWarrantyConfig();
      setContributors(config.contributors ?? []);
      setStatuses(config.statuses ?? []);
    } catch (loadError) {
      setError(handleError(loadError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (searchParams.get("saved") !== "1") return;
    setSuccessMessage("บันทึกข้อมูลสำเร็จ");
    router.replace("/dashboard/warranties/config");
  }, [router, searchParams]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = async (type: "contributor" | "status", id: number) => {
    setError(null);
    try {
      if (type === "contributor") await deleteWarrantyContributor(id);
      if (type === "status") await deleteWarrantyStatus(id);
      await loadConfig();
      showSuccess("ลบรายการสำเร็จ");
    } catch (deleteError) {
      setError(handleError(deleteError).message);
    }
  };

  return (
    <div className="p-3 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/dashboard/warranties"
            className="mb-3 inline-flex items-center gap-2 text-sm text-brown-100 hover:underline"
          >
            <ArrowLeft className="size-4" />
            กลับไปรายการรับประกัน
          </Link>
          <h1 className="text-2xl font-semibold text-defualt-text">
            ตั้งค่ารับประกันสินค้า
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            จัดการช่องทางการซื้อและสถานะที่แสดงในระบบ
          </p>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-3 py-2 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl bg-red-100/10 px-3 py-2 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <TableSkeleton rows={8} columns={5} />
      ) : (
        <div className="space-y-8">
          <ConfigSection
            title="ช่องทางการซื้อ"
            description="ช่องทางที่ member เลือกได้ เช่น ออนไลน์ ร้านค้า ตัวแทนจำหน่าย"
            actionLabel="เพิ่มช่องทาง"
            onAction={() =>
              router.push("/dashboard/warranties/config/contributor/new")
            }
            extra={
              <TableExport
                filename="warranty-contributors"
                columns={[
                  { id: "name", label: "ชื่อ", value: (item) => item.name },
                  { id: "sequence", label: "ลำดับ", value: (item) => item.sequence ?? 10 },
                  { id: "active", label: "สถานะ", value: (item) => (item.active === false ? "ปิด" : "ใช้งาน") },
                ]}
                loadRows={async () => contributors}
              />
            }
          >
            {contributors.length === 0 ? (
              <EmptyState text="ยังไม่มีช่องทางการซื้อ" />
            ) : (
              <ConfigTable
                headers={["ชื่อ", "ลำดับ", ""]}
                onRowClick={(index) =>
                  router.push(
                    `/dashboard/warranties/config/contributor/${contributors[index].id}`,
                  )
                }
                rows={contributors.map((contributor) => [
                  contributor.name,
                  String(contributor.sequence ?? 10),
                  <RowActions
                    key={`contributor-${contributor.id}`}
                    onEdit={() =>
                      router.push(
                        `/dashboard/warranties/config/contributor/${contributor.id}`,
                      )
                    }
                    onDelete={() =>
                      void handleDelete("contributor", contributor.id)
                    }
                  />,
                ])}
              />
            )}
          </ConfigSection>

          <ConfigSection
            title="สถานะ"
            description="กำหนด label สถานะที่แสดงใน portal และแอปสมาชิก"
            actionLabel="เพิ่มสถานะ"
            onAction={() =>
              router.push("/dashboard/warranties/config/status/new")
            }
            extra={
              <TableExport
                filename="warranty-statuses"
                columns={[
                  { id: "code", label: "Code", value: (item) => item.code },
                  { id: "label", label: "Label", value: (item) => item.label },
                  { id: "active", label: "สถานะ", value: (item) => (item.active === false ? "ปิด" : "ใช้งาน") },
                  { id: "default", label: "Default", value: (item) => (item.is_default ? "ใช่" : "ไม่") },
                  { id: "sequence", label: "ลำดับ", value: (item) => item.sequence ?? 10 },
                  { id: "color", label: "สี", value: (item) => item.color || "" },
                ]}
                loadRows={async () => statuses}
              />
            }
          >
            {statuses.length === 0 ? (
              <EmptyState text="ยังไม่มีสถานะ" />
            ) : (
              <ConfigTable
                headers={["Code", "Label", "สถานะ", "Default", ""]}
                onRowClick={(index) =>
                  router.push(
                    `/dashboard/warranties/config/status/${statuses[index].id}`,
                  )
                }
                rows={statuses.map((status) => [
                  status.code,
                  status.label,
                  <StatusBadge key={`status-${status.id}`} status={status} />,
                  status.is_default ? "ใช่" : "-",
                  <RowActions
                    key={`status-action-${status.id}`}
                    onEdit={() =>
                      router.push(
                        `/dashboard/warranties/config/status/${status.id}`,
                      )
                    }
                    onDelete={() => void handleDelete("status", status.id)}
                  />,
                ])}
              />
            )}
          </ConfigSection>
        </div>
      )}
    </div>
  );
}

function ConfigSection({
  title,
  description,
  actionLabel,
  onAction,
  extra,
  children,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div>
          <h2 className="text-lg font-semibold text-defualt-text">{title}</h2>
          <p className="mt-1 text-sm text-gray-100">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {extra}
          <button
          type="button"
          onClick={onAction}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-3 py-2 text-sm font-medium text-white transition hover:bg-brown-100/80"
        >
          <Plus className="size-4" />
          {actionLabel}
        </button>
        </div>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function ConfigTable({
  headers,
  rows,
  onRowClick,
}: {
  headers: string[];
  rows: React.ReactNode[][];
  onRowClick?: (index: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full text-left ${compactTableClassName}`}>
        <thead className="border-b border-gray-200 text-gray-100">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              onClick={onRowClick ? () => onRowClick(index) : undefined}
              className={`border-b border-gray-200 last:border-b-0 ${
                onRowClick
                  ? "cursor-pointer transition-colors hover:bg-gray-10"
                  : ""
              }`}
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-3 text-defualt-text">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <ActionMenu
      ariaLabel="จัดการรายการ"
      items={[
        {
          label: "แก้ไข",
          icon: <Pencil className="size-4" />,
          onClick: onEdit,
        },
      ]}
    />
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-100">{text}</p>;
}
