import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBrain,
  faChartSimple,
  faPenNib,
  faUserCheck,
  faGear,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

const aiFeatures = [
  { icon: faChartSimple, title: "تحلیل و گزارش", desc: "دید بهتر روی KPIها و رفتار کاربران" },
  { icon: faPenNib, title: "کمک‌یار محتوا", desc: "ایده، ساختار و تولید محتوا سریع‌تر" },
  { icon: faUserCheck, title: "بهبود نرخ تبدیل", desc: "بهینه‌سازی صفحه‌ها بر اساس داده" },
  { icon: faGear, title: "اتوماسیون کارها", desc: "کارهای تکراری کمتر، تمرکز بیشتر روی رشد" },
];

const metrics = [
  { label: "چک‌لیست سئوی فنی", period: "هفتگی", percent: 78 },
  { label: "بهبود تجربه خرید", period: "ماهانه", percent: 64 },
  { label: "گزارش رشد و لید", period: "فصلی", percent: 82 },
];

export function AIGrowth() {
  return (
    <section id="ai" className="py-16 md:py-20 hero-surface relative overflow-hidden">
      <div className="grid-dots absolute inset-0 opacity-40" />
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm text-slate-800 border border-slate-200">
              <FontAwesomeIcon icon={faBrain} className="text-brand-500" />
              رشد با بهره‌گیری از AI
            </div>
            <h2 className="mt-5 text-2xl md:text-4xl font-black leading-[1.35] text-slate-900">
              هوش مصنوعی در توکان یعنی{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-500 via-brand-600 to-brand-700">
                تصمیم سریع‌تر + اجرای دقیق‌تر
              </span>
            </h2>
            <p className="mt-4 text-slate-700 leading-8">
              ما از AI به عنوان «ابزار سرعت و کیفیت» استفاده می‌کنیم؛ نه شعار. نتیجه‌اش این است که کمپین‌ها و محتوا
              سریع‌تر آماده می‌شوند، داده‌ها بهتر تحلیل می‌شوند و مسیر رشد روشن‌تر می‌شود.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {aiFeatures.map((f) => (
                <div
                  key={f.title}
                  className="glass rounded-2xl p-4 border border-slate-200"
                >
                  <div className="font-extrabold text-slate-900">
                    <FontAwesomeIcon icon={f.icon} className="ml-2 text-brand-500" />
                    {f.title}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">{f.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl btn-grad font-extrabold text-white shadow-soft"
              >
                شروع رشد با توکان
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
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
            <div className="relative glass rounded-[2.2rem] p-6 md:p-8 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-slate-900">
                  شاخص‌های عملکرد و گزارش‌دهی
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full glass text-slate-600 border border-slate-200">
                  CRO • SEO • AI
                </span>
              </div>
              <div className="mt-6 grid gap-4">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className="glass rounded-2xl p-4 border border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-800 font-bold">{m.label}</span>
                      <span className="text-xs text-slate-500">{m.period}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full btn-grad"
                        style={{ width: `${m.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-sm text-slate-600 leading-7">
                گزارش‌ها و شاخص‌ها بر اساس صنعت، اهداف و KPIهای تعریف‌شده برای هر پروژه شخصی‌سازی می‌شوند.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
