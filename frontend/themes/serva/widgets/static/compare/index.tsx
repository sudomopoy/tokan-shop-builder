"use client";

import React from "react";
import Link from "next/link";

export default function StaticCompare() {
  return (
    <>
      <div className="bg-white border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">مقایسه محصولات</span>
          </nav>
        </div>
      </div>

      <section className="container py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-6">مقایسه محصولات</h1>

        <div className="bg-white rounded-xl overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right font-bold text-dark">ویژگی</th>
                <th className="px-6 py-4 text-center font-bold text-dark">محصول ۱</th>
                <th className="px-6 py-4 text-center font-bold text-dark">محصول ۲</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-6 py-4 font-medium text-dark">قیمت</td>
                <td className="px-6 py-4 text-center text-primary font-bold">—</td>
                <td className="px-6 py-4 text-center text-primary font-bold">—</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-dark">حافظه</td>
                <td className="px-6 py-4 text-center">—</td>
                <td className="px-6 py-4 text-center">—</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-dark">رم</td>
                <td className="px-6 py-4 text-center">—</td>
                <td className="px-6 py-4 text-center">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center">
          <Link href="/products/search" className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            افزودن محصول برای مقایسه
          </Link>
        </div>
      </section>
    </>
  );
}

