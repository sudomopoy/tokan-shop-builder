"use client";

import React from "react";
import Link from "next/link";

export default function StaticComingSoon() {
  return (
    <section className="container py-20">
      <div className="bg-white rounded-2xl p-10 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-dark mb-4">به‌زودی</h1>
        <p className="text-gray-600 mb-8">این صفحه در حال آماده‌سازی است.</p>
        <Link href="/" className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold">
          بازگشت به خانه
        </Link>
      </div>
    </section>
  );
}

