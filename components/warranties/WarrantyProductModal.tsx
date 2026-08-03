"use client";

import { readFileAsBase64 } from "@/utils/file";
import { getProxiedImageUrl } from "@/utils/image";
import type { WarrantyProduct } from "@/services/warranties/types";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

export type WarrantyProductFormPayload = {
  name: string;
  description?: string;
  sku?: string;
  cost_price: number;
  sell_price: number;
  active: boolean;
  image_base64?: string;
  sn_patterns: string[];
};

type WarrantyProductModalProps = {
  product: WarrantyProduct | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: WarrantyProductFormPayload) => Promise<void>;
};

export default function WarrantyProductModal({
  product,
  isSubmitting,
  onClose,
  onSubmit,
}: WarrantyProductModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [productImageBase64, setProductImageBase64] = useState<string | null>(
    null,
  );
  const [productImagePreview, setProductImagePreview] = useState<string | null>(
    null,
  );
  const [productImageFilename, setProductImageFilename] = useState("");
  const [snPatterns, setSnPatterns] = useState<string[]>([""]);

  useEffect(() => {
    setProductImageBase64(null);
    setProductImageFilename("");
    setProductImagePreview(
      product?.image_url ? getProxiedImageUrl(product.image_url) : null,
    );
    setSnPatterns(
      product?.sn_patterns?.length
        ? product.sn_patterns.map((item) => item.pattern)
        : [""],
    );
    setError(null);
  }, [product]);

  const handleClose = () => {
    if (productImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(productImagePreview);
    }
    onClose();
  };

  const handleProductImageChange = async (file: File | null) => {
    if (!file) {
      setProductImageBase64(null);
      setProductImageFilename("");
      setProductImagePreview(
        product?.image_url ? getProxiedImageUrl(product.image_url) : null,
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
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    if (!name) {
      setError("กรุณาระบุชื่อสินค้า");
      return;
    }

    const normalizedPatterns = snPatterns
      .map((pattern) => pattern.trim())
      .filter(Boolean);

    setError(null);
    await onSubmit({
      name,
      description:
        String(formData.get("description") || "").trim() || undefined,
      sku: String(formData.get("sku") || "").trim() || undefined,
      cost_price: Number(formData.get("cost_price") || 0),
      sell_price: Number(formData.get("sell_price") || 0),
      active: formData.get("active") === "on",
      sn_patterns: normalizedPatterns,
      ...(productImageBase64 ? { image_base64: productImageBase64 } : {}),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-300/50 p-4"
      onClick={handleClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-4xl bg-white p-6 shadow-[0_4px_10px_0_rgba(0,0,0,0.1)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-defualt-text">
            {product ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="cursor-pointer rounded-full p-1 text-gray-100 hover:bg-gray-10"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl bg-red-100/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
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
                  void handleProductImageChange(event.target.files?.[0] ?? null)
                }
                className="block w-full text-sm text-gray-100 file:mr-4 file:rounded-4xl file:border-0 file:bg-brown-yellow-5 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brown-100"
              />
              {productImageFilename ? (
                <p className="text-xs text-gray-100">{productImageFilename}</p>
              ) : null}
            </div>
          </FormField>

          <FormField label="ชื่อสินค้า *">
            <input
              name="name"
              required
              defaultValue={product?.name ?? ""}
              className={inputClassName}
            />
          </FormField>

          <FormField label="SKU">
            <input
              name="sku"
              defaultValue={product?.sku ? String(product.sku) : ""}
              className={inputClassName}
            />
          </FormField>

          <FormField label="รายละเอียด">
            <textarea
              name="description"
              rows={3}
              defaultValue={
                product?.description ? String(product.description) : ""
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
                defaultValue={product?.cost_price ?? 0}
                className={inputClassName}
              />
            </FormField>
            <FormField label="ราคาขาย">
              <input
                name="sell_price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product?.sell_price ?? 0}
                className={inputClassName}
              />
            </FormField>
          </div>

          <FormField label="รูปแบบ Serial Number">
            <p className="mb-3 text-xs text-gray-100">
              ใช้ <code>#</code> แทนตัวเลข, <code>?</code> แทนตัวอักษร/ตัวเลข 1
              ตัว, <code>*</code> แทนตัวอักษร/ตัวเลขใด ๆ
              หากไม่กำหนด ระบบจะไม่ตรวจสอบ Serial Number
            </p>
            <div className="space-y-2">
              {snPatterns.map((pattern, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={pattern}
                    onChange={(event) => {
                      const next = [...snPatterns];
                      next[index] = event.target.value;
                      setSnPatterns(next);
                    }}
                    placeholder="เช่น ABC#### หรือ SN-*"
                    className={inputClassName}
                  />
                  {snPatterns.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSnPatterns((prev) =>
                          prev.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="cursor-pointer rounded-xl border border-gray-200 p-3 text-gray-100 hover:bg-gray-10"
                      aria-label="ลบรูปแบบ"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSnPatterns((prev) => [...prev, ""])}
                className="inline-flex cursor-pointer items-center gap-2 rounded-4xl border border-gray-200 px-4 py-2 text-sm text-defualt-text hover:bg-gray-10"
              >
                <Plus className="size-4" />
                เพิ่มรูปแบบ
              </button>
            </div>
          </FormField>

          <label className="flex items-center gap-2 text-sm text-defualt-text">
            <input
              type="checkbox"
              name="active"
              defaultChecked={product?.active ?? true}
            />
            เปิดใช้งาน
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
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

export function ProductImage({
  src,
  alt,
}: {
  src?: string | false;
  alt: string;
}) {
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

export function formatSnPatterns(
  patterns: WarrantyProduct["sn_patterns"],
): string {
  if (!patterns?.length) return "-";
  return patterns.map((item) => item.pattern).join(", ");
}
