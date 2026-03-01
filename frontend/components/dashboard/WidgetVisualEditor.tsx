"use client";

import { useEffect, useMemo, useState } from "react";
import { Paintbrush, RefreshCw, Save } from "lucide-react";

import JsonEditorField from "@/components/dashboard/JsonEditorField";
import SearchableSelect from "@/components/dashboard/SearchableSelect";
import FormFieldsEditor, {
  type FormFieldDefinition,
} from "@/components/dashboard/FormFieldsEditor";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import type {
import { tFrontendAuto } from "@/lib/i18n/autoMessages";
  WidgetBuilderOption,
  WidgetStylePresetDto,
  WidgetTypeDto,
  WidgetVisualField,
  WidgetVisualGroup,
} from "@/lib/api/pageApi";

export type WidgetPayloadState = {
  widget_config: Record<string, unknown>;
  components_config: Record<string, unknown>;
  extra_request_params: Record<string, unknown>;
};

type WidgetVisualEditorProps = {
  widgetType: WidgetTypeDto | null;
  payload: WidgetPayloadState;
  onChange: (next: WidgetPayloadState) => void;
  entityOptions?: Record<string, WidgetBuilderOption[]>;
  disabled?: boolean;
};

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function prettyJson(value: unknown): string {
  const normalized = asObject(value);
  return JSON.stringify(normalized, null, 2);
}

function clonePayload(payload: WidgetPayloadState): WidgetPayloadState {
  return {
    widget_config: { ...asObject(payload.widget_config) },
    components_config: { ...asObject(payload.components_config) },
    extra_request_params: { ...asObject(payload.extra_request_params) },
  };
}

function getNestedValue(source: Record<string, unknown>, keyPath: string): unknown {
  if (!keyPath) return undefined;
  const keys = keyPath.split(".").filter(Boolean);
  let current: unknown = source;
  for (const key of keys) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function setNestedValue(source: Record<string, unknown>{tFrontendAuto("fe.13c242c40a55")}<string, unknown> {
  const keys = keyPath.split(".").filter(Boolean);
  if (keys.length === 0) return source;
  const output = { ...source };
  let current: Record<string, unknown> = output;
  for (let idx = 0; idx < keys.length - 1; idx += 1) {
    const key = keys[idx]!;
    const next = current[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]!] = value;
  return output;
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const parsed = JSON.parse((raw || "").trim() || "{}");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON must be an object.");
  }
  return parsed as Record<string, unknown>;
}

function resolveStyleKey(payload: WidgetPayloadState): string {
  const styleRaw = payload.widget_config?.style_key;
  return typeof styleRaw === "string" ? styleRaw : "";
}

function isWidgetPayloadTarget(
  value: string,
): value is keyof WidgetPayloadState {
  return (
    value === "widget_config" ||
    value === "components_config" ||
    value === "extra_request_params"
  );
}

function mergeStyleDefaults(
  payload: WidgetPayloadState,
  stylePreset: WidgetStylePresetDto,
): WidgetPayloadState {
  return {
    widget_config: {
      ...payload.widget_config,
      ...asObject(stylePreset.default_widget_config),
      style_key: stylePreset.key,
    },
    components_config: {
      ...payload.components_config,
      ...asObject(stylePreset.default_components_config),
    },
    extra_request_params: {
      ...payload.extra_request_params,
      ...asObject(stylePreset.default_extra_request_params),
    },
  };
}

function fieldDefaultValue(field: WidgetVisualField): unknown {
  if (field.default !== undefined) return field.default;
  switch (field.type) {
    case "switch":
      return false;
    case "number":
      return 0;
    case "form_fields":
      return [];
    default:
      return "";
  }
}

export default function WidgetVisualEditor({
  widgetType,
  payload,
  onChange,
  entityOptions = {},
  disabled = false,
}: WidgetVisualEditorProps) {
  const stylePresets = widgetType?.style_presets ?? [];
  const selectedStyleKey = resolveStyleKey(payload);

  const [jsonDrafts, setJsonDrafts] = useState({
    widget_config: "{}",
    components_config: "{}",
    extra_request_params: "{}",
  });
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonDrafts({
      widget_config: prettyJson(payload.widget_config),
      components_config: prettyJson(payload.components_config),
      extra_request_params: prettyJson(payload.extra_request_params),
    });
    setJsonError(null);
  }, [
    widgetType?.id,
    payload.widget_config,
    payload.components_config,
    payload.extra_request_params,
  ]);

  const groupedSchema = useMemo(() => {
    const groups = widgetType?.visual_schema?.groups ?? [];
    return groups.filter((group): group is WidgetVisualGroup => {
      return (
        group &&
        typeof group === "object" &&
        typeof group.key === "string" &&
        Array.isArray(group.fields) &&
        isWidgetPayloadTarget(String(group.target))
      );
    });
  }, [widgetType?.visual_schema?.groups]);

  const updateFieldValue = (
    target: keyof WidgetPayloadState,
    field: WidgetVisualField,
    value: unknown,
  ) => {
    const next = clonePayload(payload);
    next[target] = setNestedValue(asObject(next[target]), field.key, value);
    onChange(next);
  };

  const resolveFieldValue = (
    target: keyof WidgetPayloadState,
    field: WidgetVisualField,
  ): unknown => {
    const current = getNestedValue(asObject(payload[target]), field.key);
    if (current !== undefined && current !== null) return current;
    return fieldDefaultValue(field);
  };

  const handleApplyJson = () => {
    try {
      const next: WidgetPayloadState = {
        widget_config: parseJsonObject(jsonDrafts.widget_config),
        components_config: parseJsonObject(jsonDrafts.components_config),
        extra_request_params: parseJsonObject(jsonDrafts.extra_request_params),
      };
      onChange(next);
      setJsonError(null);
    } catch (err: unknown) {
      setJsonError(err instanceof Error ? err.message : "Invalid JSON.");
    }
  };

  const renderField = (
    target: keyof WidgetPayloadState,
    field: WidgetVisualField,
  ) => {
    const value = resolveFieldValue(target, field);

    if (field.type === "switch") {
      return (
        <label key={`${target}.${field.key}`} className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateFieldValue(target, field, e.target.checked)}
            disabled={disabled}
          />
          {field.label}
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={`${target}.${field.key}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          <textarea
            value={String(value ?? "")}
            onChange={(e) => updateFieldValue(target, field, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {field.help_text && <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>}
        </div>
      );
    }

    if (field.type === "number") {
      return (
        <div key={`${target}.${field.key}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          <input
            type="number"
            value={Number(value ?? 0)}
            min={field.min}
            max={field.max}
            onChange={(e) => {
              const raw = e.target.value;
              const num = raw === "" ? "" : Number(raw);
              updateFieldValue(target, field, Number.isFinite(num) ? num : 0);
            }}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {field.help_text && <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>}
        </div>
      );
    }

    if (field.type === "select") {
      const options = (field.options ?? []).map((option) => ({
        value: String(option.value),
        label: option.label,
      }));
      return (
        <div key={`${target}.${field.key}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          <SearchableSelect
            options={options}
            value={String(value ?? "")}
            onChange={(nextValue) => updateFieldValue(target, field, nextValue)}
            disabled={disabled}
            placeholder="Select..."
            searchPlaceholder="Search..."
          />
          {field.help_text && <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>}
        </div>
      );
    }

    if (field.type === "entity_select") {
      const sourceKey = field.source || "";
      const options = (entityOptions[sourceKey] ?? []).map((option) => ({
        value: String(option.value),
        label: option.label,
      }));
      return (
        <div key={`${target}.${field.key}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          <SearchableSelect
            options={options}
            value={String(value ?? "")}
            onChange={(nextValue) => updateFieldValue(target, field, nextValue)}
            disabled={disabled}
            placeholder={tFrontendAuto("fe.c7e2edbb4cb7")}
            searchPlaceholder="Search..."
          />
          {field.help_text && <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>}
        </div>
      );
    }

    if (field.type === "rich_text") {
      return (
        <div key={`${target}.${field.key}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          <RichTextEditor
            value={String(value ?? "")}
            onChange={(nextValue) => updateFieldValue(target, field, nextValue)}
            placeholder={field.placeholder}
          />
          {field.help_text && <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>}
        </div>
      );
    }

    if (field.type === "form_fields") {
      return (
        <div key={`${target}.${field.key}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
          <FormFieldsEditor
            value={value as FormFieldDefinition[]}
            onChange={(nextValue) => updateFieldValue(target, field, nextValue)}
            disabled={disabled}
          />
          {field.help_text && <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>}
        </div>
      );
    }

    return (
      <div key={`${target}.${field.key}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => updateFieldValue(target, field, e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {field.help_text && <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>}
      </div>
    );
  };

  if (!widgetType) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
        Select a widget type to configure it visually.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stylePresets.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <Paintbrush className="h-4 w-4" />
            Style Presets
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stylePresets.map((style) => {
              const active = style.key === selectedStyleKey;
              return (
                <button
                  key={style.key}
                  type="button"
                  onClick={() => onChange(mergeStyleDefaults(payload, style))}
                  disabled={disabled}
                  className={`text-left rounded-lg border p-3 transition ${
                    active
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {style.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={style.preview_url}
                      alt={style.name}
                      className="w-full h-24 object-cover rounded-md mb-2"
                    />
                  ) : (
                    <div className="w-full h-24 rounded-md bg-gray-100 mb-2 flex items-center justify-center text-xs text-gray-500">
                      No preview
                    </div>
                  )}
                  <p className="font-medium text-sm">{style.name}</p>
                  {style.description && (
                    <p className="text-xs text-gray-600 mt-1">{style.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {groupedSchema.length > 0 ? (
        groupedSchema.map((group) => (
          <div key={group.key} className="rounded-lg border border-gray-200 p-4 space-y-3">
            <h4 className="font-semibold text-gray-800">{group.label}</h4>
            <div className="space-y-3">
              {group.fields.map((field) => renderField(group.target, field))}
            </div>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          No visual schema for this widget. Use advanced JSON mode.
        </div>
      )}

      <details className="rounded-lg border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
          Advanced JSON (optional)
        </summary>
        <div className="mt-3 space-y-3">
          {jsonError && (
            <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
              {jsonError}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <JsonEditorField
              label="widget_config"
              value={jsonDrafts.widget_config}
              onChange={(value) =>
                setJsonDrafts((prev) => ({ ...prev, widget_config: value }))
              }
              minHeight={150}
              disabled={disabled}
            />
            <JsonEditorField
              label="components_config"
              value={jsonDrafts.components_config}
              onChange={(value) =>
                setJsonDrafts((prev) => ({ ...prev, components_config: value }))
              }
              minHeight={150}
              disabled={disabled}
            />
            <JsonEditorField
              label="extra_request_params"
              value={jsonDrafts.extra_request_params}
              onChange={(value) =>
                setJsonDrafts((prev) => ({ ...prev, extra_request_params: value }))
              }
              minHeight={150}
              disabled={disabled}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyJson}
              className="btn-secondary inline-flex items-center gap-2"
              disabled={disabled}
            >
              <Save className="h-4 w-4" />
              Apply JSON
            </button>
            <button
              type="button"
              onClick={() =>
                setJsonDrafts({
                  widget_config: prettyJson(payload.widget_config),
                  components_config: prettyJson(payload.components_config),
                  extra_request_params: prettyJson(payload.extra_request_params),
                })
              }
              className="btn-secondary inline-flex items-center gap-2"
              disabled={disabled}
            >
              <RefreshCw className="h-4 w-4" />
              Reload from form
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
