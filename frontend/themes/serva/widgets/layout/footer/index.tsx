"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { storeApi, getStoreSetting } from "@/lib/api";
import type { StoreDetail } from "@/lib/api/storeApi";
import { faClock, faCube, faEnvelope, faMapMarkerAlt, faPhone } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faLinkedinIn, faTelegram, faTwitter, faWhatsapp } from "@fortawesome/free-brands-svg-icons";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toPersianDigits = (str: string): string =>
  str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)] ?? d);

const formatPhoneDisplay = (raw: string): string => {
  let s = raw.replace(/\s/g, "");
  s = s.replace(/^\+98/, "").replace(/^0098/, "").replace(/^98/, "");
  if (s.startsWith("0")) return toPersianDigits(s);
  if (/^9\d{9}$/.test(s)) return toPersianDigits(`0${s}`);
  return toPersianDigits(s);
};

const SOCIAL_KEYS = [
  { key: "social_instagram_url", icon: faInstagram, label: "instagram" },
  { key: "social_telegram_url", icon: faTelegram, label: "telegram" },
  { key: "social_whatsapp_url", icon: faWhatsapp, label: "whatsapp" },
  { key: "social_twitter_url", icon: faTwitter, label: "twitter" },
  { key: "social_linkedin_url", icon: faLinkedinIn, label: "linkedin" },
] as const;

const DEFAULT_DESCRIPTION =
  "فروشگاه اینترنتی با هدف ارائه بهترین محصولات با قیمتی رقابتی و خدماتی متمایز فعالیت خود را آغاز کرده است.";
const DEFAULT_SLOGAN = "۷ روز هفته، ۲۴ ساعته پاسخگوی شما هستیم";

export default function ServaFooter() {
  const [store, setStore] = useState<StoreDetail | null>(null);

  useEffect(() => {
    let isMounted = true;
    storeApi
      .getCurrentStore()
      .then((s) => {
        if (!isMounted) return;
        setStore(s);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const siteTitle = store?.title?.trim() || "سِروا";
  const description =
    (store?.description?.trim() || "").length > 0
      ? store!.description!.trim()
      : DEFAULT_DESCRIPTION.replace("فروشگاه اینترنتی", `فروشگاه اینترنتی ${siteTitle}`);
  const slogan = store?.slogan?.trim() || DEFAULT_SLOGAN;
  const phone = getStoreSetting(store, "store_phone");
  const email = getStoreSetting(store, "store_email");
  const address = getStoreSetting(store, "store_address");
  const enamadUrl = getStoreSetting(store, "trust_enamad_url");
  const samandehiUrl = getStoreSetting(store, "trust_samandehi_url");
  const socialLinks = SOCIAL_KEYS.map(({ key, icon, label }) => ({
    url: getStoreSetting(store, key),
    icon,
    label,
  })).filter((s) => s.url);

  return (
    <footer className="bg-dark text-white pt-16 pb-8 border-t border-white/5">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            <Link href="/" className="text-2xl font-black text-white flex items-center gap-2 mb-6">
              <FontAwesomeIcon icon={faCube} className="text-primary text-3xl" />
              <span>{siteTitle}</span>
            </Link>
            <p className="text-gray-400 text-sm leading-7 mb-8 font-medium">
              {description}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-4">
                {socialLinks.map(({ url, icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-primary transition text-gray-400 hover:text-white"
                    aria-label={label}
                  >
                    <FontAwesomeIcon icon={icon} className="text-xl" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-white">خدمات مشتریان</h4>
            <ul className="space-y-3 text-gray-400 text-sm font-medium">
              <li>
                <Link href="/faq" className="hover:text-primary transition block hover:translate-x-1">
                  پاسخ به پرسش‌های متداول
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-primary transition block hover:translate-x-1">
                  رویه‌های بازگرداندن کالا
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition block hover:translate-x-1">
                  شرایط استفاده
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition block hover:translate-x-1">
                  حریم خصوصی
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-white">راهنمای خرید</h4>
            <ul className="space-y-3 text-gray-400 text-sm font-medium">
              <li>
                <a href="#" className="hover:text-primary transition block hover:translate-x-1">
                  نحوه ثبت سفارش
                </a>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary transition block hover:translate-x-1">
                  رویه ارسال سفارش
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition block hover:translate-x-1">
                  شیوه‌های پرداخت
                </a>
              </li>
              <li>
                <Link href="/order-tracking" className="hover:text-primary transition block hover:translate-x-1">
                  اطلاع از وضعیت سفارش
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6 text-white">اطلاعات تماس</h4>
            <ul className="space-y-4 text-gray-400 text-sm font-medium">
              {address && (
                <li className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary mt-1" />
                  <span>{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faPhone} className="text-primary" />
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="font-sans" dir="ltr">
                    {formatPhoneDisplay(phone)}
                  </a>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faEnvelope} className="text-primary" />
                  <a href={`mailto:${email}`} className="font-sans">
                    {email}
                  </a>
                </li>
              )}
              <li className="flex items-center gap-3">
                <FontAwesomeIcon icon={faClock} className="text-primary" />
                <span>{slogan}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-500 text-sm font-medium text-center md:text-right">
            تمامی حقوق مادی و معنوی این وب‌سایت محفوظ و متعلق به فروشگاه {siteTitle} می‌باشد. © ۱۴۰۴
          </p>

          {(enamadUrl || samandehiUrl) && (
            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl">
              {enamadUrl && (
                <a
                  href={enamadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 w-20 opacity-80 hover:opacity-100 transition cursor-pointer bg-white rounded-lg p-1 flex items-center justify-center text-gray-400 text-xs"
                >
                  نماد اعتماد
                </a>
              )}
              {samandehiUrl && (
                <a
                  href={samandehiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 w-20 opacity-80 hover:opacity-100 transition cursor-pointer bg-white rounded-lg p-1 flex items-center justify-center text-gray-400 text-xs"
                >
                  ساماندهی
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

