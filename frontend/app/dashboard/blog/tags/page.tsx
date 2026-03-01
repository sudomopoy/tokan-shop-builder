"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Pencil, Trash2, X } from "lucide-react";
import { tagApi } from "@/lib/api";
import type { Tag } from "@/lib/api/tagApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export default function BlogTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [form, setForm] = useState({ name: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const list = await tagApi.list({ nocache: true });
      setTags(list ?? []);
    } catch (err) {
      console.error(err);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const openCreate = () => {
    setEditTag(null);
    setForm({ name: "" });
    setModal("create");
    setError(null);
  };

  const openEdit = (tag: Tag) => {
    setEditTag(tag);
    setForm({ name: tag.name });
    setModal("edit");
    setError(null);
  };

  const closeModal = () => {
    setModal(null);
    setEditTag(null);
    setForm({ name: "" });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (modal === "create") {
        await tagApi.create({ name: form.name });
      } else if (editTag) {
        await tagApi.update(editTag.id, { name: form.name });
      }
      closeModal();
      await fetchTags();
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

  const handleDelete = async (tag: Tag) => {
    if (!confirm(tFrontendAuto("fe.c0ffb6635ed9", { p1: tag.name }))) return;
    try {
      await tagApi.delete(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
    } catch (err) {
      console.error(err);
      alert("خطا در حذف تگ.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/blog"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowRight className="h-5 w-5" />
            بازگشت به بلاگ
          </Link>
          <h1 className="text-3xl font-bold">{tFrontendAuto("fe.cdff645fda3a")}</h1>
        </div>
        <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-5 w-5" />
          تگ جدید
        </button>
      </div>

      <p className="text-gray-600 text-sm">
        تگ‌ها به شما کمک می‌کنند مقالات بلاگ را بر اساس موضوع دسته‌بندی و جستجو کنید.
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    نام تگ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-10">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tags.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                      تگی یافت نشد. اولین تگ را ایجاد کنید.
                    </td>
                  </tr>
                ) : (
                  tags.map((tag) => (
                    <tr key={tag.id} className="group hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{tag.name}</td>
                      <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEdit(tag)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title={tFrontendAuto("fe.de21bfe62ab5")}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tag)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="absolute inset-0" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {modal === "create" ? "ایجاد تگ جدید" : "ویرایش تگ"}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.a43e6bc0774a")}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={tFrontendAuto("fe.deee431f54aa")}
                  required
                />
              </div>
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
