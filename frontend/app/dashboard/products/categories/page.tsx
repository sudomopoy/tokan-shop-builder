"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Pencil, Trash2, X } from "lucide-react";
import { categoryApi } from "@/lib/api";
import type { Category } from "@/lib/api/categoryApi";
import {
import { tFrontendAuto } from "@/lib/i18n/autoMessages";
  CategoryIconSelector,
  type CategoryIconValue,
} from "@/components/dashboard/CategoryIconSelector";

function toIconValue(cat: Category | null): CategoryIconValue {
  if (!cat) {
    return { type: "none", default_icon: null, icon_color: null, icon_id: null, icon: null };
  }
  if (cat.icon_type === "uploaded" && cat.icon) {
    return {
      type: "uploaded",
      default_icon: null,
      icon_color: null,
      icon_id: cat.icon.id,
      icon: cat.icon,
    };
  }
  if (cat.icon_type === "default" && cat.default_icon) {
    return {
      type: "default",
      default_icon: cat.default_icon,
      icon_color: cat.icon_color ?? undefined,
      icon_id: null,
      icon: null,
    };
  }
  return { type: "none", default_icon: null, icon_color: null, icon_id: null, icon: null };
}

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "" });
  const [iconValue, setIconValue] = useState<CategoryIconValue>({
    type: "none",
    default_icon: null,
    icon_color: null,
    icon_id: null,
    icon: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.list({ module: "STORE", page_size: 200 });
      const cats = res.results ?? [];
      const treeRes = await categoryApi.tree({ module: "STORE" }).catch(() => cats);
      const tree = Array.isArray(treeRes) && treeRes.length > 0 ? treeRes : cats;
      const flat = flattenCategories(tree);
      setCategories(flat);
    } catch (err) {
      console.error(err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  function flattenCategories(
    items: Category[],
    depth = 0
  ): (Category & { _depth?: number })[] {
    const result: (Category & { _depth?: number })[] = [];
    for (const c of items) {
      if (c.module !== "STORE" && c.module !== "store") continue;
      result.push({ ...c, _depth: depth });
      if (c.children?.length) {
        result.push(...flattenCategories(c.children, depth + 1));
      }
    }
    return result;
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditCategory(null);
    setForm({ name: "" });
    setIconValue({ type: "none", default_icon: null, icon_color: null, icon_id: null, icon: null });
    setModal("create");
    setError(null);
  };

  const openEdit = (cat: Category) => {
    setEditCategory(cat);
    setForm({ name: cat.name });
    setIconValue(toIconValue(cat));
    setModal("edit");
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditCategory(null);
    setForm({ name: "" });
    setIconValue({ type: "none", default_icon: null, icon_color: null, icon_id: null, icon: null });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const iconPayload: {
        icon_type?: string;
        icon_id?: string | null;
        default_icon?: string | null;
        icon_color?: string | null;
      } = {};
      if (iconValue.type === "none") {
        iconPayload.icon_type = "default";
        iconPayload.icon_id = null;
        iconPayload.default_icon = null;
        iconPayload.icon_color = null;
      } else if (iconValue.type === "uploaded") {
        iconPayload.icon_type = "uploaded";
        iconPayload.icon_id = iconValue.icon_id;
        iconPayload.default_icon = null;
        iconPayload.icon_color = null;
      } else {
        iconPayload.icon_type = "default";
        iconPayload.icon_id = null;
        iconPayload.default_icon = iconValue.default_icon ?? null;
        iconPayload.icon_color = iconValue.icon_color ?? null;
      }

      if (modal === "create") {
        await categoryApi.create({
          name: form.name,
          module: "STORE",
          ...iconPayload,
        });
      } else if (editCategory) {
        await categoryApi.update(editCategory.id, {
          name: form.name,
          ...iconPayload,
        });
      }
      closeModal();
      await fetchCategories();
    } catch (err: any) {
      const msg =
        err?.response?.data?.name?.[0] ||
        err?.response?.data?.detail ||
        "خطا در ذخیره";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(tFrontendAuto("fe.874212f6819c", { p1: cat.name }))) return;
    try {
      await categoryApi.delete(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err) {
      console.error(err);
      alert("خطا در حذف دسته. ممکن است محصولاتی به آن اختصاص داشته باشند.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowRight className="h-5 w-5" />
            بازگشت به محصولات
          </Link>
          <h1 className="text-3xl font-bold">{tFrontendAuto("fe.a6c02edc9a41")}</h1>
        </div>
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-5 w-5" />
          دسته جدید
        </button>
      </div>

      <p className="text-gray-600 text-sm">
        دسته‌بندی‌ها به شما کمک می‌کنند محصولات فروشگاه را سازماندهی کنید.
      </p>

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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase w-14">
                    آیکون
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    نام
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    اسلاگ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-10">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      دسته‌بندی یافت نشد. اولین دسته را ایجاد کنید.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="group hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 overflow-hidden shrink-0">
                          {cat.icon_url ? (
                            <img
                              src={cat.icon_url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_BASE ?? ""}${cat.icon_url}` : cat.icon_url}
                              alt=""
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <span className="text-gray-400 text-lg">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ paddingRight: ((cat as any)._depth ?? 0) * 16 }}>
                          {(cat as any)._depth ? "↳ " : ""}
                          {cat.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {cat.slug ?? "—"}
                      </td>
                      <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title={tFrontendAuto("fe.de21bfe62ab5")}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="absolute inset-0" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {modal === "create" ? "ایجاد دسته جدید" : "ویرایش دسته"}
              </h2>
              <button onClick={closeModal} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.b93126a5cf5a")}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={tFrontendAuto("fe.221ea8eb04e4")}
                  required
                />
              </div>
              <CategoryIconSelector value={iconValue} onChange={setIconValue} />
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button type="button" onClick={closeModal} className="btn-secondary">
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
