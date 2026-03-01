"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

type Appointment = {
  id: string;
  store_user: { display_name: string };
  time_slot: {
    service: { title: string; provider: { title: string } };
    date: string;
    start_time: string;
  };
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار تایید",
  confirmed: "تایید شده",
  completed: "انجام شده",
  cancelled: "لغو شده",
};

export default function ReservationDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<Appointment[] | { results: Appointment[] }>("/reservation/appointments/")
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data as { results: Appointment[] }).results ?? [];
        setAppointments(list);
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{tFrontendAuto("fe.c59c8aaec72f")}</h1>
      </div>

      <p className="text-gray-600">
        ارائه‌دهندگان و سرویس‌ها را از منوی مدیریت رزروها تنظیم کنید. رزروهای انجام‌شده در زیر نمایش داده می‌شوند.
      </p>

      <div className="bg-white rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          آخرین رزروها
        </h2>
        {loading ? (
          <p className="text-gray-500">{tFrontendAuto("fe.3e07344c65a3")}</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-600">{tFrontendAuto("fe.9273bdb2beca")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4">{tFrontendAuto("fe.e90dd815fc3e")}</th>
                  <th className="py-3 px-4">{tFrontendAuto("fe.1ad5b79eda2a")}</th>
                  <th className="py-3 px-4">{tFrontendAuto("fe.70de9c98e71c")}</th>
                  <th className="py-3 px-4">{tFrontendAuto("fe.b56dc5016988")}</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 10).map((a) => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{a.store_user?.display_name ?? "-"}</td>
                    <td className="py-3 px-4">
                      {a.time_slot?.service?.provider?.title} - {a.time_slot?.service?.title}
                    </td>
                    <td className="py-3 px-4">
                      {a.time_slot?.date} {a.time_slot?.start_time?.slice(0, 5)}
                    </td>
                    <td className="py-3 px-4">{STATUS_LABELS[a.status] ?? a.status}</td>
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
