"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  Copy,
  Users,
  DollarSign,
  History,
  Loader2,
  Check,
} from "lucide-react";
import { affiliateApi, type AffiliateInvite, type AffiliateEarning } from "@/lib/api";

function formatPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return new Intl.NumberFormat("fa-IR").format(n);
}

function formatDate(dateStr: string | null): string {
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

export default function AffiliatePage() {
  const [link, setLink] = useState<{ referral_code: string; referral_link: string } | null>(null);
  const [invites, setInvites] = useState<AffiliateInvite[]>([]);
  const [earnings, setEarnings] = useState<{
    earnings: AffiliateEarning[];
    total_completed: number;
    total_pending: number;
  } | null>(null);
  const [config, setConfig] = useState<{ default_commission_percent: number; default_duration_months: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [linkRes, invitesRes, earningsRes, configRes] = await Promise.all([
          affiliateApi.getMyLink(),
          affiliateApi.getInvites(),
          affiliateApi.getEarnings(),
          affiliateApi.getConfig(),
        ]);
        setLink(linkRes);
        setInvites(invitesRes);
        setEarnings(earningsRes);
        setConfig(configRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const copyToClipboard = (text: string, type: "link" | "code") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-3 text-sm text-gray-500">در حال بارگذاری...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">دعوت و پاداش</h1>
      <p className="text-sm text-gray-500">
        با لینک دعوت خود، کاربران جدید را به توکان بیاورید. به ازای هر خرید دعوت‌شده‌ها،
        {config ? `${config.default_commission_percent}%` : "۱۰٪"} کمیسیون تا{" "}
        {config ? config.default_duration_months : "۱۲"} ماه به کیف پول شما واریز می‌شود.
      </p>

      {/* لینک دعوت */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-blue-600" />
          لینک و کد دعوت
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">لینک دعوت</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={link?.referral_link ?? ""}
                className="flex-1 text-left ltr px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
              />
              <button
                onClick={() => link && copyToClipboard(link.referral_link, "link")}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "link" ? "کپی شد" : "کپی"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">کد دعوت</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={link?.referral_code ?? ""}
                className="w-48 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 font-mono text-sm"
              />
              <button
                onClick={() => link && copyToClipboard(link.referral_code, "code")}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                {copied === "code" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "code" ? "کپی شد" : "کپی"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* خلاصه درآمد */}
      {earnings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-4 bg-emerald-50 border-emerald-100">
            <p className="text-sm text-gray-600">واریز شده</p>
            <p className="text-2xl font-bold text-emerald-700">
              {formatPrice(earnings.total_completed)} تومان
            </p>
          </div>
          <div className="card p-4 bg-amber-50 border-amber-100">
            <p className="text-sm text-gray-600">در انتظار واریز</p>
            <p className="text-2xl font-bold text-amber-700">
              {formatPrice(earnings.total_pending)} تومان
            </p>
          </div>
        </div>
      )}

      {/* دعوت‌شده‌ها */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <h2 className="font-bold text-gray-900">دعوت‌شده‌ها</h2>
        </div>
        <div className="overflow-x-auto">
          {invites.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-500 text-sm">
              هنوز کسی را دعوت نکرده‌اید.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">کاربر</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">تاریخ</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">کمیسیون</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">کل خرید</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">درآمد</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{inv.invitee_mobile}</p>
                      {inv.invitee_username && inv.invitee_username !== inv.invitee_mobile && (
                        <p className="text-xs text-gray-500">{inv.invitee_username}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(inv.created_at)}</td>
                    <td className="px-4 py-3">{inv.commission_percent_display}</td>
                    <td className="px-4 py-3 font-medium">{formatPrice(inv.total_purchases)}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">
                      {formatPrice(inv.total_earnings)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          inv.is_valid ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
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
      </div>

      {/* تاریخچه کمیسیون */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <h2 className="font-bold text-gray-900">تاریخچه کمیسیون</h2>
        </div>
        <div className="overflow-x-auto">
          {!earnings || earnings.earnings.length === 0 ? (
            <div className="px-4 py-10 text-center text-gray-500 text-sm">
              تراکنشی ثبت نشده است.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">تاریخ</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">موضوع</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">مبلغ خرید</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">کمیسیون</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {earnings.earnings.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">{formatDate(e.created_at)}</td>
                    <td className="px-4 py-3">
                      {e.description || (e.order_code ? `سفارش #${e.order_code}` : "-")}
                    </td>
                    <td className="px-4 py-3">{formatPrice(e.purchase_amount)}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">
                      +{formatPrice(e.commission_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          e.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : e.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {e.status === "completed" ? "واریز شده" : e.status === "pending" ? "در انتظار" : e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
