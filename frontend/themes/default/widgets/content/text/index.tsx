"use client";

import type { WidgetConfig } from "@/themes/types";
import { DEPLOY_DIRECTION } from "@/lib/i18n/deployment";
import { localizedString } from "@/lib/i18n/localize";
import { tFrontend } from "@/lib/i18n/messages";

function alignClass(align: unknown): string {
  if (align === "center") return "text-center";
  if (align === "end") return DEPLOY_DIRECTION === "rtl" ? "text-left" : "text-right";
  if (align === "start") return DEPLOY_DIRECTION === "rtl" ? "text-right" : "text-left";
  return DEPLOY_DIRECTION === "rtl" ? "text-right" : "text-left";
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export default function ContentTextWidget({ config }: { config?: WidgetConfig }) {
  const title = localizedString(config?.widgetConfig?.title);
  const subtitle = localizedString(config?.widgetConfig?.subtitle);
  const body = localizedString(config?.widgetConfig?.body);
  const styleKey = asString(config?.widgetConfig?.style_key) || "classic";
  const align = alignClass(config?.widgetConfig?.align);

  if (!title && !subtitle && !body) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          {tFrontend("widget.text.empty")}
        </div>
      </section>
    );
  }

  if (styleKey === "highlight") {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-8 md:p-12 shadow-xl">
          {subtitle ? <p className={`text-sm uppercase tracking-widest text-sky-200 ${align}`}>{subtitle}</p> : null}
          {title ? <h2 className={`mt-2 text-2xl md:text-4xl font-black ${align}`}>{title}</h2> : null}
          {body ? (
            <div
              className={`prose prose-invert max-w-none mt-6 ${align}`}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : null}
        </div>
      </section>
    );
  }

  if (styleKey === "split") {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl border border-gray-200 p-6 md:p-8 bg-white">
          <div className="space-y-3 border-b md:border-b-0 md:border-l border-gray-100 pb-4 md:pb-0 md:pl-6">
            {subtitle ? <p className="text-xs text-blue-600 font-semibold tracking-wide uppercase">{subtitle}</p> : null}
            {title ? <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2> : null}
          </div>
          {body ? (
            <div
              className="prose max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <p className="text-sm text-gray-500">
              {tFrontend("widget.text.noBody")}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
        {subtitle ? <p className={`text-sm text-gray-500 mb-2 ${align}`}>{subtitle}</p> : null}
        {title ? <h2 className={`text-2xl md:text-3xl font-bold text-gray-900 ${align}`}>{title}</h2> : null}
        {body ? (
          <div
            className={`prose max-w-none mt-6 text-gray-700 ${align}`}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : null}
      </div>
    </section>
  );
}
