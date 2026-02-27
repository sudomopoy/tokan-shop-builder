"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Loader2,
  Check,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Tag,
  Wallet,
  History,
} from "lucide-react";
import {
  subscriptionApi,
  accountApi,
  type SubscriptionPlan,
  type SubscriptionPlanDuration,
  type SubscriptionStatus,
} from "@/lib/api";

function formatPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return new Intl.NumberFormat("fa-IR").format(n);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function parseFeatures(description: string | undefined): string[] {
  if (!description?.trim()) return [];
  return description
    .split(/\n|\r/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type PlanCardProps = {
  plan: SubscriptionPlan;
  selectedPlanId: string;
  selectedDurationMonths: number;
  onSelect: (planId: string, durationMonths: number) => void;
};

function PlanCard({ plan, selectedPlanId, selectedDurationMonths, onSelect }: PlanCardProps) {
  const isSelected = selectedPlanId === plan.id;
  const features = parseFeatures(plan.description);
  const durations = (plan.durations || []).filter((d) => d.is_active);

  return (
    <div
      className={`relative rounded-xl border-2 p-5 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50/50 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {plan.is_default && (
        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
          پیشنهادی
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{plan.title}</h3>
        {features.length > 0 && (
          <ul className="mt-3 space-y-2">
            {features.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          انتخاب مدت اشتراک
        </p>
        <div className="flex flex-col gap-2">
          {durations.map((d) => {
            const isDurSelected = isSelected && selectedDurationMonths === d.duration_months;
            const hasDiscount = Number(d.discount_percent) > 0;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelect(plan.id, d.duration_months)}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl text-right transition-all duration-200 border-2 ${
                  isDurSelected
                    ? "border-blue-500 bg-blue-500 text-white shadow-md shadow-blue-500/25"
                    : "border-gray-100 bg-gray-50/80 hover:border-gray-200 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      isDurSelected ? "bg-white/25" : "bg-white shadow-sm"
                    }`}
                  >
                    {d.duration_months}
                  </span>
                  <div className="text-right">
                    <span className="block font-semibold">{d.duration_months} ماهه</span>
                    {hasDiscount && (
                      <span className={`inline-flex items-center gap-1 text-xs mt-0.5 ${isDurSelected ? "text-white/90" : "text-emerald-600 font-medium"}`}>
                        <Tag className="h-3 w-3 shrink-0" />
                        {d.discount_percent}٪ تخفیف
                      </span>
                    )}
                  </div>
                </div>
                <div className={`flex flex-col items-end shrink-0 ${isDurSelected ? "text-white" : "text-gray-700"}`}>
                  <span className="font-bold tabular-nums text-base">
                    {formatPrice(d.final_price)}
                  </span>
                  <span className={`text-xs ${isDurSelected ? "text-white/80" : "text-gray-500"}`}>
                    تومان
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedDurationMonths, setSelectedDurationMonths] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [discountVerified, setDiscountVerified] = useState<{
    valid: boolean;
    discount_type?: string;
    discount_value?: number;
  } | null>(null);
  const [walletAmount, setWalletAmount] = useState(0);

  const fetchData = async () => {
    try {
      const [statusData, plansData, userData] = await Promise.all([
        subscriptionApi.getStatus(),
        subscriptionApi.getPlans(),
        accountApi.getInfo(),
      ]);
      setStatus(statusData);
      setPlans(plansData);
      const bal = userData?.wallet?.available_balance;
      setWalletBalance(
        typeof bal === "string" ? parseFloat(bal) || 0 : (bal ?? 0)
      );
      if (plansData.length > 0 && !selectedPlanId) {
        const defaultPlan = plansData.find((p) => p.is_default) ?? plansData[0];
        setSelectedPlanId(defaultPlan.id);
        const firstDuration = defaultPlan.durations?.[0];
        setSelectedDurationMonths(firstDuration?.duration_months ?? 1);
      }
    } catch (err) {
      console.error(err);
      setError("خطا در بارگذاری اطلاعات اشتراک");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelect = (planId: string, durationMonths: number) => {
    setSelectedPlanId(planId);
    setSelectedDurationMonths(durationMonths);
  };

  const handleVerifyDiscount = async () => {
    if (!discountCode.trim()) return;
    setError("");
    try {
      const res = await subscriptionApi.verifyDiscount({
        code: discountCode.trim(),
        plan_id: selectedPlanId,
        duration_months: selectedDurationMonths,
      });
      setDiscountVerified(
        res.valid
          ? {
              valid: true,
              discount_type: res.discount_type,
              discount_value: res.discount_value,
            }
          : { valid: false }
      );
    } catch {
      setDiscountVerified({ valid: false });
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const selectedDuration = selectedPlan?.durations?.find(
    (d) => d.duration_months === selectedDurationMonths
  );
  const finalPrice = selectedDuration?.final_price ?? 0;
  const daysLeft = status?.subscription_days_remaining ?? null;
  const isLow = daysLeft !== null && daysLeft <= 14;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  const handleRenew = async () => {
    if (!selectedPlanId || !selectedDurationMonths) {
      setError("پلن و مدت را انتخاب کنید.");
      return;
    }
    setError("");
    setRenewing(true);
    try {
      const res = await subscriptionApi.renew({
        plan_id: selectedPlanId,
        duration_months: selectedDurationMonths,
        discount_code: discountCode.trim() || undefined,
        wallet_amount: walletAmount > 0 ? Math.min(walletAmount, finalPrice, walletBalance) : undefined,
      });
      if (res.completed) {
        await fetchData();
        setWalletAmount(0);
      } else if (res.payment_link) {
        window.location.href = res.payment_link;
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "خطا در ایجاد درخواست تمدید. لطفاً دوباره تلاش کنید."
      );
    } finally {
      setRenewing(false);
    }
  };

  const maxWalletAmount = Math.min(Math.floor(finalPrice), Math.floor(walletBalance));
  const handleUseWallet = () => {
    setWalletAmount(maxWalletAmount);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-3 text-sm text-gray-500">در حال بارگذاری...</p>
      </div>
    );
  }

  const PaymentSection = () => (
    <div className="space-y-4">
      <h2 className="font-bold text-gray-900">کد تخفیف و پرداخت</h2>

      {/* کیف پول */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">کیف پول</label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">
            موجودی: <span className="font-semibold tabular-nums">{formatPrice(walletBalance)}</span> تومان
          </span>
          {maxWalletAmount > 0 && (
            <button
              type="button"
              onClick={handleUseWallet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium transition"
            >
              <Wallet className="h-4 w-4" />
              استفاده از کیف پول
            </button>
          )}
        </div>
        {walletAmount > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={maxWalletAmount}
              value={walletAmount}
              onChange={(e) => setWalletAmount(Math.max(0, Math.min(maxWalletAmount, parseInt(e.target.value) || 0)))}
              className="w-28 px-2 py-1.5 rounded-lg border border-gray-200 text-sm tabular-nums"
            />
            <span className="text-xs text-gray-500">تومان از کیف پول</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">کد تخفیف (اختیاری)</label>
        <div className="flex gap-2 min-w-0">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => {
              setDiscountCode(e.target.value.toUpperCase());
              setDiscountVerified(null);
            }}
            placeholder="مثال: TOKAN20"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            type="button"
            onClick={handleVerifyDiscount}
            className="shrink-0 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
          >
            اعتبارسنجی
          </button>
        </div>
        {discountVerified && (
          <p className={`mt-1.5 text-xs flex items-center gap-1 ${discountVerified.valid ? "text-emerald-600" : "text-red-600"}`}>
            {discountVerified.valid ? (
              <>
                <Check className="h-3.5 w-3.5" />
                کد معتبر
                {discountVerified.discount_type === "percent" && ` — ${discountVerified.discount_value}٪ تخفیف`}
              </>
            ) : (
              "کد تخفیف معتبر نیست"
            )}
          </p>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row lg:flex-col gap-4 pt-2 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-500">مبلغ قابل پرداخت</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums">
            {formatPrice(Math.max(0, finalPrice - walletAmount))}
            <span className="text-sm font-normal text-gray-500 mr-1">تومان</span>
          </p>
          {walletAmount > 0 && (
            <p className="text-xs text-emerald-600 mt-0.5">
              {formatPrice(walletAmount)} تومان از کیف پول
            </p>
          )}
          {selectedPlan && selectedDuration && (
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedPlan.title} — {selectedDuration.duration_months} ماهه
            </p>
          )}
        </div>
        <button
          onClick={handleRenew}
          disabled={renewing || !selectedPlanId || !selectedDurationMonths}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {renewing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CreditCard className="h-5 w-5" />
          )}
          پرداخت و تمدید
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[60vh] pb-24 lg:pb-0">
      {/* دسکتاپ: لایه دو ستونه — چپ: محتوا، راست: پرداخت sticky */}
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:items-start">
        {/* ستون چپ: وضعیت + پلن‌ها */}
        <div className="space-y-5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-xl font-bold text-gray-900">اشتراک فروشگاه</h1>
            <Link
              href="/dashboard/subscription/history"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
            >
              <History className="h-4 w-4" />
              تاریخچه اشتراک
            </Link>
          </div>

          {/* وضعیت فعلی — compact */}
          <div
            className={`card p-4 border-r-4 ${
              isExpired
                ? "border-red-300 bg-red-50/50"
                : isLow
                  ? "border-amber-400 bg-amber-50/50"
                  : "border-blue-400 bg-blue-50/30"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  isExpired ? "bg-red-100 text-red-600" : isLow ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                }`}
              >
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600">
                  پلن فعلی: <span className="font-semibold text-gray-900">{status?.subscription_plan?.title ?? "—"}</span>
                </p>
                <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  انقضا: {formatDate(status?.subscription_expires_at ?? null)}
                </p>
                <p className={`text-sm font-semibold mt-1 ${isExpired ? "text-red-700" : isLow ? "text-amber-700" : "text-blue-700"}`}>
                  {daysLeft !== null ? (
                    daysLeft > 0 ? (
                      <>مهلت باقی‌مانده: {daysLeft} روز</>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        اشتراک منقضی شده
                      </span>
                    )
                  ) : (
                    "بدون اشتراک فعال"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* موبایل: کیف پول و کد تخفیف */}
          <div className="lg:hidden card p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">کیف پول</label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">
                  موجودی: <span className="font-semibold tabular-nums">{formatPrice(walletBalance)}</span> تومان
                </span>
                {maxWalletAmount > 0 && (
                  <button
                    type="button"
                    onClick={handleUseWallet}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-sm font-medium"
                  >
                    <Wallet className="h-4 w-4" />
                    استفاده از کیف پول
                  </button>
                )}
              </div>
              {walletAmount > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={maxWalletAmount}
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(Math.max(0, Math.min(maxWalletAmount, parseInt(e.target.value) || 0)))}
                    className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 text-sm tabular-nums"
                  />
                  <span className="text-xs text-gray-500">تومان</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">کد تخفیف (اختیاری)</label>
            <div className="flex gap-2 min-w-0">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase());
                  setDiscountVerified(null);
                }}
                placeholder="مثال: TOKAN20"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleVerifyDiscount}
                className="shrink-0 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
              >
                اعتبارسنجی
              </button>
            </div>
            {discountVerified && (
              <p className={`mt-1.5 text-xs flex items-center gap-1 ${discountVerified.valid ? "text-emerald-600" : "text-red-600"}`}>
                {discountVerified.valid ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    کد معتبر
                    {discountVerified.discount_type === "percent" && ` — ${discountVerified.discount_value}٪ تخفیف`}
                  </>
                ) : (
                  "کد تخفیف معتبر نیست"
                )}
              </p>
            )}
            {error && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-700 text-xs mt-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            </div>
          </div>

          {/* پلن‌ها */}
          <div>
            <h2 className="font-bold text-gray-900 mb-3">انتخاب پلن اشتراک</h2>
            {plans.length === 0 ? (
              <div className="card p-5">
                <p className="text-amber-600 text-sm">
                  هیچ پلن اشتراکی تعریف نشده است.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    selectedPlanId={selectedPlanId}
                    selectedDurationMonths={selectedDurationMonths}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ستون راست: پرداخت sticky — دسکتاپ */}
        <div className="hidden lg:block lg:sticky lg:top-4 min-w-0">
          <div className="card p-5 min-w-0 overflow-hidden">
            <PaymentSection />
          </div>
        </div>
      </div>

      {/* موبایل: نوار پرداخت fixed پایین */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] p-4">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">مبلغ قابل پرداخت</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums truncate">
              {formatPrice(Math.max(0, finalPrice - walletAmount))} <span className="text-xs font-normal text-gray-500">تومان</span>
            </p>
          </div>
          <button
            onClick={handleRenew}
            disabled={renewing || !selectedPlanId || !selectedDurationMonths}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {renewing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
            پرداخت
          </button>
        </div>
      </div>

    </div>
  );
}
