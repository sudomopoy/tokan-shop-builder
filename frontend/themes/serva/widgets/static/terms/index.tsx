"use client";

import React from "react";
import Link from "next/link";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export default function StaticTerms() {
  return (
    <>
      <div className="bg-white border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">{tFrontendAuto("fe.360fc6332f11")}</span>
          </nav>
        </div>
      </div>

      <section className="container py-12">
        <div className="bg-white rounded-xl p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-dark mb-6">{tFrontendAuto("fe.360fc6332f11")}</h1>
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            <p>
              استفاده از فروشگاه سِروا به معنی پذیرش قوانین و مقررات است. این متن نمونه است و می‌توانید آن را از طریق
              صفحه‌ساز با محتوای واقعی جایگزین کنید.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}