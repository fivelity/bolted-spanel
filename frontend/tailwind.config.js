import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}", "./src/app.html"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        orbitron: ["Orbitron", "monospace"],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Consolas",
          "Monaco",
          "Courier New",
          "monospace",
        ],
        sans: [
          "Orbitron",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        // Cosmic UI Primary Colors
        primary: {
          DEFAULT: "rgb(20, 160, 230)",
          50: "#eff8ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#14a0e6", // Main primary
          600: "#1080b8",
          700: "#0c5c84",
          800: "#084050",
          900: "#04201c",
        },
        accent: {
          DEFAULT: "rgb(202, 65, 34)",
          50: "#fef7f3",
          100: "#fdede7",
          200: "#fbdacf",
          300: "#f7c2a7",
          400: "#f2a07f",
          500: "#ca4122", // Main accent
          600: "#a2331b",
          700: "#7a2514",
          800: "#52170e",
          900: "#2a0c07",
        },
        success: {
          DEFAULT: "rgb(20, 184, 166)",
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6", // Main success
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
        // Background system
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      animation: {
        "cosmic-glow": "cosmic-glow 2s ease-in-out infinite",
        "cosmic-scan": "cosmic-scan 3s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        "cosmic-glow": {
          "0%, 100%": {
            filter: "drop-shadow(0 0 5px currentColor)",
            opacity: "1",
          },
          "50%": {
            filter: "drop-shadow(0 0 15px currentColor)",
            opacity: "0.8",
          },
        },
        "cosmic-scan": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100vw)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 5px rgba(20, 160, 230, 0.5)",
            transform: "scale(1)",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(20, 160, 230, 0.8)",
            transform: "scale(1.02)",
          },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [
    forms({
      strategy: "class",
    }),
    typography(),
  ],
};
