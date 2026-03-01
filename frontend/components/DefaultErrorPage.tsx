"use client";

import Link from "next/link";
import { DEPLOY_DIRECTION } from "@/lib/i18n/deployment";
import { tFrontend } from "@/lib/i18n/messages";

type ErrorCode = 404 | 500 | 403;

const ERROR_CONFIG: Record<
  ErrorCode,
  { title: string; description: string; icon: string; color: string }
> = {
  404: {
    title: tFrontend("error.404.title"),
    description: tFrontend("error.404.description"),
    icon: "🔍",
    color: "from-slate-50 to-slate-100",
  },
  500: {
    title: tFrontend("error.500.title"),
    description: tFrontend("error.500.description"),
    icon: "⚠️",
    color: "from-red-50 to-slate-50",
  },
  403: {
    title: tFrontend("error.403.title"),
    description: tFrontend("error.403.description"),
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
      dir={DEPLOY_DIRECTION}
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
            {tFrontend("error.backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
