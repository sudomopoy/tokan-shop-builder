import type { Metadata } from "next";
import "./globals.css";
import {
  DEPLOY_DIRECTION,
  DEPLOY_LANG,
  DEPLOY_OG_LOCALE,
} from "@/lib/i18n";
import { tLanding } from "@/lib/messages";

export const metadata: Metadata = {
  title: tLanding("layout.title"),
  description: tLanding("layout.description"),
  openGraph: {
    title: tLanding("layout.ogTitle"),
    description: tLanding("layout.ogDescription"),
    type: "website",
    locale: DEPLOY_OG_LOCALE,
  },
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={DEPLOY_LANG} dir={DEPLOY_DIRECTION}>
      <body>{children}</body>
    </html>
  );
}
