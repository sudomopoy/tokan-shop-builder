"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import type { WidgetConfig } from "@/themes/types";

type Feature = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
};

const DEFAULT_FEATURES: Feature[] = [
  {
    title: "ارسال سریع",
    subtitle: "تحویل سریع و مطمئن در سراسر کشور",
    icon: <LocalShippingRoundedIcon fontSize="large" />,
    color: "primary.main",
  },
  {
    title: "ضمانت اصالت",
    subtitle: "تضمین کیفیت و اصالت کالاها",
    icon: <VerifiedUserRoundedIcon fontSize="large" />,
    color: "secondary.main",
  },
  {
    title: "پشتیبانی حرفه‌ای",
    subtitle: "پاسخ‌گویی سریع در تمام مراحل خرید",
    icon: <SupportAgentRoundedIcon fontSize="large" />,
    color: "info.main",
  },
  {
    title: "مرجوعی آسان",
    subtitle: "امکان بازگشت کالا در چارچوب قوانین",
    icon: <AutorenewRoundedIcon fontSize="large" />,
    color: "success.main",
  },
];

export default function DigitokanHomeFeatures({ config }: { config?: WidgetConfig }) {
  const title =
    typeof config?.widgetConfig?.title === "string"
      ? config.widgetConfig.title
      : "چرا دیجی‌توکان؟";

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.4rem", md: "1.8rem" } }}>
          {title}
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {DEFAULT_FEATURES.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.title}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                height: "100%",
                transition: "all 0.25s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                  borderColor: "primary.main",
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(239,57,78,0.1)",
                      color: feature.color,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.9 }}>
                    {feature.subtitle}
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
