"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLink,
  faCopy,
  faCheck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { getPanelInfo, getAffiliateInvites, getAffiliateEarnings } from "@/lib/api";

function formatPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return new Intl.NumberFormat("fa-IR").format(n);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function PanelAffiliatePage() {
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getPanelInfo>> | null>(null);
  const [invites, setInvites] = useState<Awaited<ReturnType<typeof getAffiliateInvites>>>([]);
  const [earnings, setEarnings] = useState<Awaited<ReturnType<typeof getAffiliateEarnings>> | null>(null);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPanelInfo(),
      getAffiliateInvites(),
      getAffiliateEarnings(),
    ])
      .then(([panelData, invitesData, earningsData]) => {
        setInfo(panelData);
        setInvites(invitesData);
        setEarnings(earningsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string, type: "link" | "code") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">دعوت و کسب درآمد</h1>

      {/* لینک و کد دعوت */}
      <section className="glass rounded-2xl p-6 border border-slate-200">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faLink} className="text-brand-600" />
          لینک و کد دعوت
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">لینک دعوت</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={info?.affiliate_link?.referral_link ?? ""}
                className="flex-1 text-left ltr px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              />
              <button
                onClick={() => info?.affiliate_link && copyToClipboard(info.affiliate_link.referral_link, "link")}
                className="px-4 py-2 rounded-xl btn-grad text-white text-sm font-medium flex items-center gap-2"
              >
                {copied === "link" ? <FontAwesomeIcon icon={faCheck} /> : <FontAwesomeIcon icon={faCopy} />}
                {copied === "link" ? "کپی شد" : "کپی"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">کد دعوت</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={info?.affiliate_link?.referral_code ?? ""}
                className="w-48 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm"
              />
              <button
                onClick={() => info?.affiliate_link && copyToClipboard(info.affiliate_link.referral_code, "code")}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                {copied === "code" ? <FontAwesomeIcon icon={faCheck} /> : <FontAwesomeIcon icon={faCopy} />}
                {copied === "code" ? "کپی شد" : "کپی"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* خلاصه درآمد */}
      {earnings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass p-5 rounded-2xl border border-emerald-100 bg-emerald-50/50">
            <p className="text-sm text-slate-600">واریز شده</p>
            <p className="text-2xl font-bold text-emerald-700">{formatPrice(earnings.total_completed)} تومان</p>
          </div>
          <div className="glass p-5 rounded-2xl border border-amber-100 bg-amber-50/50">
            <p className="text-sm text-slate-600">در انتظار واریز</p>
            <p className="text-2xl font-bold text-amber-700">{formatPrice(earnings.total_pending)} تومان</p>
          </div>
        </div>
      )}

      {/* دعوت‌شده‌ها */}
      <section className="glass rounded-2xl overflow-hidden border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <FontAwesomeIcon icon={faUsers} className="text-slate-500" />
          <h2 className="font-bold text-slate-900">دعوت‌شده‌ها</h2>
        </div>
        <div className="overflow-x-auto">
          {invites.length === 0 ? (
            <div className="px-4 py-10 text-center text-slate-500 text-sm">هنوز کسی را دعوت نکرده‌اید.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">کاربر</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">تاریخ</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">کمیسیون</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">کل خرید</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">درآمد</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{inv.invitee_mobile}</p>
                      {inv.invitee_username && inv.invitee_username !== inv.invitee_mobile && (
                        <p className="text-xs text-slate-500">{inv.invitee_username}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(inv.created_at)}</td>
                    <td className="px-4 py-3">{inv.commission_percent_display}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(inv.total_purchases)}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{formatPrice(inv.total_earnings)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          inv.is_valid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {inv.is_valid ? "فعال" : "منقضی"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
