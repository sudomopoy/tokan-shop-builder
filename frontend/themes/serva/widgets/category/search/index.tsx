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
  CardActionArea,
  Stack,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Search, Folder, ArrowRight } from "lucide-react";
import { categoryApi, type Category } from "@/lib/api/categoryApi";
import type { WidgetConfig } from "@/themes/types";
import { useRouter, useSearchParams } from "next/navigation";

function getCategoryLink(cat: Category, module: string): string {
  const id = cat.id;
  if (module === "blog" || module === "BLOG") {
    return `/blog?categories=${id}`;
  }
  return `/products?categories=${id}`;
}

function CategorySearchItem({ category, module }: { category: Category; module: string }) {
  const iconUrl = category.icon_url || category.icon?.file;
  const link = getCategoryLink(category, module);

  return (
    <ListItem
      component={Link}
      href={link}
      sx={{
        borderRadius: 2,
        mb: 1,
        bgcolor: "grey.50",
        "&:hover": { bgcolor: "grey.100" },
        textDecoration: "none",
        color: "inherit",
        gap: 1.5,
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        {iconUrl ? (
          <Box
            component="img"
            src={iconUrl.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_BASE || ""}${iconUrl}` : iconUrl}
            alt=""
            sx={{ width: 32, height: 32, objectFit: "contain" }}
          />
        ) : (
          <Folder size={24} className="text-gray-400" />
        )}
      </ListItemIcon>
      <ListItemText
        primary={<Typography fontWeight={500}>{category.name}</Typography>}
        sx={{ flex: 1, my: 0 }}
      />
      <Box component="span" sx={{ display: "flex", alignItems: "center", marginInlineStart: 1.5 }}>
        <ArrowRight size={18} style={{ opacity: 0.6 }} />
      </Box>
    </ListItem>
  );
}

export default function CategorySearch({ config }: { config?: WidgetConfig }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") ?? "";

  const moduleFilter = (config?.widgetConfig?.module as string) || "STORE";

  const [query, setQuery] = useState(initialQuery);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setCategories([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setError(null);
      setSearched(true);
      try {
        const results = await categoryApi.search(searchQuery.trim(), {
          module: moduleFilter,
        });
        setCategories(results);
      } catch (err) {
        console.error("Category search error:", err);
        setError("خطا در جستجو. لطفا دوباره تلاش کنید.");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    },
    [moduleFilter]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
    router.push(`/category/search?q=${encodeURIComponent(query)}`, { scroll: false });
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 3, fontSize: { xs: "1.5rem", md: "2rem" } }}>
        جستجوی دسته‌بندی
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="نام دسته‌بندی را جستجو کنید..."
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
            نام دسته‌بندی (یا زیردسته) را وارد کرده و جستجو کنید.
          </Typography>
        </Box>
      ) : categories.length === 0 ? (
        <Alert severity="info">دسته‌بندی‌ای با این عبارت یافت نشد.</Alert>
      ) : (
        <>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {categories.length} نتیجه برای «{query}»
          </Typography>
          <List disablePadding>
            {categories.map((cat) => (
              <CategorySearchItem key={cat.id} category={cat} module={moduleFilter} />
            ))}
          </List>
        </>
      )}

      <Box sx={{ mt: 4 }}>
        <Button
          component={Link}
          href="/category"
          variant="outlined"
          startIcon={<ArrowRight size={18} />}
          sx={{ textTransform: "none" }}
        >
          بازگشت به لیست دسته‌بندی‌ها
        </Button>
      </Box>
    </Container>
  );
}
