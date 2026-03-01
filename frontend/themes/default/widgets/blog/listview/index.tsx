"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  IconButton,
  Stack,
  Container,
  CircularProgress,
  Alert,
} from "@mui/material";
import { ChevronRight, ChevronLeft, Eye, Calendar } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { articleApi, type Article } from "@/lib/api/articleApi";
import type { WidgetConfig } from "@/themes/types";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const stripHtml = (html: string, maxLen = 120): string => {
  if (!html) return "";
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
};

function BlogCard({ article }: { article: Article }) {
  const imageUrl =
    article.thumbnail_image?.file ||
    article.main_image?.file ||
    "https://via.placeholder.com/400x240?text=بدون+تصویر";
  const excerpt = stripHtml(article.description);
  const categoryName = typeof article.category === "object" && article.category?.name
    ? article.category.name
    : "";

  return (
    <Card
      className="group relative h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        mx: 1,
      }}
    >
      <Link href={`/blog/${article.slug}`} className="block">
        <Box className="relative overflow-hidden bg-gray-100">
          <CardMedia
            component="img"
            image={imageUrl}
            alt={article.title}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            sx={{ aspectRatio: "16/9", objectFit: "cover" }}
          />
        </Box>
      </Link>
      <CardContent className="flex-1 flex flex-col p-4">
        {categoryName && (
          <Typography
            variant="caption"
            color="primary"
            fontWeight={600}
            sx={{ mb: 1, display: "block" }}
          >
            {categoryName}
          </Typography>
        )}
        <Link href={`/blog/${article.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
          <Typography
            variant="h6"
            component="h3"
            className="mb-2 line-clamp-2 min-h-[3rem]"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.95rem", sm: "1rem" },
              color: "text.primary",
              "&:hover": { color: "primary.main" },
            }}
          >
            {article.title}
          </Typography>
        </Link>
        {excerpt && (
          <Typography
            variant="body2"
            color="text.secondary"
            className="line-clamp-2 mb-2"
            sx={{ fontSize: "0.875rem" }}
          >
            {excerpt}
          </Typography>
        )}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: "auto", pt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box component="span" sx={{ color: "text.secondary", display: "inline-flex" }}><Calendar size={14} /></Box>
            <Typography variant="caption" color="text.secondary">
              {formatDate(article.created_at)}
            </Typography>
          </Stack>
          {article.total_views != null && article.total_views > 0 && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box component="span" sx={{ color: "text.secondary", display: "inline-flex" }}><Eye size={14} /></Box>
              <Typography variant="caption" color="text.secondary">
                {new Intl.NumberFormat("fa-IR").format(article.total_views)} بازدید
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function BlogListView({ config }: { config?: WidgetConfig }) {
  const moduleFilter = (config?.widgetConfig?.module as string) || "blog";

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  const updateNavigationState = () => {
    if (swiperRef.current) {
      setIsBeginning(swiperRef.current.isBeginning);
      setIsEnd(swiperRef.current.isEnd);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    articleApi
      .list({ module: moduleFilter, page_size: 24 })
      .then((res) => {
        if (isMounted) {
          const items = res.results ?? [];
          setArticles(items);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Blog list error:", err);
          setError(tFrontendAuto("fe.13d6bbbc4b88"));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [moduleFilter]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .blog-carousel .swiper-pagination { position: relative !important; margin-top: 1.5rem; bottom: 0 !important; }
      .blog-carousel .swiper-pagination-bullet { width: 12px; height: 12px; background-color: var(--primary-color, #4f06e5); opacity: 0.3; margin: 0 4px !important; }
      .blog-carousel .swiper-pagination-bullet-active { opacity: 1; width: 24px; border-radius: 6px; }
      .blog-carousel .swiper-slide { height: auto; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Container maxWidth="xl" className="py-8 px-4">
      <Box className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" } }}>
            وبلاگ
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {loading ? "در حال بارگذاری..." : `${articles.length} مطلب`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} className="hidden sm:flex">
          <IconButton
            onClick={() => { swiperRef.current?.slidePrev(); setTimeout(updateNavigationState, 100); }}
            disabled={isBeginning}
            sx={{ borderRadius: 2, "&:hover:not(.Mui-disabled)": { bgcolor: "action.hover", transform: "scale(1.1)" }, "&.Mui-disabled": { opacity: 0.3 } }}
          >
            <ChevronRight size={24} />
          </IconButton>
          <IconButton
            onClick={() => { swiperRef.current?.slideNext(); setTimeout(updateNavigationState, 100); }}
            disabled={isEnd}
            sx={{ borderRadius: 2, "&:hover:not(.Mui-disabled)": { bgcolor: "action.hover", transform: "scale(1.1)" }, "&.Mui-disabled": { opacity: 0.3 } }}
          >
            <ChevronLeft size={24} />
          </IconButton>
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : articles.length === 0 ? (
        <Alert severity="info">{tFrontendAuto("fe.54ca9cd5a189")}</Alert>
      ) : (
        <Swiper
          onSwiper={(swiper) => { swiperRef.current = swiper; updateNavigationState(); }}
          onSlideChange={updateNavigationState}
          onReachBeginning={() => setIsBeginning(true)}
          onReachEnd={() => setIsEnd(true)}
          modules={[Navigation, Pagination, Autoplay, FreeMode]}
          dir="rtl"
          spaceBetween={16}
          slidesPerView={1.2}
          slidesPerGroup={1}
          freeMode
          speed={600}
          grabCursor
          autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true, dynamicBullets: true }}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 20, slidesPerGroup: 2 },
            768: { slidesPerView: 2.5, spaceBetween: 24, slidesPerGroup: 2 },
            1024: { slidesPerView: 3, spaceBetween: 24, slidesPerGroup: 3 },
            1280: { slidesPerView: 4, spaceBetween: 24, slidesPerGroup: 4 },
          }}
          className="!pb-12 blog-carousel"
          style={{ paddingBottom: "3rem", "--swiper-pagination-color": "var(--primary-color, #4f06e5)" } as React.CSSProperties}
        >
          {articles.map((article) => (
            <SwiperSlide key={article.id} className="!h-auto">
              <Box className="h-full">
                <BlogCard article={article} />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </Container>
  );
}
