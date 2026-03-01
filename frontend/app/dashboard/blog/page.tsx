"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, FolderOpen } from "lucide-react";
import { articleApi, categoryApi } from "@/lib/api";
import type { Article } from "@/lib/api/articleApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

function getImageUrl(media: { file: string } | null): string {
  if (!media?.file) return "";
  const file = media.file;
  if (file.startsWith("http")) return file;
  return `${API_BASE.replace(/\/$/, "")}${file.startsWith("/") ? "" : "/"}${file}`;
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  useEffect(() => {
    categoryApi.list({ module: "BLOG", page_size: 100 }).then((res) => {
      setCategories((res.results ?? []).map((c) => ({ id: c.id, name: c.name })));
    }).catch(() => {});
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page_size: 50,
        search: search || undefined,
        module: "blog",
      };
      if (statusFilter === "draft") params.status = ["draft"];
      else if (statusFilter === "public") params.status = ["public"];
      else params.status = ["draft", "public"];
      if (categoryFilter) params.categories = [categoryFilter];

      const res = await articleApi.list(params);
      setArticles(res.results ?? []);
    } catch (err) {
      console.error(err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  const handleDelete = async (article: Article) => {
    if (!confirm(tFrontendAuto("fe.8b5f401c3ffc", { p1: article.title }))) return;
    try {
      await articleApi.delete(article.slug);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
    } catch (err) {
      console.error(err);
      alert("خطا در حذف مقاله");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">{tFrontendAuto("fe.f5fb8d7b4d78")}</h1>
        <div className="flex gap-2">
          <Link
            href="/dashboard/blog/new"
            className="btn-primary inline-flex items-center gap-2 w-fit"
          >
            <Plus className="h-5 w-5" />
            مقاله جدید
          </Link>
          <Link
            href="/dashboard/blog/categories"
            className="btn-secondary inline-flex items-center gap-2 w-fit"
          >
            <FolderOpen className="h-5 w-5" />
            دسته‌بندی‌ها
          </Link>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={tFrontendAuto("fe.34a0085722be")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{tFrontendAuto("fe.333174e52f41")}</option>
          <option value="draft">{tFrontendAuto("fe.e979266b88e7")}</option>
          <option value="public">{tFrontendAuto("fe.e5533711a140")}</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{tFrontendAuto("fe.e1790250c94f")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">
          جستجو
        </button>
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
                    مقاله
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    دسته‌بندی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    بازدید
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    تاریخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-10">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {articles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      مقاله‌ای یافت نشد. اولین مقاله را ایجاد کنید.
                    </td>
                  </tr>
                ) : (
                  articles.map((article) => (
                    <tr key={article.id} className="group hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {article.main_image?.file ? (
                            <img
                              src={getImageUrl(article.main_image)}
                              alt=""
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded bg-gray-200" />
                          )}
                          <div>
                            <span className="font-medium block">{article.title}</span>
                            <span className="text-xs text-gray-500 font-mono">
                              /{article.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {article.category?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            article.status === "public"
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {article.status === "public" ? "منتشر شده" : "پیش‌نویس"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {(article.total_views ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(article.created_at).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                        <div className="flex gap-2 justify-end">
                          <a
                            href={`/blog/${article.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title={tFrontendAuto("fe.36366e8aac29")}
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <Link
                            href={`/dashboard/blog/${encodeURIComponent(article.slug)}/edit`}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title={tFrontendAuto("fe.de21bfe62ab5")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(article)}
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
