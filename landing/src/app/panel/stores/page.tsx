"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faPlus, faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { getPanelInfo } from "@/lib/api";
import { tLandingAuto } from "@/lib/autoMessages";

export default function PanelStoresPage() {
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getPanelInfo>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPanelInfo()
      .then(setInfo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const stores = info?.stores ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{tLandingAuto("ld.1e080ec0bd98")}</h1>
        <Link
          href="/setup"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-grad text-white font-medium"
        >
          <FontAwesomeIcon icon={faPlus} />
          فروشگاه جدید
        </Link>
      </div>

      {stores.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-slate-200">
          <FontAwesomeIcon icon={faStore} className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-600 mb-4">{tLandingAuto("ld.11ac49c0ec12")}</p>
          <Link href="/setup" className="text-brand-600 hover:underline font-medium">
            ساخت فروشگاه
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((s) => (
            <div
              key={s.id}
              className="glass rounded-2xl p-5 border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faStore} className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{s.title}</p>
                  <p className="text-sm text-slate-500">{s.internal_domain}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.is_owner ? "مالک" : "ادمین"}</p>
                </div>
              </div>
              <a
                href={s.dashboard_url || `https://${s.internal_domain}/dashboard`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-brand-600 hover:bg-brand-50 font-medium"
              >
                <FontAwesomeIcon icon={faExternalLinkAlt} />
                ورود به داشبورد
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
