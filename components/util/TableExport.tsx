"use client";

import { downloadCsv } from "@/utils/csv";
import { handleError } from "@/utils/errors";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

export type ExportColumn<T> = {
  id: string;
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
};

type TableExportProps<T> = {
  filename: string;
  columns: ExportColumn<T>[];
  loadRows: () => Promise<T[]>;
  disabled?: boolean;
};

export default function TableExport<T>({
  filename,
  columns,
  loadRows,
  disabled = false,
}: TableExportProps<T>) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(() =>
    columns.map((column) => column.id),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedColumns = useMemo(
    () => columns.filter((column) => selected.includes(column.id)),
    [columns, selected],
  );

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      setError("เลือกอย่างน้อย 1 ฟิลด์");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await loadRows();
      downloadCsv(
        filename,
        selectedColumns.map((column) => column.label),
        rows.map((row) =>
          selectedColumns.map((column) => column.value(row)),
        ),
      );
      setOpen(false);
    } catch (exportError) {
      setError(handleError(exportError).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setSelected(columns.map((column) => column.id));
          setError(null);
          setOpen(true);
        }}
        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-4xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-defualt-text transition hover:bg-gray-10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="size-4" />
        ส่งออก
      </button>
      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-70 flex items-center justify-center bg-gray-300/50 p-4"
              onClick={loading ? undefined : () => setOpen(false)}
              role="presentation"
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="table-export-title"
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-md bg-white p-5 shadow-sm"
                onClick={(event) => event.stopPropagation()}
              >
                <h2
                  id="table-export-title"
                  className="text-lg font-semibold text-defualt-text"
                >
                  ส่งออกข้อมูล
                </h2>
                <p className="mt-1 text-sm text-gray-100">
                  ไฟล์จะมีเฉพาะรายการที่ตรงกับตัวกรองบนหน้านี้ เลือกฟิลด์ที่ต้องการได้
                </p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-medium text-defualt-text">ฟิลด์</span>
                  <button
                    type="button"
                    className="cursor-pointer text-brown-100"
                    onClick={() =>
                      setSelected((current) =>
                        current.length === columns.length
                          ? []
                          : columns.map((column) => column.id),
                      )
                    }
                  >
                    {selected.length === columns.length
                      ? "ยกเลิกทั้งหมด"
                      : "เลือกทั้งหมด"}
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {columns.map((column) => (
                    <label
                      key={column.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-defualt-text"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(column.id)}
                        onChange={() => toggle(column.id)}
                      />
                      {column.label}
                    </label>
                  ))}
                </div>
                {error ? (
                  <p className="mt-3 text-sm text-red-100">{error}</p>
                ) : null}
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setOpen(false)}
                    className="w-full cursor-pointer rounded-4xl bg-gray-10 px-3 py-2 text-sm font-medium text-gray-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    disabled={loading || selectedColumns.length === 0}
                    onClick={() => void handleExport()}
                    className="w-full cursor-pointer rounded-4xl bg-brown-100 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "กำลังส่งออก..." : "ดาวน์โหลด CSV"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
