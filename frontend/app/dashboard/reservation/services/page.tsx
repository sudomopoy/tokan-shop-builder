"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

type ServiceProvider = { id: string; title: string };
type Service = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price: string;
  provider: ServiceProvider;
};

function formatPrice(v: string | number): string {
  const n = typeof v === "string" ? parseFloat(v) || 0 : v;
  return new Intl.NumberFormat("fa-IR").format(n);
}

export default function ReservationServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ results?: Service[] } | Service[]>("/reservation/services/");
      const list = Array.isArray(data) ? data : (data as { results?: Service[] })?.results ?? [];
      setServices(list);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(tFrontendAuto("fe.8b4c1af00bf4", { p1: title }))) return;
    try {
      await apiClient.delete(`/reservation/services/${id}/`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("خطا در حذف سرویس");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">{tFrontendAuto("fe.432ce730071e")}</h1>
        <Link
          href="/dashboard/reservation/services/new"
          className="btn-primary inline-flex items-center gap-2 w-fit"
        >
          <Plus className="h-5 w-5" />
          افزودن سرویس
        </Link>
      </div>

      <p className="text-gray-600">
        سرویس‌ها، خدمات قابل رزرو هر ارائه‌دهنده هستند (مثل ویزیت، اصلاح مو، مشاوره).
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          {services.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              هنوز سرویسی ثبت نشده است.
              <Link href="/dashboard/reservation/services/new" className="block mt-2 text-brand-600 hover:underline">
                اولین سرویس را اضافه کنید
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">{tFrontendAuto("fe.1ad5b79eda2a")}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">{tFrontendAuto("fe.faa167cc3b58")}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">{tFrontendAuto("fe.8ea2e146aa45")}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">{tFrontendAuto("fe.87abd947fa44")}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 sticky right-0 bg-gray-50 z-10">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{s.title}</td>
                      <td className="px-6 py-4 text-gray-600">{s.provider?.title ?? "—"}</td>
                      <td className="px-6 py-4">{s.duration_minutes}</td>
                      <td className="px-6 py-4">{formatPrice(s.price)} تومان</td>
                      <td className="px-6 py-4 sticky right-0 bg-white z-10">
                        <div className="flex gap-2 justify-end">
                          <Link
                            href={`/dashboard/reservation/services/${s.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            title={tFrontendAuto("fe.de21bfe62ab5")}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id, s.title)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                            title={tFrontendAuto("fe.fc1d9d323674")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
