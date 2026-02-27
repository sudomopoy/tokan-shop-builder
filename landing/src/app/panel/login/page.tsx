"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faSpinner,
  faArrowRight,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import * as api from "@/lib/api";

function normalizeMobile(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+98" + digits.slice(1);
  if (digits.startsWith("98")) return "+" + digits;
  return "+98" + digits;
}

export default function PanelLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("tokan_auth_v1");
    if (raw) {
      try {
        const auth = JSON.parse(raw);
        if (auth.token || auth.access) {
          router.replace("/panel/dashboard");
          return;
        }
      } catch {}
    }
  }, [router]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.requestOTP(normalizeMobile(mobile));
      setStep("otp");
    } catch (err: unknown) {
      const data = (err as { data?: { detail?: string; mobile?: string[] } })?.data;
      setError(data?.detail || data?.mobile?.[0] || "خطا در ارسال کد تایید");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyOTP(normalizeMobile(mobile), otp);
      if (res.token) {
        const auth = { version: 1, method: "token" as const, token: res.token, savedAt: Date.now() };
        localStorage.setItem("tokan_auth_v1", JSON.stringify(auth));
        localStorage.setItem("auth_token", res.token);
        router.replace("/panel/dashboard");
      }
    } catch (err: unknown) {
      const data = (err as { data?: { detail?: string; token?: string[] } })?.data;
      setError(data?.detail || data?.token?.[0] || "کد تایید اشتباه است");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
      >
        <FontAwesomeIcon icon={faArrowRight} />
        بازگشت به صفحه اصلی
      </Link>

      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl btn-grad flex items-center justify-center">
            <Image
              src="/logo.jpg"
              alt="توکان"
              width={32}
              height={32}
              className="rounded-lg"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">ورود به پنل مدیریت</h1>
            <p className="text-slate-600 text-sm">
              کیف پول، دعوت و پاداش، فروشگاه‌ها
            </p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-slate-200">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === "mobile" ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  شماره موبایل
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition text-left"
                  required
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl btn-grad text-white font-bold flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faPhone} />
                )}
                ارسال کد تایید
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  کد تایید
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="۱۲۳۴۵۶"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition text-center font-mono text-lg"
                  required
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl btn-grad text-white font-bold flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faKey} />
                )}
                ورود
              </button>
              <button
                type="button"
                onClick={() => { setStep("mobile"); setOtp(""); setError(null); }}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                تغییر شماره موبایل
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
