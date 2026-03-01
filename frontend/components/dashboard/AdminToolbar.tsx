"use client";

import Link from "next/link";
import { ExternalLink, Settings, Home, Store } from "lucide-react";
import type { StoreListItem } from "@/lib/api/storeApi";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

function getStoreFrontUrl(store: StoreListItem | null): string {
  if (!store) return "#";
  const domain = store.external_domain || store.internal_domain || `${store.name}.tokan.app`;
  return `https://${domain}`;
}

type AdminToolbarProps = {
  currentStore: StoreListItem | null;
  stores: StoreListItem[];
};

export default function AdminToolbar({
  currentStore,
}: AdminToolbarProps) {
  const storeUrl = getStoreFrontUrl(currentStore);

  const hasStore = !!currentStore && storeUrl !== "#";

  return (
    <div
      className="sticky top-0 z-40 bg-gradient-to-l from-slate-800 to-slate-900 text-white shadow-md overflow-hidden w-full shrink-0"
      dir="rtl"
      style={{ minHeight: "2.25rem" }} // 36px ~ h-9
    >
      <div className="flex items-center justify-between h-9 px-2 sm:px-3 lg:px-4 text-xs min-w-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 overflow-hidden flex-shrink">
            {/* مشاهده فروشگاه */}
            {hasStore && (
              <>
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:bg-white/10 rounded-md px-2 py-1.5 transition-colors shrink-0"
                  title={tFrontendAuto("fe.5eea546c1d65")}
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden xsm:inline">{tFrontendAuto("fe.b35879c7eeb4")}</span>
                </a>

                <span className="text-slate-500 shrink-0 hidden sm:inline">|</span>
              </>
            )}

            {/* داشبورد */}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 hover:bg-white/10 rounded-md px-2 py-1.5 transition-colors shrink-0"
              title={tFrontendAuto("fe.f877b1be37b8")}
            >
              <Home className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xsm:inline">{tFrontendAuto("fe.b309fd74c951")}</span>
            </Link>

            <span className="text-slate-500 shrink-0 hidden sm:inline">|</span>

            {/* تنظیمات */}
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-1.5 hover:bg-white/10 rounded-md px-2 py-1.5 transition-colors shrink-0"
              title={tFrontendAuto("fe.6631ea9e106b")}
            >
              <Settings className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xsm:inline">{tFrontendAuto("fe.1cff677453b2")}</span>
            </Link>
          </div>

          {/* نام فروشگاه فعلی */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <Store className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-medium truncate max-w-[80px] xsm:max-w-[120px] sm:max-w-[140px] lg:max-w-[200px]">
              {currentStore?.title || currentStore?.name || "فروشگاه"}
            </span>
        </div>
      </div>
    </div>
  );
}
