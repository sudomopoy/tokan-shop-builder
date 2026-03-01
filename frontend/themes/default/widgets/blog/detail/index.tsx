"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Typography,
  Container,
  CircularProgress,
  Alert,
  Button,
  Stack,
} from "@mui/material";
import { ArrowRight, Calendar, Eye } from "lucide-react";
import { articleApi, type Article } from "@/lib/api/articleApi";
import type { WidgetConfig } from "@/themes/types";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
};

export default function BlogDetail({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();
  const { data, setData } = usePageRuntime();
  const pathParams = config?.widgetConfig?.pathParams as Record<string, string | number> | undefined;
  const slugFromConfig = (pathParams?.slug ?? config?.widgetConfig?.slug) as string | undefined;
  const slugFromPath = pathname?.split("/").filter(Boolean).pop();
  const slug = slugFromConfig ?? slugFromPath;

  const ssrArticle = (data?.blog as Record<string, unknown>)?.["detail"] as Article | undefined;

  const [article, setArticle] = useState<Article | null>(ssrArticle ?? null);
  const [loading, setLoading] = useState(!ssrArticle);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    if (ssrArticle && ssrArticle.slug === slug) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError(null);
    articleApi
      .get(slug)
      .then((fetched) => {
        if (isMounted) {
          setArticle(fetched);
          setData("blog.detail", fetched);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Blog detail error:", err);
          setError(tFrontendAuto("fe.c740bdacdf1b"));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [slug, ssrArticle]);

  if (!slug) {
    return (
      <Container maxWidth="md" sx={{ py: 8, px: 2 }}>
        <Alert severity="info">{tFrontendAuto("fe.d774fc588180")}</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !article) {
    return (
      <Container maxWidth="md" sx={{ py: 6, px: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error ?? "مطلب یافت نشد."}</Alert>
        <Button component={Link} href="/blog" variant="outlined" startIcon={<ArrowRight size={18} />} sx={{ textTransform: "none" }}>
          بازگشت به وبلاگ
        </Button>
      </Container>
    );
  }

  const imageUrl =
    article.main_image?.file ||
    article.thumbnail_image?.file ||
    "https://via.placeholder.com/800x400?text=بدون+تصویر";
  const categoryName = typeof article.category === "object" && article.category?.name ? article.category.name : "";

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      <Button
        component={Link}
        href="/blog"
        startIcon={<ArrowRight size={18} />}
        sx={{ mb: 3, textTransform: "none" }}
      >
        بازگشت به وبلاگ
      </Button>

      <Box component="article">
        {categoryName && (
          <Typography variant="caption" color="primary" fontWeight={600} sx={{ mb: 1, display: "block" }}>
            {categoryName}
          </Typography>
        )}
        <Typography variant="h3" component="h1" fontWeight="bold" sx={{ mb: 2, fontSize: { xs: "1.5rem", md: "2rem" } }}>
          {article.title}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box component="span" sx={{ color: "text.secondary", display: "inline-flex" }}><Calendar size={16} /></Box>
            <Typography variant="body2" color="text.secondary">
              {formatDate(article.created_at)}
            </Typography>
          </Stack>
          {article.total_views != null && article.total_views > 0 && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box component="span" sx={{ color: "text.secondary", display: "inline-flex" }}><Eye size={16} /></Box>
              <Typography variant="body2" color="text.secondary">
                {new Intl.NumberFormat("fa-IR").format(article.total_views)} بازدید
              </Typography>
            </Stack>
          )}
        </Stack>

        <Box
          component="img"
          src={imageUrl}
          alt={article.title}
          sx={{
            width: "100%",
            borderRadius: 3,
            objectFit: "cover",
            maxHeight: 400,
            mb: 4,
          }}
        />

        <Box
          className="blog-content prose prose-lg max-w-none"
          sx={{
            "& img": { maxWidth: "100%", height: "auto", borderRadius: 2 },
            "& a": { color: "primary.main" },
            fontSize: "1.1rem",
            lineHeight: 1.8,
          }}
          dangerouslySetInnerHTML={{ __html: article.description }}
        />
      </Box>
    </Container>
  );
}
