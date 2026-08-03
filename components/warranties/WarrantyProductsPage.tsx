"use client";

import ActionMenu from "@/components/util/ActionMenu";
import { TableSkeleton } from "@/components/util/Skeleton";
import WarrantyProductModal, {
  formatSnPatterns,
  ProductImage,
  type WarrantyProductFormPayload,
} from "@/components/warranties/WarrantyProductModal";
import {
  createWarrantyProduct,
  getWarrantyProducts,
  updateWarrantyProduct,
  type WarrantyProduct,
} from "@/services/warranties/warranties";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function WarrantyProductsPage() {
  const [products, setProducts] = useState<WarrantyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<WarrantyProduct | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const items = await getWarrantyProducts(true);
      setProducts(items);
    } catch (loadError) {
      setError(handleError(loadError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: WarrantyProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (payload: WarrantyProductFormPayload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingProduct) {
        await updateWarrantyProduct(editingProduct.id, payload);
      } else {
        await createWarrantyProduct(payload);
      }
      closeModal();
      await loadProducts();
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
            สินค้ารับประกัน
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            จัดการสินค้าและรูปแบบ Serial Number ที่ member ต้องกรอกให้ถูกต้อง
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
        >
          <Plus className="size-4" />
          เพิ่มสินค้า
        </button>
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

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : products.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ยังไม่มีสินค้า</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-100">
                <tr>
                  <th className="px-4 py-3 font-medium">รูป</th>
                  <th className="px-4 py-3 font-medium">ชื่อ</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">รูปแบบ SN</th>
                  <th className="px-4 py-3 font-medium">ราคาทุน</th>
                  <th className="px-4 py-3 font-medium">ราคาขาย</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <ProductImage src={product.image_url} alt={product.name} />
                    </td>
                    <td className="px-4 py-3 text-defualt-text">{product.name}</td>
                    <td className="px-4 py-3 text-defualt-text">
                      {product.sku || "-"}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-defualt-text">
                      {formatSnPatterns(product.sn_patterns)}
                    </td>
                    <td className="px-4 py-3 text-defualt-text">
                      {formatNumber(product.cost_price)}
                    </td>
                    <td className="px-4 py-3 text-defualt-text">
                      {formatNumber(product.sell_price)}
                    </td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        ariaLabel="จัดการสินค้า"
                        items={[
                          {
                            label: "แก้ไข",
                            icon: <Pencil className="size-4" />,
                            onClick: () => openEditModal(product),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen ? (
        <WarrantyProductModal
          product={editingProduct}
          isSubmitting={isSubmitting}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}
