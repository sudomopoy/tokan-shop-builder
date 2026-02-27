/**
 * Design tokens for Serva theme.
 *
 * This file is theme-local by design. Core logic/state stays outside themes.
 */
export const SERVA_TOKENS = {
  colors: {
    primary: "#2563eb", // close to template "primary"
    secondary: "#10b981",
    accent: "#f59e0b",
    dark: "#111827",
  },
  radius: {
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
  },
  shadow: {
    soft: "0 8px 30px rgba(0, 0, 0, 0.06)",
    card: "0 6px 18px rgba(0, 0, 0, 0.08)",
  },
} as const;

