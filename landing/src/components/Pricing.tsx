import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFlagCheckered,
  faBoxesStacked,
  faCertificate,
  faSwatchbook,
  faCircleCheck,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

const normalPlan = [
  { period: "۳ ماهه", price: "۱,۸۹۰,۰۰۰ تومان" },
  { period: "۶ ماهه", price: "۲,۹۹۰,۰۰۰ تومان" },
  { period: "یک‌ساله", price: "۳,۹۹۰,۰۰۰ تومان" },
];

const goldenPlan = [
  { period: "۳ ماهه", price: "۲,۹۹۰,۰۰۰ تومان" },
  { period: "۶ ماهه", price: "۴,۹۹۰,۰۰۰ تومان" },
  { period: "یک‌ساله", price: "۶,۹۹۰,۰۰۰ تومان" },
];

const addons = [
  {
    icon: faBoxesStacked,
    title: "ورود محصولات",
    desc: "اینستاگرام/تلگرام/دیجی‌کالا/باسلام/ووکامرس/...",
    price: "۹۹۰,۰۰۰ تومان (هر ۱۰۰ محصول)",
  },
  {
    icon: faCertificate,
    title: "نماد + درگاه + ترب",
    desc: "اخذ نماد اعتماد، درگاه پرداخت، اتصال ترب و پنل پیامکی",
    price: "۱,۹۹۰,۰۰۰ تومان",
  },
  {
    icon: faSwatchbook,
    title: "طراحی اختصاصی",
    desc: "طراحی کاملاً اختصاصی مطابق برند و نیازهای کسب‌وکار",
    price: "از ۲۴,۰۰۰,۰۰۰ تومان",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-20 hero-surface relative overflow-hidden">
      <div className="grid-dots absolute inset-0 opacity-40" />
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900">
            تعرفه‌ها و پکیج‌ها
          </h2>
          <p className="mt-3 text-slate-700 leading-8">
            پلن رایگان نداریم؛ از همان ابتدا ساختار «حرفه‌ای و عملیاتی» را تحویل می‌گیرید.
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <div className="glass rounded-[2.2rem] p-6 md:p-8 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">پلن اشتراک</div>
                <div className="mt-1 text-2xl font-black text-slate-900">عادی</div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full glass text-slate-600 border border-slate-200">
                برای کسب‌وکارهای در حال رشد
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              {normalPlan.map((p) => (
                <div
                  key={p.period}
                  className="flex items-center justify-between glass rounded-2xl p-4 border border-slate-200"
                >
                  <span className="font-bold text-slate-900">{p.period}</span>
                  <span className="font-extrabold text-brand-600">{p.price}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 text-sm text-slate-600 leading-7">
              مناسب برای شروع حرفه‌ای و مدیریت فروشگاه/سایت با هزینه منطقی.
            </div>
          </div>

          <div className="glass rounded-[2.2rem] p-6 md:p-8 border-2 border-brand-400 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-600">پلن اشتراک</div>
                <div className="mt-1 text-2xl font-black text-slate-900">طلایی</div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full btn-grad text-white font-bold">
                پیشنهادی
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              {goldenPlan.map((p) => (
                <div
                  key={p.period}
                  className="flex items-center justify-between glass rounded-2xl p-4 border border-slate-200"
                >
                  <span className="font-bold text-slate-900">{p.period}</span>
                  <span className="font-extrabold text-brand-600">{p.price}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 text-sm text-slate-600 leading-7">
              امکانات بیشتر + پشتیبانی ویژه—برای تیم‌هایی که می‌خواهند سریع‌تر رشد کنند.
            </div>
          </div>
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <div className="glass rounded-3xl p-6 lg:col-span-2 border border-slate-200">
            <h3 className="text-xl font-black text-slate-900">خدمات تکمیلی</h3>
            <p className="mt-2 text-slate-600 leading-7">
              این موارد در صورت نیاز به صورت جداگانه به پروژه اضافه می‌شوند.
            </p>
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              {addons.map((a) => (
                <div
                  key={a.title}
                  className={`glass rounded-2xl p-4 border border-slate-200 ${a.title === "طراحی اختصاصی" ? "sm:col-span-2" : ""}`}
                >
                  <div className="font-bold text-slate-900">
                    <FontAwesomeIcon icon={a.icon} className="ml-2 text-brand-500" />
                    {a.title}
                  </div>
                  <div className="text-sm text-slate-600 mt-1">{a.desc}</div>
                  <div className="mt-2 font-extrabold text-brand-600">{a.price}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 border border-slate-200">
            <h3 className="text-xl font-black text-slate-900">شرایط پرداخت</h3>
            <ul className="mt-4 space-y-3 text-slate-700 leading-7 text-sm">
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="text-brand-500 mt-0.5 flex-shrink-0" />
                <span>پرداخت نقدی: <b>۱۰٪ تخفیف</b></span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="text-brand-500 mt-0.5 flex-shrink-0" />
                <span>پرداخت اقساطی: <b>۴ قسط</b> (قسط اول نقدی) با ارسال چک صیادی بنفش</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCircleCheck} className="text-brand-500 mt-0.5 flex-shrink-0" />
                <span>می‌توانید بخشی از مبلغ را از موجودی کیف پول (در صورت وجود) پرداخت کنید.</span>
              </li>
            </ul>
            <Link
              href="#contact"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 px-6 py-3 rounded-2xl btn-grad font-extrabold text-white shadow-soft"
            >
              دریافت مشاوره پرداخت
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
