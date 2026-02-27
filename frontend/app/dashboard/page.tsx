"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Package, Users, BookOpen, Images, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { productApi, storeUserApi, articleApi, sliderApi, orderApi } from "@/lib/api";
import Link from "next/link";
import { DashboardNotificationsSection } from "@/components/dashboard/DashboardNotificationsSection";

const SetupTasksSection = dynamic(
  () => import("@/components/dashboard/SetupTasksSection").then((m) => m.default),
  { ssr: false }
);

function formatPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return new Intl.NumberFormat("fa-IR").format(n);
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    products_count: 0,
    users_count: 0,
    articles_count: 0,
    sliders_count: 0,
  });
  const [financeStats, setFinanceStats] = useState<{
    total_revenue: string;
    today_revenue: string;
    total_orders: number;
    paid_orders_count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, usersRes, articlesRes, slidersRes, financeRes] = await Promise.all([
          productApi.list({ page_size: 1 }),
          storeUserApi.list({ page_size: 1 }),
          articleApi.list({ page_size: 1, status: ["draft", "public"] }),
          sliderApi.list({ include_inactive: true, page_size: 100 }),
          orderApi.getSalesStatistics().catch(() => null),
        ]);
        const sliders = slidersRes.results ?? [];
        setStats({
          products_count: productsRes.count ?? productsRes.results?.length ?? 0,
          users_count: usersRes.count ?? usersRes.results?.length ?? 0,
          articles_count: articlesRes.count ?? articlesRes.results?.length ?? 0,
          sliders_count: sliders.length,
        });
        if (financeRes) {
          setFinanceStats({
            total_revenue: financeRes.total_revenue,
            today_revenue: financeRes.today_revenue,
            total_orders: financeRes.total_orders,
            paid_orders_count: financeRes.paid_orders_count,
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      name: "تعداد محصولات",
      value: stats.products_count,
      unit: "محصول",
      icon: Package,
      color: "bg-blue-500",
      href: "/dashboard/products",
    },
    {
      name: "تعداد کاربران",
      value: stats.users_count,
      unit: "کاربر",
      icon: Users,
      color: "bg-green-500",
      href: "/dashboard/users",
    },
    {
      name: "مقالات بلاگ",
      value: stats.articles_count,
      unit: "مقاله",
      icon: BookOpen,
      color: "bg-violet-500",
      href: "/dashboard/blog",
    },
    {
      name: "اسلایدرها",
      value: stats.sliders_count,
      unit: "اسلایدر",
      icon: Images,
      color: "bg-amber-500",
      href: "/dashboard/sliders",
    },
  ];

  const financeCards = financeStats
    ? [
        {
          name: "کل درآمد",
          value: formatPrice(financeStats.total_revenue),
          unit: "تومان",
          icon: DollarSign,
          color: "bg-emerald-500",
          href: "/dashboard/finance",
        },
        {
          name: "درآمد امروز",
          value: formatPrice(financeStats.today_revenue),
          unit: "تومان",
          icon: TrendingUp,
          color: "bg-blue-500",
          href: "/dashboard/finance",
        },
        {
          name: "کل سفارشات",
          value: financeStats.total_orders,
          unit: "سفارش",
          icon: ShoppingCart,
          color: "bg-amber-500",
          href: "/dashboard/orders",
        },
        {
          name: "سفارشات پرداخت شده",
          value: financeStats.paid_orders_count,
          unit: "سفارش",
          icon: ShoppingCart,
          color: "bg-violet-500",
          href: "/dashboard/orders",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">داشبورد</h1>

      <SetupTasksSection />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {financeCards.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">آمار فروش و درآمد</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {financeCards.map((card) => (
                  <Link
                    key={card.name}
                    href={card.href}
                    className="card hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">{card.name}</p>
                        <p className="text-2xl font-bold">
                          {typeof card.value === "number"
                            ? card.value.toLocaleString("fa-IR")
                            : card.value}{" "}
                          <span className="text-sm text-gray-500">{card.unit}</span>
                        </p>
                      </div>
                      <div className={`${card.color} p-3 rounded-lg`}>
                        <card.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">محتوای فروشگاه</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card) => (
                <Link
                  key={card.name}
                  href={card.href}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{card.name}</p>
                      <p className="text-2xl font-bold">
                        {card.value.toLocaleString()}{" "}
                        <span className="text-sm text-gray-500">{card.unit}</span>
                      </p>
                    </div>
                    <div className={`${card.color} p-3 rounded-lg`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <DashboardNotificationsSection />
    </div>
  );
}
