"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import type { WidgetConfig } from "@/themes/types";
import { sliderApi, type Slide } from "@/lib/api";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

function imageUrl(file: string | undefined): string {
  if (!file) return "";
  return file.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_BASE || ""}${file}` : file;
}

function getSlideImage(slide: Slide, isMobile: boolean): string {
  if (isMobile && slide.mobile_image?.file) {
    return imageUrl(slide.mobile_image.file);
  }
  return imageUrl(slide.desktop_image?.file) || "https://via.placeholder.com/1200x520?text=اسلاید";
}

function SlideContent({ slide, isMobile }: { slide: Slide; isMobile: boolean }) {
  const imgSrc = getSlideImage(slide, isMobile);
  const showBtn = (slide.show_button ?? true) && !!slide.url;
  const btnText = slide.button_text?.trim() || "";

  return (
    <>
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500"
        style={{ backgroundImage: `url(${imgSrc})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dark/20 to-dark/90" />
      <div className="relative h-full flex flex-col justify-center items-start p-6 sm:p-8 md:p-12 lg:p-16 text-white max-w-2xl">
        {slide.title && (
          <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold font-sans mb-4 md:mb-6 inline-block border border-white/10">
            {slide.title}
          </span>
        )}
        {slide.description && <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-6 leading-tight drop-shadow-lg">
          {slide.description || ""}
        </h1>}
        {showBtn && btnText != "" && (
          <Link
            href={slide.url!}
            className="bg-white text-dark px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all shadow-lg hover:shadow-primary/30 flex items-center gap-3 transform hover:-translate-y-1 text-sm md:text-base"
          >
            {btnText}
            <FontAwesomeIcon icon={faChevronLeft} />
          </Link>
        )}
      </div>
    </>
  );
}

export default function ServaSliderWidget({ config }: { config?: WidgetConfig }) {
  const sliderId = typeof config?.widgetConfig?.slider_id === "string" ? config.widgetConfig.slider_id : null;
  const { data } = usePageRuntime();
  const ssrSlider = sliderId
    ? ((data?.slider as Record<string, unknown>)?.[sliderId] as { active_slides?: Slide[] } | undefined)
    : undefined;
  const ssrSlides = ssrSlider?.active_slides;

  const [slides, setSlides] = useState<Slide[]>(() => (Array.isArray(ssrSlides) && ssrSlides.length > 0 ? ssrSlides : []));
  const [loading, setLoading] = useState(!ssrSlides?.length && !!sliderId);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (!sliderId) {
      setLoading(false);
      return;
    }
    if (ssrSlides?.length) {
      setSlides(ssrSlides);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    sliderApi
      .getById(sliderId)
      .then((slider) => {
        if (cancelled) return;
        setSlides(slider?.active_slides ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          console.error(e);
          setError("خطا در بارگذاری اسلایدر.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sliderId]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!sliderId) {
    return (
      <section className="container mt-6 md:mt-8">
        <div className="rounded-3xl overflow-hidden bg-gray-100 h-[280px] sm:h-[360px] lg:h-[420px] flex items-center justify-center text-gray-500">
          اسلایدری تعریف نشده است. در تنظیمات ویجت slider_id را وارد کنید.
        </div>
      </section>
    );
  }

  if (loading && slides.length === 0) {
    return (
      <section className="container mt-6 md:mt-8">
        <div className="rounded-3xl overflow-hidden bg-gray-100 h-[280px] sm:h-[360px] lg:h-[480px] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container mt-6 md:mt-8">
        <div className="rounded-3xl overflow-hidden bg-red-50 border border-red-200 h-[200px] flex items-center justify-center text-red-700">
          {error}
        </div>
      </section>
    );
  }

  const resolvedSlides = slides.length > 0 ? slides : [];

  if (resolvedSlides.length === 0) {
    return (
      <section className="container mt-6 md:mt-8">
        <div className="rounded-3xl overflow-hidden bg-gray-200 h-[280px] flex items-center justify-center text-gray-500">
          اسلایدی وجود ندارد.
        </div>
      </section>
    );
  }

  // تک اسلاید: بدون Swiper، نمایش ساده و تمام‌عرض
  if (resolvedSlides.length === 1) {
    const slide = resolvedSlides[0];
    return (
      <section className="container mt-6 md:mt-8">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px]">
          <SlideContent slide={slide} isMobile={isMobile} />
        </div>
      </section>
    );
  }

  // دو اسلاید یا بیشتر: Swiper با ناوبری و اتوپلی
  return (
    <section className="container mt-6 md:mt-8">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl serva-slider-wrapper">
        <Swiper
          modules={[EffectFade, Pagination, Autoplay, Navigation]}
          dir="rtl"
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={600}
          loop={true}
          grabCursor={true}
          pagination={{
            clickable: true,
            dynamicBullets: resolvedSlides.length > 5,
          }}
          navigation={{
            prevEl: ".serva-slider-prev",
            nextEl: ".serva-slider-next",
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          className="serva-slider w-full !h-[280px] sm:!h-[360px] md:!h-[420px] lg:!h-[480px]"
        >
          {resolvedSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="relative w-full h-full">
                <SlideContent slide={slide} isMobile={isMobile} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* دکمه‌های ناوبری - دسکتاپ */}
        <button
          type="button"
          aria-label="اسلاید بعدی"
          className="serva-slider-next absolute top-1/2 -translate-y-1/2 right-4 md:right-6 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-dark transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-lg" />
        </button>
        <button
          type="button"
          aria-label="اسلاید قبلی"
          className="serva-slider-prev absolute top-1/2 -translate-y-1/2 left-4 md:left-6 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center text-dark transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-lg" />
        </button>
      </div>

      <style jsx global>{`
        .serva-slider .swiper-pagination {
          bottom: 1rem !important;
        }
        @media (min-width: 768px) {
          .serva-slider .swiper-pagination {
            bottom: 1.5rem !important;
          }
        }
        .serva-slider .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.6);
          opacity: 1;
          transition: all 0.2s;
        }
        .serva-slider .swiper-pagination-bullet-active {
          background: white;
          width: 24px;
          border-radius: 12px;
        }
        @media (max-width: 640px) {
          .serva-slider .swiper-pagination-bullet {
            width: 6px;
            height: 6px;
          }
          .serva-slider .swiper-pagination-bullet-active {
            width: 18px;
          }
        }
      `}</style>
    </section>
  );
}
