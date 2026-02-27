"use client";

import React from "react";
import Link from "next/link";

export default function Static403() {
  return (
    <section className="container py-20">
      <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
        <div className="text-6xl font-black text-amber-500 mb-4">403</div>
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-3">دسترسی غیرمجاز</h1>
        <p className="text-gray-600 mb-8">شما به این بخش دسترسی ندارید.</p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold"
        >
          بازگشت به خانه
        </Link>
      </div>
    </section>
  );
}
