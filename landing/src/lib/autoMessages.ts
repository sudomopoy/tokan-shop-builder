import { pickByLocale } from "./i18n";
import type { SupportedLocale } from "./i18n";

type MessageMap = Record<SupportedLocale, string>;

const AUTO_MESSAGES: Record<string, MessageMap> = {
  "ld.02f8976a2677": {
    "en": "Enter the rejection reason.",
    "fa": "دلیل رد را وارد کنید."
  },
  "ld.073b8cc0d5b2": {
    "en": "Enter the address",
    "fa": "آدرس را وارد کنید"
  },
  "ld.09a9b6bdec33": {
    "en": "Total purchase",
    "fa": "کل خرید"
  },
  "ld.0ef7f18ca905": {
    "en": "Loading...",
    "fa": "در حال بارگذاری..."
  },
  "ld.0fb874d2b597": {
    "en": "Your stores",
    "fa": "فروشگاه‌های شما"
  },
  "ld.0ff103c10f5f": {
    "en": "Shop slogan",
    "fa": "شعار فروشگاه"
  },
  "ld.11ac49c0ec12": {
    "en": "You have not created a store yet.",
    "fa": "هنوز فروشگاهی نساخته‌اید."
  },
  "ld.12ddfc5c54df": {
    "en": "Rejection reason (shown to the user)",
    "fa": "دلیل رد (نمایش به کاربر)"
  },
  "ld.18ec78dc6258": {
    "en": "date",
    "fa": "تاریخ"
  },
  "ld.19fe1e3869fe": {
    "en": "The invitees",
    "fa": "دعوت‌شده‌ها"
  },
  "ld.1d190755e8fa": {
    "en": "Wallet balance",
    "fa": "موجودی کیف پول"
  },
  "ld.1e080ec0bd98": {
    "en": "My stores",
    "fa": "فروشگاه‌های من"
  },
  "ld.1e80c808c45a": {
    "en": "Example: National",
    "fa": "مثال: ملی"
  },
  "ld.1f8273d56b74": {
    "en": "Temporary store address (for site preview) *",
    "fa": "آدرس موقت فروشگاه (برای پیش نمایش سایت) *"
  },
  "ld.1fea1cfd1dcd": {
    "en": "income",
    "fa": "درآمد"
  },
  "ld.234960f09ab2": {
    "en": "Additional services",
    "fa": "خدمات تکمیلی"
  },
  "ld.252f8954331c": {
    "en": "Name of the account holder",
    "fa": "نام صاحب حساب"
  },
  "ld.294d0f7d2f23": {
    "en": "Name of the bank",
    "fa": "نام بانک"
  },
  "ld.2b93d74458a4": {
    "en": "Type of store",
    "fa": "نوع فروشگاه"
  },
  "ld.2f24afaef65c": {
    "en": "port",
    "fa": "درگاه"
  },
  "ld.302e7e2564d0": {
    "en": "My withdrawal requests",
    "fa": "درخواست‌های برداشت من"
  },
  "ld.321f3a487460": {
    "en": "Features",
    "fa": "ویژگی‌ها"
  },
  "ld.32a7c1ba16f6": {
    "en": "Description of the request",
    "fa": "توضیحات درخواست"
  },
  "ld.333bd6682203": {
    "en": "Digital product",
    "fa": "محصول دیجیتال"
  },
  "ld.3599a9b4c677": {
    "en": "Description",
    "fa": "توضیحات"
  },
  "ld.35dad3df2dd6": {
    "en": "Fast start, real growth",
    "fa": "شروع سریع، رشد واقعی"
  },
  "ld.36ae3acad518": {
    "en": "Registration of consultation requests and calls",
    "fa": "ثبت درخواست مشاوره و تماس"
  },
  "ld.37313fd7bc42": {
    "en": "amount",
    "fa": "مبلغ"
  },
  "ld.3904540af465": {
    "en": "Withdrawal request details",
    "fa": "جزئیات درخواست برداشت"
  },
  "ld.3a67a31c0da7": {
    "en": "Date of registration",
    "fa": "تاریخ ثبت"
  },
  "ld.3af7576fd554": {
    "en": "to close",
    "fa": "بستن"
  },
  "ld.3b7717fa1f36": {
    "en": "The article was not found or you do not have access to it.",
    "fa": "مطلب یافت نشد یا دسترسی به آن ندارید."
  },
  "ld.3f5adfa99833": {
    "en": "Enter the deposit ID.",
    "fa": "شناسه واریز را وارد کنید."
  },
  "ld.41faead2eaa0": {
    "en": "Error loading content. Please try again.",
    "fa": "خطا در بارگذاری مطالب. لطفاً دوباره تلاش کنید."
  },
  "ld.4219bbd62390": {
    "en": "Quick access",
    "fa": "دسترسی سریع"
  },
  "ld.42634319b399": {
    "en": "Physical product",
    "fa": "محصول فیزیکی"
  },
  "ld.42795967f525": {
    "en": "Withdrawal balance",
    "fa": "موجودی قابل برداشت"
  },
  "ld.46e355a2ea63": {
    "en": "Shop appearance and theme",
    "fa": "ظاهر و تم فروشگاه"
  },
  "ld.472b105ad7a8": {
    "en": "Toucan growth map",
    "fa": "نقشه رشد توکان"
  },
  "ld.475d0b03d6db": {
    "en": "slogan and description (optional)",
    "fa": "شعار و توضیحات (اختیاری)"
  },
  "ld.48d07d34a8c4": {
    "en": "You haven't invited anyone yet.",
    "fa": "هنوز کسی را دعوت نکرده‌اید."
  },
  "ld.4cd64b7b4f67": {
    "en": "Nothing has been published yet.",
    "fa": "هنوز مطلبی منتشر نشده است."
  },
  "ld.4edfab294089": {
    "en": "For example, the best quality",
    "fa": "مثلاً بهترین کیفیت"
  },
  "ld.51c79fdba653": {
    "en": "Cash payment:",
    "fa": "پرداخت نقدی:"
  },
  "ld.52a4b6088fa6": {
    "en": "123456",
    "fa": "۱۲۳۴۵۶"
  },
  "ld.537285dd636c": {
    "en": "The address is not valid or already registered",
    "fa": "آدرس قابل استفاده نیست یا قبلاً ثبت شده"
  },
  "ld.54e23ee506ec": {
    "en": "You can pay part of the amount from the wallet balance (if any).",
    "fa": "می‌توانید بخشی از مبلغ را از موجودی کیف پول (در صورت وجود) پرداخت کنید."
  },
  "ld.56e8e8e08db4": {
    "en": "Operation",
    "fa": "عملیات"
  },
  "ld.578fd5f60650": {
    "en": "withdrawal amount (tomans)",
    "fa": "مبلغ برداشت (تومان)"
  },
  "ld.584cd947eae4": {
    "en": "mobile number",
    "fa": "شماره موبایل"
  },
  "ld.59bfa1695af0": {
    "en": "Building a store",
    "fa": "ساخت فروشگاه"
  },
  "ld.65336224ad14": {
    "en": "other",
    "fa": "سایر"
  },
  "ld.658af6eabe6b": {
    "en": "From design to sales and leads",
    "fa": "از طراحی تا فروش و لید"
  },
  "ld.6b6bd849eb8a": {
    "en": "deposited",
    "fa": "واریز شده"
  },
  "ld.6fca2ef51aae": {
    "en": "09123456789",
    "fa": "۰۹۱۲۳۴۵۶۷۸۹"
  },
  "ld.7058385deda5": {
    "en": "Digital business development",
    "fa": "توسعه کسب‌وکار دیجیتال"
  },
  "ld.76cde86bc064": {
    "en": "Write a little about your needs and goals...",
    "fa": "کمی درباره نیاز و هدف‌تان بنویسید..."
  },
  "ld.77b3f6238afd": {
    "en": "Application form",
    "fa": "فرم درخواست"
  },
  "ld.77e8ae85e214": {
    "en": "Invite and earn money",
    "fa": "دعوت و کسب درآمد"
  },
  "ld.789b8e0f52ff": {
    "en": "Deposit ID",
    "fa": "شناسه واریز"
  },
  "ld.7c12525e98e8": {
    "en": "Commission",
    "fa": "کمیسیون"
  },
  "ld.7ebe6037b53b": {
    "en": "Awaiting deposit",
    "fa": "در انتظار واریز"
  },
  "ld.7fb7f6a417ef": {
    "en": "For example, my store",
    "fa": "مثلاً فروشگاه من"
  },
  "ld.816224c194a3": {
    "en": "Write about the store...",
    "fa": "درباره فروشگاه بنویسید..."
  },
  "ld.8444c94aee74": {
    "en": "Tucan wallet",
    "fa": "کیف پول توکان"
  },
  "ld.88270442599b": {
    "en": "account holder",
    "fa": "صاحب حساب"
  },
  "ld.88279e5a4f0c": {
    "en": "Installment payment:",
    "fa": "پرداخت اقساطی:"
  },
  "ld.88e200db6300": {
    "en": "Choose the theme you want (free themes only)",
    "fa": "تم مورد نظر خود را انتخاب کنید (فقط تم‌های رایگان)"
  },
  "ld.88fa68c71c4a": {
    "en": "Shaba/card number",
    "fa": "شماره شبا/کارت"
  },
  "ld.8a6c594d95c6": {
    "en": "selected",
    "fa": "انتخاب شده"
  },
  "ld.8cd9ad8fbfb2": {
    "en": "status",
    "fa": "وضعیت"
  },
  "ld.8ff6c868762a": {
    "en": "Dashboard",
    "fa": "داشبورد"
  },
  "ld.93fbaf189179": {
    "en": "10000",
    "fa": "۱۰۰۰۰"
  },
  "ld.94d08fed5030": {
    "en": "For example, Mohammad Rezaei",
    "fa": "مثلاً محمد رضایی"
  },
  "ld.952f20eca6d5": {
    "en": "invitation link",
    "fa": "لینک دعوت"
  },
  "ld.967ef7cba32e": {
    "en": "Subscription plan",
    "fa": "پلن اشتراک"
  },
  "ld.968db26bbbb5": {
    "en": "10% discount",
    "fa": "۱۰٪ تخفیف"
  },
  "ld.973d53486906": {
    "en": "amount (tomans)",
    "fa": "مبلغ (تومان)"
  },
  "ld.989871906ce6": {
    "en": "Toucan",
    "fa": "توکان"
  },
  "ld.991cebd4036a": {
    "en": "Setting up a store",
    "fa": "راه‌اندازی فروشگاه"
  },
  "ld.9c9772dc607f": {
    "en": "bank",
    "fa": "بانک"
  },
  "ld.9f39d0a1d69a": {
    "en": "Rejection reason (required, displayed to the user)",
    "fa": "دلیل رد (الزامی، به کاربر نمایش داده می‌شود)"
  },
  "ld.9f8505043369": {
    "en": "Rupomeda",
    "fa": "روپومدا"
  },
  "ld.9ff45b9e8362": {
    "en": "Specialized clothing store",
    "fa": "فروشگاه تخصصی پوشاک"
  },
  "ld.a01c868d5672": {
    "en": "Store name *",
    "fa": "نام فروشگاه *"
  },
  "ld.a2b47c55f333": {
    "en": "golden",
    "fa": "طلایی"
  },
  "ld.a77bb516a61e": {
    "en": "This address is used to preview your site",
    "fa": "این آدرس برای پیش‌نمایش سایت شما استفاده می‌شود"
  },
  "ld.a96088fccdfb": {
    "en": "Toucan logo",
    "fa": "لوگوی توکان"
  },
  "ld.ad47ad74ea53": {
    "en": "New content coming soon...",
    "fa": "به زودی مطالب جدید..."
  },
  "ld.b463640ce27b": {
    "en": "Latest transactions",
    "fa": "آخرین تراکنش‌ها"
  },
  "ld.b8a9bbd5e672": {
    "en": "(first installment in cash) by sending a purple fisherman's check",
    "fa": "(قسط اول نقدی) با ارسال چک صیادی بنفش"
  },
  "ld.b99b04a45d63": {
    "en": "Temporary store address",
    "fa": "آدرس موقت فروشگاه"
  },
  "ld.bae2448cc2df": {
    "en": "user",
    "fa": "کاربر"
  },
  "ld.bee140eafd7c": {
    "en": "Deposited income",
    "fa": "درآمد واریز شده"
  },
  "ld.c11eba505257": {
    "en": "Services (reservation/registration/advance purchase)",
    "fa": "خدمات (رزرو/ثبت‌نام/پیش‌خرید)"
  },
  "ld.c3fdf928f53b": {
    "en": "50000",
    "fa": "۵۰۰۰۰"
  },
  "ld.c682022d6ac6": {
    "en": "choose",
    "fa": "انتخاب کنید"
  },
  "ld.c96c39703bba": {
    "en": "Verification code (5 digits)",
    "fa": "کد تایید (۵ رقم)"
  },
  "ld.cf1a31f63e99": {
    "en": "Telegram",
    "fa": "تلگرام"
  },
  "ld.d0f1ac7134b4": {
    "en": "Description (optional)",
    "fa": "توضیحات (اختیاری)"
  },
  "ld.d17cbbf65084": {
    "en": "Store information",
    "fa": "اطلاعات فروشگاه"
  },
  "ld.d2867c59a74e": {
    "en": "4 installments",
    "fa": "۴ قسط"
  },
  "ld.d2d7bab75fc7": {
    "en": "reason for rejection",
    "fa": "دلیل رد"
  },
  "ld.d3fe4e578ef6": {
    "en": "✓ The address can be used",
    "fa": "✓ آدرس قابل استفاده است"
  },
  "ld.d565c1605b8e": {
    "en": "No request has been registered yet.",
    "fa": "هنوز درخواستی ثبت نشده است."
  },
  "ld.d5724ce5b495": {
    "en": "Shaba number or card",
    "fa": "شماره شبا یا کارت"
  },
  "ld.daabf47534bb": {
    "en": "invitation code",
    "fa": "کد دعوت"
  },
  "ld.dd0c4a652bea": {
    "en": "This request has already been processed.",
    "fa": "این درخواست قبلاً پردازش شده است."
  },
  "ld.de016f802cab": {
    "en": "Follow the steps to get your store ready",
    "fa": "مراحل را طی کنید تا فروشگاهتان آماده شود"
  },
  "ld.e8ada2da697a": {
    "en": "Payment terms",
    "fa": "شرایط پرداخت"
  },
  "ld.edaa9b5678f1": {
    "en": "The address of the article has not been specified.",
    "fa": "آدرس مطلب مشخص نشده است."
  },
  "ld.ef1483d1edd0": {
    "en": "Login to the management panel",
    "fa": "ورود به پنل مدیریت"
  },
  "ld.ef521ff7bf99": {
    "en": "normal",
    "fa": "عادی"
  },
  "ld.f11234658209": {
    "en": "No theme found (default theme is used)",
    "fa": "تمی یافت نشد (تم پیش‌فرض استفاده می‌شود)"
  },
  "ld.ffb1dfa1f2cd": {
    "en": "Request not found.",
    "fa": "درخواست یافت نشد."
  }
};

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, token: string) => {
    const value = vars[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}

export function tLandingAuto(key: string, vars?: Record<string, string | number>): string {
  const record = AUTO_MESSAGES[key];
  if (!record) return key;
  return interpolate(pickByLocale(record), vars);
}
