"use client";

import React from "react";
import Link from "next/link";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

export default function Static404() {
  return (
    <section className="container py-20">
      <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
        <div className="text-6xl font-black text-primary mb-4">404</div>
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-3">{tFrontendAuto("fe.655c8f3ca6a2")}</h1>
        <p className="text-gray-600 mb-8">{tFrontendAuto("fe.3b5966b615f3")}</p>
        <Link href="/" className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold">
          بازگشت به خانه
        </Link>
      </div>
    </section>
  );
}

