"use client";

import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { DEPLOY_DIRECTION } from "@/lib/i18n/deployment";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/free-mode";

const DEFAULT_PRIMARY = "#00A6e5";
const DEFAULT_SECONDARY = "#7c3aed";

function getCSSVariable(variableName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  return value || fallback;
}

export default function DefaultThemeProvider({ children }: PropsWithChildren) {
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState<string>(DEFAULT_SECONDARY);

  useEffect(() => {
    setPrimaryColor(getCSSVariable("--primary-color", DEFAULT_PRIMARY));
    setSecondaryColor(getCSSVariable("--secondary-color", DEFAULT_SECONDARY));
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        direction: DEPLOY_DIRECTION,
        palette: {
          mode: "light",
          primary: {
            main: primaryColor,
            contrastText: "#fff",
          },
          secondary: {
            main: secondaryColor,
            contrastText: "#fff",
          },
          background: {
            default: "#fafafa",
            paper: "#ffffff",
          },
        },
        typography: {
          fontFamily: "Vazirmatn, ui-sans-serif, system-ui, sans-serif",
          h1: { fontWeight: 700 },
          h2: { fontWeight: 700 },
          h3: { fontWeight: 600 },
          h4: { fontWeight: 600 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            defaultProps: {
              disableElevation: true,
            },
            styleOverrides: {
              root: {
                textTransform: "none",
                borderRadius: 12,
                fontWeight: 600,
                "& .MuiButton-startIcon": {
                  marginInlineEnd: 10,
                  marginInlineStart: 0,
                },
                "& .MuiButton-endIcon": {
                  marginInlineStart: 10,
                  marginInlineEnd: 0,
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                },
              },
            },
          },
          MuiTextField: {
            defaultProps: {
              variant: "outlined",
              fullWidth: true,
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: {
                gap: 12,
                minHeight: 44,
              },
            },
          },
          MuiListItemIcon: {
            styleOverrides: {
              root: {
                minWidth: 40,
                marginInlineEnd: 12,
                marginInlineStart: 0,
              },
            },
          },
          MuiInputAdornment: {
            styleOverrides: {
              root: {
                "&.MuiInputAdornment-positionStart": {
                  marginInlineEnd: 12,
                  marginInlineStart: 0,
                },
                "&.MuiInputAdornment-positionEnd": {
                  marginInlineStart: 12,
                  marginInlineEnd: 0,
                },
              },
            },
          },
        },
      }),
    [primaryColor, secondaryColor]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
