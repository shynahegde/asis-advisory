import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#171717",
        primary: {
          DEFAULT: "#1D4ED8",
          50: "#EFF6FF",
          100: "#DBEAFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        success: {
          DEFAULT: "#16A34A",
          50: "#F0FDF4",
          100: "#DCFCE7",
          600: "#16A34A",
          700: "#15803D",
        },
        amber: {
          DEFAULT: "#D97706",
          50: "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
        warm: {
          50: "#F8F7F5",
          100: "#F1EFE9",
          200: "#E8E4DC",
        },
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["Source Sans 3", "system-ui", "sans-serif"],
      },
      fontSize: {
        base: ["18px", { lineHeight: "1.7" }],
        sm: ["16px", { lineHeight: "1.6" }],
        lg: ["20px", { lineHeight: "1.7" }],
        xl: ["24px", { lineHeight: "1.5" }],
        "2xl": ["28px", { lineHeight: "1.4" }],
        "3xl": ["36px", { lineHeight: "1.3" }],
        "4xl": ["48px", { lineHeight: "1.2" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      minHeight: {
        "touch": "52px",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};
export default config;
