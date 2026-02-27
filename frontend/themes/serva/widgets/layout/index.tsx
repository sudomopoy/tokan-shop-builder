"use client";

import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import type { WidgetConfig } from "@/themes/types";
import ServaHeader from "./header";
import ServaFooter from "./footer";

type ServaLayoutProps = PropsWithChildren<{
  config?: WidgetConfig;
}>;

export default function ServaLayout({ children, config }: ServaLayoutProps) {
  const headerRaw = config?.widgetConfig?.header;
  const footerRaw = config?.widgetConfig?.footer;
  const showHeader = typeof headerRaw === "boolean" ? headerRaw : true;
  const showFooter = typeof footerRaw === "boolean" ? footerRaw : true;

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const backToTopClass = useMemo(() => {
    const base =
      "serva-back-to-top fixed left-6 bottom-6 w-12 h-12 bg-primary text-white rounded-2xl shadow-xl hover:bg-primary/90 hover:-translate-y-1 transition-all z-50 flex items-center justify-center";
    return showBackToTop ? `${base} opacity-100` : `${base} opacity-0 pointer-events-none`;
  }, [showBackToTop]);

  return (
    <div className="bg-gray-50 text-gray-700 font-sans antialiased selection:bg-primary selection:text-white min-h-dvh flex flex-col">
      {showHeader && <ServaHeader />}

      <main className="flex-1 space-y-12 md:space-y-20 pb-20">{children}</main>

      {showFooter && <ServaFooter />}

      <button
        type="button"
        id="backToTop"
        className={backToTopClass}
        aria-label="بازگشت به بالا"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span className="text-base font-black">↑</span>
      </button>
    </div>
  );
}

