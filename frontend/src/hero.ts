// HeroUI plugin configuration for Tailwind CSS v4
// This configuration aligns with the existing CSS variables in index.css
import { heroui } from "@heroui/react";

export default heroui({
  // Default theme to use
  defaultTheme: "dark",
  // Default extended theme to use
  defaultExtendTheme: "dark",
  // Common layout options
  layout: {
    radius: {
      small: "4px",
      medium: "8px",
      large: "12px",
    },
    borderWidth: {
      small: "1px",
      medium: "2px",
      large: "3px",
    },
    disabledOpacity: 0.5,
    dividerWeight: "1px",
    fontSize: {
      tiny: "0.75rem",
      small: "0.875rem",
      medium: "1rem",
      large: "1.125rem",
    },
    lineHeight: {
      tiny: "1rem",
      small: "1.25rem",
      medium: "1.5rem",
      large: "1.75rem",
    },
  },
  themes: {
    light: {
      layout: {
        hoverOpacity: 0.8,
        boxShadow: {
          small: "0px 0px 5px 0px rgba(0, 0, 0, 0.05), 0px 2px 10px 0px rgba(0, 0, 0, 0.1)",
          medium: "0px 0px 15px 0px rgba(0, 0, 0, 0.06), 0px 2px 30px 0px rgba(0, 0, 0, 0.15)",
          large: "0px 0px 30px 0px rgba(0, 0, 0, 0.07), 0px 30px 60px 0px rgba(0, 0, 0, 0.2)",
        },
      },
      colors: {
        // Primary - Blue (matches --color-primary: #3b82f6)
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          DEFAULT: "#3b82f6",
          foreground: "#ffffff",
        },
        // Secondary - Gray (matches --color-secondary: #6b7280)
        secondary: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          DEFAULT: "#6b7280",
          foreground: "#ffffff",
        },
        // Success - Green (matches --color-success: #22c55e)
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          DEFAULT: "#22c55e",
          foreground: "#ffffff",
        },
        // Warning - Amber (matches --color-warning: #f59e0b)
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
        },
        // Danger/Error - Red (matches --color-error: #ef4444)
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        // Background and foreground (matches CSS variables)
        background: "#ffffff",
        foreground: "#111827",
        // Content colors
        content1: "#ffffff",
        content2: "#f9fafb",
        content3: "#f3f4f6",
        content4: "#e5e7eb",
        // Focus color
        focus: "#3b82f6",
        // Overlay
        overlay: "rgba(0, 0, 0, 0.4)",
        // Divider
        divider: "rgba(17, 24, 39, 0.15)",
      },
    },
    dark: {
      layout: {
        hoverOpacity: 0.9,
        boxShadow: {
          small: "0px 0px 5px 0px rgba(0, 0, 0, 0.3), 0px 2px 10px 0px rgba(0, 0, 0, 0.4)",
          medium: "0px 0px 15px 0px rgba(0, 0, 0, 0.35), 0px 2px 30px 0px rgba(0, 0, 0, 0.5)",
          large: "0px 0px 30px 0px rgba(0, 0, 0, 0.4), 0px 30px 60px 0px rgba(0, 0, 0, 0.6)",
        },
      },
      colors: {
        // Primary - Blue (same as light theme)
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          DEFAULT: "#3b82f6",
          foreground: "#ffffff",
        },
        // Secondary - Gray (adjusted for dark mode)
        secondary: {
          50: "#111827",
          100: "#1f2937",
          200: "#374151",
          300: "#4b5563",
          400: "#6b7280",
          500: "#9ca3af",
          600: "#d1d5db",
          700: "#e5e7eb",
          800: "#f3f4f6",
          900: "#f9fafb",
          DEFAULT: "#9ca3af",
          foreground: "#111827",
        },
        // Success - Green
        success: {
          50: "#14532d",
          100: "#166534",
          200: "#15803d",
          300: "#16a34a",
          400: "#22c55e",
          500: "#4ade80",
          600: "#86efac",
          700: "#bbf7d0",
          800: "#dcfce7",
          900: "#f0fdf4",
          DEFAULT: "#22c55e",
          foreground: "#ffffff",
        },
        // Warning - Amber
        warning: {
          50: "#78350f",
          100: "#92400e",
          200: "#b45309",
          300: "#d97706",
          400: "#f59e0b",
          500: "#fbbf24",
          600: "#fcd34d",
          700: "#fde68a",
          800: "#fef3c7",
          900: "#fffbeb",
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
        },
        // Danger/Error - Red
        danger: {
          50: "#7f1d1d",
          100: "#991b1b",
          200: "#b91c1c",
          300: "#dc2626",
          400: "#ef4444",
          500: "#f87171",
          600: "#fca5a5",
          700: "#fecaca",
          800: "#fee2e2",
          900: "#fef2f2",
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        // Background and foreground (matches CSS variables for dark mode)
        background: "#111827",
        foreground: "#f9fafb",
        // Content colors (dark mode)
        content1: "#1f2937",
        content2: "#374151",
        content3: "#4b5563",
        content4: "#6b7280",
        // Focus color
        focus: "#3b82f6",
        // Overlay
        overlay: "rgba(0, 0, 0, 0.6)",
        // Divider
        divider: "rgba(249, 250, 251, 0.15)",
      },
    },
  },
});
