"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlayCircle, faUser } from "@fortawesome/free-solid-svg-icons";
import type { WidgetConfig } from "@/themes/types";
import { orderApi } from "@/lib/api/orderApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";

type StreamingItem = {
  id: string;
  order_item_id: string;
  title: string;
  stream_play_url: string;
  main_image?: { id: string; file: string } | null;
};

export default function ProfileMyVideos({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StreamingItem[]>([]);

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
      .then((res) => mounted && setItems(res.streaming as StreamingItem[]))
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
          <h2 className="text-xl font-bold text-dark mb-2">ورود به حساب کاربری</h2>
          <p className="text-gray-600 text-sm mb-4">برای مشاهده ویدیوهای خریداری‌شده وارد شوید.</p>
          <Link
            href={`/login?next=${encodeURIComponent(pathname || "/my-videos")}`}
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
          <Link href="/" className="hover:text-primary">خانه</Link>
          <span>‹</span>
          <Link href="/profile" className="hover:text-primary">پروفایل</Link>
          <span>‹</span>
          <span className="text-dark font-medium">ویدیوهای خریداری‌شده</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-black text-dark">ویدیوهای خریداری‌شده</h1>
        <p className="text-gray-600 text-sm mt-1">تماشای آنلاین ویدیوها — بدون امکان دانلود</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <FontAwesomeIcon icon={faPlayCircle} className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-600">هنوز ویدیوی خریداری‌شده‌ای ندارید.</p>
          <Link href="/" className="inline-block mt-4 text-primary font-bold hover:underline">
            خرید ویدیو
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition"
            >
              <div className="aspect-video bg-gray-900 relative">
                <video
                  src={item.stream_play_url}
                  controls
                  controlsList="nodownload"
                  className="w-full h-full object-contain"
                  playsInline
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-dark line-clamp-2">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
