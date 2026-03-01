"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { WidgetConfig } from "@/themes/types";
import { orderApi, type Order } from "@/lib/api/orderApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const formatPrice = (price: number): string => new Intl.NumberFormat("fa-IR").format(price);
const ensureNumber = (v: unknown): number => (typeof v === "string" ? parseFloat(v) || 0 : typeof v === "number" ? v : 0);

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  } catch {
    return dateStr;
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  processing: "در حال آماده‌سازی",
  completed: "تکمیل شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  failed: "ناموفق",
};

function statusBadge(status: string) {
  const label = STATUS_LABELS[status] ?? status;
  const cls =
    status === "delivered" || status === "completed"
      ? "bg-green-100 text-green-700"
      : status === "processing" || status === "paid"
        ? "bg-blue-100 text-blue-700"
        : status === "pending"
          ? "bg-amber-100 text-amber-700"
          : "bg-gray-100 text-gray-700";
  return <span className={`px-3 py-1 ${cls} rounded-lg text-sm`}>{label}</span>;
}

export default function OrderListView({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setOrders([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    orderApi
      .listOrders()
      .then((res) => mounted && setOrders(res))
      .catch((e) => {
        console.error(e);
        mounted && setError(tFrontendAuto("fe.d771d724e830"));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-dark mb-4">{tFrontendAuto("fe.f3669791fd4f")}</h2>
          <button onClick={() => router.push(`/login?next=/orders`)} className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            ورود
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-dark mb-6">{tFrontendAuto("fe.af826736405e")}</h1>

      {loading ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">{tFrontendAuto("fe.3e07344c65a3")}</div>
      ) : error ? (
        <div className="bg-white rounded-xl p-6">
          <div className="bg-red-50 text-red-700 rounded-lg p-4">{error}</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">{tFrontendAuto("fe.aacd189b0ca2")}</div>
      ) : (
        <div className="bg-white rounded-xl p-6 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="border rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-dark">
                    سفارش شماره: {o.code ?? "-"}
                  </h3>
                  <p className="text-sm text-gray-600">تاریخ: {formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-4">
                  {statusBadge(o.status)}
                  {o.code != null ? (
                    <Link href={`/order/${o.code}`} className="text-primary hover:underline text-sm font-bold">
                      پیگیری
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  تعداد اقلام: {o.items?.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0}
                </div>
                <div className="font-bold text-primary">
                  {formatPrice(ensureNumber(o.payable_amount))} تومان
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
