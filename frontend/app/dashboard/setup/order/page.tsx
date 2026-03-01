"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  ShieldCheck,
  CreditCard,
  Truck,
  Package,
  Search,
  Image as ImageIcon,
  BookOpen,
  Video,
  Headphones,
  Loader2,
  Sparkles,
} from "lucide-react";
import { storeApi } from "@/lib/api";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  domain: Globe,
  ssl: ShieldCheck,
  enamad: ShieldCheck,
  payment: CreditCard,
  shipping: Truck,
  first_product: Package,
  seo: Search,
  branding: ImageIcon,
  subscription: CreditCard,
  training: Video,
  support: Headphones,
};

function formatPrice(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n);
}

export default function InitialSetupOrderPage() {
  const [service, setService] = useState<{
    slug: string;
    title: string;
    description: string;
    items: Array<{ key: string; title: string; description: string }>;
    cost_amount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    storeApi
      .getInitialSetupService()
      .then(setService)
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitOrder = async () => {
    if (!service) return;
    if (service.cost_amount <= 0) {
      setError(tFrontendAuto("fe.3a49288d6e3c"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await storeApi.createSmartSetupRequest();
      if (res.payment_link) {
        window.location.href = res.payment_link;
      } else {
        setError(tFrontendAuto("fe.13745bdc4e8c"));
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "خطا در ثبت سفارش");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12 text-gray-500">
        خطا در بارگذاری اطلاعات سرویس.
        <Link href="/dashboard" className="text-violet-600 hover:underline mr-2">
          بازگشت به داشبورد
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-violet-600">
          داشبورد
        </Link>
        <ArrowRight className="h-4 w-4 rotate-180" />
        <span className="text-gray-700 font-medium">{tFrontendAuto("fe.13ba7caa6bea")}</span>
      </div>

      <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/30 shadow-sm overflow-hidden">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-violet-100">
              <Sparkles className="h-8 w-8 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{service.title}</h1>
              <p className="text-gray-600 mt-1">{service.description}</p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{tFrontendAuto("fe.4b8340fa0dc4")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.items.map((item) => {
              const Icon = ICON_MAP[item.key] ?? CheckCircle2;
              return (
                <div
                  key={item.key}
                  className="flex gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-violet-200 hover:shadow-sm transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-8 pb-8 pt-4 border-t border-violet-100">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-lg">
              {service.cost_amount > 0 ? (
                <>
                  <span className="text-gray-600">{tFrontendAuto("fe.2e8a2c608d45")}</span>
                  <span className="font-bold text-violet-700 mr-2">
                    {formatPrice(service.cost_amount)} تومان
                  </span>
                </>
              ) : (
                <span className="text-amber-600">
                  هزینه این سرویس در پنل ادمین تنظیم نشده است. با پشتیبانی تماس بگیرید.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={submitting || service.cost_amount <= 0}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              ثبت سفارش و پرداخت
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
