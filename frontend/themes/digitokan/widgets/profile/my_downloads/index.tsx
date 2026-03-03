"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import type { WidgetConfig } from "@/themes/types";
import { orderApi } from "@/lib/api/orderApi";
import { useAppSelector } from "@/lib/store/hooks";
import { selectIsAuthenticated } from "@/lib/store/authSlice";

type DownloadFile = { title: string; description?: string; download_url: string };
type DownloadItem = {
  id: string;
  order_item_id: string;
  title: string;
  download_url?: string;
  files?: DownloadFile[];
  main_image?: { id: string; file: string } | null;
};

export default function DigitokanMyDownloads({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setItems([]);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    orderApi
      .getPurchasedDigitalContent()
      .then((result) => {
        if (!mounted) return;
        setItems((result.download ?? []) as DownloadItem[]);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setItems([]);
        setError("خطا در دریافت فایل‌های دانلودی");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Card>
          <CardContent sx={{ p: 5, textAlign: "center" }}>
            <PersonRoundedIcon sx={{ fontSize: 56, color: "text.secondary", mb: 1 }} />
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              برای مشاهده فایل‌ها وارد شوید
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              محتوای دانلودی پس از ورود در دسترس خواهد بود.
            </Typography>
            <Button
              component={Link}
              href={`/login?next=${encodeURIComponent(pathname || "/my-downloads")}`}
              variant="contained"
            >
              ورود
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Card>
          <CardContent sx={{ p: 5, textAlign: "center" }}>
            <DownloadRoundedIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              محتوای دانلودی ندارید
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              پس از خرید محصولات دیجیتال، فایل‌ها در این بخش نمایش داده می‌شوند.
            </Typography>
            <Button component={Link} href="/products/search" variant="outlined">
              مشاهده محصولات
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 3, fontSize: { xs: "1.4rem", md: "1.9rem" } }}>
        فایل‌های دانلودی من
      </Typography>

      <Grid container spacing={2.5}>
        {items.map((item) => {
          const fileList = item.files?.length
            ? item.files
            : item.download_url
              ? [{ title: item.title, download_url: item.download_url }]
              : [];

          return (
            <Grid item xs={12} md={6} key={item.id}>
              <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {item.main_image?.file ? (
                        <Box
                          component="img"
                          src={item.main_image.file}
                          alt={item.title}
                          sx={{ width: 64, height: 64, borderRadius: 2, objectFit: "cover", border: 1, borderColor: "divider" }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "grey.100",
                            color: "text.secondary",
                          }}
                        >
                          <DownloadRoundedIcon />
                        </Box>
                      )}
                      <Typography fontWeight={700}>{item.title}</Typography>
                    </Stack>

                    <Divider />

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {fileList.length > 0 ? (
                        fileList.map((file, index) => (
                          <Button
                            key={`${item.id}-${index}`}
                            component="a"
                            href={file.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            variant="contained"
                            startIcon={<DownloadRoundedIcon />}
                            sx={{ borderRadius: 2.5 }}
                          >
                            {file.title || "دانلود"}
                          </Button>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          فایل دانلودی برای این محصول ثبت نشده است.
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
