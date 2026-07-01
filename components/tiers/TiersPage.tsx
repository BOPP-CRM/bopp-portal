"use client";

import TierFormModal from "@/components/tiers/TierFormModal";
import JoinRewardsModal from "@/components/tiers/JoinRewardsModal";
import ActionMenu from "@/components/util/ActionMenu";
import { TableSkeleton } from "@/components/util/Skeleton";
import { getTier, getTiers } from "@/services/tiers/tiers";
import type { PortalTier } from "@/services/tiers/types";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { Gift, Pencil, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function TiersPage() {
  const [tiers, setTiers] = useState<PortalTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalTier, setModalTier] = useState<PortalTier | null | undefined>(
    undefined,
  );
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [showJoinRewards, setShowJoinRewards] = useState(false);

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

  const openCreateModal = () => {
    setModalTier(null);
  };

  const openEditModal = async (tierId: number) => {
    setEditingTierId(tierId);
    try {
      const tier = await getTier(tierId);
      setModalTier(tier);
    } catch (loadError) {
      setError(handleError(loadError).message);
    } finally {
      setEditingTierId(null);
    }
  };

  const closeModal = () => {
    setModalTier(undefined);
  };

  const handleSuccess = async () => {
    setSuccessMessage("บันทึกระดับสมาชิกสำเร็จ");
    await loadTiers();
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            onClick={() => setShowJoinRewards(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl border border-brown-100 px-5 py-2.5 text-sm font-medium text-brown-100 transition hover:bg-brown-yellow-5"
          >
            <Gift className="size-4" />
            รางวัลสมาชิกใหม่
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
          >
            <Plus className="size-4" />
            เพิ่มระดับ
          </button>
        </div>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-4 py-3 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : error ? (
          <div className="p-6 text-sm text-red-100">{error}</div>
        ) : tiers.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ยังไม่มีระดับสมาชิก</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                <tr>
                  <th className="px-4 py-4 font-medium">ระดับ</th>
                  <th className="px-4 py-4 font-medium">รหัส</th>
                  <th className="px-4 py-4 font-medium">ยอดใช้จ่าย</th>
                  <th className="px-4 py-4 font-medium">แปลง Point</th>
                  <th className="px-4 py-4 font-medium">รางวัล</th>
                  <th className="px-4 py-4 font-medium">แสดงใน UI</th>
                  <th className="px-4 py-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr
                    key={tier.id}
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
                    <td className="px-4 py-4 text-brown-100">
                      {formatNumber(tier.convert_points)}
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {formatNumber(tier.rewards?.length ?? 0)} รายการ
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          tier.is_show_in_ui
                            ? "bg-brown-yellow-5 text-brown-100"
                            : "bg-gray-10 text-gray-100"
                        }`}
                      >
                        {tier.is_show_in_ui ? "แสดง" : "ซ่อน"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ActionMenu
                        ariaLabel={`ตัวเลือกระดับ ${tier.name}`}
                        items={[
                          {
                            label:
                              editingTierId === tier.id
                                ? "กำลังโหลด..."
                                : "แก้ไข",
                            icon: <Pencil className="size-4" />,
                            disabled: editingTierId === tier.id,
                            onClick: () => void openEditModal(tier.id),
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

      {modalTier !== undefined ? (
        <TierFormModal
          tier={modalTier}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      ) : null}

      {showJoinRewards ? (
        <JoinRewardsModal
          onClose={() => setShowJoinRewards(false)}
          onSuccess={() => {
            setSuccessMessage("บันทึกรางวัลสมาชิกใหม่สำเร็จ");
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      ) : null}
    </div>
  );
}
