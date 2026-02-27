"use client";

import { useState, FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { faTelegram } from "@fortawesome/free-brands-svg-icons";
import { submitSupportRequest } from "@/lib/api";

function validatePhone(phone: string) {
  return /^(\+98|0)?9\d{9}$/.test((phone || "").trim());
}

export function Contact() {
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value.trim();
    const type = (form.elements.namedItem("type") as HTMLSelectElement)?.value;
    const msg = (form.elements.namedItem("message") as HTMLTextAreaElement)?.value.trim();

    if (!name || !phone || !validatePhone(phone)) {
      setStatus("لطفاً نام و شماره تماس معتبر وارد کنید.");
      return;
    }

    setSubmitting(true);
    setStatus("در حال ارسال...");

    try {
      await submitSupportRequest({ name, phone, type, message: msg });
      setStatus("درخواست با موفقیت ثبت شد. تیم توکان به‌زودی با شما تماس خواهد گرفت.");
      form.reset();
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { detail?: unknown } };
      if (e?.status === 429) {
        setStatus("تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید.");
      } else if (e?.data && typeof e.data === "object" && "detail" in e.data) {
        const d = e.data.detail;
        if (typeof d === "string") {
          setStatus(d);
        } else if (Array.isArray(d)) {
          setStatus((d as string[]).join(" "));
        } else if (d && typeof d === "object") {
          // DRF validation errors: { field: ["error msg"] }
          const parts = Object.entries(d as Record<string, string[]>)
            .flatMap(([, msgs]) => msgs);
          setStatus(parts.join(" ") || "لطفاً فیلدها را صحیح پر کنید.");
        } else {
          setStatus("خطا در ارسال. لطفاً دوباره تلاش کنید.");
        }
      } else {
        setStatus("خطا در ارسال. لطفاً دوباره تلاش کنید یا از تلگرام استفاده کنید.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 md:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900">
              آماده‌ایم کسب‌وکار شما را توسعه بدهیم
            </h2>
            <p className="mt-3 text-slate-600 leading-8">
              سریع‌ترین راه تماس، پیام در تلگرام است. اگر ترجیح می‌دهید تماس بگیریم، فرم روبرو را پر کنید.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              <a
                href="https://t.me/tokan_app"
                target="_blank"
                rel="noreferrer"
                className="glass rounded-3xl p-5 hover:bg-slate-50 transition border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl btn-grad flex items-center justify-center shadow-soft">
                    <FontAwesomeIcon icon={faTelegram} className="text-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900">تلگرام</div>
                    <div className="text-sm text-slate-600">t.me/tokan_app</div>
                  </div>
                </div>
              </a>

              <a
                href="#contact"
                className="glass rounded-3xl p-5 hover:bg-slate-50 transition border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl btn-grad flex items-center justify-center shadow-soft">
                    <FontAwesomeIcon icon={faEnvelope} className="text-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900">فرم درخواست</div>
                    <div className="text-sm text-slate-600">ثبت درخواست مشاوره و تماس</div>
                  </div>
                </div>
              </a>
            </div>
          </div>

          <div className="glass rounded-[2.2rem] p-6 md:p-8 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">فرم درخواست</h3>
              <span className="text-xs text-slate-600">{status}</span>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="leadName" className="text-sm text-slate-700">
                    نام و نام خانوادگی
                  </label>
                  <input
                    id="leadName"
                    name="name"
                    className="mt-2 w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus-ring text-slate-900 focus:outline-none"
                    placeholder="مثلاً محمد رضایی"
                  />
                </div>
                <div>
                  <label htmlFor="leadPhone" className="text-sm text-slate-700">
                    شماره تماس
                  </label>
                  <input
                    id="leadPhone"
                    name="phone"
                    dir="ltr"
                    className="mt-2 w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus-ring text-slate-900 focus:outline-none"
                    placeholder="09xxxxxxxxx"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="leadType" className="text-sm text-slate-700">
                  نوع کسب‌وکار
                </label>
                <select
                  id="leadType"
                  name="type"
                  className="mt-2 w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus-ring text-slate-900 focus:outline-none"
                >
                  <option value="محصول فیزیکی">محصول فیزیکی</option>
                  <option value="محصول دیجیتال">محصول دیجیتال</option>
                  <option value="خدمات">خدمات (رزرو/ثبت‌نام/پیش‌خرید)</option>
                  <option value="سایر">سایر</option>
                </select>
              </div>
              <div>
                <label htmlFor="leadMessage" className="text-sm text-slate-700">
                  توضیحات
                </label>
                <textarea
                  id="leadMessage"
                  name="message"
                  rows={4}
                  className="mt-2 w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 focus-ring text-slate-900 focus:outline-none"
                  placeholder="کمی درباره نیاز و هدف‌تان بنویسید..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 rounded-2xl btn-grad font-extrabold text-white shadow-soft disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? "در حال ارسال..." : "ارسال درخواست"}
                <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
              </button>

              <p className="text-xs text-slate-500 leading-6">
                درخواست شما به تیم توکان ارسال می‌شود و در اسرع وقت با شما تماس گرفته خواهد شد.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
