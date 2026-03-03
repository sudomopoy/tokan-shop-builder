"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Container, Button, Typography, Skeleton } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import type { WidgetConfig } from "@/themes/types";
import { sliderApi, type Slide } from "@/lib/api";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { imageUrl } from "../../utils/helpers";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

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
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${imgSrc})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "transform 0.5s ease",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, transparent, rgba(0,0,0,0.2), rgba(0,0,0,0.7))",
        }}
      />
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          p: { xs: 3, sm: 4, md: 6, lg: 8 },
          color: "white",
          maxWidth: 600,
        }}
      >
        {slide.title && (
          <Box
            component="span"
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              px: 2,
              py: 0.75,
              borderRadius: 10,
              fontSize: "0.875rem",
              fontWeight: 700,
              mb: { xs: 2, md: 3 },
              display: "inline-block",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {slide.title}
          </Box>
        )}
        {slide.description && (
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem", lg: "3rem" },
              fontWeight: 900,
              mb: { xs: 2, md: 3 },
              lineHeight: 1.2,
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {slide.description}
          </Typography>
        )}
        {showBtn && btnText && (
          <Button
            component={Link}
            href={slide.url!}
            variant="contained"
            size="large"
            endIcon={<ChevronLeft />}
            sx={{
              bgcolor: "white",
              color: "primary.main",
              fontWeight: 700,
              px: { xs: 3, md: 4 },
              py: { xs: 1.5, md: 2 },
              borderRadius: 3,
              boxShadow: 3,
              "&:hover": {
                bgcolor: "primary.main",
                color: "white",
                transform: "translateY(-2px)",
                boxShadow: 6,
              },
              transition: "all 0.3s ease",
            }}
          >
            {btnText}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default function DigitokanSliderWidget({ config }: { config?: WidgetConfig }) {
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
          setError("خطا در بارگذاری اسلایدر");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sliderId, ssrSlides]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!sliderId) {
    return (
      <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            bgcolor: "grey.100",
            height: { xs: 280, sm: 360, lg: 420 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          اسلایدری تعریف نشده است. در تنظیمات ویجت slider_id را وارد کنید.
        </Box>
      </Container>
    );
  }

  if (loading && slides.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 4 } }}>
        <Skeleton
          variant="rectangular"
          sx={{
            borderRadius: 4,
            height: { xs: 280, sm: 360, md: 420, lg: 480 },
          }}
          animation="wave"
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            bgcolor: "error.light",
            border: 1,
            borderColor: "error.main",
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "error.dark",
          }}
        >
          {error}
        </Box>
      </Container>
    );
  }

  const resolvedSlides = slides.length > 0 ? slides : [];

  if (resolvedSlides.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            bgcolor: "grey.200",
            height: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          اسلایدی وجود ندارد.
        </Box>
      </Container>
    );
  }

  if (resolvedSlides.length === 1) {
    const slide = resolvedSlides[0];
    return (
      <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            position: "relative",
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: 6,
            height: { xs: 280, sm: 360, md: 420, lg: 480 },
          }}
        >
          <SlideContent slide={slide} isMobile={isMobile} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 3, md: 4 } }}>
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: 6,
          "& .digitokan-slider": {
            height: { xs: 280, sm: 360, md: 420, lg: 480 },
          },
          "& .swiper-button-prev, & .swiper-button-next": {
            width: { xs: 40, md: 48 },
            height: { xs: 40, md: 48 },
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.9)",
            color: "primary.main",
            "&:hover": {
              bgcolor: "white",
            },
            "&::after": {
              fontSize: { xs: "1.25rem", md: "1.5rem" },
              fontWeight: 700,
            },
          },
          "& .swiper-button-prev": {
            left: { xs: 16, md: 24 },
          },
          "& .swiper-button-next": {
            right: { xs: 16, md: 24 },
          },
          "& .swiper-pagination": {
            bottom: { xs: 16, md: 24 },
          },
          "& .swiper-pagination-bullet": {
            width: 8,
            height: 8,
            bgcolor: "rgba(255,255,255,0.6)",
            opacity: 1,
            transition: "all 0.2s",
          },
          "& .swiper-pagination-bullet-active": {
            bgcolor: "white",
            width: 24,
            borderRadius: 12,
          },
        }}
      >
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
          navigation={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          className="digitokan-slider"
        >
          {resolvedSlides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <SlideContent slide={slide} isMobile={isMobile} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Container>
  );
}
