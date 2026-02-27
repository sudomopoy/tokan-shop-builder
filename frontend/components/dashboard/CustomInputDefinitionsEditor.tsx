"use client";

import { Plus, Trash2 } from "lucide-react";
import type { CustomInputDefinition } from "@/lib/api/productApi";

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

const TYPES = [
  { value: "text", label: "متن" },
  { value: "email", label: "ایمیل" },
  { value: "password", label: "رمز عبور" },
  { value: "textarea", label: "متن چندخطی" },
] as const;

type NormalizedItem = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
};

function normalizeItem(item: Record<string, unknown> | CustomInputDefinition): NormalizedItem {
  return {
    key: String(item.key ?? ""),
    label: String(item.label ?? ""),
    type: ["text", "email", "password", "textarea"].includes(String(item.type ?? "text"))
      ? String(item.type)
      : "text",
    required: Boolean(item.required),
  };
}

export function CustomInputDefinitionsEditor({
  value = [],
  onChange,
}: {
  value?: Record<string, unknown>[] | CustomInputDefinition[];
  onChange: (items: Record<string, unknown>[]) => void;
}) {
  const items: NormalizedItem[] = Array.isArray(value)
    ? value.map(normalizeItem)
    : [];

  const updateItem = (index: number, field: keyof NormalizedItem, val: string | boolean) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    onChange(next);
  };

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
  };

  const addItem = () => {
    onChange([...items, { key: "", label: "", type: "text", required: false }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className={labelClass}>ورودی‌های سفارشی</label>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          افزودن فیلد
        </button>
      </div>

      <p className="text-xs text-gray-500 -mt-2">
        این فیلدها در صفحه checkout از خریدار دریافت می‌شوند (مثلاً ایمیل برای ارسال لینک دانلود).
      </p>

      {items.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500 text-sm"
          role="button"
          onClick={addItem}
          onKeyDown={(e) => e.key === "Enter" && addItem()}
          tabIndex={0}
        >
          هنوز فیلدی تعریف نشده. روی «افزودن فیلد» کلیک کنید.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-gray-500 mt-1">
                  فیلد {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>کلید (فنی)</label>
                  <input
                    type="text"
                    value={item.key}
                    onChange={(e) => updateItem(index, "key", e.target.value)}
                    placeholder="مثلاً: email"
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className={labelClass}>برچسب (نمایشی)</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateItem(index, "label", e.target.value)}
                    placeholder="مثلاً: ایمیل"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="min-w-[140px]">
                  <label className={labelClass}>نوع فیلد</label>
                  <select
                    value={item.type}
                    onChange={(e) => updateItem(index, "type", e.target.value)}
                    className={inputClass}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-6">
                  <input
                    type="checkbox"
                    checked={!!item.required}
                    onChange={(e) => updateItem(index, "required", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">اجباری</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
