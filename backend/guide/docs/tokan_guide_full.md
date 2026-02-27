---
title: مستندات کامل پلتفرم توکان فروشگاه‌ساز
tags: [معرفی, پلتفرم, راهنما]
---

# مستندات کامل پلتفرم توکان فروشگاه‌ساز

**خلاصه (برای کاربر):** توکان یک پلتفرم جامع برای ساخت و مدیریت فروشگاه آنلاین است. بدون نیاز به کدنویسی، فروشگاه خود را راه‌اندازی کنید، محصولات و بلاگ اضافه کنید، سفارشات را مدیریت کنید و با تم‌های آماده ظاهر فروشگاه را سفارشی‌سازی کنید.

**توضیحات کامل (برای هوش مصنوعی):** پلتفرم توکان (Tokan Shop Builder) یک سرویس SaaS برای ایجاد فروشگاه آنلاین است. معماری: بک‌اند Django REST Framework، فرانت فروشگاه Next.js با سیستم تم و ویجت، فرانت داشبورد React/Next.js، لندینگ جداگانه. هر فروشگاه دارای دامنه اختصاصی (ساب‌دامین یا دامنه سفارشی)، سیستم اشتراک، درگاه پرداخت، روش‌های ارسال، بلاگ، صفحه‌ساز، منوها، اسلایدرها و مدیریت کاربران است. محدودیت: حداکثر ۵ فروشگاه به ازای هر کاربر عادی.


---
title: رسالت و اهداف پلتفرم توکان
tags: [معرفی, بیزینس, اهداف]
---

# رسالت و اهداف پلتفرم توکان

**خلاصه (برای کاربر):** توکان با هدف ساده‌سازی فروش آنلاین برای همه ایجاد شده. راه‌اندازی سریع، ابزارهای حرفه‌ای و قیمت مناسب برای شروع کسب‌وکار آنلاین.

**توضیحات کامل (برای هوش مصنوعی):** رسالت توکان: democratize کردن فروش آنلاین برای صاحبان کسب‌وکارهای کوچک و متوسط در ایران. اهداف: (۱) راه‌اندازی سریع فروشگاه در کمتر از ۱۵ دقیقه با فلو ستاپ مبتنی بر OTP، (۲) ارائه ابزارهای حرفه‌ای سئو، آنالیتیکس، ترب، نماد اعتماد و درگاه پرداخت بدون نیاز به دانش فنی، (۳) مدل اشتراک با پلن رایگان ۳۰ روزه برای شروع، (۴) پشتیبانی از تم‌های متنوع و صفحه‌ساز برای سفارشی‌سازی ظاهر، (۵) کیف پول کاربر برای تراکنش‌های داخلی.


---
title: قوانین و محدودیت‌های پلتفرم
tags: [قوانین, محدودیت, پلتفرم]
---

# قوانین و محدودیت‌های پلتفرم

**خلاصه (برای کاربر):** هر کاربر حداکثر ۵ فروشگاه می‌تواند ایجاد کند. آدرس فروشگاه باید منحصر به فرد و حداقل ۳ کاراکتر باشد و از کلمات رزرو شده استفاده نشود. فروشگاه با اشتراک منقضی شده بیش از ۱۰ روز غیرفعال می‌شود.

**توضیحات کامل (برای هوش مصنوعی):** محدودیت‌های پلتفرم: (۱) حداکثر ۵ فروشگاه به ازای هر کاربر غیر سوپریوزر (store/views.py)، (۲) نام ساب‌دامین (store.name) باید ۳ تا ۶۳ کاراکتر، فقط a-z و 0-9 و خط تیره، نباید با خط تیره شروع یا تمام شود، نباید عدد خالص باشد، (۳) لیست گسترده کلمات رزرو شده شامل brands (digikala, torob، …)، نام‌های جغرافیایی، فنی (api, admin، …) و الفاظ نامناسب، (۴) فروشگاه بن شده (is_banned) نمی‌تواند فعال باشد، (۵) اشتراک منقضی شده بیش از ۱۰ روز: صفحه «اشتراک منقضی شده» نمایش داده می‌شود و فروشگاه غیرفعال است، (۶) دسترسی داشبورد: تنها is_superuser یا store_user با is_admin یا is_vendor.


---
title: راه‌اندازی فروشگاه (ستاپ)
tags: [ستاپ, راه‌اندازی, فروشگاه]
---

# راه‌اندازی فروشگاه (ستاپ)

**خلاصه (برای کاربر):** از مسیر /setup در لندینگ، طی ۶ قدم: ورود با موبایل و OTP، وارد کردن نام و آدرس فروشگاه، شعار و توضیحات، لوگو (اختیاری)، انتخاب تم و در نهایت ساخت فروشگاه با پلن رایگان ۳۰ روزه.

**توضیحات کامل (برای هوش مصنوعی):** فلو ستاپ در landing/src/app/setup/page.tsx: (۱) Auth: درخواست OTP با normalizeMobile، تایید OTP، ذخیره token در localStorage به فرمت tokan_auth_v1، (۲) Info: نام فروشگاه (storeTitle)، آدرس انگلیسی (storeName)، بررسی با checkStoreName، انتخاب نوع فروشگاه (store_category)، (۳) Extra: شعار و توضیحات اختیاری، (۴) Logo: مرحله اختیاری، قابل انجام بعداً از تنظیمات، (۵) Theme: لیست تم‌ها از getThemes، انتخاب تم پیش‌فرض یا سِروا، (۶) Create: createStore با name, title, description, slogan, store_category, theme_slug، در صورت موفقیت ریدایرکت به https://{internal_domain}/dashboard. فروشگاه جدید با پلن اشتراک رایگان ۳۰ روزه ساخته می‌شود. آدرس فروشگاه: {name}.tokan.app یا دامنه سفارشی.


---
title: تسک‌های راه‌اندازی (Setup Tasks)
tags: [ستاپ, تسک, راه‌اندازی]
---

# تسک‌های راه‌اندازی (Setup Tasks)

**خلاصه (برای کاربر):** پس از ساخت فروشگاه، لیست قدم‌های پیشنهادی را انجام دهید: دامنه، نماد اعتماد، درگاه، ارسال، اولین محصول، سئو، بلاگ، ترب، لوگو و اشتراک. با «راه‌اندازی هوشمند» می‌توانید همه را با پرداخت یکجا انجام دهید.

**توضیحات کامل (برای هوش مصنوعی):** تسک‌ها در backend/store/setup_utils.py SETUP_TASKS: domain (اجباری)، enamad (اجباری)، payment (اجباری)، shipping (اجباری)، first_product (اجباری)، google_search_console (اختیاری)، google_analytics (اختیاری)، google_tag_manager (اختیاری)، first_blog (اختیاری)، torob (اختیاری)، branding (اختیاری)، subscription (اجباری)، start_selling (اجباری). هر تسک دارای guide_path برای آموزش. راه‌اندازی هوشمند: مدل SmartSetupRequest، SmartSetupPayment، cost از SystemConfig، با پرداخت موفق status=done و همه تسک‌ها انجام‌شده تلقی می‌شوند. API: getSetupProgress، getSmartSetupCost، createSmartSetupRequest.


---
title: داشبورد اصلی
tags: [داشبورد, صفحه]
---

# داشبورد اصلی

**خلاصه (برای کاربر):** صفحه اصلی داشبورد با خلاصه آمار فروش، سفارشات و محصولات، بخش راه‌اندازی (تسک‌ها)، لینک سریع به امور مالی و سفارشات، و دسترسی به اعلانات.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard. نمایش: آمار (تعداد محصولات، کاربران، مقالات، اسلایدرها، درآمد امروز، درآمد این ماه، سفارشات امروز، سفارشات این ماه)، SetupTasksSection در صورت وجود تسک‌های انجام‌نشده، کارت‌های لینک به products، users، blog، sliders، finance، orders. نیازمند: کاربر احراز هویت با دسترسی ادمین یا وندور. Layout: DashboardLayout با سایدبار، هدر با انتخاب فروشگاه، اشتراک، کیف پول، اعلانات.


---
title: تنظیمات فروشگاه - تب اطلاعات کلی
tags: [تنظیمات, اطلاعات کلی, داشبورد]
---

# تنظیمات فروشگاه - تب اطلاعات کلی

**خلاصه (برای کاربر):** نام فروشگاه، نام انگلیسی، توضیحات و شعار فروشگاه را اینجا تنظیم کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/settings?tab=general. فیلدها: title (نام فروشگاه)، en_title (نام انگلیسی)، description (توضیحات)، slogan (شعار). ذخیره با storeApi.updateStore. همه فیلدها در form state و به API ارسال می‌شوند.


---
title: تنظیمات فروشگاه - تب تماس و شبکه‌های اجتماعی
tags: [تنظیمات, تماس, شبکه اجتماعی]
---

# تنظیمات فروشگاه - تب تماس و شبکه‌های اجتماعی

**خلاصه (برای کاربر):** شماره تماس، ایمیل، آدرس و لینک شبکه‌های اجتماعی فروشگاه را تنظیم کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/settings?tab=contact. فیلدهای StoreSetting با definition مربوط به تماس و شبکه‌های اجتماعی: تلفن، ایمیل، آدرس، اینستاگرام، تلگرام، واتساپ و سایر شبکه‌ها. ذخیره از طریق storeApi.updateStoreSettings با storeSettingsForm. این تنظیمات در فوتر و صفحات تماس نمایش داده می‌شوند.


---
title: تنظیمات فروشگاه - تب برندینگ و لوگو
tags: [تنظیمات, برندینگ, لوگو]
---

# تنظیمات فروشگاه - تب برندینگ و لوگو

**خلاصه (برای کاربر):** لوگوی کامل، لوگوی مینیمال و فاویکون فروشگاه را انتخاب یا آپلود کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/settings?tab=branding. فیلدها: favicon، minimal_logo، full_logo (هر سه FK به media.Media). انتخاب از FileManagerModal. ذخیره با favicon، minimal_logo، full_logo در updateStore. در صورت نبود favicon، از minimal_logo به عنوان favicon استفاده می‌شود (get_favicon در مدل Store).


---
title: تنظیمات فروشگاه - تب دامنه و آدرس
tags: [تنظیمات, دامنه]
---

# تنظیمات فروشگاه - تب دامنه و آدرس

**خلاصه (برای کاربر):** آدرس پیش‌فرض شما {name}.tokan.app است. می‌توانید دامنه سفارشی (مثلاً shop.example.com) متصل کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/settings?tab=domain. فیلد external_domain برای دامنه سفارشی. internal_domain: اگر external_domain خالی باشد {name}.{super_store.external_domain} (معمولاً tokan.app). در صورت external_domain، is_shared_store=false. اعتبارسنجی URL در مدل Store. پس از تغییر، revalidateStorePages فراخوانی می‌شود.


---
title: تنظیمات فروشگاه - تب ظاهر و تم
tags: [تنظیمات, تم, ظاهر]
---

# تنظیمات فروشگاه - تب ظاهر و تم

**خلاصه (برای کاربر):** تم فروشگاه را انتخاب کنید. تم‌های فعلی: پیش‌فرض (default) و سِروا (serva). ظاهر هدر و فوتر و رنگ‌ها بسته به تم تغییر می‌کند.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/settings?tab=theme. theme_slug از لیست تم‌های API. ThemeSettingsSection برای تنظیمات اضافی تم. تم‌ها از page.Theme در بک‌اند و themes در فرانت (default، serva). theme_slug در Store از طریق theme relation یا theme_slug فیلد. ذخیره با handleSave و overrides.theme_slug.


---
title: تنظیمات فروشگاه - تب درگاه‌های پرداخت
tags: [تنظیمات, درگاه, پرداخت]
---

# تنظیمات فروشگاه - تب درگاه‌های پرداخت

**خلاصه (برای کاربر):** درگاه‌های پرداخت فعال برای فروشگاه را پیکربندی کنید. هر درگاه عنوان، حالت سندباکس و پارامترهای اتصال دارد.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/settings?tab=payment. لیست PaymentGateway از paymentApi.listGateways. برای هر درگاه: title، is_sandbox، configuration (JSON). ذخیره با paymentApi.updateGateway. گیت‌وی‌ها توسط ادمین سیستم تعریف شده و هر فروشگاه پیکربندی خود را دارد. انواع درگاه از PaymentGatewayType با has_sandbox.


---
title: تنظیمات فروشگاه - تب روش‌های ارسال
tags: [تنظیمات, ارسال, شیپینگ]
---

# تنظیمات فروشگاه - تب روش‌های ارسال

**خلاصه (برای کاربر):** روش‌های ارسال مانند پست، تیپاکس و ارسال اکسپرس را با هزینه پایه، هزینه به ازای کیلو اضافه و امکان پرداخت در محل تعریف کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/settings?tab=shipping. CRUD ShippingMethod از orderApi: listShippingMethods، createShippingMethod، updateShippingMethod، deleteShippingMethod. فیلدها: name، description، base_shipping_price، shipping_price_per_extra_kilograms، tracking_code_base_url، shipping_payment_on_delivery، product_payment_on_delivery، max_payment_on_delivery، is_active. tracking_optional برای روش‌هایی که کد رهگیری اختیاری است.


---
title: تنظیمات فروشگاه - تب سئو و آنالیتیکس
tags: [تنظیمات, سئو, آنالیتیکس]
---

# تنظیمات فروشگاه - تب سئو و آنالیتیکس

**خلاصه (برای کاربر):** اتصال به Google Search Console، Google Analytics و Google Tag Manager برای بهبود سئو و تحلیل ترافیک. تنظیمات ترب و آنالیتیکس توروب نیز اینجا است.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/settings?tab=seo. StoreSetting برای: google_search_console، google_analytics، google_tag_manager، torob، seo_analytics_torob_settings. کدهای اسکریپت و شناسه‌ها در head یا body صفحه فروشگاه تزریق می‌شوند. ترب برای لیست کردن محصولات در مقایسه‌گر ترب.


---
title: تنظیمات فروشگاه - تب نمادها
tags: [تنظیمات, نماد, اعتماد]
---

# تنظیمات فروشگاه - تب نمادها

**خلاصه (برای کاربر):** کد نماد اعتماد الکترونیکی و ساماندهی را اینجا وارد کنید تا در فوتر فروشگاه نمایش داده شوند.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/settings?tab=badges. StoreSetting برای enamad و samandehi. extract_badge_link_from_html در setup_utils برای استخراج لینک از کد HTML. تسک enamad در Setup Tasks به این تب لینک دارد.


---
title: تنظیمات فروشگاه - تب تنظیمات پیشرفته
tags: [تنظیمات, پیشرفته]
---

# تنظیمات فروشگاه - تب تنظیمات پیشرفته

**خلاصه (برای کاربر):** تنظیمات سیستمی قابل ویرایش توسط فروشگاه؛ رنگ‌ها، گزینه‌های نمایش و سایر پارامترها.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/settings?tab=store-settings. StoreSetting با definition دارای can_edit_by_store=true. انواع: color، int، float، bool، url، text. کلید theme_slug قابل ویرایش توسط فروشگاه نیست. ذخیره با updateStoreSettings. SettingDefinition در admin تعریف می‌شود.


---
title: مدیریت محصولات
tags: [داشبورد, محصولات]
---

# مدیریت محصولات

**خلاصه (برای کاربر):** لیست محصولات، افزودن محصول جدید، ویرایش و حذف. هر محصول شامل عنوان، توضیحات، قیمت، تصاویر، موجودی و دسته‌بندی است.

**توضیحات کامل (برای هوش مصنوعی):** مسیرها: /dashboard/products (لیست)، /dashboard/products/new (جدید)، /dashboard/products/[id]/edit (ویرایش). API: productApi. مدل Product با title، description، price، images (Media)، stock، categories (M2M)، و سایر فیلدها. فیلتر و جستجو در لیست. محصولات در ویجت product.listview و product.detail نمایش داده می‌شوند. مسیر فروشگاهی: /product/:id/:slug یا /products/search.


---
title: مدیریت سفارشات
tags: [داشبورد, سفارشات]
---

# مدیریت سفارشات

**خلاصه (برای کاربر):** لیست سفارشات، مشاهده جزئیات هر سفارش، وضعیت پرداخت و ارسال، و به‌روزرسانی وضعیت.

**توضیحات کامل (برای هوش مصنوعی):** مسیرها: /dashboard/orders، /dashboard/orders/[code]. مدل Order با code، items، shipping_address، payment_status، shipping_method. سفارش با کد یکتا. مشتری در فرانت می‌تواند با /order/:code وضعیت را ببیند. orderApi برای لیست و جزئیات.


---
title: آمار مالی
tags: [داشبورد, مالی, آمار]
---

# آمار مالی

**خلاصه (برای کاربر):** خلاصه درآمد فروشگاه: درآمد امروز، این ماه و گزارش‌های مالی.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/finance. داده‌های مالی از API مرتبط با سفارشات و پرداخت. لینک از داشبورد اصلی. Plan.shared_payment_percentage برای محاسبه سهم پلتفرم.


---
title: بلاگ و محتوا
tags: [داشبورد, بلاگ]
---

# بلاگ و محتوا

**خلاصه (برای کاربر):** مدیریت مقالات بلاگ، دسته‌بندی‌ها و انتشار. هر مقاله دارای عنوان، slug، خلاصه، بدنه مارک‌داون و تصویر است.

**توضیحات کامل (برای هوش مصنوعی):** مسیرها: /dashboard/blog، /dashboard/blog/new، /dashboard/blog/[slug]/edit، /dashboard/blog/categories. مدل Article با title، slug، summary، body (markdown)، categories. ویجت blog.listview، blog.detail، blog.search. مسیرهای فروشگاهی: /blog، /blog/:slug، /blog/search. moduleFilter برای STORE یا blog.


---
title: اعلانات
tags: [داشبورد, اعلانات]
---

# اعلانات

**خلاصه (برای کاربر):** اعلانات سیستم و اطلاع‌رسانی‌های مهم پلتفرم را بخوانید. تعداد اعلانات خوانده‌نشده در آیکون اعلان نمایش داده می‌شود.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/notifications. announcementApi برای لیست و unreadCount. NotificationBell در هدر داشبورد. رفرش هر ۶۰ ثانیه. مدل Announcement در notification اپ.


---
title: مدیریت کاربران
tags: [داشبورد, کاربران]
---

# مدیریت کاربران

**خلاصه (برای کاربر):** کاربران دارای دسترسی به فروشگاه (ادمین، وندور) را مدیریت کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/users. StoreUser با سطح دسترسی (is_admin، is_vendor). account API. کاربران برای نقش‌های مختلف فروشگاه تعریف می‌شوند. دسترسی داشبورد بر اساس store_user است.


---
title: مدیریت منوها
tags: [داشبورد, منو]
---

# مدیریت منوها

**خلاصه (برای کاربر):** منوی هدر و فوتر فروشگاه را با آیتم‌ها و زیرمنوها بسازید و مرتب کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیرها: /dashboard/menus، /dashboard/menus/[id]، /dashboard/menus/[id]/edit. مدل Menu و MenuItem با ساختار سلسله‌مراتبی. href، label، ترتیب. منوها در ویجت layout/header برای navigations استفاده می‌شوند.


---
title: مدیریت اسلایدرها
tags: [داشبورد, اسلایدر]
---

# مدیریت اسلایدرها

**خلاصه (برای کاربر):** اسلایدرهای صفحه اصلی و سایر صفحات را با تصویر، لینک و متن اضافه یا ویرایش کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیرها: /dashboard/sliders، /dashboard/sliders/[id]. مدل Slider و SliderItem. ویجت slider با widgetConfig.slider_id. اسلایدر در صفحه اصلی (path=/) استفاده می‌شود.


---
title: مدیریت فایل‌ها (مدیا)
tags: [داشبورد, مدیا, فایل]
---

# مدیریت فایل‌ها (مدیا)

**خلاصه (برای کاربر):** آپلود و مدیریت تصاویر و فایل‌های فروشگاه. از اینجا برای لوگو، محصولات و بلاگ فایل انتخاب می‌کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/media. media API. مدل Media برای فایل‌ها. FileManagerModal برای انتخاب در تنظیمات. مدیا به Store و Product و Article و غیره لینک می‌شود. آپلود با mediaApi.


---
title: صفحه‌ساز
tags: [داشبورد, صفحه, صفحه‌ساز]
---

# صفحه‌ساز

**خلاصه (برای کاربر):** صفحات فروشگاه را با افزودن ویجت‌ها (اسلایدر، لیست محصولات، بلاگ، دسته‌بندی و...) بسازید. مسیر ثابت یا الگوی داینامیک برای هر صفحه تعریف کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیرها: /dashboard/pages، /dashboard/pages/[id]/edit. مدل Page با path (ثابت یا الگو مثل /product/:id:number/:slug?:string)، title، meta_title، meta_description. Widget مرتبط با WidgetType. محتوای صفحه از layout (هدر/فوتر) و content widgets تشکیل می‌شود. PageSerializer و get_by_path برای API. path_utils.match_path برای تطبیق مسیر داینامیک.


---
title: اشتراک فروشگاه
tags: [داشبورد, اشتراک]
---

# اشتراک فروشگاه

**خلاصه (برای کاربر):** تمدید اشتراک، انتخاب پلن و مدت، و مشاهده تاریخچه پرداخت‌های اشتراک.

**توضیحات کامل (برای هوش مصنوعی):** مسیرها: /dashboard/subscription، /dashboard/subscription/history. SubscriptionPlan، SubscriptionPlanDuration (۱، ۳، ۱۲ ماه با base_price و discount_percent)، SubscriptionDiscountCode، SubscriptionPayment. پس از completed، subscription_expires_at تمدید و subscription_plan به‌روز می‌شود. grace period ۱۰ روز پس از انقضا. وضعیت اشتراک در هدر داشبورد نمایش داده می‌شود (ok، warning، expired).


---
title: کیف پول
tags: [داشبورد, کیف پول]
---

# کیف پول

**خلاصه (برای کاربر):** موجودی کیف پول خود را ببینید و برای تراکنش‌های داخلی پلتفرم استفاده کنید.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/wallet. wallet API. مدل Wallet با available_balance. هر store دارای wallet برای owner. موجودی در منوی حساب کاربری هدر داشبورد نمایش داده می‌شود. کیف پول برای شارژ، برداشت و تراکنش‌های درون پلتفرمی استفاده می‌شود.


---
title: ورود به داشبورد
tags: [داشبورد, ورود, لاگین]
---

# ورود به داشبورد

**خلاصه (برای کاربر):** برای ورود از دامنه فروشگاه یا لندینگ، با موبایل و کد OTP وارد شوید. در صورت نداشتن دسترسی ادمین، پیام «دسترسی غیرمجاز» نمایش داده می‌شود.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /dashboard/login. drfpasswordless برای OTP. توکن در localStorage به نام tokan_auth_v1. Layout چک می‌کند: user، hasDashboardAccess (is_superuser یا store_user.is_admin یا store_user.is_vendor). در صورت عدم احراز هویت، لینک به /dashboard/login?next=... ارائه می‌شود. حداکثر ۵ فروشگاه برای کاربر غیر سوپریوزر.


---
title: تم پیش‌فرض (default)
tags: [تم, ظاهر]
---

# تم پیش‌فرض (default)

**خلاصه (برای کاربر):** تم ساده و حرفه‌ای با ویجت‌های اصلی: layout، محصولات، دسته‌بندی، سبد، تسویه، سفارش، بلاگ، اسلایدر، پروفایل، ورود و صفحات خطا.

**توضیحات کامل (برای هوش مصنوعی):** theme id: default. ویجت‌ها: layout (header/footer)، product.detail، product.listview، product.search، category.listview، category.search، basket، checkout، order.listview، order.detail، blog.listview، blog.detail، blog.search، slider، profile، login، static.403، static.404، static.500. provider: DefaultThemeProvider. design-tokens.ts برای ثبات طراحی. مسیر ویجت: themes/default/widgets/{type}/{variant}/index.tsx.


---
title: تم سِروا (serva)
tags: [تم, ظاهر]
---

# تم سِروا (serva)

**خلاصه (برای کاربر):** تم غنی‌تر با تمام امکانات تم پیش‌فرض به علاوه صفحات استاتیک بیشتر: درباره ما، تماس، حریم خصوصی، قوانین، سوالات متداول، مقایسه، لیست علاقه‌مندی و صفحه موفق/ناموفق پرداخت.

**توضیحات کامل (برای هوش مصنوعی):** theme id: serva. ویجت‌های اضافی نسبت به default: static.about، static.contact، static.privacy، static.terms، static.faq، static.compare، static.wishlist، static.return-policy، static.shipping، static.payment-success، static.payment-failed، static.coming-soon، static.loading، home.features، home.newsletter. بقیه ویجت‌ها مانند default با استایل متفاوت. provider: ServaThemeProvider. UI مدرن‌تر و صفحات بیشتر برای تبدیل بهتر.


---
title: ویجت‌ها و ساختار تم
tags: [تم, ویجت]
---

# ویجت‌ها و ساختار تم

**خلاصه (برای کاربر):** هر صفحه فروشگاه از ویجت‌ها ساخته می‌شود: layout برای هدر و فوتر، و ویجت‌های محتوا مثل لیست محصولات، جزئیات محصول، سبد خرید و غیره. ویجت‌ها از صفحه‌ساز به صفحه اضافه می‌شوند.

**توضیحات کامل (برای هوش مصنوعی):** WidgetType با is_layout برای layout. Widget با widget_type، index، components_config، extra_request_params، widget_config. مسیر ویجت در فرانت: themes/{themeId}/widgets/{widgetType.replaceAll('.','/')}/index.tsx. مثال: product.detail → product/detail/index.tsx. PageConfig شامل layout و content با لیست config ویجت. pathParams از match_path برای مسیر داینامیک در widgetConfig. render.tsx: dynamic import، MissingWidgetFallback برای ویجت‌های نامشخص. SSR با fetchPageWidgetData و PageRuntimeProvider.


---
title: صفحات فروشگاه - خانه و جستجو
tags: [صفحات, فروشگاه]
---

# صفحات فروشگاه - خانه و جستجو

**خلاصه (برای کاربر):** صفحه اصلی معمولاً اسلایدر، دسته‌بندی‌ها و محصولات منتخب دارد. جستجوی محصولات از مسیر /products/search و جستجوی بلاگ از /blog/search انجام می‌شود.

**توضیحات کامل (برای هوش مصنوعی):** path=/ برای خانه. ویجت‌ها: slider، category.listview، product.listview، blog.listview (در serva)، home.features، home.newsletter. product.search در /products/search با query param q. category.search در /categories. blog.search در /blog/search. widgetConfig شامل module، page_size، title، subtitle، limit، root_only و غیره.


---
title: صفحات فروشگاه - محصول و دسته‌بندی
tags: [صفحات, محصول, دسته]
---

# صفحات فروشگاه - محصول و دسته‌بندی

**خلاصه (برای کاربر):** صفحه هر محصول با آدرس /product/:id/:slug و لیست دسته‌بندی‌ها در صفحه اصلی یا /categories. افزودن به سبد از صفحه محصول انجام می‌شود.

**توضیحات کامل (برای هوش مصنوعی):** product.detail با pathParams.id و pathParams.slug. API محصول با id. دسته‌بندی‌ها با moduleFilter (STORE یا blog)، parentOnly/root_only. category.listview برای نمایش دسته‌ها. product.listview برای لیست محصولات با pagination. لینک‌ها به /product/:id، /products/search.


---
title: صفحات فروشگاه - سبد خرید و تسویه
tags: [صفحات, سبد, تسویه]
---

# صفحات فروشگاه - سبد خرید و تسویه

**خلاصه (برای کاربر):** سبد خرید در /basket و تسویه حساب در /checkout. برای تسویه باید وارد شوید. انتخاب روش پرداخت و ارسال در checkout انجام می‌شود.

**توضیحات کامل (برای هوش مصنوعی):** ویجت basket در /basket. ویجت checkout در /checkout. در صورت عدم ورود، redirect به /login?next=/checkout یا /basket. basket API برای items، add، remove، update. checkout شامل انتخاب آدرس، روش ارسال، درگاه پرداخت. پس از پرداخت موفق redirect به /payment-success یا payment-failed. Payment gateway redirect به store.get_website_url.


---
title: صفحات فروشگاه - سفارش و پروفایل
tags: [صفحات, سفارش, پروفایل]
---

# صفحات فروشگاه - سفارش و پروفایل

**خلاصه (برای کاربر):** لیست سفارشات کاربر در /orders و جزئیات هر سفارش در /order/:code. پروفایل کاربر در /profile. برای مشاهده باید وارد شوید.

**توضیحات کامل (برای هوش مصنوعی):** order.listview در /orders. order.detail در /order/:code با pathParams.code. profile ویجت در /profile. نیاز به احراز هویت. لینک به /login?next=... در صورت عدم ورود. order detail نمایش وضعیت پرداخت، ارسال، کد رهگیری، آیتم‌ها.


---
title: صفحات فروشگاه - بلاگ
tags: [صفحات, بلاگ]
---

# صفحات فروشگاه - بلاگ

**خلاصه (برای کاربر):** لیست مقالات در /blog، هر مقاله در /blog/:slug و جستجو در /blog/search.

**توضیحات کامل (برای هوش مصنوعی):** blog.listview در /blog با pagination. blog.detail در /blog/:slug با pathParams.slug. blog.search در /blog/search. moduleFilter برای blog یا STORE. مقالات مرتبط، دسته‌بندی‌ها و تگ‌ها در جزئیات نمایش داده می‌شوند.


---
title: صفحات فروشگاه - ورود و ثبت‌نام
tags: [صفحات, ورود]
---

# صفحات فروشگاه - ورود و ثبت‌نام

**خلاصه (برای کاربر):** ورود با موبایل و OTP در صفحه /login. پس از ورود به next پارامتر ریدایرکت می‌شوید.

**توضیحات کامل (برای هوش مصنوعی):** ویجت login در /login. drfpasswordless OTP. query param next برای redirect پس از ورود. توکن در localStorage. استفاده در checkout، orders، profile، basket برای کاربران مهمان.


---
title: صفحات استاتیک تم سِروا
tags: [صفحات, استاتیک, سِروا]
---

# صفحات استاتیک تم سِروا

**خلاصه (برای کاربر):** درباره ما، تماس، حریم خصوصی، قوانین، سوالات متداول، مقایسه، لیست علاقه‌مندی، شیوه ارسال، مرجوعی و صفحه موفق/ناموفق پرداخت در تم سِروا موجود است.

**توضیحات کامل (برای هوش مصنوعی):** static.about (/about)، static.contact (/contact)، static.privacy (/privacy)، static.terms (/terms)، static.faq (/faq)، static.compare (/compare)، static.wishlist (/wishlist)، static.return-policy (/return-policy)، static.shipping (/shipping)، static.payment-success، static.payment-failed، static.coming-soon، static.loading. محتوا از صفحه‌ساز یا ویجت ثابت. این صفحات باید در Page با path متناظر و widget مناسب تعریف شوند.


---
title: صفحات خطا
tags: [صفحات, خطا]
---

# صفحات خطا

**خلاصه (برای کاربر):** صفحه ۴۰۴ برای یافت نشدن، ۴۰۳ برای دسترسی غیرمجاز و ۵۰۰ برای خطای سرور. تم سِروا و پیش‌فرض هر دو این صفحات را پشتیبانی می‌کنند.

**توضیحات کامل (برای هوش مصنوعی):** static.404، static.403، static.500. همچنین subscription_expired برای اشتراک منقضی شده بیش از ۱۰ روز. page serializer در صورت is_subscription_expired_over_10_days، widgets خالی و subscription_expired: true برمی‌گرداند. فرانت صفحه مخصوص اشتراک منقضی شده را نمایش می‌دهد.


---
title: لندینگ - صفحه اصلی
tags: [لندینگ]
---

# لندینگ - صفحه اصلی

**خلاصه (برای کاربر):** صفحه معرفی توکان با هیرو، خدمات، رشد با AI، فرآیند راه‌اندازی، قیمت‌گذاری، نمونه فروشگاه‌ها، سوالات متداول و تماس.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: / (دامنه لندینگ). کامپوننت‌ها: Header، Hero، Services، AIGrowth، Process، Pricing، Showcase، FAQ، Contact، Footer. لندینگ جدا از فروشگاه و داشبورد. برای جذب کاربر و هدایت به /setup برای ساخت فروشگاه.


---
title: لندینگ - راه‌اندازی فروشگاه
tags: [لندینگ, ستاپ]
---

# لندینگ - راه‌اندازی فروشگاه

**خلاصه (برای کاربر):** از مسیر /setup مراحل ساخت فروشگاه را طی کنید: ورود با OTP، اطلاعات فروشگاه، شعار و توضیحات، لوگو (اختیاری)، انتخاب تم و ساخت با پلن رایگان ۳۰ روزه.

**توضیحات کامل (برای هوش مصنوعی):** مسیر: /setup در لندینگ. فلو ۶ مرحله‌ای. ریدایرکت به https://{internal_domain}/dashboard پس از createStore. توکن در URL hash (#auth=) در صورت وجود برای SSO به داشبورد فرعی.


---
title: راهنمای هوشمند و چت AI
tags: [راهنما, AI]
---

# راهنمای هوشمند و چت AI

**خلاصه (برای کاربر):** دکمه «راهنمای این صفحه» در داشبورد باز می‌شود و چت هوش مصنوعی برای پرسش درباره صفحه فعلی در دسترس است. ویدیوها و مستندات مرتبط با هر صفحه از PageGuide و DocSection لود می‌شوند.

**توضیحات کامل (برای هوش مصنوعی):** VideoHelpDrawer با دکمه Sparkles در ساید چپ. PageGuide مدل با path، video_desktop، video_mobile، description، doc_sections (M2M به DocSection). DocSection با title، tags، body (markdown). chat_service برای چت AI با استفاده از DocSection به عنوان context. markdown_import برای import فایل md به DocSection. راهنماها با guide_path در Setup Tasks برای هر تسک. SetupGuideModal برای نمایش راهنما.


---
title: کیف پول و پرداخت اشتراک
tags: [کیف پول, اشتراک, پرداخت]
---

# کیف پول و پرداخت اشتراک

**خلاصه (برای کاربر):** کیف پول برای موجودی کاربر. پرداخت اشتراک از درگاه متصل به فروشگاه انجام می‌شود. کد تخفیف برای اشتراک قابل استفاده است.

**توضیحات کامل (برای هوش مصنوعی):** Wallet برای تراکنش‌های داخلی. SubscriptionPayment با Payment FK. پس از completed، complete() فراخوانی و subscription_expires_at و subscription_plan به‌روز می‌شود. SubscriptionDiscountCode با discount_type (percent/fixed)، valid_from، valid_until، max_uses، plan، min_duration_months. apply_discount برای محاسبه تخفیف.


---
title: دامنه و DNS
tags: [دامنه, DNS]
---

# دامنه و DNS

**خلاصه (برای کاربر):** آدرس پیش‌فرض {name}.tokan.app است. برای دامنه سفارشی، رکوردهای DNS را طبق راهنما تنظیم کنید. پشتیبانی از اتصال دامنه شخصی.

**توضیحات کامل (برای هوش مصنوعی):** Store.internal_domain. external_domain برای دامنه سفارشی. store/infrastructure/dns برای مدیریت رکوردها. _dns_record_id در Store. super_store.external_domain معمولاً tokan.app. اعتبارسنجی دامنه در مدل Store.


---
title: محدودیت اشتراک و غیرفعال‌سازی
tags: [اشتراک, محدودیت]
---

# محدودیت اشتراک و غیرفعال‌سازی

**خلاصه (برای کاربر):** اشتراک منقضی شده: تا ۱۰ روز مهلت دارید، بعد از آن فروشگاه غیرفعال شده و صفحه «اشتراک منقضی شده» نمایش داده می‌شود. برای ادامه فروش، اشتراک را تمدید کنید.

**توضیحات کامل (برای هوش مصنوعی):** is_subscription_expired_over_10_days: True اگر بیش از ۱۰ روز از subscription_expires_at گذشته باشد. subscription_days_remaining: روزهای باقی‌مانده (منفی=منقضی). در get_by_path، اگر True، page config با subscription_expired و widgets خالی برمی‌گردد. grace period ۱۰ روزه برای تمدید قبل از غیرفعال‌سازی کامل.


---
title: نوتیفیکیشن و اعلان در داشبورد
tags: [اعلان, نوتیفیکیشن]
---

# نوتیفیکیشن و اعلان در داشبورد

**خلاصه (برای کاربر):** آیکون زنگ در هدر تعداد اعلانات خوانده‌نشده را نشان می‌دهد. با کلیک لیست اعلانات را می‌بینید و می‌توانید بخوانید.

**توضیحات کامل (برای هوش مصنوعی):** NotificationBell کامپوننت. announcementApi.unreadCount. رفرش هر ۶۰ ثانیه. اعلانات سیستمی برای به‌روزرسانی‌ها، تعمیرات و اطلاع‌رسانی‌های مهم. مدل Announcement در notification اپ.


---
title: ادمین تولبار و تعویض فروشگاه
tags: [داشبورد, AdminToolbar]
---

# ادمین تولبار و تعویض فروشگاه

**خلاصه (برای کاربر):** اگر چند فروشگاه دارید، از منوی بالای داشبورد می‌توانید فروشگاه فعلی را عوض کنید. همچنین لینک مستقیم به فروشگاه و دامنه را می‌بینید.

**توضیحات کامل (برای هوش مصنوعی):** AdminToolbar با currentStore و stores. storeApi.getMyStores، getCurrentStore. تعویض فروشگاه با API مربوطه. لینک به storefront (website URL). توکن و دامنه برای دسترسی به داشبورد هر فروشگاه.


---
title: خلاصه مسیرهای داشبورد
tags: [داشبورد, مسیر]
---

# خلاصه مسیرهای داشبورد

**خلاصه (برای کاربر):** داشبورد اصلی، تنظیمات (با ۱۰ تب)، محصولات، سفارشات، مالی، بلاگ، اعلانات، کاربران، منوها، اسلایدرها، مدیا، صفحه‌ساز، اشتراک، کیف پول و ورود.

**توضیحات کامل (برای هوش مصنوعی):** /dashboard، /dashboard/login، /dashboard/settings?tab=general|contact|branding|domain|theme|payment|shipping|seo|badges|store-settings، /dashboard/products، /dashboard/products/new، /dashboard/products/[id]/edit، /dashboard/orders، /dashboard/orders/[code]، /dashboard/finance، /dashboard/blog، /dashboard/blog/new، /dashboard/blog/[slug]/edit، /dashboard/blog/categories، /dashboard/notifications، /dashboard/users، /dashboard/menus، /dashboard/menus/[id]، /dashboard/menus/[id]/edit، /dashboard/sliders، /dashboard/sliders/[id]， /dashboard/media، /dashboard/pages، /dashboard/pages/[id]/edit، /dashboard/subscription، /dashboard/subscription/history، /dashboard/wallet.


---
title: خلاصه مسیرهای فروشگاه (storefront)
tags: [فروشگاه, مسیر]
---

# خلاصه مسیرهای فروشگاه (storefront)

**خلاصه (برای کاربر):** صفحه اصلی، محصولات، جستجو، سبد، تسویه، ورود، پروفایل، سفارشات، بلاگ و صفحات استاتیک بسته به تم و پیکربندی صفحه‌ساز.

**توضیحات کامل (برای هوش مصنوعی):** /، /product/:id/:slug، /products/search، /categories، /basket، /checkout، /login، /profile، /orders، /order/:code، /blog، /blog/:slug، /blog/search. در serva: /about، /contact، /privacy، /terms، /faq، /compare، /wishlist، /return-policy، /shipping، payment-success، payment-failed، coming-soon. صفحات خطا: 404، 403، 500. همه مسیرها از Page و Widgets ساخته می‌شوند و به path و ویجت‌ها وابسته‌اند.
