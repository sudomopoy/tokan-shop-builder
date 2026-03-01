"use client";

import React, { useState } from "react";
import Link from "next/link";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

type FaqItem = { q: string; a: string };

const FAQS: FaqItem[] = [
  {
    q: "چگونه می‌توانم سفارش خود را پیگیری کنم؟",
    a: "شما می‌توانید با وارد کردن کد سفارش در صفحه پیگیری سفارش، وضعیت سفارش خود را مشاهده کنید.",
  },
  {
    q: "روش‌های پرداخت چیست؟",
    a: "شما می‌توانید از طریق پرداخت آنلاین و سایر روش‌های فعال فروشگاه، سفارش خود را پرداخت کنید.",
  },
  {
    q: "هزینه ارسال چقدر است؟",
    a: "هزینه ارسال بر اساس روش ارسال انتخابی و قوانین فروشگاه محاسبه می‌شود.",
  },
  {
    q: "چگونه می‌توانم کالا را مرجوع کنم؟",
    a: "تا ۷ روز پس از دریافت کالا می‌توانید درخواست مرجوعی ثبت کنید. برای جزئیات به صفحه رویه بازگشت کالا مراجعه کنید.",
  },
];

export default function StaticFaq() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">{tFrontendAuto("fe.a6a817d2166d")}</span>
          </nav>
        </div>
      </div>

      <section className="container py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-dark mb-8 text-center">{tFrontendAuto("fe.a6a817d2166d")}</h1>

        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((f, idx) => {
            const open = openIndex === idx;
            return (
              <div
                key={f.q}
                className="faq-item bg-white rounded-xl p-6 cursor-pointer"
                data-open={open ? "true" : "false"}
                onClick={() => setOpenIndex(open ? -1 : idx)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-dark">{f.q}</h3>
                  <span className="faq-icon text-primary transition">⌄</span>
                </div>
                <div className="faq-answer mt-4 text-gray-700">
                  <p>{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

