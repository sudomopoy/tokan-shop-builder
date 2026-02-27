"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { reviewApi, productApi, type ProductReview, type Product } from "@/lib/api";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { Star } from "lucide-react";

type ProductReviewsProps = {
  productId: string;
  product?: Product | null;
  variant?: "default" | "serva";
  onReviewSubmitted?: () => void;
};

function formatDate(s: string): string {
  try {
    const d = new Date(s);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return s;
  }
}

export function ProductReviews({
  productId,
  product,
  variant = "serva",
  onReviewSubmitted,
}: ProductReviewsProps) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formRating, setFormRating] = useState(0);
  const [formBody, setFormBody] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const avgRating = product?.average_rating
    ? parseFloat(String(product.average_rating))
    : null;
  const reviewsCount = product?.reviews_count ?? 0;

  useEffect(() => {
    reviewApi
      .listByProduct(productId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (formRating < 1 || formRating > 5) {
      setError("لطفاً امتیاز (۱ تا ۵ ستاره) انتخاب کنید.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reviewApi.create(productId, {
        rating: formRating,
        body: formBody.trim() || undefined,
      });
      setFormRating(0);
      setFormBody("");
      const updated = await reviewApi.listByProduct(productId);
      setReviews(updated);
      onReviewSubmitted?.();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "خطا در ثبت نظر. لطفاً دوباره تلاش کنید.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isServa = variant === "serva";

  if (isServa) {
    return (
      <div className="space-y-8">
        {/* Header with average */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  (avgRating ?? 0) >= i
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-gray-500">
            {avgRating != null
              ? `${Number(avgRating).toFixed(1)} از ${reviewsCount} نظر`
              : reviewsCount > 0
                ? `${reviewsCount} نظر`
                : "هنوز نظری ثبت نشده"}
          </span>
        </div>

        {/* Review form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h4 className="font-bold text-dark">ثبت نظر</h4>
          {!isAuthenticated ? (
            <p className="text-sm text-gray-500">
              برای ثبت نظر باید در سایت ثبت‌نام کنید.
            </p>
          ) : null}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => isAuthenticated && setFormRating(i)}
                onMouseEnter={() => isAuthenticated && setHoverRating(i)}
                onMouseLeave={() => isAuthenticated && setHoverRating(0)}
                disabled={!isAuthenticated || submitting}
                className={`p-1 rounded transition ${
                  (hoverRating || formRating) >= i
                    ? "text-amber-500"
                    : "text-gray-300 hover:text-amber-300"
                }`}
              >
                <Star
                  className={`h-8 w-8 ${
                    (hoverRating || formRating) >= i ? "fill-amber-500" : ""
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={formBody}
            onChange={(e) => setFormBody(e.target.value)}
            placeholder="متن نظر (اختیاری)"
            rows={4}
            disabled={!isAuthenticated || submitting}
            className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none disabled:opacity-60"
          />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button
            type="submit"
            disabled={!isAuthenticated || submitting || formRating < 1}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? "در حال ارسال..." : "ثبت نظر"}
          </button>
        </form>

        {/* Reviews list */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500 text-sm">در حال بارگذاری...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">هنوز نظری ثبت نشده است.</p>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                className="border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          r.rating >= i
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-dark text-sm">
                    {r.display_name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(r.created_at)}
                  </span>
                </div>
                {r.body ? (
                  <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Default (MUI) variant - minimal MUI usage, compatible with default theme
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                (avgRating ?? 0) >= i
                  ? "text-amber-500 fill-amber-500"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {avgRating != null
            ? `${Number(avgRating).toFixed(1)} (${reviewsCount} نظر)`
            : reviewsCount > 0
              ? `${reviewsCount} نظر`
              : "هنوز نظری ثبت نشده"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <h4 className="font-semibold">ثبت نظر</h4>
        {!isAuthenticated ? (
          <p className="text-sm text-gray-500">
            برای ثبت نظر باید در سایت ثبت‌نام کنید.
          </p>
        ) : null}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => isAuthenticated && setFormRating(i)}
              onMouseEnter={() => isAuthenticated && setHoverRating(i)}
              onMouseLeave={() => isAuthenticated && setHoverRating(0)}
              disabled={!isAuthenticated || submitting}
              className={`p-1 rounded transition ${
                (hoverRating || formRating) >= i
                  ? "text-amber-500"
                  : "text-gray-300"
              }`}
            >
              <Star
                className={`h-8 w-8 ${
                  (hoverRating || formRating) >= i ? "fill-amber-500" : ""
                }`}
              />
            </button>
          ))}
        </div>
        <textarea
          value={formBody}
          onChange={(e) => setFormBody(e.target.value)}
          placeholder="متن نظر (اختیاری)"
          rows={4}
          disabled={!isAuthenticated || submitting}
          className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary resize-none disabled:opacity-60"
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button
          type="submit"
          disabled={!isAuthenticated || submitting || formRating < 1}
          className="bg-primary text-white px-5 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "در حال ارسال..." : "ثبت نظر"}
        </button>
      </form>

      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-sm">در حال بارگذاری...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">هنوز نظری ثبت نشده است.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        r.rating >= i
                          ? "text-amber-500 fill-amber-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium text-sm">{r.display_name}</span>
                <span className="text-xs text-gray-400">
                  {formatDate(r.created_at)}
                </span>
              </div>
              {r.body ? (
                <p className="text-sm text-gray-600">{r.body}</p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
