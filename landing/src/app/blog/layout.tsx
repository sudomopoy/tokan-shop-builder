import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "بلاگ توکان | مطالب آموزشی و خبری",
  description:
    "مطالب آموزشی درباره فروشگاه آنلاین، سئو، رشد کسب‌وکار و راهنمای استفاده از توکان.",
  openGraph: {
    title: "بلاگ توکان | مطالب آموزشی و خبری",
    description:
      "مطالب آموزشی درباره فروشگاه آنلاین، سئو و رشد کسب‌وکار با توکان.",
    type: "website",
    locale: "fa_IR",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
