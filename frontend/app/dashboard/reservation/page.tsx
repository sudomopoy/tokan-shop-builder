"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api/apiClient";
import { CalendarDays, RefreshCcw } from "lucide-react";

type Appointment = {
  id: string;
  store_user: {
    id: string;
    display_name: string;
    mobile?: string | null;
  };
  time_slot: {
    id: string;
    date: string;
    start_time: string;
    service: {
      title: string;
      provider: { title: string };
      category?: { title: string } | null;
    };
  };
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string;
  created_at: string;
};

const statusLabels: Record<Appointment["status"], string> = {
  pending: "در انتظار تایید",
  confirmed: "تایید شده",
  completed: "انجام شده",
  cancelled: "لغو شده",
};

const statusOptions: Array<{ value: Appointment["status"] | "all"; label: string }> = [
  { value: "all", label: "همه" },
  { value: "pending", label: "در انتظار تایید" },
  { value: "confirmed", label: "تایید شده" },
  { value: "completed", label: "انجام شده" },
  { value: "cancelled", label: "لغو شده" },
];

function normalizeList(payload: Appointment[] | { results?: Appointment[] }): Appointment[] {
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

export default function ReservationDashboardPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | Appointment["status"]>("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter === "all" ? "" : `?status=${statusFilter}`;
      const { data } = await apiClient.get<Appointment[] | { results?: Appointment[] }>(`/reservation/appointments/${query}`);
      setItems(normalizeList(data));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      confirmed: items.filter((item) => item.status === "confirmed").length,
      completed: items.filter((item) => item.status === "completed").length,
      cancelled: items.filter((item) => item.status === "cancelled").length,
    };
  }, [items]);

  const updateStatus = async (id: string, status: Appointment["status"]) => {
    setSavingId(id);
    try {
      await apiClient.patch(`/reservation/appointments/${id}/`, { status });
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch {
      alert("به‌روزرسانی وضعیت رزرو انجام نشد.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-3xl font-bold">مدیریت رزروها</h1>
        <button
          type="button"
          onClick={loadAppointments}
          className="btn-secondary inline-flex items-center gap-2 w-fit"
        >
          <RefreshCcw className="w-4 h-4" />
          بروزرسانی
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-500">کل رزروها</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">در انتظار</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{stats.pending}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">تایید شده</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{stats.confirmed}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">انجام شده</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500">لغو شده</p>
          <p className="text-2xl font-bold mt-1 text-rose-600">{stats.cancelled}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-semibold flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            لیست رزروها
          </h2>
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | Appointment["status"])}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">در حال بارگذاری...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">هیچ رزروی یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs text-gray-500">کاربر</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500">ارائه‌دهنده / سرویس</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500">زمان</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500">یادداشت</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500">وضعیت</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium">{item.store_user.display_name || "-"}</p>
                      {item.store_user.mobile && <p className="text-xs text-gray-500">{item.store_user.mobile}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium">{item.time_slot.service.provider.title}</p>
                      <p className="text-xs text-gray-500">{item.time_slot.service.title}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.time_slot.date}
                      <span className="mx-1">|</span>
                      {item.time_slot.start_time.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[280px] truncate">{item.notes || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={item.status}
                        disabled={savingId === item.id}
                        onChange={(e) => updateStatus(item.id, e.target.value as Appointment["status"])}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        {(Object.keys(statusLabels) as Appointment["status"][]).map((statusKey) => (
                          <option key={statusKey} value={statusKey}>
                            {statusLabels[statusKey]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
