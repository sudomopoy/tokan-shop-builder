"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { subscriptionApi, type SubscriptionPaymentHistoryItem } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  completed: "تکمیل شده",
  failed: "ناموفق",
  cancelled: "لغو شده",
};

function formatPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return new Intl.NumberFormat("fa-IR").format(n);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function statusBadge(status: string) {
  const label = STATUS_LABELS[status] ?? status;
  const cls =
    status === "completed"
      ? "bg-emerald-100 text-emerald-700"
      : status === "pending"
        ? "bg-amber-100 text-amber-700"
        : status === "cancelled" || status === "failed"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function SubscriptionHistoryPage() {
  const [items, setItems] = useState<SubscriptionPaymentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await subscriptionApi.getHistory();
        setItems(data);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-3 text-sm text-gray-500">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-900">تاریخچه اشتراک‌ها</h1>
        <Link
          href="/dashboard/subscription"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          تمدید اشتراک
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500">هنوز پرداختی ثبت نشده است.</p>
          <Link
            href="/dashboard/subscription"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
          >
            تمدید اشتراک
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                    تاریخ
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                    پلن
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                    مدت
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                    مبلغ
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                    وضعیت
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.plan_title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.duration_months} ماهه
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-gray-700">
                      {formatPrice(item.amount)}
                      <span className="text-xs text-gray-400 mr-1">تومان</span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
