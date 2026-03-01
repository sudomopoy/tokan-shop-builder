"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api/apiClient";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type ServiceCategory = {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

type FormState = {
  title: string;
  description: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  title: "",
  description: "",
  sort_order: "0",
  is_active: true,
};

const inputClass =
  "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function ReservationCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const editingItem = useMemo(
    () => categories.find((item) => item.id === editingId) ?? null,
    [categories, editingId]
  );

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<ServiceCategory[] | { results?: ServiceCategory[] }>("/reservation/categories/");
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setCategories(list);
    } catch {
      setError("دریافت دسته‌بندی‌ها با خطا مواجه شد.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const startEdit = (item: ServiceCategory) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      sort_order: String(item.sort_order ?? 0),
      is_active: item.is_active,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      sort_order: Number(form.sort_order || 0),
      is_active: form.is_active,
    };

    try {
      if (editingId) {
        await apiClient.patch(`/reservation/categories/${editingId}/`, payload);
      } else {
        await apiClient.post("/reservation/categories/", payload);
      }
      await loadCategories();
      resetForm();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail ? String(detail) : "ذخیره دسته‌بندی با خطا مواجه شد.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`دسته‌بندی «${title}» حذف شود؟`)) return;
    try {
      await apiClient.delete(`/reservation/categories/${id}/`);
      setCategories((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) resetForm();
    } catch {
      alert("حذف دسته‌بندی انجام نشد.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl font-bold">دسته‌بندی خدمات</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="card p-6 space-y-4 xl:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{editingItem ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</h2>
            {editingItem && (
              <button
                type="button"
                onClick={resetForm}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                title="انصراف"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

          <div>
            <label className={labelClass}>عنوان</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className={inputClass}
              placeholder="مثلاً: خدمات پوست"
              required
            />
          </div>

          <div>
            <label className={labelClass}>توضیح</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className={inputClass}
              rows={3}
              placeholder="توضیح کوتاه"
            />
          </div>

          <div>
            <label className={labelClass}>ترتیب نمایش</label>
            <input
              type="number"
              min={0}
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
              className={inputClass}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
            />
            فعال باشد
          </label>

          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {saving ? "در حال ذخیره..." : editingItem ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}
          </button>
        </form>

        <div className="card p-0 overflow-hidden xl:col-span-2">
          {loading ? (
            <div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">هنوز دسته‌بندی‌ای ثبت نشده است.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">عنوان</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">وضعیت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">ترتیب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 sticky right-0 bg-gray-50 z-10">عملیات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            item.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {item.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-6 py-4">{item.sort_order}</td>
                      <td className="px-6 py-4 sticky right-0 bg-white z-10">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            title="ویرایش"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
