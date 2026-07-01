"use client";

import StatusBadge from "@/components/warranties/StatusBadge";
import ActionMenu from "@/components/util/ActionMenu";
import { TableSkeleton } from "@/components/util/Skeleton";
import {
  createWarrantyContributor,
  createWarrantyProduct,
  createWarrantyStatus,
  deleteWarrantyContributor,
  deleteWarrantyProduct,
  deleteWarrantyStatus,
  getWarrantyConfig,
  updateWarrantyContributor,
  updateWarrantyProduct,
  updateWarrantyStatusConfig,
  type WarrantyContributor,
  type WarrantyProduct,
  type WarrantyStatus,
} from "@/services/warranties/warranties";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { getProxiedImageUrl } from "@/utils/image";
import { readFileAsBase64 } from "@/utils/file";
import { useApp } from "@/providers/app-provider";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

type EditTarget =
  | { type: "product"; item: WarrantyProduct | null }
  | { type: "contributor"; item: WarrantyContributor | null }
  | { type: "status"; item: WarrantyStatus | null }
  | null;

export default function WarrantyConfigPage() {
  const { me } = useApp();
  const [products, setProducts] = useState<WarrantyProduct[]>([]);
  const [contributors, setContributors] = useState<WarrantyContributor[]>([]);
  const [statuses, setStatuses] = useState<WarrantyStatus[]>([]);
  const [warrantyEnabled, setWarrantyEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImageBase64, setProductImageBase64] = useState<string | null>(
    null,
  );
  const [productImagePreview, setProductImagePreview] = useState<string | null>(
    null,
  );
  const [productImageFilename, setProductImageFilename] = useState("");

  const loadConfig = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const config = await getWarrantyConfig();
      setProducts(config.products ?? []);
      setContributors(config.contributors ?? []);
      setStatuses(config.statuses ?? []);
      setWarrantyEnabled(
        config.enabled ?? me?.partner.warranty_enabled ?? false,
      );
    } catch (loadError) {
      setError(handleError(loadError).message);
    } finally {
      setLoading(false);
    }
  }, [me?.partner.warranty_enabled]);

  const openProductModal = (item: WarrantyProduct | null) => {
    setProductImageBase64(null);
    setProductImageFilename("");
    setProductImagePreview(
      item?.image_url ? getProxiedImageUrl(item.image_url) : null,
    );
    setEditTarget({ type: "product", item });
  };

  const closeEditModal = () => {
    if (productImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(productImagePreview);
    }
    setProductImageBase64(null);
    setProductImagePreview(null);
    setProductImageFilename("");
    setEditTarget(null);
  };

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDelete = async (
    type: "product" | "contributor" | "status",
    id: number,
  ) => {
    setError(null);
    try {
      if (type === "product") await deleteWarrantyProduct(id);
      if (type === "contributor") await deleteWarrantyContributor(id);
      if (type === "status") await deleteWarrantyStatus(id);
      await loadConfig();
      showSuccess("ลบรายการสำเร็จ");
    } catch (deleteError) {
      setError(handleError(deleteError).message);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setError(null);

    try {
      if (editTarget.type === "product") {
        const payload = {
          name: String(formData.get("name") || "").trim(),
          description:
            String(formData.get("description") || "").trim() || undefined,
          sku: String(formData.get("sku") || "").trim() || undefined,
          cost_price: Number(formData.get("cost_price") || 0),
          sell_price: Number(formData.get("sell_price") || 0),
          active: formData.get("active") === "on",
          ...(productImageBase64 ? { image_base64: productImageBase64 } : {}),
        };
        if (editTarget.item) {
          await updateWarrantyProduct(editTarget.item.id, payload);
        } else {
          await createWarrantyProduct(payload);
        }
      }

      if (editTarget.type === "contributor") {
        const payload = {
          name: String(formData.get("name") || "").trim(),
          sequence: Number(formData.get("sequence") || 10),
          active: formData.get("active") === "on",
        };
        if (editTarget.item) {
          await updateWarrantyContributor(editTarget.item.id, payload);
        } else {
          await createWarrantyContributor(payload);
        }
      }

      if (editTarget.type === "status") {
        const payload = {
          code: String(formData.get("code") || "").trim(),
          label: String(formData.get("label") || "").trim(),
          sequence: Number(formData.get("sequence") || 10),
          color: String(formData.get("color") || "").trim() || undefined,
          is_default: formData.get("is_default") === "on",
          active: formData.get("active") === "on",
        };
        if (editTarget.item) {
          await updateWarrantyStatusConfig(editTarget.item.id, payload);
        } else {
          await createWarrantyStatus(payload);
        }
      }

      closeEditModal();
      await loadConfig();
      showSuccess("บันทึกข้อมูลสำเร็จ");
    } catch (submitError) {
      setError(handleError(submitError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            จัดการสินค้า ช่องทางการซื้อ และสถานะที่แสดงในระบบ
          </p>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-4 py-3 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl bg-red-100/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <TableSkeleton rows={8} columns={5} />
      ) : (
        <div className="space-y-8">
          <ConfigSection
            title="สินค้า"
            description="รายการสินค้าที่ member เลือกได้ในฟอร์มลงทะเบียน"
            actionLabel="เพิ่มสินค้า"
            onAction={() => openProductModal(null)}
          >
            {products.length === 0 ? (
              <EmptyState text="ยังไม่มีสินค้า" />
            ) : (
              <ConfigTable
                headers={["รูป", "ชื่อ", "SKU", "ราคาทุน", "ราคาขาย", ""]}
                rows={products.map((product) => [
                  <ProductImage
                    key={`product-image-${product.id}`}
                    src={product.image_url}
                    alt={product.name}
                  />,
                  product.name,
                  product.sku || "-",
                  formatNumber(product.cost_price),
                  formatNumber(product.sell_price),
                  <RowActions
                    key={`product-${product.id}`}
                    onEdit={() => openProductModal(product)}
                    onDelete={() => void handleDelete("product", product.id)}
                  />,
                ])}
              />
            )}
          </ConfigSection>

          <ConfigSection
            title="ช่องทางการซื้อ"
            description="ช่องทางที่ member เลือกได้ เช่น ออนไลน์ ร้านค้า ตัวแทนจำหน่าย"
            actionLabel="เพิ่มช่องทาง"
            onAction={() => setEditTarget({ type: "contributor", item: null })}
          >
            {contributors.length === 0 ? (
              <EmptyState text="ยังไม่มีช่องทางการซื้อ" />
            ) : (
              <ConfigTable
                headers={["ชื่อ", "ลำดับ", ""]}
                rows={contributors.map((contributor) => [
                  contributor.name,
                  String(contributor.sequence ?? 10),
                  <RowActions
                    key={`contributor-${contributor.id}`}
                    onEdit={() =>
                      setEditTarget({ type: "contributor", item: contributor })
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
            onAction={() => setEditTarget({ type: "status", item: null })}
          >
            {statuses.length === 0 ? (
              <EmptyState text="ยังไม่มีสถานะ" />
            ) : (
              <ConfigTable
                headers={["Code", "Label", "สถานะ", "Default", ""]}
                rows={statuses.map((status) => [
                  status.code,
                  status.label,
                  <StatusBadge key={`status-${status.id}`} status={status} />,
                  status.is_default ? "ใช่" : "-",
                  <RowActions
                    key={`status-action-${status.id}`}
                    onEdit={() =>
                      setEditTarget({ type: "status", item: status })
                    }
                    onDelete={() => void handleDelete("status", status.id)}
                  />,
                ])}
              />
            )}
          </ConfigSection>
        </div>
      )}

      {editTarget ? (
        <EditModal
          target={editTarget}
          isSubmitting={isSubmitting}
          productImagePreview={productImagePreview}
          productImageFilename={productImageFilename}
          onProductImageChange={async (file) => {
            if (!file) {
              setProductImageBase64(null);
              setProductImageFilename("");
              setProductImagePreview(
                editTarget.type === "product" && editTarget.item?.image_url
                  ? getProxiedImageUrl(editTarget.item.image_url)
                  : null,
              );
              return;
            }

            if (!file.type.startsWith("image/")) {
              setError("กรุณาเลือกไฟล์รูปภาพ");
              return;
            }

            try {
              const base64 = await readFileAsBase64(file);
              setProductImageBase64(base64);
              setProductImageFilename(file.name);
              setProductImagePreview(URL.createObjectURL(file));
              setError(null);
            } catch {
              setError("อ่านไฟล์รูปภาพไม่สำเร็จ");
            }
          }}
          onClose={closeEditModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}

function ConfigSection({
  title,
  description,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div>
          <h2 className="text-lg font-semibold text-defualt-text">{title}</h2>
          <p className="mt-1 text-sm text-gray-100">{description}</p>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
        >
          <Plus className="size-4" />
          {actionLabel}
        </button>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

function ConfigTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
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
              className="border-b border-gray-200 last:border-b-0"
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
        // {
        //   label: "ลบ",
        //   icon: <Trash2 className="size-4" />,
        //   onClick: onDelete,
        // },
      ]}
    />
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-100">{text}</p>;
}

function ProductImage({ src, alt }: { src?: string | false; alt: string }) {
  const imageUrl = getProxiedImageUrl(src);
  if (!imageUrl) {
    return (
      <div className="flex size-12 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-10 text-xs text-gray-100">
        ไม่มีรูป
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="size-12 rounded-xl border border-gray-200 object-cover"
    />
  );
}

function EditModal({
  target,
  isSubmitting,
  productImagePreview,
  productImageFilename,
  onProductImageChange,
  onClose,
  onSubmit,
}: {
  target: Exclude<EditTarget, null>;
  isSubmitting: boolean;
  productImagePreview: string | null;
  productImageFilename: string;
  onProductImageChange: (file: File | null) => void | Promise<void>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const titles = {
    product: target.item ? "แก้ไขสินค้า" : "เพิ่มสินค้า",
    contributor: target.item ? "แก้ไขช่องทาง" : "เพิ่มช่องทาง",
    status: target.item ? "แก้ไขสถานะ" : "เพิ่มสถานะ",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-defualt-text">
          {titles[target.type]}
        </h2>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          {target.type === "product" ? (
            <>
              <FormField label="รูปสินค้า">
                <div className="space-y-3">
                  {productImagePreview ? (
                    <img
                      src={productImagePreview}
                      alt="Product preview"
                      className="max-h-40 rounded-xl border border-gray-200 object-contain"
                    />
                  ) : null}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      void onProductImageChange(event.target.files?.[0] ?? null)
                    }
                    className="block w-full text-sm text-gray-100 file:mr-4 file:rounded-4xl file:border-0 file:bg-brown-yellow-5 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brown-100"
                  />
                  {productImageFilename ? (
                    <p className="text-xs text-gray-100">
                      {productImageFilename}
                    </p>
                  ) : null}
                </div>
              </FormField>
              <FormField label="ชื่อสินค้า *">
                <input
                  name="name"
                  required
                  defaultValue={target.item?.name ?? ""}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="SKU">
                <input
                  name="sku"
                  defaultValue={target.item?.sku ? String(target.item.sku) : ""}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="รายละเอียด">
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={
                    target.item?.description
                      ? String(target.item.description)
                      : ""
                  }
                  className={`${inputClassName} resize-none`}
                />
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="ราคาทุน">
                  <input
                    name="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={target.item?.cost_price ?? 0}
                    className={inputClassName}
                  />
                </FormField>
                <FormField label="ราคาขาย">
                  <input
                    name="sell_price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={target.item?.sell_price ?? 0}
                    className={inputClassName}
                  />
                </FormField>
              </div>
              <label className="flex items-center gap-2 text-sm text-defualt-text">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={target.item?.active ?? true}
                />
                เปิดใช้งาน
              </label>
            </>
          ) : null}

          {target.type === "contributor" ? (
            <>
              <FormField label="ชื่อช่องทาง *">
                <input
                  name="name"
                  required
                  defaultValue={target.item?.name ?? ""}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="ลำดับ">
                <input
                  name="sequence"
                  type="number"
                  defaultValue={target.item?.sequence ?? 10}
                  className={inputClassName}
                />
              </FormField>
              <label className="flex items-center gap-2 text-sm text-defualt-text">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={target.item?.active ?? true}
                />
                เปิดใช้งาน
              </label>
            </>
          ) : null}

          {target.type === "status" ? (
            <>
              <FormField label="Code *">
                <input
                  name="code"
                  required
                  defaultValue={target.item?.code ?? ""}
                  className={inputClassName}
                  placeholder="pending"
                />
              </FormField>
              <FormField label="Label *">
                <input
                  name="label"
                  required
                  defaultValue={target.item?.label ?? ""}
                  className={inputClassName}
                  placeholder="รอตรวจสอบ"
                />
              </FormField>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="ลำดับ">
                  <input
                    name="sequence"
                    type="number"
                    defaultValue={target.item?.sequence ?? 10}
                    className={inputClassName}
                  />
                </FormField>
                <FormField label="สี (Hex)">
                  <input
                    name="color"
                    defaultValue={
                      target.item?.color ? String(target.item.color) : ""
                    }
                    className={inputClassName}
                    placeholder="#FFC107"
                  />
                </FormField>
              </div>
              <label className="flex items-center gap-2 text-sm text-defualt-text">
                <input
                  type="checkbox"
                  name="is_default"
                  defaultChecked={target.item?.is_default ?? false}
                />
                สถานะเริ่มต้นเมื่อ member ส่งฟอร์ม
              </label>
              <label className="flex items-center gap-2 text-sm text-defualt-text">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={target.item?.active ?? true}
                />
                เปิดใช้งาน
              </label>
            </>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full cursor-pointer rounded-4xl bg-gray-10 px-4 py-2.5 text-sm font-medium text-gray-100"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer rounded-4xl bg-brown-100 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-defualt-text">
        {label}
      </label>
      {children}
    </div>
  );
}
