/**
 * Design tokens for Default Theme - ensures consistency across all widgets
 * Supports RTL (Persian) layouts
 */

export const DESIGN_TOKENS = {
  // Spacing scale (in px, matches MUI theme 1 unit = 8px)
  space: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    xxl: 6,
  },

  // Border radius
  radius: {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },

  // Typography scale
  typography: {
    h1: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
    h2: { xs: "1.35rem", sm: "1.75rem", md: "2rem" },
    h3: { xs: "1.2rem", sm: "1.5rem", md: "1.75rem" },
    h4: { xs: "1.1rem", sm: "1.25rem", md: "1.5rem" },
    body: "1rem",
    caption: "0.875rem",
    small: "0.75rem",
  },

  // Shadow for cards
  shadow: {
    card: "0 2px 12px rgba(0,0,0,0.06)",
    cardHover: "0 8px 24px rgba(0,0,0,0.1)",
    button: "0 4px 14px rgba(0,0,0,0.1)",
    buttonHover: "0 6px 20px rgba(0,0,0,0.15)",
  },

  // Transition
  transition: "all 0.25s ease",
} as const;
