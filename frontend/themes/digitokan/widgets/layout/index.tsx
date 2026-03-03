"use client";

import React, { PropsWithChildren, useEffect, useState } from "react";
import { Box, Fab, Zoom } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import type { WidgetConfig } from "@/themes/types";
import DigitokanHeader from "./header";
import DigitokanFooter from "./footer";

type DigitokanLayoutProps = PropsWithChildren<{
  config?: WidgetConfig;
}>;

export default function DigitokanLayout({ children, config }: DigitokanLayoutProps) {
  const headerRaw = config?.widgetConfig?.header;
  const footerRaw = config?.widgetConfig?.footer;
  const showHeader = typeof headerRaw === "boolean" ? headerRaw : true;
  const showFooter = typeof footerRaw === "boolean" ? footerRaw : true;

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {showHeader && <DigitokanHeader />}

      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 3, md: 5 },
        }}
      >
        {children}
      </Box>

      {showFooter && <DigitokanFooter />}

      <Zoom in={showBackToTop}>
        <Fab
          color="primary"
          size="medium"
          aria-label="بازگشت به بالا"
          onClick={handleBackToTop}
          sx={{
            position: "fixed",
            bottom: 24,
            left: 24,
            zIndex: (theme) => theme.zIndex.speedDial,
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </Box>
  );
}
