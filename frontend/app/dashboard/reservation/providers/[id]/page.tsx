"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import { FileManagerModal } from "@/components/FileManagerModal";
import type { Media } from "@/lib/api/productApi";

const inputClass = "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
function getImageUrl(media: Media | { file?: string } | null): string {
  if (!media?.file) return "";
  const f = media.file;
  return f.startsWith("http") ? f : `${API_BASE.replace(/\/$/, "")}${f.startsWith("/") ? "" : "/"}${f}`;
}

export default function EditProviderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [avatar, setAvatar] = useState<Media | { id: string; file?: string } | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sort_order: "0",
  });

  useEffect(() => {
    if (!id) return;
    apiClient
      .get(`/reservation/providers/${id}/`)
      .then(({ data }) => {
        setForm({
          title: data.title || "",
          description: data.description || "",
          sort_order: String(data.sort_order ?? 0),
        });
        setAvatar(data.avatar ?? null);
      })
      .catch(() => router.push("/dashboard/reservation/providers"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiClient.patch(`/reservation/providers/${id}/`, {
        title: form.title,
        description: form.description || "",
        avatar: avatar?.id ?? null,
        sort_order: parseInt(form.sort_order, 10) || 0,
      });
      router.push("/dashboard/reservation/providers");
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
          <Link href="/dashboard/reservation/providers" className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <ArrowRight className="h-5 w-5" />
            بازگشت
          </Link>
          <h1 className="text-3xl font-bold">ویرایش ارائه‌دهنده</h1>
        </div>
        <div className="flex gap-3">
          <button type="submit" form="provider-form" disabled={saving || !form.title} className="btn-primary disabled:opacity-50">
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
          <Link href="/dashboard/reservation/providers" className="btn-secondary">انصراف</Link>
        </div>
      </div>

      <form id="provider-form" onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold">اطلاعات ارائه‌دهنده</h2>
          <div>
            <label className={labelClass}>عنوان *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>توضیحات</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
              rows={3}
            />
          </div>
          <div>
            <label className={labelClass}>تصویر (آواتار)</label>
            {avatar ? (
              <div className="flex items-center gap-3">
                <img src={getImageUrl(avatar)} alt="" className="w-16 h-16 rounded-full object-cover" />
                <button type="button" onClick={() => setAvatar(null)} className="text-red-600 text-sm">حذف</button>
              </div>
            ) : (
              <button type="button" onClick={() => setFileManagerOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg text-gray-600 hover:bg-gray-50">
                <FolderOpen className="h-5 w-5" />
                انتخاب از گالری
              </button>
            )}
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

      <FileManagerModal
        open={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        onSelect={(m) => {
          setAvatar(m);
          setFileManagerOpen(false);
        }}
        accept="image"
      />
    </div>
  );
}
