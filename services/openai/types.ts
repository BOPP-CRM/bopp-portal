export type OpenAiStatus = {
  configured: boolean;
  masked_key: string | null;
};

export type OpenAiStatusResponse = {
  openai: OpenAiStatus;
};

export type OpenAiMutationResponse = {
  openai: OpenAiStatus;
  message?: string;
};

export type ReceiptSaleSyncJob = {
  id: number;
  state: "pending" | "running" | "done" | "failed";
  total: number;
  processed: number;
  synced: number;
  skipped: number;
  failed: number;
  last_error: string | false;
  started_at: string | false;
  finished_at: string | false;
  current_receipt: {
    id: number;
    receipt_number: string;
  } | false;
};

export type ReceiptSaleSyncStatusResponse = {
  missing_count: number;
  openai_configured: boolean;
  active_job: ReceiptSaleSyncJob | false;
};

export type ReceiptSaleSyncJobResponse = {
  job: ReceiptSaleSyncJob;
  message?: string;
};

export const AI_SALE_SYNC_TITLE = "ยืนยันการบันทึกข้อมูลจากปัญญาประดิษฐ์ (AI)";

export const AI_SALE_SYNC_DESCRIPTION =
  "ระบบจะใช้ OpenAI วิเคราะห์รูปใบเสร็จที่อนุมัติแล้ว เพื่อสร้างหรืออัปเดตรายการขายโดยอัตโนมัติ ข้อมูลที่ได้จาก AI อาจมีความคลาดเคลื่อนได้ ท่านมีหน้าที่ตรวจสอบความถูกต้องก่อนนำไปใช้งานต่อ";

export const AI_SALE_SYNC_CHECKBOX_LABEL =
  "ข้าพเจ้ได้ตรวจสอบและยืนยันว่า ข้อมูลรายการขายที่ระบบจะดึงจากใบเสร็จโดยใช้ปัญญาประดิษฐ์ (AI) มีความถูกต้องครบถ้วนและเหมาะสมกับการบันทึกในระบบ ข้าพเจ้ายอมรับความรับผิดชอบต่อความถูกต้องของข้อมูลดังกล่าว และทราบว่าระบบไม่สามารถรับประกันความถูกต้องของผลลัพธ์จาก AI ได้ในทุกกรณี";

export const AI_SALE_REGENERATE_TITLE = "สร้างข้อมูลรายการขายจาก AI ใหม่";

export const AI_SALE_REGENERATE_DESCRIPTION =
  "ระบบจะอ่านรูปใบเสร็จอีกครั้งและแทนที่ข้อมูลรายการขายปัจจุบันด้วยผลลัพธ์ใหม่จาก AI ข้อมูลเดิมจะถูกเขียนทับ";
