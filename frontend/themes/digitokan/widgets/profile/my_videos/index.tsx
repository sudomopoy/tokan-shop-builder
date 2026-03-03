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
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
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

export default function DigitokanMyVideos({ config }: { config?: WidgetConfig }) {
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StreamingItem[]>([]);
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
        setItems((result.streaming ?? []) as StreamingItem[]);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setItems([]);
        setError("خطا در دریافت ویدیوهای خریداری‌شده");
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
              برای مشاهده ویدیوها وارد شوید
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              محتوای ویدیویی خریداری‌شده پس از ورود نمایش داده می‌شود.
            </Typography>
            <Button
              component={Link}
              href={`/login?next=${encodeURIComponent(pathname || "/my-videos")}`}
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
            <PlayCircleRoundedIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1 }} />
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              ویدیوی خریداری‌شده ندارید
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              پس از خرید محصولات استریم، ویدیوها در این قسمت نمایش داده می‌شوند.
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
        ویدیوهای من
      </Typography>

      <Grid container spacing={2.5}>
        {items.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.id}>
            <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}>
              <Box sx={{ aspectRatio: "16 / 9", bgcolor: "common.black" }}>
                <video
                  src={item.stream_play_url}
                  controls
                  controlsList="nodownload"
                  playsInline
                  onContextMenu={(event) => event.preventDefault()}
                  poster={item.main_image?.file || undefined}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </Box>
              <CardContent>
                <Stack spacing={1}>
                  <Typography fontWeight={700} sx={{ lineHeight: 1.8 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    شناسه سفارش: {item.order_item_id}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
