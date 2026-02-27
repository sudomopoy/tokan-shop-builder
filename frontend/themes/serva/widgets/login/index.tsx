"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Phone, Lock } from "lucide-react";
import { authApi } from "@/lib/api";
import type { WidgetConfig } from "@/themes/types";
import { useAppDispatch } from "@/lib/store/hooks";
import { setJwtAuth, setTokenAuth } from "@/lib/auth/authService";

type LoginMode = "sms" | "password";

export default function Login({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<LoginMode>("sms");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // SMS Login states
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<"mobile" | "otp">("mobile");

  // Password Login states
  const [passwordMobile, setPasswordMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const normalizeMobile = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (value.startsWith("+98") && digits.startsWith("98")) return value;
    if (digits.startsWith("0")) return "+98" + digits.slice(1);
    if (digits.startsWith("98")) return "+" + digits;
    return "+98" + digits;
  };

  const getNextDestination = (): string => {
    const next = searchParams?.get("next");
    if (next && next.startsWith("/")) return next;
    return "/";
  };

  const handleSMSMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const normalizedMobile = normalizeMobile(mobile);
      await authApi.requestOTP({ mobile: normalizedMobile });
      setMessage("کد تایید به شماره شما ارسال شد.");
      setOtpStep("otp");
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.mobile?.[0] ||
          "خطا در ارسال کد تایید. لطفا دوباره تلاش کنید."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const normalizedMobile = normalizeMobile(mobile);
      const response = await authApi.verifyOTP({
        mobile: normalizedMobile,
        token: otp,
      });
      if (response.token) {
        setTokenAuth(dispatch, {
          token: response.token,
          user: { mobile: normalizedMobile },
        });
      }
      setMessage("ورود موفقیت‌آمیز بود!");
      router.replace(getNextDestination());
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.token?.[0] ||
          "کد تایید اشتباه است. لطفا دوباره تلاش کنید."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const normalizedMobile = normalizeMobile(passwordMobile);
      const response = await authApi.loginWithPassword({
        mobile: normalizedMobile,
        password: password,
      });
      if (response.access) {
        setJwtAuth(dispatch, {
          access: response.access,
          refresh: response.refresh,
          user: { mobile: normalizedMobile },
        });
      }
      setMessage("ورود موفقیت‌آمیز بود!");
      router.replace(getNextDestination());
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.mobile?.[0] ||
          err.response?.data?.password?.[0] ||
          "شماره موبایل یا رمز عبور اشتباه است."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMobile = () => {
    setOtpStep("mobile");
    setOtp("");
    setError(null);
    setMessage(null);
  };

  const setSmsMode = () => {
    setMode("sms");
    setError(null);
    setMessage(null);
    setOtpStep("mobile");
    setOtp("");
  };

  const setPasswordMode = () => {
    setMode("password");
    setError(null);
    setMessage(null);
  };

  const inputBase =
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-dark placeholder-gray-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 outline-none transition text-sm";
  const btnPrimary =
    "w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center";

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <Link href="/" className="hover:text-primary transition">
              خانه
            </Link>
            <span className="text-xs opacity-60">‹</span>
            <span className="text-dark">ورود</span>
          </nav>
        </div>
      </div>

      <section className="container py-12 md:py-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-dark mb-2 text-center">
            ورود به حساب کاربری
          </h1>
          <p className="text-gray-600 text-sm text-center mb-8">
            برای ادامه، وارد حساب کاربری خود شوید
          </p>

          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={setSmsMode}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${
                mode === "sms"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-dark"
              }`}
            >
              <Phone size={18} />
              ورود با پیامک
            </button>
            <button
              type="button"
              onClick={setPasswordMode}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${
                mode === "password"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-dark"
              }`}
            >
              <Lock size={18} />
              ورود با رمز عبور
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
              {message}
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
            {/* SMS Login */}
            {mode === "sms" && (
              <>
                {otpStep === "mobile" ? (
                  <form onSubmit={handleSMSMobileSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        شماره موبایل
                      </label>
                      <div className="relative">
                        <Phone
                          size={18}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="09123456789"
                          required
                          disabled={loading}
                          dir="ltr"
                          className={`${inputBase} pr-10`}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !mobile}
                      className={btnPrimary}
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "ارسال کد تایید"
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOTPSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark mb-2">
                        کد تایید
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 5))
                        }
                        placeholder="12345"
                        required
                        disabled={loading}
                        dir="ltr"
                        maxLength={5}
                        className={`${inputBase} text-center text-lg tracking-[0.4em]`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 5}
                      className={btnPrimary}
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "تایید و ورود"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleBackToMobile}
                      disabled={loading}
                      className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition disabled:opacity-60"
                    >
                      تغییر شماره موبایل
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Password Login */}
            {mode === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    شماره موبایل
                  </label>
                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="tel"
                      value={passwordMobile}
                      onChange={(e) => setPasswordMobile(e.target.value)}
                      placeholder="09123456789"
                      required
                      disabled={loading}
                      dir="ltr"
                      className={`${inputBase} pr-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-2">
                    رمز عبور
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="••••••••"
                      className={`${inputBase} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      aria-label={showPassword ? "مخفی کردن" : "نمایش"}
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || !passwordMobile || !password}
                  className={btnPrimary}
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "ورود"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
