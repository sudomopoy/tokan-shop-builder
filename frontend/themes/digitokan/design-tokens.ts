/**
 * Design tokens for Digitokan theme.
 * Inspired by Digikala with modern enhancements.
 */
export const DIGITOKAN_TOKENS = {
  colors: {
    // Primary colors (inspired by Digikala)
    primary: {
      main: "#EF394E",      // Digikala red
      light: "#FF5C6F",
      dark: "#D32F3F",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#19BFD3",      // Digikala cyan
      light: "#4DD0E1",
      dark: "#0097A7",
      contrastText: "#FFFFFF",
    },
    // Neutral colors
    grey: {
      50: "#FAFAFA",
      100: "#F5F5F5",
      200: "#EEEEEE",
      300: "#E0E0E0",
      400: "#BDBDBD",
      500: "#9E9E9E",
      600: "#757575",
      700: "#616161",
      800: "#424242",
      900: "#212121",
    },
    // Semantic colors
    success: {
      main: "#00A049",
      light: "#4CAF50",
      dark: "#00796B",
    },
    warning: {
      main: "#F9A825",
      light: "#FBC02D",
      dark: "#F57F17",
    },
    error: {
      main: "#D32F2F",
      light: "#EF5350",
      dark: "#C62828",
    },
    info: {
      main: "#0288D1",
      light: "#03A9F4",
      dark: "#01579B",
    },
    // Background colors
    background: {
      default: "#F5F5F5",
      paper: "#FFFFFF",
    },
    // Text colors
    text: {
      primary: "#212121",
      secondary: "#757575",
      disabled: "#BDBDBD",
    },
  },
  
  typography: {
    fontFamily: [
      "IRANSans",
      "Vazirmatn",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "sans-serif",
    ].join(","),
    
    // Font sizes
    fontSize: {
      xs: "0.75rem",    // 12px
      sm: "0.875rem",   // 14px
      base: "1rem",     // 16px
      lg: "1.125rem",   // 18px
      xl: "1.25rem",    // 20px
      "2xl": "1.5rem",  // 24px
      "3xl": "1.875rem",// 30px
      "4xl": "2.25rem", // 36px
    },
    
    // Font weights
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
    
    // Line heights
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },
  
  spacing: {
    unit: 8, // Base spacing unit (8px)
    // Spacing scale: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
  },
  
  borderRadius: {
    none: 0,
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    "3xl": "24px",
    full: "9999px",
  },
  
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },
  
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
    },
  },
  
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
  
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
} as const;
