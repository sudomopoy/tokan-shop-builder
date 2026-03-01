"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, List } from "lucide-react";
import { sliderApi } from "@/lib/api";
import type { SliderListItem } from "@/lib/api/sliderApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export default function SlidersPage() {
  const router = useRouter();
  const [sliders, setSliders] = useState<SliderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: "",
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSliders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sliderApi.list({ include_inactive: true, page_size: 100 });
      setSliders(res.results ?? []);
    } catch (err) {
      console.error(err);
      setSliders([]);
      setError(tFrontendAuto("fe.d7291a135bfe"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await sliderApi.create({
        title: createForm.title.trim(),
        is_active: createForm.is_active,
      });
      setCreateForm({ title: "", is_active: true });
      router.push(`/dashboard/sliders/${created.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { title?: string[]; detail?: string } } })?.response?.data
          ?.title?.[0] ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "خطا در ایجاد اسلایدر";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (slider: SliderListItem) => {
    if (!confirm(tFrontendAuto("fe.f40e21ecdb6f", { p1: slider.title })))
      return;
    try {
      await sliderApi.delete(slider.id);
      setSliders((prev) => prev.filter((s) => s.id !== slider.id));
    } catch (err) {
      console.error(err);
      alert("خطا در حذف اسلایدر");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">{tFrontendAuto("fe.7c9da5090e6e")}</h1>
      </div>

      <form onSubmit={handleCreate} className="card max-w-3xl space-y-4">
        <h2 className="text-lg font-semibold">{tFrontendAuto("fe.30f719fce715")}</h2>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{tFrontendAuto("fe.a83c261c5577")}</label>
          <input
            value={createForm.title}
            onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
            required
            placeholder={tFrontendAuto("fe.1e1053af42fe")}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

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

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !createForm.title.trim()}
            className="btn-primary disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {submitting ? "در حال ایجاد..." : "ایجاد اسلایدر"}
          </button>
          <button
            type="button"
            onClick={fetchSliders}
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
                    تعداد اسلاید
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-10">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sliders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      اسلایدری یافت نشد. اولین اسلایدر را ایجاد کنید.
                    </td>
                  </tr>
                ) : (
                  sliders.map((slider) => (
                    <tr key={slider.id} className="group hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{slider.title}</td>
                      <td className="px-6 py-4 text-sm">
                        {slider.slides_count ?? 0}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            slider.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {slider.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                        <div className="flex gap-2 justify-end">
                          <Link
                            href={`/dashboard/sliders/${slider.id}`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title={tFrontendAuto("fe.8933719a4a46")}
                          >
                            <List className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(slider)}
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
