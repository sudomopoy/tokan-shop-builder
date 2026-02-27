"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  ShieldCheck,
  CreditCard,
  Truck,
  Package,
  Search,
  BarChart3,
  Layers,
  BookOpen,
  Link2,
  Image as ImageIcon,
  Rocket,
  CheckCircle2,
  Circle,
  GraduationCap,
  Sparkles,
  Loader2,
  ChevronLeft,
  ExternalLink,
  Play,
  X,
  PartyPopper,
} from "lucide-react";
import { storeApi } from "@/lib/api";
import Link from "next/link";
import SetupGuideModal from "./SetupGuideModal";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  domain: Globe,
  enamad: ShieldCheck,
  payment: CreditCard,
  shipping: Truck,
  first_product: Package,
  google_search_console: Search,
  google_analytics: BarChart3,
  google_tag_manager: Layers,
  first_blog: BookOpen,
  torob: Link2,
  branding: ImageIcon,
  subscription: CreditCard,
  start_selling: Rocket,
};

const TASK_ACTIONS: Record<string, { href: string; label: string }> = {
  domain: { href: "/dashboard/settings?tab=domain", label: "تنظیم دامنه" },
  enamad: { href: "/dashboard/settings?tab=badges", label: "نصب نماد" },
  payment: { href: "/dashboard/settings?tab=payment", label: "تنظیم درگاه" },
  shipping: { href: "/dashboard/settings?tab=shipping", label: "تنظیم ارسال" },
  first_product: { href: "/dashboard/products/new", label: "افزودن محصول" },
  google_search_console: { href: "/dashboard/settings?tab=seo", label: "تنظیم" },
  google_analytics: { href: "/dashboard/settings?tab=seo", label: "تنظیم" },
  google_tag_manager: { href: "/dashboard/settings?tab=seo", label: "تنظیم" },
  first_blog: { href: "/dashboard/blog/new", label: "نوشتن مقاله" },
  torob: { href: "/dashboard/settings?tab=seo", label: "اتصال" },
  branding: { href: "/dashboard/settings?tab=branding", label: "تنظیم لوگو" },
  subscription: { href: "/dashboard/subscription", label: "تهیه اشتراک" },
};

const PERSIAN_NUMS = "۰۱۲۳۴۵۶۷۸۹";
const toFa = (n: number) => String(n).replace(/\d/g, (d) => PERSIAN_NUMS[+d] ?? d);
function formatPrice(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n);
}

const CONGRATS_DISMISS_KEY = "setup_congrats_dismissed";

function getCongratsDismissKey(storeId?: string): string {
  return storeId ? `${CONGRATS_DISMISS_KEY}_${storeId}` : CONGRATS_DISMISS_KEY;
}

export default function SetupTasksSection() {
  const [progress, setProgress] = useState<{
    tasks: Array<{ key: string; label: string; guide_path: string; optional: boolean; done: boolean }>;
    smart_setup_completed: boolean;
    smart_setup_pending: boolean;
    smart_setup_current_stage?: string | null;
    store_id?: string;
  } | null>(null);
  const [cost, setCost] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [guideModal, setGuideModal] = useState<{ path: string; title: string } | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [congratsDismissed, setCongratsDismissed] = useState(false);

  const fetchData = async () => {
    try {
      const [p, c] = await Promise.all([
        storeApi.getSetupProgress().catch(() => null),
        storeApi.getSmartSetupCost().catch(() => ({ cost_amount: 0 })),
      ]);
      setProgress(p && Array.isArray(p.tasks) ? p : null);
      setCost(c?.cost_amount ?? 0);
      if (p?.store_id) {
        const key = getCongratsDismissKey(p.store_id);
        setCongratsDismissed(typeof window !== "undefined" && localStorage.getItem(key) === "1");
      }
    } catch {
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dismissCongrats = () => {
    const key = getCongratsDismissKey(progress?.store_id);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, "1");
    }
    setCongratsDismissed(true);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!progress || !Array.isArray(progress.tasks)) return null;

  // درخواست تکمیل شده - نمایش تبریک (قابل بستن)
  if (progress.smart_setup_completed && !congratsDismissed) {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50/30 shadow-sm overflow-hidden">
        <div className="p-6 flex items-start gap-4">
          <div className="flex-shrink-0 p-3 rounded-xl bg-emerald-100">
            <PartyPopper className="h-10 w-10 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              فروشگاه شما راه‌اندازی شد!
            </h2>
            <p className="text-gray-600 mt-2">
              تبریک! کارشناسان ما راه‌اندازی اولیه فروشگاه شما را با موفقیت انجام داده‌اند. اکنون می‌توانید فروش خود را آغاز کنید.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissCongrats}
            className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // درخواست تکمیل شده و کاربر الرت را بسته - چیزی نشان نده
  if (progress.smart_setup_completed && congratsDismissed) {
    return null;
  }

  // درخواست در حال انجام - نمایش وضعیت با مرحله
  if (progress.smart_setup_pending) {
    return (
      <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/30 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-violet-200 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 justify-center">
              درخواست راه‌اندازی شما در حال انجام است
            </h2>
            <p className="text-gray-600 mt-2 max-w-md">
              تیم پشتیبانی در حال انجام مراحل راه‌اندازی فروشگاه شما است. به زودی فروشگاه شما آماده خواهد شد.
            </p>
            {progress.smart_setup_current_stage && (
              <div className="mt-6 px-5 py-3 rounded-xl bg-violet-100 border border-violet-200">
                <p className="text-xs text-violet-600 font-medium mb-1">مرحله فعلی</p>
                <p className="font-semibold text-violet-800">{progress.smart_setup_current_stage}</p>
              </div>
            )}
            {!progress.smart_setup_current_stage && (
              <p className="mt-4 text-sm text-gray-500">در حال بررسی درخواست...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // حالت عادی: لیست تسک‌ها + لینک سفارش راه‌اندازی
  const allDone = progress.tasks.every((t) => t.done);
  if (allDone) return null;

  const doneTasks = progress.tasks.filter((t) => t.done);
  const pendingTasks = progress.tasks.filter((t) => !t.done);
  const total = progress.tasks.length;
  const doneCount = doneTasks.length;
  const pendingCount = pendingTasks.length;
  const nextTask = pendingTasks[0];
  const action = nextTask && TASK_ACTIONS[nextTask.key];

  return (
    <>
      <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/30 shadow-sm overflow-hidden">
        {/* هدر با پیشرفت */}
        <div className="p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                    strokeDasharray={`${(doneCount / total) * 100}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-violet-700">
                  {toFa(doneCount)}/{toFa(total)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                  راه‌اندازی فروشگاه
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {pendingCount > 0 ? (
                    <>
                      <span className="font-medium text-violet-700">فقط {toFa(pendingCount)} قدم</span> تا آماده‌سازی کامل
                    </>
                  ) : (
                    <span className="text-green-600 font-medium">همه چیز آماده است!</span>
                  )}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/setup/order"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-medium text-sm shadow-sm transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              سفارش راه‌اندازی اولیه وب‌سایت
              {cost > 0 && ` (${formatPrice(cost)} تومان)`}
            </Link>
          </div>
        </div>

        {/* قدم بعدی - برجسته */}
        {nextTask && (
          <div className="px-6 pb-4">
            <div className="rounded-xl bg-white border-2 border-violet-300/60 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                  {(() => {
                    const Icon = ICON_MAP[nextTask.key] ?? Circle;
                    return <Icon className="h-6 w-6 text-violet-600" />;
                  })()}
                </div>
                <div>
                  <p className="text-xs text-violet-600 font-medium">قدم بعدی شما</p>
                  <p className="font-bold text-gray-900">{nextTask.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:mr-auto">
                {action && (
                  <Link
                    href={action.href}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium text-sm transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    {action.label}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setGuideModal({ path: nextTask.guide_path, title: nextTask.label })}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 font-medium text-sm transition-colors"
                >
                  <GraduationCap className="h-4 w-4" />
                  آموزش
                </button>
              </div>
            </div>
          </div>
        )}

        {/* لیست قدم‌های باقی‌مانده - اسکرول */}
        <div className="px-6 pb-6">
          <div className="max-h-[280px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-violet-50/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pendingTasks.slice(nextTask ? 1 : 0).map((task) => {
                const Icon = ICON_MAP[task.key] ?? Circle;
                const act = TASK_ACTIONS[task.key];
                return (
                  <div
                    key={task.key}
                    className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:border-violet-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-violet-50 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-gray-500 group-hover:text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {task.label}
                        {task.optional && (
                          <span className="text-gray-400 font-normal text-xs mr-1">(اختیاری)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {act && (
                          <Link
                            href={act.href}
                            className="text-xs text-violet-600 hover:text-violet-700 font-medium inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {act.label}
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => setGuideModal({ path: task.guide_path, title: task.label })}
                          className="text-xs text-gray-500 hover:text-violet-600 font-medium"
                        >
                          آموزش
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* موارد انجام‌شده - جمع‌شونده */}
          {doneTasks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-violet-100">
              <button
                type="button"
                onClick={() => setShowCompleted((v) => !v)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                <ChevronLeft
                  className={`h-4 w-4 transition-transform ${showCompleted ? "rotate-[-90deg]" : "rotate-[90deg]"}`}
                />
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {toFa(doneTasks.length)} مورد انجام شده
              </button>
              {showCompleted && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {doneTasks.map((t) => {
                    const Icon = ICON_MAP[t.key] ?? Circle;
                    return (
                      <span
                        key={t.key}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs"
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {t.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {guideModal && (
        <SetupGuideModal
          isOpen={!!guideModal}
          onClose={() => setGuideModal(null)}
          guidePath={guideModal.path}
          title={guideModal.title}
        />
      )}
    </>
  );
}
