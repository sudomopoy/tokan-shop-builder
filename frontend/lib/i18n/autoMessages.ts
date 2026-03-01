import { pickByLocale } from "./localize";
import type { SupportedLocale } from "./deployment";

type MessageMap = Record<SupportedLocale, string>;

const AUTO_MESSAGES: Record<string, MessageMap> = {
  "fe.0071a54445eb": {
    "en": "Please select a shipping method.",
    "fa": "لطفاً روش ارسال را انتخاب کنید."
  },
  "fe.0093767757d9": {
    "en": "link",
    "fa": "لینک"
  },
  "fe.018ac9f161d9": {
    "en": "Search category name...",
    "fa": "نام دسته‌بندی را جستجو کنید..."
  },
  "fe.0223865b884e": {
    "en": "Error loading information. Please try again.",
    "fa": "خطا در بارگذاری اطلاعات. لطفا دوباره تلاش کنید."
  },
  "fe.0230582a53fd": {
    "en": "ID",
    "fa": "شناسه"
  },
  "fe.025a6f4fe202": {
    "en": "Product editing",
    "fa": "ویرایش محصول"
  },
  "fe.026461726e82": {
    "en": "Payment on the spot",
    "fa": "پرداخت در محل"
  },
  "fe.028ee2f28d20": {
    "en": "Menu not found",
    "fa": "منو یافت نشد"
  },
  "fe.0327e8a117e4": {
    "en": "Fast and timely delivery throughout the country",
    "fa": "تحویل سریع و به‌موقع در سراسر کشور"
  },
  "fe.034a1dce939a": {
    "en": "Error deleting address.",
    "fa": "خطا در حذف آدرس."
  },
  "fe.0423c6acd237": {
    "en": "Loading menu...",
    "fa": "در حال بارگیری منو..."
  },
  "fe.043d9dec7a79": {
    "en": "Contact number *",
    "fa": "شماره تماس *"
  },
  "fe.046848c29a29": {
    "en": "Online booking",
    "fa": "رزرو آنلاین"
  },
  "fe.049496c531b2": {
    "en": "Everything is ready!",
    "fa": "همه چیز آماده است!"
  },
  "fe.04c1464ec41f": {
    "en": "Order not found",
    "fa": "سفارش یافت نشد"
  },
  "fe.05a28b35a9a1": {
    "en": "Select the city",
    "fa": "انتخاب شهر"
  },
  "fe.06484316f783": {
    "en": "Layout type",
    "fa": "نوع چیدمان"
  },
  "fe.064b218af17a": {
    "en": "Product ID not specified.",
    "fa": "شناسه محصول مشخص نشده است."
  },
  "fe.077acf7a7f3d": {
    "en": "Are you sure you want to delete page \"{p1}\"?",
    "fa": "آیا از حذف صفحه «{p1}» اطمینان دارید؟"
  },
  "fe.07a738c2cfa5": {
    "en": "2",
    "fa": "۲"
  },
  "fe.07ae2a817ebe": {
    "en": "Does my product have variety?",
    "fa": "محصول من تنوع دارد؟"
  },
  "fe.082891e94766": {
    "en": "No content widgets yet.",
    "fa": "هنوز ویجت محتوا وجود ندارد."
  },
  "fe.0930d60af096": {
    "en": "(optional)",
    "fa": "(اختیاری)"
  },
  "fe.0bcea1084940": {
    "en": "income",
    "fa": "درآمد"
  },
  "fe.0c25f203ed98": {
    "en": "info@shop.ir",
    "fa": "info@shop.ir"
  },
  "fe.0c419c78a978": {
    "en": "Error receiving slider",
    "fa": "خطا در دریافت اسلایدر"
  },
  "fe.0cf54d7734d2": {
    "en": "Service:",
    "fa": "سرویس:"
  },
  "fe.0e0e08728689": {
    "en": "disabled",
    "fa": "غیرفعال"
  },
  "fe.0e54c662cf12": {
    "en": "default",
    "fa": "پیش‌فرض"
  },
  "fe.0ea012425367": {
    "en": "Main image",
    "fa": "تصویر اصلی"
  },
  "fe.0efc869315f1": {
    "en": "home",
    "fa": "خانه"
  },
  "fe.0f33881951ea": {
    "en": "Product tags",
    "fa": "تگ‌های محصولات"
  },
  "fe.0ff4e85d0645": {
    "en": "Editing the article",
    "fa": "ویرایش مقاله"
  },
  "fe.102da55e19a2": {
    "en": "choose...",
    "fa": "انتخاب کنید..."
  },
  "fe.104bd9ef1a68": {
    "en": "Error loading products.",
    "fa": "خطا در بارگذاری محصولات."
  },
  "fe.10a8e9a70913": {
    "en": "Title of the article",
    "fa": "عنوان مقاله"
  },
  "fe.1247ed1c1cd6": {
    "en": "soon",
    "fa": "به‌زودی"
  },
  "fe.134fcb626282": {
    "en": "Guaranteeing the authenticity and physical health of products",
    "fa": "تضمین اصالت و سلامت فیزیکی محصولات"
  },
  "fe.13745bdc4e8c": {
    "en": "There is a problem creating a payment request.",
    "fa": "مشکلی در ایجاد درخواست پرداخت وجود دارد."
  },
  "fe.13ba7caa6bea": {
    "en": "Ordering the initial setup of the website",
    "fa": "سفارش راه‌اندازی اولیه وب‌سایت"
  },
  "fe.13c242c40a55": {
    "en": ", keyPath: string, value: unknown): Record",
    "fa": "، مسیر کلید: رشته، مقدار: ناشناخته): ضبط"
  },
  "fe.13d6bbbc4b88": {
    "en": "Error loading content. Please try again.",
    "fa": "خطا در بارگذاری مطالب. لطفا دوباره تلاش کنید."
  },
  "fe.13f576e67a03": {
    "en": "Field type",
    "fa": "نوع فیلد"
  },
  "fe.148cf7f75ec1": {
    "en": "Domain and address",
    "fa": "دامنه و آدرس"
  },
  "fe.14d33b52d34c": {
    "en": "Total goods:",
    "fa": "جمع کل کالاها:"
  },
  "fe.14d54aea5b9e": {
    "en": "Slogan",
    "fa": "شعار"
  },
  "fe.153f80bfa5f8": {
    "en": "Quick and professional answers to your questions",
    "fa": "پاسخ‌گویی سریع و حرفه‌ای به سوالات شما"
  },
  "fe.15856230f031": {
    "en": "Mandatory",
    "fa": "اجباری"
  },
  "fe.180a16e6e9bb": {
    "en": "The page ID is not available",
    "fa": "شناسه صفحه موجود نیست"
  },
  "fe.1a2299036ed6": {
    "en": "Payment through the portal",
    "fa": "پرداخت از طریق درگاه"
  },
  "fe.1a5d8735b5c8": {
    "en": "Next slide",
    "fa": "اسلاید بعدی"
  },
  "fe.1ab3df2bf732": {
    "en": "/products or https://...",
    "fa": "/products یا https://..."
  },
  "fe.1ad5b79eda2a": {
    "en": "service",
    "fa": "سرویس"
  },
  "fe.1afe110b90bd": {
    "en": "Choose the province",
    "fa": "انتخاب استان"
  },
  "fe.1b2b6460d4eb": {
    "en": "Details",
    "fa": "جزئیات"
  },
  "fe.1b32651b420d": {
    "en": "title",
    "fa": "عنوان"
  },
  "fe.1cff677453b2": {
    "en": "Settings",
    "fa": "تنظیمات"
  },
  "fe.1da94c2dd45a": {
    "en": "Ask your question about this section",
    "fa": "سوال خود را درباره این بخش بپرسید"
  },
  "fe.1dad43f7e3a5": {
    "en": "our story",
    "fa": "داستان ما"
  },
  "fe.1e1053af42fe": {
    "en": "For example: home page slider",
    "fa": "مثلاً: اسلایدر صفحه اصلی"
  },
  "fe.1ea35e715a0b": {
    "en": "The price of goods",
    "fa": "قیمت کالاها"
  },
  "fe.1f25de4b698b": {
    "en": "Full address *",
    "fa": "آدرس کامل *"
  },
  "fe.1ff96f9aa356": {
    "en": "Symbols",
    "fa": "نمادها"
  },
  "fe.201fc928e347": {
    "en": "Discount code and payment",
    "fa": "کد تخفیف و پرداخت"
  },
  "fe.21127e4741c6": {
    "en": "slug (optional)",
    "fa": "اسلاگ (اختیاری)"
  },
  "fe.21d0718ebdfc": {
    "en": "English name",
    "fa": "نام انگلیسی"
  },
  "fe.21d50582e3ca": {
    "en": "Tracking address (with %tracking_code%) — optional",
    "fa": "آدرس پیگیری (با %tracking_code%) — اختیاری"
  },
  "fe.221ea8eb04e4": {
    "en": "Example: clothes",
    "fa": "مثال: پوشاک"
  },
  "fe.2279a5dbe19e": {
    "en": "Error connecting to the payment gateway.",
    "fa": "خطا در اتصال به درگاه پرداخت."
  },
  "fe.22850eb65f0f": {
    "en": "Error updating number.",
    "fa": "خطا در بروزرسانی تعداد."
  },
  "fe.228d7a207dde": {
    "en": "Explanatory text of the slide",
    "fa": "متن توضیحی اسلاید"
  },
  "fe.22a3417293ef": {
    "en": "Order sending procedure",
    "fa": "رویه ارسال سفارش"
  },
  "fe.22bbcda4247d": {
    "en": "Edit service",
    "fa": "ویرایش سرویس"
  },
  "fe.230ef7b86fbe": {
    "en": "Serva design form variation",
    "fa": "تنوع فرم طراحی سروا"
  },
  "fe.23cc4208b12b": {
    "en": "To view the shopping cart, first log in to your account.",
    "fa": "برای مشاهده سبد خرید، ابتدا وارد حساب کاربری شوید."
  },
  "fe.23f39ce809d8": {
    "en": "User management",
    "fa": "مدیریت کاربران"
  },
  "fe.2405d444dfd0": {
    "en": "soon",
    "fa": "به زودی"
  },
  "fe.241c9eda4bd0": {
    "en": "Type *",
    "fa": "نوع *"
  },
  "fe.246311dafc4e": {
    "en": "Minimal logo",
    "fa": "لوگو کوچک (Minimal)"
  },
  "fe.2467aa45516f": {
    "en": "Pictures",
    "fa": "تصاویر"
  },
  "fe.2519243de6c5": {
    "en": "https://... or the HTML code of the icon",
    "fa": "https://... یا کد HTML نماد"
  },
  "fe.25c2cd1f3fdf": {
    "en": "payment method",
    "fa": "روش پرداخت"
  },
  "fe.2632bb34cace": {
    "en": "Related articles",
    "fa": "مقالات مرتبط"
  },
  "fe.26567f6fcad7": {
    "en": "Selling price",
    "fa": "قیمت فروش"
  },
  "fe.27dfc8ac93d4": {
    "en": "New article",
    "fa": "مقاله جدید"
  },
  "fe.2828f02c80f4": {
    "en": "The sending method settings have been saved.",
    "fa": "تنظیمات روش ارسال ذخیره شد."
  },
  "fe.2830da519496": {
    "en": "Are you sure you want to remove the '{p1}' menu?",
    "fa": "آیا از حذف منوی «{p1}» اطمینان دارید؟"
  },
  "fe.28571e190a25": {
    "en": "Procedures for returning goods",
    "fa": "رویه‌های بازگرداندن کالا"
  },
  "fe.28f81cb68090": {
    "en": "Error loading profile information.",
    "fa": "خطا در بارگذاری اطلاعات پروفایل."
  },
  "fe.294840c645c1": {
    "en": "Symbol of organization",
    "fa": "نماد ساماندهی"
  },
  "fe.29721133dacd": {
    "en": "Log in to make a reservation",
    "fa": "برای رزرو وارد شوید"
  },
  "fe.29e0cf131788": {
    "en": "Notifications",
    "fa": "اعلانات"
  },
  "fe.2a128fdccc3a": {
    "en": "Visual Page Builder",
    "fa": "صفحه ساز ویژوال"
  },
  "fe.2a29783c67ee": {
    "en": "the menu",
    "fa": "منو"
  },
  "fe.2a3ac8f17155": {
    "en": "Meta description",
    "fa": "توضیحات متا"
  },
  "fe.2a878dcbfce7": {
    "en": "Main menu",
    "fa": "منوی اصلی"
  },
  "fe.2acd65da4f0c": {
    "en": "Unauthorized access",
    "fa": "دسترسی غیرمجاز"
  },
  "fe.2ae3c8658b34": {
    "en": "Transactions",
    "fa": "تراکنش‌ها"
  },
  "fe.2b8fc79c7ad0": {
    "en": "user",
    "fa": "کاربر"
  },
  "fe.2c997e2a56d8": {
    "en": "Sales and income statistics",
    "fa": "آمار فروش و درآمد"
  },
  "fe.2d4ee9050e4d": {
    "en": "Location on the map",
    "fa": "موقعیت روی نقشه"
  },
  "fe.2d80e1827ea4": {
    "en": "Choose a subscription plan",
    "fa": "انتخاب پلن اشتراک"
  },
  "fe.2dc3afe54449": {
    "en": "Description (optional)",
    "fa": "توضیحات (اختیاری)"
  },
  "fe.2e6cbd8c252b": {
    "en": "Amount payable",
    "fa": "مبلغ قابل پرداخت"
  },
  "fe.2e8a2c608d45": {
    "en": "Payable amount:",
    "fa": "مبلغ قابل پرداخت:"
  },
  "fe.2e8cb987003a": {
    "en": "For example: email",
    "fa": "مثلاً: ایمیل"
  },
  "fe.2ed90e2a04cf": {
    "en": "Custom inputs",
    "fa": "ورودی‌های سفارشی"
  },
  "fe.2f811bde9972": {
    "en": "Service Title *",
    "fa": "عنوان سرویس *"
  },
  "fe.2f9742535fed": {
    "en": "invitation code",
    "fa": "کد دعوت"
  },
  "fe.30db280aec44": {
    "en": "Login with password",
    "fa": "ورود با رمز عبور"
  },
  "fe.30f719fce715": {
    "en": "Create a new slider",
    "fa": "ایجاد اسلایدر جدید"
  },
  "fe.3193d9be5cd4": {
    "en": "Enter the discount code",
    "fa": "کد تخفیف را وارد کنید"
  },
  "fe.3222ea2c45bc": {
    "en": "Tags",
    "fa": "برچسب‌ها"
  },
  "fe.333174e52f41": {
    "en": "All situations",
    "fa": "همه وضعیت‌ها"
  },
  "fe.334063cdb3a6": {
    "en": "Error deleting item.",
    "fa": "خطا در حذف آیتم."
  },
  "fe.335c5d94909a": {
    "en": "empty (group)",
    "fa": "خالی (گروه)"
  },
  "fe.344c9479b32d": {
    "en": "No comment has been registered yet.",
    "fa": "هنوز نظری ثبت نشده است."
  },
  "fe.3464a90de1b7": {
    "en": "SEO (optional)",
    "fa": "SEO (اختیاری)"
  },
  "fe.346f6c187a5b": {
    "en": "Shop slogan",
    "fa": "شعار فروشگاه"
  },
  "fe.34a0085722be": {
    "en": "Search article...",
    "fa": "جستجوی مقاله..."
  },
  "fe.3598dc7c8e62": {
    "en": "page builder",
    "fa": "صفحه‌ساز"
  },
  "fe.360cdd4bc1d6": {
    "en": "Color selection",
    "fa": "انتخاب رنگ"
  },
  "fe.360fc6332f11": {
    "en": "Rules and regulations",
    "fa": "قوانین و مقررات"
  },
  "fe.36366e8aac29": {
    "en": "view",
    "fa": "مشاهده"
  },
  "fe.3747dab0ba22": {
    "en": "amount",
    "fa": "مبلغ"
  },
  "fe.37a1922a9b0f": {
    "en": "Address registration failed.",
    "fa": "ثبت آدرس ناموفق بود."
  },
  "fe.37b004a90294": {
    "en": "Stream source",
    "fa": "منبع استریم"
  },
  "fe.37b3baa32877": {
    "en": "Meta description",
    "fa": "توضیحات متا"
  },
  "fe.383fe87b996f": {
    "en": "Please select the address and shipping method.",
    "fa": "لطفا آدرس و روش ارسال را انتخاب کنید."
  },
  "fe.3887f8f84056": {
    "en": "Please login to continue",
    "fa": "لطفا برای ادامه وارد شوید"
  },
  "fe.390c1d197541": {
    "en": "Error loading information.",
    "fa": "خطا در بارگذاری اطلاعات."
  },
  "fe.39976e0a80d3": {
    "en": "Please select a payment method.",
    "fa": "لطفاً روش پرداخت را انتخاب کنید."
  },
  "fe.3a49288d6e3c": {
    "en": "The cost of this service is not set in the system. Contact support.",
    "fa": "هزینه این سرویس در سیستم تنظیم نشده است. با پشتیبانی تماس بگیرید."
  },
  "fe.3ac060279bfd": {
    "en": "Choose from files",
    "fa": "انتخاب از فایل‌ها"
  },
  "fe.3b5966b615f3": {
    "en": "Unfortunately, the page you are looking for does not exist.",
    "fa": "متأسفانه صفحه‌ای که دنبالش هستید وجود ندارد."
  },
  "fe.3c4381d02f57": {
    "en": "Blog categories",
    "fa": "دسته‌بندی‌های بلاگ"
  },
  "fe.3c686b41b11a": {
    "en": "Field ID",
    "fa": "شناسه فیلد"
  },
  "fe.3cf9e6e5cbfb": {
    "en": "Ordered goods",
    "fa": "کالاهای سفارش"
  },
  "fe.3d526e5875e4": {
    "en": "unlimited",
    "fa": "نامحدود"
  },
  "fe.3d61d5218905": {
    "en": "Feature",
    "fa": "ویژگی"
  },
  "fe.3d8fa26cc55e": {
    "en": "Server error",
    "fa": "خطای سرور"
  },
  "fe.3e07344c65a3": {
    "en": "Loading...",
    "fa": "در حال بارگذاری..."
  },
  "fe.3e664e377b1c": {
    "en": "icon (favicon)",
    "fa": "آیکون (Favicon)"
  },
  "fe.3ee0cb450020": {
    "en": "manager",
    "fa": "مدیر"
  },
  "fe.3f216d58db33": {
    "en": "type",
    "fa": "نوع"
  },
  "fe.3f6fe5f0163c": {
    "en": "Please enter all required address fields.",
    "fa": "لطفاً تمام فیلدهای ضروری آدرس را وارد کنید."
  },
  "fe.3fb32d1c659b": {
    "en": "You have read all the notices",
    "fa": "همه اعلانات را خوانده‌اید"
  },
  "fe.40233b19bd97": {
    "en": "Payment gateways",
    "fa": "درگاه‌های پرداخت"
  },
  "fe.40469b4fb7c3": {
    "en": "invitation link",
    "fa": "لینک دعوت"
  },
  "fe.42804b9e344e": {
    "en": "display name",
    "fa": "نام نمایشی"
  },
  "fe.42cd2750de0d": {
    "en": "Are you sure you want to remove '{p1}'?",
    "fa": "آیا از حذف «{p1}» اطمینان دارید؟"
  },
  "fe.431ab19bfe6e": {
    "en": "Write your question...",
    "fa": "سوال خود را بنویسید..."
  },
  "fe.432ce730071e": {
    "en": "Reservation services",
    "fa": "سرویس‌های رزرو"
  },
  "fe.43b9d39131fa": {
    "en": "Display order",
    "fa": "ترتیب نمایش"
  },
  "fe.43ecde95c6cc": {
    "en": "Back to top",
    "fa": "بازگشت به بالا"
  },
  "fe.4442ed5db9a4": {
    "en": "Product authenticity",
    "fa": "اصالت کالا"
  },
  "fe.444bbd3acef0": {
    "en": "No tags found.",
    "fa": "برچسبی یافت نشد."
  },
  "fe.45c46fe18185": {
    "en": "Meta keywords",
    "fa": "کلمات کلیدی متا"
  },
  "fe.45f671375270": {
    "en": "Please fill in all required fields.",
    "fa": "لطفا تمام فیلدهای ضروری را پر کنید."
  },
  "fe.462ffc481c7b": {
    "en": "duration (minutes)",
    "fa": "مدت زمان (دقیقه)"
  },
  "fe.47e02ccbab02": {
    "en": "Error in registration. Please try again.",
    "fa": "خطا در ثبت. لطفاً دوباره تلاش کنید."
  },
  "fe.47fa8e0eb1ad": {
    "en": "The comment system is currently not active.",
    "fa": "سیستم نظرات در حال حاضر فعال نیست."
  },
  "fe.48aafb2d5247": {
    "en": "File title",
    "fa": "عنوان فایل"
  },
  "fe.48ebc456a416": {
    "en": "Email",
    "fa": "ایمیل"
  },
  "fe.490cade53a5e": {
    "en": "Product 2",
    "fa": "محصول ۲"
  },
  "fe.49e571d9fbc0": {
    "en": "Phone number",
    "fa": "شماره تلفن"
  },
  "fe.4a93ff0edf3d": {
    "en": "discount code",
    "fa": "کد تخفیف"
  },
  "fe.4ab0afc4820f": {
    "en": "The ID of the article is not known.",
    "fa": "شناسه مقاله مشخص نیست."
  },
  "fe.4ab751e13f21": {
    "en": "Sum of products",
    "fa": "جمع محصولات"
  },
  "fe.4ae9657e2001": {
    "en": "Support",
    "fa": "پشتیبانی"
  },
  "fe.4b8340fa0dc4": {
    "en": "Items included in this service",
    "fa": "موارد شامل‌شده در این سرویس"
  },
  "fe.4b945c1ab47c": {
    "en": "Order status",
    "fa": "وضعیت سفارش"
  },
  "fe.4b9d1544a2fa": {
    "en": "Your favorites list is empty",
    "fa": "لیست علاقه‌مندی‌های شما خالی است"
  },
  "fe.4c2b71567dd4": {
    "en": "First, add a provider.",
    "fa": "ابتدا یک ارائه‌دهنده اضافه کنید."
  },
  "fe.4c5ed599312a": {
    "en": "Choose a mobile image",
    "fa": "انتخاب تصویر موبایل"
  },
  "fe.4cd863cff4e0": {
    "en": "Salient features",
    "fa": "ویژگی‌های بارز"
  },
  "fe.4d321db4576c": {
    "en": "systemic",
    "fa": "سیستمی"
  },
  "fe.4e13742ef7b3": {
    "en": "No",
    "fa": "شماره"
  },
  "fe.4e1f075dafb3": {
    "en": "message",
    "fa": "پیام"
  },
  "fe.4fb2a8ca7a45": {
    "en": "password",
    "fa": "رمز عبور"
  },
  "fe.5078d81abfe5": {
    "en": "Apply to all:",
    "fa": "اعمال به همه:"
  },
  "fe.50a8c6e5b5c4": {
    "en": "It was not possible to receive financial statistics. Please try again.",
    "fa": "دریافت آمار مالی امکان‌پذیر نبود. لطفاً دوباره تلاش کنید."
  },
  "fe.519d4b4cebbb": {
    "en": "General specifications",
    "fa": "مشخصات کلی"
  },
  "fe.51cdbb0c893c": {
    "en": "Product not found or you do not have access to it.",
    "fa": "محصول یافت نشد یا دسترسی به آن ندارید."
  },
  "fe.51d2273e1e8d": {
    "en": "Select file",
    "fa": "انتخاب فایل"
  },
  "fe.51e42ad73499": {
    "en": "Charge amount",
    "fa": "مبلغ شارژ"
  },
  "fe.51f412d6caf4": {
    "en": "Widget type",
    "fa": "نوع ویجت"
  },
  "fe.537f36a80a80": {
    "en": "Settings tabs",
    "fa": "تب‌های تنظیمات"
  },
  "fe.53d8e513b794": {
    "en": "Write your order... (coming soon)",
    "fa": "دستور خود را بنویسید... (به زودی)"
  },
  "fe.53df25bd0b3b": {
    "en": "to close",
    "fa": "بستن"
  },
  "fe.541e5b365cf4": {
    "en": "No layout widget assigned yet.",
    "fa": "هنوز ویجت طرح بندی اختصاص داده نشده است."
  },
  "fe.5449bfd2646e": {
    "en": "For example: email",
    "fa": "مثلاً: email"
  },
  "fe.54a43dbfb4e2": {
    "en": "Sales statistics, income and store details",
    "fa": "آمار فروش، درآمد و ریز مالی فروشگاه"
  },
  "fe.54ca9cd5a189": {
    "en": "No article was found.",
    "fa": "مطلبی یافت نشد."
  },
  "fe.5529e6ddcc18": {
    "en": "Error loading orders. Please try again.",
    "fa": "خطا در بارگذاری سفارشات. لطفا دوباره تلاش کنید."
  },
  "fe.5613a33675f9": {
    "en": "Tomans from the wallet",
    "fa": "تومان از کیف پول"
  },
  "fe.561a2ac43214": {
    "en": "Title for search engines",
    "fa": "عنوان برای موتورهای جستجو"
  },
  "fe.5634e166b244": {
    "en": "preview",
    "fa": "پیش‌نمایش"
  },
  "fe.563cb6f5ea28": {
    "en": "New provider",
    "fa": "ارائه‌دهنده جدید"
  },
  "fe.565f50d0ee7c": {
    "en": "Publication status",
    "fa": "وضعیت انتشار"
  },
  "fe.5697ed15b37e": {
    "en": "Search error. Please try again.",
    "fa": "خطا در جستجو. لطفا دوباره تلاش کنید."
  },
  "fe.574d7b6ce6e7": {
    "en": "Example: TOKAN20",
    "fa": "مثال: TOKAN20"
  },
  "fe.577dc080e3c8": {
    "en": "Error loading categories. Please try again.",
    "fa": "خطا در بارگذاری دسته‌بندی‌ها. لطفا دوباره تلاش کنید."
  },
  "fe.57da8118bf96": {
    "en": "order",
    "fa": "سفارش"
  },
  "fe.58c60fbb6e3c": {
    "en": "Service providers",
    "fa": "ارائه‌دهندگان خدمات"
  },
  "fe.590e6375092e": {
    "en": "title (optional)",
    "fa": "عنوان (اختیاری)"
  },
  "fe.599a024ea25f": {
    "en": "Short description to display in the list",
    "fa": "توضیح کوتاه برای نمایش در لیست"
  },
  "fe.5b97e2df2d35": {
    "en": "toggle password visibility",
    "fa": "قابلیت مشاهده رمز عبور را تغییر دهید"
  },
  "fe.5bdae7e630f6": {
    "en": "Unlimited inventory",
    "fa": "موجودی نامحدود"
  },
  "fe.5ca312bc2c6f": {
    "en": "Error in receiving the shopping cart. Please try again.",
    "fa": "خطا در دریافت سبد خرید. لطفا دوباره تلاش کنید."
  },
  "fe.5ca9a7f26b8d": {
    "en": "Remove this sending method?",
    "fa": "این روش ارسال حذف شود؟"
  },
  "fe.5decfea09f74": {
    "en": "Stream link",
    "fa": "لینک استریم"
  },
  "fe.5e60ebaff02d": {
    "en": "phone",
    "fa": "تلفن"
  },
  "fe.5eea546c1d65": {
    "en": "View the store in a new tab",
    "fa": "مشاهده فروشگاه در تب جدید"
  },
  "fe.6065c5ff79d9": {
    "en": "Usable inventory",
    "fa": "موجودی قابل استفاده"
  },
  "fe.60a3f3ea025a": {
    "en": "Your next step",
    "fa": "قدم بعدی شما"
  },
  "fe.60c637db07e9": {
    "en": "open menu",
    "fa": "منو را باز کنید"
  },
  "fe.60f08904afd9": {
    "en": "stop",
    "fa": "توقف"
  },
  "fe.61ed3dafd614": {
    "en": "Upload video (convert to HLS)",
    "fa": "آپلود ویدیو (تبدیل به HLS)"
  },
  "fe.6256d65f029e": {
    "en": "Google Analytics ID",
    "fa": "شناسه گوگل آنالیتیکس"
  },
  "fe.62da13f5cdc8": {
    "en": "explanation",
    "fa": "توضیح"
  },
  "fe.63c82ba94c95": {
    "en": "Pre-built commands:",
    "fa": "دستورات از پیش‌ساخته:"
  },
  "fe.643e3b4eaf47": {
    "en": "The port settings are saved.",
    "fa": "تنظیمات درگاه ذخیره شد."
  },
  "fe.655c8f3ca6a2": {
    "en": "Page not found",
    "fa": "صفحه پیدا نشد"
  },
  "fe.658dad1545d6": {
    "en": "Question from artificial intelligence",
    "fa": "سوال از هوش مصنوعی"
  },
  "fe.65b4b0e36e6b": {
    "en": "Status change and tracking code",
    "fa": "تغییر وضعیت و کد پیگیری"
  },
  "fe.65ec1a4f834b": {
    "en": "video",
    "fa": "ویدیو"
  },
  "fe.662e7f9c0d16": {
    "en": "recipient name",
    "fa": "نام گیرنده"
  },
  "fe.6631ea9e106b": {
    "en": "Store settings",
    "fa": "تنظیمات فروشگاه"
  },
  "fe.679b8c646f38": {
    "en": "Error saving bank account.",
    "fa": "خطا در ذخیره حساب بانکی."
  },
  "fe.67b4453e082c": {
    "en": "Error updating count. Please try again.",
    "fa": "خطا در به‌روزرسانی تعداد. لطفا دوباره تلاش کنید."
  },
  "fe.67b7ace0b172": {
    "en": "product",
    "fa": "محصول"
  },
  "fe.687bbfc820fe": {
    "en": "Confirmed by Google Search Console",
    "fa": "تایید گوگل سرچ کنسول"
  },
  "fe.6946c2db60e5": {
    "en": "Error loading products. Please try again.",
    "fa": "خطا در بارگذاری محصولات. لطفا دوباره تلاش کنید."
  },
  "fe.695a4ba9b526": {
    "en": "No address has been registered.",
    "fa": "آدرسی ثبت نشده است."
  },
  "fe.6ba18313b2d4": {
    "en": "The booking failed.",
    "fa": "ثبت رزرو ناموفق بود."
  },
  "fe.6bcf197023d1": {
    "en": "Error saving address.",
    "fa": "خطا در ذخیره آدرس."
  },
  "fe.6c3eaaaede0f": {
    "en": "Select video from gallery or upload",
    "fa": "انتخاب ویدیو از گالری یا آپلود"
  },
  "fe.6c76efc8a63e": {
    "en": "categorization",
    "fa": "دسته‌بندی"
  },
  "fe.6c8890330167": {
    "en": "Are you sure to remove this user from admin?",
    "fa": "آیا از حذف این کاربر از ادمینی مطمئن هستید؟"
  },
  "fe.6ce26f2ee1b5": {
    "en": "Previous slide",
    "fa": "اسلاید قبلی"
  },
  "fe.6d56e8170def": {
    "en": "non-existent",
    "fa": "ناموجود"
  },
  "fe.6d88a807d347": {
    "en": "No text",
    "fa": "بدون متن"
  },
  "fe.6d914159db73": {
    "en": "Alt text for image",
    "fa": "متن جایگزین برای تصویر"
  },
  "fe.6de3fa16272f": {
    "en": "You do not have a submission method yet",
    "fa": "هنوز روش ارسالی ندارید"
  },
  "fe.6f5117d1cbdb": {
    "en": "Select tags",
    "fa": "انتخاب برچسب‌ها"
  },
  "fe.6fb1084ffe00": {
    "en": "No. 1234, Valiasr Street, Tehran",
    "fa": "تهران، خیابان ولیعصر، پلاک ۱۲۳۴"
  },
  "fe.6fd89126738d": {
    "en": "Move up",
    "fa": "حرکت به بالا"
  },
  "fe.6fe406b6e41a": {
    "en": "Delete this widget?",
    "fa": "این ویجت حذف شود؟"
  },
  "fe.70de9c98e71c": {
    "en": "date and time",
    "fa": "تاریخ و زمان"
  },
  "fe.7200e6971c1d": {
    "en": "Recommended pages and widgets are built for a standard store. Existing pages will not change. continue?",
    "fa": "صفحات و ویجت‌های پیشنهادی برای یک فروشگاه استاندارد ساخته می‌شوند. صفحات موجود تغییر نخواهند کرد. ادامه دهید؟"
  },
  "fe.728a80856d0c": {
    "en": "Download your purchased files",
    "fa": "فایل‌های خریداری‌شده خود را دانلود کنید"
  },
  "fe.7293f781ca10": {
    "en": "Name and Surname *",
    "fa": "نام و نام خانوادگی *"
  },
  "fe.7327fc94fbca": {
    "en": "Product title",
    "fa": "عنوان محصول"
  },
  "fe.7399f1e6fa08": {
    "en": "Categories and tags",
    "fa": "دسته‌بندی و برچسب"
  },
  "fe.73ce4d8a2728": {
    "en": "Search by order number, name or mobile...",
    "fa": "جستجو با شماره سفارش، نام یا موبایل..."
  },
  "fe.740dfece74f1": {
    "en": "Enter your email address...",
    "fa": "آدرس ایمیل خود را وارد کنید..."
  },
  "fe.7430ff841b29": {
    "en": "Write the full description of the product...",
    "fa": "توضیحات کامل محصول را بنویسید..."
  },
  "fe.74332d19bbe8": {
    "en": "Province *",
    "fa": "استان *"
  },
  "fe.746a56e7f375": {
    "en": "Contact information and social networks",
    "fa": "اطلاعات تماس و شبکه‌های اجتماعی"
  },
  "fe.750dfcd869e5": {
    "en": "Responses are sent instantly to your dashboard integrations.",
    "fa": "پاسخ ها فوراً به ادغام های داشبورد شما ارسال می شوند."
  },
  "fe.75cd33527da2": {
    "en": "Error getting menu",
    "fa": "خطا در دریافت منو"
  },
  "fe.763d3603e81d": {
    "en": "Financial sector",
    "fa": "بخش مالی"
  },
  "fe.770a824b5b8c": {
    "en": "New value",
    "fa": "مقدار جدید"
  },
  "fe.7719f39adabf": {
    "en": "Are you sure you want to delete this slide?",
    "fa": "آیا از حذف این اسلاید اطمینان دارید؟"
  },
  "fe.7752d547f27a": {
    "en": "Are you sure you want to remove the product '{p1}'?",
    "fa": "آیا از حذف محصول «{p1}» اطمینان دارید؟"
  },
  "fe.7763144e9064": {
    "en": "wallet",
    "fa": "کیف پول"
  },
  "fe.78a9f63479bb": {
    "en": "The invitees",
    "fa": "دعوت‌شده‌ها"
  },
  "fe.79045ad7ac79": {
    "en": "No store found.",
    "fa": "فروشگاهی یافت نشد."
  },
  "fe.7927c7ed375b": {
    "en": "Login to user account",
    "fa": "ورود به حساب کاربری"
  },
  "fe.796cce4226d0": {
    "en": "5 minutes of study",
    "fa": "۵ دقیقه مطالعه"
  },
  "fe.79c8f9474633": {
    "en": "Add bank account",
    "fa": "افزودن حساب بانکی"
  },
  "fe.7a323fd316b3": {
    "en": "Please select or enter a delivery address.",
    "fa": "لطفاً آدرس تحویل را انتخاب یا ثبت کنید."
  },
  "fe.7a727d31a303": {
    "en": "Information required for each product",
    "fa": "اطلاعات مورد نیاز برای هر محصول"
  },
  "fe.7b09cca768c8": {
    "en": "There are no notifications to display",
    "fa": "اعلانی برای نمایش وجود ندارد"
  },
  "fe.7b4b53b27821": {
    "en": "Your payment has been successfully completed.",
    "fa": "پرداخت شما با موفقیت انجام شد."
  },
  "fe.7b7e803a0df9": {
    "en": "Contact number",
    "fa": "شماره تماس"
  },
  "fe.7bb99ed41886": {
    "en": "Verification code",
    "fa": "کد تایید"
  },
  "fe.7c16162ac749": {
    "en": "/product/:id:number/:slug?:string",
    "fa": "/product/:id:number/:slug?:string"
  },
  "fe.7c22fada8467": {
    "en": "Income chart (last 30 days)",
    "fa": "نمودار درآمد (۳۰ روز گذشته)"
  },
  "fe.7c30749ea600": {
    "en": "Port settings (e.g. Merchant ID)",
    "fa": "تنظیمات درگاه (مثلاً مرچنت آی دی)"
  },
  "fe.7c9da5090e6e": {
    "en": "Manage sliders",
    "fa": "مدیریت اسلایدرها"
  },
  "fe.7ca63fd4d9eb": {
    "en": "Latest orders",
    "fa": "آخرین سفارشات"
  },
  "fe.7df075e3256b": {
    "en": "name",
    "fa": "نام"
  },
  "fe.7e28a7bc5838": {
    "en": "Page Details",
    "fa": "جزئیات صفحه"
  },
  "fe.7e8bf63d008a": {
    "en": "Meta title",
    "fa": "عنوان متا"
  },
  "fe.7f6f786067e8": {
    "en": "Total shopping cart",
    "fa": "جمع سبد خرید"
  },
  "fe.7fff3d747ff5": {
    "en": "Error loading articles.",
    "fa": "خطا در بارگذاری مقالات."
  },
  "fe.8054e70acce0": {
    "en": "This page is under preparation.",
    "fa": "این صفحه در حال آماده‌سازی است."
  },
  "fe.805fc8ebf908": {
    "en": "Service information",
    "fa": "اطلاعات سرویس"
  },
  "fe.807f37218e5a": {
    "en": "shopping cart",
    "fa": "سبد خرید"
  },
  "fe.80bd5410525b": {
    "en": "No address has been registered.",
    "fa": "هیچ آدرسی ثبت نشده است."
  },
  "fe.81a38a291d01": {
    "en": "Bank accounts",
    "fa": "حساب‌های بانکی"
  },
  "fe.81b58e8f632f": {
    "en": "No range found for this date.",
    "fa": "بازه‌ای برای این تاریخ یافت نشد."
  },
  "fe.82416e0d1d72": {
    "en": "Edit menu",
    "fa": "ویرایش منو"
  },
  "fe.824bd621ff22": {
    "en": "Show call button",
    "fa": "نمایش دکمه فراخوان"
  },
  "fe.82d303d1d0fc": {
    "en": "Purchased videos",
    "fa": "ویدیوهای خریداری‌شده"
  },
  "fe.82dbaa0e0488": {
    "en": "Product variety",
    "fa": "تنوع محصول"
  },
  "fe.832801124657": {
    "en": "Request to connect to a dedicated domain",
    "fa": "درخواست اتصال به دامنه اختصاصی"
  },
  "fe.833a826631d3": {
    "en": "No bank account registered.",
    "fa": "هیچ حساب بانکی ثبت نشده است."
  },
  "fe.8362c770000d": {
    "en": "subject",
    "fa": "موضوع"
  },
  "fe.8413c626f244": {
    "en": "Customer service",
    "fa": "خدمات مشتریان"
  },
  "fe.84476eec1743": {
    "en": "send message",
    "fa": "ارسال پیام"
  },
  "fe.844ca9145230": {
    "en": "Search among thousands of products...",
    "fa": "جستجو در بین هزاران محصول..."
  },
  "fe.8476f8e21569": {
    "en": "Custom title",
    "fa": "عنوان سفارشی"
  },
  "fe.8593a9f18909": {
    "en": "Description",
    "fa": "توضیحات"
  },
  "fe.85b3403cdeca": {
    "en": "content",
    "fa": "محتوا"
  },
  "fe.86b1ac8ebf9c": {
    "en": "Using the sandbox environment (test)",
    "fa": "استفاده از محیط سندباکس (تست)"
  },
  "fe.874212f6819c": {
    "en": "Are you sure you want to delete the category \"{p1}\"?",
    "fa": "آیا از حذف دسته «{p1}» اطمینان دارید؟"
  },
  "fe.87abd947fa44": {
    "en": "price",
    "fa": "قیمت"
  },
  "fe.87be845b148a": {
    "en": "Shipping method",
    "fa": "روش ارسال"
  },
  "fe.88006a7d6d6f": {
    "en": "discount code (optional)",
    "fa": "کد تخفیف (اختیاری)"
  },
  "fe.889f46873df4": {
    "en": "address",
    "fa": "آدرس"
  },
  "fe.88a00ff04717": {
    "en": "Invitation and reward",
    "fa": "دعوت و پاداش"
  },
  "fe.8933719a4a46": {
    "en": "Manage slides",
    "fa": "مدیریت اسلایدها"
  },
  "fe.89508fc5f0d6": {
    "en": "View details",
    "fa": "مشاهده جزئیات"
  },
  "fe.895487a749c3": {
    "en": "50,000",
    "fa": "۵۰,۰۰۰"
  },
  "fe.89906933a01d": {
    "en": "Leave blank if you have no follow up",
    "fa": "خالی بگذارید اگر پیگیری ندارید"
  },
  "fe.89969a9fee95": {
    "en": "Shopping guide",
    "fa": "راهنمای خرید"
  },
  "fe.89de546b8724": {
    "en": "payment",
    "fa": "پرداخت"
  },
  "fe.8a503e7ccd8f": {
    "en": "Please enter \"{p1}\" for {p2}.",
    "fa": "لطفاً \"{p1}\" را برای {p2} وارد کنید."
  },
  "fe.8a938c6985da": {
    "en": "Purchase amount",
    "fa": "مبلغ خرید"
  },
  "fe.8ab97a1590c2": {
    "en": "Basic shipping cost (Tomans)",
    "fa": "هزینه پایه ارسال (تومان)"
  },
  "fe.8ad37a1a880f": {
    "en": "Shipping cost:",
    "fa": "هزینه ارسال:"
  },
  "fe.8b4c1af00bf4": {
    "en": "Are you sure you want to remove the service '{p1}'?",
    "fa": "آیا از حذف سرویس «{p1}» اطمینان دارید؟"
  },
  "fe.8b5f401c3ffc": {
    "en": "Are you sure to delete the article \"{p1}\"?",
    "fa": "آیا از حذف مقاله «{p1}» اطمینان دارید؟"
  },
  "fe.8bf0524ba66b": {
    "en": "Digital product settings",
    "fa": "تنظیمات محصول دیجیتال"
  },
  "fe.8c4dee66143f": {
    "en": "General information",
    "fa": "اطلاعات کلی"
  },
  "fe.8cbd9427ad8d": {
    "en": "sorting",
    "fa": "مرتب‌سازی"
  },
  "fe.8cee2709e588": {
    "en": "No items found",
    "fa": "موردی یافت نشد"
  },
  "fe.8d4913bf37d9": {
    "en": "Manage files",
    "fa": "مدیریت فایل‌ها"
  },
  "fe.8dc079691c98": {
    "en": "User comments",
    "fa": "نظرات کاربران"
  },
  "fe.8ea2e146aa45": {
    "en": "duration (minutes)",
    "fa": "مدت (دقیقه)"
  },
  "fe.8f3f1f1ad3fa": {
    "en": "deposited",
    "fa": "واریز شده"
  },
  "fe.8f6213d86db5": {
    "en": "Enter the order code",
    "fa": "کد سفارش را وارد کنید"
  },
  "fe.8f6415dfc1f2": {
    "en": "Are you sure to cancel this order?",
    "fa": "آیا از لغو این سفارش اطمینان دارید؟"
  },
  "fe.8f7fb6357a77": {
    "en": "Enter a valid basic shipping cost.",
    "fa": "هزینه پایه ارسال معتبر وارد کنید."
  },
  "fe.8faad5d32ee2": {
    "en": "Fast shipping",
    "fa": "ارسال سریع"
  },
  "fe.8fc4b3eed0e8": {
    "en": "Stored products",
    "fa": "محصولات ذخیره شده"
  },
  "fe.90418a312e66": {
    "en": "Categories",
    "fa": "دسته‌بندی‌ها"
  },
  "fe.9061b21fa33b": {
    "en": "Color palette",
    "fa": "پالت رنگ"
  },
  "fe.907ad6e6a80b": {
    "en": "Product 1",
    "fa": "محصول ۱"
  },
  "fe.911fd24871cc": {
    "en": "Example: news",
    "fa": "مثال: اخبار"
  },
  "fe.9273bdb2beca": {
    "en": "No reservations have been made yet.",
    "fa": "هنوز رزروی ثبت نشده است."
  },
  "fe.9284bc9a6899": {
    "en": "021-12345678",
    "fa": "۰۲۱-۱۲۳۴۵۶۷۸"
  },
  "fe.92e86cdff577": {
    "en": "Provider:",
    "fa": "ارائه‌دهنده:"
  },
  "fe.9313d0deab4f": {
    "en": "Payment failed",
    "fa": "پرداخت ناموفق"
  },
  "fe.931f9ec22d38": {
    "en": "Store Name",
    "fa": "نام فروشگاه"
  },
  "fe.93bef1df68ee": {
    "en": "Advanced settings (StoreSettings)",
    "fa": "تنظیمات پیشرفته (StoreSettings)"
  },
  "fe.93ce87ecebd5": {
    "en": "Personal information",
    "fa": "اطلاعات شخصی"
  },
  "fe.95204391162f": {
    "en": "No file has been uploaded yet",
    "fa": "هنوز فایلی آپلود نشده است"
  },
  "fe.952eb9361d3a": {
    "en": "No description has been recorded.",
    "fa": "توضیحی ثبت نشده است."
  },
  "fe.960c719464fb": {
    "en": "contact us",
    "fa": "تماس با ما"
  },
  "fe.96ccfd501124": {
    "en": "Choose the plan and duration.",
    "fa": "پلن و مدت را انتخاب کنید."
  },
  "fe.97693c893dbf": {
    "en": "Live Preview",
    "fa": "پیش نمایش زنده"
  },
  "fe.97a560a9fa60": {
    "en": "Are you sure you want to delete this address?",
    "fa": "آیا مطمئن هستید که می‌خواهید این آدرس را حذف کنید؟"
  },
  "fe.97a9decd6f19": {
    "en": "Tucan wallet",
    "fa": "کیف پول توکان"
  },
  "fe.9b0a440fdfeb": {
    "en": "Example: view products, buy",
    "fa": "مثال: مشاهده محصولات، خرید کنید"
  },
  "fe.9b2a72462799": {
    "en": "For example: installation guide",
    "fa": "مثلاً: راهنمای نصب"
  },
  "fe.9b53583bdfcb": {
    "en": "Error deleting item. Please try again.",
    "fa": "خطا در حذف آیتم. لطفا دوباره تلاش کنید."
  },
  "fe.9bcf7053ca59": {
    "en": "Delivery address",
    "fa": "آدرس تحویل"
  },
  "fe.9bfbc4ecbf73": {
    "en": "Manage orders",
    "fa": "مدیریت سفارشات"
  },
  "fe.9c0ba410da9f": {
    "en": "Add your favorite products to this list",
    "fa": "محصولات مورد علاقه خود را به این لیست اضافه کنید"
  },
  "fe.9ccec5d1dbd8": {
    "en": "my profile",
    "fa": "پروفایل من"
  },
  "fe.9d2c836e5ed9": {
    "en": "tags",
    "fa": "تگ‌ها"
  },
  "fe.9d609e8b9b58": {
    "en": "Confirmation of reservation",
    "fa": "تایید رزرو"
  },
  "fe.9d657c43471a": {
    "en": "the key",
    "fa": "کلید"
  },
  "fe.9d89675f3214": {
    "en": "Meta title",
    "fa": "عنوان متا"
  },
  "fe.9da04b0b71f9": {
    "en": "mobile number",
    "fa": "شماره موبایل"
  },
  "fe.9ddae2219b7e": {
    "en": "city",
    "fa": "شهر"
  },
  "fe.9e0e07a14f64": {
    "en": "Article",
    "fa": "مقاله"
  },
  "fe.9ea072503092": {
    "en": "opt out",
    "fa": "انصراف"
  },
  "fe.9f368d3a13f4": {
    "en": "Maximum payment amount on the spot (Toman, optional)",
    "fa": "حداکثر مبلغ پرداخت در محل (تومان، اختیاری)"
  },
  "fe.9f49ea75349f": {
    "en": "Select or upload an image",
    "fa": "انتخاب یا آپلود تصویر"
  },
  "fe.9f743e251598": {
    "en": "No body content provided.",
    "fa": "محتوای بدن ارائه نشده است."
  },
  "fe.9f7f08cdb3d0": {
    "en": "No categories were found with this term.",
    "fa": "دسته‌بندی‌ای با این عبارت یافت نشد."
  },
  "fe.9fa10e1b5995": {
    "en": "My downloads",
    "fa": "دانلودهای من"
  },
  "fe.9fc1bb4d5ee1": {
    "en": "You do not have access to this section.",
    "fa": "شما به این بخش دسترسی ندارید."
  },
  "fe.a0929d80342f": {
    "en": "Active (shown at checkout)",
    "fa": "فعال (در checkout نمایش داده شود)"
  },
  "fe.a2237d4603e2": {
    "en": "Digital product type",
    "fa": "نوع محصول دیجیتال"
  },
  "fe.a2384b51965d": {
    "en": "Purchased files",
    "fa": "فایل‌های خریداری‌شده"
  },
  "fe.a24f6e197e0c": {
    "en": "No product found.",
    "fa": "محصولی یافت نشد."
  },
  "fe.a2f3ceacc859": {
    "en": "Original content",
    "fa": "محتوای اصلی"
  },
  "fe.a3aded501afa": {
    "en": "Register a new reservation",
    "fa": "ثبت رزرو جدید"
  },
  "fe.a43e6bc0774a": {
    "en": "Tag name",
    "fa": "نام تگ"
  },
  "fe.a44557e4df0b": {
    "en": "Login | registration",
    "fa": "ورود | ثبت‌نام"
  },
  "fe.a48a3c70e8f7": {
    "en": "Error loading.",
    "fa": "خطا در بارگذاری."
  },
  "fe.a5165013f2f8": {
    "en": "Filter products",
    "fa": "فیلتر محصولات"
  },
  "fe.a547d78cfb52": {
    "en": "The discount code is not active at the moment.",
    "fa": "فعلاً کد تخفیف فعال نیست."
  },
  "fe.a6a817d2166d": {
    "en": "Frequently asked questions",
    "fa": "سوالات متداول"
  },
  "fe.a6c02edc9a41": {
    "en": "Product categories",
    "fa": "دسته‌بندی‌های محصولات"
  },
  "fe.a774f97c34e6": {
    "en": "Create a new page",
    "fa": "ایجاد صفحه جدید"
  },
  "fe.a78d3a95c2b9": {
    "en": "Example: Special discount",
    "fa": "مثال: تخفیف ویژه"
  },
  "fe.a79589f2fe1c": {
    "en": "https://tracking.post.ir/?id=%tracking_code%",
    "fa": "https://tracking.post.ir/?id=%tracking_code%"
  },
  "fe.a7a999abc82a": {
    "en": "Add to cart",
    "fa": "افزودن به سبد خرید"
  },
  "fe.a7afcd718d06": {
    "en": "Sign in to view purchased videos.",
    "fa": "برای مشاهده ویدیوهای خریداری‌شده وارد شوید."
  },
  "fe.a7f4c86363b6": {
    "en": "Tracking address (optional, with %tracking_code%)",
    "fa": "آدرس پیگیری (اختیاری، با %tracking_code%)"
  },
  "fe.a83c261c5577": {
    "en": "Title *",
    "fa": "عنوان *"
  },
  "fe.a8581e496b36": {
    "en": "Enter the name of the shipping method.",
    "fa": "نام روش ارسال را وارد کنید."
  },
  "fe.a8b1bff5a7e3": {
    "en": "Valiasr Street, Tehran...",
    "fa": "تهران، خیابان ولیعصر..."
  },
  "fe.a8b2658b0e2f": {
    "en": "Contact information",
    "fa": "اطلاعات تماس"
  },
  "fe.a8e869b768d8": {
    "en": "Total purchase",
    "fa": "کل خرید"
  },
  "fe.a926d003f2b9": {
    "en": "National code",
    "fa": "کد ملی"
  },
  "fe.a9326a29b69c": {
    "en": "Order tracking",
    "fa": "پیگیری سفارش"
  },
  "fe.aa23da44b91b": {
    "en": "Delete the sending method",
    "fa": "حذف روش ارسال"
  },
  "fe.aa338270b258": {
    "en": "New feature type (eg volume)",
    "fa": "نوع ویژگی جدید (مثلاً حجم)"
  },
  "fe.aa44e19d9863": {
    "en": "Article not found.",
    "fa": "مقاله یافت نشد."
  },
  "fe.aa69600564cc": {
    "en": "order summary",
    "fa": "خلاصه سفارش"
  },
  "fe.aacd189b0ca2": {
    "en": "Order not found.",
    "fa": "سفارشی یافت نشد."
  },
  "fe.ab2ddbaabdfa": {
    "en": "Alternative text for SEO",
    "fa": "متن جایگزین برای سئو"
  },
  "fe.ab500af02d11": {
    "en": "Edit provider",
    "fa": "ویرایش ارائه‌دهنده"
  },
  "fe.ac1ff094272f": {
    "en": "Recipient's name",
    "fa": "نام تحویل‌گیرنده"
  },
  "fe.ac3d0b13aeda": {
    "en": "Error canceling the order. Please try again.",
    "fa": "خطا در لغو سفارش. لطفا دوباره تلاش کنید."
  },
  "fe.aca2a91ea4bf": {
    "en": "Settings saved successfully.",
    "fa": "تنظیمات با موفقیت ذخیره شد."
  },
  "fe.ace3b3600777": {
    "en": "Guide to this page",
    "fa": "راهنمای این صفحه"
  },
  "fe.ad12690641ac": {
    "en": "Operation",
    "fa": "عملیات"
  },
  "fe.ad68d2548f73": {
    "en": "New service",
    "fa": "سرویس جدید"
  },
  "fe.ad94d0e9bfba": {
    "en": "Slider widget",
    "fa": "ویجت اسلایدر"
  },
  "fe.adbdf8ea9b75": {
    "en": "Edit file information",
    "fa": "ویرایش اطلاعات فایل"
  },
  "fe.ae1b13c29fd4": {
    "en": "Example: Dr. Ahmadi",
    "fa": "مثال: دکتر احمدی"
  },
  "fe.aeed5d507cf3": {
    "en": "selling price (tomans)",
    "fa": "قیمت فروش (تومان)"
  },
  "fe.af826736405e": {
    "en": "My orders",
    "fa": "سفارش‌های من"
  },
  "fe.b045980215b7": {
    "en": "Choose a category",
    "fa": "انتخاب دسته‌بندی"
  },
  "fe.b180f309d9ff": {
    "en": "Comment text (optional)",
    "fa": "متن نظر (اختیاری)"
  },
  "fe.b1cecad97e68": {
    "en": "Order search",
    "fa": "جستجوی سفارش"
  },
  "fe.b309fd74c951": {
    "en": "Dashboard",
    "fa": "داشبورد"
  },
  "fe.b3128f65dc93": {
    "en": "choose",
    "fa": "انتخاب کنید"
  },
  "fe.b332f053695d": {
    "en": "Current stage",
    "fa": "مرحله فعلی"
  },
  "fe.b333618c4023": {
    "en": "Error canceling the order.",
    "fa": "خطا در لغو سفارش."
  },
  "fe.b35879c7eeb4": {
    "en": "View the store",
    "fa": "مشاهده فروشگاه"
  },
  "fe.b36bf7b24a35": {
    "en": "Empty = no limit",
    "fa": "خالی = بدون محدودیت"
  },
  "fe.b3b993843869": {
    "en": "header, footer",
    "fa": "سرصفحه، پاورقی"
  },
  "fe.b412f141b860": {
    "en": "No files have been added yet. Click on \"Add File\".",
    "fa": "هنوز فایلی اضافه نشده. روی «افزودن فایل» کلیک کنید."
  },
  "fe.b46be1391273": {
    "en": "Payment of delivery fee on site",
    "fa": "پرداخت هزینه ارسال در محل"
  },
  "fe.b559f9f53de1": {
    "en": "Product payment on the spot (payment on the spot)",
    "fa": "پرداخت محصول در محل (پرداخت در محل)"
  },
  "fe.b56dc5016988": {
    "en": "status",
    "fa": "وضعیت"
  },
  "fe.b6a445b4cc9b": {
    "en": "Connect to radish",
    "fa": "اتصال به ترب"
  },
  "fe.b71e42b35f7e": {
    "en": "Search products...",
    "fa": "جستجو محصولات..."
  },
  "fe.b721f50a7d8d": {
    "en": "about us",
    "fa": "درباره ما"
  },
  "fe.b73c768ac75c": {
    "en": "Watch online",
    "fa": "تماشای آنلاین"
  },
  "fe.b785127752e1": {
    "en": "Short summary for search results",
    "fa": "خلاصه کوتاه برای نتایج جستجو"
  },
  "fe.b7b49e4c2bc3": {
    "en": "Provider information",
    "fa": "اطلاعات ارائه‌دهنده"
  },
  "fe.b8f408dfd74d": {
    "en": "price (tomans)",
    "fa": "قیمت (تومان)"
  },
  "fe.b93126a5cf5a": {
    "en": "category name",
    "fa": "نام دسته"
  },
  "fe.b9fb4bfa6c7e": {
    "en": "Alt (alternative text)",
    "fa": "Alt (متن جایگزین)"
  },
  "fe.ba0b473f027e": {
    "en": "Are you sure you want to delete this bank account?",
    "fa": "آیا مطمئن هستید که می‌خواهید این حساب بانکی را حذف کنید؟"
  },
  "fe.bac2a310109d": {
    "en": "Select icon",
    "fa": "انتخاب آیکون"
  },
  "fe.bbe15eca3118": {
    "en": "Google Tag Manager ID",
    "fa": "شناسه گوگل تگ منیجر"
  },
  "fe.bc5cd0207a33": {
    "en": "Basic shipping cost (Rials) *",
    "fa": "هزینه پایه ارسال (ریال) *"
  },
  "fe.bc91f0f7155e": {
    "en": "Full technical specifications",
    "fa": "مشخصات فنی کامل"
  },
  "fe.bd14d902755a": {
    "en": "For this product",
    "fa": "برای این محصول"
  },
  "fe.bd476c98aaaf": {
    "en": "Order not found.",
    "fa": "سفارش یافت نشد."
  },
  "fe.bd6aa34927c4": {
    "en": "Display title in the store",
    "fa": "عنوان نمایشی در فروشگاه"
  },
  "fe.bd88e6303ea6": {
    "en": "label (demonstration)",
    "fa": "برچسب (نمایشی)"
  },
  "fe.bdcd264f30e1": {
    "en": "Error loading store information",
    "fa": "خطا در بارگذاری اطلاعات فروشگاه"
  },
  "fe.bdf3e67075c9": {
    "en": "The request was cancelled.",
    "fa": "درخواست لغو شد."
  },
  "fe.bdfaeeca806f": {
    "en": "It will be specified in the settlement",
    "fa": "در تسویه حساب مشخص می‌شود"
  },
  "fe.be0b291d5fed": {
    "en": "Move down",
    "fa": "به پایین حرکت کنید"
  },
  "fe.bef6f2d691de": {
    "en": "Edit page and widgets",
    "fa": "ویرایش صفحه و ویجت‌ها"
  },
  "fe.bff9870068fb": {
    "en": "Magnification",
    "fa": "بزرگ نمایی"
  },
  "fe.c0ffb6635ed9": {
    "en": "Are you sure you want to remove the \"{p1}\" tag?",
    "fa": "آیا از حذف تگ «{p1}» اطمینان دارید؟"
  },
  "fe.c25cc825e2c3": {
    "en": "For example: main menu",
    "fa": "مثلاً: منوی اصلی"
  },
  "fe.c2c335ae0e8d": {
    "en": "Edit Title and Alt",
    "fa": "ویرایش عنوان و Alt"
  },
  "fe.c440b2fec1c7": {
    "en": "the seller",
    "fa": "فروشنده"
  },
  "fe.c476cf42a8fa": {
    "en": "Slider ID is not defined. Please set `slider_id` in widget settings.",
    "fa": "اسلایدر آیدی تعریف نشده است. لطفاً در تنظیمات ویجت، `slider_id` را تعیین کنید."
  },
  "fe.c484b662da01": {
    "en": "Manage menus",
    "fa": "مدیریت منوها"
  },
  "fe.c4b0666bcf0a": {
    "en": "Failed to load menu.",
    "fa": "منو بارگیری نشد."
  },
  "fe.c4db7bec0beb": {
    "en": "Remove the icon",
    "fa": "حذف آیکون"
  },
  "fe.c4dc3bb38d81": {
    "en": "Register a comment",
    "fa": "ثبت نظر"
  },
  "fe.c4ee372607a8": {
    "en": "Example: first visit",
    "fa": "مثال: ویزیت اول"
  },
  "fe.c580b95eac6e": {
    "en": "Shipping cost",
    "fa": "هزینه ارسال"
  },
  "fe.c59c8aaec72f": {
    "en": "Management of reservations",
    "fa": "مدیریت رزروها"
  },
  "fe.c5cfd3060a40": {
    "en": "Add submenu",
    "fa": "افزودن زیرمنو"
  },
  "fe.c5f2b4828c9b": {
    "en": "login",
    "fa": "ورود"
  },
  "fe.c60e8aec3ce9": {
    "en": "Please login to view order details",
    "fa": "لطفا برای مشاهده جزئیات سفارش وارد شوید"
  },
  "fe.c64ec55e144a": {
    "en": "Write the text of the article...",
    "fa": "متن مقاله را بنویسید..."
  },
  "fe.c69b95c92052": {
    "en": "Subscription history",
    "fa": "تاریخچه اشتراک‌ها"
  },
  "fe.c6b213e41696": {
    "en": ",",
    "fa": "،"
  },
  "fe.c740bdacdf1b": {
    "en": "The article was not found or you do not have access to it.",
    "fa": "مطلب یافت نشد یا دسترسی به آن ندارید."
  },
  "fe.c74f8b079d6a": {
    "en": "Commission",
    "fa": "کمیسیون"
  },
  "fe.c7519b499eb4": {
    "en": "New category",
    "fa": "دسته‌بندی جدید"
  },
  "fe.c7e2edbb4cb7": {
    "en": "Select from list...",
    "fa": "انتخاب از لیست..."
  },
  "fe.c845ae3e2c7f": {
    "en": "Optional description",
    "fa": "توضیحات اختیاری"
  },
  "fe.c84b0b9653d2": {
    "en": "Watch videos online — no downloading",
    "fa": "تماشای آنلاین ویدیوها — بدون امکان دانلود"
  },
  "fe.c95d717d07f3": {
    "en": "Store name",
    "fa": "نام فروشگاه"
  },
  "fe.ca053c38aab3": {
    "en": "Number of daily orders (last 30 days)",
    "fa": "تعداد سفارشات روزانه (۳۰ روز گذشته)"
  },
  "fe.ca65a3861238": {
    "en": "Error in receiving page list",
    "fa": "خطا در دریافت لیست صفحات"
  },
  "fe.cbdd92c58dc7": {
    "en": "Full logo",
    "fa": "لوگو کامل (Full)"
  },
  "fe.cc484500caf2": {
    "en": "No question has been registered yet.",
    "fa": "هنوز پرسشی ثبت نشده است."
  },
  "fe.cc595c628d02": {
    "en": "Please select a payment gateway.",
    "fa": "لطفا درگاه پرداخت را انتخاب کنید."
  },
  "fe.ccb4d3ccb062": {
    "en": "Name and surname",
    "fa": "نام و نام خانوادگی"
  },
  "fe.cd07f2cfe6a9": {
    "en": "Short description",
    "fa": "توضیح کوتاه"
  },
  "fe.cd22d8459875": {
    "en": "The payment was not made or was canceled by the user.",
    "fa": "پرداخت انجام نشد یا توسط کاربر لغو شد."
  },
  "fe.cdff645fda3a": {
    "en": "Blog tags",
    "fa": "تگ‌های بلاگ"
  },
  "fe.ce7c50b7c757": {
    "en": "Checking the request...",
    "fa": "در حال بررسی درخواست..."
  },
  "fe.cf62859a373b": {
    "en": "File editing",
    "fa": "ویرایش فایل"
  },
  "fe.d057c6a083ee": {
    "en": "Shop appearance and theme",
    "fa": "ظاهر و تم فروشگاه"
  },
  "fe.d0d693ec4a05": {
    "en": "Downloadable files",
    "fa": "فایل‌های دانلودی"
  },
  "fe.d115f4f0c7d6": {
    "en": "Error loading slider. Please try again.",
    "fa": "خطا در بارگذاری اسلایدر. لطفا دوباره تلاش کنید."
  },
  "fe.d1ecf8b0c92e": {
    "en": "Purchase information",
    "fa": "اطلاعات خرید"
  },
  "fe.d2b1f1485521": {
    "en": "Short description about the store",
    "fa": "توضیحات کوتاه درباره فروشگاه"
  },
  "fe.d300485eb19d": {
    "en": "Time:",
    "fa": "زمان:"
  },
  "fe.d344b0d737aa": {
    "en": "Types of features (color, size, ...)",
    "fa": "انواع ویژگی (رنگ، سایز، …)"
  },
  "fe.d37bde2dd5c2": {
    "en": "Create a new menu",
    "fa": "ایجاد منوی جدید"
  },
  "fe.d3df418952c1": {
    "en": "Enter the text...",
    "fa": "متن را وارد کنید..."
  },
  "fe.d460a8f2afb1": {
    "en": "add to basket",
    "fa": "به سبد اضافه کنید"
  },
  "fe.d48ba43e35aa": {
    "en": "Error in receiving menu list",
    "fa": "خطا در دریافت لیست منوها"
  },
  "fe.d4c0a3d2f1e3": {
    "en": "3",
    "fa": "۳"
  },
  "fe.d5ac0ce5aa3c": {
    "en": "Path *",
    "fa": "مسیر *"
  },
  "fe.d608a57ad765": {
    "en": "Invalid page id.",
    "fa": "شناسه صفحه نامعتبر است."
  },
  "fe.d644a27e8b32": {
    "en": "Log in by SMS",
    "fa": "ورود با پیامک"
  },
  "fe.d646430cb3c2": {
    "en": "Order status",
    "fa": "وضعیت سفارشات"
  },
  "fe.d7291a135bfe": {
    "en": "Error in receiving the list of sliders",
    "fa": "خطا در دریافت لیست اسلایدرها"
  },
  "fe.d74317ad9d8d": {
    "en": "For example, sending by courier",
    "fa": "مثلاً ارسال با پیک"
  },
  "fe.d771d724e830": {
    "en": "Error loading orders.",
    "fa": "خطا در بارگذاری سفارش‌ها."
  },
  "fe.d774fc588180": {
    "en": "The address of the article has not been specified.",
    "fa": "آدرس مطلب مشخص نشده است."
  },
  "fe.d7b6ad083b51": {
    "en": "Store content",
    "fa": "محتوای فروشگاه"
  },
  "fe.d8796b9191f9": {
    "en": "memory",
    "fa": "حافظه"
  },
  "fe.d95175effeea": {
    "en": "Toman",
    "fa": "تومان"
  },
  "fe.d9b12daef750": {
    "en": "Awaiting deposit",
    "fa": "در انتظار واریز"
  },
  "fe.d9bd169a16fa": {
    "en": "Are you sure you want to remove provider '{p1}'?",
    "fa": "آیا از حذف ارائه‌دهنده «{p1}» اطمینان دارید؟"
  },
  "fe.da05777a0c60": {
    "en": "The current address of the store",
    "fa": "آدرس فعلی فروشگاه"
  },
  "fe.da0c59052e40": {
    "en": "Shipment tracking code",
    "fa": "کد پیگیری مرسوله"
  },
  "fe.da45956880e0": {
    "en": "Please choose a rating (1 to 5 stars).",
    "fa": "لطفاً امتیاز (۱ تا ۵ ستاره) انتخاب کنید."
  },
  "fe.da4ccf55f535": {
    "en": "The desired slider is removed or disabled.",
    "fa": "اسلایدر مورد نظر حذف شده یا غیرفعال است."
  },
  "fe.dab2731d08f4": {
    "en": "Shaba number (IR...)",
    "fa": "شماره شبا (IR...)"
  },
  "fe.dabdaa630209": {
    "en": "without handle",
    "fa": "بدون دسته"
  },
  "fe.dabf0846b54a": {
    "en": "account settlement",
    "fa": "تسویه حساب"
  },
  "fe.dae3fe2ecc1a": {
    "en": "Provider *",
    "fa": "ارائه‌دهنده *"
  },
  "fe.dbff28a4556b": {
    "en": "Page",
    "fa": "صفحه"
  },
  "fe.dcb224fefbf3": {
    "en": "Maximum payment amount on the spot (riyal, optional)",
    "fa": "حداکثر مبلغ پرداخت در محل (ریال، اختیاری)"
  },
  "fe.dceea560895f": {
    "en": "There are no active slides for this slider.",
    "fa": "برای این اسلایدر، اسلاید فعالی وجود ندارد."
  },
  "fe.dd8cc3bfe74d": {
    "en": "Order not found or you do not have access to it.",
    "fa": "سفارش یافت نشد یا دسترسی به آن ندارید."
  },
  "fe.ddcd24cd4c82": {
    "en": "Electronic trust symbol (e-Namad)",
    "fa": "نماد اعتماد الکترونیکی (e-Namad)"
  },
  "fe.ddd4d39f44a5": {
    "en": "Added shipping method.",
    "fa": "روش ارسال اضافه شد."
  },
  "fe.de21bfe62ab5": {
    "en": "Edit",
    "fa": "ویرایش"
  },
  "fe.de246976c5ed": {
    "en": "zip code",
    "fa": "کد پستی"
  },
  "fe.de681d031ddc": {
    "en": "city ​​*",
    "fa": "شهر *"
  },
  "fe.de9268593609": {
    "en": "External stream link",
    "fa": "لینک استریم خارجی"
  },
  "fe.deee431f54aa": {
    "en": "Example: help, news",
    "fa": "مثال: راهنما، اخبار"
  },
  "fe.df2a80400e09": {
    "en": "close menu",
    "fa": "بستن منو"
  },
  "fe.dfa6f808895a": {
    "en": "Rome",
    "fa": "رم"
  },
  "fe.e0d9ce1d712e": {
    "en": "Video file",
    "fa": "فایل ویدیو"
  },
  "fe.e134feb58249": {
    "en": "Page title",
    "fa": "عنوان صفحه"
  },
  "fe.e146273098f3": {
    "en": "Enter the domain.",
    "fa": "دامنه را وارد کنید."
  },
  "fe.e1790250c94f": {
    "en": "All categories",
    "fa": "همه دسته‌ها"
  },
  "fe.e18c0fa8c726": {
    "en": "Successful payment",
    "fa": "پرداخت موفق"
  },
  "fe.e1fc225c108c": {
    "en": "SEO and analysis",
    "fa": "سئو و آنالیز"
  },
  "fe.e2016fb65b67": {
    "en": "Complete postal address",
    "fa": "آدرس کامل پستی"
  },
  "fe.e29663785b13": {
    "en": "After saving, the video is converted to HLS format and played safely.",
    "fa": "ویدیو پس از ذخیره به فرمت HLS تبدیل می‌شود و امن پخش می‌شود."
  },
  "fe.e2969985fcd0": {
    "en": "Error loading subscription information",
    "fa": "خطا در بارگذاری اطلاعات اشتراک"
  },
  "fe.e2db00cdfbbb": {
    "en": "You do not have a purchased file yet.",
    "fa": "هنوز فایل خریداری‌شده‌ای ندارید."
  },
  "fe.e335e6f3d1ea": {
    "en": "Write your comment...",
    "fa": "نظر خود را بنویسید..."
  },
  "fe.e3b74b127396": {
    "en": "Privacy",
    "fa": "حریم خصوصی"
  },
  "fe.e3bc523bbd19": {
    "en": "Favorites list",
    "fa": "لیست علاقه‌مندی‌ها"
  },
  "fe.e3d927082524": {
    "en": "active",
    "fa": "فعال"
  },
  "fe.e3ebbbaa2d1b": {
    "en": "Error loading categories.",
    "fa": "خطا در بارگذاری دسته‌بندی‌ها."
  },
  "fe.e42daea11702": {
    "en": "name *",
    "fa": "نام *"
  },
  "fe.e43d6856ea8d": {
    "en": "No form fields yet.",
    "fa": "هنوز هیچ فیلد فرم وجود ندارد."
  },
  "fe.e453c025a6ad": {
    "en": "Error deleting bank account.",
    "fa": "خطا در حذف حساب بانکی."
  },
  "fe.e5533711a140": {
    "en": "published",
    "fa": "منتشر شده"
  },
  "fe.e5c092d22967": {
    "en": "Add to Favorites",
    "fa": "افزودن به علاقه‌مندی"
  },
  "fe.e642e9116918": {
    "en": "Addresses",
    "fa": "آدرس‌ها"
  },
  "fe.e68a4edf84ec": {
    "en": "Profile",
    "fa": "پروفایل"
  },
  "fe.e6b682b21dab": {
    "en": "Error loading shopping cart.",
    "fa": "خطا در بارگذاری سبد خرید."
  },
  "fe.e6dc985b15cf": {
    "en": "Comments",
    "fa": "نظرات"
  },
  "fe.e701fae26148": {
    "en": "Add product",
    "fa": "افزودن محصول"
  },
  "fe.e71c7e4afc3e": {
    "en": "Desktop image is required.",
    "fa": "تصویر دسکتاپ الزامی است."
  },
  "fe.e7a966da9c66": {
    "en": "The sending method has been removed.",
    "fa": "روش ارسال حذف شد."
  },
  "fe.e7df86eae76d": {
    "en": "Manage menu items",
    "fa": "مدیریت آیتم‌های منو"
  },
  "fe.e87efda1e0fc": {
    "en": "Authenticated",
    "fa": "احراز هویت شده"
  },
  "fe.e89a9e839189": {
    "en": "The payment gateway is not defined",
    "fa": "درگاه پرداختی تعریف نشده است"
  },
  "fe.e8ed0b54adc4": {
    "en": "History of the commission",
    "fa": "تاریخچه کمیسیون"
  },
  "fe.e9067cbb0539": {
    "en": "The cost of each additional kilo (riyals)",
    "fa": "هزینه هر کیلو اضافه (ریال)"
  },
  "fe.e90dd815fc3e": {
    "en": "customer",
    "fa": "مشتری"
  },
  "fe.e9132998f41c": {
    "en": "Branding and logo",
    "fa": "برندینگ و لوگو"
  },
  "fe.e928b5f426ac": {
    "en": "Card number (optional)",
    "fa": "شماره کارت (اختیاری)"
  },
  "fe.e979266b88e7": {
    "en": "draft",
    "fa": "پیش‌نویس"
  },
  "fe.eb43a5d13afe": {
    "en": "Log in to view your downloads.",
    "fa": "برای مشاهده دانلودهای خود وارد شوید."
  },
  "fe.eb840d01131d": {
    "en": "Compare products",
    "fa": "مقایسه محصولات"
  },
  "fe.ebfe77ee1a18": {
    "en": "Error loading slider.",
    "fa": "خطا در بارگذاری اسلایدر."
  },
  "fe.ec33c2179e06": {
    "en": "Delete image",
    "fa": "حذف تصویر"
  },
  "fe.ec74c9f2566b": {
    "en": "Open this path",
    "fa": "این مسیر را باز کنید"
  },
  "fe.ecb93a414f80": {
    "en": "Product search...",
    "fa": "جستجوی محصول..."
  },
  "fe.ed2b116d8cb2": {
    "en": "No payment has been registered yet.",
    "fa": "هنوز پرداختی ثبت نشده است."
  },
  "fe.ed71d43cc2d2": {
    "en": "You have no purchased videos yet.",
    "fa": "هنوز ویدیوی خریداری‌شده‌ای ندارید."
  },
  "fe.ed83479b2f32": {
    "en": "blocked",
    "fa": "مسدود"
  },
  "fe.ed83bf914c7d": {
    "en": "my account",
    "fa": "حساب من"
  },
  "fe.eda0b1e7ea20": {
    "en": "Alt (image alt text)",
    "fa": "Alt (متن جایگزین تصویر)"
  },
  "fe.edba784f4102": {
    "en": "No article was found with this phrase.",
    "fa": "مطلبی با این عبارت یافت نشد."
  },
  "fe.ee50896917aa": {
    "en": "key (technical)",
    "fa": "کلید (فنی)"
  },
  "fe.ee8619fdc78d": {
    "en": "Ability to delete files",
    "fa": "امکان حذف فایل"
  },
  "fe.ef9ead4a3c5d": {
    "en": "Shipping information",
    "fa": "اطلاعات ارسال"
  },
  "fe.eff85c8b9036": {
    "en": "Post tracking",
    "fa": "پیگیری ارسال"
  },
  "fe.f028e62128b6": {
    "en": "Tucan wallet (overall)",
    "fa": "کیف پول توکان (سراسری)"
  },
  "fe.f02d402cab22": {
    "en": "inventory",
    "fa": "موجودی"
  },
  "fe.f04c5878defe": {
    "en": "departure",
    "fa": "خروج"
  },
  "fe.f1031f8fd33b": {
    "en": "picture (avatar)",
    "fa": "تصویر (آواتار)"
  },
  "fe.f10d051db982": {
    "en": "Successfully registered. Thank you for our newsletter!",
    "fa": "با موفقیت ثبت شد. از خبرنامه ما ممنونیم!"
  },
  "fe.f1402dc45f3f": {
    "en": "province",
    "fa": "استان"
  },
  "fe.f1479c4e46d3": {
    "en": "Similar products",
    "fa": "محصولات مشابه"
  },
  "fe.f19053e01fdf": {
    "en": "Choose a desktop image",
    "fa": "انتخاب تصویر دسکتاپ"
  },
  "fe.f2c214005f9f": {
    "en": "Slide title",
    "fa": "عنوان اسلاید"
  },
  "fe.f35872cd57a2": {
    "en": "The order number is not specified.",
    "fa": "شماره سفارش مشخص نشده است."
  },
  "fe.f3669791fd4f": {
    "en": "Log in to view orders",
    "fa": "برای مشاهده سفارش‌ها وارد شوید"
  },
  "fe.f40e21ecdb6f": {
    "en": "Are you sure you want to remove the '{p1}' slider? This will also delete all slides.",
    "fa": "آیا از حذف اسلایدر «{p1}» اطمینان دارید؟ این کار تمام اسلایدها را نیز حذف می‌کند."
  },
  "fe.f44ed45b517c": {
    "en": "search term...",
    "fa": "عبارت جستجو..."
  },
  "fe.f460f71ab096": {
    "en": "No categories found.",
    "fa": "دسته‌بندی‌ای یافت نشد."
  },
  "fe.f5fb8d7b4d78": {
    "en": "Blog and content management",
    "fa": "مدیریت بلاگ و محتوا"
  },
  "fe.f67f8f7bf4ec": {
    "en": "Your shopping cart is empty.",
    "fa": "سبد خرید شما خالی است."
  },
  "fe.f7cf82345ab4": {
    "en": "customized",
    "fa": "سفارشی"
  },
  "fe.f858a6cb795c": {
    "en": "Short description about the provider",
    "fa": "توضیحات کوتاه درباره ارائه‌دهنده"
  },
  "fe.f877b1be37b8": {
    "en": "Dashboard home page",
    "fa": "صفحه اصلی داشبورد"
  },
  "fe.f8ded3ffbc4c": {
    "en": "Product management",
    "fa": "مدیریت محصولات"
  },
  "fe.f8e2d7a6513e": {
    "en": "New tag",
    "fa": "تگ جدید"
  },
  "fe.f93805684cab": {
    "en": "date",
    "fa": "تاریخ"
  },
  "fe.f98b7a097e05": {
    "en": "Continue shopping",
    "fa": "ادامه خرید"
  },
  "fe.f9a76e7edd50": {
    "en": "Shop subscription",
    "fa": "اشتراک فروشگاه"
  },
  "fe.f9eb02dcfb89": {
    "en": "About a Serva store",
    "fa": "درباره فروشگاهی سِروا"
  },
  "fe.fa1c38b345bc": {
    "en": "Follow up and view orders",
    "fa": "پیگیری و مشاهده سفارش‌ها"
  },
  "fe.faa167cc3b58": {
    "en": "Provider",
    "fa": "ارائه‌دهنده"
  },
  "fe.facfb3d039a7": {
    "en": "Select image",
    "fa": "انتخاب تصویر"
  },
  "fe.fb2530214671": {
    "en": "release",
    "fa": "انتشار"
  },
  "fe.fb5c2dfd1ba4": {
    "en": "The cost of each additional kilo (tomans)",
    "fa": "هزینه هر کیلو اضافه (تومان)"
  },
  "fe.fc1d9d323674": {
    "en": "remove",
    "fa": "حذف"
  },
  "fe.fcee0c24a2e3": {
    "en": "Ask your question about this step",
    "fa": "سوال خود را درباره این مرحله بپرسید"
  },
  "fe.fed6ebca20fb": {
    "en": "Shipping methods",
    "fa": "روش‌های ارسال"
  },
  "fe.ff8598970b8f": {
    "en": "note (optional)",
    "fa": "یادداشت (اختیاری)"
  }
};

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, token: string) => {
    const value = vars[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}

export function tFrontendAuto(key: string, vars?: Record<string, string | number>): string {
  const record = AUTO_MESSAGES[key];
  if (!record) return key;
  return interpolate(pickByLocale(record), vars);
}
