"use client";

import React from "react";
import Link from "next/link";

export default function StaticWishlist() {
  return (
    <>
      <div className="bg-white border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">لیست علاقه‌مندی‌ها</span>
          </nav>
        </div>
      </div>

      <section className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-dark">لیست علاقه‌مندی‌ها</h1>
          <button type="button" className="text-red-500 hover:text-red-600 transition text-sm opacity-60 cursor-not-allowed">
            پاک کردن همه
          </button>
        </div>

        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl text-gray-400">
            ❤
          </div>
          <h3 className="text-xl font-bold text-dark mb-2">لیست علاقه‌مندی‌های شما خالی است</h3>
          <p className="text-gray-600 mb-6">محصولات مورد علاقه خود را به این لیست اضافه کنید</p>
          <Link href="/products/search" className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            مشاهده محصولات
          </Link>
        </div>
      </section>
    </>
  );
}

