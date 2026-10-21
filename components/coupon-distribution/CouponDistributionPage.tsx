"use client";

import RuleFormModal from "@/components/coupon-distribution/RuleFormModal";
import RulePreviewBody from "@/components/coupon-distribution/RulePreviewBody";
import RuleRunsModal from "@/components/coupon-distribution/RuleRunsModal";
import { summarizeConditions } from "@/components/coupon-distribution/utils";
import ActionMenu from "@/components/util/ActionMenu";
import dialog from "@/components/util/dialog";
import { TableSkeleton } from "@/components/util/Skeleton";
import {
  deleteDistributionRule,
  getDistributionRules,
  previewDistribution,
  runDistributionRule,
  updateDistributionRule,
} from "@/services/coupon-distribution/coupon-distribution";
import type { PortalDistributionRule } from "@/services/coupon-distribution/types";
import { formatDateTime } from "@/utils/datetime";
import { handleError } from "@/utils/errors";
import { formatNumber } from "@/utils/format";
import { Eye, History, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function CouponDistributionPage() {
  const [rules, setRules] = useState<PortalDistributionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalRule, setModalRule] = useState<
    PortalDistributionRule | null | undefined
  >(undefined);
  const [runsRule, setRunsRule] = useState<PortalDistributionRule | null>(null);
  const [busyRuleId, setBusyRuleId] = useState<number | null>(null);

  const loadRules = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setRules(await getDistributionRules());
    } catch (loadError) {
      setError(handleError(loadError).message);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaved = async () => {
    await loadRules();
    showSuccess("บันทึกกฎแจกคูปองสำเร็จ");
  };

  const handlePreview = async (rule: PortalDistributionRule) => {
    setBusyRuleId(rule.id);
    setError(null);
    try {
      const preview = await previewDistribution({
        rule_id: rule.id,
        coupon_id: rule.coupon.id,
        seg_gender: rule.seg_gender,
        seg_age_min: rule.seg_age_min,
        seg_age_max: rule.seg_age_max,
        seg_tier_ids: rule.seg_tiers.map((tier) => tier.id),
        seg_email_verified: rule.seg_email_verified,
        seg_phone_verified: rule.seg_phone_verified,
        seg_signup_from: rule.seg_signup_from || "",
        seg_signup_to: rule.seg_signup_to || "",
      });
      await dialog.fire({
        title: `ผู้ที่จะได้รับ: ${rule.name}`,
        description: <RulePreviewBody preview={preview} />,
        confirmText: "ปิด",
        showCancel: false,
      });
    } catch (previewError) {
      setError(handleError(previewError).message);
    } finally {
      setBusyRuleId(null);
    }
  };

  const handleRun = async (rule: PortalDistributionRule) => {
    const { isConfirmed } = await dialog.fire({
      title: "แจกคูปองตอนนี้?",
      description: `ระบบจะแจก "${rule.coupon.name}" ให้สมาชิกที่เข้าเงื่อนไขและยังไม่เคยได้รับจากกฎนี้`,
      confirmText: "แจกคูปอง",
    });
    if (!isConfirmed) return;

    setBusyRuleId(rule.id);
    setError(null);
    try {
      const result = await runDistributionRule(rule.id);
      showSuccess(
        result.broadcast
          ? `เริ่มแจกคูปองให้ ${formatNumber(result.broadcast.total_recipients)} คนแล้ว`
          : (result.message ?? "ไม่มีสมาชิกใหม่ที่เข้าเงื่อนไข"),
      );
      await loadRules();
    } catch (runError) {
      setError(handleError(runError).message);
    } finally {
      setBusyRuleId(null);
    }
  };

  const handleToggleActive = async (rule: PortalDistributionRule) => {
    setBusyRuleId(rule.id);
    setError(null);
    try {
      await updateDistributionRule(rule.id, { active: !rule.active });
      await loadRules();
    } catch (toggleError) {
      setError(handleError(toggleError).message);
    } finally {
      setBusyRuleId(null);
    }
  };

  const handleDelete = async (rule: PortalDistributionRule) => {
    const { isConfirmed } = await dialog.fire({
      title: "ลบกฎแจกคูปอง?",
      description: `ลบ "${rule.name}" (คูปองที่แจกไปแล้วจะไม่ถูกเพิกถอน)`,
      confirmText: "ลบ",
      confirmVariant: "danger",
    });
    if (!isConfirmed) return;

    setBusyRuleId(rule.id);
    setError(null);
    try {
      await deleteDistributionRule(rule.id);
      await loadRules();
      showSuccess("ลบกฎสำเร็จ");
    } catch (deleteError) {
      setError(handleError(deleteError).message);
    } finally {
      setBusyRuleId(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-defualt-text">
            แจกคูปองตามเงื่อนไข
          </h1>
          <p className="mt-1 text-sm text-gray-100">
            ตั้งกฎแจกคูปองให้สมาชิกตาม tier เพศ อายุ และเงื่อนไขอื่นๆ
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalRule(null)}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl bg-brown-100 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brown-100/80"
        >
          <Plus className="size-4" />
          เพิ่มกฎ
        </button>
      </div>

      {successMessage ? (
        <div className="mb-4 rounded-xl bg-brown-yellow-5 px-4 py-3 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}
      {!loading && error && rules.length > 0 ? (
        <div className="mb-4 rounded-xl bg-gray-10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : error && rules.length === 0 ? (
          <div className="p-6 text-sm text-red-100">{error}</div>
        ) : rules.length === 0 ? (
          <div className="p-6 text-sm text-gray-100">ยังไม่มีกฎแจกคูปอง</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-10 text-gray-100">
                <tr>
                  <th className="px-4 py-4 font-medium">กฎ</th>
                  <th className="px-4 py-4 font-medium">เงื่อนไข</th>
                  <th className="px-4 py-4 font-medium">การทำงาน</th>
                  <th className="px-4 py-4 font-medium">แจกแล้ว</th>
                  <th className="px-4 py-4 font-medium">รันล่าสุด</th>
                  <th className="px-4 py-4 font-medium">สถานะ</th>
                  <th className="px-4 py-4 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-defualt-text">
                        {rule.name}
                      </p>
                      <p className="text-xs text-gray-100">
                        {rule.coupon.name} • เหลือ{" "}
                        {formatNumber(rule.coupon.available_code_count)} โค้ด
                      </p>
                    </td>
                    <td className="max-w-xs px-4 py-4 text-defualt-text">
                      {summarizeConditions(rule)}
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {rule.trigger === "scheduled"
                        ? `อัตโนมัติ ทุก ${rule.schedule_interval_days} วัน`
                        : "กดแจกเอง"}
                      {rule.has_active_job ? (
                        <p className="text-xs text-brown-100">กำลังแจก...</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {formatNumber(rule.granted_count)}
                    </td>
                    <td className="px-4 py-4 text-defualt-text">
                      {rule.last_run_at ? formatDateTime(rule.last_run_at) : "-"}
                      {rule.last_error ? (
                        <p className="max-w-48 truncate text-xs text-red-100">
                          {rule.last_error}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          rule.active
                            ? "bg-brown-yellow-5 text-brown-100"
                            : "bg-gray-10 text-gray-100"
                        }`}
                      >
                        {rule.active ? "เปิดใช้งาน" : "ปิด"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ActionMenu
                        ariaLabel={`ตัวเลือกกฎ ${rule.name}`}
                        items={[
                          {
                            label: "ดูผู้ที่จะได้รับ",
                            icon: <Eye className="size-4" />,
                            disabled: busyRuleId === rule.id,
                            onClick: () => void handlePreview(rule),
                          },
                          {
                            label: "แจกตอนนี้",
                            icon: <Play className="size-4" />,
                            disabled: busyRuleId === rule.id || !rule.active,
                            onClick: () => void handleRun(rule),
                          },
                          {
                            label: "ประวัติการแจก",
                            icon: <History className="size-4" />,
                            onClick: () => setRunsRule(rule),
                          },
                          {
                            label: "แก้ไข",
                            icon: <Pencil className="size-4" />,
                            onClick: () => setModalRule(rule),
                          },
                          {
                            label: rule.active ? "ปิดใช้งาน" : "เปิดใช้งาน",
                            icon: <Pencil className="size-4" />,
                            disabled: busyRuleId === rule.id,
                            onClick: () => void handleToggleActive(rule),
                          },
                          {
                            label: "ลบ",
                            icon: <Trash2 className="size-4" />,
                            disabled: busyRuleId === rule.id,
                            onClick: () => void handleDelete(rule),
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

      {modalRule !== undefined ? (
        <RuleFormModal
          rule={modalRule}
          onClose={() => setModalRule(undefined)}
          onSuccess={handleSaved}
        />
      ) : null}

      {runsRule ? (
        <RuleRunsModal
          ruleId={runsRule.id}
          ruleName={runsRule.name}
          onClose={() => setRunsRule(null)}
        />
      ) : null}
    </div>
  );
}
