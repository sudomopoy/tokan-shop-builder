"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, UserRound } from "lucide-react";

import { apiClient } from "@/lib/api/apiClient";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import type { WidgetConfig } from "@/themes/types";

type ServiceProvider = {
  id: string;
  title: string;
  description: string;
  avatar?: { file?: string } | null;
  is_active: boolean;
};

type ServiceCategory = {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
};

type Service = {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price: string;
  is_active: boolean;
  provider: ServiceProvider;
  category?: ServiceCategory | null;
};

type AvailabilitySlot = {
  time_slot_id: string | null;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  bookings_count: number;
  remaining_capacity: number;
  is_full: boolean;
};

type AvailabilityResponse = {
  service: Service;
  settings: {
    timezone: string;
    slot_interval_minutes: number;
    booking_window_days: number;
    min_advance_minutes: number;
    use_public_holidays: boolean;
  };
  slots: AvailabilitySlot[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

const formatPrice = (value: string | number): string => {
  const numeric = typeof value === "string" ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat("fa-IR").format(numeric);
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const toImageUrl = (file?: string): string => {
  if (!file) return "";
  if (file.startsWith("http")) return file;
  return `${API_BASE.replace(/\/$/, "")}${file.startsWith("/") ? "" : "/"}${file}`;
};

export default function ReservationWidget({ config: _config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [step, setStep] = useState<"providers" | "categories" | "services" | "booking" | "success">("providers");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes] = useState("");

  const availableDates = useMemo(() => {
    const all = Array.from(new Set(slots.map((slot) => slot.date)));
    return all.sort((a, b) => a.localeCompare(b));
  }, [slots]);

  const slotsForSelectedDate = useMemo(() => {
    return slots
      .filter((slot) => slot.date === selectedDate)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [slots, selectedDate]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<ServiceProvider[] | { results?: ServiceProvider[] }>("/reservation/providers/?active=true");
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setProviders(list);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndServices = async (providerId: string, categoryId?: string) => {
    setLoading(true);
    try {
      const [categoriesRes, servicesRes] = await Promise.all([
        apiClient.get<ServiceCategory[] | { results?: ServiceCategory[] }>(`/reservation/categories/?provider=${providerId}&active=true`),
        apiClient.get<Service[] | { results?: Service[] }>(
          `/reservation/services/?provider=${providerId}${categoryId ? `&category=${categoryId}` : ""}&active=true`
        ),
      ]);

      const categoriesList = Array.isArray(categoriesRes.data)
        ? categoriesRes.data
        : categoriesRes.data?.results ?? [];
      const servicesList = Array.isArray(servicesRes.data)
        ? servicesRes.data
        : servicesRes.data?.results ?? [];

      setCategories(categoriesList);
      setServices(servicesList);
    } catch {
      setCategories([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (serviceId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<AvailabilityResponse>(
        `/reservation/services/${serviceId}/availability/?start_date=${todayIso()}&days=14`
      );
      const allSlots = data?.slots ?? [];
      setSlots(allSlots);

      const nextAvailableDate = allSlots.find((slot) => !slot.is_full)?.date ?? allSlots[0]?.date ?? "";
      setSelectedDate(nextAvailableDate);
      setSelectedSlot(null);
    } catch {
      setSlots([]);
      setSelectedDate("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const startProviderFlow = async (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setSelectedCategory(null);
    setSelectedService(null);
    setSlots([]);
    setSelectedDate("");
    setSelectedSlot(null);
    setStep("categories");
    await fetchCategoriesAndServices(provider.id);
  };

  const selectCategory = async (category: ServiceCategory | null) => {
    if (!selectedProvider) return;
    setSelectedCategory(category);
    setSelectedService(null);
    setSelectedSlot(null);
    setStep("services");
    await fetchCategoriesAndServices(selectedProvider.id, category?.id);
  };

  const selectService = async (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setStep("booking");
    await fetchAvailability(service.id);
  };

  const handleSubmitReservation = async () => {
    if (!selectedService || !selectedSlot) return;
    if (!isAuthenticated) {
      router.push("/login?next=/reservation");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post("/reservation/appointments/", {
        time_slot: selectedSlot.time_slot_id,
        service: selectedSlot.time_slot_id ? undefined : selectedService.id,
        date: selectedSlot.time_slot_id ? undefined : selectedSlot.date,
        start_time: selectedSlot.time_slot_id ? undefined : selectedSlot.start_time,
        notes,
      });
      setStep("success");
    } catch {
      setError(tFrontendAuto("fe.6ba18313b2d4"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container py-10">
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/" className="hover:text-primary">
          {tFrontendAuto("fe.0efc869315f1")}
        </Link>
        <span>‹</span>
        <span className="text-dark">رزرو آنلاین</span>
      </nav>

      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-900 text-white p-8 mb-8 relative overflow-hidden">
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-16 -right-10 w-52 h-52 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative">
          <p className="text-cyan-200 text-sm mb-1">سیستم رزرواسیون</p>
          <h1 className="text-3xl md:text-4xl font-black">زمان مناسب خود را انتخاب و رزرو کنید</h1>
          <p className="text-cyan-100/90 mt-3 max-w-3xl text-sm">
            ارائه‌دهنده، دسته خدمات، سرویس و ساعت دلخواه را انتخاب کنید. ظرفیت‌ها به‌صورت لحظه‌ای محاسبه می‌شود.
          </p>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

      {loading && step === "providers" && (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-500">در حال بارگذاری...</div>
      )}

      {step === "providers" && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => startProviderFlow(provider)}
              className="group text-right rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary/50 hover:shadow-lg transition"
            >
              <div className="flex items-center gap-3 mb-4">
                {provider.avatar?.file ? (
                  <img src={toImageUrl(provider.avatar.file)} alt={provider.title} className="w-14 h-14 rounded-2xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center">
                    <UserRound className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-dark group-hover:text-primary transition">{provider.title}</h3>
                  <p className="text-xs text-gray-500">ارائه‌دهنده خدمات</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{provider.description || "بدون توضیح"}</p>
            </button>
          ))}

          {providers.length === 0 && (
            <div className="col-span-full rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              هنوز ارائه‌دهنده‌ای برای این فروشگاه ثبت نشده است.
            </div>
          )}
        </div>
      )}

      {step === "categories" && selectedProvider && (
        <div className="space-y-5">
          <button onClick={() => setStep("providers")} className="text-primary font-medium">
            بازگشت به ارائه‌دهندگان
          </button>

          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-xl font-black mb-2">دسته‌بندی خدمات {selectedProvider.title}</h2>
            <p className="text-sm text-gray-600 mb-4">ابتدا دسته موردنظر را انتخاب کنید.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => selectCategory(null)}
                className={`px-4 py-2 rounded-xl border text-sm transition ${
                  selectedCategory === null ? "bg-primary text-white border-primary" : "border-gray-200 hover:border-primary/40"
                }`}
              >
                همه دسته‌ها
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category)}
                  className={`px-4 py-2 rounded-xl border text-sm transition ${
                    selectedCategory?.id === category.id
                      ? "bg-primary text-white border-primary"
                      : "border-gray-200 hover:border-primary/40"
                  }`}
                >
                  {category.title}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep("services")} className="btn-primary">
              ادامه
            </button>
          </div>
        </div>
      )}

      {step === "services" && selectedProvider && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button onClick={() => setStep("categories")} className="text-primary font-medium">
              بازگشت به دسته‌بندی‌ها
            </button>
            <p className="text-sm text-gray-600">
              {selectedCategory ? `فیلتر: ${selectedCategory.title}` : "نمایش همه دسته‌ها"}
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500">در حال بارگذاری سرویس‌ها...</div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500">
              سرویسی برای این انتخاب پیدا نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => selectService(service)}
                  className="text-right rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary/50 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-center gap-3">
                    <h3 className="font-bold text-dark">{service.title}</h3>
                    <span className="text-primary font-black">{formatPrice(service.price)} تومان</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {service.category?.title || "بدون دسته‌بندی"} • {service.duration_minutes} دقیقه
                  </p>
                  {service.description && <p className="text-sm text-gray-600 mt-3 line-clamp-2">{service.description}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "booking" && selectedService && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button onClick={() => setStep("services")} className="text-primary font-medium">
                بازگشت به سرویس‌ها
              </button>
              <span className="text-sm text-gray-600">{selectedService.provider.title}</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-dark">{selectedService.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedService.description || "بدون توضیح"}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">انتخاب روز</h3>
              {availableDates.length === 0 ? (
                <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-500">زمان خالی برای این سرویس موجود نیست.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableDates.map((dateValue) => (
                    <button
                      key={dateValue}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateValue);
                        setSelectedSlot(null);
                      }}
                      className={`px-4 py-2 rounded-xl border text-sm transition ${
                        selectedDate === dateValue
                          ? "bg-primary text-white border-primary"
                          : "border-gray-200 hover:border-primary/40"
                      }`}
                    >
                      {dateValue}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">انتخاب ساعت</h3>
              {selectedDate && slotsForSelectedDate.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {slotsForSelectedDate.map((slot) => (
                    <button
                      key={`${slot.date}-${slot.start_time}`}
                      type="button"
                      disabled={slot.is_full}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-xl border p-3 text-right transition ${
                        slot.is_full
                          ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                          : selectedSlot?.date === slot.date && selectedSlot?.start_time === slot.start_time
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-primary/50"
                      }`}
                    >
                      <p className="font-semibold text-sm">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </p>
                      <p className="text-xs mt-1 text-gray-500">
                        {slot.is_full ? "تکمیل ظرفیت" : `${slot.remaining_capacity} ظرفیت باقی‌مانده`}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-500">برای این روز اسلاتی وجود ندارد.</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">یادداشت مشتری (اختیاری)</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20"
                placeholder="اگر توضیح خاصی دارید بنویسید..."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 h-fit space-y-4 sticky top-24">
            <h3 className="text-lg font-black">خلاصه رزرو</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2 text-gray-700">
                <UserRound className="w-4 h-4 mt-0.5 text-primary" />
                <span>{selectedService.provider.title}</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <Clock3 className="w-4 h-4 mt-0.5 text-primary" />
                <span>{selectedService.duration_minutes} دقیقه</span>
              </div>
              <div className="flex items-start gap-2 text-gray-700">
                <CalendarDays className="w-4 h-4 mt-0.5 text-primary" />
                <span>{selectedSlot ? `${selectedSlot.date} • ${selectedSlot.start_time.slice(0, 5)}` : "تاریخ/ساعت انتخاب نشده"}</span>
              </div>
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs text-gray-500 mb-1">هزینه سرویس</p>
              <p className="text-2xl font-black text-primary">{formatPrice(selectedService.price)} تومان</p>
            </div>

            {!isAuthenticated && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                برای ثبت نهایی رزرو باید وارد حساب کاربری شوید.
              </p>
            )}

            <button
              type="button"
              disabled={!selectedSlot || submitting}
              onClick={handleSubmitReservation}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-60"
            >
              {submitting ? "در حال ثبت..." : "ثبت رزرو"}
            </button>
          </div>
        </div>
      )}

      {step === "success" && selectedService && selectedSlot && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-emerald-800">رزرو شما با موفقیت ثبت شد</h2>
          <p className="text-emerald-700 mt-2">
            {selectedService.title} در تاریخ {selectedSlot.date} ساعت {selectedSlot.start_time.slice(0, 5)}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setStep("providers");
                setSelectedProvider(null);
                setSelectedCategory(null);
                setSelectedService(null);
                setSelectedSlot(null);
                setNotes("");
              }}
              className="px-5 py-3 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              رزرو جدید
            </button>
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              رفتن به پروفایل
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
