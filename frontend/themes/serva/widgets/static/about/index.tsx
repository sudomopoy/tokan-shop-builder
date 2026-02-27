"use client";

import React from "react";
import Link from "next/link";

export default function StaticAbout() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">درباره ما</span>
          </nav>
        </div>
      </div>

      <section className="container py-12">
        {/* Hero */}
        <div className="relative rounded-2xl p-8 md:p-12 text-white mb-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-l from-primary/80 to-blue-600/80" />
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">درباره فروشگاهی سِروا</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              ما با بیش از ۱۰ سال تجربه در زمینه فروش آنلاین، تلاش می‌کنیم بهترین تجربه خرید را برای شما فراهم کنیم.
            </p>
          </div>
        </div>

        {/* Story */}
        <div className="bg-white rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-dark mb-6">داستان ما</h2>
          <div className="prose max-w-none text-gray-700 leading-relaxed space-y-4">
            <p>
              فروشگاهی سِروا با هدف ارائه محصولات معتبر و خدمات پس از فروش حرفه‌ای راه‌اندازی شد. تمرکز ما روی کیفیت،
              قیمت منصفانه و رضایت مشتری است.
            </p>
            <p>
              در طول سال‌ها با همکاری برندهای معتبر داخلی و خارجی، توانسته‌ایم اعتماد هزاران مشتری را جلب کنیم.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-3xl">
              🛡
            </div>
            <h3 className="font-bold text-dark mb-2">اصالت کالا</h3>
            <p className="text-sm text-gray-600">تضمین اصالت و سلامت فیزیکی محصولات</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-secondary text-3xl">
              🚚
            </div>
            <h3 className="font-bold text-dark mb-2">ارسال سریع</h3>
            <p className="text-sm text-gray-600">تحویل سریع و به‌موقع در سراسر کشور</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent text-3xl">
              💬
            </div>
            <h3 className="font-bold text-dark mb-2">پشتیبانی</h3>
            <p className="text-sm text-gray-600">پاسخ‌گویی سریع و حرفه‌ای به سوالات شما</p>
          </div>
        </div>
      </section>
    </>
  );
}

