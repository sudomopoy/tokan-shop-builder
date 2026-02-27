"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import { pageApi, storeApi } from "@/lib/api";
import { revalidatePage, revalidateStorePages } from "@/lib/server/storefrontCache";
import type { PageConfig } from "@/themes/types";
import type { WidgetDto, WidgetTypeDto } from "@/lib/api/pageApi";
import JsonEditorField from "@/components/dashboard/JsonEditorField";
import SearchableSelect from "@/components/dashboard/SearchableSelect";

type PageFormState = {
  path: string;
  title: string;
  description: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  is_active: boolean;
};

function normalizePath(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function prettyJson(v: unknown): string {
  if (!v || typeof v !== "object") return "{}";
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "{}";
  }
}

function parseJsonObject(text: string): Record<string, unknown> {
  const raw = (text || "").trim();
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON باید یک object باشد");
  }
  return parsed as Record<string, unknown>;
}

function resolvePagePath(page: PageConfig | null): string {
  if (!page) return "/";
  const anyPage = page as any;
  return normalizePath(anyPage.path ?? page.page ?? "/");
}

export default function DashboardPageBuilderEdit() {
  const params = useParams<{ id: string }>();
  const pageId = params?.id;

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<PageConfig | null>(null);
  const [pageForm, setPageForm] = useState<PageFormState>({
    path: "/",
    title: "",
    description: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    is_active: true,
  });
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageSaving, setPageSaving] = useState(false);

  const [widgetTypes, setWidgetTypes] = useState<WidgetTypeDto[]>([]);
  const [widgets, setWidgets] = useState<WidgetDto[]>([]);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [widgetBusy, setWidgetBusy] = useState(false);

  const [previewPath, setPreviewPath] = useState<string>("");
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [originalPath, setOriginalPath] = useState<string>("/");

  const widgetTypesById = useMemo(() => {
    const map = new Map<string, WidgetTypeDto>();
    for (const t of widgetTypes) map.set(String(t.id), t);
    return map;
  }, [widgetTypes]);

  const layoutWidgets = useMemo(() => {
    return widgets.filter((w) => widgetTypesById.get(String(w.widget_type))?.is_layout);
  }, [widgets, widgetTypesById]);

  const contentWidgets = useMemo(() => {
    return widgets
      .filter((w) => !widgetTypesById.get(String(w.widget_type))?.is_layout)
      .slice()
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }, [widgets, widgetTypesById]);

  const activeWidgetTypes = useMemo(() => widgetTypes.filter((t) => t.is_active), [widgetTypes]);
  const activeLayoutTypes = useMemo(
    () => activeWidgetTypes.filter((t) => t.is_layout),
    [activeWidgetTypes],
  );
  const activeContentTypes = useMemo(
    () => activeWidgetTypes.filter((t) => !t.is_layout),
    [activeWidgetTypes],
  );

  const [newWidgetForm, setNewWidgetForm] = useState<{
    kind: "content" | "layout";
    widgetTypeId: string;
    widget_config: string;
    components_config: string;
    extra_request_params: string;
  }>({
    kind: "content",
    widgetTypeId: "",
    widget_config: "{}",
    components_config: "{}",
    extra_request_params: "{}",
  });

  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editWidgetForm, setEditWidgetForm] = useState<{
    widget_config: string;
    components_config: string;
    extra_request_params: string;
  }>({
    widget_config: "{}",
    components_config: "{}",
    extra_request_params: "{}",
  });

  const fetchAll = async () => {
    if (!pageId) return;
    setLoading(true);
    setPageError(null);
    setWidgetError(null);
    try {
      const [pageRes, widgetTypesRes, widgetsRes] = await Promise.all([
        pageApi.get(pageId),
        pageApi.listWidgetTypes(),
        pageApi.listWidgets({ page_id: pageId, page_size: 500 }),
      ]);
      setPage(pageRes);
      setWidgetTypes(widgetTypesRes ?? []);
      setWidgets(widgetsRes.results ?? []);

      const anyPage = pageRes as any;
      const initialPath = normalizePath(anyPage.path ?? pageRes.page ?? "/");
      setOriginalPath(initialPath);

      setPageForm({
        path: initialPath,
        title: safeString(pageRes.title),
        description: safeString(pageRes.description),
        meta_title: safeString((pageRes as any).metaTitle),
        meta_description: safeString((pageRes as any).metaDescription),
        meta_keywords: safeString((pageRes as any).metaKeywords),
        is_active: typeof (pageRes as any).isActive === "boolean" ? (pageRes as any).isActive : true,
      });
      setPreviewPath(initialPath.includes(":") ? "" : initialPath);
    } catch (err) {
      console.error(err);
      setPage(null);
      setWidgetTypes([]);
      setWidgets([]);
      setPageError("خطا در دریافت اطلاعات صفحه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const getStoreDomain = async (): Promise<string | null> => {
    try {
      const store = await storeApi.getCurrentStore();
      if (!store) return null;
      return store.internal_domain || (store.external_domain ? `${store.name}.${store.external_domain}` : null);
    } catch {
      return null;
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageId) return;
    setPageSaving(true);
    setPageError(null);
    try {
      const newPath = normalizePath(pageForm.path);
      const updated = await pageApi.update(pageId, {
        path: newPath,
        title: pageForm.title || null,
        description: pageForm.description || null,
        meta_title: pageForm.meta_title || null,
        meta_description: pageForm.meta_description || null,
        meta_keywords: pageForm.meta_keywords || null,
        is_active: pageForm.is_active,
      });
      setPage(updated);
      setOriginalPath(newPath);
      const path = resolvePagePath(updated);
      setPreviewPath(path.includes(":") ? previewPath : path);
      const domain = await getStoreDomain();
      if (domain) {
        if (newPath !== originalPath) {
          await revalidateStorePages(domain);
        } else {
          await revalidatePage(domain, newPath);
        }
      }
      alert("اطلاعات صفحه ذخیره شد");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.path?.[0] ||
        err?.response?.data?.detail ||
        "خطا در ذخیره اطلاعات صفحه";
      setPageError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setPageSaving(false);
    }
  };

  const openWidgetEditor = (widget: WidgetDto) => {
    setEditingWidgetId(String(widget.id));
    setEditWidgetForm({
      widget_config: prettyJson(widget.widget_config),
      components_config: prettyJson(widget.components_config),
      extra_request_params: prettyJson(widget.extra_request_params),
    });
  };

  const closeWidgetEditor = () => {
    setEditingWidgetId(null);
  };

  const refreshWidgets = async () => {
    if (!pageId) return;
    setWidgetBusy(true);
    setWidgetError(null);
    try {
      const widgetsRes = await pageApi.listWidgets({ page_id: pageId, page_size: 500 });
      setWidgets(widgetsRes.results ?? []);
    } catch (err) {
      console.error(err);
      setWidgetError("خطا در دریافت لیست ویجت‌ها");
    } finally {
      setWidgetBusy(false);
    }
  };

  const handleCreateWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageId) return;
    setWidgetBusy(true);
    setWidgetError(null);
    try {
      const widgetTypeId = newWidgetForm.widgetTypeId;
      if (!widgetTypeId) throw new Error("نوع ویجت را انتخاب کنید");

      const widget_config = parseJsonObject(newWidgetForm.widget_config);
      const components_config = parseJsonObject(newWidgetForm.components_config);
      const extra_request_params = parseJsonObject(newWidgetForm.extra_request_params);

      const isLayout = newWidgetForm.kind === "layout";
      if (isLayout && layoutWidgets.length > 0) {
        throw new Error("برای هر صفحه فقط یک ویجت Layout در نظر گرفته شده است.");
      }

      const maxIndex = (isLayout ? layoutWidgets : contentWidgets).reduce(
        (max, w) => Math.max(max, w.index ?? 0),
        0,
      );

      await pageApi.createWidget({
        page: pageId,
        widget_type: widgetTypeId,
        index: isLayout ? 0 : maxIndex + 1,
        is_active: true,
        widget_config,
        components_config,
        extra_request_params,
      });

      setNewWidgetForm((f) => ({ ...f, widgetTypeId: "", widget_config: "{}", components_config: "{}", extra_request_params: "{}" }));
      await refreshWidgets();
      const domain = await getStoreDomain();
      await revalidatePage(domain, resolvePagePath(page));
    } catch (err: any) {
      console.error(err);
      setWidgetError(err?.message ? String(err.message) : "خطا در ایجاد ویجت");
    } finally {
      setWidgetBusy(false);
    }
  };

  const handleDeleteWidget = async (widget: WidgetDto) => {
    if (!confirm("آیا از حذف این ویجت اطمینان دارید؟")) return;
    setWidgetBusy(true);
    setWidgetError(null);
    try {
      await pageApi.deleteWidget(widget.id);
      await refreshWidgets();
      const domain = await getStoreDomain();
      await revalidatePage(domain, resolvePagePath(page));
    } catch (err) {
      console.error(err);
      setWidgetError("خطا در حذف ویجت");
    } finally {
      setWidgetBusy(false);
    }
  };

  const handleSaveWidget = async () => {
    if (!editingWidgetId) return;
    setWidgetBusy(true);
    setWidgetError(null);
    try {
      const widget_config = parseJsonObject(editWidgetForm.widget_config);
      const components_config = parseJsonObject(editWidgetForm.components_config);
      const extra_request_params = parseJsonObject(editWidgetForm.extra_request_params);

      await pageApi.updateWidget(editingWidgetId, {
        widget_config,
        components_config,
        extra_request_params,
      });

      await refreshWidgets();
      const domain = await getStoreDomain();
      await revalidatePage(domain, resolvePagePath(page));
      closeWidgetEditor();
    } catch (err: any) {
      console.error(err);
      setWidgetError(err?.message ? String(err.message) : "خطا در ذخیره ویجت");
    } finally {
      setWidgetBusy(false);
    }
  };

  const swapWidgetIndex = async (a: WidgetDto, b: WidgetDto) => {
    setWidgetBusy(true);
    setWidgetError(null);
    try {
      await Promise.all([
        pageApi.updateWidget(a.id, { index: b.index }),
        pageApi.updateWidget(b.id, { index: a.index }),
      ]);
      await refreshWidgets();
      const domain = await getStoreDomain();
      await revalidatePage(domain, resolvePagePath(page));
    } catch (err) {
      console.error(err);
      setWidgetError("خطا در تغییر ترتیب ویجت‌ها");
    } finally {
      setWidgetBusy(false);
    }
  };

  const updateLayoutToggle = async (key: "header" | "footer", value: boolean) => {
    const layout = layoutWidgets[0];
    if (!layout) return;
    setWidgetBusy(true);
    setWidgetError(null);
    try {
      const nextConfig: Record<string, unknown> = {
        ...(layout.widget_config ?? {}),
        [key]: value,
      };
      await pageApi.updateWidget(layout.id, { widget_config: nextConfig });
      await refreshWidgets();
      const domain = await getStoreDomain();
      await revalidatePage(domain, resolvePagePath(page));
    } catch (err) {
      console.error(err);
      setWidgetError("خطا در ذخیره تنظیمات Layout");
    } finally {
      setWidgetBusy(false);
    }
  };

  const currentPath = resolvePagePath(page);
  const previewSrc = normalizePath(previewPath || currentPath);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pageId) {
    return <div className="text-gray-600">شناسه صفحه نامعتبر است.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/pages"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowRight className="h-5 w-5" />
            بازگشت
          </Link>
          <div>
            <h1 className="text-2xl font-bold">ویرایش صفحه</h1>
            <p className="text-sm text-gray-500 font-mono">{currentPath}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={currentPath}
            target="_blank"
            className="btn-secondary inline-flex items-center gap-2"
            rel="noreferrer"
          >
            <Eye className="h-5 w-5" />
            پیش‌نمایش در تب جدید
          </a>
          <button
            type="button"
            onClick={fetchAll}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            بروزرسانی
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Builder */}
        <div className="space-y-6">
          <form onSubmit={handleSavePage} className="card space-y-4">
            <h2 className="text-lg font-semibold">مشخصات صفحه</h2>

            {pageError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{pageError}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مسیر (Path) *
                </label>
                <input
                  value={pageForm.path}
                  onChange={(e) => setPageForm((f) => ({ ...f, path: e.target.value }))}
                  required
                  dir="ltr"
                  className="w-full ltr text-left px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان</label>
                <input
                  value={pageForm.title}
                  onChange={(e) => setPageForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea
                value={pageForm.description}
                onChange={(e) => setPageForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <details className="group">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 mb-2">
                راهنمای قالب‌های داینامیک SEO (کلیک برای نمایش)
              </summary>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-2 mb-4">
                <p>برای صفحات داینامیک (مثل جزئیات محصول/مقاله) می‌توانید از متغیرها استفاده کنید:</p>
                <ul className="list-disc list-inside space-y-1 font-mono text-xs">
                  <li><code>{"{{ data.product.detail.title }}"}</code> — عنوان محصول</li>
                  <li><code>{"{{ data.product.detail.short_description }}"}</code> — توضیح کوتاه محصول</li>
                  <li><code>{"{{ data.blog.detail.title }}"}</code> — عنوان مقاله</li>
                  <li><code>{"{{ data.blog.detail.description }}"}</code> — توضیحات مقاله</li>
                </ul>
                <p className="text-xs">اگر خالی بگذارید، به‌طور خودکار از اطلاعات ویجت صفحه پر می‌شود.</p>
              </div>
            </details>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                <input
                  value={pageForm.meta_title}
                  onChange={(e) => setPageForm((f) => ({ ...f, meta_title: e.target.value }))}
                  placeholder="مثال: {{ data.product.detail.title }}"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                <input
                  value={pageForm.meta_keywords}
                  onChange={(e) => setPageForm((f) => ({ ...f, meta_keywords: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                value={pageForm.meta_description}
                onChange={(e) => setPageForm((f) => ({ ...f, meta_description: e.target.value }))}
                placeholder="مثال: {{ data.product.detail.short_description }}"
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={pageForm.is_active}
                onChange={(e) => setPageForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              صفحه فعال باشد
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={pageSaving}
                className="btn-primary disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                {pageSaving ? "در حال ذخیره..." : "ذخیره"}
              </button>
            </div>
          </form>

          <div className="card space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">ویجت‌ها</h2>
              <button
                type="button"
                onClick={refreshWidgets}
                className="btn-secondary inline-flex items-center gap-2"
                disabled={widgetBusy}
              >
                <RefreshCw className="h-5 w-5" />
                بروزرسانی ویجت‌ها
              </button>
            </div>

            {widgetError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{widgetError}</div>
            )}

            {/* Layout widget */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold">Layout</h3>
              {layoutWidgets.length === 0 ? (
                <p className="text-sm text-gray-600">
                  هنوز هیچ ویجت Layout برای این صفحه ثبت نشده است.
                </p>
              ) : (
                layoutWidgets.slice(0, 1).map((w) => {
                  const type = widgetTypesById.get(String(w.widget_type));
                  const name = type?.name ?? w.widget_type_name ?? String(w.widget_type);
                  const headerValue = (w.widget_config as any)?.header;
                  const footerValue = (w.widget_config as any)?.footer;
                  const showHeader = typeof headerValue === "boolean" ? headerValue : true;
                  const showFooter = typeof footerValue === "boolean" ? footerValue : true;
                  const canToggle = name === "layout";
                  return (
                    <div key={String(w.id)} className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm">
                          <span className="font-medium">نوع:</span>{" "}
                          <code className="font-mono">{name}</code>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openWidgetEditor(w)}
                            className="btn-secondary text-sm"
                          >
                            ویرایش
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWidget(w)}
                            className="btn-secondary text-sm text-red-600"
                          >
                            حذف
                          </button>
                        </div>
                      </div>

                      {canToggle && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={showHeader}
                              onChange={(e) => updateLayoutToggle("header", e.target.checked)}
                              disabled={widgetBusy}
                            />
                            نمایش هدر
                          </label>
                          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={showFooter}
                              onChange={(e) => updateLayoutToggle("footer", e.target.checked)}
                              disabled={widgetBusy}
                            />
                            نمایش فوتر
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <details className="pt-2">
                <summary className="cursor-pointer text-sm font-medium inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن Layout
                </summary>
                <form onSubmit={handleCreateWidget} className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع Layout
                    </label>
                    <SearchableSelect
                      options={activeLayoutTypes.map((t) => ({
                        value: String(t.id),
                        label: t.name,
                      }))}
                      value={newWidgetForm.kind === "layout" ? newWidgetForm.widgetTypeId : ""}
                      onChange={(v) =>
                        setNewWidgetForm((f) => ({
                          ...f,
                          kind: "layout",
                          widgetTypeId: v,
                        }))
                      }
                      placeholder="انتخاب کنید..."
                      disabled={widgetBusy}
                      searchPlaceholder="جستجوی نوع Layout..."
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div>
                      <JsonEditorField
                        label="widget_config (JSON)"
                        value={newWidgetForm.widget_config}
                        onChange={(v) =>
                          setNewWidgetForm((f) => ({ ...f, widget_config: v }))
                        }
                        disabled={widgetBusy}
                        minHeight={140}
                      />
                    </div>
                    <div>
                      <JsonEditorField
                        label="components_config (JSON)"
                        value={newWidgetForm.components_config}
                        onChange={(v) =>
                          setNewWidgetForm((f) => ({ ...f, components_config: v }))
                        }
                        disabled={widgetBusy}
                        minHeight={140}
                      />
                    </div>
                    <div>
                      <JsonEditorField
                        label="extra_request_params (JSON)"
                        value={newWidgetForm.extra_request_params}
                        onChange={(v) =>
                          setNewWidgetForm((f) => ({ ...f, extra_request_params: v }))
                        }
                        disabled={widgetBusy}
                        minHeight={140}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary disabled:opacity-50"
                    disabled={widgetBusy}
                  >
                    افزودن Layout
                  </button>
                </form>
              </details>
            </div>

            {/* Content widgets list */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Content</h3>
                <span className="text-sm text-gray-500">{contentWidgets.length} ویجت</span>
              </div>

              {contentWidgets.length === 0 ? (
                <p className="text-sm text-gray-600">هنوز ویجتی برای محتوای صفحه ثبت نشده است.</p>
              ) : (
                <div className="space-y-2">
                  {contentWidgets.map((w, idx) => {
                    const type = widgetTypesById.get(String(w.widget_type));
                    const name = type?.name ?? w.widget_type_name ?? String(w.widget_type);
                    const isEditing = editingWidgetId === String(w.id);
                    return (
                      <div
                        key={String(w.id)}
                        className="border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="font-mono bg-gray-50 px-2 py-1 rounded">
                                {name}
                              </code>
                              <span className="text-gray-500 text-xs">index: {w.index}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded disabled:opacity-40"
                              title="بالا"
                              disabled={widgetBusy || idx === 0}
                              onClick={() => swapWidgetIndex(w, contentWidgets[idx - 1]!)}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded disabled:opacity-40"
                              title="پایین"
                              disabled={widgetBusy || idx === contentWidgets.length - 1}
                              onClick={() => swapWidgetIndex(w, contentWidgets[idx + 1]!)}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => (isEditing ? closeWidgetEditor() : openWidgetEditor(w))}
                              className="btn-secondary text-sm"
                              disabled={widgetBusy}
                            >
                              {isEditing ? "بستن" : "ویرایش"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWidget(w)}
                              className="btn-secondary text-sm text-red-600"
                              disabled={widgetBusy}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="mt-3 space-y-3">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                              <div>
                                <JsonEditorField
                                  label="widget_config (JSON)"
                                  value={editWidgetForm.widget_config}
                                  onChange={(v) =>
                                    setEditWidgetForm((f) => ({ ...f, widget_config: v }))
                                  }
                                  disabled={widgetBusy}
                                  minHeight={160}
                                />
                              </div>
                              <div>
                                <JsonEditorField
                                  label="components_config (JSON)"
                                  value={editWidgetForm.components_config}
                                  onChange={(v) =>
                                    setEditWidgetForm((f) => ({ ...f, components_config: v }))
                                  }
                                  disabled={widgetBusy}
                                  minHeight={160}
                                />
                              </div>
                              <div>
                                <JsonEditorField
                                  label="extra_request_params (JSON)"
                                  value={editWidgetForm.extra_request_params}
                                  onChange={(v) =>
                                    setEditWidgetForm((f) => ({
                                      ...f,
                                      extra_request_params: v,
                                    }))
                                  }
                                  disabled={widgetBusy}
                                  minHeight={160}
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleSaveWidget}
                                className="btn-primary disabled:opacity-50 inline-flex items-center gap-2"
                                disabled={widgetBusy}
                              >
                                <Save className="h-5 w-5" />
                                ذخیره ویجت
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <details className="pt-2">
                <summary className="cursor-pointer text-sm font-medium inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن ویجت محتوا
                </summary>
                <form onSubmit={handleCreateWidget} className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نوع ویجت
                    </label>
                    <SearchableSelect
                      options={activeContentTypes.map((t) => ({
                        value: String(t.id),
                        label: t.name,
                      }))}
                      value={newWidgetForm.kind === "content" ? newWidgetForm.widgetTypeId : ""}
                      onChange={(v) =>
                        setNewWidgetForm((f) => ({
                          ...f,
                          kind: "content",
                          widgetTypeId: v,
                        }))
                      }
                      placeholder="انتخاب کنید..."
                      disabled={widgetBusy}
                      searchPlaceholder="جستجوی نوع ویجت..."
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div>
                      <JsonEditorField
                        label="widget_config (JSON)"
                        value={newWidgetForm.widget_config}
                        onChange={(v) =>
                          setNewWidgetForm((f) => ({ ...f, widget_config: v }))
                        }
                        disabled={widgetBusy}
                        minHeight={140}
                      />
                    </div>
                    <div>
                      <JsonEditorField
                        label="components_config (JSON)"
                        value={newWidgetForm.components_config}
                        onChange={(v) =>
                          setNewWidgetForm((f) => ({ ...f, components_config: v }))
                        }
                        disabled={widgetBusy}
                        minHeight={140}
                      />
                    </div>
                    <div>
                      <JsonEditorField
                        label="extra_request_params (JSON)"
                        value={newWidgetForm.extra_request_params}
                        onChange={(v) =>
                          setNewWidgetForm((f) => ({ ...f, extra_request_params: v }))
                        }
                        disabled={widgetBusy}
                        minHeight={140}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary disabled:opacity-50"
                    disabled={widgetBusy}
                  >
                    افزودن ویجت
                  </button>
                </form>
              </details>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">پیش‌نمایش</h2>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => setPreviewReloadKey((k) => k + 1)}
            >
              <RefreshCw className="h-5 w-5" />
              رفرش پیش‌نمایش
            </button>
          </div>

          {currentPath.includes(":") && (
            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
              مسیر این صفحه داینامیک است. برای پیش‌نمایش، یک مسیر واقعی وارد کنید.
            </div>
          )}

          <div className="flex gap-2">
            <input
              value={previewPath}
              onChange={(e) => setPreviewPath(e.target.value)}
              placeholder={currentPath}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <a
              href={previewSrc}
              target="_blank"
              className="btn-secondary inline-flex items-center gap-2"
              rel="noreferrer"
              title="باز کردن همین آدرس"
            >
              <Eye className="h-5 w-5" />
            </a>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <iframe
              key={String(previewReloadKey)}
              src={previewSrc}
              className="w-full"
              style={{ height: "70vh" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

