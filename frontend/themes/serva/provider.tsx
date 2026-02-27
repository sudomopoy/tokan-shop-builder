"use client";

import React, { PropsWithChildren, useEffect } from "react";
import { ensureThemeCss } from "@/themes/runtime/ensureThemeCss";

/**
 * Serva theme provider
 * - Loads theme stylesheet from `/public/themes/serva/theme.css`
 * - Sets `data-theme="serva"` on <html> for scoped CSS
 *
 * Note: Serva theme intentionally does NOT depend on MUI. All UI is theme-local.
 */
export default function ServaThemeProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    ensureThemeCss("serva");
  }, []);

  return <>{children}</>;
}

