import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "توکان | توسعه کسب‌وکار دیجیتال (طراحی سایت، سئو و رشد با AI)",
  description:
    "توکان؛ توسعه کسب‌وکار شما در کنار طراحی سایت و فروشگاه، سئو و رشد با بهره‌گیری از هوش مصنوعی.",
  openGraph: {
    title: "توکان | توسعه کسب‌وکار دیجیتال",
    description:
      "طراحی سایت و فروشگاه، سئو و رشد کسب‌وکار با کمک هوش مصنوعی. پلن‌های اشتراکی شفاف و پکیج‌های تکمیلی.",
    type: "website",
    locale: "fa_IR",
  },
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
