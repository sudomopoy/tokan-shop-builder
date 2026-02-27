import type { Metadata } from "next";
import "@/css/style.css";
import Providers from "./providers";
import StorefrontAdminBar from "@/components/StorefrontAdminBar";

export const metadata: Metadata = {
  title: { default: "فروشگاه توکان" },
  description: "فروشگاه آنلاین",
};

async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
    return <html lang="fa" dir="rtl" className="h-full">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
        </head>
        <body className="font-sans overflow-x-hidden">
            <Providers>
              <StorefrontAdminBar />
              {children}
            </Providers>
        </body>
      </html>
}

export const dynamic = 'force-dynamic';


export default RootLayout;
