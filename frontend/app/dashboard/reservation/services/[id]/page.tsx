"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const inputClass = "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

type Provider = { id: string; title: string };

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    if (!id) return;
    Promise.all([
      apiClient.get(`/reservation/services/${id}/`),
      apiClient.get<Provider[]>("/reservation/providers/"),
    ]).then(([{ data: service }, { data: providersList }]) => {
      setForm({
        provider: service.provider?.id || "",
        title: service.title || "",
        description: service.description || "",
        duration_minutes: String(service.duration_minutes ?? 30),
        price: String(service.price ?? 0),
        sort_order: String(service.sort_order ?? 0),
      });
      setProviders(Array.isArray(providersList) ? providersList : []);
    }).catch(() => router.push("/dashboard/reservation/services"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiClient.patch(`/reservation/services/${id}/`, {
        provider: form.provider,
        title: form.title,
        description: form.description || "",
        duration_minutes: parseInt(form.duration_minutes, 10) || 30,
        price: form.price || "0",
        sort_order: parseInt(form.sort_order, 10) || 0,
      });
      router.push("/dashboard/reservation/services");
    } catch (err: any) {
      const msg = err?.response?.data?.title?.[0] || err?.response?.data?.detail || "خطا در ذخیره";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reservation/services" className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <ArrowRight className="h-5 w-5" />
            بازگشت
          </Link>
          <h1 className="text-3xl font-bold">{tFrontendAuto("fe.22bbcda4247d")}</h1>
        </div>
        <div className="flex gap-3">
          <button type="submit" form="service-form" disabled={saving || !form.title || !form.provider} className="btn-primary disabled:opacity-50">
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
          <Link href="/dashboard/reservation/services" className="btn-secondary">{tFrontendAuto("fe.9ea072503092")}</Link>
        </div>
      </div>

      <form id="service-form" onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">{tFrontendAuto("fe.805fc8ebf908")}</h2>
          <div>
            <label className={labelClass}>{tFrontendAuto("fe.dae3fe2ecc1a")}</label>
            <select
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              className={inputClass}
              required
            >
              <option value="">{tFrontendAuto("fe.b3128f65dc93")}</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{tFrontendAuto("fe.2f811bde9972")}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{tFrontendAuto("fe.8593a9f18909")}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{tFrontendAuto("fe.462ffc481c7b")}</label>
              <input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                className={inputClass}
                min={5}
              />
            </div>
            <div>
              <label className={labelClass}>{tFrontendAuto("fe.b8f408dfd74d")}</label>
              <input
                type="text"
                dir="ltr"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>{tFrontendAuto("fe.43b9d39131fa")}</label>
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
