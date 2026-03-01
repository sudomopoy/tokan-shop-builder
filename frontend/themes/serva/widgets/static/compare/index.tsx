"use client";

import React from "react";
import Link from "next/link";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

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
            <span className="text-dark">{tFrontendAuto("fe.eb840d01131d")}</span>
          </nav>
        </div>
      </div>

      <section className="container py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-6">{tFrontendAuto("fe.eb840d01131d")}</h1>

        <div className="bg-white rounded-xl overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right font-bold text-dark">{tFrontendAuto("fe.3d61d5218905")}</th>
                <th className="px-6 py-4 text-center font-bold text-dark">{tFrontendAuto("fe.907ad6e6a80b")}</th>
                <th className="px-6 py-4 text-center font-bold text-dark">{tFrontendAuto("fe.490cade53a5e")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-6 py-4 font-medium text-dark">{tFrontendAuto("fe.87abd947fa44")}</td>
                <td className="px-6 py-4 text-center text-primary font-bold">—</td>
                <td className="px-6 py-4 text-center text-primary font-bold">—</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-dark">{tFrontendAuto("fe.d8796b9191f9")}</td>
                <td className="px-6 py-4 text-center">—</td>
                <td className="px-6 py-4 text-center">—</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-dark">{tFrontendAuto("fe.dfa6f808895a")}</td>
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

