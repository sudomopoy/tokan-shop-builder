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
      const typeRaw = asString(data.type) as BuilderField["type"];
      const type: BuilderField["type"] = ["text", "textarea", "email", "tel", "number"].includes(typeRaw)
        ? typeRaw
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

function mapSupportRequestPayload(values: Record<string, string>) {
  const name =
    values.full_name ||
    values.name ||
    values.first_name ||
    values.customer_name ||
    "";
  const phone =
    values.phone ||
    values.mobile ||
    values.cell ||
    "";
  const message = values.message || values.description || values.note || "";
  const type = values.type || "";

  return {
    name,
    phone,
    type,
    message,
    source: "storefront_form_builder",
  };
}

function FormFieldInput({
  field,
  compact = false,
}: {
  field: BuilderField;
  compact?: boolean;
}) {
  const commonProps = {
    id: field.id,
    name: field.id,
    required: Boolean(field.required),
    placeholder: field.placeholder || "",
    className: compact
      ? "w-full rounded-none border-0 border-b border-gray-300 px-0 py-3 focus:border-blue-600 focus:ring-0 bg-transparent"
      : "w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  };

  if (field.type === "textarea") {
    return <textarea rows={4} {...commonProps} />;
  }
  return <input type={field.type || "text"} {...commonProps} />;
}

export default function FormBuilderWidget({ config }: { config?: WidgetConfig }) {
  const title = asString(config?.widgetConfig?.title) || "Contact us";
  const description = asString(config?.widgetConfig?.description);
  const submitLabel = asString(config?.widgetConfig?.submit_label) || "Submit";
  const successMessage =
    asString(config?.widgetConfig?.success_message) || "Your request was submitted successfully.";
  const action = asString(config?.widgetConfig?.action) || "support_request";
  const webhookUrl = asString(config?.widgetConfig?.webhook_url);
  const styleKey = asString(config?.widgetConfig?.style_key) || "card";

  const fields = useMemo(() => {
    const parsed = toFields(config?.widgetConfig?.fields);
    if (parsed.length > 0) return parsed;
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
        const payload = mapSupportRequestPayload(values);
        if (!payload.name || !payload.phone) {
          throw new Error("Name and phone are required for support request action.");
        }
        await apiClient.post("/landing/support-request/", payload);
      }
      setSuccess(successMessage);
      event.currentTarget.reset();
    } catch (err: any) {
      console.error("Form builder submit error:", err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to submit the form. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (styleKey === "split") {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 rounded-3xl border border-gray-200 bg-white p-6 md:p-8">
          <div className="space-y-4 border-b lg:border-b-0 lg:border-l border-gray-100 pb-6 lg:pb-0 lg:pl-6">
            <h2 className="text-3xl font-black text-gray-900">{title}</h2>
            {description ? <p className="text-gray-600 leading-7">{description}</p> : null}
            <p className="text-sm text-gray-500">Responses are sent instantly to your dashboard integrations.</p>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                <FormFieldInput field={field} />
              </div>
            ))}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
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
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {description ? <p className="mt-2 text-gray-600">{description}</p> : null}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field.id}>
                <label htmlFor={field.id} className="mb-1 block text-sm text-gray-600">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                <FormFieldInput field={field} compact />
              </div>
            ))}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {success ? <p className="text-sm text-green-700">{success}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full border border-gray-900 text-gray-900 px-6 py-2.5 text-sm font-semibold hover:bg-gray-900 hover:text-white transition disabled:opacity-50"
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
      <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
        {description ? <p className="mt-2 text-gray-600">{description}</p> : null}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="mb-1 block text-sm font-medium text-gray-700">
                {field.label}
                {field.required ? " *" : ""}
              </label>
              <FormFieldInput field={field} />
            </div>
          ))}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {success ? <p className="text-sm text-green-700">{success}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-gray-900 hover:bg-black text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? "Submitting..." : submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}
