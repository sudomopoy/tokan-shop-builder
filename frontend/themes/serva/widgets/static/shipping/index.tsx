"use client";

import React from "react";
import Link from "next/link";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export default function StaticShipping() {
  return (
    <>
      <div className="bg-white border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">{tFrontendAuto("fe.22a3417293ef")}</span>
          </nav>
        </div>
      </div>

      <section className="container py-12">
        <div className="bg-white rounded-xl p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-dark mb-6">{tFrontendAuto("fe.22a3417293ef")}</h1>
          <div className="prose max-w-none text-gray-700 leading-relaxed">
            <p>
              زمان ارسال بسته به روش ارسال انتخابی و مقصد متفاوت است. پس از ثبت سفارش، کد پیگیری در پنل کاربری نمایش داده
              خواهد شد.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

