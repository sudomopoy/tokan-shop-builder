"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faWallet,
  faUsers,
  faStore,
  faSignOutAlt,
  faArrowRight,
  faBars,
  faTimes,
  faHandHoldingDollar,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { getPanelInfo } from "@/lib/api";
import { DEPLOY_DIRECTION, DEPLOY_LOCALE, pickByLocale } from "@/lib/i18n";

type PanelInfo = Awaited<ReturnType<typeof getPanelInfo>>;

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function formatPersianNumber(num: number): string {
  if (DEPLOY_LOCALE !== "fa") return String(num);
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]!);
}

const navItems = [
  { name: pickByLocale({ fa: "داشبورد", en: "Dashboard" }), href: "/panel/dashboard", icon: faHome },
  { name: pickByLocale({ fa: "کیف پول", en: "Wallet" }), href: "/panel/wallet", icon: faWallet },
  { name: pickByLocale({ fa: "دعوت و کسب درآمد", en: "Affiliate" }), href: "/panel/affiliate", icon: faUsers },
  { name: pickByLocale({ fa: "فروشگاه‌های من", en: "My Stores" }), href: "/panel/stores", icon: faStore },
];
const adminNavItems = [
  {
    name: pickByLocale({ fa: "مدیریت درخواست‌های برداشت", en: "Withdraw Requests" }),
    href: "/panel/admin/withdrawals",
    icon: faClipboardList,
  },
];

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [info, setInfo] = useState<PanelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPanelInfo()
      .then(setInfo)
      .catch(() => router.replace("/panel/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("tokan_auth_v1");
    localStorage.removeItem("auth_token");
    router.replace("/panel/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!info) return null;

  const isAdmin = !!info.user?.is_superuser;
  const balance = info.user?.wallet?.available_balance ?? 0;

  return (
    <div className="min-h-screen hero-surface flex" dir={DEPLOY_DIRECTION}>
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-white/90 border border-slate-200 shadow-lg"
      >
        <FontAwesomeIcon icon={faBars} className="h-5 w-5 text-slate-700" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 w-72 bg-white border-l border-slate-200 shadow-xl z-40 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden glass flex items-center justify-center">
              <Image src="/logo.jpg" alt={pickByLocale({ fa: "توکان", en: "Tokan" })} width={28} height={28} className="rounded-lg" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">{pickByLocale({ fa: "پنل توکان", en: "Tokan Panel" })}</h1>
              <p className="text-xs text-slate-500 truncate max-w-[140px]">
                {info.user?.mobile || info.user?.username}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="px-4 text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                  {pickByLocale({ fa: "مدیریت سیستم", en: "System Admin" })}
                </p>
              </div>
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive ? "bg-amber-50 text-amber-700 font-medium" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="mb-3 px-4 py-3 rounded-xl bg-brand-50/50 border border-brand-100">
            <p className="text-xs text-slate-500">{pickByLocale({ fa: "موجودی کیف پول", en: "Wallet Balance" })}</p>
            <p className="text-lg font-bold text-brand-700">
              {formatPersianNumber(typeof balance === "string" ? parseFloat(balance) || 0 : Number(balance) || 0)}{" "}
              {pickByLocale({ fa: "تومان", en: "IRR" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              onClick={() => setSidebarOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 border border-slate-200"
            >
              <FontAwesomeIcon icon={faArrowRight} />
              {pickByLocale({ fa: "صفحه اصلی", en: "Home" })}
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 border border-red-100"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              {pickByLocale({ fa: "خروج", en: "Logout" })}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:mr-72 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
