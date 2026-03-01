import { pickByLocale } from "./i18n";
import type { SupportedLocale } from "./i18n";

type MessageMap = Record<SupportedLocale, string>;

const LANDING_MESSAGES = {
  "layout.title": {
    fa: "توکان | توسعه کسب‌وکار دیجیتال (طراحی سایت، سئو و رشد با AI)",
    en: "Tokan | Digital Business Growth (Web Design, SEO, AI Growth)",
  },
  "layout.description": {
    fa: "توکان؛ توسعه کسب‌وکار شما در کنار طراحی سایت و فروشگاه، سئو و رشد با بهره‌گیری از هوش مصنوعی.",
    en: "Tokan helps businesses grow with web/store design, SEO, and AI-powered execution.",
  },
  "layout.ogTitle": {
    fa: "توکان | توسعه کسب‌وکار دیجیتال",
    en: "Tokan | Digital Business Growth",
  },
  "layout.ogDescription": {
    fa: "طراحی سایت و فروشگاه، سئو و رشد کسب‌وکار با کمک هوش مصنوعی. پلن‌های اشتراکی شفاف و پکیج‌های تکمیلی.",
    en: "Web/store design, SEO, and AI-driven growth with transparent subscription plans.",
  },
  "blog.layout.title": {
    fa: "بلاگ توکان | مطالب آموزشی و خبری",
    en: "Tokan Blog | Articles & Updates",
  },
  "blog.layout.description": {
    fa: "مطالب آموزشی درباره فروشگاه آنلاین، سئو، رشد کسب‌وکار و راهنمای استفاده از توکان.",
    en: "Educational content about ecommerce, SEO, business growth, and Tokan guides.",
  },
  "blog.layout.ogDescription": {
    fa: "مطالب آموزشی درباره فروشگاه آنلاین، سئو و رشد کسب‌وکار با توکان.",
    en: "Articles about online stores, SEO, and growth strategies with Tokan.",
  },
} as const satisfies Record<string, MessageMap>;

export type LandingMessageKey = keyof typeof LANDING_MESSAGES;

export function tLanding(key: LandingMessageKey): string {
  return pickByLocale(LANDING_MESSAGES[key]);
}
