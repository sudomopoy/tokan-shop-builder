"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { menuApi, storeApi, getStoreSetting } from "@/lib/api";
import type { StoreDetail } from "@/lib/api/storeApi";
import type { MenuItem as MenuItemDto } from "@/lib/api/menuApi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  selectAuthHydrated,
  selectAuthUser,
  selectIsAuthenticated,
} from "@/lib/store/authSlice";
import { logout } from "@/lib/auth/authService";
import {
  faBars,
  faChevronDown,
  faCube,
  faEnvelope,
  faLayerGroup,
  faPhoneAlt,
  faRightFromBracket,
  faSearch,
  faShoppingBag,
  faTimes,
  faUser,
  faUserCog,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { faInstagram, faLinkedinIn, faTelegram, faTwitter, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

type NavItem = {
  id: string | number;
  label: string;
  href?: string;
  disabled?: boolean;
  children?: NavItem[];
};

const menuItemFallbackLabels: Record<MenuItemDto["item_type"], string> = {
  link: "لینک",
  empty: "آیتم",
  category: "دسته‌بندی",
  product: "محصول",
  page: "صفحه",
};

const resolveMenuItemLabel = (item: MenuItemDto): string => {
  const baseLabel =
    item.resolved_title ||
    item.title ||
    item.category_name ||
    item.product_title ||
    item.page_path ||
    "";
  const fallback = baseLabel || menuItemFallbackLabels[item.item_type];
  if (item.status === "coming_soon") {
    return `${fallback} (به‌زودی)`;
  }
  if (item.status === "inactive") {
    return `${fallback} (غیرفعال)`;
  }
  return fallback;
};

const resolveMenuItemHref = (item: MenuItemDto): string | undefined => {
  if (item.item_type === "link") {
    return item.url ?? undefined;
  }
  if (item.item_type === "page" && item.page_path) {
    const path = item.page_path.startsWith("/") ? item.page_path : `/${item.page_path}`;
    return path;
  }
  if (item.item_type === "category" && item.category) {
    return `/products/search?categories=${item.category}`;
  }
  if (item.item_type === "product" && item.product) {
    return `/product/${item.product}`;
  }
  return undefined;
};

const mapMenuItems = (items: MenuItemDto[]): NavItem[] =>
  items.map((item) => {
    const href = item.status === "active" ? resolveMenuItemHref(item) : undefined;
    const hasChildren = !!(item.children && item.children.length > 0);
    const disabled =
      item.status !== "active" || (!hasChildren && !href);
    return {
      id: item.id,
      label: resolveMenuItemLabel(item),
      href,
      disabled,
      children: item.children ? mapMenuItems(item.children) : undefined,
    };
  });

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toPersianDigits = (str: string): string =>
  str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)] ?? d);

const formatMobileDisplay = (raw: string): string => {
  let s = raw.replace(/\s/g, "");
  s = s.replace(/^\+98/, "").replace(/^0098/, "").replace(/^98/, "");
  if (s.startsWith("0")) {
    return toPersianDigits(s);
  }
  if (/^9\d{9}$/.test(s)) {
    return toPersianDigits(`0${s}`);
  }
  return toPersianDigits(s);
};

const SOCIAL_KEYS = [
  { key: "social_instagram_url", icon: faInstagram, label: "instagram" },
  { key: "social_telegram_url", icon: faTelegram, label: "telegram" },
  { key: "social_whatsapp_url", icon: faWhatsapp, label: "whatsapp" },
  { key: "social_twitter_url", icon: faTwitter, label: "twitter" },
  { key: "social_linkedin_url", icon: faLinkedinIn, label: "linkedin" },
] as const;

function TopBar({
  store,
  formatPhone,
}: {
  store: StoreDetail | null;
  formatPhone: (s: string) => string;
}) {
  const phone = getStoreSetting(store, "store_phone");
  const email = getStoreSetting(store, "store_email");
  const displayPhone = phone ? formatPhone(phone) : phone;
  const hasContact = phone || email;
  const socialLinks = SOCIAL_KEYS.map(({ key, icon, label }) => ({
    url: getStoreSetting(store, key),
    icon,
    label,
  })).filter((s) => s.url);

  if (!hasContact && socialLinks.length === 0) return null;

  return (
    <div className="bg-dark text-gray-300 text-xs py-2.5 hidden md:block border-b border-white/5">
      <div className="container flex justify-between items-center">
        <div className="flex items-center gap-6">
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white transition cursor-pointer">
              <FontAwesomeIcon icon={faPhoneAlt} className="ml-2 text-primary" />
              {displayPhone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="hover:text-white transition cursor-pointer">
              <FontAwesomeIcon icon={faEnvelope} className="ml-2 text-primary" />
              {email}
            </a>
          )}
        </div>
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-4">
            {socialLinks.map(({ url, icon, label }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition transform hover:-translate-y-0.5"
                aria-label={label}
              >
                <FontAwesomeIcon icon={icon} className="text-lg" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServaHeader() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItemDto[] | null>(null);
  const [store, setStore] = useState<StoreDetail | null>(null);

  const authHydrated = useAppSelector(selectAuthHydrated);
  const isLoggedIn = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectAuthUser);
  const showAuthenticatedUi = authHydrated && isLoggedIn;

  const loginHref = useMemo(() => {
    const qs = searchParams?.toString();
    const current = `${pathname}${qs ? `?${qs}` : ""}`;
    return `/login?next=${encodeURIComponent(current)}`;
  }, [pathname, searchParams]);

  const avatarContent = useMemo(() => {
    const name = typeof user?.name === "string" ? user?.name.trim() : "";
    if (name) return { type: "letter" as const, value: name.slice(0, 1).toUpperCase() };
    const mobile = typeof user?.mobile === "string" ? user.mobile : "";
    if (mobile) return { type: "icon" as const };
    return { type: "letter" as const, value: "U" };
  }, [user]);

  const userDisplayLabel = useMemo(() => {
    const name = typeof user?.name === "string" ? user?.name.trim() : "";
    if (name) return name;
    const mobile = typeof user?.mobile === "string" ? user.mobile : "";
    if (mobile) return formatMobileDisplay(mobile);
    return "پروفایل";
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    logout(dispatch);
    router.replace("/");
    router.refresh();
  };

  useEffect(() => {
    let isMounted = true;
    menuApi
      .getByKey("header")
      .then((menu) => {
        if (!isMounted) return;
        setMenuItems(menu ? menu.items ?? [] : null);
      })
      .catch(() => {
        if (!isMounted) return;
        setMenuItems(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    storeApi
      .getCurrentStore()
      .then((s) => {
        if (!isMounted) return;
        setStore(s);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const siteTitle = store?.title?.trim() || "سِروا";

  const navItems = useMemo(
    () => (menuItems ? mapMenuItems(menuItems) : []),
    [menuItems]
  );

  const submitSearch = () => {
    const q = query.trim();
    if (!q) {
      router.push("/products/search");
      return;
    }
    router.push(`/products/search?q=${encodeURIComponent(q)}`);
  };

  const mobileMenuClass = useMemo(() => {
    const base = "fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity";
    return mobileMenuOpen ? `${base} block` : `${base} hidden`;
  }, [mobileMenuOpen]);

  return (
    <>
      <TopBar store={store} formatPhone={formatMobileDisplay} />

      <header
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-soft transition-all duration-300 border-b border-gray-100"
        id="mainHeader"
      >
        <div className="container py-4">
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-black text-primary flex items-center gap-2 tracking-tight">
                <FontAwesomeIcon icon={faCube} className="text-3xl" />
                <span>{siteTitle}</span>
              </Link>
            </div>

            {/* Search Bar */}
            <form
              className="hidden lg:flex flex-1 max-w-2xl relative group"
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tFrontendAuto("fe.844ca9145230")}
                className="w-full py-3.5 px-5 pr-12 rounded-2xl bg-gray-100 border border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none placeholder-gray-400 text-sm"
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition group-focus-within:text-primary"
                aria-label="search"
              >
                <FontAwesomeIcon icon={faSearch} className="text-lg" />
              </button>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-3 md:gap-4">
              <Link
                href="/wishlist"
                className="relative w-12 h-12 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-500 flex items-center justify-center transition hidden sm:flex group"
                aria-label="wishlist"
              >
                <FontAwesomeIcon icon={faHeartRegular} className="text-xl group-hover:scale-110 transition" />
              </Link>

              <Link
                href="/basket"
                className="relative w-12 h-12 rounded-xl bg-gray-50 hover:bg-primary/10 text-gray-700 hover:text-primary flex items-center justify-center transition group"
                aria-label="basket"
              >
                <FontAwesomeIcon icon={faShoppingBag} className="text-xl group-hover:scale-110 transition" />
              </Link>

              <div className="h-8 w-px bg-gray-200 hidden md:block mx-1" />

              {showAuthenticatedUi ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`
                      flex items-center gap-3 pl-2 pr-3 py-2 rounded-2xl
                      transition-all duration-200 ease-out
                      ${userMenuOpen
                        ? "bg-primary/10 ring-2 ring-primary/20 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100 active:scale-[0.98]"
                      }
                    `}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base flex-shrink-0 overflow-hidden shadow-sm ring-1 ring-black/5 bg-primary text-white"
                      style={
                        typeof user?.avatarUrl === "string"
                          ? { backgroundImage: `url(${user.avatarUrl})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "transparent" }
                          : undefined
                      }
                    >
                      {typeof user?.avatarUrl === "string" ? null : avatarContent.type === "icon" ? (
                        <FontAwesomeIcon icon={faUser} className="text-lg" />
                      ) : (
                        avatarContent.value
                      )}
                    </span>
                    <div className="hidden sm:flex flex-col items-start min-w-0">
                      <span className="font-bold text-gray-800 text-sm truncate max-w-[120px]" dir={user?.mobile && !user?.name ? "ltr" : "auto"}>
                        {userDisplayLabel}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{tFrontendAuto("fe.ed83bf914c7d")}</span>
                    </div>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className={`text-xs text-gray-500 transition-transform duration-200 hidden sm:block ${userMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 hover:text-primary transition"
                      >
                        <FontAwesomeIcon icon={faUser} className="text-primary w-5" />
                        <span className="font-medium">{tFrontendAuto("fe.9ccec5d1dbd8")}</span>
                      </Link>
                      <Link
                        href="/profile?tab=settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 hover:text-primary transition"
                      >
                        <FontAwesomeIcon icon={faUserCog} className="text-gray-500 w-5" />
                        <span className="font-medium">{tFrontendAuto("fe.1cff677453b2")}</span>
                      </Link>
                      <div className="border-t border-gray-100 my-2" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 text-red-600 transition text-right"
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} className="w-5" />
                        <span className="font-medium">{tFrontendAuto("fe.f04c5878defe")}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={loginHref}
                  className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-primary transition font-bold text-sm border border-transparent hover:border-gray-100"
                >
                  <FontAwesomeIcon icon={faUser} className="text-lg" />
                  <span>{tFrontendAuto("fe.a44557e4df0b")}</span>
                </Link>
              )}

              <button
                id="mobileMenuBtn"
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden w-12 h-12 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center transition"
                aria-label={tFrontendAuto("fe.60c637db07e9")}
              >
                <FontAwesomeIcon icon={faBars} className="text-xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation - Dynamic from menu API (key: header) */}
        <nav className="hidden md:block">
          <div className="container">
            <ul className="flex items-center gap-8 text-sm font-bold text-gray-600">
              {navItems.map((item) => (
                <li key={item.id} className={`py-3 ${item.children?.length ? "group relative" : ""}`}>
                  {item.children?.length ? (
                    <>
                      <Link
                        href={item.href ?? "/categories"}
                        className="flex items-center gap-2 hover:text-primary transition py-1"
                      >
                        <FontAwesomeIcon icon={faLayerGroup} />
                        {item.label}
                        <FontAwesomeIcon icon={faChevronDown} className="text-[10px] opacity-50 group-hover:opacity-100 transition" />
                      </Link>
                      <div className="absolute top-full right-0 w-[800px] bg-white shadow-2xl rounded-2xl p-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 border border-gray-100">
                        <div className="grid grid-cols-4 gap-8">
                          {item.children.map((child) => (
                            <div key={child.id}>
                              {child.children?.length ? (
                                <>
                                  <h4 className="font-bold text-dark mb-4 border-b pb-2 text-base">{child.label}</h4>
                                  <ul className="space-y-2.5 text-gray-500 font-medium">
                                    {child.children.map((grandchild) => (
                                      <li key={grandchild.id}>
                                        {grandchild.href && !grandchild.disabled ? (
                                          <Link href={grandchild.href} className="hover:text-primary hover:translate-x-1 transition block">
                                            {grandchild.label}
                                          </Link>
                                        ) : (
                                          <span className="opacity-60">{grandchild.label}</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </>
                              ) : child.href && !child.disabled ? (
                                <Link href={child.href} className="font-bold text-dark mb-4 border-b pb-2 text-base block hover:text-primary transition">
                                  {child.label}
                                </Link>
                              ) : (
                                <h4 className="font-bold text-dark mb-4 border-b pb-2 text-base opacity-60">{child.label}</h4>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {item.href && !item.disabled ? (
                        <Link href={item.href} className="hover:text-primary transition py-1 relative group block">
                          {item.label}
                          <span className="absolute bottom-0 right-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                        </Link>
                      ) : (
                        <span className="opacity-60 py-1 block">{item.label}</span>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={mobileMenuClass} id="mobileMenu" onClick={() => setMobileMenuOpen(false)} aria-hidden>
        <div className="bg-white w-80 h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()} aria-hidden>
          <div className="p-5 border-b flex items-center justify-between bg-gray-50">
            <span className="font-black text-xl text-dark">منوی {siteTitle}</span>
            <button
              id="closeMobileMenu"
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-red-500 flex items-center justify-center shadow-sm transition"
              aria-label={tFrontendAuto("fe.df2a80400e09")}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <nav className="p-5">
            <ul className="space-y-4 font-medium text-gray-600">
              <li>
                <Link href="/" className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 hover:text-primary transition">
                  <span className="text-lg w-6">🏠</span> خانه
                </Link>
              </li>
              {navItems.map((item) => (
                <li key={item.id}>
                  {item.children?.length ? (
                    <>
                      <div className="flex items-center gap-3 p-2 rounded-lg text-gray-600">
                        <FontAwesomeIcon icon={faLayerGroup} className="text-lg w-6" />
                        {item.label}
                      </div>
                      <ul className="mr-6 mt-2 space-y-2">
                        {item.children.map((child) => (
                          <li key={child.id}>
                            {child.href && !child.disabled ? (
                              <Link
                                href={child.href}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 hover:text-primary transition text-sm"
                              >
                                {child.label}
                              </Link>
                            ) : (
                              <span className="flex items-center gap-3 p-2 rounded-lg text-sm opacity-60">{child.label}</span>
                            )}
                            {child.children?.length ? (
                              <ul className="mr-4 mt-1 space-y-1">
                                {child.children.map((grandchild) => (
                                  <li key={grandchild.id}>
                                    {grandchild.href && !grandchild.disabled ? (
                                      <Link
                                        href={grandchild.href}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 hover:text-primary transition text-sm"
                                      >
                                        {grandchild.label}
                                      </Link>
                                    ) : (
                                      <span className="flex items-center gap-3 p-2 rounded-lg text-sm opacity-60">{grandchild.label}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : item.href && !item.disabled ? (
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 hover:text-primary transition"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-3 p-2 rounded-lg opacity-60">{item.label}</span>
                  )}
                </li>
              ))}
              {showAuthenticatedUi ? (
                <>
                  <li>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 hover:text-primary transition"
                    >
                      <FontAwesomeIcon icon={faUser} className="text-lg w-6" /> پروفایل من
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/profile?tab=settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 hover:text-primary transition"
                    >
                      <FontAwesomeIcon icon={faUserCog} className="text-lg w-6" /> تنظیمات
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-red-50 text-red-600 transition text-right"
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} className="text-lg w-6" /> خروج
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link href={loginHref} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 hover:text-primary transition">
                    <FontAwesomeIcon icon={faUser} className="text-lg w-6" /> ورود / ثبت‌نام
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}

