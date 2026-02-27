"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Star,
  Loader2,
  MessageSquare,
  Package,
} from "lucide-react";
import { reviewApi } from "@/lib/api";
import type { ProductReviewAdmin } from "@/lib/api/reviewApi";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار تایید",
  approved: "تایید شده",
  rejected: "رد شده",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

function formatDate(s: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(s));
  } catch {
    return s;
  }
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ProductReviewAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "">("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchReviews = async (reset = true) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await reviewApi.adminList({
        page_size: 20,
        status: statusFilter || undefined,
      });
      if (reset) {
        setReviews(res.results ?? []);
      } else {
        setReviews((prev) => [...prev, ...(res.results ?? [])]);
      }
      setNextPage(res.next ?? null);
    } catch (err) {
      console.error(err);
      if (reset) setReviews([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleApprove = async (r: ProductReviewAdmin) => {
    setActionLoading(r.id);
    try {
      await reviewApi.approve(r.id);
      await fetchReviews();
    } catch (e) {
      console.error(e);
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "خطا در تایید");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (r: ProductReviewAdmin) => {
    setActionLoading(r.id);
    try {
      await reviewApi.reject(r.id);
      await fetchReviews();
    } catch (e) {
      console.error(e);
      alert((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "خطا در رد");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">نظرات کاربران</h1>
            <p className="text-sm text-gray-500 mt-1">
              نظرات در انتظار تایید را بررسی و تایید یا رد کنید.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["", "pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === s
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s === "" ? "همه" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">هنوز نظری ثبت نشده است.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-4 sm:p-6 hover:bg-gray-50/50 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Link
                          href={`/product/${r.product_id}`}
                          className="font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <Package size={16} />
                          {r.product_title}
                        </Link>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status] ?? "bg-gray-100"}`}
                        >
                          {STATUS_LABELS[r.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={16}
                              className={r.rating >= i ? "fill-amber-500" : "opacity-30"}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {r.display_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {r.user_mobile}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(r.created_at)}
                        </span>
                      </div>
                      {r.body ? (
                        <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">بدون متن</p>
                      )}
                    </div>
                    {r.status === "pending" ? (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApprove(r)}
                          disabled={actionLoading === r.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                        >
                          {actionLoading === r.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                          تایید
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(r)}
                          disabled={actionLoading === r.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                        >
                          {actionLoading === r.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <X size={16} />
                          )}
                          رد
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
