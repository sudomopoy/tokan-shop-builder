import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
import { tLandingAuto } from "@/lib/autoMessages";
  faArrowLeft,
  faWandSparkles,
  faLock,
  faChartLine,
  faWandMagicSparkles,
  faHeadset,
  faRocket,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";

const features = [
  { icon: faLock, label: "SSL و امنیت" },
  { icon: faChartLine, label: "سئو و رشد" },
  { icon: faWandMagicSparkles, label: "اتوماسیون با AI" },
  { icon: faHeadset, label: "پشتیبانی و آموزش" },
];

const roadmapSteps = [
  { step: "۱", title: "طراحی سایت/فروشگاه", desc: "UI/UX، پیاده‌سازی و راه‌اندازی" },
  { step: "۲", title: "سئو و محتوا", desc: "بهینه‌سازی ساختار + تولید محتوا" },
  { step: "۳", title: "رشد با هوش مصنوعی", desc: "تحلیل، پیشنهاد، اتوماسیون" },
  { step: "۴", title: "اندازه‌گیری و بهبود", desc: "KPI، CRO و بهینه‌سازی مداوم" },
];

export function Hero() {
  return (
    <section className="hero-surface relative overflow-hidden" id="top">
      <div className="grid-dots absolute inset-0 opacity-50" />
      <div className="glow-ring" />

      <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm text-slate-800 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_12px_rgba(22,152,255,0.5)]" />
              تمرکز ما: رشد پایدار کسب‌وکارها با طراحی، سئو و هوش مصنوعی
            </div>

            <h1 className="mt-5 text-3xl md:text-5xl font-black leading-[1.3] text-slate-900">
              توکان؛ شریک{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-500 via-brand-600 to-brand-700">
                توسعه کسب‌وکار
              </span>{" "}
              شما در دنیای دیجیتال
            </h1>

            <p className="mt-5 text-base md:text-lg text-slate-700 leading-8 max-w-xl">
              از طراحی سایت و فروشگاه گرفته تا سئو، تولید محتوا و بهینه‌سازی نرخ تبدیل—همه‌چیز را با یک تیم منسجم و
              داده‌محور جلو می‌بریم. در کنار آن، از هوش مصنوعی برای تصمیم‌های سریع‌تر و رشد هوشمندانه‌تر استفاده می‌کنیم.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/setup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl btn-grad text-sm md:text-base font-extrabold text-white shadow-soft"
              >
                راه‌اندازی فروشگاه رایگان
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl glass hover:bg-slate-50 transition text-sm md:text-base font-bold text-slate-700 border border-slate-200"
              >
                مشاهده تعرفه‌ها
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
              <Link
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl glass hover:bg-slate-50 transition text-sm md:text-base font-bold text-slate-700 border border-slate-200"
              >
                ثبت درخواست / مشاوره
                <FontAwesomeIcon icon={faWandSparkles} />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 text-sm text-slate-600">
              {features.map((f) => (
                <span
                  key={f.label}
                  className="px-3 py-2 rounded-xl glass border border-slate-200"
                >
                  <FontAwesomeIcon icon={f.icon} className="ml-2 text-brand-500" />
                  {f.label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-6 rounded-[2.2rem] blur-2xl opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(22,152,255,0.1), transparent 55%), radial-gradient(circle at 75% 65%, rgba(70,184,255,0.06), transparent 55%)",
              }}
            />
            <div className="relative glass rounded-[2.2rem] p-6 md:p-8 shadow-glass border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl btn-grad flex items-center justify-center shadow-soft">
                    <FontAwesomeIcon icon={faRocket} className="text-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900">{tLandingAuto("ld.472b105ad7a8")}</div>
                    <div className="text-sm text-slate-600">{tLandingAuto("ld.658af6eabe6b")}</div>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full glass text-slate-600 border border-slate-200">
                  به‌روزرسانی ۱۴۰۴-۱۴۰۵
                </span>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {roadmapSteps.map((r) => (
                  <div
                    key={r.step}
                    className="glass rounded-2xl p-4 border border-slate-200"
                  >
                    <div className="text-sm text-slate-500 mb-2">مرحله {r.step}</div>
                    <div className="font-bold text-slate-900">{r.title}</div>
                    <div className="text-sm text-slate-600 mt-1">{r.desc}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex -space-x-2">
                  <span className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 inline-flex" />
                  <span className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 inline-flex" />
                  <span className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 inline-flex" />
                </div>
                <div className="text-sm text-slate-700">
                  مناسب کسب‌وکارهای فروش فیزیکی، دیجیتال و خدماتی
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-3 glass rounded-2xl px-4 py-3 animate-floaty hidden md:flex border border-slate-200">
              <FontAwesomeIcon icon={faBolt} className="text-brand-500 ml-2" />
              <span className="text-sm text-slate-700">{tLandingAuto("ld.35dad3df2dd6")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
