"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCommentDots,
  faBars,
} from "@fortawesome/free-solid-svg-icons";

const navLinks = [
  { href: "#services", label: "خدمات" },
  { href: "#ai", label: "رشد با AI" },
  { href: "#process", label: "فرآیند همکاری" },
  { href: "#pricing", label: "تعرفه‌ها" },
  { href: "#showcase", label: "نمونه‌کار" },
  { href: "/blog", label: "بلاگ" },
  { href: "#faq", label: "سوالات" },
  { href: "#contact", label: "تماس" },
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
                alt="لوگوی توکان"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            </div>
            <div className="leading-tight">
              <div className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900">
                توکان
              </div>
              <div className="text-xs text-slate-500 -mt-0.5">توسعه کسب‌وکار دیجیتال</div>
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
              پنل مدیریت
            </Link>
            <Link
              href="/setup"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white btn-grad hover:opacity-90 transition shadow-soft"
            >
              راه‌اندازی فروشگاه
            </Link>
            <Link
              href="#contact"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white btn-grad hover:opacity-90 transition shadow-soft"
            >
              <FontAwesomeIcon icon={faCommentDots} />
              درخواست مشاوره
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl glass hover:bg-slate-100 transition text-slate-700"
              aria-label="باز/بستن منو"
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
                  پنل مدیریت
                </Link>
                <Link
                  href="/setup"
                  className="col-span-2 mt-1 py-3 px-3 rounded-xl btn-grad text-center font-bold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  راه‌اندازی فروشگاه
                </Link>
                <Link
                  href="#contact"
                  className="col-span-2 py-3 px-3 rounded-xl glass text-center font-bold border border-slate-200"
                  onClick={() => setMobileOpen(false)}
                >
                  درخواست مشاوره
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
