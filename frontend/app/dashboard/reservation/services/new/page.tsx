"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";

const inputClass = "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

type Provider = { id: string; title: string };

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState({
    provider: "",
    title: "",
    description: "",
    duration_minutes: "30",
    price: "0",
    sort_order: "0",
  });

  useEffect(() => {
    apiClient.get<Provider[]>("/reservation/providers/").then(({ data }) => {
      const list = Array.isArray(data) ? data : [];
      setProviders(list);
      setForm((f) => (f.provider ? f : { ...f, provider: list[0]?.id ?? "" }));
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/reservation/services/", {
        provider: form.provider,
        title: form.title,
        description: form.description || "",
        duration_minutes: parseInt(form.duration_minutes, 10) || 30,
        price: form.price || "0",
        sort_order: parseInt(form.sort_order, 10) || 0,
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
          <h1 className="text-3xl font-bold">سرویس جدید</h1>
        </div>
        <div className="flex gap-3">
          <button type="submit" form="service-form" disabled={loading || !form.title || !form.provider} className="btn-primary disabled:opacity-50">
            {loading ? "در حال ذخیره..." : "ذخیره"}
          </button>
          <Link href="/dashboard/reservation/services" className="btn-secondary">انصراف</Link>
        </div>
      </div>

      <form id="service-form" onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">اطلاعات سرویس</h2>
          <div>
            <label className={labelClass}>ارائه‌دهنده *</label>
            <select
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              className={inputClass}
              required
            >
              <option value="">انتخاب کنید</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            {providers.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">ابتدا یک ارائه‌دهنده اضافه کنید.</p>
            )}
          </div>
          <div>
            <label className={labelClass}>عنوان سرویس *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
              placeholder="مثال: ویزیت اول"
              required
            />
          </div>
          <div>
            <label className={labelClass}>توضیحات</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>مدت زمان (دقیقه)</label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
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
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>ترتیب نمایش</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
              className={inputClass}
              min={0}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
