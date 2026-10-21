import type {
  PortalDistributionRule,
  RuleGender,
  RuleVerifiedFilter,
} from "@/services/coupon-distribution/types";

export const GENDER_LABELS: Record<RuleGender, string> = {
  any: "ทั้งหมด",
  M: "ชาย",
  F: "หญิง",
  O: "อื่นๆ",
};

export const VERIFIED_LABELS: Record<RuleVerifiedFilter, string> = {
  any: "ทั้งหมด",
  yes: "ยืนยันแล้ว",
  no: "ยังไม่ยืนยัน",
};

export const RUN_STATE_LABELS: Record<string, string> = {
  draft: "ร่าง",
  pending: "รอดำเนินการ",
  running: "กำลังแจก",
  done: "เสร็จสิ้น",
  failed: "ล้มเหลว",
  cancelled: "ยกเลิก",
};

export function summarizeConditions(rule: PortalDistributionRule) {
  const parts: string[] = [];
  if (rule.seg_gender !== "any") {
    parts.push(`เพศ${GENDER_LABELS[rule.seg_gender]}`);
  }
  if (rule.seg_tiers.length > 0) {
    parts.push(`Tier: ${rule.seg_tiers.map((tier) => tier.name).join(", ")}`);
  }
  if (rule.seg_age_min || rule.seg_age_max) {
    parts.push(
      `อายุ ${rule.seg_age_min || "-"} - ${rule.seg_age_max || "-"} ปี`,
    );
  }
  if (rule.seg_signup_from || rule.seg_signup_to) {
    parts.push("ช่วงวันที่สมัคร");
  }
  if (rule.seg_email_verified !== "any") {
    parts.push(`อีเมล${VERIFIED_LABELS[rule.seg_email_verified]}`);
  }
  if (rule.seg_phone_verified !== "any") {
    parts.push(`เบอร์โทร${VERIFIED_LABELS[rule.seg_phone_verified]}`);
  }
  return parts.length > 0 ? parts.join(" • ") : "สมาชิกทั้งหมด";
}
