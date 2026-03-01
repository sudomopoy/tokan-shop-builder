"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { WidgetConfig } from "@/themes/types";
import { categoryApi, type Category } from "@/lib/api/categoryApi";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

function flattenCategoryTree(items: Category[]): Category[] {
  const out: Category[] = [];
  for (const c of items) {
    out.push(c);
    if (c.children?.length) out.push(...flattenCategoryTree(c.children));
  }
  return out;
}

function getCategoryLink(cat: Category, module: string): string {
  const id = cat.id;
  if (module === "blog" || module === "BLOG") return `/blog?categories=${id}`;
  return `/products/search?categories=${id}`;
}

function CategoryCard({ category, module }: { category: Category; module: string }) {
  const iconUrl = category.icon_url || category.icon?.file;
  const link = getCategoryLink(category, module);

  const iconNode = iconUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={iconUrl.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_BASE || ""}${iconUrl}` : iconUrl}
      alt={category.name}
      className="w-12 h-12 object-contain"
    />
  ) : (
    <FontAwesomeIcon icon={faFolder} className="text-3xl text-gray-400" />
  );

  return (
    <Link
      href={link}
      className="group bg-white rounded-2xl p-4 text-center hover:shadow-lg transition duration-300 border border-transparent hover:border-primary/20 block"
    >
      <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition duration-300">
        <div className="group-hover:!text-white transition">{iconNode}</div>
      </div>
      <h4 className="font-bold text-dark text-sm group-hover:text-primary transition">{category.name}</h4>
    </Link>
  );
}

export default function CategoryListView({ config }: { config?: WidgetConfig }) {
  const { data } = usePageRuntime();
  const moduleFilter = (config?.widgetConfig?.module as string) || "STORE";
  const parentOnly = (config?.widgetConfig?.root_only as boolean) ?? true;
  const title = (config?.widgetConfig?.title as string) || "دسته‌بندی‌های محبوب";
  const limit = Number(config?.widgetConfig?.limit ?? 12) || 12;

  const categoryData = data?.category as Record<string, unknown> | undefined;
  const treeByModule = categoryData?.tree as Record<string, Category[]> | undefined;
  const ssrTree = treeByModule?.[moduleFilter] ?? (categoryData?.tree as Category[] | undefined);

  const [loading, setLoading] = useState(!ssrTree?.length);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>(() => {
    if (ssrTree?.length) {
      const filtered =
        Array.isArray(ssrTree) && ssrTree.length > 0 ? ssrTree.filter((c) => c.module === moduleFilter) : [];
      return parentOnly ? filtered : flattenCategoryTree(filtered);
    }
    return [];
  });

  useEffect(() => {
    if (ssrTree?.length) {
      const filtered =
        Array.isArray(ssrTree) && ssrTree.length > 0 ? ssrTree.filter((c) => c.module === moduleFilter) : [];
      setCategories(parentOnly ? filtered : flattenCategoryTree(filtered));
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    categoryApi
      .tree({ module: moduleFilter })
      .then((tree) => {
        if (!mounted) return;
        const filtered =
          Array.isArray(tree) && tree.length > 0 ? tree.filter((c) => c.module === moduleFilter) : [];
        setCategories(parentOnly ? filtered : flattenCategoryTree(filtered));
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError(tFrontendAuto("fe.e3ebbbaa2d1b"));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [moduleFilter, parentOnly, ssrTree]);

  const shown = useMemo(() => categories.slice(0, limit), [categories, limit]);

  return (
    <section className="container">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-dark">{title}</h2>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500">{tFrontendAuto("fe.3e07344c65a3")}</div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-8 text-center text-red-600">{error}</div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500">{tFrontendAuto("fe.f460f71ab096")}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {shown.map((cat) => (
            <CategoryCard key={cat.id} category={cat} module={moduleFilter} />
          ))}
        </div>
      )}
    </section>
  );
}
