"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { pageApi, storeApi } from "@/lib/api";
import { revalidateStorePages } from "@/lib/server/storefrontCache";
import type { PageConfig } from "@/themes/types";

type ManagedPage = PageConfig & {
  id?: string | number;
  path?: string;
  isActive?: boolean;
};

function normalizePath(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function resolvePagePath(page: ManagedPage): string {
  return normalizePath(page.path ?? page.page ?? "/");
}

export default function DashboardPagesPage() {
  const [pages, setPages] = useState<ManagedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    path: "/",
    title: "",
  });

  const fetchPages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pageApi.list({ page_size: 200 });
      setPages((res.results ?? []) as ManagedPage[]);
    } catch (err) {
      console.error(err);
      setPages([]);
      setError("خطا در دریافت لیست صفحات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => resolvePagePath(a).localeCompare(resolvePagePath(b), "fa"));
  }, [pages]);

  const getStoreDomain = async (): Promise<string | null> => {
    try {
      const store = await storeApi.getCurrentStore();
      if (!store) return null;
      return store.internal_domain || (store.external_domain ? `${store.name}.${store.external_domain}` : null);
    } catch {
      return null;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await pageApi.create({
        path: normalizePath(createForm.path),
        title: createForm.title || null,
        is_active: true,
      });
      setCreateForm({ path: "/", title: "" });
      await fetchPages();
      const domain = await getStoreDomain();
      await revalidateStorePages(domain);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.path?.[0] ||
        err?.response?.data?.detail ||
        "خطا در ایجاد صفحه";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (page: ManagedPage) => {
    const id = page.id;
    const path = resolvePagePath(page);
    if (!id) {
      alert("برای این صفحه شناسه (id) دریافت نشد.");
      return;
    }
    if (!confirm(`آیا از حذف صفحه «${path}» اطمینان دارید؟`)) return;
    try {
      await pageApi.delete(id);
      setPages((prev) => prev.filter((p) => p.id !== id));
      const domain = await getStoreDomain();
      await revalidateStorePages(domain);
    } catch (err) {
      console.error(err);
      alert("خطا در حذف صفحه");
    }
  };

  const handleSetupDefault = async () => {
    if (!confirm("صفحات و ویجت‌های پیشنهادی برای یک فروشگاه استاندارد ساخته می‌شوند. صفحات موجود تغییر نخواهند کرد. ادامه دهید؟")) return;
    setSetupBusy(true);
    setError(null);
    try {
      const result = await pageApi.setupDefaultStorePages();
      await fetchPages();
      const domain = await getStoreDomain();
      await revalidateStorePages(domain);
      const parts: string[] = [];
      if (result.created > 0) {
        parts.push(`تعداد ${result.created} صفحه ایجاد شد.`);
        if (result.skipped > 0) parts.push(`${result.skipped} صفحه از قبل وجود داشت.`);
        if (result.widget_types_created && result.widget_types_created > 0) {
          parts.push(`${result.widget_types_created} نوع ویجت نیز ایجاد شد.`);
        }
      }
      if (result.errors.length > 0) parts.push(`خطاها: ${result.errors.slice(0, 3).join("; ")}`);
      const msg =
        parts.length > 0 ? parts.join(" ") : result.errors.length > 0 ? result.errors.join("\n") : "همه صفحات از قبل وجود داشتند.";
      alert(msg);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail ?? err?.message ?? "خطا در راه‌اندازی صفحات پیش‌فرض");
    } finally {
      setSetupBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">صفحه‌ساز</h1>
        <button
          type="button"
          onClick={handleSetupDefault}
          disabled={setupBusy || loading}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="h-5 w-5" />
          {setupBusy ? "در حال ایجاد..." : "راه‌اندازی صفحات پیش‌فرض فروشگاه"}
        </button>
      </div>

      <form onSubmit={handleCreate} className="card max-w-3xl space-y-4">
        <h2 className="text-lg font-semibold">ایجاد صفحه جدید</h2>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              مسیر (Path) *
            </label>
            <input
              value={createForm.path}
              onChange={(e) => setCreateForm((f) => ({ ...f, path: e.target.value }))}
              required
              placeholder="/about"
              dir="ltr"
              className="w-full ltr text-left px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              مثال: <code>/</code> ، <code>/about</code> ، یا مسیر داینامیک مثل{" "}
              <code>/product/:id:number/:slug?:string</code>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان (اختیاری)
            </label>
            <input
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="عنوان صفحه"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !createForm.path.trim()}
            className="btn-primary disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {submitting ? "در حال ایجاد..." : "ایجاد صفحه"}
          </button>
          <button
            type="button"
            onClick={fetchPages}
            className="btn-secondary"
            disabled={loading}
          >
            بروزرسانی لیست
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    مسیر
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    عنوان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      صفحه‌ای یافت نشد
                    </td>
                  </tr>
                ) : (
                  sortedPages.map((p) => {
                    const id = p.id;
                    const path = resolvePagePath(p);
                    const title = p.title ?? "—";
                    const isActive = typeof p.isActive === "boolean" ? p.isActive : true;
                    return (
                      <tr key={String(id ?? path)} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-mono">{path}</td>
                        <td className="px-6 py-4">{title}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {isActive ? "فعال" : "غیرفعال"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              href={path}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="پیش‌نمایش"
                              target="_blank"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            {id ? (
                              <Link
                                href={`/dashboard/pages/${id}/edit`}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="ویرایش صفحه و ویجت‌ها"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            ) : (
                              <button
                                className="p-2 text-gray-300 rounded cursor-not-allowed"
                                title="شناسه صفحه موجود نیست"
                                disabled
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(p)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

