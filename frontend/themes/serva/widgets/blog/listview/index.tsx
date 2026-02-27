"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { WidgetConfig } from "@/themes/types";
import { articleApi, type Article } from "@/lib/api/articleApi";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(d);
  } catch {
    return dateStr;
  }
}

function stripHtml(html: string, maxLen = 140): string {
  const text = (html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

export default function BlogListView({ config }: { config?: WidgetConfig }) {
  const moduleFilter = (config?.widgetConfig?.module as string) || "blog";
  const pageSize = Number(config?.widgetConfig?.page_size ?? 3) || 3;
  const title = (config?.widgetConfig?.title as string) || "آخرین مقالات";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    articleApi
      .list({ module: moduleFilter, page_size: pageSize })
      .then((res) => {
        if (!mounted) return;
        setArticles(res.results ?? []);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError("خطا در بارگذاری مقالات.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [moduleFilter, pageSize]);

  const shown = useMemo(() => articles.slice(0, pageSize), [articles, pageSize]);

  return (
    <section className="container">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-black font-sans text-dark">{title}</h2>
        <Link href="/blog" className="text-primary font-bold hover:gap-2 transition-all flex items-center gap-1 text-sm">
          مشاهده وبلاگ <span aria-hidden>←</span>
        </Link>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500">در حال بارگذاری...</div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-8 text-center text-red-600">{error}</div>
      ) : shown.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500">مطلبی یافت نشد.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {shown.map((a) => {
            const imageUrl =
              a.thumbnail_image?.file || a.main_image?.file || "https://via.placeholder.com/800x500?text=Blog";
            const categoryName = a.category?.name ?? "";
            return (
              <article key={a.id} className="group cursor-pointer">
                <Link href={`/blog/${a.slug}`} className="block">
                  <div className="rounded-2xl overflow-hidden mb-4 relative h-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={a.title}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
                    {categoryName ? (
                      <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-dark text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                        {categoryName}
                      </span>
                    ) : null}
                  </div>
                </Link>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 font-medium">
                  <span>{formatDate(a.created_at)}</span>
                  <span>۵ دقیقه مطالعه</span>
                </div>
                <h3 className="font-bold font-sans text-dark text-lg mb-3 leading-tight group-hover:text-primary transition">
                  <Link href={`/blog/${a.slug}`}>{a.title}</Link>
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{stripHtml(a.description)}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
