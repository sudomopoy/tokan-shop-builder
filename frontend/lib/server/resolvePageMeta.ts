import type { Metadata } from "next";
import type { PageConfig } from "@/themes/types";
import type { WidgetDataMap } from "./fetchPageWidgetData";
import { resolveTemplateString } from "@/themes/runtime/template";

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
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
  const tplData = { data: widgetData };

  const rawTitle = pageConfig.metaTitle ?? pageConfig.title ?? "";
  const rawDesc = pageConfig.metaDescription ?? pageConfig.description ?? "";
  const rawKeywords = pageConfig.metaKeywords ?? "";

  let title = rawTitle.includes("{{") ? resolveTemplateString(rawTitle, tplData) : rawTitle;
  let description = rawDesc.includes("{{") ? resolveTemplateString(rawDesc, tplData) : rawDesc;
  let keywords = rawKeywords.includes("{{") ? resolveTemplateString(rawKeywords, tplData) : rawKeywords;

  // Auto SEO from widget data when empty
  const product = (widgetData.product as Record<string, unknown>)?.["detail"] as { title?: string; short_description?: string } | undefined;
  const blog = (widgetData.blog as Record<string, unknown>)?.["detail"] as { title?: string; description?: string; meta_title?: string; meta_description?: string } | undefined;

  if (!title) {
    if (product?.title) title = product.title;
    else if (blog?.meta_title) title = blog.meta_title;
    else if (blog?.title) title = blog.title;
    else if (pageConfig.title) title = pageConfig.title;
    else title = "فروشگاه";
  }
  if (!description) {
    if (product?.short_description) description = product.short_description;
    else if (blog?.meta_description) description = blog.meta_description;
    else if (blog?.description) description = blog.description;
    else if (pageConfig.description) description = pageConfig.description;
  }

  title = title?.trim() || "فروشگاه";
  description = truncate(description?.trim() || "", 160);

  return {
    title,
    description: description || undefined,
    keywords: keywords?.trim() || undefined,
    openGraph: {
      title,
      description: description || undefined,
      type: "website",
      locale: "fa_IR",
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
