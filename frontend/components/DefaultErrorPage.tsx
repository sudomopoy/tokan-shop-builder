"use client";

import Link from "next/link";

type ErrorCode = 404 | 500 | 403;

const ERROR_CONFIG: Record<
  ErrorCode,
  { title: string; description: string; icon: string; color: string }
> = {
  404: {
    title: "صفحه پیدا نشد",
    description: "متأسفانه صفحه‌ای که دنبالش هستید وجود ندارد.",
    icon: "🔍",
    color: "from-slate-50 to-slate-100",
  },
  500: {
    title: "خطای سرور",
    description: "متأسفانه خطایی در سرور رخ داده است. لطفاً کمی بعد دوباره تلاش کنید.",
    icon: "⚠️",
    color: "from-red-50 to-slate-50",
  },
  403: {
    title: "دسترسی غیرمجاز",
    description: "شما به این بخش دسترسی ندارید.",
    icon: "🚫",
    color: "from-amber-50 to-slate-50",
  },
};

export default function DefaultErrorPage({
  code = 404,
}: {
  code?: ErrorCode;
}) {
  const config = ERROR_CONFIG[code];

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-b ${config.color} p-6`}
      dir="rtl"
    >
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-white shadow-lg flex items-center justify-center text-5xl border border-gray-100">
          {config.icon}
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-800 mb-2">{code}</h1>
          <h2 className="text-xl font-bold text-slate-700 mb-2">{config.title}</h2>
          <p className="text-slate-600">{config.description}</p>
        </div>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}
