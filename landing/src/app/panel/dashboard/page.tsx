"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faUsers,
  faStore,
  faArrowLeft,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { getPanelInfo, getAffiliateEarnings } from "@/lib/api";
import { tLandingAuto } from "@/lib/autoMessages";

function formatPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return new Intl.NumberFormat("fa-IR").format(n);
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function formatPersianNumber(num: number): string {
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]!);
}

type PanelInfo = Awaited<ReturnType<typeof getPanelInfo>>;
type AffiliateEarnings = Awaited<ReturnType<typeof getAffiliateEarnings>>;

const quickLinks = [
  {
    title: "کیف پول",
    description: "شارژ کیف پول، برداشت، تراکنش‌ها",
    href: "/panel/wallet",
    icon: faWallet,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    title: "دعوت و کسب درآمد",
    description: "لینک دعوت، درآمد افیلیت، دعوت‌شده‌ها",
    href: "/panel/affiliate",
    icon: faUsers,
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
  },
  {
    title: "فروشگاه‌های من",
    description: "مدیریت فروشگاه‌ها، ورود به داشبورد",
    href: "/panel/stores",
    icon: faStore,
    color: "bg-violet-500",
    bgColor: "bg-violet-50",
  },
];

export default function PanelDashboardPage() {
  const [info, setInfo] = useState<PanelInfo | null>(null);
  const [earnings, setEarnings] = useState<AffiliateEarnings | null>(null);

  useEffect(() => {
    getPanelInfo().then(setInfo).catch(() => {});
    getAffiliateEarnings().then(setEarnings).catch(() => null);
  }, []);

  const balance = info?.user?.wallet?.available_balance ?? 0;
  const storesCount = info?.stores?.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{tLandingAuto("ld.8ff6c868762a")}</h1>
      <p className="text-slate-600 mb-8">
        خوش آمدید به پنل مدیریت توکان
      </p>

      {/* خلاصه موجودی و درآمد */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-5 border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">{tLandingAuto("ld.1d190755e8fa")}</p>
          <p className="text-xl font-bold text-slate-900">{formatPrice(balance)} تومان</p>
          <Link
            href="/panel/wallet"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
          >
            مدیریت کیف پول
            <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
          </Link>
        </div>
        {earnings && (
          <>
            <div className="glass rounded-2xl p-5 border border-emerald-100 bg-emerald-50/30">
              <p className="text-sm text-slate-500 mb-1">{tLandingAuto("ld.bee140eafd7c")}</p>
              <p className="text-xl font-bold text-emerald-700">{formatPrice(earnings.total_completed)} تومان</p>
            </div>
            <div className="glass rounded-2xl p-5 border border-amber-100 bg-amber-50/30">
              <p className="text-sm text-slate-500 mb-1">{tLandingAuto("ld.7ebe6037b53b")}</p>
              <p className="text-xl font-bold text-amber-700">{formatPrice(earnings.total_pending)} تومان</p>
            </div>
          </>
        )}
      </div>

      {/* لینک‌های سریع */}
      <h2 className="text-lg font-semibold text-slate-800 mb-4">{tLandingAuto("ld.4219bbd62390")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`glass rounded-2xl p-5 border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all group ${link.bgColor}`}
          >
            <div className={`w-12 h-12 rounded-xl ${link.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
              <FontAwesomeIcon icon={link.icon} className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{link.title}</h3>
            <p className="text-sm text-slate-500">{link.description}</p>
            <span className="mt-3 inline-flex items-center gap-2 text-sm text-brand-600 font-medium">
              ورود
              <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>

      {/* فروشگاه‌ها - پیش‌نمایش */}
      {info?.stores && info.stores.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">{tLandingAuto("ld.0fb874d2b597")}</h2>
            <Link
              href="/panel/stores"
              className="text-sm text-brand-600 hover:underline flex items-center gap-1"
            >
              مشاهده همه
              <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {info.stores.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="glass rounded-xl p-4 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{s.title}</p>
                  <p className="text-xs text-slate-500">{s.internal_domain}</p>
                </div>
                <a
                  href={s.dashboard_url || `https://${s.internal_domain}/dashboard`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-brand-600 hover:bg-brand-50"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  داشبورد
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
