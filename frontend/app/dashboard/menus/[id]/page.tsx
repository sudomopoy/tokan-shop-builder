"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { menuApi, categoryApi, pageApi, productApi } from "@/lib/api";
import type { Menu, MenuItem, MenuItemType } from "@/lib/api/menuApi";
import type { Category } from "@/lib/api/categoryApi";
import type { PageConfig } from "@/themes/types";
import type { Product } from "@/lib/api/productApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

function getItemLabel(item: MenuItem): string {
  return item.resolved_title || item.title || "—";
}

export default function MenuItemsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [menu, setMenu] = useState<Menu | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pages, setPages] = useState<PageConfig[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [form, setForm] = useState({
    title: "",
    item_type: "link" as MenuItemType,
    status: "active" as "active" | "inactive" | "coming_soon",
    url: "",
    category: "",
    product: "",
    page: "",
    parent: "",
  });

  const fetchMenu = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const m = await menuApi.get(id);
      setMenu(m);
      const tree = await menuApi.getItemTree(id);
      setItems(tree);
    } catch (err) {
      console.error(err);
      setMenu(null);
      setItems([]);
      setError(tFrontendAuto("fe.75cd33527da2"));
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [catRes, pageRes, prodRes] = await Promise.all([
        categoryApi.list({ module: "STORE", page_size: 200 }),
        pageApi.list({ page_size: 200 }),
        productApi.list({ page_size: 100 }),
      ]);
      setCategories(catRes.results ?? []);
      setPages((pageRes.results ?? []) as PageConfig[]);
      setProducts(prodRes.results ?? []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchOptions();
  }, [id]);

  const openCreate = (parentId?: string) => {
    setEditItem(null);
    setForm({
      title: "",
      item_type: "link",
      status: "active",
      url: "",
      category: "",
      product: "",
      page: "",
      parent: parentId || "",
    });
    setModal("create");
    setError(null);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      title: item.title || "",
      item_type: item.item_type,
      status: item.status,
      url: item.url || "",
      category: item.category || "",
      product: item.product || "",
      page: item.page || "",
      parent: item.parent || "",
    });
    setModal("edit");
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditItem(null);
    setError(null);
  };

  const buildItemPayload = () => {
    const base: Record<string, unknown> = {
      menu: id,
      title: form.title.trim() || null,
      item_type: form.item_type,
      status: form.status,
      parent: form.parent || null,
    };
    base.url = form.item_type === "link" ? (form.url.trim() || null) : null;
    base.category = form.item_type === "category" ? (form.category || null) : null;
    base.product = form.item_type === "product" ? (form.product || null) : null;
    base.page = form.item_type === "page" ? (form.page || null) : null;
    return base;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = buildItemPayload();
      if (modal === "create") {
        await menuApi.createItem(payload as Parameters<typeof menuApi.createItem>[0]);
      } else if (editItem) {
        await menuApi.updateItem(editItem.id, payload as Parameters<typeof menuApi.updateItem>[1]);
      }
      closeModal();
      await fetchMenu();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      const msg =
        (Array.isArray(data?.url) ? data?.url[0] : null) ||
        (Array.isArray(data?.title) ? data?.title[0] : null) ||
        (typeof data?.detail === "string" ? data.detail : null) ||
        "خطا در ذخیره";
      setError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(tFrontendAuto("fe.42cd2750de0d", { p1: getItemLabel(item) }))) return;
    try {
      await menuApi.deleteItem(item.id);
      await fetchMenu();
    } catch (err) {
      console.error(err);
      alert("خطا در حذف آیتم");
    }
  };

  const renderItemRow = (item: MenuItem, depth = 0) => (
    <>
      <tr key={item.id} className="hover:bg-gray-50">
        <td className="px-6 py-3" style={{ paddingRight: 24 + depth * 24 }}>
          <span className="inline-flex items-center gap-1 text-gray-400">
            <GripVertical className="h-4 w-4" />
            {getItemLabel(item)}
          </span>
        </td>
        <td className="px-6 py-3 text-sm text-gray-600">{item.item_type}</td>
        <td className="px-6 py-3 text-sm">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              item.status === "active"
                ? "bg-green-50 text-green-700"
                : item.status === "coming_soon"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {item.status === "active" ? "فعال" : item.status === "coming_soon" ? "به زودی" : "غیرفعال"}
          </span>
        </td>
        <td className="px-6 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => openCreate(item.id)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title={tFrontendAuto("fe.c5cfd3060a40")}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => openEdit(item)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title={tFrontendAuto("fe.de21bfe62ab5")}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(item)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
              title={tFrontendAuto("fe.fc1d9d323674")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
      {item.children?.map((child) => renderItemRow(child, depth + 1))}
    </>
  );

  if (!id) {
    router.replace("/dashboard/menus");
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/menus"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowRight className="h-5 w-5" />
            بازگشت به منوها
          </Link>
          <h1 className="text-3xl font-bold">
            آیتم‌های منو: {menu?.title ?? "..."}
          </h1>
        </div>
        <button
          onClick={() => openCreate()}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          افزودن آیتم
        </button>
      </div>

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
                    نوع
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
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      آیتمی یافت نشد. یک آیتم جدید اضافه کنید.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => renderItemRow(item))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {modal === "create" ? "افزودن آیتم" : "ویرایش آیتم"}
              </h2>
              {error && (
                <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عنوان (اختیاری)
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={tFrontendAuto("fe.8476f8e21569")}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.241c9eda4bd0")}</label>
                  <select
                    value={form.item_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        item_type: e.target.value as MenuItemType,
                        url: "",
                        category: "",
                        product: "",
                        page: "",
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="link">{tFrontendAuto("fe.0093767757d9")}</option>
                    <option value="empty">{tFrontendAuto("fe.335c5d94909a")}</option>
                    <option value="category">{tFrontendAuto("fe.6c76efc8a63e")}</option>
                    <option value="product">{tFrontendAuto("fe.67b7ace0b172")}</option>
                    <option value="page">{tFrontendAuto("fe.dbff28a4556b")}</option>
                  </select>
                </div>
                {form.item_type === "link" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      آدرس (URL) *
                    </label>
                    <input
                      value={form.url}
                      onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                      required
                      placeholder="/about"
                      dir="ltr"
                      className="w-full ltr text-left px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                )}
                {form.item_type === "category" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      دسته‌بندی *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{tFrontendAuto("fe.b3128f65dc93")}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {form.item_type === "product" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      محصول *
                    </label>
                    <select
                      value={form.product}
                      onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{tFrontendAuto("fe.b3128f65dc93")}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {form.item_type === "page" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      صفحه *
                    </label>
                    <select
                      value={form.page}
                      onChange={(e) => setForm((f) => ({ ...f, page: e.target.value }))}
                      required
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{tFrontendAuto("fe.b3128f65dc93")}</option>
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.path ?? p.page ?? p.id}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.b56dc5016988")}</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status: e.target.value as "active" | "inactive" | "coming_soon",
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">{tFrontendAuto("fe.e3d927082524")}</option>
                    <option value="inactive">{tFrontendAuto("fe.0e0e08728689")}</option>
                    <option value="coming_soon">{tFrontendAuto("fe.2405d444dfd0")}</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary disabled:opacity-50"
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
        </div>
      )}
    </div>
  );
}
