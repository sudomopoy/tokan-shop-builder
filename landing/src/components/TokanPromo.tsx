"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRocket,
  faCircleCheck,
  faArrowLeft,
  faPalette,
} from "@fortawesome/free-solid-svg-icons";

type TokanPromoVariant = "default" | "compact" | "inline";

const promoContent = {
  headline: "فروشگاه آنلاین حرفه‌ای با توکان",
  subhead: "ساخت فروشگاه زیر ۲ دقیقه، فقط با هزینه هاستینگ",
  points: [
    "یک فروشگاه اینترنتی حرفه‌ای و مدیریت‌شده—بدون هزینه طراحی و راه‌اندازی اولیه",
    "توکان فروشگاه شما را کامل راه‌اندازی و مدیریت می‌کند: هاستینگ، سرورهای پرسرعت، امنیت، بروزرسانی، پشتیبانی فنی و SEO تکنیکال",
    "شما فقط روی فروش و رشد کسب‌وکارتان تمرکز کنید",
    "در پلن سالانه، خدمات راه‌اندازی رایگان: ثبت دامنه، اخذ اینماد، اتصال درگاه پرداخت، کد مالیاتی، SSL و اتصال به ترب",
    "امکان طراحی قالب اختصاصی هم وجود دارد",
    "همه‌چیز شفاف، بدون هزینه پنهان و با پشتیبانی واقعی",
  ],
  cta: "برای شروع، پیام دهید",
};

export function TokanPromo({ variant = "default" }: { variant?: TokanPromoVariant }) {
  if (variant === "compact") {
    return (
      <div className="glass rounded-2xl p-5 border-2 border-brand-200 bg-gradient-to-bl from-brand-50/50 to-white">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl btn-grad flex items-center justify-center flex-shrink-0 shadow-soft">
            <FontAwesomeIcon icon={faRocket} className="text-white" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900">{promoContent.headline}</h3>
            <p className="mt-1 text-sm text-slate-600">{promoContent.subhead}</p>
            <Link
              href="#contact"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-grad text-sm font-bold text-white shadow-soft"
            >
              {promoContent.cta}
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="rounded-2xl p-4 bg-gradient-to-l from-brand-50 to-white border border-brand-100">
        <p className="text-slate-700 text-sm leading-7">
          <strong className="text-slate-900">توکان</strong>—ساخت فروشگاه زیر ۲ دقیقه با فقط هزینه هاستینگ.
          بدون طراحی و راه‌اندازی اولیه. {" "}
          <Link href="#contact" className="text-brand-600 font-bold hover:underline">
            برای شروع پیام دهید
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-[2.2rem] p-6 md:p-8 border-2 border-brand-200 bg-gradient-to-bl from-brand-50/40 to-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-14 w-14 rounded-2xl btn-grad flex items-center justify-center shadow-soft">
            <FontAwesomeIcon icon={faRocket} className="text-white text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">{promoContent.headline}</h3>
            <p className="text-sm text-slate-600 mt-0.5">{promoContent.subhead}</p>
          </div>
        </div>

        <ul className="space-y-3 text-slate-700 leading-7">
          {promoContent.points.map((point, i) => (
            <li key={i} className="flex items-start gap-3">
              <FontAwesomeIcon
                icon={faCircleCheck}
                className="text-brand-500 mt-1 flex-shrink-0"
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl btn-grad font-extrabold text-white shadow-soft"
          >
            {promoContent.cta}
            <FontAwesomeIcon icon={faArrowLeft} />
          </Link>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass font-bold text-slate-700 border border-slate-200 hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faPalette} />
            راه‌اندازی فروشگاه
          </Link>
        </div>
      </div>
    </div>
  );
}
