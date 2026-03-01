"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { articleApi, categoryApi, tagApi } from "@/lib/api";
import type { Media } from "@/lib/api/productApi";
import { ArticleImageFields } from "@/components/dashboard/ArticleImageFields";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const inputClass =
  "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function NewArticlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<Media | null>(null);
  const [thumbnailImage, setThumbnailImage] = useState<Media | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    status: "draft" as "draft" | "public",
    category: "",
    meta_title: "",
    meta_description: "",
  });
  const [newCatName, setNewCatName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);

  useEffect(() => {
    Promise.all([
      categoryApi.list({ module: "BLOG", page_size: 100 }),
      tagApi.list().catch(() => []),
    ]).then(([catRes, tagsList]) => {
      setCategories((catRes.results ?? []).map((c) => ({ id: c.id, name: c.name })));
      setAllTags(
        (tagsList as { id: string; name: string }[]).map((t) => ({ id: t.id, name: t.name }))
      );
    });
  }, []);

  const handleCreateCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    setCreatingCat(true);
    try {
      const cat = await categoryApi.create({ name, module: "BLOG" });
      setCategories((prev) => [...prev, { id: cat.id, name: cat.name }]);
      setForm((f) => ({ ...f, category: cat.id }));
      setNewCatName("");
    } finally {
      setCreatingCat(false);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setCreatingTag(true);
    try {
      const tag = await tagApi.create({ name });
      setAllTags((prev) => [...prev, { id: tag.id, name: tag.name }]);
      setTags((prev) => [...prev, tag.id]);
      setNewTagName("");
    } finally {
      setCreatingTag(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        module: "blog",
        title: form.title,
        slug: form.slug || undefined,
        description: form.description,
        status: form.status,
        main_image: mainImage?.id ?? null,
        thumbnail_image: thumbnailImage?.id ?? null,
        category: form.category || null,
        tags: tags,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
      };
      const article = await articleApi.create(payload);
      router.push(`/dashboard/blog/${encodeURIComponent(article.slug)}/edit`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.title?.[0] ||
        err?.response?.data?.detail ||
        "خطا در ایجاد مقاله";
      setError(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/blog"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowRight className="h-5 w-5" />
            بازگشت
          </Link>
          <h1 className="text-3xl font-bold">{tFrontendAuto("fe.27dfc8ac93d4")}</h1>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            form="article-form"
            disabled={loading || !form.title}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? "در حال ذخیره..." : "ذخیره مقاله"}
          </button>
          <Link href="/dashboard/blog" className="btn-secondary">
            انصراف
          </Link>
        </div>
      </div>

      <form id="article-form" onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold">{tFrontendAuto("fe.a2f3ceacc859")}</h2>
              <div>
                <label className={labelClass}>{tFrontendAuto("fe.a83c261c5577")}</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputClass}
                  placeholder={tFrontendAuto("fe.10a8e9a70913")}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>{tFrontendAuto("fe.21127e4741c6")}</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className={`${inputClass} font-mono`}
                  placeholder="my-article"
                  dir="ltr"
                />
              </div>
              <div>
                <label className={labelClass}>{tFrontendAuto("fe.85b3403cdeca")}</label>
                <RichTextEditor
                  value={form.description}
                  onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                  placeholder={tFrontendAuto("fe.c64ec55e144a")}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">{tFrontendAuto("fe.2467aa45516f")}</h2>
              <ArticleImageFields
                mainImage={mainImage}
                thumbnailImage={thumbnailImage}
                onMainImageChange={setMainImage}
                onThumbnailImageChange={setThumbnailImage}
              />
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold">{tFrontendAuto("fe.fb2530214671")}</h2>
              <div>
                <label className={labelClass}>{tFrontendAuto("fe.b56dc5016988")}</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as "draft" | "public" }))
                  }
                  className={inputClass}
                >
                  <option value="draft">{tFrontendAuto("fe.e979266b88e7")}</option>
                  <option value="public">{tFrontendAuto("fe.e5533711a140")}</option>
                </select>
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold">{tFrontendAuto("fe.7399f1e6fa08")}</h2>
              <div>
                <label className={labelClass}>{tFrontendAuto("fe.6c76efc8a63e")}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">{tFrontendAuto("fe.dabdaa630209")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateCategory())}
                    placeholder={tFrontendAuto("fe.c7519b499eb4")}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={creatingCat}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={!newCatName.trim() || creatingCat}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    ایجاد
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>{tFrontendAuto("fe.3222ea2c45bc")}</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-0">
                  {allTags.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">{tFrontendAuto("fe.444bbd3acef0")}</p>
                  ) : (
                    allTags.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 py-2 px-1 cursor-pointer hover:bg-gray-50 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={tags.includes(t.id)}
                          onChange={() =>
                            setTags((prev) =>
                              prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                            )
                          }
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm">{t.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateTag())}
                    placeholder={tFrontendAuto("fe.f8e2d7a6513e")}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={creatingTag}
                  />
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || creatingTag}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    ایجاد
                  </button>
                </div>
              </div>
            </div>

            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold">{tFrontendAuto("fe.3464a90de1b7")}</h2>
              <div>
                <label className={labelClass}>{tFrontendAuto("fe.7e8bf63d008a")}</label>
                <input
                  type="text"
                  value={form.meta_title}
                  onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                  className={inputClass}
                  placeholder={tFrontendAuto("fe.561a2ac43214")}
                />
              </div>
              <div>
                <label className={labelClass}>{tFrontendAuto("fe.37b3baa32877")}</label>
                <textarea
                  value={form.meta_description}
                  onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                  className={`${inputClass} min-h-[80px]`}
                  placeholder={tFrontendAuto("fe.b785127752e1")}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
