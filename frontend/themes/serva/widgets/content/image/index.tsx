"use client";

import type { WidgetConfig } from "@/themes/types";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function ServaImageWidget({ config }: { config?: WidgetConfig }) {
  const imageUrl = asString(config?.widgetConfig?.image_url);
  const alt = asString(config?.widgetConfig?.alt) || "Widget image";
  const caption = asString(config?.widgetConfig?.caption);
  const linkUrl = asString(config?.widgetConfig?.link_url);
  const styleKey = asString(config?.widgetConfig?.style_key) || "cover";
  const height = asNumber(config?.widgetConfig?.height, 420);

  if (!imageUrl) {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">
          No image selected for this widget.
        </div>
      </section>
    );
  }

  const imageNode = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={alt} className="w-full h-full object-cover" loading="lazy" />
  );
  const wrapped = linkUrl ? <a href={linkUrl} className="block h-full w-full">{imageNode}</a> : imageNode;

  if (styleKey === "framed") {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-3xl bg-slate-950 p-3 md:p-4 shadow-2xl">
          <div className="rounded-[1.4rem] overflow-hidden border border-white/20" style={{ height }}>
            {wrapped}
          </div>
          {caption ? <p className="mt-4 text-sm text-slate-300 text-center">{caption}</p> : null}
        </div>
      </section>
    );
  }

  if (styleKey === "floating") {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl relative">
          <div className="absolute -inset-3 bg-gradient-to-r from-amber-300/70 via-orange-200/70 to-rose-200/70 blur-xl rounded-[2rem]" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/60 shadow-2xl" style={{ height }}>
            {wrapped}
          </div>
          {caption ? <p className="mt-3 text-sm text-slate-700">{caption}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="py-10">
      <div className="w-full overflow-hidden" style={{ height }}>
        {wrapped}
      </div>
      {caption ? <p className="mt-3 text-sm text-center text-slate-600 px-4">{caption}</p> : null}
    </section>
  );
}
