"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import { FileManagerModal } from "@/components/FileManagerModal";
import type { Media } from "@/lib/api/productApi";

const inputClass =
  "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
function getImageUrl(media: Media | null): string {
  if (!media?.file) return "";
  const filePath = media.file;
  return filePath.startsWith("http")
    ? filePath
    : `${API_BASE.replace(/\/$/, "")}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
}

export default function NewProviderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileManagerOpen, setFileManagerOpen] = useState(false);
  const [avatar, setAvatar] = useState<Media | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sort_order: "0",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/reservation/providers/", {
        title: form.title,
        description: form.description || "",
        avatar: avatar?.id ?? null,
        sort_order: parseInt(form.sort_order, 10) || 0,
        is_active: form.is_active,
      });
      router.push("/dashboard/reservation/providers");
    } catch (err: any) {
      const msg =
        err?.response?.data?.title?.[0] ||
        err?.response?.data?.detail ||
        "خطا در ایجاد ارائه‌دهنده";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reservation/providers" className="text-gray-600 hover:text-gray-900 flex items-center gap-1">
            <ArrowRight className="h-5 w-5" />
            بازگشت
          </Link>
          <h1 className="text-3xl font-bold">افزودن ارائه‌دهنده</h1>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            form="provider-form"
            disabled={loading || !form.title}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "در حال ذخیره..." : "ذخیره"}
          </button>
          <Link href="/dashboard/reservation/providers" className="btn-secondary">
            انصراف
          </Link>
        </div>
      </div>

      <form id="provider-form" onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <div className="card p-6 space-y-4">
          <div>
            <label className={labelClass}>نام ارائه‌دهنده</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className={inputClass}
              placeholder="مثلاً: دکتر احمدی"
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
            <label className={labelClass}>تصویر پروفایل</label>
            {avatar ? (
              <div className="flex items-center gap-3">
                <img src={getImageUrl(avatar)} alt={form.title || "provider"} className="w-16 h-16 rounded-full object-cover" />
                <button type="button" onClick={() => setAvatar(null)} className="text-red-600 text-sm">
                  حذف تصویر
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setFileManagerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg text-gray-600 hover:bg-gray-50"
              >
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

      <FileManagerModal
        open={fileManagerOpen}
        onClose={() => setFileManagerOpen(false)}
        onSelect={(media) => {
          setAvatar(media);
          setFileManagerOpen(false);
        }}
        accept="image"
      />
    </div>
  );
}
