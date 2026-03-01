"use client";

import React from "react";
import Link from "next/link";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export default function Static500() {
  return (
    <section className="container py-20">
      <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
        <div className="text-6xl font-black text-red-500 mb-4">500</div>
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-3">{tFrontendAuto("fe.3d8fa26cc55e")}</h1>
        <p className="text-gray-600 mb-8">
          متأسفانه خطایی در سرور رخ داده است. لطفاً کمی بعد دوباره تلاش کنید.
        </p>
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
