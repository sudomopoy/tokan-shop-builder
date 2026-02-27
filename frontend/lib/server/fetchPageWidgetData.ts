import type { PageConfig, WidgetConfig } from "@/themes/types";
import { createServerApi } from "@/lib/api/serverApi";

export type WidgetDataMap = Record<string, unknown>;

function setNested(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".").filter(Boolean);
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const next = cur[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

/**
 * Pre-fetch all widget data needed for SSR based on page content and pathParams.
 * Returns nested structure compatible with PageRuntimeProvider (e.g. product.detail, category.tree).
 */
export async function fetchPageWidgetData(
  pageConfig: PageConfig,
  hostHeader: string | null
): Promise<WidgetDataMap> {
  const api = createServerApi(hostHeader);
  const pathParams = pageConfig.pathParams ?? {};
  const content = pageConfig.content ?? [];
  const result: WidgetDataMap = {};

  const promises: Promise<void>[] = [];

  for (const item of content) {
    const cfg = item as WidgetConfig;
    if (!cfg?.widget) continue;

    const wc = cfg.widgetConfig ?? {};
    const id = pathParams.id ?? wc.id;
    const slug = pathParams.slug ?? wc.slug;
    const sliderId = typeof wc.slider_id === "string" ? wc.slider_id : null;

    switch (cfg.widget) {
      case "product.detail":
        if (id != null) {
          promises.push(
            api.getProduct(id).then((p) => {
              if (p) setNested(result, "product.detail", p);
            })
          );
        }
        break;
      case "product.listview":
        promises.push(
          api.getProductList(cfg.extraRequestParams?.["product/"] as Record<string, unknown>).then((r) => {
            setNested(result, "product.listview", r);
          })
        );
        break;
      case "category.listview":
      case "category.search": {
        const mod = (wc.module as string) || "STORE";
        promises.push(
          api.getCategoryTree(mod).then((tree) => {
            setNested(result, `category.tree.${mod}`, tree);
          })
        );
        break;
      }
      case "blog.detail":
        if (slug) {
          promises.push(
            api.getArticle(slug).then((a) => {
              if (a) setNested(result, "blog.detail", a);
            })
          );
        }
        break;
      case "slider":
        if (sliderId) {
          promises.push(
            api.getSlider(sliderId).then((s) => {
              if (s) setNested(result, `slider.${sliderId}`, s);
            })
          );
        }
        break;
      default:
        break;
    }
  }

  await Promise.all(promises);
  return result;
}
