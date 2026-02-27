import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Vazirmatn", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9efff",
          200: "#b9e2ff",
          300: "#86d1ff",
          400: "#46b8ff",
          500: "#1698ff",
          600: "#0a7df4",
          700: "#0963c8",
          800: "#0b4f9a",
          900: "#0b3f7a",
          950: "#071f3d",
        },
      },
      boxShadow: {
        soft: "0 18px 50px rgba(10, 125, 244, 0.15)",
        glass: "0 4px 20px rgba(0, 0, 0, 0.08)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        floaty: "floaty 7s ease-in-out infinite",
        shimmer: "shimmer 10s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
