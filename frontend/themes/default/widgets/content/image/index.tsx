"use client";

import type { WidgetConfig } from "@/themes/types";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default function ContentImageWidget({ config }: { config?: WidgetConfig }) {
  const imageUrl = asString(config?.widgetConfig?.image_url);
  const alt = asString(config?.widgetConfig?.alt) || "Widget image";
  const caption = asString(config?.widgetConfig?.caption);
  const linkUrl = asString(config?.widgetConfig?.link_url);
  const styleKey = asString(config?.widgetConfig?.style_key) || "cover";
  const height = asNumber(config?.widgetConfig?.height, 420);

  if (!imageUrl) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          No image selected. Set `image_url` from widget settings.
        </div>
      </section>
    );
  }

  const imageElement = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );

  const wrapper = linkUrl ? (
    <a href={linkUrl} className="block h-full w-full">
      {imageElement}
    </a>
  ) : (
    imageElement
  );

  if (styleKey === "framed") {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-gray-200 bg-white p-4 md:p-6 shadow-lg">
          <div className="overflow-hidden rounded-2xl" style={{ height }}>
            {wrapper}
          </div>
          {caption ? <p className="mt-4 text-sm text-gray-600 text-center">{caption}</p> : null}
        </div>
      </section>
    );
  }

  if (styleKey === "floating") {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl relative">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-200 to-cyan-200 blur-lg opacity-70" />
          <div className="relative overflow-hidden rounded-3xl border border-white/70 shadow-2xl" style={{ height }}>
            {wrapper}
          </div>
          {caption ? <p className="mt-4 text-sm text-gray-700">{caption}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="relative w-full overflow-hidden" style={{ height }}>
        {wrapper}
      </div>
      {caption ? <p className="mt-3 text-sm text-gray-600 text-center px-4">{caption}</p> : null}
    </section>
  );
}
