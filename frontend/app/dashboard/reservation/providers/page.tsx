"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";

type ServiceProvider = {
  id: string;
  title: string;
  description: string;
  avatar?: { id: string; file?: string } | null;
  sort_order: number;
  is_active: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
function getImageUrl(file: string | undefined): string {
  if (!file) return "";
  return file.startsWith("http")
    ? file
    : `${API_BASE.replace(/\/$/, "")}${file.startsWith("/") ? "" : "/"}${file}`;
}

export default function ReservationProvidersPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<{ results?: ServiceProvider[] } | ServiceProvider[]>("/reservation/providers/");
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setProviders(list);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ارائه‌دهنده «${title}» حذف شود؟`)) return;
    try {
      await apiClient.delete(`/reservation/providers/${id}/`);
      setProviders((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("حذف ارائه‌دهنده انجام نشد.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold">ارائه‌دهندگان خدمات</h1>
        <Link href="/dashboard/reservation/providers/new" className="btn-primary inline-flex items-center gap-2 w-fit">
          <Plus className="h-5 w-5" />
          افزودن ارائه‌دهنده
        </Link>
      </div>

      <p className="text-gray-600">در این بخش می‌توانید افراد یا واحدهایی که خدمات رزروی ارائه می‌کنند را مدیریت کنید.</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          {providers.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              هنوز ارائه‌دهنده‌ای ثبت نشده است.
              <Link href="/dashboard/reservation/providers/new" className="block mt-2 text-brand-600 hover:underline">
                اولین ارائه‌دهنده را اضافه کنید
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">ارائه‌دهنده</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">توضیح</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">وضعیت</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 sticky right-0 bg-gray-50 z-10">عملیات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {provider.avatar?.file && (
                            <img
                              src={getImageUrl(provider.avatar.file)}
                              alt={provider.title}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium">{provider.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm line-clamp-2">{provider.description || "—"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            provider.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {provider.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-6 py-4 sticky right-0 bg-white z-10">
                        <div className="flex gap-2 justify-end">
                          <Link
                            href={`/dashboard/reservation/providers/${provider.id}`}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                            title="ویرایش"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(provider.id, provider.title)}
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
