"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCalendar, faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { getArticles, resolveArticleImageUrl, type Article } from "@/lib/api";
import { TokanPromo } from "./TokanPromo";

function stripHtml(html: string, maxLen = 100): string {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function ArticleCard({ article }: { article: Article }) {
  const imageUrl = resolveArticleImageUrl(article);
  const excerpt = stripHtml(article.description, 90);

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block glass rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-200 hover:shadow-soft transition-all duration-300"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Image
          src={imageUrl}
          alt={article.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {article.category && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/95 text-xs font-bold text-brand-600">
            {article.category.name}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition line-clamp-2">
          {article.title}
        </h3>
        {excerpt && (
          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{excerpt}</p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <FontAwesomeIcon icon={faCalendar} />
          {formatDate(article.created_at)}
        </div>
      </div>
    </Link>
  );
}

export function BlogSection() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getArticles({ module: "blog", page_size: 3 })
      .then((res) => {
        if (isMounted) setArticles(res.results ?? []);
      })
      .catch(() => {
        if (isMounted) setArticles([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="blog" className="py-16 md:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900">
              بلاگ توکان
            </h2>
            <p className="mt-3 text-slate-600 leading-8 max-w-2xl">
              مطالب آموزشی، نکات فروشگاه‌داری و آخرین اخبار توکان
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl glass hover:bg-slate-50 transition font-bold text-slate-700 border border-slate-200"
          >
            همه مطالب
            <FontAwesomeIcon icon={faArrowLeft} />
          </Link>
        </div>

        <div className="mt-10 grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="glass rounded-2xl overflow-hidden border border-slate-200 animate-pulse"
                  >
                    <div className="aspect-[16/9] bg-slate-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 rounded w-full" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="glass rounded-2xl p-12 text-center border border-slate-200">
                <FontAwesomeIcon
                  icon={faNewspaper}
                  className="text-4xl text-slate-400"
                />
                <p className="mt-4 text-slate-600">به زودی مطالب جدید...</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-1">
            <TokanPromo variant="compact" />
          </div>
        </div>
      </div>
    </section>
  );
}
