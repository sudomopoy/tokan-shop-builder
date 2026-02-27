const steps = [
  {
    step: "۱",
    title: "نیازسنجی و استراتژی",
    desc: "اهداف، پرسونای مخاطب و KPIهای رشد",
  },
  {
    step: "۲",
    title: "طراحی و پیاده‌سازی",
    desc: "UI/UX، توسعه، تست و راه‌اندازی",
  },
  {
    step: "۳",
    title: "سئو و محتوا",
    desc: "بهینه‌سازی فنی، محتوا و ساختار صفحات",
  },
  {
    step: "۴",
    title: "رشد و بهینه‌سازی",
    desc: "تحلیل داده، AI، CRO و بهبود مداوم",
  },
];

export function Process() {
  return (
    <section id="process" className="py-16 md:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-black text-slate-900">
            فرآیند همکاری با توکان
          </h2>
          <p className="mt-3 text-slate-600 leading-8">
            شفاف، مرحله‌به‌مرحله و قابل پیگیری—برای اینکه پروژه هم «خوب» اجرا شود و هم «به نتیجه» برسد.
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-4 gap-6">
          {steps.map((s) => (
            <div
              key={s.step}
              className="glass rounded-3xl p-6 border border-slate-200"
            >
              <div className="text-sm text-slate-500">مرحله {s.step}</div>
              <div className="mt-2 font-extrabold text-slate-900">{s.title}</div>
              <div className="mt-2 text-slate-600 text-sm leading-7">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
