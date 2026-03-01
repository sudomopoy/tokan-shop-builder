"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { menuApi, type Menu, type MenuItem } from "@/lib/api/menuApi";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import type { WidgetConfig } from "@/themes/types";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function itemUrl(item: MenuItem): string {
  return item.url || item.page_path || "#";
}

function Nested({ items, depth = 0 }: { items: MenuItem[]; depth?: number }) {
  return (
    <ul className={`space-y-2 ${depth > 0 ? "mr-4 border-r border-slate-300 pr-3" : ""}`}>
      {items.map((item) => {
        const children = Array.isArray(item.children) ? item.children : [];
        return (
          <li key={item.id}>
            <Link href={itemUrl(item)} className="text-sm text-slate-700 hover:text-orange-600 transition-colors">
              {item.resolved_title || item.title || "Untitled"}
            </Link>
            {children.length > 0 ? <Nested items={children} depth={depth + 1} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function ServaMenuWidget({ config }: { config?: WidgetConfig }) {
  const menuId = asString(config?.widgetConfig?.menu_id);
  const title = asString(config?.widgetConfig?.title);
  const styleKey = asString(config?.widgetConfig?.style_key) || "horizontal";
  const showChildren =
    typeof config?.widgetConfig?.show_children === "boolean"
      ? Boolean(config?.widgetConfig?.show_children)
      : true;

  const { data, setData } = usePageRuntime();
  const ssrMenu = menuId
    ? ((data?.menu as Record<string, unknown>)?.[menuId] as Menu | undefined)
    : undefined;

  const [menu, setMenu] = useState<Menu | null>(ssrMenu ?? null);
  const [loading, setLoading] = useState(!ssrMenu && Boolean(menuId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!menuId) {
      setMenu(null);
      setLoading(false);
      return;
    }
    if (ssrMenu) {
      setMenu(ssrMenu);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    menuApi
      .get(menuId)
      .then((res) => {
        if (!mounted) return;
        setMenu(res);
        setData("menu", {
          ...(data?.menu as Record<string, unknown>),
          [menuId]: res,
        });
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Serva menu widget error:", err);
        setError(tFrontendAuto("fe.c4b0666bcf0a"));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId, ssrMenu]);

  const items = useMemo(() => {
    const raw = Array.isArray(menu?.items) ? menu.items : [];
    if (!showChildren) {
      return raw.map((item) => ({ ...item, children: [] }));
    }
    return raw;
  }, [menu?.items, showChildren]);

  if (!menuId) {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Select a menu from builder options.
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl text-sm text-slate-500">{tFrontendAuto("fe.0423c6acd237")}</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-xl bg-red-50 text-red-700 p-4 text-sm">{error}</div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl rounded-xl bg-slate-50 text-slate-600 p-4 text-sm">
          This menu has no items.
        </div>
      </section>
    );
  }

  if (styleKey === "card-grid") {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-4">
          {title ? <h2 className="text-2xl font-black text-slate-900">{title}</h2> : null}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item) => {
              const children = Array.isArray(item.children) ? item.children : [];
              return (
                <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <Link href={itemUrl(item)} className="font-semibold text-slate-900 hover:text-orange-600">
                    {item.resolved_title || item.title || "Untitled"}
                  </Link>
                  {showChildren && children.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-sm text-slate-600">
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link href={itemUrl(child)} className="hover:text-orange-600">
                            {child.resolved_title || child.title || "Untitled"}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  if (styleKey === "stacked") {
    return (
      <section className="px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6">
          {title ? <h2 className="text-xl font-semibold text-slate-900 mb-4">{title}</h2> : null}
          <Nested items={items} />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-3">
        {title ? <h2 className="text-xl font-semibold text-slate-900">{title}</h2> : null}
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={itemUrl(item)}
              className="rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-orange-500 transition-colors"
            >
              {item.resolved_title || item.title || "Untitled"}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
