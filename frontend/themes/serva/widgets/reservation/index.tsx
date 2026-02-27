"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { WidgetConfig } from "@/themes/types";
import { apiClient } from "@/lib/api/apiClient";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { useRouter } from "next/navigation";

type ServiceProvider = {
  id: string;
  title: string;
  description: string;
  avatar?: { file: string } | null;
};

type Service = {
  id: string;
  provider: ServiceProvider;
  title: string;
  description: string;
  duration_minutes: number;
  price: string;
};

type TimeSlot = {
  id: string;
  service: Service;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  bookings_count: number;
};

const formatPrice = (price: number): string =>
  new Intl.NumberFormat("fa-IR").format(price);

export default function ReservationWidget({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [step, setStep] = useState<"providers" | "services" | "slots" | "confirm">("providers");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE ?? "";

  useEffect(() => {
    apiClient
      .get<ServiceProvider[]>("/reservation/providers/")
      .then(({ data }) => setProviders(Array.isArray(data) ? data : []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProvider) {
      setServices([]);
      return;
    }
    setLoading(true);
    apiClient
      .get<Service[]>(`/reservation/services/?provider=${selectedProvider.id}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : "results" in data ? (data as { results: Service[] }).results : [];
        setServices(list.filter((s) => s.provider?.id === selectedProvider.id));
      })
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [selectedProvider]);

  useEffect(() => {
    if (!selectedService) {
      setSlots([]);
      return;
    }
    const fromDate = new Date().toISOString().slice(0, 10);
    setLoading(true);
    apiClient
      .get<TimeSlot[]>(`/reservation/slots/?service=${selectedService.id}&date=${fromDate}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : "results" in data ? (data as { results: TimeSlot[] }).results : [];
        setSlots(list);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [selectedService]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post("/reservation/appointments/", {
        time_slot: selectedSlot.id,
        notes,
      });
      router.push("/profile?tab=appointments");
    } catch {
      setError("ثبت رزرو ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-dark mb-4">برای رزرو وارد شوید</h2>
          <button
            onClick={() => router.push("/login?next=/reservation")}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
          >
            ورود به حساب کاربری
          </button>
        </div>
      </section>
    );
  }

  if (loading && step === "providers") {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">در حال بارگذاری...</div>
      </section>
    );
  }

  return (
    <section className="container py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <span>‹</span>
        <span className="text-dark">رزرو آنلاین</span>
      </nav>
      <h1 className="text-2xl font-bold text-dark mb-6">رزرو آنلاین</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>
      )}

      {step === "providers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProvider(p);
                setStep("services");
              }}
              className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-primary text-right transition"
            >
              {p.avatar?.file && (
                <img
                  src={p.avatar.file.startsWith("http") ? p.avatar.file : `${baseUrl}${p.avatar.file}`}
                  alt={p.title}
                  className="w-16 h-16 rounded-full object-cover mb-4"
                />
              )}
              <h3 className="font-bold text-dark">{p.title}</h3>
              {p.description && <p className="text-sm text-gray-600 mt-2">{p.description}</p>}
            </button>
          ))}
        </div>
      )}

      {step === "services" && selectedProvider && (
        <div>
          <button onClick={() => setStep("providers")} className="text-primary mb-4">
            بازگشت به ارائه‌دهندگان
          </button>
          <h2 className="text-lg font-bold text-dark mb-4">سرویس‌های {selectedProvider.title}</h2>
          {loading ? (
            <p className="text-gray-500">در حال بارگذاری...</p>
          ) : (
            <div className="space-y-4">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedService(s);
                    setStep("slots");
                  }}
                  className="block w-full text-right bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-primary transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-dark">{s.title}</span>
                    <span className="text-primary font-bold">{formatPrice(parseFloat(s.price))} تومان</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{s.duration_minutes} دقیقه</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "slots" && selectedService && (
        <div>
          <button
            onClick={() => setStep("services")}
            className="text-primary mb-4"
          >
            بازگشت به سرویس‌ها
          </button>
          <h2 className="text-lg font-bold text-dark mb-4">انتخاب زمان - {selectedService.title}</h2>
          {loading ? (
            <p className="text-gray-500">در حال بارگذاری...</p>
          ) : slots.length === 0 ? (
            <p className="text-gray-600">بازه‌ای برای این تاریخ یافت نشد.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {slots.map((slot) => {
                const full = slot.bookings_count >= slot.capacity;
                return (
                  <button
                    key={slot.id}
                    disabled={full}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep("confirm");
                    }}
                    className={`py-3 rounded-lg border-2 transition ${
                      full
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-200 hover:border-primary"
                    }`}
                  >
                    {slot.start_time.slice(0, 5)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === "confirm" && selectedSlot && selectedService && (
        <div className="bg-white rounded-xl p-6 max-w-md">
          <h2 className="text-lg font-bold text-dark mb-4">تایید رزرو</h2>
          <div className="space-y-2 mb-4">
            <p>
              <strong>ارائه‌دهنده:</strong> {selectedSlot.service.provider.title}
            </p>
            <p>
              <strong>سرویس:</strong> {selectedService.title} - {formatPrice(parseFloat(selectedService.price))} تومان
            </p>
            <p>
              <strong>زمان:</strong> {selectedSlot.date} - {selectedSlot.start_time.slice(0, 5)}
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-dark mb-2">یادداشت (اختیاری)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border rounded-lg"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("slots")}
              className="px-6 py-3 border border-gray-300 rounded-lg"
            >
              بازگشت
            </button>
            <button
              onClick={handleBook}
              disabled={submitting}
              className="flex-1 py-3 bg-primary text-white rounded-lg font-bold disabled:opacity-60"
            >
              {submitting ? "در حال ثبت..." : "ثبت رزرو"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
