"use client";

import type { WidgetConfig } from "@/themes/types";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function alignment(value: unknown): string {
  if (value === "center") return "text-center";
  if (value === "end") return "text-left";
  return "text-right";
}

export default function ServaTextWidget({ config }: { config?: WidgetConfig }) {
  const title = asString(config?.widgetConfig?.title);
  const subtitle = asString(config?.widgetConfig?.subtitle);
  const body = asString(config?.widgetConfig?.body);
  const styleKey = asString(config?.widgetConfig?.style_key) || "classic";
  const align = alignment(config?.widgetConfig?.align);

  if (!title && !subtitle && !body) {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-8 text-sm text-amber-700">
          Empty text widget. Configure content from the page builder.
        </div>
      </section>
    );
  }

  if (styleKey === "highlight") {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-[2rem] bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-slate-900 p-8 md:p-12 shadow-xl">
          {subtitle ? <p className={`text-xs font-semibold tracking-[0.2em] uppercase ${align}`}>{subtitle}</p> : null}
          {title ? <h2 className={`mt-3 text-3xl md:text-5xl font-black ${align}`}>{title}</h2> : null}
          {body ? (
            <div
              className={`prose prose-slate max-w-none mt-6 ${align}`}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : null}
        </div>
      </section>
    );
  }

  if (styleKey === "split") {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-slate-900 text-white p-7 md:p-10">
              {subtitle ? <p className="text-xs uppercase tracking-[0.2em] text-amber-300">{subtitle}</p> : null}
              {title ? <h2 className="mt-3 text-2xl md:text-4xl font-bold">{title}</h2> : null}
            </div>
            <div className="p-7 md:p-10">
              {body ? (
                <div className="prose max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: body }} />
              ) : (
                <p className="text-sm text-slate-500">No body content provided.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-7 md:p-10 shadow-sm">
        {subtitle ? <p className={`text-sm text-amber-600 ${align}`}>{subtitle}</p> : null}
        {title ? <h2 className={`mt-1 text-3xl font-bold text-slate-900 ${align}`}>{title}</h2> : null}
        {body ? (
          <div
            className={`prose max-w-none mt-6 text-slate-700 ${align}`}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : null}
      </div>
    </section>
  );
}
