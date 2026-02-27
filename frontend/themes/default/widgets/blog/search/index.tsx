"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Container,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  Stack,
  CircularProgress,
  Alert,
  Button,
  Grid,
} from "@mui/material";
import { Search, Calendar, Eye, ArrowRight } from "lucide-react";
import { articleApi, type Article } from "@/lib/api/articleApi";
import type { WidgetConfig } from "@/themes/types";
import { useRouter, useSearchParams } from "next/navigation";

const stripHtml = (html: string, maxLen = 150): string => {
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

function BlogSearchCard({ article }: { article: Article }) {
  const imageUrl =
    article.thumbnail_image?.file ||
    article.main_image?.file ||
    "https://via.placeholder.com/300x180?text=بدون+تصویر";
  const excerpt = stripHtml(article.description);
  const categoryName = typeof article.category === "object" && article.category?.name ? article.category.name : "";

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        transition: "box-shadow 0.3s",
        "&:hover": { boxShadow: 4 },
      }}
    >
      <Link href={`/blog/${article.slug}`}>
        <CardMedia
          component="img"
          image={imageUrl}
          alt={article.title}
          sx={{ height: 160, objectFit: "cover" }}
        />
      </Link>
      <CardContent sx={{ p: 2 }}>
        {categoryName && (
          <Typography variant="caption" color="primary" fontWeight={600} sx={{ display: "block", mb: 0.5 }}>
            {categoryName}
          </Typography>
        )}
        <Link href={`/blog/${article.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
          <Typography
            variant="h6"
            component="h3"
            className="line-clamp-2"
            sx={{ fontWeight: 600, fontSize: "1rem", mb: 1, "&:hover": { color: "primary.main" } }}
          >
            {article.title}
          </Typography>
        </Link>
        {excerpt && (
          <Typography variant="body2" color="text.secondary" className="line-clamp-2" sx={{ mb: 1 }}>
            {excerpt}
          </Typography>
        )}
        <Stack direction="row" spacing={2} alignItems="center">
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

export default function BlogSearch({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") ?? "";

  const moduleFilter = (config?.widgetConfig?.module as string) || "blog";

  const [query, setQuery] = useState(initialQuery);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(!!initialQuery);

  const doSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setArticles([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setError(null);
      setSearched(true);
      try {
        const res = await articleApi.search(searchQuery.trim(), { page_size: 24, module: moduleFilter });
        setArticles(res.results ?? []);
      } catch (err) {
        console.error("Blog search error:", err);
        setError("خطا در جستجو. لطفا دوباره تلاش کنید.");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    },
    [moduleFilter]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
    router.push(`/blog/search?q=${encodeURIComponent(query)}`, { scroll: false });
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 3, fontSize: { xs: "1.5rem", md: "2rem" } }}>
        جستجو در وبلاگ
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="عبارت جستجو..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} className="text-gray-500" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : "جستجو"}
                </Button>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: "grey.50",
            },
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !searched ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Search size={48} className="text-gray-400" />
          </Box>
          <Typography color="text.secondary">
            عبارت جستجو را وارد کرده و دکمه جستجو را بزنید.
          </Typography>
        </Box>
      ) : articles.length === 0 ? (
        <Alert severity="info">مطلبی با این عبارت یافت نشد.</Alert>
      ) : (
        <>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {articles.length} نتیجه برای «{query}»
          </Typography>
          <Grid container spacing={3}>
            {articles.map((article) => (
              <Grid item xs={12} sm={6} md={4} key={article.id}>
                <BlogSearchCard article={article} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Box sx={{ mt: 4 }}>
        <Button component={Link} href="/blog" variant="outlined" startIcon={<ArrowRight size={18} />} sx={{ textTransform: "none" }}>
          بازگشت به وبلاگ
        </Button>
      </Box>
    </Container>
  );
}
