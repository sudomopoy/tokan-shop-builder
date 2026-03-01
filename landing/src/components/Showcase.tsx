import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
import { tLandingAuto } from "@/lib/autoMessages";
  faArrowUpRightFromSquare,
  faArrowLeft,
  faStore,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";

export function Showcase() {
  return (
    <section id="showcase" className="py-16 md:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900">
              نمونه‌کار
            </h2>
            <p className="mt-3 text-slate-600 leading-8 max-w-2xl">
              پروژه‌های اجراشده روی بستر توکان؛ از فروشگاه‌های آنلاین تا وب‌سایت‌های خدماتی با تمرکز بر سئو، UX و نرخ تبدیل.
            </p>
          </div>
          <Link
            href="#contact"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl glass hover:bg-slate-50 transition font-bold text-slate-700 border border-slate-200"
          >
            درخواست مشاوره رایگان
            <FontAwesomeIcon icon={faArrowLeft} />
          </Link>
        </div>

        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a
            href="https://ropomoda.tokan.app"
            target="_blank"
            rel="noreferrer"
            className="group glass rounded-3xl overflow-hidden hover:bg-slate-50 transition border border-slate-200"
          >
            <div className="h-48 overflow-hidden bg-slate-100 relative">
              <Image
                src="https://s3-public.ropomoda.com/files/2025/7/4/125e0e27-1107-4a6f-9493-843b1c2beca2..jpg"
                alt={tLandingAuto("ld.9f8505043369")}
                fill
                className="object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-slate-900">
                  فروشگاه روپومدا
                </h3>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-slate-500" />
              </div>
              <p className="mt-2 text-slate-600">{tLandingAuto("ld.9ff45b9e8362")}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-brand-600 font-bold">
                مشاهده
                <FontAwesomeIcon icon={faArrowLeft} />
              </div>
            </div>
          </a>

          <Link
            href="#contact"
            className="group glass rounded-3xl overflow-hidden hover:bg-slate-50 transition border border-slate-200"
          >
            <div className="h-48 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="text-center p-6">
                <div className="h-16 w-16 rounded-2xl btn-grad flex items-center justify-center shadow-soft mx-auto">
                  <FontAwesomeIcon icon={faStore} className="text-white text-2xl" />
                </div>
                <h3 className="mt-4 font-extrabold text-lg text-slate-900">
                  فروشگاه یا سایت شما
                </h3>
                <p className="mt-2 text-slate-600 text-sm">
                  پروژه بعدی ما می‌تواند شما باشید
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-brand-600 font-bold">
                  درخواست مشاوره
                  <FontAwesomeIcon icon={faArrowLeft} />
                </div>
              </div>
            </div>
          </Link>

          <div className="glass rounded-3xl p-6 border border-slate-200">
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 rounded-2xl btn-grad flex items-center justify-center shadow-soft mx-auto mb-4">
                  <FontAwesomeIcon icon={faBolt} className="text-white" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  سرعت و کیفیت
                </h3>
                <p className="mt-2 text-slate-600 leading-7 text-sm">
                  تمرکز ما روی سئو، تجربه کاربری و نرخ تبدیل است—نه صرفاً طراحی ظاهری.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
