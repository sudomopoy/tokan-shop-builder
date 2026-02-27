"use client";

import React from "react";
import Link from "next/link";
import { Box, Typography, Button } from "@mui/material";
import { Home, AlertTriangle } from "lucide-react";

export default function Static500() {
  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
      }}
    >
      <Box
        sx={{
          textAlign: "center",
          maxWidth: 480,
          mx: "auto",
        }}
      >
        <Box sx={{ color: "error.main", mb: 2, "& > svg": { display: "block", mx: "auto" } }}>
          <AlertTriangle size={80} strokeWidth={1.5} />
        </Box>
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "4rem", md: "5rem" },
            fontWeight: 800,
            color: "error.main",
            mb: 1,
          }}
        >
          500
        </Typography>
        <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom>
          خطای سرور
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          متأسفانه خطایی در سرور رخ داده است. لطفاً کمی بعد دوباره تلاش کنید.
        </Typography>
        <Button
          component={Link}
          href="/"
          variant="contained"
          size="large"
          startIcon={<Home size={20} />}
          sx={{
            borderRadius: 3,
            px: 4,
            py: 1.5,
          }}
        >
          بازگشت به صفحه اصلی
        </Button>
      </Box>
    </Box>
  );
}
