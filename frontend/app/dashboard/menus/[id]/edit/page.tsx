"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { menuApi } from "@/lib/api";
import type { Menu } from "@/lib/api/menuApi";

export default function MenuEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    key: "",
    description: "",
    is_active: true,
    is_primary: false,
  });

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const m = await menuApi.get(id);
        setMenu(m);
        setForm({
          title: m.title,
          key: m.key ?? "",
          description: m.description ?? "",
          is_active: m.is_active,
          is_primary: m.is_primary,
        });
      } catch (err) {
        console.error(err);
        setError("خطا در دریافت منو");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      await menuApi.update(id, {
        title: form.title.trim(),
        key: form.key.trim() || null,
        description: form.description.trim() || null,
        is_active: form.is_active,
        is_primary: form.is_primary,
      });
      router.push("/dashboard/menus");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { title?: string[]; detail?: string } } })?.response?.data
          ?.title?.[0] ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "خطا در ذخیره";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  if (!id) {
    router.replace("/dashboard/menus");
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-600">منو یافت نشد</p>
        <Link href="/dashboard/menus" className="btn-primary mt-4 inline-block">
          بازگشت به لیست منوها
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/menus"
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <ArrowRight className="h-5 w-5" />
          بازگشت به منوها
        </Link>
        <h1 className="text-3xl font-bold">ویرایش منو: {menu.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان *</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">کلید</label>
          <input
            value={form.key}
            onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
            placeholder="header, footer"
            dir="ltr"
            className="w-full ltr text-left px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm">فعال</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_primary}
              onChange={(e) => setForm((f) => ({ ...f, is_primary: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm">منوی اصلی</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
          <Link href="/dashboard/menus" className="btn-secondary">
            انصراف
          </Link>
        </div>
      </form>
    </div>
  );
}
