const faqs = [
  {
    q: "پلن رایگان ندارید؟",
    a: "خیر. تمرکز ما ارائه راهکار عملیاتی و حرفه‌ای از روز اول است؛ به همین دلیل پلن‌ها به‌صورت اشتراکی ارائه می‌شوند.",
  },
  {
    q: "پکیج شروع دقیقاً شامل چه چیزهایی است؟",
    a: "راه‌اندازی و پیاده‌سازی + SSL + ویدیو آموزشی پنل + ۱ ماه پشتیبانی رایگان. موارد تکمیلی مثل نماد/درگاه/ترب جداگانه قابل اضافه شدن است.",
  },
  {
    q: "آیا برای سئو هم پکیج دارید؟",
    a: "بله. پکیج‌های سئو و بهینه‌سازی ارائه می‌شود و بر اساس صنعت و هدف شما پیشنهاد می‌دهیم.",
  },
  {
    q: "پرداخت اقساطی چطور انجام می‌شود؟",
    a: "پرداخت اقساطی ۴ قسطه است (قسط اول نقدی) و با ارسال چک صیادی بنفش انجام می‌شود. شرایط نهایی بعد از بررسی پروژه اعلام می‌شود.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-16 md:py-20 hero-surface relative overflow-hidden">
      <div className="grid-dots absolute inset-0 opacity-40" />
      <div className="max-w-7xl mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900">
            سوالات پرتکرار
          </h2>
          <p className="mt-3 text-slate-700 leading-8">
            اگر سوال دیگری دارید، مستقیم پیام بدهید.
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="glass rounded-3xl p-6 border border-slate-200"
            >
              <summary className="cursor-pointer font-extrabold text-slate-900">
                {item.q}
              </summary>
              <p className="mt-3 text-slate-600 leading-7">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
