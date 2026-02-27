import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPalette,
  faBagShopping,
  faMagnifyingGlassChart,
  faWandMagicSparkles,
  faPlugCircleBolt,
  faHeadset,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

const services = [
  {
    icon: faPalette,
    title: "طراحی UI/UX و طراحی سایت",
    desc: "طراحی حرفه‌ای، تجربه کاربری روان، سازگار با موبایل و آماده برای رشد و سئو.",
  },
  {
    icon: faBagShopping,
    title: "طراحی فروشگاه آنلاین",
    desc: "مناسب فروش محصولات فیزیکی و دیجیتال و حتی خدمات (رزرو/پیش‌خرید/ثبت‌نام).",
  },
  {
    icon: faMagnifyingGlassChart,
    title: "سئو و بهینه‌سازی",
    desc: "ساختار فنی سئو، محتوا، لینک‌سازی داخلی و گزارش‌دهی—با هدف رشد پایدار.",
  },
  {
    icon: faWandMagicSparkles,
    title: "رشد با هوش مصنوعی",
    desc: "پیشنهادهای هوشمند، تحلیل رفتار کاربران، تولید محتوای کمک‌یار و اتوماسیون کارها.",
  },
  {
    icon: faPlugCircleBolt,
    title: "اتصال‌ها و زیرساخت",
    desc: "SSL، دامنه، پنل پیامکی، درگاه پرداخت، نماد اعتماد، اتصال به ترب و ابزارهای رشد.",
  },
  {
    icon: faHeadset,
    title: "پشتیبانی و آموزش",
    desc: "ویدیو آموزش پنل، پشتیبانی و همراهی برای اینکه تیم شما سریع‌تر به نتیجه برسد.",
  },
];

export function Services() {
  return (
    <section id="services" className="py-16 md:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900">
              خدمات توکان برای توسعه کسب‌وکار
            </h2>
            <p className="mt-3 text-slate-600 leading-8 max-w-2xl">
              ما صرفاً «سایت» تحویل نمی‌دهیم؛ یک مسیر رشد می‌سازیم. از استراتژی تا اجرا و بهینه‌سازی.
            </p>
          </div>
          <Link
            href="#contact"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl glass hover:bg-slate-50 transition font-bold text-slate-700 border border-slate-200"
          >
            دریافت پیشنهاد اختصاصی
            <FontAwesomeIcon icon={faArrowLeft} />
          </Link>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className="glass rounded-3xl p-6 hover:bg-slate-50 transition border border-slate-200"
            >
              <div className="h-12 w-12 rounded-2xl btn-grad flex items-center justify-center shadow-soft">
                <FontAwesomeIcon icon={s.icon} className="text-white" />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-slate-600 leading-7">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
