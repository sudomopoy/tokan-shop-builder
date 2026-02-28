"use client";

import { Plus, Trash2 } from "lucide-react";

export type FormFieldType = "text" | "textarea" | "email" | "tel" | "number";

export type FormFieldDefinition = {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
};

type FormFieldsEditorProps = {
  value: unknown;
  onChange: (value: FormFieldDefinition[]) => void;
  disabled?: boolean;
};

const FIELD_TYPES: Array<{ value: FormFieldType; label: string }> = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "number", label: "Number" },
];

function normalizeFields(value: unknown): FormFieldDefinition[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const field = item as Record<string, unknown>;
      const typeRaw = typeof field.type === "string" ? field.type : "text";
      const type = FIELD_TYPES.find((opt) => opt.value === typeRaw)?.value ?? "text";
      return {
        id: typeof field.id === "string" && field.id.trim() ? field.id : `field_${index + 1}`,
        label: typeof field.label === "string" ? field.label : "",
        type,
        required: Boolean(field.required),
        placeholder: typeof field.placeholder === "string" ? field.placeholder : "",
      };
    });
}

export default function FormFieldsEditor({ value, onChange, disabled = false }: FormFieldsEditorProps) {
  const fields = normalizeFields(value);

  const updateField = (index: number, patch: Partial<FormFieldDefinition>) => {
    const next = fields.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addField = () => {
    onChange([
      ...fields,
      {
        id: `field_${fields.length + 1}`,
        label: "",
        type: "text",
        required: false,
        placeholder: "",
      },
    ]);
  };

  const removeField = (index: number) => {
    const next = fields.filter((_, idx) => idx !== index);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-xs text-gray-500">No form fields yet.</p>
      )}

      {fields.map((field, index) => (
        <div key={`${field.id}-${index}`} className="rounded-lg border border-gray-200 p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Field ID</label>
              <input
                value={field.id}
                onChange={(e) => updateField(index, { id: e.target.value })}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
              <input
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={field.type}
                onChange={(e) => updateField(index, { type: e.target.value as FormFieldType })}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {FIELD_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
              <input
                value={field.placeholder ?? ""}
                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={Boolean(field.required)}
                onChange={(e) => updateField(index, { required: e.target.checked })}
                disabled={disabled}
              />
              Required
            </label>
            <button
              type="button"
              onClick={() => removeField(index)}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        disabled={disabled}
        className="btn-secondary inline-flex items-center gap-2 text-sm"
      >
        <Plus className="h-4 w-4" />
        Add field
      </button>
    </div>
  );
}
