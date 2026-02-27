"use client";

import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, Button, IconButton, Container, Alert, CircularProgress } from "@mui/material";
import { ChevronRight, ChevronLeft, Play, Pause } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { sliderApi, type Slide } from "@/lib/api";
import type { WidgetConfig } from "@/themes/types";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

function WarningFallback({ title, description, code }: { title: string; description: string; code?: string }) {
  return (
    <div className="border-2 border-dashed border-red-300 bg-red-50 rounded-lg p-8 my-4">
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-700">{title}</h3>
          <p className="text-sm text-red-600 mt-1">{description}</p>
          {code ? (
            <p className="text-sm text-red-600 mt-2">
              <code className="px-2 py-1 bg-red-100 rounded text-xs font-mono">{code}</code>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Slider({ config }: { config?: WidgetConfig }) {
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);
  const [slides, setSlides] = useState<Slide[] | null>(() => (Array.isArray(ssrSlides) && ssrSlides.length > 0 ? ssrSlides : null));
  const [sliderFound, setSliderFound] = useState<boolean | null>(() => (ssrSlides ? true : null));
  const [loading, setLoading] = useState(!ssrSlides);
  const [error, setError] = useState<string | null>(null);

  const sliderIdRaw = config?.widgetConfig?.slider_id;
  const sliderId = typeof sliderIdRaw === "string" ? sliderIdRaw : null;

  const { data } = usePageRuntime();
  const ssrSlider = sliderId
    ? ((data?.slider as Record<string, unknown>)?.[sliderId] as { active_slides?: Slide[] } | undefined)
    : undefined;
  const ssrSlides = ssrSlider?.active_slides ?? ssrSlider?.["active_slides" as keyof typeof ssrSlider];

  const updateNavigationState = () => {
    if (swiperRef.current) {
      setIsBeginning(swiperRef.current.isBeginning);
      setIsEnd(swiperRef.current.isEnd);
      setActiveIndex(swiperRef.current.realIndex);
    }
  };

  const handlePrev = () => {
    swiperRef.current?.slidePrev();
    setTimeout(updateNavigationState, 100);
  };

  const handleNext = () => {
    swiperRef.current?.slideNext();
    setTimeout(updateNavigationState, 100);
  };

  const toggleAutoplay = () => {
    if (swiperRef.current) {
      if (swiperRef.current.autoplay.running) {
        swiperRef.current.autoplay.stop();
        setIsAutoplayPaused(true);
      } else {
        swiperRef.current.autoplay.start();
        setIsAutoplayPaused(false);
      }
    }
  };

  // Add custom styles for Swiper
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .hero-slider .swiper-pagination {
        bottom: 2rem !important;
        z-index: 10;
      }
      .hero-slider .swiper-pagination-bullet {
        width: 12px;
        height: 12px;
        background-color: rgba(255, 255, 255, 0.5);
        opacity: 1;
        transition: all 0.3s ease;
        margin: 0 6px !important;
      }
      .hero-slider .swiper-pagination-bullet-active {
        background-color: white;
        width: 32px;
        border-radius: 16px;
      }
      .hero-slider .swiper-slide {
        height: auto;
      }
      @media (max-width: 640px) {
        .hero-slider .swiper-pagination {
          bottom: 1rem !important;
        }
        .hero-slider .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          margin: 0 4px !important;
        }
        .hero-slider .swiper-pagination-bullet-active {
          width: 24px;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setError(null);

    if (!sliderId) {
      setSlides(null);
      setSliderFound(null);
      return () => {
        isMounted = false;
      };
    }

    if (ssrSlides?.length) {
      setSlides(ssrSlides);
      setSliderFound(true);
      setLoading(false);
      return () => { isMounted = false; };
    }

    setLoading(true);
    sliderApi
      .getById(sliderId)
      .then((slider) => {
        if (!isMounted) {
          return;
        }
        if (!slider) {
          setSlides(null);
          setSliderFound(false);
          setLoading(false);
          return;
        }
        setSliderFound(true);
        setSlides(slider.active_slides ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        console.error("Error fetching slider:", err);
        setError("خطا در بارگذاری اسلایدر. لطفا دوباره تلاش کنید.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sliderId]);

  if (!sliderId) {
    return (
      <WarningFallback
        title="ویجت اسلایدر"
        description="اسلایدر آیدی تعریف نشده است. لطفاً در تنظیمات ویجت، `slider_id` را تعیین کنید."
      />
    );
  }

  if (loading && slides === null) {
    return (
      <Box className="py-10">
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="py-6">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (sliderFound === false) {
    return (
      <WarningFallback
        title="ویجت اسلایدر"
        description="اسلایدر مورد نظر حذف شده یا غیرفعال است."
        code={`slider_id: ${sliderId}`}
      />
    );
  }

  const resolvedSlides = slides ?? [];
  if (sliderFound === true && resolvedSlides.length === 0) {
    return (
      <Box className="py-6">
        <Alert severity="info">برای این اسلایدر، اسلاید فعالی وجود ندارد.</Alert>
      </Box>
    );
  }

  return (
    <Box className="relative w-full">
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          updateNavigationState();
        }}
        onSlideChange={updateNavigationState}
        onRealIndexChange={updateNavigationState}
        onReachBeginning={() => setIsBeginning(true)}
        onReachEnd={() => setIsEnd(true)}
        onFromEdge={updateNavigationState}
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        dir="rtl"
        effect="fade"
        fadeEffect={{
          crossFade: true,
        }}
        speed={1000}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        loop={true}
        grabCursor={true}
        className="hero-slider w-full"
        style={{
          height: "600px",
        }}
      >
        {resolvedSlides.map((slide) => {
          const imageUrl =
            slide.desktop_image?.file ||
            slide.mobile_image?.file ||
            "https://via.placeholder.com/1920x1080?text=No+Image";
          const overlay = "rgba(0, 0, 0, 0.45)";
          const title = slide.title || " ";
          const description = slide.description || "";
          const buttonLink = slide.url || undefined;
          const buttonText = buttonLink ? "مشاهده" : "";

          return (
          <SwiperSlide key={slide.id}>
            <Box
              className="relative w-full h-full flex items-center justify-center"
              sx={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: overlay,
                  zIndex: 1,
                },
              }}
            >
              {/* Content */}
              <Container
                maxWidth="xl"
                className="relative z-10 px-4 sm:px-6 lg:px-8"
                sx={{
                  position: "relative",
                  zIndex: 2,
                }}
              >
                <Box
                  className="text-center max-w-3xl mx-auto"
                  sx={{
                    animation: "fadeInUp 0.8s ease-out",
                    "@keyframes fadeInUp": {
                      from: {
                        opacity: 0,
                        transform: "translateY(30px)",
                      },
                      to: {
                        opacity: 1,
                        transform: "translateY(0)",
                      },
                    },
                  }}
                >
                  <Typography
                    variant="h2"
                    component="h1"
                    className="mb-4"
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: { xs: "2rem", sm: "3rem", md: "4rem", lg: "4.5rem" },
                      lineHeight: 1.2,
                      textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {title}
                  </Typography>
                  {description ? (
                    <Typography
                      variant="h6"
                      className="mb-8"
                      sx={{
                        color: "rgba(255, 255, 255, 0.95)",
                        fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem" },
                        fontWeight: 400,
                        lineHeight: 1.6,
                        textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      {description}
                    </Typography>
                  ) : null}
                  {buttonLink ? (
                    <Button
                      variant="contained"
                      size="large"
                      href={buttonLink}
                      className="px-8 py-3"
                      sx={{
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: { xs: "1rem", sm: "1.125rem" },
                        px: { xs: 4, sm: 6 },
                        py: { xs: 2, sm: 2.5 },
                        boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                        "&:hover": {
                          boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
                          transform: "translateY(-2px)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      {buttonText}
                    </Button>
                  ) : null}
                </Box>
              </Container>
            </Box>
          </SwiperSlide>
        );
        })}
      </Swiper>

      {/* Navigation Buttons - RTL: inset-inline for positioning */}
      <Box sx={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 16, right: 16, zIndex: 20, pointerEvents: "none", display: { xs: "none", md: "block" } }}>
        <Container maxWidth="xl" sx={{ position: "relative", height: "100%" }}>
          <IconButton
            onClick={handlePrev}
            disabled={isBeginning}
            aria-label="اسلاید قبلی"
            sx={{
              position: "absolute",
              insetInlineEnd: 0,
              bgcolor: "rgba(255,255,255,0.9)",
              pointerEvents: "auto",
              borderRadius: "50%",
              width: { md: 48, lg: 56 },
              height: { md: 48, lg: 56 },
              "&:hover:not(.Mui-disabled)": {
                transform: "scale(1.1)",
                bgcolor: "white",
              },
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            }}
            sx={{
              borderRadius: "50%",
              width: { md: 48, lg: 56 },
              height: { md: 48, lg: 56 },
              "&:hover:not(.Mui-disabled)": {
                transform: "scale(1.1)",
                bgcolor: "white",
              },
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            }}
          >
            <ChevronRight size={28} />
          </IconButton>
          <IconButton
            onClick={handleNext}
            disabled={isEnd}
            aria-label="اسلاید بعدی"
            sx={{
              position: "absolute",
              insetInlineStart: 0,
              bgcolor: "rgba(255,255,255,0.9)",
              pointerEvents: "auto",
              borderRadius: "50%",
              width: { md: 48, lg: 56 },
              height: { md: 48, lg: 56 },
              "&:hover:not(.Mui-disabled)": {
                transform: "scale(1.1)",
                bgcolor: "white",
              },
              "&.Mui-disabled": {
                opacity: 0.3,
              },
            }}
          >
            <ChevronLeft size={28} />
          </IconButton>
        </Container>
      </Box>

      {/* Autoplay Control Button - RTL: top-inline-end */}
      <Box sx={{ position: "absolute", top: 16, insetInlineEnd: 16, zIndex: 20, display: { xs: "none", sm: "block" } }}>
        <IconButton
          onClick={toggleAutoplay}
          className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg transition-all duration-200"
          sx={{
            borderRadius: 2,
            "&:hover": {
              bgcolor: "white",
              transform: "scale(1.1)",
            },
          }}
        >
          {isAutoplayPaused ? (
            <Play size={20} style={{ marginInlineEnd: 2 }} />
          ) : (
            <Pause size={20} />
          )}
        </IconButton>
      </Box>

      {/* Mobile Navigation Dots Indicator */}
      <Box sx={{ display: { xs: "flex", md: "none" }, position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 20, gap: 1 }}>
        {resolvedSlides.map((_, index) => (
          <Box
            key={index}
            className="rounded-full transition-all duration-300"
            sx={{
              width: index === activeIndex ? "24px" : "8px",
              height: "8px",
              backgroundColor: index === activeIndex ? "white" : "rgba(255, 255, 255, 0.5)",
              borderRadius: "4px",
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
