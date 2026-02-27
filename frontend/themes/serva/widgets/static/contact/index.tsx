"use client";

import React from "react";
import Link from "next/link";

export default function StaticContact() {
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
            <span className="text-dark">تماس با ما</span>
          </nav>
        </div>
      </div>

      <section className="container py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-8 text-center">تماس با ما</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl">
                  📍
                </div>
                <div>
                  <h3 className="font-bold text-dark">آدرس</h3>
                  <p className="text-sm text-gray-600">تهران، خیابان ولیعصر، پلاک ۱۲۳۴</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary text-xl">
                  ☎
                </div>
                <div>
                  <h3 className="font-bold text-dark">تلفن</h3>
                  <p className="text-sm text-gray-600" dir="ltr">
                    021-1234-5678
                  </p>
                  <p className="text-sm text-gray-600" dir="ltr">
                    09123456789
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent text-xl">
                  ✉
                </div>
                <div>
                  <h3 className="font-bold text-dark">ایمیل</h3>
                  <p className="text-sm text-gray-600" dir="ltr">
                    info@shop.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form + Map */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-bold text-dark mb-6">ارسال پیام</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">نام</label>
                    <input className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-2">ایمیل</label>
                    <input className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">موضوع</label>
                  <input className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">پیام</label>
                  <textarea rows={5} className="w-full px-4 py-3 border rounded-lg focus:border-primary focus:outline-none" />
                </div>
                <button type="button" className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold">
                  ارسال
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-6">
              <h2 className="text-xl font-bold text-dark mb-4">موقعیت روی نقشه</h2>
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                نقشه (placeholder)
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}