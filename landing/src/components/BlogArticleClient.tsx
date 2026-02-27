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
  faSpinner,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { getArticle, getArticles, resolveArticleImageUrl, type Article } from "@/lib/api";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function RelatedArticle({ article }: { article: Article }) {
  const imageUrl = resolveArticleImageUrl(article, true);

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="flex gap-4 p-3 rounded-2xl glass hover:bg-slate-50 transition border border-slate-200 group"
    >
      <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
        <Image
          src={imageUrl}
          alt={article.title}
          fill
          className="object-cover group-hover:scale-105 transition"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition line-clamp-2">
          {article.title}
        </h3>
        <span className="text-xs text-slate-500 mt-1 block">
          {formatDate(article.created_at)}
        </span>
      </div>
    </Link>
  );
}

export function BlogArticleClient({ slug }: { slug: string | null }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getArticle(slug),
      getArticles({ module: "blog", page_size: 4 }),
    ])
      .then(([a, listRes]) => {
        if (isMounted) {
          setArticle(a);
          const others = (listRes.results ?? []).filter((r) => r.slug !== slug);
          setRelated(others.slice(0, 3));
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("مطلب یافت نشد یا دسترسی به آن ندارید.");
          setArticle(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!slug) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="glass rounded-2xl p-8 text-center border border-slate-200">
            <p className="text-slate-600">آدرس مطلب مشخص نشده است.</p>
            <Link
              href="/blog"
              className="mt-4 inline-flex items-center gap-2 text-brand-600 font-bold"
            >
              بازگشت به بلاگ
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-50 flex items-center justify-center py-20">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-5xl text-brand-500 animate-spin"
          />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !article) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-20">
          <div className="glass rounded-2xl p-8 text-center border border-slate-200 max-w-md">
            <p className="text-red-600">{error ?? "مطلب یافت نشد."}</p>
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl btn-grad text-white font-bold"
            >
              بازگشت به بلاگ
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const imageUrl = resolveArticleImageUrl(article, true);
  const categoryName = article.category?.name ?? "";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition text-sm font-medium mb-6"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            بازگشت به بلاگ
          </Link>

          <div className="grid lg:grid-cols-4 gap-8">
            <article className="lg:col-span-3">
              <div className="glass rounded-[2.2rem] overflow-hidden border border-slate-200">
                <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-slate-100">
                  <Image
                    src={imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 75vw"
                    priority
                  />
                </div>

                <div className="p-6 md:p-8">
                  {categoryName && (
                    <span className="inline-block px-3 py-1.5 rounded-xl bg-brand-100 text-brand-700 text-sm font-bold mb-4">
                      {categoryName}
                    </span>
                  )}

                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                    {article.title}
                  </h1>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-slate-600 text-sm">
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCalendar} />
                      {formatDate(article.created_at)}
                    </span>
                    {article.total_views != null && article.total_views > 0 && (
                      <span className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faEye} />
                        {new Intl.NumberFormat("fa-IR").format(article.total_views)} بازدید
                      </span>
                    )}
                  </div>

                  <div
                    className="mt-6 prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-brand-600 prose-img:rounded-2xl prose-img:max-w-full"
                    dangerouslySetInnerHTML={{ __html: article.description }}
                    style={{
                      lineHeight: 1.9,
                    }}
                  />
                </div>
              </div>

              <div className="mt-8">
                <TokanPromo variant="inline" />
              </div>
            </article>

            <aside className="lg:col-span-1 space-y-6">
              <TokanPromo variant="compact" />

              {related.length > 0 && (
                <div className="glass rounded-2xl p-5 border border-slate-200">
                  <h3 className="font-extrabold text-slate-900 mb-4">
                    مطالب مرتبط
                  </h3>
                  <div className="space-y-3">
                    {related.map((r) => (
                      <RelatedArticle key={r.id} article={r} />
                    ))}
                  </div>
                  <Link
                    href="/blog"
                    className="mt-4 flex items-center justify-center gap-2 text-brand-600 font-bold text-sm hover:underline"
                  >
                    همه مطالب
                    <FontAwesomeIcon icon={faArrowLeft} />
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
