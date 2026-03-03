"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import PolicyRoundedIcon from "@mui/icons-material/PolicyRounded";
import ContactPhoneRoundedIcon from "@mui/icons-material/ContactPhoneRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import type { WidgetConfig } from "@/themes/types";

export type StaticPageKey =
  | "403"
  | "404"
  | "500"
  | "about"
  | "coming-soon"
  | "compare"
  | "contact"
  | "faq"
  | "loading"
  | "payment-failed"
  | "payment-success"
  | "privacy"
  | "return-policy"
  | "shipping"
  | "terms"
  | "wishlist";

type Action = {
  href: string;
  label: string;
  variant?: "contained" | "outlined" | "text";
  color?: "primary" | "error" | "inherit";
};

function PolicySection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        <Stack spacing={1.25}>
          {items.map((item, index) => (
            <Typography key={index} variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>
              {item}
            </Typography>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function PageShell({
  icon,
  title,
  subtitle,
  code,
  actions,
  children,
  tone = "default",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  code?: string;
  actions?: Action[];
  children?: React.ReactNode;
  tone?: "default" | "success" | "error";
}) {
  const heroGradient =
    tone === "success"
      ? "linear-gradient(135deg, rgba(0,160,73,0.18), rgba(25,191,211,0.18))"
      : tone === "error"
        ? "linear-gradient(135deg, rgba(211,47,47,0.15), rgba(239,57,78,0.15))"
        : "linear-gradient(135deg, rgba(239,57,78,0.12), rgba(25,191,211,0.12))";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 5,
          border: 1,
          borderColor: "divider",
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            background: heroGradient,
            position: "relative",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "flex-start", md: "center" }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                bgcolor: "background.paper",
                color: tone === "success" ? "success.main" : tone === "error" ? "error.main" : "primary.main",
                boxShadow: 1,
              }}
            >
              {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              {code ? (
                <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>
                  Error {code}
                </Typography>
              ) : null}
              <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}>
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 820, lineHeight: 1.9 }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
          </Stack>
          {actions?.length ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
              {actions.map((action) => (
                <Button
                  key={`${action.href}-${action.label}`}
                  component={Link}
                  href={action.href}
                  variant={action.variant ?? "contained"}
                  color={action.color ?? "primary"}
                  sx={{ borderRadius: 2.5, px: 3.5, py: 1.1, fontWeight: 700 }}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>
          ) : null}
        </Box>
        {children ? <Box sx={{ p: { xs: 2.5, md: 4 } }}>{children}</Box> : null}
      </Paper>
    </Container>
  );
}

export default function StaticPageWidget({
  page,
  config,
}: {
  page: StaticPageKey;
  config?: WidgetConfig;
}) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterState, setNewsletterState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });
  const [contactState, setContactState] = useState<"idle" | "loading" | "success" | "error">("idle");

  const configuredTitle = typeof config?.widgetConfig?.title === "string" ? config.widgetConfig.title : undefined;
  const configuredSubtitle = typeof config?.widgetConfig?.subtitle === "string" ? config.widgetConfig.subtitle : undefined;

  const renderContactForm = () => (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          ارسال پیام
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="نام و نام خانوادگی"
            value={contactForm.name}
            onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))}
            fullWidth
          />
          <TextField
            label="شماره تماس"
            value={contactForm.phone}
            onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))}
            fullWidth
          />
          <TextField
            label="پیام شما"
            value={contactForm.message}
            onChange={(event) => setContactForm((prev) => ({ ...prev, message: event.target.value }))}
            fullWidth
            multiline
            rows={4}
          />
          {contactState === "success" ? <Alert severity="success">پیام شما با موفقیت ثبت شد.</Alert> : null}
          {contactState === "error" ? <Alert severity="error">ارسال پیام ناموفق بود. دوباره تلاش کنید.</Alert> : null}
          <Button
            variant="contained"
            disabled={contactState === "loading" || !contactForm.name || !contactForm.phone || !contactForm.message}
            onClick={async () => {
              setContactState("loading");
              try {
                await new Promise((resolve) => setTimeout(resolve, 550));
                setContactState("success");
                setContactForm({ name: "", phone: "", message: "" });
              } catch {
                setContactState("error");
              }
            }}
            sx={{ alignSelf: "flex-start", borderRadius: 2.5, px: 3 }}
          >
            {contactState === "loading" ? "در حال ارسال..." : "ارسال پیام"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderPolicyPage = (title: string, subtitle: string, sections: Array<{ title: string; items: string[] }>) => (
    <PageShell icon={<PolicyRoundedIcon fontSize="large" />} title={title} subtitle={subtitle}>
      <Stack spacing={2}>
        {sections.map((section) => (
          <PolicySection key={section.title} title={section.title} items={section.items} />
        ))}
      </Stack>
    </PageShell>
  );

  switch (page) {
      case "403":
        return (
          <PageShell
            code="403"
            icon={<LockOutlinedIcon fontSize="large" />}
            title={configuredTitle ?? "دسترسی محدود است"}
            subtitle={configuredSubtitle ?? "شما مجوز دسترسی به این صفحه را ندارید. اگر فکر می‌کنید این مورد اشتباه است با پشتیبانی تماس بگیرید."}
            actions={[
              { href: "/", label: "بازگشت به صفحه اصلی" },
              { href: "/contact", label: "تماس با پشتیبانی", variant: "outlined" },
            ]}
          />
        );

      case "404":
        return (
          <PageShell
            code="404"
            icon={<ManageSearchRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "صفحه موردنظر پیدا نشد"}
            subtitle={configuredSubtitle ?? "ممکن است آدرس را اشتباه وارد کرده باشید یا صفحه حذف شده باشد."}
            actions={[
              { href: "/", label: "بازگشت به خانه" },
              { href: "/products/search", label: "مشاهده محصولات", variant: "outlined" },
            ]}
          />
        );

      case "500":
        return (
          <PageShell
            code="500"
            tone="error"
            icon={<ConstructionRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "خطای داخلی سرور"}
            subtitle={configuredSubtitle ?? "خطایی در پردازش درخواست رخ داده است. چند لحظه دیگر دوباره تلاش کنید."}
            actions={[
              { href: "/", label: "بازگشت به خانه" },
              { href: "/contact", label: "گزارش مشکل", variant: "outlined", color: "error" },
            ]}
          />
        );

      case "about":
        return (
          <PageShell
            icon={<StorefrontRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "درباره دیجی‌توکان"}
            subtitle={configuredSubtitle ?? "دیجی‌توکان با تمرکز بر تجربه خرید سریع، مطمئن و شفاف طراحی شده تا بهترین مسیر فروش آنلاین را برای کسب‌وکارها و مشتریان فراهم کند."}
          >
            <Stack spacing={2}>
              <PolicySection
                title="ماموریت ما"
                items={[
                  "ساخت تجربه‌ای ساده، حرفه‌ای و قابل اعتماد برای خرید آنلاین.",
                  "ارائه قیمت‌گذاری شفاف و خدمات پس از فروش پاسخ‌گو.",
                  "توسعه مداوم محصول با تکیه بر داده و بازخورد کاربران.",
                ]}
              />
              <PolicySection
                title="ارزش‌های کلیدی"
                items={[
                  "تعهد به کیفیت کالا و اصالت سفارش‌ها.",
                  "پاسخ‌گویی سریع و محترمانه در پشتیبانی.",
                  "شفافیت در فرایند ارسال، مرجوعی و پرداخت.",
                ]}
              />
            </Stack>
          </PageShell>
        );

      case "coming-soon":
        return (
          <PageShell
            icon={<HourglassTopRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "به‌زودی در دیجی‌توکان"}
            subtitle={configuredSubtitle ?? "این بخش در حال توسعه است. ایمیل خود را ثبت کنید تا به‌محض انتشار اطلاع‌رسانی کنیم."}
          >
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <TextField
                    fullWidth
                    type="email"
                    value={newsletterEmail}
                    onChange={(event) => setNewsletterEmail(event.target.value)}
                    placeholder="you@example.com"
                    label="ایمیل"
                  />
                  <Button
                    variant="contained"
                    disabled={newsletterState === "loading" || !newsletterEmail.trim()}
                    onClick={async () => {
                      setNewsletterState("loading");
                      try {
                        await new Promise((resolve) => setTimeout(resolve, 600));
                        setNewsletterState("success");
                        setNewsletterEmail("");
                      } catch {
                        setNewsletterState("error");
                      }
                    }}
                    sx={{ borderRadius: 2.5, px: 3.5 }}
                  >
                    {newsletterState === "loading" ? "در حال ثبت..." : "ثبت ایمیل"}
                  </Button>
                </Stack>
                <Box sx={{ mt: 2 }}>
                  {newsletterState === "success" ? <Alert severity="success">ایمیل شما ثبت شد.</Alert> : null}
                  {newsletterState === "error" ? <Alert severity="error">ثبت ایمیل با خطا مواجه شد.</Alert> : null}
                </Box>
              </CardContent>
            </Card>
          </PageShell>
        );

      case "compare":
        return (
          <PageShell
            icon={<CompareArrowsRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "مقایسه محصولات"}
            subtitle={configuredSubtitle ?? "برای استفاده از مقایسه، ابتدا کالاها را از لیست محصولات انتخاب کنید."}
            actions={[{ href: "/products/search", label: "مشاهده محصولات" }]}
          >
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="body2" color="text.secondary">• امکان مقایسه هم‌زمان مشخصات فنی چند محصول</Typography>
                  <Typography variant="body2" color="text.secondary">• مشاهده قیمت و درصد تخفیف در کنار هر محصول</Typography>
                  <Typography variant="body2" color="text.secondary">• تصمیم‌گیری سریع‌تر با جدول مقایسه استاندارد</Typography>
                </Stack>
              </CardContent>
            </Card>
          </PageShell>
        );

      case "contact":
        return (
          <PageShell
            icon={<ContactPhoneRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "تماس با ما"}
            subtitle={configuredSubtitle ?? "برای دریافت راهنمایی خرید، پیگیری سفارش یا همکاری تجاری با ما در ارتباط باشید."}
          >
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Card variant="outlined" sx={{ borderRadius: 3, flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">تلفن پشتیبانی</Typography>
                    <Typography variant="h6" fontWeight={700}>021-12345678</Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ borderRadius: 3, flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">ایمیل</Typography>
                    <Typography variant="h6" fontWeight={700}>support@digitokan.com</Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ borderRadius: 3, flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">ساعات پاسخ‌گویی</Typography>
                    <Typography variant="h6" fontWeight={700}>۹ تا ۱۸ (شنبه تا پنجشنبه)</Typography>
                  </CardContent>
                </Card>
              </Stack>
              {renderContactForm()}
            </Stack>
          </PageShell>
        );

      case "faq": {
        const questions = [
          {
            q: "چطور سفارشم را پیگیری کنم؟",
            a: "از بخش سفارش‌ها در پروفایل می‌توانید وضعیت پردازش، ارسال و کد رهگیری را مشاهده کنید.",
          },
          {
            q: "شرایط مرجوعی کالا چیست؟",
            a: "در بازه ۷ روز پس از تحویل، در صورت وجود مشکل فنی یا مغایرت کالا امکان ثبت درخواست مرجوعی وجود دارد.",
          },
          {
            q: "آیا امکان پرداخت در محل وجود دارد؟",
            a: "بسته به روش ارسال و نوع کالا، این گزینه ممکن است فعال باشد و در مرحله پرداخت نمایش داده می‌شود.",
          },
          {
            q: "چطور با پشتیبانی تماس بگیرم؟",
            a: "از صفحه تماس با ما یا شماره پشتیبانی می‌توانید با تیم پاسخ‌گویی در ارتباط باشید.",
          },
        ];

        return (
          <PageShell
            icon={<GppGoodRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "سوالات متداول"}
            subtitle={configuredSubtitle ?? "پاسخ سریع به پرسش‌های پرتکرار کاربران"}
          >
            <Stack spacing={1.5}>
              {questions.map((item) => (
                <Accordion key={item.q} disableGutters sx={{ borderRadius: "14px !important", border: 1, borderColor: "divider", overflow: "hidden" }}>
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Typography fontWeight={700}>{item.q}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                      {item.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </PageShell>
        );
      }

      case "loading":
        return (
          <PageShell
            icon={<HourglassTopRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "در حال آماده‌سازی"}
            subtitle={configuredSubtitle ?? "لطفا چند لحظه منتظر بمانید..."}
          >
            <Box sx={{ py: 5, textAlign: "center" }}>
              <CircularProgress size={48} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                در حال دریافت اطلاعات
              </Typography>
            </Box>
          </PageShell>
        );

      case "payment-success":
        return (
          <PageShell
            tone="success"
            icon={<CheckCircleRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "پرداخت با موفقیت انجام شد"}
            subtitle={configuredSubtitle ?? "سفارش شما با موفقیت ثبت شد و در حال پردازش است."}
            actions={[
              { href: "/orders", label: "مشاهده سفارش‌ها" },
              { href: "/", label: "بازگشت به فروشگاه", variant: "outlined", color: "primary" },
            ]}
          >
            <Alert severity="success">رسید پرداخت شما در پنل سفارش‌ها قابل مشاهده است.</Alert>
          </PageShell>
        );

      case "payment-failed":
        return (
          <PageShell
            tone="error"
            icon={<ErrorOutlineRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "پرداخت ناموفق بود"}
            subtitle={configuredSubtitle ?? "تراکنش شما تکمیل نشد. می‌توانید دوباره تلاش کنید یا روش پرداخت را تغییر دهید."}
            actions={[
              { href: "/checkout", label: "تلاش مجدد", color: "error" },
              { href: "/basket", label: "بازگشت به سبد خرید", variant: "outlined", color: "error" },
            ]}
          >
            <Alert severity="error">در صورت کسر مبلغ از حساب، بازگشت وجه طبق قوانین بانک انجام می‌شود.</Alert>
          </PageShell>
        );

      case "privacy":
        return renderPolicyPage(
          configuredTitle ?? "حریم خصوصی",
          configuredSubtitle ?? "حفظ اطلاعات کاربران برای ما یک اصل جدی است.",
          [
            {
              title: "اطلاعات جمع‌آوری‌شده",
              items: [
                "اطلاعات ثبت‌نام شامل شماره موبایل، نام و نشانی تحویل برای پردازش سفارش.",
                "اطلاعات مربوط به فعالیت کاربر جهت بهبود تجربه کاربری و امنیت حساب.",
              ],
            },
            {
              title: "نحوه استفاده",
              items: [
                "برای پردازش سفارش، ارسال کالا و ارتباطات پشتیبانی.",
                "برای تحلیل کیفیت خدمات و ارائه پیشنهادهای مرتبط با خرید.",
              ],
            },
            {
              title: "امنیت داده",
              items: [
                "داده‌ها با استانداردهای امنیتی مناسب نگهداری می‌شوند.",
                "اطلاعات حساس پرداخت توسط درگاه‌های معتبر بانکی مدیریت می‌شود.",
              ],
            },
          ]
        );

      case "return-policy":
        return renderPolicyPage(
          configuredTitle ?? "شرایط بازگشت کالا",
          configuredSubtitle ?? "امکان مرجوعی در چارچوب قوانین و در بازه زمانی مشخص فراهم است.",
          [
            {
              title: "بازه زمانی",
              items: [
                "تا ۷ روز پس از تحویل سفارش می‌توانید درخواست بازگشت ثبت کنید.",
                "برای کالاهای خاص، محدودیت‌های اختصاصی در صفحه محصول اعلام می‌شود.",
              ],
            },
            {
              title: "شرایط کالا",
              items: [
                "کالا باید بدون آسیب فیزیکی و همراه با جعبه و اقلام اصلی بازگردانده شود.",
                "کالاهای مصرفی یا بهداشتی پس از باز شدن پلمب قابل بازگشت نیستند.",
              ],
            },
            {
              title: "بازگشت وجه",
              items: [
                "پس از تایید کارشناسی، مبلغ طی چرخه بانکی به حساب مبدا بازگردانده می‌شود.",
              ],
            },
          ]
        );

      case "shipping":
        return renderPolicyPage(
          configuredTitle ?? "روش‌های ارسال",
          configuredSubtitle ?? "ارسال سفارش‌ها بر اساس شهر مقصد، نوع کالا و روش انتخابی انجام می‌شود.",
          [
            {
              title: "انواع ارسال",
              items: [
                "ارسال استاندارد: اقتصادی و مناسب اکثر سفارش‌ها.",
                "ارسال سریع: تحویل در بازه کوتاه‌تر در شهرهای منتخب.",
              ],
            },
            {
              title: "زمان تحویل",
              items: [
                "زمان تقریبی در مرحله پرداخت نمایش داده می‌شود.",
                "در ایام پرترافیک یا شرایط خاص ممکن است زمان تحویل تغییر کند.",
              ],
            },
            {
              title: "رهگیری مرسوله",
              items: [
                "پس از ارسال، کد رهگیری از طریق پنل سفارش‌ها در دسترس است.",
              ],
            },
          ]
        );

      case "terms":
        return renderPolicyPage(
          configuredTitle ?? "قوانین و مقررات",
          configuredSubtitle ?? "استفاده از خدمات دیجی‌توکان به معنی پذیرش قوانین جاری است.",
          [
            {
              title: "استفاده از سرویس",
              items: [
                "کاربر متعهد به ارائه اطلاعات صحیح در ثبت سفارش است.",
                "هرگونه سوءاستفاده از سرویس می‌تواند منجر به محدودسازی حساب شود.",
              ],
            },
            {
              title: "قیمت و موجودی",
              items: [
                "تلاش می‌شود اطلاعات قیمت و موجودی به‌روز باشد؛ با این حال خطاهای سیستمی محتمل است.",
                "در صورت بروز مغایرت، وضعیت سفارش با اطلاع کاربر تعیین تکلیف می‌شود.",
              ],
            },
            {
              title: "مسئولیت‌ها",
              items: [
                "مسئولیت حفظ محرمانگی اطلاعات حساب کاربری بر عهده کاربر است.",
                "دیجی‌توکان متعهد به پاسخ‌گویی و پشتیبانی در چارچوب قوانین است.",
              ],
            },
          ]
        );

      case "wishlist":
        return (
          <PageShell
            icon={<FavoriteBorderRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "لیست علاقه‌مندی‌ها"}
            subtitle={configuredSubtitle ?? "محصولی در لیست علاقه‌مندی شما ثبت نشده است."}
            actions={[
              { href: "/products/search", label: "مشاهده محصولات" },
              { href: "/", label: "بازگشت به خانه", variant: "outlined" },
            ]}
          >
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5 }}>
              <Typography variant="body2" color="text.secondary">
                هنگام مشاهده هر محصول، با انتخاب گزینه علاقه‌مندی می‌توانید آن را برای خرید بعدی ذخیره کنید.
              </Typography>
            </Paper>
          </PageShell>
        );

      default:
        return (
          <PageShell
            icon={<PolicyRoundedIcon fontSize="large" />}
            title={configuredTitle ?? "صفحه در حال آماده‌سازی"}
            subtitle={configuredSubtitle ?? "محتوای این صفحه به‌زودی تکمیل می‌شود."}
          />
        );
    }
}
