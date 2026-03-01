"use client";

import React from "react";
import Link from "next/link";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export default function StaticComingSoon() {
  return (
    <section className="container py-20">
      <div className="bg-white rounded-2xl p-10 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-dark mb-4">{tFrontendAuto("fe.1247ed1c1cd6")}</h1>
        <p className="text-gray-600 mb-8">{tFrontendAuto("fe.8054e70acce0")}</p>
        <Link href="/" className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold">
          بازگشت به خانه
        </Link>
      </div>
    </section>
  );
}

