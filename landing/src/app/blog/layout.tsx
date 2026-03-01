import type { Metadata } from "next";
import { DEPLOY_OG_LOCALE } from "@/lib/i18n";
import { tLanding } from "@/lib/messages";

export const metadata: Metadata = {
  title: tLanding("blog.layout.title"),
  description: tLanding("blog.layout.description"),
  openGraph: {
    title: tLanding("blog.layout.title"),
    description: tLanding("blog.layout.ogDescription"),
    type: "website",
    locale: DEPLOY_OG_LOCALE,
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
