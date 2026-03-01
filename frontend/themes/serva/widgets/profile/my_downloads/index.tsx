"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faUser } from "@fortawesome/free-solid-svg-icons";
import type { WidgetConfig } from "@/themes/types";
import { orderApi } from "@/lib/api/orderApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

type DownloadFile = { title: string; description?: string; download_url: string };
type DownloadItem = {
  id: string;
  order_item_id: string;
  title: string;
  download_url?: string;
  files?: DownloadFile[];
  main_image?: { id: string; file: string } | null;
};

export default function ProfileMyDownloads({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DownloadItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setItems([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    orderApi
      .getPurchasedDigitalContent()
      .then((res) => mounted && setItems(res.download as DownloadItem[]))
      .catch(() => mounted && setItems([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <section className="container py-12">
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FontAwesomeIcon icon={faUser} className="text-2xl text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">{tFrontendAuto("fe.7927c7ed375b")}</h2>
          <p className="text-gray-600 text-sm mb-4">{tFrontendAuto("fe.eb43a5d13afe")}</p>
          <Link
            href={`/login?next=${encodeURIComponent(pathname || "/my-downloads")}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold"
          >
            ورود
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-8 md:py-12">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/" className="hover:text-primary">{tFrontendAuto("fe.0efc869315f1")}</Link>
          <span>‹</span>
          <Link href="/profile" className="hover:text-primary">{tFrontendAuto("fe.e68a4edf84ec")}</Link>
          <span>‹</span>
          <span className="text-dark font-medium">{tFrontendAuto("fe.9fa10e1b5995")}</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-black text-dark">{tFrontendAuto("fe.9fa10e1b5995")}</h1>
        <p className="text-gray-600 text-sm mt-1">{tFrontendAuto("fe.728a80856d0c")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <FontAwesomeIcon icon={faDownload} className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-600">{tFrontendAuto("fe.e2db00cdfbbb")}</p>
          <Link href="/" className="inline-block mt-4 text-primary font-bold hover:underline">
            خرید محصول دانلودی
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const fileList = item.files?.length ? item.files : (item.download_url ? [{ title: item.title, download_url: item.download_url }] : []);
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/30 transition"
              >
                <div className="flex items-center gap-4">
                  {item.main_image?.file && (
                    <img
                      src={item.main_image.file}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-dark truncate">{item.title}</h3>
                  </div>
                </div>
                {fileList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {fileList.map((f, i) => (
                      <a
                        key={i}
                        href={f.download_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        {f.title || "دانلود"}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
