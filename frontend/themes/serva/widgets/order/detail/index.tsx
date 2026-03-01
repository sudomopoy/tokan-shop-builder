"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { WidgetConfig } from "@/themes/types";
import { orderApi, type Order } from "@/lib/api/orderApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const formatPrice = (price: number): string => new Intl.NumberFormat("fa-IR").format(price);
const ensureNumber = (v: unknown): number => (typeof v === "string" ? parseFloat(v) || 0 : typeof v === "number" ? v : 0);

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
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

type TimelineStep = {
  key: string;
  title: string;
  desc: string;
  state: "completed" | "active" | "upcoming";
};

function buildTimeline(status: string): TimelineStep[] {
  const order = ["pending", "paid", "processing", "completed", "delivered"];
  const idx = order.indexOf(status);
  const current = idx === -1 ? 0 : idx;
  const steps = [
    { key: "paid", title: "سفارش ثبت شد", desc: "سفارش شما ثبت شده است" },
    { key: "processing", title: "در حال آماده‌سازی", desc: "محصولات شما در حال بسته‌بندی هستند" },
    { key: "completed", title: "ارسال شده", desc: "سفارش شما برای ارسال آماده شد" },
    { key: "delivered", title: "تحویل داده شد", desc: "سفارش به دست شما رسید" },
  ];
  return steps.map((s, i) => {
    const stepIndex = i + 1; // aligns with order list after pending
    if (status === "cancelled" || status === "failed") {
      return { ...s, state: "upcoming" };
    }
    if (stepIndex < current) return { ...s, state: "completed" };
    if (stepIndex === current) return { ...s, state: "active" };
    return { ...s, state: "upcoming" };
  });
}

export default function OrderDetail({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();

  const pathParams = config?.widgetConfig?.pathParams as Record<string, string | number> | undefined;
  const codeFromConfig = (pathParams?.code ?? pathParams?.id ?? config?.widgetConfig?.code) as string | number | undefined;
  const codeFromPath = pathname?.split("/").filter(Boolean)[1];
  const initialCode = String(codeFromConfig ?? codeFromPath ?? "");

  const [orderCode, setOrderCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const timeline = useMemo(() => buildTimeline(order?.status ?? "pending"), [order?.status]);

  const search = async () => {
    const code = orderCode.trim();
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getOrder(code);
      setOrder(data);
    } catch (e) {
      console.error(e);
      setError(tFrontendAuto("fe.bd476c98aaaf"));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

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
            <span className="text-dark">{tFrontendAuto("fe.a9326a29b69c")}</span>
          </nav>
        </div>
      </div>

      <section className="container py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-6">{tFrontendAuto("fe.a9326a29b69c")}</h1>

        <div className="bg-white rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-dark mb-4">{tFrontendAuto("fe.b1cecad97e68")}</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              placeholder={tFrontendAuto("fe.8f6213d86db5")}
              className="flex-1 px-4 py-3 border rounded-lg focus:border-primary focus:outline-none"
            />
            <button
              onClick={search}
              disabled={loading}
              className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-60"
            >
              {loading ? "..." : "جستجو"}
            </button>
          </div>
          {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}
        </div>

        {order ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-dark mb-2">
                    سفارش شماره: <span>{order.code ?? order.id}</span>
                  </h2>
                  <p className="text-sm text-gray-600">تاریخ سفارش: {formatDateTime(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <button type="button" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
                    چاپ فاکتور
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-bold text-dark mb-6">{tFrontendAuto("fe.4b945c1ab47c")}</h3>
                <div className="space-y-6">
                  {timeline.map((t) => {
                    const dotCls =
                      t.state === "completed"
                        ? "bg-primary border-primary"
                        : t.state === "active"
                          ? "bg-primary border-primary"
                          : "bg-gray-200 border-gray-200";
                    return (
                      <div key={t.key} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-white ${dotCls}`}>
                            {t.state === "completed" ? "✓" : t.state === "active" ? "🚚" : "•"}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-dark mb-1">{t.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{t.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* خلاصه فاکتور */}
              <div className="border-t pt-6 mt-6">
                <h3 className="font-bold text-dark mb-4">{tFrontendAuto("fe.aa69600564cc")}</h3>
                <div className="space-y-2 mb-4">
                  {order.items?.map((item) => {
                    const prod = item.product as { title?: string } | undefined;
                    const unitPrice = ensureNumber(item.unit_price);
                    const total = unitPrice * (item.quantity || 0);
                    return (
                      <div key={item.id} className="flex justify-between text-sm py-1 border-b border-gray-100">
                        <span>
                          {prod?.title ?? "محصول"} × {item.quantity}
                        </span>
                        <span>{formatPrice(total)} تومان</span>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{tFrontendAuto("fe.1ea35e715a0b")}</span>
                    <span>{formatPrice(ensureNumber(order.products_total_amount))} تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{tFrontendAuto("fe.c580b95eac6e")}</span>
                    <span>{formatPrice(ensureNumber(order.delivery_amount))} تومان</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>{tFrontendAuto("fe.2e6cbd8c252b")}</span>
                    <span className="text-primary">{formatPrice(ensureNumber(order.payable_amount))} تومان</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
