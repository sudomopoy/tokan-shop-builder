"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTruckFast,
  faShieldCheck,
  faHeadset,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import type { WidgetConfig } from "@/themes/types";

const features = [
  {
    icon: faTruckFast,
    title: "ارسال سریع و رایگان",
    subtitle: "برای سفارش‌های بالای ۲ میلیون",
    colorClass: "bg-primary/10 text-primary",
  },
  {
    icon: faShieldCheck,
    title: "ضمانت اصالت کالا",
    subtitle: "تضمین کیفیت تمامی محصولات",
    colorClass: "bg-secondary/10 text-secondary",
  },
  {
    icon: faHeadset,
    title: "پشتیبانی ۲۴ ساعته",
    subtitle: "در تمام روزهای هفته",
    colorClass: "bg-accent/10 text-accent",
  },
  {
    icon: faBoxOpen,
    title: "۷ روز ضمانت بازگشت",
    subtitle: "با خیال راحت خرید کنید",
    colorClass: "bg-red-500/10 text-red-500",
  },
];

export default function ServaHomeFeaturesWidget({ config }: { config?: WidgetConfig }) {
  const title = (config?.widgetConfig?.title as string) || undefined;

  return (
    <section className="container">
      {title && (
        <h2 className="text-2xl font-black text-dark mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 flex flex-col items-center text-center gap-4 shadow-card hover:shadow-lg hover:-translate-y-1 transition duration-300 border border-transparent hover:border-gray-100"
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${f.colorClass}`}
            >
              <FontAwesomeIcon icon={f.icon} className="text-2xl" />
            </div>
            <div>
              <h4 className="font-bold text-dark text-base mb-1">{f.title}</h4>
              <p className="text-gray-500 text-xs">{f.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
