"use client";

import { FormEvent, useMemo, useState } from "react";

import { apiClient } from "@/lib/api/apiClient";
import type { WidgetConfig } from "@/themes/types";

type BuilderField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "email" | "tel" | "number";
  required?: boolean;
  placeholder?: string;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toFields(value: unknown): BuilderField[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const data = item as Record<string, unknown>;
      const rawType = asString(data.type) as BuilderField["type"];
      const type: BuilderField["type"] = ["text", "textarea", "email", "tel", "number"].includes(rawType)
        ? rawType
        : "text";
      return {
        id: asString(data.id) || `field_${index + 1}`,
        label: asString(data.label) || `Field ${index + 1}`,
        type,
        required: Boolean(data.required),
        placeholder: asString(data.placeholder),
      };
    });
}

function supportPayload(values: Record<string, string>) {
  return {
    name: values.full_name || values.name || "",
    phone: values.phone || values.mobile || "",
    type: values.type || "",
    message: values.message || values.description || values.note || "",
    source: "serva_form_builder",
  };
}

function FieldInput({ field, minimal = false }: { field: BuilderField; minimal?: boolean }) {
  const className = minimal
    ? "w-full border-0 border-b border-slate-300 px-0 py-3 focus:border-orange-500 focus:ring-0 bg-transparent"
    : "w-full rounded-xl border border-slate-200 px-4 py-2.5 focus:ring-2 focus:ring-orange-400 focus:border-orange-400";
  const shared = {
    id: field.id,
    name: field.id,
    required: Boolean(field.required),
    placeholder: field.placeholder || "",
    className,
  };
  if (field.type === "textarea") return <textarea rows={4} {...shared} />;
  return <input type={field.type} {...shared} />;
}

export default function ServaFormBuilderWidget({ config }: { config?: WidgetConfig }) {
  const title = asString(config?.widgetConfig?.title) || "Send a request";
  const description = asString(config?.widgetConfig?.description);
  const submitLabel = asString(config?.widgetConfig?.submit_label) || "Submit";
  const successMessage =
    asString(config?.widgetConfig?.success_message) || "Form submitted successfully.";
  const action = asString(config?.widgetConfig?.action) || "support_request";
  const webhookUrl = asString(config?.widgetConfig?.webhook_url);
  const styleKey = asString(config?.widgetConfig?.style_key) || "card";

  const fields = useMemo(() => {
    const configured = toFields(config?.widgetConfig?.fields);
    if (configured.length > 0) return configured;
    return [
      { id: "full_name", label: "Full name", type: "text", required: true },
      { id: "phone", label: "Phone", type: "tel", required: true },
      { id: "message", label: "Message", type: "textarea", required: false },
    ] as BuilderField[];
  }, [config?.widgetConfig?.fields]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const values: Record<string, string> = {};
    formData.forEach((value, key) => {
      values[key] = typeof value === "string" ? value : "";
    });

    try {
      if (action === "custom_webhook" && webhookUrl) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
      } else {
        const payload = supportPayload(values);
        if (!payload.name || !payload.phone) {
          throw new Error("Name and phone are required.");
        }
        await apiClient.post("/landing/support-request/", payload);
      }
      event.currentTarget.reset();
      setSuccess(successMessage);
    } catch (err: any) {
      console.error("Serva form builder submit error:", err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to submit the form.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (styleKey === "split") {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-[2rem] overflow-hidden border border-slate-200 bg-white grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-slate-900 text-white p-8 md:p-10">
            <h2 className="text-3xl font-black">{title}</h2>
            {description ? <p className="mt-4 text-slate-300 leading-7">{description}</p> : null}
            <p className="mt-5 text-sm text-orange-300">Serva design form variation</p>
          </div>
          <form className="p-8 md:p-10 space-y-4" onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-slate-700">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                <FieldInput field={field} />
              </div>
            ))}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-orange-500 text-white px-5 py-2.5 text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : submitLabel}
            </button>
          </form>
        </div>
      </section>
    );
  }

  if (styleKey === "minimal") {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-black text-slate-900">{title}</h2>
          {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="mb-1 block text-sm text-slate-600">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                <FieldInput field={field} minimal />
              </div>
            ))}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full border border-slate-900 text-slate-900 px-6 py-2.5 text-sm font-semibold hover:bg-slate-900 hover:text-white transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : submitLabel}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-[1.7rem] border border-slate-200 bg-white p-6 md:p-8 shadow-md">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h2>
        {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-slate-700">
                {field.label}
                {field.required ? " *" : ""}
              </label>
              <FieldInput field={field} />
            </div>
          ))}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {success ? <p className="text-sm text-green-700">{success}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-slate-900 hover:bg-black text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "Submitting..." : submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}
