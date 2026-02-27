"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TokanPromo } from "@/components/TokanPromo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faCalendar,
  faNewspaper,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { getArticles, resolveArticleImageUrl, type Article } from "@/lib/api";

function stripHtml(html: string, maxLen = 120): string {
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
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function ArticleCard({ article }: { article: Article }) {
  const imageUrl = resolveArticleImageUrl(article);
  const excerpt = stripHtml(article.description, 100);

  return (
    <article className="group">
      <Link
        href={`/blog/${article.slug}`}
        className="block glass rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-200 hover:shadow-soft transition-all duration-300"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {article.category && (
            <span className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-white/95 text-sm font-bold text-brand-600 shadow-sm">
              {article.category.name}
            </span>
          )}
        </div>
        <div className="p-5">
          <h2 className="text-lg font-extrabold text-slate-900 group-hover:text-brand-600 transition line-clamp-2">
            {article.title}
          </h2>
          {excerpt && (
            <p className="mt-2 text-slate-600 text-sm leading-6 line-clamp-2">
              {excerpt}
            </p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendar} />
              {formatDate(article.created_at)}
            </span>
            {article.total_views != null && article.total_views > 0 && (
              <span>{new Intl.NumberFormat("fa-IR").format(article.total_views)} بازدید</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 9;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    getArticles({ module: "blog", page: 1, page_size: pageSize })
      .then((res) => {
        if (isMounted) {
          setArticles(res.results ?? []);
          setHasMore(!!res.next);
          setPage(1);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("خطا در بارگذاری مطالب. لطفاً دوباره تلاش کنید.");
          setArticles([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    getArticles({ module: "blog", page: page + 1, page_size: pageSize })
      .then((res) => {
        setArticles((prev) => [...prev, ...(res.results ?? [])]);
        setHasMore(!!res.next);
        setPage((p) => p + 1);
      })
      .finally(() => setLoadingMore(false));
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <div className="mb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition text-sm font-medium mb-4"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              بازگشت به صفحه اصلی
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900">
              بلاگ توکان
            </h1>
            <p className="mt-2 text-slate-600 leading-7">
              مطالب آموزشی، نکات فروشگاه‌داری و آخرین اخبار توکان
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center py-20">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="text-4xl text-brand-500 animate-spin"
                  />
                </div>
              ) : error ? (
                <div className="glass rounded-2xl p-8 text-center border border-slate-200">
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 rounded-xl btn-grad text-white font-bold"
                  >
                    تلاش مجدد
                  </button>
                </div>
              ) : articles.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center border border-slate-200">
                  <FontAwesomeIcon
                    icon={faNewspaper}
                    className="text-5xl text-slate-400"
                  />
                  <p className="mt-4 text-slate-600">هنوز مطلبی منتشر نشده است.</p>
                  <p className="mt-2 text-sm text-slate-500">
                    به زودی مطالب آموزشی و خبری در اینجا قرار می‌گیرد.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                  {hasMore && (
                    <div className="mt-10 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-8 py-3 rounded-2xl btn-grad font-bold text-white disabled:opacity-70 disabled:cursor-not-allowed shadow-soft"
                      >
                        {loadingMore ? (
                          <span className="flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={faSpinner}
                              className="animate-spin"
                            />
                            در حال بارگذاری...
                          </span>
                        ) : (
                          "مطالب بیشتر"
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="lg:col-span-1 space-y-6">
              <TokanPromo variant="default" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
