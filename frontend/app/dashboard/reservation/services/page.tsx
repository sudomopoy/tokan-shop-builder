"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";

type ServiceProvider = { id: string; title: string };
type ServiceCategory = { id: string; title: string } | null;

type Service = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price: string;
  provider: ServiceProvider;
  category: ServiceCategory;
  is_active: boolean;
};

function formatPrice(value: string | number): string {
  const numeric = typeof value === "string" ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat("fa-IR").format(numeric);
}

export default function ReservationServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ results?: Service[] } | Service[]>("/reservation/services/");
      const list = Array.isArray(data) ? data : data?.results ?? [];
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
    if (!confirm(`سرویس «${title}» حذف شود؟`)) return;
    try {
      await apiClient.delete(`/reservation/services/${id}/`);
      setServices((prev) => prev.filter((service) => service.id !== id));
    } catch {
      alert("حذف سرویس انجام نشد.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">سرویس‌ها</h1>
        <Link href="/dashboard/reservation/services/new" className="btn-primary inline-flex items-center gap-2 w-fit">
          <Plus className="h-5 w-5" />
          افزودن سرویس
        </Link>
      </div>

      <p className="text-gray-600">خدمات قابل رزرو فروشگاه را به همراه دسته‌بندی، مدت زمان و قیمت مدیریت کنید.</p>

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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">سرویس</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">ارائه‌دهنده</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">دسته‌بندی</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">مدت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">قیمت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">وضعیت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 sticky right-0 bg-gray-50 z-10">عملیات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold">{service.title}</p>
                        {service.description && <p className="text-xs text-gray-500 mt-1">{service.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{service.provider?.title ?? "—"}</td>
                      <td className="px-6 py-4 text-gray-700">{service.category?.title ?? "—"}</td>
                      <td className="px-6 py-4">{service.duration_minutes} دقیقه</td>
                      <td className="px-6 py-4">{formatPrice(service.price)} تومان</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            service.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {service.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-6 py-4 sticky right-0 bg-white z-10">
                        <div className="flex gap-2 justify-end">
                          <Link
                            href={`/dashboard/reservation/services/${service.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            title="ویرایش"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(service.id, service.title)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                            title="حذف"
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
