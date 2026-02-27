"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  History,
} from "lucide-react";
import { accountApi, walletApi, type User } from "@/lib/api";

function formatPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return new Intl.NumberFormat("fa-IR").format(n);
}

function digitsToAscii(str: string): string {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return str.replace(/[۰-۹٠-٩]/g, (c) => {
    const i = persian.indexOf(c);
    if (i >= 0) return String(i);
    const j = arabic.indexOf(c);
    return j >= 0 ? String(j) : c;
  });
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

const TX_TYPE_LABELS: Record<string, string> = {
  deposit: "شارژ",
  withdrawal: "برداشت",
  purchase: "خرید",
  inner_transfer: "انتقال",
  gift: "هدیه",
};

const TX_STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  completed: "تکمیل شده",
  failed: "ناموفق",
  canceled: "لغو شده",
};

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Awaited<ReturnType<typeof walletApi.getTransactions>>>([]);
  const [gateways, setGateways] = useState<Awaited<ReturnType<typeof walletApi.getChargeGateways>>>([]);
  const [loading, setLoading] = useState(true);
  const [chargeAmount, setChargeAmount] = useState("");
  const [selectedGateway, setSelectedGateway] = useState("");
  const [charging, setCharging] = useState(false);
  const [chargeError, setChargeError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, txData, gwData] = await Promise.all([
          accountApi.getInfo(),
          walletApi.getTransactions(),
          walletApi.getChargeGateways(),
        ]);
        setUser(userData);
        setTransactions(txData);
        setGateways(gwData);
        if (gwData.length > 0 && !selectedGateway) {
          setSelectedGateway(gwData[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCharge = async () => {
    const amount = parseInt(digitsToAscii(chargeAmount).replace(/\D/g, ""), 10);
    if (!amount || amount < 1000) {
      setChargeError("حداقل مبلغ شارژ ۱,۰۰۰ تومان است.");
      return;
    }
    if (!selectedGateway) {
      setChargeError("لطفاً درگاه پرداخت را انتخاب کنید.");
      return;
    }
    setChargeError("");
    setCharging(true);
    try {
      const res = await walletApi.chargeWallet(amount, selectedGateway);
      if (res?.payment_link) {
        window.location.href = res.payment_link;
      } else {
        setChargeError("دریافت لینک پرداخت ممکن نشد.");
      }
    } catch (err) {
      setChargeError("خطا در ایجاد درخواست شارژ. لطفاً دوباره تلاش کنید.");
    } finally {
      setCharging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-3 text-sm text-gray-500">در حال بارگذاری...</p>
      </div>
    );
  }

  const wallet = user?.wallet;
  const availableBalance = wallet
    ? (typeof wallet.available_balance === "string"
        ? parseFloat(wallet.available_balance) || 0
        : wallet.available_balance)
    : 0;
  const withdrawableBalance = wallet
    ? (typeof wallet.withdrawable_balance === "string"
        ? parseFloat(wallet.withdrawable_balance) || 0
        : wallet.withdrawable_balance)
    : 0;
  const giftBalance = wallet
    ? (typeof wallet.gift_balance === "string"
        ? parseFloat(wallet.gift_balance) || 0
        : wallet.gift_balance)
    : 0;
  const blockedBalance = wallet
    ? (typeof wallet.blocked_balance === "string"
        ? parseFloat(wallet.blocked_balance) || 0
        : wallet.blocked_balance)
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">کیف پول توکان</h1>
        <p className="text-sm text-gray-500 mt-1">
          کیف پول سراسری — در تمام فروشگاه‌های توکان یکسان است و به فروشگاه خاصی تعلق ندارد.
        </p>
      </div>

      {/* کارت جمع‌وجور: موجودی + شارژ */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          {/* موجودی */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">موجودی قابل استفاده</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {formatPrice(availableBalance)} <span className="text-sm font-normal text-gray-500">تومان</span>
              </p>
              <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                <span>قابل برداشت: {formatPrice(withdrawableBalance)}</span>
                {giftBalance > 0 && <span>هدیه: {formatPrice(giftBalance)}</span>}
              </div>
            </div>
          </div>

          {/* فرم شارژ */}
          <div id="charge" className="flex flex-col sm:flex-row gap-3 sm:items-end shrink-0">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">مبلغ شارژ</label>
              <input
                type="text"
                value={chargeAmount}
                onChange={(e) => {
                  const ascii = digitsToAscii(e.target.value).replace(/\D/g, "");
                  setChargeAmount(ascii ? parseInt(ascii, 10).toLocaleString("fa-IR") : "");
                }}
                placeholder="۵۰,۰۰۰"
                className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            {gateways.length > 1 && (
              <select
                value={selectedGateway}
                onChange={(e) => setSelectedGateway(e.target.value)}
                className="w-36 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {gateways.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleCharge}
              disabled={charging}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-70 shrink-0"
            >
              {charging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              شارژ
            </button>
          </div>
        </div>
        {chargeError && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{chargeError}</p>
        )}
      </div>

      {/* تراکنش‌ها */}
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <h2 className="font-bold text-gray-900">تراکنش‌ها</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">نوع</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">مبلغ</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">وضعیت</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400 text-sm">
                    تراکنشی ثبت نشده است
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isCredit = tx.payment_method === "deposit" || tx.payment_method === "gift";
                  const amount = typeof tx.withdrawable_amount === "string"
                    ? parseFloat(tx.withdrawable_amount) || 0
                    : tx.withdrawable_amount;
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          {isCredit ? (
                            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          )}
                          {TX_TYPE_LABELS[tx.payment_method] ?? tx.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        <span className={isCredit ? "text-emerald-600" : "text-gray-800"}>
                          {isCredit ? "+" : "-"} {formatPrice(amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            tx.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                            tx.status === "pending" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {TX_STATUS_LABELS[tx.status] ?? tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(tx.timestamp)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
