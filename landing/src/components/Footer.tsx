import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { faTelegram } from "@fortawesome/free-brands-svg-icons";
import { tLandingAuto } from "@/lib/autoMessages";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl overflow-hidden glass flex items-center justify-center border border-slate-200">
              <Image
                src="/logo.jpg"
                alt={tLandingAuto("ld.a96088fccdfb")}
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
              />
            </div>
            <div>
              <div className="font-extrabold text-slate-900">{tLandingAuto("ld.989871906ce6")}</div>
              <div className="text-sm text-slate-500">{tLandingAuto("ld.7058385deda5")}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-slate-100 transition text-sm font-bold text-slate-700 border border-slate-200"
            >
              بلاگ
            </Link>
            <a
              href="https://t.me/tokan_app"
              target="_blank"
              rel="noreferrer"
              className="h-10 w-10 rounded-xl glass hover:bg-slate-100 transition flex items-center justify-center text-slate-700 border border-slate-200"
              aria-label={tLandingAuto("ld.cf1a31f63e99")}
            >
              <FontAwesomeIcon icon={faTelegram} />
            </a>
            <Link
              href="#top"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-slate-100 transition text-sm font-bold text-slate-700 border border-slate-200"
            >
              برگشت به بالا
              <FontAwesomeIcon icon={faArrowUp} />
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          © {year} توکان — تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
