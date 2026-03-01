import { PropsWithChildren } from "react";

  
/**
 * widgetConfig may include pathParams from dynamic routes, e.g.:
 * { pathParams: { id: 123, slug: "my-product" }, id: 123, slug: "my-product" }
 */
export type WidgetConfig = {
    index?: number;
    widget: string;
    componentsConfig?: Record<string, unknown>;
    extraRequestParams?: Record<string, Record<string, unknown>>;
    widgetConfig?: Record<string, unknown>;
  };
  
export type PathParams = Record<string, string | number>;

export type PageConfig = {
    /**
     * Optional fields returned by management endpoints (dashboard).
     * Storefront renderer only relies on `page/layout/content` so these are additive.
     */
    id?: string | number;
    path?: string;
    isActive?: boolean;
    page: string;
    pathParams?: PathParams;
    title?: string | null;
    description?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    metaKeywords?: string | null;
    deployLocale?: "fa" | "en";
    deployDirection?: "rtl" | "ltr";
    layout: WidgetConfig | null;
    content: Array<WidgetConfig | null>;
  };

export type ThemeManifest = {
    id: string;
    provider: React.ComponentType<PropsWithChildren>;
}
