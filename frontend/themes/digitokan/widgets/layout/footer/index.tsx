"use client";

import React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Link as MuiLink,
  Divider,
} from "@mui/material";
import Link from "next/link";

export default function DigitokanFooter() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "grey.900",
        color: "grey.100",
        py: 6,
        mt: "auto",
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* About */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "white" }}>
              درباره دیجی‌توکان
            </Typography>
            <Typography variant="body2" sx={{ color: "grey.400", lineHeight: 1.8 }}>
              فروشگاه آنلاین دیجی‌توکان با ارائه محصولات با کیفیت و خدمات عالی، بهترین تجربه خرید را برای شما فراهم می‌کند.
            </Typography>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "white" }}>
              دسترسی سریع
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <MuiLink component={Link} href="/about" color="grey.400" underline="hover">
                درباره ما
              </MuiLink>
              <MuiLink component={Link} href="/contact" color="grey.400" underline="hover">
                تماس با ما
              </MuiLink>
              <MuiLink component={Link} href="/faq" color="grey.400" underline="hover">
                سوالات متداول
              </MuiLink>
            </Box>
          </Grid>

          {/* Customer Service */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "white" }}>
              خدمات مشتریان
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <MuiLink component={Link} href="/terms" color="grey.400" underline="hover">
                قوانین و مقررات
              </MuiLink>
              <MuiLink component={Link} href="/privacy" color="grey.400" underline="hover">
                حریم خصوصی
              </MuiLink>
              <MuiLink component={Link} href="/shipping" color="grey.400" underline="hover">
                شیوه‌های ارسال
              </MuiLink>
            </Box>
          </Grid>

          {/* Contact */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "white" }}>
              تماس با ما
            </Typography>
            <Typography variant="body2" sx={{ color: "grey.400", lineHeight: 1.8 }}>
              تلفن: ۰۲۱-۱۲۳۴۵۶۷۸
              <br />
              ایمیل: info@digitokan.com
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "grey.800" }} />

        <Typography variant="body2" align="center" sx={{ color: "grey.500" }}>
          © {new Date().getFullYear()} دیجی‌توکان. تمامی حقوق محفوظ است.
        </Typography>
      </Container>
    </Box>
  );
}
