"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, List } from "lucide-react";
import { menuApi } from "@/lib/api";
import type { Menu } from "@/lib/api/menuApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export default function DashboardMenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: "",
    key: "",
    description: "",
    is_active: true,
    is_primary: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMenus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await menuApi.list({ include_inactive: true, page_size: 100 });
      setMenus(res.results ?? []);
    } catch (err) {
      console.error(err);
      setMenus([]);
      setError(tFrontendAuto("fe.d48ba43e35aa"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await menuApi.create({
        title: createForm.title.trim(),
        key: createForm.key.trim() || null,
        description: createForm.description.trim() || null,
        is_active: createForm.is_active,
        is_primary: createForm.is_primary,
      });
      setCreateForm({ title: "", key: "", description: "", is_active: true, is_primary: false });
      await fetchMenus();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { title?: string[]; detail?: string } } })?.response?.data
          ?.title?.[0] ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "خطا در ایجاد منو";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (menu: Menu) => {
    if (!confirm(tFrontendAuto("fe.2830da519496", { p1: menu.title }))) return;
    try {
      await menuApi.delete(menu.id);
      setMenus((prev) => prev.filter((m) => m.id !== menu.id));
    } catch (err) {
      console.error(err);
      alert("خطا در حذف منو");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">{tFrontendAuto("fe.c484b662da01")}</h1>
      </div>

      <form onSubmit={handleCreate} className="card max-w-3xl space-y-4">
        <h2 className="text-lg font-semibold">{tFrontendAuto("fe.d37bde2dd5c2")}</h2>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.a83c261c5577")}</label>
            <input
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              required
              placeholder={tFrontendAuto("fe.c25cc825e2c3")}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              کلید (اختیاری)
            </label>
            <input
              value={createForm.key}
              onChange={(e) => setCreateForm((f) => ({ ...f, key: e.target.value }))}
              placeholder={tFrontendAuto("fe.b3b993843869")}
              dir="ltr"
              className="w-full ltr text-left px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              کلید یکتا برای استفاده در هدر یا فوتر (مثلاً header، footer)
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.8593a9f18909")}</label>
          <textarea
            value={createForm.description}
            onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={tFrontendAuto("fe.c845ae3e2c7f")}
            rows={2}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createForm.is_active}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm">{tFrontendAuto("fe.e3d927082524")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createForm.is_primary}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, is_primary: e.target.checked }))
              }
              className="rounded border-gray-300"
            />
            <span className="text-sm">{tFrontendAuto("fe.2a878dcbfce7")}</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !createForm.title.trim()}
            className="btn-primary disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {submitting ? "در حال ایجاد..." : "ایجاد منو"}
          </button>
          <button
            type="button"
            onClick={fetchMenus}
            className="btn-secondary"
            disabled={loading}
          >
            بروزرسانی لیست
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    عنوان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    کلید
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
                {menus.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      منویی یافت نشد
                    </td>
                  </tr>
                ) : (
                  menus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{menu.title}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">
                        {menu.key || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            menu.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {menu.is_active ? "فعال" : "غیرفعال"}
                        </span>
                        {menu.is_primary && (
                          <span className="mr-2 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                            اصلی
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/menus/${menu.id}`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title={tFrontendAuto("fe.e7df86eae76d")}
                          >
                            <List className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/dashboard/menus/${menu.id}/edit`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title={tFrontendAuto("fe.82416e0d1d72")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(menu)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title={tFrontendAuto("fe.fc1d9d323674")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
