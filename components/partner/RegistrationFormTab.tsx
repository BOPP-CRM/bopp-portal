"use client";

import { FormFieldsSkeleton } from "@/components/util/Skeleton";
import {
  getRegistrationFields,
  updateRegistrationFields,
  type RegistrationField,
  type RegistrationFieldOption,
  type RegistrationFieldType,
} from "@/services/partner/registration-fields";
import { handleError } from "@/utils/errors";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const inputClassName =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-brown-100";

const CUSTOM_TYPE_OPTIONS: { value: RegistrationFieldType; label: string }[] = [
  { value: "text", label: "ข้อความสั้น" },
  { value: "textarea", label: "ข้อความยาว" },
  { value: "select", label: "ตัวเลือก" },
  { value: "date", label: "วันที่" },
];

const FIELD_TYPE_LABEL: Record<RegistrationFieldType, string> = {
  gender: "เพศ",
  date: "วันที่",
  address: "ที่อยู่",
  text: "ข้อความสั้น",
  textarea: "ข้อความยาว",
  select: "ตัวเลือก",
};

function cloneFields(fields: RegistrationField[]): RegistrationField[] {
  return fields.map((field, index) => ({
    ...field,
    sequence: (index + 1) * 10,
    options: (field.options || []).map((option) => ({ ...option })),
  }));
}

function slugifyKey(label: string) {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || `custom_${Date.now().toString(36)}`;
}

function optionValueFromLabel(label: string, used: Set<string>) {
  const trimmed = label.trim();
  let value = slugifyKey(trimmed);
  if (!value || value.startsWith("custom_")) {
    value = `option_${Date.now().toString(36)}`;
  }
  if (!used.has(value)) return value;
  let i = 2;
  while (used.has(`${value}_${i}`)) i += 1;
  return `${value}_${i}`;
}

function SelectOptionsEditor({
  options,
  disabled,
  onChange,
}: {
  options: RegistrationFieldOption[];
  disabled?: boolean;
  onChange: (options: RegistrationFieldOption[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addOption = () => {
    const label = draft.trim();
    if (!label || disabled) return;
    const used = new Set(options.map((option) => option.value));
    const value = optionValueFromLabel(label, used);
    onChange([...options, { value, label }]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs text-gray-100">ตัวเลือก</label>
      {options.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-sm text-gray-100">
          ยังไม่มีตัวเลือก กดเพิ่มด้านล่าง
        </p>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={`${option.value}-${index}`} className="flex gap-2">
              <input
                className={inputClassName}
                value={option.label}
                disabled={disabled}
                placeholder="ชื่อตัวเลือก"
                onChange={(event) => {
                  const label = event.target.value;
                  const next = options.map((item, itemIndex) =>
                    itemIndex === index
                      ? {
                          ...item,
                          label,
                          // Keep value in sync when it was created from the label.
                          value:
                            item.value === item.label
                              ? label.trim() || item.value
                              : item.value,
                        }
                      : item,
                  );
                  onChange(next);
                }}
              />
              <button
                type="button"
                aria-label="ลบตัวเลือก"
                disabled={disabled}
                onClick={() =>
                  onChange(options.filter((_, itemIndex) => itemIndex !== index))
                }
                className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-red-100 px-3 text-red-100 hover:bg-red-100/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={inputClassName}
          value={draft}
          disabled={disabled}
          placeholder="พิมพ์ตัวเลือกใหม่"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addOption();
            }
          }}
        />
        <button
          type="button"
          disabled={disabled || !draft.trim()}
          onClick={addOption}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-4xl border border-brown-100 px-4 py-2 text-sm font-medium text-brown-100 hover:bg-brown-yellow-5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="size-4" />
          เพิ่มตัวเลือก
        </button>
      </div>
    </div>
  );
}

export default function RegistrationFormTab() {
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<RegistrationFieldType>("text");
  const [newOptions, setNewOptions] = useState<RegistrationFieldOption[]>([]);
  const [newRequired, setNewRequired] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getRegistrationFields();
      setConfigured(data.configured);
      setFields(cloneFields(data.fields || []));
    } catch (err) {
      setLoadError(handleError(err).message);
      setFields([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const usedKeys = useMemo(
    () => new Set(fields.map((field) => field.key)),
    [fields],
  );

  const updateField = (key: string, patch: Partial<RegistrationField>) => {
    setFields((prev) =>
      prev.map((field) => {
        if (field.key !== key) return field;
        const next = { ...field, ...patch };
        if (next.required && !next.visible) {
          next.visible = true;
        }
        if (!next.visible) {
          next.required = false;
        }
        return next;
      }),
    );
  };

  const moveField = (index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next.map((field, idx) => ({
        ...field,
        sequence: (idx + 1) * 10,
      }));
    });
  };

  const removeField = (key: string) => {
    setFields((prev) =>
      prev.filter((field) => field.is_system || field.key !== key),
    );
  };

  const resetAddModal = () => {
    setShowAddModal(false);
    setNewLabel("");
    setNewType("text");
    setNewOptions([]);
    setNewRequired(false);
  };

  const handleAddField = () => {
    const label = newLabel.trim();
    if (!label) {
      setError("กรุณาระบุชื่อฟิลด์");
      return;
    }

    let key = slugifyKey(label);
    if (usedKeys.has(key) || ["gender", "birth_date", "address"].includes(key)) {
      key = `${key}_${Date.now().toString(36)}`.slice(0, 64);
    }

    const options =
      newType === "select"
        ? newOptions
            .map((option) => ({
              value: option.value.trim(),
              label: option.label.trim(),
            }))
            .filter((option) => option.label)
            .map((option) => ({
              value: option.value || option.label,
              label: option.label,
            }))
        : [];

    if (newType === "select" && options.length === 0) {
      setError("ฟิลด์ตัวเลือกต้องมีอย่างน้อย 1 ตัวเลือก");
      return;
    }

    setFields((prev) => [
      ...prev,
      {
        key,
        label,
        field_type: newType,
        is_system: false,
        visible: true,
        required: newRequired,
        sequence: (prev.length + 1) * 10,
        options,
      },
    ]);
    resetAddModal();
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      for (const field of fields) {
        if (!field.label.trim()) {
          throw new Error(`กรุณาระบุชื่อฟิลด์สำหรับ ${field.key}`);
        }
        if (field.required && !field.visible) {
          throw new Error(`ฟิลด์ ${field.label} ที่บังคับต้องเปิดแสดงผล`);
        }
        if (
          field.field_type === "select" &&
          field.visible &&
          (!field.options || field.options.length === 0)
        ) {
          throw new Error(`ฟิลด์ ${field.label} ต้องมีตัวเลือก`);
        }
      }

      const data = await updateRegistrationFields({
        fields: fields.map((field, index) => ({
          key: field.key,
          label: field.label.trim(),
          field_type: field.field_type,
          visible: field.visible,
          required: field.required,
          sequence: (index + 1) * 10,
          options: field.options || [],
        })),
      });
      setConfigured(data.configured);
      setFields(cloneFields(data.fields || []));
      setSuccessMessage("บันทึกฟอร์มสมัครสมาชิกเรียบร้อยแล้ว");
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <FormFieldsSkeleton fields={5} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-red-100/10 px-4 py-3 text-sm text-red-100">
          {loadError}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 cursor-pointer rounded-4xl border border-gray-200 px-4 py-2 text-sm text-defualt-text hover:bg-gray-10"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {successMessage ? (
        <div className="mb-6 rounded-xl bg-brown-yellow-5 px-4 py-3 text-sm text-brown-100">
          {successMessage}
        </div>
      ) : null}
      {error ? (
        <div className="mb-6 rounded-xl bg-red-100/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-defualt-text">
            ฟอร์มสมัครสมาชิก
          </h2>
          <p className="mt-1 text-sm text-gray-100">
            ตั้งค่าฟิลด์ที่สมาชิกต้องกรอกตอนสมัครหรือแก้ไขข้อมูล
            {!configured
              ? " — ยังไม่ได้บันทึกการตั้งค่า ระบบจะใช้พฤติกรรมเดิมจนกว่าจะกดบันทึก"
              : " — กำลังใช้การตั้งค่าของ Partner นี้"}
          </p>
          <p className="mt-2 text-xs text-gray-100">
            การซ่อนหรือลบฟิลด์ออกจากฟอร์มจะไม่ลบข้อมูลสมาชิกเดิม
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddModal(true);
            setNewOptions([]);
            setError(null);
          }}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl border border-brown-100 px-4 py-2 text-sm font-medium text-brown-100 hover:bg-brown-yellow-5"
        >
          <Plus className="size-4" />
          เพิ่มฟิลด์
        </button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.key}
            className="rounded-2xl border border-gray-200 bg-gray-10/40 p-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="เลื่อนขึ้น"
                  disabled={index === 0 || isSaving}
                  onClick={() => moveField(index, -1)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 text-defualt-text disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="เลื่อนลง"
                  disabled={index === fields.length - 1 || isSaving}
                  onClick={() => moveField(index, 1)}
                  className="cursor-pointer rounded-xl border border-gray-200 bg-white p-2 text-defualt-text disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>

              <div className="grid flex-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-100">
                    ชื่อฟิลด์
                  </label>
                  <input
                    className={inputClassName}
                    value={field.label}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateField(field.key, { label: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-100">
                    ประเภท / Key
                  </label>
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-defualt-text">
                    {FIELD_TYPE_LABEL[field.field_type]}
                    <span className="ml-2 text-xs text-gray-100">
                      ({field.key}
                      {field.is_system ? " · ระบบ" : ""})
                    </span>
                  </div>
                </div>

                {field.field_type === "select" ? (
                  <div className="md:col-span-2">
                    <SelectOptionsEditor
                      options={field.options || []}
                      disabled={isSaving}
                      onChange={(options) => updateField(field.key, { options })}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:w-52 lg:flex-col lg:items-stretch">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    updateField(field.key, {
                      visible: !field.visible,
                      required: field.visible ? false : field.required,
                    })
                  }
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl border border-gray-200 bg-white px-3 py-2 text-sm text-defualt-text hover:bg-white"
                >
                  {field.visible ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                  {field.visible ? "แสดง" : "ซ่อน"}
                </button>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl border border-gray-200 bg-white px-3 py-2 text-sm text-defualt-text">
                  <input
                    type="checkbox"
                    className="accent-brown-100"
                    checked={field.required}
                    disabled={isSaving || !field.visible}
                    onChange={(event) =>
                      updateField(field.key, {
                        required: event.target.checked,
                        visible: event.target.checked ? true : field.visible,
                      })
                    }
                  />
                  บังคับกรอก
                </label>
                {!field.is_system ? (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => removeField(field.key)}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-4xl border border-red-100 px-3 py-2 text-sm text-red-100 hover:bg-red-100/10"
                  >
                    <Trash2 className="size-4" />
                    ลบออกจากฟอร์ม
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void load()}
          className="cursor-pointer rounded-4xl border border-gray-200 px-4 py-2 text-sm text-defualt-text hover:bg-gray-10 disabled:opacity-50"
        >
          รีเซ็ต
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className="cursor-pointer rounded-4xl bg-brown-100 px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
      </div>

      {showAddModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={resetAddModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-defualt-text">
              เพิ่มฟิลด์ใหม่
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-100">
                  ชื่อฟิลด์
                </label>
                <input
                  className={inputClassName}
                  value={newLabel}
                  onChange={(event) => setNewLabel(event.target.value)}
                  placeholder="เช่น รหัสพนักงาน"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-100">ประเภท</label>
                <select
                  className={inputClassName}
                  value={newType}
                  onChange={(event) => {
                    const nextType = event.target.value as RegistrationFieldType;
                    setNewType(nextType);
                    if (nextType !== "select") setNewOptions([]);
                  }}
                >
                  {CUSTOM_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {newType === "select" ? (
                <SelectOptionsEditor
                  options={newOptions}
                  onChange={setNewOptions}
                />
              ) : null}
              <label className="inline-flex items-center gap-2 text-sm text-defualt-text">
                <input
                  type="checkbox"
                  className="accent-brown-100"
                  checked={newRequired}
                  onChange={(event) => setNewRequired(event.target.checked)}
                />
                บังคับกรอก
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetAddModal}
                className="cursor-pointer rounded-4xl border border-gray-200 px-4 py-2 text-sm text-defualt-text"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddField}
                className="cursor-pointer rounded-4xl bg-brown-100 px-4 py-2 text-sm font-medium text-white"
              >
                เพิ่ม
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
