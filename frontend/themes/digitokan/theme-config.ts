import { createTheme, ThemeOptions } from "@mui/material/styles";
import { DIGITOKAN_TOKENS } from "./design-tokens";

export function createDigitokanTheme() {
  const themeOptions: ThemeOptions = {
    direction: "rtl",
    
    palette: {
      primary: DIGITOKAN_TOKENS.colors.primary,
      secondary: DIGITOKAN_TOKENS.colors.secondary,
      error: DIGITOKAN_TOKENS.colors.error,
      warning: DIGITOKAN_TOKENS.colors.warning,
      info: DIGITOKAN_TOKENS.colors.info,
      success: DIGITOKAN_TOKENS.colors.success,
      grey: DIGITOKAN_TOKENS.colors.grey,
      background: DIGITOKAN_TOKENS.colors.background,
      text: DIGITOKAN_TOKENS.colors.text,
    },
    
    typography: {
      fontFamily: DIGITOKAN_TOKENS.typography.fontFamily,
      fontSize: 14,
      
      h1: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize["4xl"],
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.bold,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.tight,
      },
      h2: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize["3xl"],
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.bold,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.tight,
      },
      h3: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize["2xl"],
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.semibold,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
      h4: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.xl,
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.semibold,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
      h5: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.lg,
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.medium,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
      h6: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.base,
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.medium,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
      body1: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.base,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.relaxed,
      },
      body2: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.sm,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
      button: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.sm,
        fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.medium,
        textTransform: "none",
      },
      caption: {
        fontSize: DIGITOKAN_TOKENS.typography.fontSize.xs,
        lineHeight: DIGITOKAN_TOKENS.typography.lineHeight.normal,
      },
    },
    
    spacing: DIGITOKAN_TOKENS.spacing.unit,
    
    shape: {
      borderRadius: parseInt(DIGITOKAN_TOKENS.borderRadius.md),
    },
    
    shadows: [
      "none",
      DIGITOKAN_TOKENS.shadows.sm,
      DIGITOKAN_TOKENS.shadows.base,
      DIGITOKAN_TOKENS.shadows.md,
      DIGITOKAN_TOKENS.shadows.lg,
      DIGITOKAN_TOKENS.shadows.xl,
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
      DIGITOKAN_TOKENS.shadows["2xl"],
    ] as any,
    
    transitions: {
      duration: DIGITOKAN_TOKENS.transitions.duration,
      easing: DIGITOKAN_TOKENS.transitions.easing,
    },
    
    breakpoints: {
      values: DIGITOKAN_TOKENS.breakpoints,
    },
    
    zIndex: DIGITOKAN_TOKENS.zIndex,
    
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: DIGITOKAN_TOKENS.borderRadius.lg,
            padding: "10px 24px",
            fontSize: DIGITOKAN_TOKENS.typography.fontSize.sm,
            fontWeight: DIGITOKAN_TOKENS.typography.fontWeight.medium,
            boxShadow: "none",
            "&:hover": {
              boxShadow: DIGITOKAN_TOKENS.shadows.md,
            },
          },
          contained: {
            "&:hover": {
              boxShadow: DIGITOKAN_TOKENS.shadows.lg,
            },
          },
        },
      },
      
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: DIGITOKAN_TOKENS.borderRadius.xl,
            boxShadow: DIGITOKAN_TOKENS.shadows.base,
            "&:hover": {
              boxShadow: DIGITOKAN_TOKENS.shadows.lg,
            },
          },
        },
      },
      
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: DIGITOKAN_TOKENS.borderRadius.lg,
            },
          },
        },
      },
      
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: DIGITOKAN_TOKENS.borderRadius.md,
          },
        },
      },
      
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: DIGITOKAN_TOKENS.shadows.sm,
          },
        },
      },
    },
  };
  
  return createTheme(themeOptions);
}
