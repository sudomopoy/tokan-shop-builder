"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  XCircle,
  CheckCircle,
  Eye,
  Calendar,
} from "lucide-react";
import { orderApi, type SalesStatistics } from "@/lib/api/orderApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const Chart = dynamic(() => import("react-apexcharts").then((mod) => mod.default), {
  ssr: false,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  processing: "در حال آماده‌سازی",
  completed: "تکمیل شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  failed: "ناموفق",
};

function formatPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return new Intl.NumberFormat("fa-IR").format(n);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
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

function formatChartDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function statusBadge(status: string) {
  const label = STATUS_LABELS[status] ?? status;
  const cls =
    status === "delivered" || status === "completed"
      ? "bg-green-100 text-green-700"
      : status === "processing" || status === "paid"
        ? "bg-blue-100 text-blue-700"
        : status === "pending"
          ? "bg-amber-100 text-amber-700"
          : status === "cancelled" || status === "failed"
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-700";
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

export default function FinancePage() {
  const [stats, setStats] = useState<SalesStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await orderApi.getSalesStatistics();
        setStats(data);
      } catch (err) {
        console.error("Error fetching sales statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{tFrontendAuto("fe.763d3603e81d")}</h1>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{tFrontendAuto("fe.763d3603e81d")}</h1>
        <div className="card text-center py-12 text-gray-500">
          <p>{tFrontendAuto("fe.50a8c6e5b5c4")}</p>
        </div>
      </div>
    );
  }

  const revenueChartOptions = {
    chart: {
      type: "area" as const,
      toolbar: { show: false },
      fontFamily: "Vazirmatn, sans-serif",
      zoom: { enabled: false },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth" as const, width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    xaxis: {
      categories: stats.revenue_by_day.map((d) => formatChartDate(d.date)),
      labels: {
        rotate: -45,
        style: { fontSize: "11px" },
      },
    },
    yaxis: {
      labels: {
        formatter: (v: number) => formatPrice(v),
      },
    },
    colors: ["#3b82f6"],
    tooltip: {
      y: {
        formatter: (v: number) => `${formatPrice(v)} تومان`,
      },
    },
  };

  const revenueChartSeries = [
    {
      name: "درآمد",
      data: stats.revenue_by_day.map((d) => parseFloat(d.revenue) || 0),
    },
  ];

  const ordersChartOptions = {
    chart: {
      type: "bar" as const,
      toolbar: { show: false },
      fontFamily: "Vazirmatn, sans-serif",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "60%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: stats.revenue_by_day.map((d) => formatChartDate(d.date)),
      labels: {
        rotate: -45,
        style: { fontSize: "11px" },
      },
    },
    colors: ["#10b981"],
    tooltip: {
      y: {
        formatter: (v: number) => `${v} سفارش`,
      },
    },
  };

  const ordersChartSeries = [
    {
      name: "تعداد سفارش",
      data: stats.revenue_by_day.map((d) => d.orders_count),
    },
  ];

  const statCards = [
    {
      name: "کل درآمد",
      value: formatPrice(stats.total_revenue),
      unit: "تومان",
      icon: DollarSign,
      color: "bg-emerald-500",
      desc: "مجموع درآمد سفارشات پرداخت شده",
    },
    {
      name: "درآمد امروز",
      value: formatPrice(stats.today_revenue),
      unit: "تومان",
      icon: TrendingUp,
      color: "bg-blue-500",
      desc: "درآمد سفارشات امروز",
    },
    {
      name: "درآمد این ماه",
      value: formatPrice(stats.month_revenue),
      unit: "تومان",
      icon: Calendar,
      color: "bg-violet-500",
      desc: "درآمد سفارشات ماه جاری",
    },
    {
      name: "کل سفارشات",
      value: stats.total_orders,
      unit: "سفارش",
      icon: ShoppingCart,
      color: "bg-amber-500",
      desc: "تعداد کل سفارشات",
    },
  ];

  const statusCards = [
    { name: "پرداخت شده", value: stats.paid_orders_count, icon: CheckCircle, color: "bg-green-500" },
    { name: "در انتظار پرداخت", value: stats.pending_orders_count, icon: Clock, color: "bg-amber-500" },
    { name: "تحویل شده", value: stats.delivered_orders_count, icon: Package, color: "bg-blue-500" },
    { name: "لغو شده", value: stats.cancelled_orders_count, icon: XCircle, color: "bg-red-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{tFrontendAuto("fe.763d3603e81d")}</h1>
        <p className="text-gray-600 mt-1">{tFrontendAuto("fe.54a43dbfb4e2")}</p>
      </div>

      {/* کارت‌های اصلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.name} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.name}</p>
                <p className="text-2xl font-bold">
                  {card.value}{" "}
                  <span className="text-sm font-normal text-gray-500">{card.unit}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* کارت‌های وضعیت سفارشات */}
      <div>
        <h2 className="text-xl font-bold mb-4">{tFrontendAuto("fe.d646430cb3c2")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusCards.map((card) => (
            <div key={card.name} className="card flex items-center gap-4">
              <div className={`${card.color} p-2.5 rounded-lg`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{card.name}</p>
                <p className="text-lg font-bold">{card.value.toLocaleString("fa-IR")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* نمودار درآمد ۳۰ روز */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">{tFrontendAuto("fe.7c22fada8467")}</h2>
        <div className="h-80">
          <Chart
            options={revenueChartOptions}
            series={revenueChartSeries}
            type="area"
            height="100%"
            width="100%"
          />
        </div>
      </div>

      {/* نمودار تعداد سفارشات */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">{tFrontendAuto("fe.ca053c38aab3")}</h2>
        <div className="h-80">
          <Chart
            options={ordersChartOptions}
            series={ordersChartSeries}
            type="bar"
            height="100%"
            width="100%"
          />
        </div>
      </div>

      {/* آخرین سفارشات */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">{tFrontendAuto("fe.7ca63fd4d9eb")}</h2>
          <Link
            href="/dashboard/orders"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            مشاهده همه
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">{tFrontendAuto("fe.4e13742ef7b3")}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">{tFrontendAuto("fe.3747dab0ba22")}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">{tFrontendAuto("fe.b56dc5016988")}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">{tFrontendAuto("fe.f93805684cab")}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">{tFrontendAuto("fe.ad12690641ac")}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recent_orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    سفارشی یافت نشد
                  </td>
                </tr>
              ) : (
                stats.recent_orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-medium">{order.code ?? "—"}</td>
                    <td className="px-6 py-4">{formatPrice(order.payable_amount)} تومان</td>
                    <td className="px-6 py-4">{statusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/orders/${order.code}`}
                        className="inline-flex items-center gap-1.5 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">{tFrontendAuto("fe.1b2b6460d4eb")}</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
