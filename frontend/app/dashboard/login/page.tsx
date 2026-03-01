"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAppDispatch } from "@/lib/store/hooks";
import { setJwtAuth, setTokenAuth } from "@/lib/auth/authService";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

type LoginMode = "sms" | "password";

function normalizeMobile(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (value.startsWith("+98") && digits.startsWith("98")) return value;
  if (digits.startsWith("0")) return "+98" + digits.slice(1);
  if (digits.startsWith("98")) return "+" + digits;
  return "+98" + digits;
}

export default function DashboardLoginPage() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<LoginMode>("password");
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

  const getNextDestination = (): string => {
    const next = searchParams?.get("next");
    if (next && next.startsWith("/")) return next;
    return "/dashboard";
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
          "خطا در ارسال کد تایید."
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
        setTokenAuth(dispatch, { token: response.token, user: { mobile: normalizedMobile } });
      }
      window.location.href = getNextDestination();
      return;
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.token?.[0] ||
          "کد تایید اشتباه است."
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
        password,
      });
      if (response.access) {
        setJwtAuth(dispatch, {
          access: response.access,
          refresh: response.refresh,
          user: { mobile: normalizedMobile },
        });
      }
      window.location.href = getNextDestination();
      return;
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        {/* Header - matching dashboard style */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-1 bg-gradient-blue bg-clip-text text-transparent">
            ورود به داشبورد فروشگاه
          </h1>
          <p className="text-gray-600 text-sm">
            فقط ادمین‌ها و صاحب فروشگاه می‌توانند وارد شوند
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("sms");
              setError(null);
              setMessage(null);
              setOtpStep("mobile");
              setOtp("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
              mode === "sms"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Phone className="h-4 w-4" />
            ورود با پیامک
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError(null);
              setMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
              mode === "password"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Lock className="h-4 w-4" />
            ورود با رمز عبور
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            {message}
          </div>
        )}

        {mode === "sms" ? (
          otpStep === "mobile" ? (
            <form onSubmit={handleSMSMobileSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                شماره موبایل
              </label>
              <div className="relative mb-4">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="09123456789"
                  required
                  disabled={loading}
                  className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !mobile}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "ارسال کد تایید"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                کد تایید (۵ رقم)
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition mb-4"
              />
              <button
                type="submit"
                disabled={loading || otp.length !== 5}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60 mb-3"
              >
                {loading ? (
                  <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "تایید و ورود"
                )}
              </button>
              <button
                type="button"
                onClick={handleBackToMobile}
                disabled={loading}
                className="btn-secondary w-full py-2.5"
              >
                تغییر شماره موبایل
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handlePasswordLogin}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              شماره موبایل
            </label>
            <div className="relative mb-4">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={passwordMobile}
                onChange={(e) => setPasswordMobile(e.target.value)}
                placeholder="09123456789"
                required
                disabled={loading}
                className="w-full pr-10 pl-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رمز عبور
            </label>
            <div className="relative mb-4">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tFrontendAuto("fe.4fb2a8ca7a45")}
                required
                disabled={loading}
                className="w-full pr-10 pl-12 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "ورود"
              )}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-gray-500">
          این صفحه مخصوص ورود ادمین و صاحب فروشگاه است.
        </p>
      </div>
    </div>
  );
}
