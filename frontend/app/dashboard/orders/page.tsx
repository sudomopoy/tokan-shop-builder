"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { orderApi, type Order } from "@/lib/api/orderApi";

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  processing: "در حال آماده‌سازی",
  completed: "تکمیل شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  failed: "ناموفق",
};

function statusBadge(status: string) {
  const label = STATUS_LABELS[status] ?? status;
  const cls =
    status === "delivered" || status === "completed"
      ? "bg-green-100 text-green-700"
      : status === "processing" || status === "paid"
        ? "bg-blue-100 text-blue-700"
        : status === "pending"
          ? "bg-amber-100 text-amber-700"
          : status === "cancelled" || status === "failed"
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-700";
  return <span className={`px-3 py-1 rounded-lg text-sm font-medium ${cls}`}>{label}</span>;
}

const formatPrice = (v: unknown): string => {
  const n = typeof v === "string" ? parseFloat(v) || 0 : typeof v === "number" ? v : 0;
  return new Intl.NumberFormat("fa-IR").format(n);
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.listOrders();
      setOrders(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchSearch =
      !search ||
      String(o.code ?? "").includes(search) ||
      (o.store_user?.display_name ?? "").includes(search) ||
      (o.store_user?.user_mobile ?? "").includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">مدیریت سفارشات</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="جستجو با شماره سفارش، نام یا موبایل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
        >
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    شماره
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    مشتری
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    مبلغ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    تاریخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.05)]">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      سفارشی یافت نشد
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="group hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono font-medium">{order.code ?? "—"}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">
                            {order.store_user?.display_name ?? "—"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.store_user?.user_mobile ?? "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatPrice(order.payable_amount)} تومان
                      </td>
                      <td className="px-6 py-4">{statusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 sticky right-0 bg-white group-hover:bg-gray-50 z-10 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.05)]">
                        <Link
                          href={`/dashboard/orders/${order.code}`}
                          className="inline-flex items-center gap-1.5 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="مشاهده جزئیات"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="text-sm">جزئیات</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
