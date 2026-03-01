"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faPlus,
  faHistory,
  faSpinner,
  faArrowDown,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import {
import { tLandingAuto } from "@/lib/autoMessages";
  getPanelInfo,
  getWalletTransactions,
  getWalletChargeGateways,
  chargeWallet,
  getWithdrawRequests,
  createWithdrawRequest,
} from "@/lib/api";

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

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار",
  approved: "تایید شده",
  rejected: "رد شده",
  deposited: "واریز شده",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  deposited: "bg-emerald-100 text-emerald-700",
};

export default function PanelWalletPage() {
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getPanelInfo>> | null>(null);
  const [transactions, setTransactions] = useState<Array<{ id: string; timestamp?: string; withdrawable_amount?: number }>>([]);
  const [gateways, setGateways] = useState<Array<{ id: string; title: string }>>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<Awaited<ReturnType<typeof getWithdrawRequests>>>([]);
  const [loading, setLoading] = useState(true);

  const [chargeAmount, setChargeAmount] = useState("");
  const [selectedGateway, setSelectedGateway] = useState("");
  const [charging, setCharging] = useState(false);
  const [chargeError, setChargeError] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSheba, setWithdrawSheba] = useState("");
  const [withdrawBank, setWithdrawBank] = useState("");
  const [withdrawHolder, setWithdrawHolder] = useState("");
  const [withdrawDesc, setWithdrawDesc] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [panelData, txData, gwData, wrData] = await Promise.all([
          getPanelInfo(),
          getWalletTransactions().catch(() => []),
          getWalletChargeGateways().catch(() => []),
          getWithdrawRequests().catch(() => []),
        ]);
        setInfo(panelData);
        setTransactions(Array.isArray(txData) ? txData : []);
        setGateways(Array.isArray(gwData) ? gwData : []);
        setWithdrawRequests(Array.isArray(wrData) ? wrData : []);
        if (gwData?.length > 0) setSelectedGateway((gwData as { id: string }[])[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [withdrawSuccess]);

  useEffect(() => {
    if (gateways.length > 0 && !selectedGateway) setSelectedGateway(gateways[0].id);
  }, [gateways, selectedGateway]);

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
      const res = await chargeWallet(amount, selectedGateway);
      if (res.payment_link) window.location.href = res.payment_link;
    } catch {
      setChargeError("خطا در ایجاد درخواست شارژ.");
    } finally {
      setCharging(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(digitsToAscii(withdrawAmount).replace(/\D/g, ""), 10);
    if (!amount || amount < 1000) {
      setWithdrawError("حداقل مبلغ برداشت ۱,۰۰۰ تومان است.");
      return;
    }
    if (!withdrawSheba.trim() || !withdrawBank.trim() || !withdrawHolder.trim()) {
      setWithdrawError("شماره شبا/کارت، نام بانک و صاحب حساب الزامی است.");
      return;
    }
    const wallet = info?.user?.wallet;
    const rawBalance = wallet?.withdrawable_balance ?? wallet?.available_balance;
    const balance = typeof rawBalance === "string" ? parseFloat(rawBalance) || 0 : Number(rawBalance) || 0;
    if (amount > balance) {
      setWithdrawError(`موجودی شما ${formatPrice(balance)} تومان است.`);
      return;
    }
    setWithdrawError("");
    setWithdrawing(true);
    try {
      await createWithdrawRequest({
        amount,
        bank_sheba_or_card: withdrawSheba.trim(),
        bank_name: withdrawBank.trim(),
        account_holder: withdrawHolder.trim(),
        description: withdrawDesc.trim() || undefined,
      });
      setWithdrawSuccess(true);
      setWithdrawAmount("");
      setWithdrawSheba("");
      setWithdrawBank("");
      setWithdrawHolder("");
      setWithdrawDesc("");
      setTimeout(() => setWithdrawSuccess(false), 3000);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string }; status?: number };
      setWithdrawError(err?.data?.error || "خطا در ثبت درخواست برداشت.");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    );
  }

  const balance = info?.user?.wallet?.available_balance ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">{tLandingAuto("ld.8444c94aee74")}</h1>

      {/* موجودی */}
      <div className="glass rounded-2xl p-6 border border-slate-200">
        <p className="text-sm text-slate-500 mb-1">{tLandingAuto("ld.42795967f525")}</p>
        <p className="text-3xl font-bold text-brand-700">{formatPrice(balance)} تومان</p>
      </div>

      {/* شارژ */}
      {gateways.length > 0 && (
        <section className="glass rounded-2xl p-6 border border-slate-200">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} className="text-brand-600" />
            شارژ کیف پول
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{tLandingAuto("ld.973d53486906")}</label>
              <input
                type="text"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                placeholder={tLandingAuto("ld.93fbaf189179")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">{tLandingAuto("ld.2f24afaef65c")}</label>
              <select
                value={selectedGateway}
                onChange={(e) => setSelectedGateway(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                {gateways.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
          </div>
          {chargeError && <p className="text-sm text-red-600 mt-2">{chargeError}</p>}
          <button
            onClick={handleCharge}
            disabled={charging}
            className="mt-4 px-5 py-2.5 rounded-xl btn-grad text-white font-medium flex items-center gap-2 disabled:opacity-70"
          >
            {charging ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faPlus} />}
            شارژ کیف پول
          </button>
        </section>
      )}

      {/* برداشت */}
      <section className="glass rounded-2xl p-6 border border-slate-200">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faArrowDown} className="text-brand-600" />
          درخواست برداشت
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{tLandingAuto("ld.578fd5f60650")}</label>
            <input
              type="text"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={tLandingAuto("ld.c3fdf928f53b")}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{tLandingAuto("ld.d5724ce5b495")}</label>
            <input
              type="text"
              value={withdrawSheba}
              onChange={(e) => setWithdrawSheba(e.target.value)}
              placeholder="IR..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{tLandingAuto("ld.294d0f7d2f23")}</label>
            <input
              type="text"
              value={withdrawBank}
              onChange={(e) => setWithdrawBank(e.target.value)}
              placeholder={tLandingAuto("ld.1e80c808c45a")}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{tLandingAuto("ld.88270442599b")}</label>
            <input
              type="text"
              value={withdrawHolder}
              onChange={(e) => setWithdrawHolder(e.target.value)}
              placeholder={tLandingAuto("ld.252f8954331c")}
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">{tLandingAuto("ld.d0f1ac7134b4")}</label>
            <input
              type="text"
              value={withdrawDesc}
              onChange={(e) => setWithdrawDesc(e.target.value)}
              placeholder="..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200"
            />
          </div>
        </div>
        {withdrawError && <p className="text-sm text-red-600 mt-2">{withdrawError}</p>}
        {withdrawSuccess && (
          <p className="text-sm text-emerald-600 mt-2 flex items-center gap-2">
            <FontAwesomeIcon icon={faCheck} /> درخواست شما ثبت شد و در انتظار بررسی است.
          </p>
        )}
        <button
          onClick={handleWithdraw}
          disabled={withdrawing}
          className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2 disabled:opacity-70"
        >
          {withdrawing ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faArrowDown} />}
          ثبت درخواست برداشت
        </button>
      </section>

      {/* لیست درخواست‌های برداشت */}
      {withdrawRequests.length > 0 && (
        <section className="glass rounded-2xl overflow-hidden border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">{tLandingAuto("ld.302e7e2564d0")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">{tLandingAuto("ld.37313fd7bc42")}</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">{tLandingAuto("ld.18ec78dc6258")}</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">{tLandingAuto("ld.8cd9ad8fbfb2")}</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-500">{tLandingAuto("ld.d2d7bab75fc7")}</th>
                </tr>
              </thead>
              <tbody>
                {withdrawRequests.map((wr) => (
                  <tr key={wr.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium">{formatPrice(wr.amount)} تومان</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(wr.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[wr.status] || "bg-slate-100"}`}>
                        {STATUS_LABELS[wr.status] || wr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-red-600 text-xs max-w-[200px]">{wr.rejection_reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* تراکنش‌ها */}
      {transactions.length > 0 && (
        <section className="glass rounded-2xl overflow-hidden border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <FontAwesomeIcon icon={faHistory} className="text-slate-500" />
            <h2 className="font-bold text-slate-900">{tLandingAuto("ld.b463640ce27b")}</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex justify-between px-4 py-3 text-sm">
                <span className="text-slate-600">{formatDate((tx as { timestamp?: string }).timestamp)}</span>
                <span className="font-medium">{formatPrice((tx as { withdrawable_amount?: number }).withdrawable_amount ?? 0)} تومان</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
