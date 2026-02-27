"use client";

import React, { PropsWithChildren } from "react";
import { Box } from "@mui/material";
import type { WidgetConfig } from "@/themes/types";

import Header from "./header";
import Footer from "./footer";

type DefaultLayoutProps = PropsWithChildren<{
  config?: WidgetConfig;
}>;

export default function DefaultLayout({ children, config }: DefaultLayoutProps) {
  const headerRaw = config?.widgetConfig?.header;
  const footerRaw = config?.widgetConfig?.footer;

  const showHeader = typeof headerRaw === "boolean" ? headerRaw : true;
  const showFooter = typeof footerRaw === "boolean" ? footerRaw : true;

  return (
    <Box className="min-h-dvh flex flex-col bg-gray-50">
      {showHeader && <Header />}
      <Box component="main" className="flex-1">
        {children}
      </Box>
      {showFooter && <Footer />}
    </Box>
  );
}
