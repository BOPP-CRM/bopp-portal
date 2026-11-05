"use client";

import { compactTableClassName } from "@/components/util/data-table";
import { TableSkeleton } from "@/components/util/Skeleton";
import {
  formatSnPatterns,
  ProductImage,
} from "@/components/warranties/WarrantyProductModal";
import {
  getWarrantyProducts,
  type WarrantyProduct,
} from "@/services/warranties/warranties";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function WarrantyProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<WarrantyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (searchParams.get("saved") !== "1") return;
    setSuccessMessage("บันทึกข้อมูลสำเร็จ");
    router.replace("/dashboard/warranties/products");
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
          onClick={() => router.push("/dashboard/warranties/products/new")}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-3 py-2 text-sm font-medium text-white transition hover:bg-brown-100/80"
        >
          <Plus className="size-4" />
          เพิ่มสินค้า
        </button>
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

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : products.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ยังไม่มีสินค้า</div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full text-left ${compactTableClassName}`}>
              <thead className="border-b border-gray-200 text-gray-100">
                <tr>
                  <th className="px-3 py-2 font-medium">รูป</th>
                  <th className="px-3 py-2 font-medium">ชื่อ</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">รูปแบบ SN</th>
                  <th className="px-3 py-2 font-medium">ราคาทุน</th>
                  <th className="px-3 py-2 font-medium">ราคาขาย</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() =>
                      router.push(`/dashboard/warranties/products/${product.id}`)
                    }
                    className="cursor-pointer border-b border-gray-200 transition-colors last:border-b-0 hover:bg-gray-10"
                  >
                    <td className="px-3 py-2">
                      <ProductImage src={product.image_url} alt={product.name} />
                    </td>
                    <td className="px-3 py-2 text-defualt-text">{product.name}</td>
                    <td className="px-3 py-2 text-defualt-text">
                      {product.sku || "-"}
                    </td>
                    <td className="max-w-xs px-3 py-2 text-defualt-text">
                      {formatSnPatterns(product.sn_patterns)}
                    </td>
                    <td className="px-3 py-2 text-defualt-text">
                      {formatNumber(product.cost_price)}
                    </td>
                    <td className="px-3 py-2 text-defualt-text">
                      {formatNumber(product.sell_price)}
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
