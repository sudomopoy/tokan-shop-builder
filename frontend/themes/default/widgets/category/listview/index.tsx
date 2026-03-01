"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Folder, ArrowRight } from "lucide-react";
import { categoryApi, type Category } from "@/lib/api/categoryApi";
import type { WidgetConfig } from "@/themes/types";
import { usePageRuntime } from "@/themes/runtime/PageRuntimeProvider";
import { tFrontendAuto } from "@/lib/i18n/autoMessages";

function flattenCategoryTree(items: Category[]): Category[] {
  const out: Category[] = [];
  for (const c of items) {
    out.push(c);
    if (c.children?.length) out.push(...flattenCategoryTree(c.children));
  }
  return out;
}

function getCategoryLink(cat: Category, module: string): string {
  const id = cat.id;
  if (module === "blog" || module === "BLOG") {
    return `/blog?categories=${id}`;
  }
  return `/products?categories=${id}`;
}

function CategoryTreeSection({
  category,
  module,
  depth = 0,
}: {
  category: Category;
  module: string;
  depth?: number;
}) {
  return (
    <Box>
      <Grid container spacing={depth === 0 ? 3 : 2}>
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <CategoryCard category={category} module={module} />
        </Grid>
      </Grid>
      {category.children?.length ? (
        <Box
          sx={{
            mt: 2,
            pl: { xs: 2, md: 4 },
            borderRight: 2,
            borderColor: "divider",
            mr: 2,
          }}
        >
          {category.children.map((child) => (
            <CategoryTreeSection
              key={child.id}
              category={child}
              module={module}
              depth={depth + 1}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  );
}

function CategoryCard({ category, module }: { category: Category; module: string }) {
  const iconUrl = category.icon_url || category.icon?.file;
  const childrenCount = category.children_count ?? (category.children?.length ?? 0);
  const link = getCategoryLink(category, module);

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
      <CardActionArea component={Link} href={link} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 140,
            p: 3,
            bgcolor: "grey.50",
          }}
        >
          {iconUrl ? (
            <Box
              component="img"
              src={iconUrl.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_BASE || ""}${iconUrl}` : iconUrl}
              alt={category.name}
              sx={{
                width: 64,
                height: 64,
                objectFit: "contain",
                mb: 1,
              }}
            />
          ) : (
            <Folder size={48} className="text-gray-400" style={{ marginBottom: 8 }} />
          )}
          <Typography variant="h6" component="h3" fontWeight={600} align="center" sx={{ fontSize: "1rem" }}>
            {category.name}
          </Typography>
          {childrenCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {childrenCount} زیردسته
            </Typography>
          )}
        </Box>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, color: "primary.main" }}>
            <Typography variant="body2" fontWeight={500}>
              مشاهده
            </Typography>
            <ArrowRight size={16} />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function CategoryListView({ config }: { config?: WidgetConfig }) {
  const { data } = usePageRuntime();
  const moduleFilter = (config?.widgetConfig?.module as string) || "STORE";
  const parentOnly = (config?.widgetConfig?.root_only as boolean) ?? true;

  const categoryData = data?.category as Record<string, unknown> | undefined;
  const treeByModule = categoryData?.tree as Record<string, Category[]> | undefined;
  const ssrTree = treeByModule?.[moduleFilter] ?? (categoryData?.tree as Category[] | undefined);

  const [categories, setCategories] = useState<Category[]>(() => {
    if (ssrTree?.length) {
      const filtered =
        Array.isArray(ssrTree) && ssrTree.length > 0
          ? ssrTree.filter((c) => c.module === moduleFilter)
          : [];
      return parentOnly ? filtered : flattenCategoryTree(filtered);
    }
    return [];
  });
  const [loading, setLoading] = useState(!ssrTree?.length);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ssrTree?.length) {
      const filtered =
        Array.isArray(ssrTree) && ssrTree.length > 0
          ? ssrTree.filter((c) => c.module === moduleFilter)
          : [];
      setCategories(parentOnly ? filtered : flattenCategoryTree(filtered));
      setLoading(false);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError(null);
    categoryApi
      .tree({ module: moduleFilter })
      .then((tree) => {
        if (isMounted) {
          const filtered =
            Array.isArray(tree) && tree.length > 0
              ? tree.filter((c) => c.module === moduleFilter)
              : [];
          setCategories(parentOnly ? filtered : flattenCategoryTree(filtered));
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Category list error:", err);
          setError(tFrontendAuto("fe.577dc080e3c8"));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [moduleFilter, parentOnly, ssrTree]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, px: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ fontSize: { xs: "1.5rem", md: "2rem" } }}>
          دسته‌بندی‌ها
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {loading ? "در حال بارگذاری..." : `${categories.length} دسته‌بندی`}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : categories.length === 0 ? (
        <Alert severity="info">{tFrontendAuto("fe.f460f71ab096")}</Alert>
      ) : parentOnly ? (
        <Stack spacing={4}>
          {categories.map((cat) => (
            <CategoryTreeSection key={cat.id} category={cat} module={moduleFilter} />
          ))}
        </Stack>
      ) : (
        <Grid container spacing={3}>
          {categories.map((cat) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
              <CategoryCard category={cat} module={moduleFilter} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
