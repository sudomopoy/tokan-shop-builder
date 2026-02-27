"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { WidgetConfig } from "@/themes/types";
import { articleApi, type Article } from "@/lib/api/articleApi";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(d);
  } catch {
    return dateStr;
  }
}

export default function BlogDetail({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();
  const { data, setData } = usePageRuntime();

  const pathParams = config?.widgetConfig?.pathParams as Record<string, string | number> | undefined;
  const slugFromConfig = (pathParams?.slug ?? pathParams?.id ?? config?.widgetConfig?.slug) as string | undefined;
  const slugFromPath = pathname?.split("/").filter(Boolean)[1];
  const slug = slugFromConfig ?? slugFromPath;

  const ssrArticle = (data?.blog as Record<string, unknown>)?.["detail"] as Article | undefined;

  const [loading, setLoading] = useState(!ssrArticle);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<Article | null>(ssrArticle ?? null);
  const [related, setRelated] = useState<Article[]>([]);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("شناسه مقاله مشخص نیست.");
      return;
    }
    if (ssrArticle && ssrArticle.slug === slug) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    articleApi
      .get(slug)
      .then((fetched) => {
        if (!mounted) return;
        setArticle(fetched);
        setData("blog.detail", fetched);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError("مقاله یافت نشد.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [slug, ssrArticle]);

  useEffect(() => {
    let mounted = true;
    articleApi
      .list({ module: "blog", page_size: 6 })
      .then((res) => mounted && setRelated(res.results ?? []))
      .catch(() => mounted && setRelated([]));
    return () => {
      mounted = false;
    };
  }, []);

  const imageUrl = useMemo(() => {
    if (!article) return "https://via.placeholder.com/1200x700?text=Blog";
    return article.main_image?.file || article.thumbnail_image?.file || "https://via.placeholder.com/1200x700?text=Blog";
  }, [article]);

  if (loading) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">در حال بارگذاری...</div>
      </section>
    );
  }

  if (error || !article) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-6">
          <div className="bg-red-50 text-red-700 rounded-lg p-4 mb-4">{error ?? "مقاله یافت نشد."}</div>
          <Link href="/blog" className="text-primary font-bold hover:underline">
            بازگشت به وبلاگ
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <Link href="/blog" className="hover:text-primary transition">
              وبلاگ
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">مقاله</span>
          </nav>
        </div>
      </div>

      <section className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <article className="bg-white rounded-xl p-8">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                <span>{formatDate(article.created_at)}</span>
                {article.category?.name ? (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>{article.category.name}</span>
                  </>
                ) : null}
              </div>
              <h1 className="text-3xl font-bold text-dark mb-6">{article.title}</h1>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={article.title} className="w-full rounded-xl mb-6" />

              <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
                <div dangerouslySetInnerHTML={{ __html: article.description || "" }} />
              </div>
            </article>

            {/* Comments (template-like placeholder) */}
            <div className="bg-white rounded-xl p-8 mt-6">
              <h3 className="text-xl font-bold text-dark mb-6">نظرات</h3>
              <p className="text-gray-600 text-sm mb-6">سیستم نظرات در حال حاضر فعال نیست.</p>
              <form>
                <textarea
                  rows={4}
                  placeholder="نظر خود را بنویسید..."
                  className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none mb-4"
                />
                <button type="button" className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
                  ارسال نظر
                </button>
              </form>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-24">
              <h3 className="font-bold text-dark mb-4">مقالات مرتبط</h3>
              <div className="space-y-4">
                {related.slice(0, 6).map((r) => {
                  const img =
                    r.thumbnail_image?.file || r.main_image?.file || "https://via.placeholder.com/200x200?text=Blog";
                  return (
                    <Link key={r.id} href={`/blog/${r.slug}`} className="flex gap-3 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={r.title} className="w-20 h-20 object-cover rounded" />
                      <div>
                        <h4 className="font-medium text-sm text-dark group-hover:text-primary transition line-clamp-2">{r.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(r.created_at)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
