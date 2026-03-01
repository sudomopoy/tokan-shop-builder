import type { Metadata } from "next";
import type { PageConfig } from "@/themes/types";
import type { WidgetDataMap } from "./fetchPageWidgetData";
import { resolveTemplateString } from "@/themes/runtime/template";
import { DEPLOY_OG_LOCALE } from "@/lib/i18n/deployment";
import { localizeValue, pickByLocale } from "@/lib/i18n/localize";

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Resolve SEO metadata from page config and widget data.
 * Supports template syntax: {{ data.product.detail.title }}
 * Auto-fallback: uses widget data when meta fields are empty.
 */
export function resolvePageMetadata(
  pageConfig: PageConfig,
  widgetData: WidgetDataMap
): Metadata {
  const localizedPageConfig = localizeValue(pageConfig);
  const localizedWidgetData = localizeValue(widgetData);
  const tplData = { data: localizedWidgetData };

  const rawTitle = toText(localizedPageConfig.metaTitle ?? localizedPageConfig.title ?? "");
  const rawDesc = toText(localizedPageConfig.metaDescription ?? localizedPageConfig.description ?? "");
  const rawKeywords = toText(localizedPageConfig.metaKeywords ?? "");

  let title = rawTitle.includes("{{") ? resolveTemplateString(rawTitle, tplData) : rawTitle;
  let description = rawDesc.includes("{{") ? resolveTemplateString(rawDesc, tplData) : rawDesc;
  let keywords = rawKeywords.includes("{{") ? resolveTemplateString(rawKeywords, tplData) : rawKeywords;

  // Auto SEO from widget data when empty
  const product = (localizedWidgetData.product as Record<string, unknown>)?.["detail"] as
    | { title?: string; short_description?: string }
    | undefined;
  const blog = (localizedWidgetData.blog as Record<string, unknown>)?.["detail"] as
    | { title?: string; description?: string; meta_title?: string; meta_description?: string }
    | undefined;

  if (!title) {
    if (product?.title) title = product.title;
    else if (blog?.meta_title) title = blog.meta_title;
    else if (blog?.title) title = blog.title;
    else if (localizedPageConfig.title) title = localizedPageConfig.title;
    else {
      title = pickByLocale({
        fa: "فروشگاه",
        en: "Store",
      });
    }
  }
  if (!description) {
    if (product?.short_description) description = product.short_description;
    else if (blog?.meta_description) description = blog.meta_description;
    else if (blog?.description) description = blog.description;
    else if (localizedPageConfig.description) description = localizedPageConfig.description;
  }

  title =
    title?.trim() ||
    pickByLocale({
      fa: "فروشگاه",
      en: "Store",
    });
  description = truncate(description?.trim() || "", 160);

  return {
    title,
    description: description || undefined,
    keywords: keywords?.trim() || undefined,
    openGraph: {
      title,
      description: description || undefined,
      type: "website",
      locale: DEPLOY_OG_LOCALE,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
