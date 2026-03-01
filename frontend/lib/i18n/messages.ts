import { pickByLocale } from "./localize";
import type { SupportedLocale } from "./deployment";

type MessageMap = Record<SupportedLocale, string>;

const FRONTEND_MESSAGES = {
  "app.layout.title": {
    fa: "فروشگاه توکان",
    en: "Tokan Store",
  },
  "app.layout.description": {
    fa: "فروشگاه آنلاین",
    en: "Online Store",
  },
  "error.404.title": {
    fa: "صفحه پیدا نشد",
    en: "Page Not Found",
  },
  "error.404.description": {
    fa: "متأسفانه صفحه‌ای که دنبالش هستید وجود ندارد.",
    en: "The page you are looking for does not exist.",
  },
  "error.500.title": {
    fa: "خطای سرور",
    en: "Server Error",
  },
  "error.500.description": {
    fa: "متأسفانه خطایی در سرور رخ داده است. لطفاً کمی بعد دوباره تلاش کنید.",
    en: "A server error occurred. Please try again later.",
  },
  "error.403.title": {
    fa: "دسترسی غیرمجاز",
    en: "Access Denied",
  },
  "error.403.description": {
    fa: "شما به این بخش دسترسی ندارید.",
    en: "You do not have access to this section.",
  },
  "error.backToHome": {
    fa: "بازگشت به صفحه اصلی",
    en: "Back to Home",
  },
  "subscription.expired.title": {
    fa: "اشتراک فروشگاه منقضی شده",
    en: "Store Subscription Expired",
  },
  "subscription.expired.withStore": {
    fa: "اشتراک فروشگاه «{store}» به پایان رسیده است.",
    en: 'Subscription for store "{store}" has expired.',
  },
  "subscription.expired.withoutStore": {
    fa: "اشتراک این فروشگاه به پایان رسیده است.",
    en: "This store subscription has expired.",
  },
  "subscription.expired.contactAdmin": {
    fa: "لطفاً جهت تمدید با مدیر فروشگاه تماس بگیرید.",
    en: "Please contact the store admin for renewal.",
  },
  "subscription.expired.hint": {
    fa: "در صورت نیاز به تمدید، وارد پنل مدیریت فروشگاه شوید و از بخش اشتراک اقدام کنید.",
    en: "If needed, open the store admin panel and renew from the subscription section.",
  },
  "adminBar.dashboard": {
    fa: "داشبورد",
    en: "Dashboard",
  },
  "adminBar.products": {
    fa: "محصولات",
    en: "Products",
  },
  "adminBar.newProduct": {
    fa: "افزودن محصول",
    en: "New Product",
  },
  "adminBar.orders": {
    fa: "سفارشات",
    en: "Orders",
  },
  "adminBar.blog": {
    fa: "بلاگ",
    en: "Blog",
  },
  "adminBar.notifications": {
    fa: "اعلانات",
    en: "Notifications",
  },
  "adminBar.settings": {
    fa: "تنظیمات",
    en: "Settings",
  },
  "adminBar.storeDefault": {
    fa: "فروشگاه",
    en: "Store",
  },
  "adminBar.unreadAria": {
    fa: "{count} اعلان خوانده نشده",
    en: "{count} unread notifications",
  },
  "adminBar.openStoreNewTab": {
    fa: "مشاهده فروشگاه در تب جدید",
    en: "Open Store in New Tab",
  },
  "adminBar.viewStore": {
    fa: "مشاهده فروشگاه",
    en: "View Store",
  },
  "adminBar.menuClose": {
    fa: "بستن منو",
    en: "Close menu",
  },
  "adminBar.menuOpen": {
    fa: "باز کردن منو",
    en: "Open menu",
  },
  "widget.text.empty": {
    fa: "این ویجت متنی خالی است. عنوان/متن را از صفحه‌ساز ثبت کنید.",
    en: "This text widget is empty. Add title/body from the page builder.",
  },
  "widget.text.noBody": {
    fa: "متن بدنه ثبت نشده است.",
    en: "No body text provided.",
  },
  "widget.image.defaultAlt": {
    fa: "تصویر ویجت",
    en: "Widget image",
  },
  "widget.image.empty": {
    fa: "تصویری برای این ویجت انتخاب نشده است.",
    en: "No image selected for this widget.",
  },
} as const satisfies Record<string, MessageMap>;

export type FrontendMessageKey = keyof typeof FRONTEND_MESSAGES;

export function tFrontend(key: FrontendMessageKey, vars?: Record<string, string | number>): string {
  const template = pickByLocale(FRONTEND_MESSAGES[key]);
  if (!vars) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, token: string) => {
    const value = vars[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}
