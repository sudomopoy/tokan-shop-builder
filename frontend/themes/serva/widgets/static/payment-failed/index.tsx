"use client";

import React from "react";
import Link from "next/link";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export default function StaticPaymentFailed() {
  return (
    <section className="container py-20">
      <div className="bg-white rounded-2xl p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-6 text-3xl">
          !
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-3">{tFrontendAuto("fe.9313d0deab4f")}</h1>
        <p className="text-gray-600 mb-8">{tFrontendAuto("fe.cd22d8459875")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/checkout" className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold">
            تلاش مجدد
          </Link>
          <Link href="/" className="px-8 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-bold text-dark">
            بازگشت به فروشگاه
          </Link>
        </div>
      </div>
    </section>
  );
}

