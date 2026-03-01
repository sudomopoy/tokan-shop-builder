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
import type {
  WidgetBuilderOption,
  WidgetDto,
  WidgetTypeDto,
} from "@/lib/api/pageApi";
import { revalidatePage, revalidateStorePages } from "@/lib/server/storefrontCache";
import type { PageConfig } from "@/themes/types";
import SearchableSelect from "@/components/dashboard/SearchableSelect";
import WidgetVisualEditor, {
import { tFrontendAuto } from "@/lib/i18n/autoMessages";
  type WidgetPayloadState,
} from "@/components/dashboard/WidgetVisualEditor";

type PageFormState = {
  path: string;
  title: string;
  description: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  is_active: boolean;
};

type NewWidgetFormState = {
  kind: "content" | "layout";
  widgetTypeId: string;
  payload: WidgetPayloadState;
};

const EMPTY_WIDGET_PAYLOAD: WidgetPayloadState = {
  widget_config: {},
  components_config: {},
  extra_request_params: {},
};

function normalizePath(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function clonePayload(payload: WidgetPayloadState): WidgetPayloadState {
  return {
    widget_config: { ...asObject(payload.widget_config) },
    components_config: { ...asObject(payload.components_config) },
    extra_request_params: { ...asObject(payload.extra_request_params) },
  };
}

function resolvePagePath(page: PageConfig | null): string {
  if (!page) return "/";
  const anyPage = page as any;
  return normalizePath(anyPage.path ?? page.page ?? "/");
}

function payloadFromWidget(widget: WidgetDto): WidgetPayloadState {
  return {
    widget_config: asObject(widget.widget_config),
    components_config: asObject(widget.components_config),
    extra_request_params: asObject(widget.extra_request_params),
  };
}

function payloadFromWidgetType(widgetType: WidgetTypeDto | null): WidgetPayloadState {
  const defaults = asObject(widgetType?.default_payload);
  return {
    widget_config: asObject(defaults.widget_config),
    components_config: asObject(defaults.components_config),
    extra_request_params: asObject(defaults.extra_request_params),
  };
}

function isLayoutWidget(widget: WidgetDto, widgetTypesById: Map<string, WidgetTypeDto>): boolean {
  return Boolean(widgetTypesById.get(String(widget.widget_type))?.is_layout);
}

function getWidgetTypeName(widget: WidgetDto, widgetTypesById: Map<string, WidgetTypeDto>): string {
  const widgetType = widgetTypesById.get(String(widget.widget_type));
  return widgetType?.name ?? widget.widget_type_name ?? String(widget.widget_type);
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

  const [entityOptions, setEntityOptions] = useState<Record<string, WidgetBuilderOption[]>>({});
  const [storeDomain, setStoreDomain] = useState<string | null>(null);

  const [previewPath, setPreviewPath] = useState<string>("");
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [originalPath, setOriginalPath] = useState<string>("/");

  const [newWidgetForm, setNewWidgetForm] = useState<NewWidgetFormState>({
    kind: "content",
    widgetTypeId: "",
    payload: clonePayload(EMPTY_WIDGET_PAYLOAD),
  });

  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editWidgetTypeId, setEditWidgetTypeId] = useState<string>("");
  const [editPayload, setEditPayload] = useState<WidgetPayloadState>(
    clonePayload(EMPTY_WIDGET_PAYLOAD),
  );

  const widgetTypesById = useMemo(() => {
    const map = new Map<string, WidgetTypeDto>();
    for (const widgetType of widgetTypes) {
      map.set(String(widgetType.id), widgetType);
    }
    return map;
  }, [widgetTypes]);

  const layoutWidgets = useMemo(() => {
    return widgets.filter((widget) => isLayoutWidget(widget, widgetTypesById));
  }, [widgets, widgetTypesById]);

  const contentWidgets = useMemo(() => {
    return widgets
      .filter((widget) => !isLayoutWidget(widget, widgetTypesById))
      .slice()
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }, [widgets, widgetTypesById]);

  const activeWidgetTypes = useMemo(() => widgetTypes.filter((item) => item.is_active), [widgetTypes]);
  const activeLayoutTypes = useMemo(
    () => activeWidgetTypes.filter((item) => item.is_layout),
    [activeWidgetTypes],
  );
  const activeContentTypes = useMemo(
    () => activeWidgetTypes.filter((item) => !item.is_layout),
    [activeWidgetTypes],
  );

  const selectedNewWidgetType = useMemo(() => {
    return widgetTypesById.get(newWidgetForm.widgetTypeId) ?? null;
  }, [newWidgetForm.widgetTypeId, widgetTypesById]);

  const selectedEditWidgetType = useMemo(() => {
    return widgetTypesById.get(editWidgetTypeId) ?? null;
  }, [editWidgetTypeId, widgetTypesById]);

  const currentPath = resolvePagePath(page);
  const previewSrc = normalizePath(previewPath || currentPath);

  const resolveStoreDomain = async (): Promise<string | null> => {
    if (storeDomain) return storeDomain;
    try {
      const store = await storeApi.getCurrentStore();
      if (!store) return null;
      const domain =
        store.internal_domain ||
        (store.external_domain ? `${store.name}.${store.external_domain}` : null);
      setStoreDomain(domain);
      return domain;
    } catch {
      return null;
    }
  };

  const revalidateSmart = async (targetPath: string, fullStore = false) => {
    const domain = await resolveStoreDomain();
    if (!domain) return;
    if (fullStore || targetPath.includes(":")) {
      await revalidateStorePages(domain);
      return;
    }
    await revalidatePage(domain, normalizePath(targetPath));
  };

  const fetchStoreContext = async () => {
    try {
      const store = await storeApi.getCurrentStore();
      const domain =
        store?.internal_domain ||
        (store?.external_domain ? `${store?.name}.${store.external_domain}` : null);
      setStoreDomain(domain ?? null);
      const themeId = (store as any)?.theme ?? null;
      return themeId;
    } catch {
      setStoreDomain(null);
      return null;
    }
  };

  const refreshWidgets = async () => {
    if (!pageId) return;
    const widgetsRes = await pageApi.listWidgets({ page_id: pageId, page_size: 500 });
    setWidgets(widgetsRes.results ?? []);
  };

  const fetchAll = async () => {
    if (!pageId) return;
    setLoading(true);
    setPageError(null);
    setWidgetError(null);
    try {
      const themeId = await fetchStoreContext();
      const widgetTypeParams = themeId ? { theme: themeId } : undefined;
      const optionsPromise = pageApi.getBuilderOptions().catch(() => ({ sources: {} }));
      const [pageRes, widgetTypesRes, widgetsRes, optionsRes] = await Promise.all([
        pageApi.get(pageId),
        pageApi.listWidgetTypes(widgetTypeParams),
        pageApi.listWidgets({ page_id: pageId, page_size: 500 }),
        optionsPromise,
      ]);

      setPage(pageRes);
      setWidgetTypes(widgetTypesRes ?? []);
      setWidgets(widgetsRes.results ?? []);
      setEntityOptions(optionsRes?.sources ?? {});

      const anyPage = pageRes as any;
      const initialPath = normalizePath(anyPage.path ?? pageRes.page ?? "/");
      setOriginalPath(initialPath);
      setPreviewPath(initialPath.includes(":") ? "" : initialPath);

      setPageForm({
        path: initialPath,
        title: safeString(pageRes.title),
        description: safeString(pageRes.description),
        meta_title: safeString((pageRes as any).metaTitle),
        meta_description: safeString((pageRes as any).metaDescription),
        meta_keywords: safeString((pageRes as any).metaKeywords),
        is_active: typeof (pageRes as any).isActive === "boolean" ? (pageRes as any).isActive : true,
      });
    } catch (err) {
      console.error(err);
      setPage(null);
      setWidgetTypes([]);
      setWidgets([]);
      setEntityOptions({});
      setPageError("Failed to load page builder data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const handleSavePage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pageId) return;
    setPageSaving(true);
    setPageError(null);
    try {
      const nextPath = normalizePath(pageForm.path);
      const updated = await pageApi.update(pageId, {
        path: nextPath,
        title: pageForm.title || null,
        description: pageForm.description || null,
        meta_title: pageForm.meta_title || null,
        meta_description: pageForm.meta_description || null,
        meta_keywords: pageForm.meta_keywords || null,
        is_active: pageForm.is_active,
      });
      setPage(updated);
      setOriginalPath(nextPath);
      if (!nextPath.includes(":")) {
        setPreviewPath(nextPath);
      }
      await revalidateSmart(nextPath, nextPath !== originalPath);
      alert("Page details saved.");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.path?.[0] ||
        err?.response?.data?.detail ||
        "Failed to save page details.";
      setPageError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setPageSaving(false);
    }
  };

  const onChangeNewWidgetType = (widgetTypeId: string, kind: "content" | "layout") => {
    const widgetType = widgetTypesById.get(widgetTypeId) ?? null;
    setNewWidgetForm({
      kind,
      widgetTypeId,
      payload: payloadFromWidgetType(widgetType),
    });
  };

  const handleCreateWidget = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pageId) return;
    setWidgetBusy(true);
    setWidgetError(null);
    try {
      const widgetTypeId = newWidgetForm.widgetTypeId;
      if (!widgetTypeId) throw new Error("Please select a widget type.");

      const isLayout = newWidgetForm.kind === "layout";
      if (isLayout && layoutWidgets.length > 0) {
        throw new Error("Only one layout widget is allowed per page.");
      }

      const targetList = isLayout ? layoutWidgets : contentWidgets;
      const maxIndex = targetList.reduce((max, item) => Math.max(max, item.index ?? 0), 0);

      await pageApi.createWidget({
        page: pageId,
        widget_type: widgetTypeId,
        index: isLayout ? 0 : maxIndex + 1,
        is_active: true,
        widget_config: asObject(newWidgetForm.payload.widget_config),
        components_config: asObject(newWidgetForm.payload.components_config),
        extra_request_params: asObject(newWidgetForm.payload.extra_request_params),
      });

      await refreshWidgets();
      await revalidateSmart(resolvePagePath(page));

      setNewWidgetForm((prev) => ({
        ...prev,
        widgetTypeId: "",
        payload: clonePayload(EMPTY_WIDGET_PAYLOAD),
      }));
    } catch (err: any) {
      console.error(err);
      setWidgetError(err?.message ? String(err.message) : "Failed to create widget.");
    } finally {
      setWidgetBusy(false);
    }
  };

  const handleDeleteWidget = async (widget: WidgetDto) => {
    if (!confirm(tFrontendAuto("fe.6fe406b6e41a"))) return;
    setWidgetBusy(true);
    setWidgetError(null);
    try {
      await pageApi.deleteWidget(widget.id);
      await refreshWidgets();
      await revalidateSmart(resolvePagePath(page));
      if (editingWidgetId === String(widget.id)) {
        setEditingWidgetId(null);
      }
    } catch (err) {
      console.error(err);
      setWidgetError("Failed to delete widget.");
    } finally {
      setWidgetBusy(false);
    }
  };

  const openWidgetEditor = (widget: WidgetDto) => {
    setEditingWidgetId(String(widget.id));
    setEditWidgetTypeId(String(widget.widget_type));
    setEditPayload(payloadFromWidget(widget));
  };

  const closeWidgetEditor = () => {
    setEditingWidgetId(null);
    setEditWidgetTypeId("");
    setEditPayload(clonePayload(EMPTY_WIDGET_PAYLOAD));
  };

  const handleSaveWidget = async () => {
    if (!editingWidgetId) return;
    setWidgetBusy(true);
    setWidgetError(null);
    try {
      await pageApi.updateWidget(editingWidgetId, {
        widget_config: asObject(editPayload.widget_config),
        components_config: asObject(editPayload.components_config),
        extra_request_params: asObject(editPayload.extra_request_params),
      });
      await refreshWidgets();
      await revalidateSmart(resolvePagePath(page));
      closeWidgetEditor();
    } catch (err) {
      console.error(err);
      setWidgetError("Failed to save widget.");
    } finally {
      setWidgetBusy(false);
    }
  };

  const swapWidgetIndex = async (first: WidgetDto, second: WidgetDto) => {
    setWidgetBusy(true);
    setWidgetError(null);
    try {
      await Promise.all([
        pageApi.updateWidget(first.id, { index: second.index }),
        pageApi.updateWidget(second.id, { index: first.index }),
      ]);
      await refreshWidgets();
      await revalidateSmart(resolvePagePath(page));
    } catch (err) {
      console.error(err);
      setWidgetError("Failed to reorder widgets.");
    } finally {
      setWidgetBusy(false);
    }
  };

  const reloadBuilderOptions = async () => {
    try {
      const result = await pageApi.getBuilderOptions();
      setEntityOptions(result.sources ?? {});
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!pageId) {
    return <div className="text-gray-600">{tFrontendAuto("fe.d608a57ad765")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/pages"
            className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
          >
            <ArrowRight className="h-5 w-5" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{tFrontendAuto("fe.2a128fdccc3a")}</h1>
            <p className="text-sm text-gray-500 font-mono">{currentPath}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={currentPath}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Eye className="h-5 w-5" />
            Open page
          </a>
          <button
            type="button"
            onClick={fetchAll}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <form onSubmit={handleSavePage} className="card space-y-4">
            <h2 className="text-lg font-semibold">{tFrontendAuto("fe.7e28a7bc5838")}</h2>

            {pageError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{pageError}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.d5ac0ce5aa3c")}</label>
                <input
                  value={pageForm.path}
                  onChange={(e) => setPageForm((prev) => ({ ...prev, path: e.target.value }))}
                  required
                  dir="ltr"
                  className="w-full ltr text-left px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  value={pageForm.title}
                  onChange={(e) => setPageForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={pageForm.description}
                onChange={(e) => setPageForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.9d89675f3214")}</label>
                <input
                  value={pageForm.meta_title}
                  onChange={(e) => setPageForm((prev) => ({ ...prev, meta_title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.45c46fe18185")}</label>
                <input
                  value={pageForm.meta_keywords}
                  onChange={(e) => setPageForm((prev) => ({ ...prev, meta_keywords: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.2a3ac8f17155")}</label>
              <textarea
                value={pageForm.meta_description}
                onChange={(e) => setPageForm((prev) => ({ ...prev, meta_description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={pageForm.is_active}
                onChange={(e) => setPageForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              Active page
            </label>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pageSaving}
                className="btn-primary disabled:opacity-50 inline-flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                {pageSaving ? "Saving..." : "Save page"}
              </button>
            </div>
          </form>

          <div className="card space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Widgets</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setWidgetBusy(true);
                    setWidgetError(null);
                    try {
                      await refreshWidgets();
                    } catch {
                      setWidgetError("Failed to refresh widgets.");
                    } finally {
                      setWidgetBusy(false);
                    }
                  }}
                  className="btn-secondary inline-flex items-center gap-2"
                  disabled={widgetBusy}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh widgets
                </button>
                <button
                  type="button"
                  onClick={reloadBuilderOptions}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload options
                </button>
              </div>
            </div>

            {widgetError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{widgetError}</div>
            )}

            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Layout</h3>
                <span className="text-xs text-gray-500">{layoutWidgets.length} widget</span>
              </div>

              {layoutWidgets.length === 0 ? (
                <p className="text-sm text-gray-600">{tFrontendAuto("fe.541e5b365cf4")}</p>
              ) : (
                layoutWidgets.slice(0, 1).map((widget) => {
                  const name = getWidgetTypeName(widget, widgetTypesById);
                  const isEditing = editingWidgetId === String(widget.id);
                  return (
                    <div key={String(widget.id)} className="rounded-lg border border-gray-200 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm">
                          <code className="font-mono bg-gray-50 px-2 py-1 rounded">{name}</code>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn-secondary text-sm"
                            onClick={() => (isEditing ? closeWidgetEditor() : openWidgetEditor(widget))}
                            disabled={widgetBusy}
                          >
                            {isEditing ? "Close" : "Edit"}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-sm text-red-600"
                            onClick={() => handleDeleteWidget(widget)}
                            disabled={widgetBusy}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="space-y-3">
                          <WidgetVisualEditor
                            widgetType={selectedEditWidgetType}
                            payload={editPayload}
                            onChange={setEditPayload}
                            entityOptions={entityOptions}
                            disabled={widgetBusy}
                          />
                          <button
                            type="button"
                            onClick={handleSaveWidget}
                            disabled={widgetBusy}
                            className="btn-primary inline-flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Save widget
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <details className="pt-2">
                <summary className="cursor-pointer text-sm font-medium inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add layout widget
                </summary>
                <form onSubmit={handleCreateWidget} className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.06484316f783")}</label>
                    <SearchableSelect
                      options={activeLayoutTypes.map((item) => ({
                        value: String(item.id),
                        label: item.name,
                      }))}
                      value={newWidgetForm.kind === "layout" ? newWidgetForm.widgetTypeId : ""}
                      onChange={(widgetTypeId) => onChangeNewWidgetType(widgetTypeId, "layout")}
                      disabled={widgetBusy}
                      placeholder="Select..."
                      searchPlaceholder="Search layout..."
                    />
                  </div>

                  <WidgetVisualEditor
                    widgetType={newWidgetForm.kind === "layout" ? selectedNewWidgetType : null}
                    payload={newWidgetForm.payload}
                    onChange={(payload) =>
                      setNewWidgetForm((prev) => ({ ...prev, kind: "layout", payload }))
                    }
                    entityOptions={entityOptions}
                    disabled={widgetBusy}
                  />

                  <button
                    type="submit"
                    disabled={widgetBusy || !newWidgetForm.widgetTypeId}
                    className="btn-primary disabled:opacity-50"
                  >
                    Add layout
                  </button>
                </form>
              </details>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Content</h3>
                <span className="text-sm text-gray-500">{contentWidgets.length} widget</span>
              </div>

              {contentWidgets.length === 0 ? (
                <p className="text-sm text-gray-600">{tFrontendAuto("fe.082891e94766")}</p>
              ) : (
                <div className="space-y-2">
                  {contentWidgets.map((widget, index) => {
                    const name = getWidgetTypeName(widget, widgetTypesById);
                    const isEditing = editingWidgetId === String(widget.id);
                    return (
                      <div key={String(widget.id)} className="border border-gray-200 rounded-lg p-3 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <code className="font-mono bg-gray-50 px-2 py-1 rounded">{name}</code>
                              <span className="text-gray-500 text-xs">index: {widget.index}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded disabled:opacity-40"
                              disabled={widgetBusy || index === 0}
                              onClick={() => swapWidgetIndex(widget, contentWidgets[index - 1]!)}
                              title={tFrontendAuto("fe.6fd89126738d")}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded disabled:opacity-40"
                              disabled={widgetBusy || index === contentWidgets.length - 1}
                              onClick={() => swapWidgetIndex(widget, contentWidgets[index + 1]!)}
                              title={tFrontendAuto("fe.be0b291d5fed")}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => (isEditing ? closeWidgetEditor() : openWidgetEditor(widget))}
                              className="btn-secondary text-sm"
                              disabled={widgetBusy}
                            >
                              {isEditing ? "Close" : "Edit"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWidget(widget)}
                              className="btn-secondary text-sm text-red-600"
                              disabled={widgetBusy}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="space-y-3">
                            <WidgetVisualEditor
                              widgetType={selectedEditWidgetType}
                              payload={editPayload}
                              onChange={setEditPayload}
                              entityOptions={entityOptions}
                              disabled={widgetBusy}
                            />
                            <button
                              type="button"
                              onClick={handleSaveWidget}
                              disabled={widgetBusy}
                              className="btn-primary inline-flex items-center gap-2"
                            >
                              <Save className="h-4 w-4" />
                              Save widget
                            </button>
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
                  Add content widget
                </summary>
                <form onSubmit={handleCreateWidget} className="mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.51f412d6caf4")}</label>
                    <SearchableSelect
                      options={activeContentTypes.map((item) => ({
                        value: String(item.id),
                        label: item.name,
                      }))}
                      value={newWidgetForm.kind === "content" ? newWidgetForm.widgetTypeId : ""}
                      onChange={(widgetTypeId) => onChangeNewWidgetType(widgetTypeId, "content")}
                      disabled={widgetBusy}
                      placeholder="Select..."
                      searchPlaceholder="Search widget..."
                    />
                  </div>

                  <WidgetVisualEditor
                    widgetType={newWidgetForm.kind === "content" ? selectedNewWidgetType : null}
                    payload={newWidgetForm.payload}
                    onChange={(payload) =>
                      setNewWidgetForm((prev) => ({ ...prev, kind: "content", payload }))
                    }
                    entityOptions={entityOptions}
                    disabled={widgetBusy}
                  />

                  <button
                    type="submit"
                    disabled={widgetBusy || !newWidgetForm.widgetTypeId}
                    className="btn-primary disabled:opacity-50"
                  >
                    Add widget
                  </button>
                </form>
              </details>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{tFrontendAuto("fe.97693c893dbf")}</h2>
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => setPreviewReloadKey((prev) => prev + 1)}
            >
              <RefreshCw className="h-5 w-5" />
              Reload preview
            </button>
          </div>

          {currentPath.includes(":") && (
            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
              This page has dynamic path params. Enter a real path for preview.
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
              rel="noreferrer"
              title={tFrontendAuto("fe.ec74c9f2566b")}
              className="btn-secondary inline-flex items-center gap-2"
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
