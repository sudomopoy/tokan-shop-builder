"use client";

import React, { useState } from "react";
import type { WidgetConfig } from "@/themes/types";

export default function ServaNewsletterWidget({ config }: { config?: WidgetConfig }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const title = (config?.widgetConfig?.title as string) || "عضویت در خبرنامه سِروا";
  const subtitle =
    (config?.widgetConfig?.subtitle as string) ||
    "از جدیدترین تخفیف‌ها، جشنواره‌ها و محصولات جدید زودتر از همه باخبر شوید.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      // TODO: wire to newsletter API when available
      await new Promise((r) => setTimeout(r, 500));
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="container">
      <div className="bg-primary rounded-3xl p-8 md:p-16 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4">{title}</h2>
          <p className="text-white/80 mb-8 font-medium">{subtitle}</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="آدرس ایمیل خود را وارد کنید..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              className="flex-1 px-6 py-4 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-white/60 focus:bg-white focus:text-dark focus:border-white transition outline-none backdrop-blur-sm"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-4 bg-white text-primary font-black rounded-xl hover:bg-gray-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-70"
            >
              {status === "loading" ? "در حال ارسال..." : "عضویت"}
            </button>
          </form>
          {status === "success" && (
            <p className="mt-4 text-white/90 text-sm">با موفقیت ثبت شد. از خبرنامه ما ممنونیم!</p>
          )}
          {status === "error" && (
            <p className="mt-4 text-red-200 text-sm">خطا در ثبت. لطفاً دوباره تلاش کنید.</p>
          )}
        </div>
      </div>
    </section>
  );
}
