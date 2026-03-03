"use client";

import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import type { WidgetConfig } from "@/themes/types";

export default function DigitokanNewsletter({ config }: { config?: WidgetConfig }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const title =
    typeof config?.widgetConfig?.title === "string"
      ? config.widgetConfig.title
      : "عضویت در خبرنامه دیجی‌توکان";
  const subtitle =
    typeof config?.widgetConfig?.subtitle === "string"
      ? config.widgetConfig.subtitle
      : "از جدیدترین پیشنهادها، کمپین‌ها و محصولات تازه سریع‌تر از همه باخبر شوید.";

  const submit = async () => {
    if (!email.trim()) return;
    setStatus("loading");
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 5,
          border: 1,
          borderColor: "divider",
          background: "linear-gradient(135deg, rgba(239,57,78,0.08), rgba(25,191,211,0.1))",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
            <Box
              sx={{
                width: 58,
                height: 58,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                bgcolor: "background.paper",
                color: "primary.main",
              }}
            >
              <MarkEmailReadRoundedIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: "1.4rem", md: "1.9rem" } }}>
                {title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              label="ایمیل"
              placeholder="you@example.com"
              disabled={status === "loading"}
            />
            <Button
              variant="contained"
              onClick={submit}
              disabled={status === "loading" || !email.trim()}
              sx={{ borderRadius: 2.5, px: 4, py: 1.4, minWidth: 140 }}
            >
              {status === "loading" ? "در حال ثبت..." : "عضویت"}
            </Button>
          </Stack>

          {status === "success" ? <Alert severity="success">عضویت شما با موفقیت ثبت شد.</Alert> : null}
          {status === "error" ? <Alert severity="error">خطا در ثبت ایمیل. دوباره تلاش کنید.</Alert> : null}
        </Stack>
      </Paper>
    </Container>
  );
}
