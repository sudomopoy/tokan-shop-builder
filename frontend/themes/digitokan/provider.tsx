"use client";

import React, { PropsWithChildren, useMemo } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";
import { createDigitokanTheme } from "./theme-config";

// Create RTL cache
const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

/**
 * Digitokan theme provider
 * - Provides MUI theme with RTL support
 * - Uses Digikala-inspired design tokens
 * - Supports Persian language and right-to-left layout
 */
export default function DigitokanThemeProvider({ children }: PropsWithChildren) {
  const theme = useMemo(() => createDigitokanTheme(), []);

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
