"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";

type Provider = { id: string; title: string; is_active: boolean };
type Category = { id: string; title: string; is_active: boolean };

const inputClass =
  "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    provider: "",
    category: "",
    title: "",
    description: "",
    duration_minutes: "30",
    price: "0",
    sort_order: "0",
    is_active: true,
  });

  useEffect(() => {
    Promise.all([
      apiClient.get<Provider[] | { results?: Provider[] }>("/reservation/providers/"),
      apiClient.get<Category[] | { results?: Category[] }>("/reservation/categories/"),
    ])
      .then(([providersRes, categoriesRes]) => {
        const providerList = Array.isArray(providersRes.data) ? providersRes.data : providersRes.data?.results ?? [];
        const categoryList = Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data?.results ?? [];

        setProviders(providerList);
        setCategories(categoryList);
        setForm((prev) => ({
          ...prev,
          provider: prev.provider || providerList[0]?.id || "",
        }));
      })
      .catch(() => {
        setProviders([]);
        setCategories([]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/reservation/services/", {
        provider: form.provider,
        category: form.category || null,
        title: form.title,
        description: form.description || "",
        duration_minutes: parseInt(form.duration_minutes, 10) || 30,
        price: form.price || "0",
        sort_order: parseInt(form.sort_order, 10) || 0,
        is_active: form.is_active,
      });
      router.push("/dashboard/reservation/services");
    } catch (err: any) {
      const msg = err?.response?.data?.title?.[0] || err?.response?.data?.detail || "خطا در ایجاد سرویس";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reservation/services" className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <ArrowRight className="h-5 w-5" />
            بازگشت
          </Link>
          <h1 className="text-3xl font-bold">افزودن سرویس</h1>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            form="service-form"
            disabled={loading || !form.title || !form.provider}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "در حال ذخیره..." : "ذخیره"}
          </button>
          <Link href="/dashboard/reservation/services" className="btn-secondary">
            انصراف
          </Link>
        </div>
      </div>

      <form id="service-form" onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="card p-6 space-y-4">
          <div>
            <label className={labelClass}>ارائه‌دهنده</label>
            <select
              value={form.provider}
              onChange={(e) => setForm((prev) => ({ ...prev, provider: e.target.value }))}
              className={inputClass}
              required
            >
              <option value="">انتخاب کنید</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.title} {provider.is_active ? "" : "(غیرفعال)"}
                </option>
              ))}
            </select>
            {providers.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">ابتدا یک ارائه‌دهنده ایجاد کنید.</p>
            )}
          </div>

          <div>
            <label className={labelClass}>دسته‌بندی سرویس</label>
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className={inputClass}
            >
              <option value="">بدون دسته‌بندی</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title} {category.is_active ? "" : "(غیرفعال)"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>نام سرویس</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className={inputClass}
              placeholder="مثلاً: مشاوره اولیه"
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
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>مدت زمان (دقیقه)</label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm((prev) => ({ ...prev, duration_minutes: e.target.value }))}
                className={inputClass}
                min={5}
              />
            </div>
            <div>
              <label className={labelClass}>قیمت (تومان)</label>
              <input
                type="text"
                dir="ltr"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>ترتیب نمایش</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
              className={inputClass}
              min={0}
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
        </div>
      </form>
    </div>
  );
}
