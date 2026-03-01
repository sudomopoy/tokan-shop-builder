"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import { pickByLocale } from "@/lib/i18n";

const navLinks = [
  { href: "#services", label: pickByLocale({ fa: "خدمات", en: "Services" }) },
  { href: "#ai", label: pickByLocale({ fa: "رشد با AI", en: "AI Growth" }) },
  { href: "#process", label: pickByLocale({ fa: "فرآیند همکاری", en: "Process" }) },
  { href: "#pricing", label: pickByLocale({ fa: "تعرفه‌ها", en: "Pricing" }) },
  { href: "#showcase", label: pickByLocale({ fa: "نمونه‌کار", en: "Portfolio" }) },
  { href: "/blog", label: pickByLocale({ fa: "بلاگ", en: "Blog" }) },
  { href: "#faq", label: pickByLocale({ fa: "سوالات", en: "FAQ" }) },
  { href: "#contact", label: pickByLocale({ fa: "تماس", en: "Contact" }) },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-lg shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="#top" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl overflow-hidden glass flex items-center justify-center">
              <Image
                src="/logo.jpg"
                alt={pickByLocale({ fa: "لوگوی توکان", en: "Tokan logo" })}
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            </div>
            <div className="leading-tight">
              <div className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900">
                {pickByLocale({ fa: "توکان", en: "Tokan" })}
              </div>
              <div className="text-xs text-slate-500 -mt-0.5">
                {pickByLocale({ fa: "توسعه کسب‌وکار دیجیتال", en: "Digital Business Growth" })}
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm text-slate-700">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-slate-900 transition link-underline"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/panel"
              className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              {pickByLocale({ fa: "پنل مدیریت", en: "Admin Panel" })}
            </Link>
            <Link
              href="/setup"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white btn-grad hover:opacity-90 transition shadow-soft"
            >
              {pickByLocale({ fa: "راه‌اندازی فروشگاه", en: "Start Store Setup" })}
            </Link>
            <Link
              href="#contact"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white btn-grad hover:opacity-90 transition shadow-soft"
            >
              <FontAwesomeIcon icon={faCommentDots} />
              {pickByLocale({ fa: "درخواست مشاوره", en: "Request Consultation" })}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl glass hover:bg-slate-100 transition text-slate-700"
              aria-label={pickByLocale({ fa: "باز/بستن منو", en: "Toggle menu" })}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-4">
            <div className="glass rounded-2xl p-4 border border-slate-200">
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-800">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="py-2 px-3 rounded-xl hover:bg-slate-100 transition"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/panel"
                  className="py-2 px-3 rounded-xl hover:bg-slate-100 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  {pickByLocale({ fa: "پنل مدیریت", en: "Admin Panel" })}
                </Link>
                <Link
                  href="/setup"
                  className="col-span-2 mt-1 py-3 px-3 rounded-xl btn-grad text-center font-bold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {pickByLocale({ fa: "راه‌اندازی فروشگاه", en: "Start Store Setup" })}
                </Link>
                <Link
                  href="#contact"
                  className="col-span-2 py-3 px-3 rounded-xl glass text-center font-bold border border-slate-200"
                  onClick={() => setMobileOpen(false)}
                >
                  {pickByLocale({ fa: "درخواست مشاوره", en: "Request Consultation" })}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
