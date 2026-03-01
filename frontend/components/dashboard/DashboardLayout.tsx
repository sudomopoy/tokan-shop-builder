"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Package,
  Users,
  FileText,
  FolderOpen,
  Menu,
  X,
  LogOut,
  Sparkles,
  BookOpen,
  Bell,
  Settings,
  ChevronDown,
  Store,
  Image as ImageIcon,
  Globe,
  Palette,
  CreditCard,
  Truck,
  SlidersHorizontal,
  ListOrdered,
  Images,
  ShoppingCart,
  Wallet,
  CalendarCheck,
  Banknote,
  UserPlus,
  BarChart3,
  Shield,
  Phone,
  Tag,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import VideoHelpDrawer, { DRAWER_WIDTH } from "./VideoHelpDrawer";
import { NotificationBell } from "./NotificationBell";
import AdminToolbar from "./AdminToolbar";
import { accountApi, storeApi, announcementApi } from "@/lib/api";
import type { User } from "@/lib/api/accountApi";
import type { StoreListItem } from "@/lib/api/storeApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const SETTINGS_TABS_BASE = [
  { id: "general", name: "اطلاعات کلی", href: "/dashboard/settings?tab=general", icon: Store },
  { id: "contact", name: "تماس و شبکه‌های اجتماعی", href: "/dashboard/settings?tab=contact", icon: Phone },
  { id: "domain", name: "دامنه و آدرس", href: "/dashboard/settings?tab=domain", icon: Globe },
  { id: "theme", name: "ظاهر و تم", href: "/dashboard/settings?tab=theme", icon: Palette },
  { id: "payment", name: "درگاه‌های پرداخت", href: "/dashboard/settings?tab=payment", icon: CreditCard },
  { id: "shipping", name: "روش‌های ارسال", href: "/dashboard/settings?tab=shipping", icon: Truck, requiresPhysical: true },
  { id: "seo", name: "سئو و آنالیز", href: "/dashboard/settings?tab=seo", icon: BarChart3 },
  { id: "badges", name: "نمادها", href: "/dashboard/settings?tab=badges", icon: Shield },
  { id: "store-settings", name: "تنظیمات پیشرفته", href: "/dashboard/settings?tab=store-settings", icon: SlidersHorizontal },
] as const;

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function toPersianDigits(num: number | string): string {
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]!);
}

function formatPersianNumber(num: number): string {
  const formatted = new Intl.NumberFormat("en-US").format(num);
  return toPersianDigits(formatted);
}

const SUBSCRIPTION_TABS = [
  { id: "renew", name: "تمدید اشتراک", href: "/dashboard/subscription", icon: CreditCard },
  { id: "history", name: "تاریخچه اشتراک", href: "/dashboard/subscription/history", icon: FileText },
] as const;

const PRODUCT_TABS = [
  { id: "new", name: "ایجاد محصول جدید", href: "/dashboard/products/new", icon: Package },
  { id: "list", name: "لیست محصولات", href: "/dashboard/products", icon: ListOrdered },
  { id: "categories", name: "دسته‌بندی‌ها", href: "/dashboard/products/categories", icon: FolderOpen },
  { id: "tags", name: "تگ‌ها", href: "/dashboard/products/tags", icon: Tag },
] as const;

const BLOG_TABS = [
  { id: "new", name: "ایجاد مقاله جدید", href: "/dashboard/blog/new", icon: FileText },
  { id: "list", name: "لیست مقالات", href: "/dashboard/blog", icon: ListOrdered },
  { id: "categories", name: "دسته‌بندی‌ها", href: "/dashboard/blog/categories", icon: FolderOpen },
  { id: "tags", name: "تگ‌ها", href: "/dashboard/blog/tags", icon: Tag },
] as const;

const RESERVATION_TABS = [
  { id: "appointments", name: "لیست رزروها", href: "/dashboard/reservation", icon: CalendarDays },
  { id: "providers", name: "ارائه‌دهندگان", href: "/dashboard/reservation/providers", icon: Users },
  { id: "services", name: "سرویس‌ها", href: "/dashboard/reservation/services", icon: Package },
] as const;

/** نقشه مسیر به بخش برای فیلتر دسترسی ادمین */
const PATH_TO_SECTION: Record<string, string> = {
  "/dashboard/products": "products",
  "/dashboard/users": "users",
  "/dashboard/orders": "orders",
  "/dashboard/blog": "blog",
  "/dashboard/reviews": "reviews",
  "/dashboard/affiliate": "affiliate",
  "/dashboard/reservation": "reservation",
};

/** بخش‌هایی که فقط مالک فروشگاه دسترسی دارد */
const OWNER_ONLY_PATHS = [
  "/dashboard/subscription",
  "/dashboard/finance",
  "/dashboard/menus",
  "/dashboard/sliders",
  "/dashboard/pages",
  "/dashboard/settings",
];

const NAV_BASE = [
  { name: "داشبورد", href: "/dashboard", icon: Home },
  {
    name: "اشتراک فروشگاه",
    href: "/dashboard/subscription",
    icon: CalendarCheck,
    expandKey: "subscription",
    children: SUBSCRIPTION_TABS,
  },
  {
    name: "مدیریت محصولات",
    href: "/dashboard/products",
    icon: Package,
    expandKey: "products",
    children: PRODUCT_TABS,
    hideForReservation: true,
  },
  { name: "مدیریت سفارشات", href: "/dashboard/orders", icon: ShoppingCart, hideForReservation: true },
  {
    name: "مدیریت رزروها",
    href: "/dashboard/reservation",
    icon: CalendarDays,
    showForReservation: true,
    expandKey: "reservation",
    children: RESERVATION_TABS,
  },
  { name: "آمار مالی", href: "/dashboard/finance", icon: Wallet },
  {
    name: "مدیریت بلاگ",
    href: "/dashboard/blog",
    icon: BookOpen,
    expandKey: "blog",
    children: BLOG_TABS,
  },
  { name: "نظرات کاربران", href: "/dashboard/reviews", icon: MessageSquare, hideForReservation: true },
  { name: "اعلانات", href: "/dashboard/notifications", icon: Bell },
  { name: "مدیریت کاربران", href: "/dashboard/users", icon: Users },
  { name: "دعوت و کسب درآمد", href: "/dashboard/affiliate", icon: UserPlus },
  { name: "مدیریت منوها", href: "/dashboard/menus", icon: ListOrdered },
  { name: "مدیریت اسلایدرها", href: "/dashboard/sliders", icon: Images },
  { name: "مدیریت فایل‌ها", href: "/dashboard/media", icon: FolderOpen },
  { name: "صفحه‌ساز", href: "/dashboard/pages", icon: FileText },
] as const;

function buildNavigation(storeCategorySlug: string | null | undefined) {
  const isReservation = storeCategorySlug === "reservation";
  const isPhysical = storeCategorySlug === "physical";
  const settingsTabs = SETTINGS_TABS_BASE.filter(
    (t) => !("requiresPhysical" in t && t.requiresPhysical && !isPhysical)
  );
  return [
    ...NAV_BASE.filter((n) => {
      if ("hideForReservation" in n && n.hideForReservation && isReservation) return false;
      if ("showForReservation" in n && n.showForReservation && !isReservation) return false;
      return true;
    }),
    {
      name: "تنظیمات فروشگاه",
      href: "/dashboard/settings?tab=general",
      icon: Settings,
      expandKey: "settings",
      children: settingsTabs,
    },
  ];
}

function canAccessNav(
  item: { href: string; children?: readonly unknown[] },
  user: User | null,
  isOwner: boolean
): boolean {
  if (!user?.store_user) return false;
  if (isOwner || user.is_superuser) return true;
  const check = (href: string) => {
    if (OWNER_ONLY_PATHS.some((p) => href.startsWith(p))) return false;
    if (href.startsWith("/dashboard/media")) return true; // مدیا: پیش‌فرض برای همه ادمین‌ها
    const perms = user?.store_user?.admin_permissions;
    if (!perms) return true;
    const p = perms as Record<string, boolean>;
    for (const [path, section] of Object.entries(PATH_TO_SECTION)) {
      if (href.startsWith(path)) return p[`${section}_read`] === true;
    }
    return true;
  };
  if (item.children?.length) {
    return item.children.some((c) => check((c as { href: string }).href));
  }
  return check(item.href);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("subscription");
  const [videoDrawerOpen, setVideoDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const currentTab = searchParams?.get("tab") ?? "general";
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [currentStore, setCurrentStore] = useState<StoreListItem | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await accountApi.getInfo();
        setUser(userData);
        try {
          const storesData = await storeApi.getMyStores();
          setStores(storesData);
        } catch {
          setStores([]);
        }
        try {
          const storeData = await storeApi.getCurrentStore();
          setCurrentStore(storeData);
        } catch {
          setCurrentStore(null);
        }
        try {
          const count = await announcementApi.unreadCount();
          setUnreadCount(count);
        } catch {
          setUnreadCount(0);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (pathname?.startsWith("/dashboard/settings")) {
      setExpandedSection("settings");
    } else if (pathname?.startsWith("/dashboard/subscription")) {
      setExpandedSection("subscription");
    } else if (pathname?.startsWith("/dashboard/products")) {
      setExpandedSection("products");
    } else if (pathname?.startsWith("/dashboard/blog")) {
      setExpandedSection("blog");
    } else if (pathname?.startsWith("/dashboard/reservation")) {
      setExpandedSection("reservation");
    }
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    if (accountMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!user) return;
    const refreshUnread = async () => {
      try {
        const count = await announcementApi.unreadCount();
        setUnreadCount(count);
      } catch {
        /* ignore */
      }
    };
    refreshUnread();
    const interval = setInterval(refreshUnread, 60000);
    return () => clearInterval(interval);
  }, [user, pathname]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("tokan_auth_v1");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    router.push("/");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isStoreOwner = !!(user?.store_user && user.store_user.level >= 2);
  const hasDashboardAccess =
    !!user &&
    (user.is_superuser ||
      isStoreOwner ||
      (!!user.store_user?.is_admin && !!user.store_user?.is_admin_active) ||
      !!user.store_user?.is_vendor);

  if (!user) {
    // روی خود صفحه لاگین داشبورد، فرم لاگین را نشان بده (children = صفحه login)
    if (pathname === "/dashboard/login") {
      return <>{children}</>;
    }
    const loginUrl = `/dashboard/login?next=${encodeURIComponent(pathname || "/dashboard")}`;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            ورود به داشبورد
          </h2>
          <p className="text-gray-600 mb-6">
            برای دسترسی به داشبورد فروشگاه، ابتدا وارد حساب کاربری خود شوید.
          </p>
          <Link
            href={loginUrl}
            className="btn-primary inline-block"
          >
            ورود به حساب کاربری
          </Link>
        </div>
      </div>
    );
  }

  if (!hasDashboardAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            دسترسی غیرمجاز
          </h2>
          <p className="text-gray-600 mb-4">
            حساب کاربری شما مجاز به دسترسی به داشبورد مدیریت فروشگاه نیست.
          </p>
          <p className="text-sm text-gray-500">
            فقط ادمین‌ها و صاحب فروشگاه می‌توانند به این بخش وارد شوند.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${
          sidebarOpen ? "" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 right-0 flex flex-col min-h-0 w-64 bg-gray-800 shadow-xl">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            <h2 className="text-xl font-bold bg-gradient-blue bg-clip-text text-transparent truncate max-w-[180px]">
              داشبورد {currentStore?.title || currentStore?.name || "فروشگاه"}
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="dashboard-sidebar-nav flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2">
            {buildNavigation(currentStore?.store_category?.slug).filter((item) => canAccessNav(item, user, isStoreOwner)).map((item) => {
              const hasChildren = "children" in item && Array.isArray(item.children);
              const expandKey = "expandKey" in item ? item.expandKey : null;
              const isParentActive = expandKey === "settings"
                ? pathname === "/dashboard/settings"
                : expandKey === "subscription"
                  ? pathname?.startsWith("/dashboard/subscription")
                  : expandKey === "products"
                    ? pathname?.startsWith("/dashboard/products")
                    : expandKey === "blog"
                      ? pathname?.startsWith("/dashboard/blog")
                      : false;
              const isExpanded = expandKey && expandedSection === expandKey;

              if (hasChildren && item.children && expandKey) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => setExpandedSection((e) => (e === expandKey ? null : expandKey))}
                      className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg transition-colors text-right ${
                        isParentActive
                          ? "bg-gray-700 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.name}</span>
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="mt-1 mr-4 space-y-1 border-r-2 border-gray-600">
                        {item.children.map((child: { id: string; name: string; href: string; icon: React.ComponentType<{ className?: string }> }) => {
                          const isChildActive = expandKey === "settings"
                            ? pathname === "/dashboard/settings" && currentTab === child.id
                            : pathname === child.href;
                          return (
                            <Link
                              key={child.id}
                              href={child.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                                isChildActive
                                  ? "bg-gradient-blue text-white"
                                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
                              }`}
                            >
                              <child.icon className="h-4 w-4 shrink-0" />
                              <span>{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive =
                item.href === "/dashboard/menus"
                  ? pathname?.startsWith("/dashboard/menus")
                  : item.href === "/dashboard/sliders"
                    ? pathname?.startsWith("/dashboard/sliders")
                    : item.href === "/dashboard/orders"
                      ? pathname?.startsWith("/dashboard/orders")
                      : item.href === "/dashboard/finance"
                        ? pathname?.startsWith("/dashboard/finance")
                        : item.href === "/dashboard/affiliate"
                          ? pathname?.startsWith("/dashboard/affiliate")
                          : pathname === item.href;
              const isNotifications = item.href === "/dashboard/notifications";
              const isAffiliate = item.href === "/dashboard/affiliate";
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isAffiliate
                      ? isActive
                        ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30"
                        : "text-emerald-300 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-400/50"
                      : isActive
                        ? "bg-gradient-blue text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="relative">
                    <item.icon className="h-5 w-5" />
                    {isNotifications && unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 flex h-4 w-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: "#dc2626", color: "white" }}
                      >
                        {unreadCount > 9 ? `${formatPersianNumber(9)}+` : formatPersianNumber(unreadCount)}
                      </span>
                    )}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Video help drawer - desktop only, from left */}
      <VideoHelpDrawer
        isOpen={videoDrawerOpen}
        onClose={() => setVideoDrawerOpen(false)}
      />

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:w-64 lg:min-h-0 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-gray-800 border-l border-gray-700">
          <div className="flex items-center h-16 px-4 border-b border-gray-700">
            <h2 className="text-xl font-bold bg-gradient-blue bg-clip-text text-transparent truncate">
              داشبورد {currentStore?.title || currentStore?.name || "فروشگاه"}
            </h2>
          </div>
          <nav className="dashboard-sidebar-nav flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2">
            {buildNavigation(currentStore?.store_category?.slug).filter((item) => canAccessNav(item, user, isStoreOwner)).map((item) => {
              const hasChildren = "children" in item && Array.isArray(item.children);
              const expandKey = "expandKey" in item ? item.expandKey : null;
              const isParentActive = expandKey === "settings"
                ? pathname === "/dashboard/settings"
                : expandKey === "subscription"
                  ? pathname?.startsWith("/dashboard/subscription")
                  : expandKey === "products"
                    ? pathname?.startsWith("/dashboard/products")
                    : expandKey === "blog"
                      ? pathname?.startsWith("/dashboard/blog")
                      : false;
              const isExpanded = expandKey && expandedSection === expandKey;

              if (hasChildren && item.children && expandKey) {
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => setExpandedSection((e) => (e === expandKey ? null : expandKey))}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors text-right ${
                        isParentActive
                          ? "bg-gray-700 text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.name}</span>
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isExpanded && (
                    <div className="mr-4 mt-1 space-y-1 border-r-2 border-gray-600 pr-0">
                      {item.children.map((child: { id: string; name: string; href: string; icon: React.ComponentType<{ className?: string }> }) => {
                        const isChildActive = expandKey === "settings"
                          ? pathname === "/dashboard/settings" && currentTab === child.id
                          : pathname === child.href;
                        return (
                          <Link
                            key={child.id}
                            href={child.href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                              isChildActive
                                ? "bg-gradient-blue text-white"
                                : "text-gray-400 hover:bg-gray-700 hover:text-white"
                            }`}
                          >
                            <child.icon className="h-4 w-4 shrink-0" />
                            <span>{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                    )}
                  </div>
                );
              }

              const isActive =
                item.href === "/dashboard/menus"
                  ? pathname?.startsWith("/dashboard/menus")
                  : item.href === "/dashboard/sliders"
                    ? pathname?.startsWith("/dashboard/sliders")
                    : item.href === "/dashboard/orders"
                      ? pathname?.startsWith("/dashboard/orders")
                      : item.href === "/dashboard/finance"
                        ? pathname?.startsWith("/dashboard/finance")
                        : item.href === "/dashboard/affiliate"
                          ? pathname?.startsWith("/dashboard/affiliate")
                          : pathname === item.href;
              const isNotifications = item.href === "/dashboard/notifications";
              const isAffiliate = item.href === "/dashboard/affiliate";
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isAffiliate
                      ? isActive
                        ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30"
                        : "text-emerald-300 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-400/50"
                      : isActive
                        ? "bg-gradient-blue text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <span className="relative">
                    <item.icon className="h-5 w-5" />
                    {isNotifications && unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 flex h-4 w-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: "#dc2626", color: "white" }}
                      >
                        {unreadCount > 9 ? `${formatPersianNumber(9)}+` : formatPersianNumber(unreadCount)}
                      </span>
                    )}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`lg:pr-64 transition-[padding] duration-300 ease-out min-w-0 w-full max-w-full ${
          videoDrawerOpen ? "lg:pl-[420px]" : ""
        }`}
      >
        <AdminToolbar currentStore={currentStore} stores={stores} />

        <header className="sticky top-9 z-30 bg-white border-b border-gray-200 shadow-sm w-full max-w-full overflow-hidden" dir="ltr">
          <div className="flex items-center justify-start h-16 px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start min-w-0 overflow-hidden">
              {/* حساب کاربری */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setAccountMenuOpen((o) => !o)}
                  className={`flex items-center gap-2.5 pl-2 pr-2.5 py-2 rounded-lg transition-all duration-200 ${
                    accountMenuOpen
                      ? "bg-gray-100 ring-2 ring-gray-200"
                      : "hover:bg-gray-100 active:scale-[0.98]"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {(user.store_user?.display_name || user.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate max-w-[120px]">
                      {user.store_user?.display_name || user.mobile || user.username}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate max-w-[120px]" title={currentStore?.title || currentStore?.name}>
                      {currentStore ? (currentStore.title || currentStore.name) : (stores.length > 0 ? `${formatPersianNumber(stores.length)} فروشگاه` : "حساب من")}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {accountMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-bold text-gray-800 truncate">
                        {user.store_user?.display_name || user.mobile || user.username}
                      </p>
                      <p className="text-xs text-gray-500">{user.mobile}</p>
                    </div>
                    <Link
                      href="/dashboard/wallet"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 transition"
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Banknote className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{tFrontendAuto("fe.7763144e9064")}</p>
                          <p className="text-xs text-gray-500 tabular-nums">
                            {user.wallet
                              ? `${formatPersianNumber(
                                  typeof user.wallet.available_balance === "string"
                                    ? parseFloat(user.wallet.available_balance) || 0
                                    : user.wallet.available_balance
                                )} تومان`
                              : "۰ تومان"}
                          </p>
                        </div>
                      </span>
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 text-red-600 transition text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">{tFrontendAuto("fe.f04c5878defe")}</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="h-5 w-px bg-gray-200 hidden sm:block" />

              {/* اشتراک فروشگاه */}
              {currentStore && (() => {
                const days = currentStore.subscription_days_remaining ?? null;
                const status = days === null ? "none" : days <= 0 ? "expired" : days <= 14 ? "warning" : "ok";
                const statusStyles = {
                  none: "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600",
                  expired: "bg-red-50 border-red-200 hover:bg-red-100 text-red-700",
                  warning: "bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-800",
                  ok: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700",
                };
                const isFreePlan = currentStore?.subscription_plan?.title?.toLowerCase().includes("رایگان");
                const labelText = days === null ? "اشتراک فعال نشده" : days > 0
                  ? (isFreePlan ? `پلن رایگان تا ${formatPersianNumber(days)} روز دیگر` : `${formatPersianNumber(days)} روز مانده`)
                  : "اشتراک منقضی شده";
                const detailText = days === null ? "برای فعال‌سازی فروشگاه اشتراک تهیه کنید" : days > 0 ? "تمدید اشتراک" : "فروشگاه غیرفعال است ـ تمدید کنید";
                return (
                  <Link
                    href="/dashboard/subscription"
                    className={`flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all cursor-pointer min-w-0 ${statusStyles[status]}`}
                    title={detailText}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${
                      status === "none" ? "bg-slate-200/60" : status === "expired" ? "bg-red-200/60" : status === "warning" ? "bg-amber-200/60" : "bg-emerald-200/60"
                    }`}>
                      <CalendarCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    </div>
                    <div className="text-left min-w-0 hidden sm:block">
                      <p className="text-[10px] font-medium tracking-wide opacity-90">{tFrontendAuto("fe.f9a76e7edd50")}</p>
                      <p className="text-sm font-bold tabular-nums truncate">{labelText}</p>
                    </div>
                    <div className="sm:hidden text-xs font-bold tabular-nums truncate max-w-[55px] xsm:max-w-[70px]">
                      {days === null ? "فعال نشده" : days > 0 ? `${formatPersianNumber(days)}روز` : "منقضی"}
                    </div>
                  </Link>
                );
              })()}

              {/* کیف پول سراسری */}
              <Link
                href="/dashboard/wallet"
                className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer min-w-0 text-blue-800"
                title={tFrontendAuto("fe.f028e62128b6")}
              >
                <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-200/60 flex items-center justify-center">
                  <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-blue-700" />
                </div>
                <div className="text-left min-w-0 hidden sm:block">
                  <p className="text-[10px] font-medium tracking-wide opacity-90">{tFrontendAuto("fe.97a9decd6f19")}</p>
                  <p className="text-sm font-bold tabular-nums truncate">
                    {user.wallet
                      ? formatPersianNumber(
                          typeof user.wallet.available_balance === "string"
                            ? parseFloat(user.wallet.available_balance) || 0
                            : user.wallet.available_balance
                        )
                      : "۰"}
                  </p>
                </div>
                <div className="sm:hidden text-xs font-bold tabular-nums truncate max-w-[55px] xsm:max-w-[70px]">
                  {user.wallet
                    ? formatPersianNumber(
                        typeof user.wallet.available_balance === "string"
                          ? parseFloat(user.wallet.available_balance) || 0
                          : user.wallet.available_balance
                      )
                    : "۰"}
                </div>
              </Link>

              <div className="shrink-0">
                <NotificationBell />
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>

      {/* Floating AI help button - minimal tab peeking from edge */}
      <button
        onClick={() => setVideoDrawerOpen((prev) => !prev)}
        className={`fixed left-0 bottom-6 z-30 flex items-center py-3 pl-1 pr-3 rounded-r-2xl rounded-l-none shadow-md transition-all duration-200 hover:pr-4 hover:shadow-lg active:scale-95 ${
          videoDrawerOpen
            ? "bg-violet-600 text-white"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
        }`}
        title={tFrontendAuto("fe.ace3b3600777")}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Sparkles className="h-5 w-5" />
        </span>
      </button>
    </div>
  );
}
