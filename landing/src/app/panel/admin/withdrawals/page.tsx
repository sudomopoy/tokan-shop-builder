"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClipboardList,
  faCheck,
  faTimes,
  faMoneyBillTransfer,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
import { tLandingAuto } from "@/lib/autoMessages";
  getPanelInfo,
  getWithdrawRequests,
  getWithdrawRequestDetail,
  approveWithdrawRequest,
  rejectWithdrawRequest,
  markWithdrawDeposited,
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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
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

function WithdrawDetailView({
  id,
  onBack,
  onUpdated,
}: {
  id: string;
  onBack: () => void;
  onUpdated: () => void;
}) {
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getWithdrawRequestDetail>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [depositRef, setDepositRef] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getWithdrawRequestDetail(id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading("approve");
    setError("");
    try {
      const updated = await approveWithdrawRequest(id);
      setDetail(updated);
    } catch (e: unknown) {
      const err = e as { data?: { error?: string } };
      setError(err?.data?.error || "خطا در تایید");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) {
      setError(tLandingAuto("ld.02f8976a2677"));
      return;
    }
    setActionLoading("reject");
    setError("");
    try {
      const updated = await rejectWithdrawRequest(id, rejectReason.trim());
      setDetail(updated);
      setRejectReason("");
    } catch (e: unknown) {
      const err = e as { data?: { error?: string } };
      setError(err?.data?.error || "خطا در رد");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeposited = async () => {
    if (!id || !depositRef.trim()) {
      setError(tLandingAuto("ld.3f5adfa99833"));
      return;
    }
    setActionLoading("deposited");
    setError("");
    try {
      const updated = await markWithdrawDeposited(id, depositRef.trim());
      setDetail(updated);
      setDepositRef("");
      onUpdated();
    } catch (e: unknown) {
      const err = e as { data?: { error?: string } };
      setError(err?.data?.error || "خطا در ثبت واریز");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="h-10 w-10 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <p className="text-slate-600 mb-4">{tLandingAuto("ld.ffb1dfa1f2cd")}</p>
        <button onClick={onBack} className="text-brand-600 hover:underline">
          بازگشت به لیست
        </button>
      </div>
    );
  }

  const isPending = detail.status === "pending";
  const isApproved = detail.status === "approved";

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        بازگشت به لیست
      </button>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">{tLandingAuto("ld.3904540af465")}</h1>

      <div className="glass rounded-2xl p-6 border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">{tLandingAuto("ld.bae2448cc2df")}</p>
            <p className="font-medium">{detail.user_mobile || detail.user_username || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tLandingAuto("ld.37313fd7bc42")}</p>
            <p className="font-bold text-lg">{formatPrice(detail.amount)} تومان</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tLandingAuto("ld.88fa68c71c4a")}</p>
            <p className="font-mono text-sm" dir="ltr">{detail.bank_sheba_or_card}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tLandingAuto("ld.294d0f7d2f23")}</p>
            <p className="font-medium">{detail.bank_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tLandingAuto("ld.88270442599b")}</p>
            <p className="font-medium">{detail.account_holder}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tLandingAuto("ld.8cd9ad8fbfb2")}</p>
            <p className="font-medium">{STATUS_LABELS[detail.status] || detail.status}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{tLandingAuto("ld.3a67a31c0da7")}</p>
            <p>{formatDate(detail.created_at)}</p>
          </div>
        </div>
        {detail.description && (
          <div>
            <p className="text-xs text-slate-500">{tLandingAuto("ld.32a7c1ba16f6")}</p>
            <p className="text-sm">{detail.description}</p>
          </div>
        )}
        {detail.rejection_reason && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs text-red-600 font-medium">{tLandingAuto("ld.12ddfc5c54df")}</p>
            <p className="text-sm text-red-800">{detail.rejection_reason}</p>
          </div>
        )}
        {detail.deposit_reference_id && (
          <div>
            <p className="text-xs text-slate-500">{tLandingAuto("ld.789b8e0f52ff")}</p>
            <p className="font-mono">{detail.deposit_reference_id}</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-red-600 text-sm">{error}</p>
      )}

      <div className="mt-6 space-y-4">
        {isPending && (
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleApprove}
              disabled={!!actionLoading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2 disabled:opacity-70"
            >
              {actionLoading === "approve" ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faCheck} />
              )}
              تایید برداشت
            </button>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={tLandingAuto("ld.9f39d0a1d69a")}
                className="px-3 py-2 rounded-xl border border-slate-200 min-w-[220px]"
              />
              <button
                onClick={handleReject}
                disabled={!!actionLoading || !rejectReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 disabled:opacity-70"
              >
                {actionLoading === "reject" ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faTimes} />
                )}
                رد برداشت
              </button>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="flex flex-wrap gap-4 items-center">
            <input
              type="text"
              value={depositRef}
              onChange={(e) => setDepositRef(e.target.value)}
              placeholder={tLandingAuto("ld.789b8e0f52ff")}
              className="px-3 py-2 rounded-xl border border-slate-200 min-w-[180px]"
              dir="ltr"
            />
            <button
              onClick={handleDeposited}
              disabled={!!actionLoading || !depositRef.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 disabled:opacity-70"
            >
              {actionLoading === "deposited" ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faMoneyBillTransfer} />
              )}
              واریز شد
            </button>
          </div>
        )}

        {(detail.status === "rejected" || detail.status === "deposited") && (
          <p className="text-slate-500 text-sm">{tLandingAuto("ld.dd0c4a652bea")}</p>
        )}
      </div>
    </div>
  );
}

function AdminWithdrawalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailId = searchParams.get("id");
  const [requests, setRequests] = useState<Awaited<ReturnType<typeof getWithdrawRequests>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPanelInfo()
      .then((info) => {
        if (!info.user?.is_superuser) {
          router.replace("/panel/dashboard");
          return;
        }
      })
      .catch(() => router.replace("/panel/dashboard"));
  }, [router]);

  useEffect(() => {
    getWithdrawRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [detailId]);

  const handleBackToList = () => {
    router.push("/panel/admin/withdrawals/");
  };

  const handleDetailUpdated = () => {
    getWithdrawRequests().then(setRequests).catch(() => {});
  };

  if (detailId) {
    return (
      <WithdrawDetailView
        id={detailId}
        onBack={handleBackToList}
        onUpdated={handleDetailUpdated}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-amber-600 border-t-transparent" />
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        <FontAwesomeIcon icon={faClipboardList} className="text-amber-600" />
        مدیریت درخواست‌های برداشت
      </h1>
      {pendingCount > 0 && (
        <p className="mt-2 text-amber-700">
          {pendingCount} درخواست در انتظار بررسی
        </p>
      )}

      <div className="mt-6 glass rounded-2xl overflow-hidden border border-slate-200">
        {requests.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-500">{tLandingAuto("ld.d565c1605b8e")}</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-right font-medium text-slate-500">{tLandingAuto("ld.bae2448cc2df")}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">{tLandingAuto("ld.37313fd7bc42")}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">{tLandingAuto("ld.9c9772dc607f")}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">{tLandingAuto("ld.18ec78dc6258")}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">{tLandingAuto("ld.8cd9ad8fbfb2")}</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">{tLandingAuto("ld.56e8e8e08db4")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((wr) => (
                <tr key={wr.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{wr.user_mobile || wr.user_username || "—"}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatPrice(wr.amount)} تومان</td>
                  <td className="px-4 py-3">{wr.bank_name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(wr.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[wr.status] || "bg-slate-100"}`}>
                      {STATUS_LABELS[wr.status] || wr.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/panel/admin/withdrawals/?id=${wr.id}`}
                      className="text-brand-600 hover:underline font-medium"
                    >
                      جزئیات
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminWithdrawalsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-amber-600 border-t-transparent" />
      </div>
    }>
      <AdminWithdrawalsContent />
    </Suspense>
  );
}
