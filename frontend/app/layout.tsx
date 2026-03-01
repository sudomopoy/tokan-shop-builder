import type { Metadata } from "next";
import "@/css/style.css";
import Providers from "./providers";
import StorefrontAdminBar from "@/components/StorefrontAdminBar";
import { DEPLOY_DIRECTION, DEPLOY_LANG } from "@/lib/i18n/deployment";
import { tFrontend } from "@/lib/i18n/messages";

export const metadata: Metadata = {
  title: tFrontend("app.layout.title"),
  description: tFrontend("app.layout.description"),
};

async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
    return <html lang={DEPLOY_LANG} dir={DEPLOY_DIRECTION} className="h-full">
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
