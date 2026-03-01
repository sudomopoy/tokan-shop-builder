"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faStore,
  faTag,
  faPalette,
  faRocket,
  faArrowLeft,
  faArrowRight,
  faSpinner,
  faCheck,
  faInfoCircle,
  faImages,
  faExternalLink,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import * as api from "@/lib/api";
import type { ThemeCatalog } from "@/lib/api";
import { tLandingAuto } from "@/lib/autoMessages";

function normalizeMobile(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return "+98" + digits.slice(1);
  if (digits.startsWith("98")) return "+" + digits;
  return "+98" + digits;
}

const STEPS = [
  { id: "auth", title: "ورود", icon: faPhone },
  { id: "info", title: "اطلاعات فروشگاه", icon: faStore },
  { id: "extra", title: "شعار و توضیحات", icon: faTag },
  { id: "theme", title: "انتخاب تم", icon: faPalette },
  { id: "create", title: "ساخت فروشگاه", icon: faRocket },
];

function SetupPageContent() {
  const searchParams = useSearchParams();
  const referralCode = searchParams?.get("ref") || undefined;
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState<"mobile" | "otp">("mobile");
  const [authDone, setAuthDone] = useState(false);

  // Store info
  const [storeName, setStoreName] = useState("");
  const [storeTitle, setStoreTitle] = useState("");
  const [storeCategory, setStoreCategory] = useState<string>("");
  const [storeNameStatus, setStoreNameStatus] = useState<"idle" | "checking" | "ok" | "fail">("idle");

  // Extra
  const [slogan, setSlogan] = useState("");
  const [description, setDescription] = useState("");

  // Theme
  const [themes, setThemes] = useState<ThemeCatalog[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("default");
  const [themeDetail, setThemeDetail] = useState<ThemeCatalog | null>(null);

  // Categories
  const [categories, setCategories] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    api.getStoreCategories().then(setCategories).catch(() => {});
    api.getThemes(true).then((t) => setThemes(Array.isArray(t) ? t : [])).catch(() => {});
  }, []);

  // اگر کاربر از قبل لاگین کرده، مرحلهٔ ورود (شماره و OTP) را رد کن
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("tokan_auth_v1");
      if (!raw) return;
      const auth = JSON.parse(raw);
      const hasValidAuth = (auth.method === "token" && auth.token) || (auth.method === "jwt" && auth.access);
      if (hasValidAuth) {
        setAuthDone(true);
        setStep(1);
      }
    } catch {}
  }, []);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.requestOTP(normalizeMobile(mobile), referralCode);
      setOtpStep("otp");
    } catch (err: any) {
      setError(err.data?.detail || err.data?.mobile?.[0] || "خطا در ارسال کد تایید");
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
        setAuthDone(true);
        setStep(1);
      }
    } catch (err: any) {
      setError(err.data?.detail || err.data?.token?.[0] || "کد تایید اشتباه است");
    } finally {
      setLoading(false);
    }
  };

  const checkNameRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingCheckNameRef = useRef<string | null>(null);

  // Debounced auto-validation while typing
  useEffect(() => {
    if (checkNameRef.current) clearTimeout(checkNameRef.current);
    const name = storeName.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (!name || name.length < 3) {
      setStoreNameStatus(name ? "fail" : "idle");
      pendingCheckNameRef.current = null;
      return;
    }
    pendingCheckNameRef.current = name;
    checkNameRef.current = setTimeout(async () => {
      const nameToCheck = name;
      setStoreNameStatus("checking");
      try {
        const res = await api.checkStoreName(nameToCheck);
        if (pendingCheckNameRef.current === nameToCheck) {
          setStoreNameStatus(res.status === "usable" ? "ok" : "fail");
        }
      } catch {
        if (pendingCheckNameRef.current === nameToCheck) {
          setStoreNameStatus("fail");
        }
      }
    }, 450);
    return () => { if (checkNameRef.current) clearTimeout(checkNameRef.current); };
  }, [storeName]);

  const cleanStoreName = storeName.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const canProceedFromInfo = cleanStoreName.length >= 3 && storeNameStatus === "ok" && storeTitle.trim();

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const name = cleanStoreName;
      const res = await api.createStore({
        title: storeTitle || name,
        name,
        description: description || undefined,
        slogan: slogan || undefined,
        store_category: storeCategory || undefined,
        theme_slug: selectedTheme || "default",
      });
      const baseDomain = typeof window !== "undefined" 
        ? (process.env.NEXT_PUBLIC_WEBSITE_BASE || "https://tokan.app").replace(/\/$/, "")
        : "https://tokan.app";
      const dashboardUrl = `https://${res.internal_domain}/dashboard`;
      const auth = localStorage.getItem("tokan_auth_v1");
      let target = dashboardUrl;
      if (auth) {
        try {
          const parsed = JSON.parse(auth);
          const token = parsed.token ? `Token ${parsed.token}` : parsed.access ? `Bearer ${parsed.access}` : null;
          if (token) target = `${dashboardUrl}#auth=${encodeURIComponent(token)}`;
        } catch {}
      }
      window.location.href = target;
    } catch (err: any) {
      setError(err.data?.error || err.data?.detail || "خطا در ساخت فروشگاه");
    } finally {
      setLoading(false);
    }
  };

  const currentStepId = step === 0 ? (otpStep === "otp" ? "auth" : "auth") : STEPS[step]?.id;

  return (
    <div className="min-h-screen hero-surface relative">
      <div className="grid-dots absolute inset-0 opacity-40" />
      <div className="max-w-2xl mx-auto px-4 py-10 relative">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8">
          <FontAwesomeIcon icon={faArrowRight} />
          بازگشت به صفحه اصلی
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-2xl btn-grad flex items-center justify-center">
            <Image src="/logo.jpg" alt={tLandingAuto("ld.989871906ce6")} width={32} height={32} className="rounded-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{tLandingAuto("ld.991cebd4036a")}</h1>
            <p className="text-slate-600 text-sm">{tLandingAuto("ld.de016f802cab")}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                i <= step ? "glass border-brand-300 bg-brand-50/50" : "glass border-slate-200"
              }`}
            >
              <FontAwesomeIcon icon={s.icon} className={i <= step ? "text-brand-600" : "text-slate-400"} />
              <span className={i <= step ? "font-bold text-slate-800" : "text-slate-500"}>{s.title}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === 0 && !authDone && (
          <div className="glass rounded-3xl p-6 md:p-8 border border-slate-200">
            {otpStep === "mobile" ? (
              <form onSubmit={handleRequestOTP}>
                <label className="block text-sm font-medium text-slate-700 mb-2">{tLandingAuto("ld.584cd947eae4")}</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="09123456789"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !mobile}
                  className="mt-4 w-full py-3 rounded-xl btn-grad font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "ارسال کد تایید"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <label className="block text-sm font-medium text-slate-700 mb-2">{tLandingAuto("ld.c96c39703bba")}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="12345"
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center text-lg tracking-widest focus:ring-2 focus:ring-brand-500 outline-none mb-4"
                />
                <button
                  type="submit"
                  disabled={loading || otp.length !== 5}
                  className="mt-2 w-full py-3 rounded-xl btn-grad font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : "تایید و ادامه"}
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpStep("mobile"); setOtp(""); }}
                  disabled={loading}
                  className="mt-3 w-full py-2 text-slate-600 hover:text-slate-900 text-sm"
                >
                  تغییر شماره موبایل
                </button>
              </form>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="glass rounded-3xl p-6 md:p-8 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{tLandingAuto("ld.d17cbbf65084")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{tLandingAuto("ld.a01c868d5672")}</label>
                <input
                  type="text"
                  value={storeTitle}
                  onChange={(e) => setStoreTitle(e.target.value)}
                  placeholder={tLandingAuto("ld.7fb7f6a417ef")}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{tLandingAuto("ld.1f8273d56b74")}</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                  placeholder="mystore"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {storeNameStatus === "checking" && (
                  <p className="mt-2 text-sm text-slate-500 flex items-center gap-2">
                    <FontAwesomeIcon icon={faSpinner} spin /> در حال بررسی...
                  </p>
                )}
                {storeNameStatus === "ok" && (
                  <p className="text-emerald-600 text-sm mt-2 flex items-center gap-2">{tLandingAuto("ld.d3fe4e578ef6")}</p>
                )}
                {storeNameStatus === "fail" && storeName && (
                  <p className="text-red-600 text-sm mt-2">{tLandingAuto("ld.537285dd636c")}</p>
                )}
                <div className="mt-4 p-4 rounded-xl bg-slate-50/80 border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 mb-1">{tLandingAuto("ld.b99b04a45d63")}</p>
                  <p className="text-base font-mono font-bold text-slate-800 break-all">
                    {cleanStoreName ? (
                      <span>{cleanStoreName}.tokan.app</span>
                    ) : (
                      <span className="text-slate-400">{tLandingAuto("ld.073b8cc0d5b2")}</span>
                    )}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{tLandingAuto("ld.2b93d74458a4")}</label>
                <select
                  value={storeCategory}
                  onChange={(e) => setStoreCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="">{tLandingAuto("ld.c682022d6ac6")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedFromInfo}
              className="mt-6 w-full py-3 rounded-xl btn-grad font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
            >
              ادامه <FontAwesomeIcon icon={faArrowLeft} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="glass rounded-3xl p-6 md:p-8 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{tLandingAuto("ld.475d0b03d6db")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{tLandingAuto("ld.0ff103c10f5f")}</label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder={tLandingAuto("ld.4edfab294089")}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{tLandingAuto("ld.3599a9b4c677")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={tLandingAuto("ld.816224c194a3")}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl glass border border-slate-200 font-bold text-slate-700">
                قبلی
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl btn-grad font-bold text-white flex items-center justify-center gap-2"
              >
                ادامه <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="glass rounded-3xl p-6 md:p-8 border border-slate-200">
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-200">
              <div className="p-2 rounded-xl bg-brand-100">
                <FontAwesomeIcon icon={faPalette} className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{tLandingAuto("ld.46e355a2ea63")}</h2>
                <p className="text-sm text-slate-500">{tLandingAuto("ld.88e200db6300")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {themes.map((theme) => {
                const slug = theme.slug_display ?? theme.slug ?? "default";
                const isActive = selectedTheme === slug;
                return (
                  <article
                    key={theme.id}
                    className={`group relative bg-white rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-lg ${
                      isActive ? "border-brand-500 shadow-md ring-2 ring-brand-100" : "border-slate-200 hover:border-brand-200"
                    }`}
                  >
                    <div className="relative aspect-[5/3] bg-slate-100 overflow-hidden">
                      {theme.thumbnail_url ? (
                        <img
                          src={theme.thumbnail_url}
                          alt={theme.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FontAwesomeIcon icon={faPalette} className="h-14 w-14 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-medium">
                          رایگان
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 mb-1.5 line-clamp-1">{theme.name}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3 min-h-[2.5rem]">
                        {theme.description || "تم زیبا و حرفه‌ای برای فروشگاه شما"}
                      </p>
                      {theme.tags && theme.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {theme.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setThemeDetail(theme)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-brand-300 transition-colors"
                        >
                          <FontAwesomeIcon icon={faInfoCircle} className="h-4 w-4" />
                          جزئیات
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTheme(slug)}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                            isActive ? "bg-brand-100 text-brand-700 cursor-default" : "btn-grad text-white hover:opacity-90"
                          }`}
                        >
                          {isActive ? <><FontAwesomeIcon icon={faCheck} className="h-4 w-4" />{tLandingAuto("ld.8a6c594d95c6")}</> : "انتخاب"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {themes.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm">{tLandingAuto("ld.f11234658209")}</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl glass border border-slate-200 font-bold text-slate-700">
                قبلی
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 rounded-xl btn-grad font-bold text-white flex items-center justify-center gap-2"
              >
                ادامه <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            </div>
          </div>
        )}

        {themeDetail && step === 3 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setThemeDetail(null)} aria-hidden />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 shrink-0">
                <h3 className="text-lg font-bold text-slate-900">{themeDetail.name}</h3>
                <button type="button" onClick={() => setThemeDetail(null)} className="p-2 rounded-lg hover:bg-slate-200" aria-label={tLandingAuto("ld.3af7576fd554")}>
                  <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="aspect-video rounded-lg overflow-hidden bg-slate-100">
                  {(themeDetail.gallery_expanded?.[0]?.url || themeDetail.thumbnail_url) ? (
                    <img
                      src={themeDetail.gallery_expanded?.[0]?.url || themeDetail.thumbnail_url || ""}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faPalette} className="h-20 w-20 text-slate-300" />
                    </div>
                  )}
                </div>
                {themeDetail.gallery_expanded && themeDetail.gallery_expanded.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {themeDetail.gallery_expanded.map((item, i) => (
                      <div key={i} className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 border-slate-200">
                        {item.url ? (
                          <img src={item.url} alt={tLandingAuto("ld.acc4e3615818")}w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                            <FontAwesomeIcon icon={faImages} className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {themeDetail.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">{tLandingAuto("ld.3599a9b4c677")}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{themeDetail.description}</p>
                  </div>
                )}
                {themeDetail.tags && themeDetail.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">{tLandingAuto("ld.321f3a487460")}</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {themeDetail.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 flex gap-3">
                {themeDetail.demo_url && (
                  <a
                    href={themeDetail.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 flex-1 py-3 px-4 rounded-lg border-2 border-brand-500 text-brand-600 font-medium hover:bg-brand-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faExternalLink} className="h-5 w-5" />
                    مشاهده دمو
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedTheme(themeDetail.slug_display ?? themeDetail.slug ?? "default"); setThemeDetail(null); }}
                  className={`flex items-center justify-center gap-2 ${themeDetail.demo_url ? "flex-1" : "w-full"} py-3 px-4 rounded-lg btn-grad font-bold text-white`}
                >
                  <FontAwesomeIcon icon={faCheck} className="h-5 w-5" />
                  انتخاب این تم
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="glass rounded-3xl p-6 md:p-8 border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">{tLandingAuto("ld.59bfa1695af0")}</h2>
            <p className="text-slate-600 text-sm mb-4">
              فروشگاه شما با پلن رایگان یک ماهه ساخته می‌شود.
            </p>
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-brand-50 to-slate-50 border border-brand-200">
              <p className="text-xs font-medium text-slate-500 mb-2">{tLandingAuto("ld.b99b04a45d63")}</p>
              <p className="text-lg font-mono font-bold text-brand-700 break-all">
                {cleanStoreName}.tokan.app
              </p>
              <p className="text-xs text-slate-500 mt-2">{tLandingAuto("ld.a77bb516a61e")}</p>
            </div>
            <form onSubmit={handleCreateStore}>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl btn-grad font-extrabold text-white text-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faRocket} />{tLandingAuto("ld.59bfa1695af0")}</>}
              </button>
            </form>
            <button onClick={() => setStep(3)} className="mt-4 w-full py-2 text-slate-600 text-sm">
              قبلی
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-slate-500">{tLandingAuto("ld.0ef7f18ca905")}</div></div>}>
      <SetupPageContent />
    </Suspense>
  );
}
