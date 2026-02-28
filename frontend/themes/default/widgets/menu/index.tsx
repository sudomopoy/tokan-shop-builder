"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { menuApi, type Menu, type MenuItem } from "@/lib/api/menuApi";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import type { WidgetConfig } from "@/themes/types";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function extractItemUrl(item: MenuItem): string {
  return item.url || item.page_path || "#";
}

function renderNestedList(items: MenuItem[], depth = 0): JSX.Element {
  return (
    <ul className={`space-y-2 ${depth > 0 ? "mr-5 border-r border-gray-200 pr-3" : ""}`}>
      {items.map((item) => {
        const children = Array.isArray(item.children) ? item.children : [];
        return (
          <li key={item.id}>
            <Link
              href={extractItemUrl(item)}
              className="text-sm text-gray-700 hover:text-blue-700 transition-colors"
            >
              {item.resolved_title || item.title || "Untitled"}
            </Link>
            {children.length > 0 ? renderNestedList(children, depth + 1) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function MenuWidget({ config }: { config?: WidgetConfig }) {
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
      .then((result) => {
        if (!mounted) return;
        setMenu(result);
        setData("menu", {
          ...(data?.menu as Record<string, unknown>),
          [menuId]: result,
        });
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Menu widget error:", err);
        setError("Failed to load menu.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId, ssrMenu]);

  const menuItems = useMemo(() => {
    const rawItems = Array.isArray(menu?.items) ? menu.items : [];
    if (!showChildren) {
      return rawItems.map((item) => ({ ...item, children: [] }));
    }
    return rawItems;
  }, [menu?.items, showChildren]);

  if (!menuId) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
          Select a menu from the page builder.
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl text-sm text-gray-500">Loading menu...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-xl bg-red-50 text-red-700 p-4 text-sm">{error}</div>
      </section>
    );
  }

  if (menuItems.length === 0) {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-xl bg-gray-50 text-gray-600 p-4 text-sm">
          This menu has no items yet.
        </div>
      </section>
    );
  }

  if (styleKey === "card-grid") {
    return (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          {title ? <h2 className="text-2xl font-bold text-gray-900">{title}</h2> : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => {
              const children = Array.isArray(item.children) ? item.children : [];
              return (
                <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <Link href={extractItemUrl(item)} className="font-semibold text-gray-900 hover:text-blue-700">
                    {item.resolved_title || item.title || "Untitled"}
                  </Link>
                  {showChildren && children.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-sm text-gray-600">
                      {children.map((child) => (
                        <li key={child.id}>
                          <Link href={extractItemUrl(child)} className="hover:text-blue-700">
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
      <section className="px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
          {title ? <h2 className="text-xl font-semibold text-gray-900">{title}</h2> : null}
          {renderNestedList(menuItems)}
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-3">
        {title ? <h2 className="text-xl font-semibold text-gray-900">{title}</h2> : null}
        <div className="flex flex-wrap gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={extractItemUrl(item)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              {item.resolved_title || item.title || "Untitled"}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
