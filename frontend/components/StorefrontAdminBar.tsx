"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  Settings,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Bell,
  BookOpen,
  Store,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { accountApi, storeApi, announcementApi } from "@/lib/api";
import { getMediaUrl } from "@/lib/api/storeApi";
import type { User } from "@/lib/api/accountApi";
import type { StoreListItem } from "@/lib/api/storeApi";
import { DEPLOY_DIRECTION, DEPLOY_LOCALE } from "@/lib/i18n/deployment";
import { tFrontend } from "@/lib/i18n/messages";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function toPersianDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]!);
}

function getStoreFrontUrl(store: StoreListItem | null): string {
  if (!store) return "#";
  const domain = store.external_domain || store.internal_domain || `${store.name}.tokan.app`;
  return `https://${domain}`;
}

type QuickLinkItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "unreadCount";
};

const QUICK_LINKS: QuickLinkItem[] = [
  {
    href: "/dashboard",
    label: tFrontend("adminBar.dashboard"),
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/products",
    label: tFrontend("adminBar.products"),
    icon: Package,
  },
  {
    href: "/dashboard/products/new",
    label: tFrontend("adminBar.newProduct"),
    icon: Plus,
  },
  {
    href: "/dashboard/orders",
    label: tFrontend("adminBar.orders"),
    icon: ShoppingCart,
  },
  {
    href: "/dashboard/blog",
    label: tFrontend("adminBar.blog"),
    icon: BookOpen,
  },
  {
    href: "/dashboard/notifications",
    label: tFrontend("adminBar.notifications"),
    icon: Bell,
    badgeKey: "unreadCount",
  },
  {
    href: "/dashboard/settings",
    label: tFrontend("adminBar.settings"),
    icon: Settings,
  },
];

export default function StorefrontAdminBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [currentStore, setCurrentStore] = useState<StoreListItem | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDashboard = pathname?.startsWith("/dashboard");

  useEffect(() => {
    if (isDashboard) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [userData, storeData, count] = await Promise.all([
          accountApi.getInfo(),
          storeApi.getCurrentStore().catch(() => null),
          announcementApi.unreadCount().catch(() => 0),
        ]);
        if (cancelled) return;
        setUser(userData);
        setCurrentStore(storeData);
        setUnreadCount(count);
      } catch {
        if (cancelled) return;
        setUser(null);
        setCurrentStore(null);
        setUnreadCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isDashboard]);

  useEffect(() => {
    if (!user || isDashboard) return;
    const refresh = async () => {
      try {
        const count = await announcementApi.unreadCount();
        setUnreadCount(count);
      } catch {
        /* ignore */
      }
    };
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [user, isDashboard]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  const hasDashboardAccess =
    !!user &&
    (user.is_superuser ||
      !!user.store_user?.is_admin ||
      !!user.store_user?.is_vendor);

  if (isDashboard || loading || !hasDashboardAccess) {
    return null;
  }

  const storeUrl = getStoreFrontUrl(currentStore);
  const hasStore = !!currentStore && storeUrl !== "#";
  const storeLogo = currentStore?.minimal_logo || currentStore?.favicon;
  const storeTitle =
    currentStore?.title ||
    currentStore?.name ||
    tFrontend("adminBar.storeDefault");

  const getBadge = (key: string) => {
    if (key === "unreadCount" && unreadCount > 0) {
      if (DEPLOY_LOCALE === "fa") {
        return unreadCount > 99 ? "۹۹+" : toPersianDigits(unreadCount);
      }
      return unreadCount > 99 ? "99+" : String(unreadCount);
    }
    return null;
  };

  const linkItem = (item: QuickLinkItem, isMobile = false) => {
    const badge = item.badgeKey ? getBadge(item.badgeKey) : null;
    const Icon = item.icon;
    const content = (
      <>
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
        {badge && (
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-slate-900"
            aria-label={
              tFrontend("adminBar.unreadAria", { count: unreadCount })
            }
          >
            {badge}
          </span>
        )}
      </>
    );
    const baseClass = isMobile
      ? "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/95 hover:bg-white/15 transition-colors"
      : "flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-white/10 transition-colors";
    return (
      <Link
        key={item.href}
        href={item.href}
        className={baseClass}
        title={item.label}
        onClick={() => isMobile && setMobileMenuOpen(false)}
      >
        {content}
      </Link>
    );
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-[9999] border-b border-white/10 bg-slate-900/95 text-white shadow-xl backdrop-blur-md"
        dir={DEPLOY_DIRECTION}
        ref={menuRef}
      >
        <div className="flex items-center justify-between h-11 sm:h-10 px-3 sm:px-4 text-xs sm:text-[13px]">
          {/* Right side: Quick links (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-1">
            {QUICK_LINKS.slice(0, 5).map((item) => linkItem(item, false))}
            {QUICK_LINKS[5] && linkItem(QUICK_LINKS[5], false)}
            {QUICK_LINKS[6] && linkItem(QUICK_LINKS[6], false)}

            {hasStore && (
              <>
                <span className="w-px h-4 bg-white/20 mx-1" aria-hidden />
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-white/10 transition-colors text-white/90"
                  title={tFrontend("adminBar.openStoreNewTab")}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{tFrontend("adminBar.viewStore")}</span>
                </a>
              </>
            )}
          </div>

          {/* Mobile: Hamburger + Store info */}
          <div className="flex md:hidden items-center gap-2 flex-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition-all"
              aria-expanded={mobileMenuOpen}
              aria-label={
                mobileMenuOpen
                  ? tFrontend("adminBar.menuClose")
                  : tFrontend("adminBar.menuOpen")
              }
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 min-w-0 flex-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              {storeLogo?.file ? (
                <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(storeLogo)}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Store className="h-3.5 w-3.5 text-white/80" />
                </div>
              )}
              <span className="font-semibold truncate text-white/95">
                {storeTitle}
              </span>
            </Link>
          </div>

          {/* Left side: Store badge (desktop) */}
          <div className="hidden md:flex items-center gap-2.5 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-white/10 transition-colors min-w-0"
            >
              {storeLogo?.file ? (
                <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(storeLogo)}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Store className="h-3.5 w-3.5 text-white/80" />
                </div>
              )}
              <span className="font-semibold truncate max-w-[180px] text-white/95">
                {storeTitle}
              </span>
            </Link>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t border-white/10 bg-slate-900/98 backdrop-blur-md"
            role="menu"
          >
            <div className="px-3 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
              {QUICK_LINKS.map((item) => (
                <div key={item.href}>{linkItem(item, true)}</div>
              ))}
              {hasStore && (
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/95 hover:bg-white/15 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>
                    {tFrontend("adminBar.openStoreNewTab")}
                  </span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Spacer */}
      <div
        className="h-11 sm:h-10 shrink-0"
        aria-hidden
      />
    </>
  );
}
