"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api/apiClient";
import { CalendarDays, Clock3, Plus, Save, Trash2 } from "lucide-react";

type Provider = {
  id: string;
  title: string;
  is_active: boolean;
};

type Service = {
  id: string;
  title: string;
  is_active: boolean;
};

type ReservationSettings = {
  id?: string;
  timezone: string;
  slot_interval_minutes: number;
  booking_window_days: number;
  min_advance_minutes: number;
  use_public_holidays: boolean;
};

type WorkingHour = {
  id: string;
  provider: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_capacity: number;
  is_active: boolean;
};

type TimeOff = {
  id: string;
  provider: string;
  date: string;
  title: string;
  is_full_day: boolean;
  start_time: string | null;
  end_time: string | null;
  is_active: boolean;
};

type SlotOverride = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  is_active: boolean;
  service: {
    id: string;
    title: string;
  };
};

const weekdays = [
  { value: 0, label: "دوشنبه" },
  { value: 1, label: "سه‌شنبه" },
  { value: 2, label: "چهارشنبه" },
  { value: 3, label: "پنجشنبه" },
  { value: 4, label: "جمعه" },
  { value: 5, label: "شنبه" },
  { value: 6, label: "یکشنبه" },
];

const inputClass =
  "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

const today = new Date().toISOString().slice(0, 10);

export default function ReservationCapacityPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");

  const [settings, setSettings] = useState<ReservationSettings>({
    timezone: "Asia/Tehran",
    slot_interval_minutes: 30,
    booking_window_days: 30,
    min_advance_minutes: 0,
    use_public_holidays: false,
  });

  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [slotOverrides, setSlotOverrides] = useState<SlotOverride[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [workingHourForm, setWorkingHourForm] = useState({
    weekday: "0",
    start_time: "09:00",
    end_time: "17:00",
    slot_capacity: "1",
    is_active: true,
  });
  const [timeOffForm, setTimeOffForm] = useState({
    date: today,
    title: "",
    is_full_day: true,
    start_time: "",
    end_time: "",
    is_active: true,
  });
  const [slotForm, setSlotForm] = useState({
    service: "",
    date: today,
    start_time: "09:00",
    end_time: "09:30",
    capacity: "1",
    is_active: true,
  });

  const selectedProviderTitle = useMemo(
    () => providers.find((p) => p.id === selectedProvider)?.title ?? "",
    [providers, selectedProvider]
  );

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await apiClient.get<ReservationSettings>("/reservation/settings/");
      setSettings(data);
    } catch {
      // keep defaults
    }
  }, []);

  const loadProviders = useCallback(async () => {
    const { data } = await apiClient.get<Provider[] | { results?: Provider[] }>("/reservation/providers/");
    const list = Array.isArray(data) ? data : data?.results ?? [];
    setProviders(list);
    if (list.length > 0) {
      setSelectedProvider((prev) => prev || list[0]!.id);
    }
  }, []);

  const loadProviderData = useCallback(async (providerId: string) => {
    if (!providerId) {
      setServices([]);
      setWorkingHours([]);
      setTimeOffs([]);
      return;
    }

    const [servicesRes, hoursRes, offsRes] = await Promise.all([
      apiClient.get<Service[] | { results?: Service[] }>(`/reservation/services/?provider=${providerId}`),
      apiClient.get<WorkingHour[] | { results?: WorkingHour[] }>(`/reservation/working-hours/?provider=${providerId}`),
      apiClient.get<TimeOff[] | { results?: TimeOff[] }>(`/reservation/time-offs/?provider=${providerId}&date_from=${today}`),
    ]);

    const servicesList = Array.isArray(servicesRes.data) ? servicesRes.data : servicesRes.data?.results ?? [];
    const hoursList = Array.isArray(hoursRes.data) ? hoursRes.data : hoursRes.data?.results ?? [];
    const offsList = Array.isArray(offsRes.data) ? offsRes.data : offsRes.data?.results ?? [];

    setServices(servicesList);
    setWorkingHours(hoursList);
    setTimeOffs(offsList);

    if (servicesList.length > 0) {
      const firstServiceId = servicesList[0]!.id;
      setSelectedService((prev) => prev || firstServiceId);
      setSlotForm((prev) => ({ ...prev, service: prev.service || firstServiceId }));
    }
  }, []);

  const loadSlots = useCallback(async (serviceId: string) => {
    if (!serviceId) {
      setSlotOverrides([]);
      return;
    }
    try {
      const { data } = await apiClient.get<SlotOverride[] | { results?: SlotOverride[] }>(
        `/reservation/slots/?service=${serviceId}&date_from=${today}`
      );
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setSlotOverrides(list);
    } catch {
      setSlotOverrides([]);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        await Promise.all([loadSettings(), loadProviders()]);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [loadProviders, loadSettings]);

  useEffect(() => {
    if (!selectedProvider) return;
    loadProviderData(selectedProvider).catch(() => {
      setServices([]);
      setWorkingHours([]);
      setTimeOffs([]);
    });
  }, [loadProviderData, selectedProvider]);

  useEffect(() => {
    if (!selectedService) return;
    loadSlots(selectedService);
  }, [loadSlots, selectedService]);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const { data } = await apiClient.patch<ReservationSettings>("/reservation/settings/", settings);
      setSettings(data);
      alert("تنظیمات ذخیره شد.");
    } catch {
      alert("ذخیره تنظیمات انجام نشد.");
    } finally {
      setSavingSettings(false);
    }
  };

  const addWorkingHour = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProvider) return;
    try {
      await apiClient.post("/reservation/working-hours/", {
        provider: selectedProvider,
        weekday: Number(workingHourForm.weekday),
        start_time: workingHourForm.start_time,
        end_time: workingHourForm.end_time,
        slot_capacity: Number(workingHourForm.slot_capacity || 1),
        is_active: workingHourForm.is_active,
      });
      await loadProviderData(selectedProvider);
    } catch {
      alert("ثبت ساعت کاری انجام نشد.");
    }
  };

  const removeWorkingHour = async (id: string) => {
    if (!confirm("این بازه ساعت کاری حذف شود؟")) return;
    try {
      await apiClient.delete(`/reservation/working-hours/${id}/`);
      setWorkingHours((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("حذف ساعت کاری انجام نشد.");
    }
  };

  const addTimeOff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProvider || !timeOffForm.date) return;

    try {
      await apiClient.post("/reservation/time-offs/", {
        provider: selectedProvider,
        date: timeOffForm.date,
        title: timeOffForm.title,
        is_full_day: timeOffForm.is_full_day,
        start_time: timeOffForm.is_full_day ? null : timeOffForm.start_time || null,
        end_time: timeOffForm.is_full_day ? null : timeOffForm.end_time || null,
        is_active: timeOffForm.is_active,
      });
      await loadProviderData(selectedProvider);
    } catch {
      alert("ثبت تعطیلی انجام نشد.");
    }
  };

  const removeTimeOff = async (id: string) => {
    if (!confirm("این تعطیلی حذف شود؟")) return;
    try {
      await apiClient.delete(`/reservation/time-offs/${id}/`);
      setTimeOffs((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("حذف تعطیلی انجام نشد.");
    }
  };

  const addSlotOverride = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!slotForm.service) return;

    try {
      await apiClient.post("/reservation/slots/", {
        service: slotForm.service,
        date: slotForm.date,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        capacity: Number(slotForm.capacity || 1),
        is_active: slotForm.is_active,
      });
      await loadSlots(slotForm.service);
    } catch {
      alert("ثبت ظرفیت دستی انجام نشد.");
    }
  };

  const removeSlotOverride = async (id: string) => {
    if (!confirm("این ظرفیت دستی حذف شود؟")) return;
    try {
      await apiClient.delete(`/reservation/slots/${id}/`);
      setSlotOverrides((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("حذف ظرفیت دستی انجام نشد.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">در حال بارگذاری تنظیمات رزرواسیون...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">ظرفیت و تقویم رزرو</h1>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Save className="w-5 h-5" />
          تنظیمات عمومی رزرواسیون
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>منطقه زمانی</label>
            <input
              className={inputClass}
              value={settings.timezone}
              onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>فاصله اسلات (دقیقه)</label>
            <input
              type="number"
              min={5}
              className={inputClass}
              value={settings.slot_interval_minutes}
              onChange={(e) => setSettings((prev) => ({ ...prev, slot_interval_minutes: Number(e.target.value || 30) }))}
            />
          </div>
          <div>
            <label className={labelClass}>بازه مجاز رزرو (روز)</label>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={settings.booking_window_days}
              onChange={(e) => setSettings((prev) => ({ ...prev, booking_window_days: Number(e.target.value || 30) }))}
            />
          </div>
          <div>
            <label className={labelClass}>حداقل زمان قبل رزرو (دقیقه)</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={settings.min_advance_minutes}
              onChange={(e) => setSettings((prev) => ({ ...prev, min_advance_minutes: Number(e.target.value || 0) }))}
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={settings.use_public_holidays}
            onChange={(e) => setSettings((prev) => ({ ...prev, use_public_holidays: e.target.checked }))}
          />
          استفاده از تقویم تعطیلات عمومی (تعریف‌شده توسط ادمین سیستم)
        </label>

        <div>
          <button
            type="button"
            onClick={saveSettings}
            disabled={savingSettings}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingSettings ? "در حال ذخیره..." : "ذخیره تنظیمات"}
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-bold">انتخاب ارائه‌دهنده</h2>
        <div className="max-w-md">
          <label className={labelClass}>ارائه‌دهنده</label>
          <select
            className={inputClass}
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            <option value="">انتخاب کنید</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.title} {provider.is_active ? "" : "(غیرفعال)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProvider && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock3 className="w-5 h-5" />
              ساعات کاری {selectedProviderTitle}
            </h3>

            <form onSubmit={addWorkingHour} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>روز هفته</label>
                <select
                  className={inputClass}
                  value={workingHourForm.weekday}
                  onChange={(e) => setWorkingHourForm((prev) => ({ ...prev, weekday: e.target.value }))}
                >
                  {weekdays.map((weekday) => (
                    <option key={weekday.value} value={String(weekday.value)}>
                      {weekday.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>ظرفیت هر اسلات</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={workingHourForm.slot_capacity}
                  onChange={(e) => setWorkingHourForm((prev) => ({ ...prev, slot_capacity: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>شروع</label>
                <input
                  type="time"
                  className={inputClass}
                  value={workingHourForm.start_time}
                  onChange={(e) => setWorkingHourForm((prev) => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>پایان</label>
                <input
                  type="time"
                  className={inputClass}
                  value={workingHourForm.end_time}
                  onChange={(e) => setWorkingHourForm((prev) => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
              <label className="md:col-span-2 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={workingHourForm.is_active}
                  onChange={(e) => setWorkingHourForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
                فعال
              </label>
              <button type="submit" className="btn-primary md:col-span-2 inline-flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                افزودن ساعت کاری
              </button>
            </form>

            <div className="space-y-2">
              {workingHours.length === 0 ? (
                <p className="text-sm text-gray-500">ساعتی ثبت نشده است.</p>
              ) : (
                workingHours.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2">
                    <div className="text-sm">
                      <span className="font-semibold">{weekdays.find((day) => day.value === item.weekday)?.label}</span>
                      <span className="mx-2">|</span>
                      <span>
                        {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                      </span>
                      <span className="mx-2">|</span>
                      <span>ظرفیت: {item.slot_capacity}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWorkingHour(item.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              تعطیلات و مرخصی {selectedProviderTitle}
            </h3>

            <form onSubmit={addTimeOff} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>تاریخ</label>
                <input
                  type="date"
                  className={inputClass}
                  value={timeOffForm.date}
                  onChange={(e) => setTimeOffForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>عنوان (اختیاری)</label>
                <input
                  className={inputClass}
                  value={timeOffForm.title}
                  onChange={(e) => setTimeOffForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="مثلاً: مرخصی شخصی"
                />
              </div>
              <label className="md:col-span-2 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={timeOffForm.is_full_day}
                  onChange={(e) => setTimeOffForm((prev) => ({ ...prev, is_full_day: e.target.checked }))}
                />
                تعطیلی کامل روز
              </label>

              {!timeOffForm.is_full_day && (
                <>
                  <div>
                    <label className={labelClass}>از ساعت</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={timeOffForm.start_time}
                      onChange={(e) => setTimeOffForm((prev) => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>تا ساعت</label>
                    <input
                      type="time"
                      className={inputClass}
                      value={timeOffForm.end_time}
                      onChange={(e) => setTimeOffForm((prev) => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn-primary md:col-span-2 inline-flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                افزودن تعطیلی
              </button>
            </form>

            <div className="space-y-2">
              {timeOffs.length === 0 ? (
                <p className="text-sm text-gray-500">تعطیلی‌ای ثبت نشده است.</p>
              ) : (
                timeOffs.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2">
                    <div className="text-sm">
                      <span className="font-semibold">{item.date}</span>
                      <span className="mx-2">|</span>
                      <span>{item.title || "بدون عنوان"}</span>
                      <span className="mx-2">|</span>
                      <span>
                        {item.is_full_day
                          ? "تمام روز"
                          : `${(item.start_time || "").slice(0, 5)} - ${(item.end_time || "").slice(0, 5)}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTimeOff(item.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProvider && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-bold">ظرفیت دستی برای بازه‌های خاص</h2>

          <form onSubmit={addSlotOverride} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>سرویس</label>
              <select
                className={inputClass}
                value={slotForm.service}
                onChange={(e) => {
                  setSlotForm((prev) => ({ ...prev, service: e.target.value }));
                  setSelectedService(e.target.value);
                }}
                required
              >
                <option value="">انتخاب کنید</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.title} {service.is_active ? "" : "(غیرفعال)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>تاریخ</label>
              <input
                type="date"
                className={inputClass}
                value={slotForm.date}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass}>ظرفیت</label>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={slotForm.capacity}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, capacity: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>شروع</label>
              <input
                type="time"
                className={inputClass}
                value={slotForm.start_time}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className={labelClass}>پایان</label>
              <input
                type="time"
                className={inputClass}
                value={slotForm.end_time}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mt-8">
              <input
                type="checkbox"
                checked={slotForm.is_active}
                onChange={(e) => setSlotForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              فعال
            </label>
            <button type="submit" className="btn-primary lg:col-span-3 inline-flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              افزودن ظرفیت دستی
            </button>
          </form>

          <div className="space-y-2">
            {slotOverrides.length === 0 ? (
              <p className="text-sm text-gray-500">برای این سرویس ظرفیت دستی ثبت نشده است.</p>
            ) : (
              slotOverrides.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2">
                  <div className="text-sm">
                    <span className="font-semibold">{item.service.title}</span>
                    <span className="mx-2">|</span>
                    <span>{item.date}</span>
                    <span className="mx-2">|</span>
                    <span>
                      {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                    </span>
                    <span className="mx-2">|</span>
                    <span>ظرفیت: {item.capacity}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSlotOverride(item.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
