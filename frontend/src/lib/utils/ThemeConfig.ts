// Theme configuration for SenseCanvas dashboard
export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
}

const themes: Record<string, Theme> = {
  dark: {
    id: "dark",
    name: "Dark Mode",
    colors: {
      background: "#0f0f0f",
      surface: "#1a1a1a",
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#06b6d4",
      text: "#f8fafc",
      textMuted: "#cbd5e1",
      border: "#374151",
      error: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
    },
  },
  light: {
    id: "light",
    name: "Light Mode",
    colors: {
      background: "#ffffff",
      surface: "#f8fafc",
      primary: "#3b82f6",
      secondary: "#64748b",
      accent: "#06b6d4",
      text: "#1e293b",
      textMuted: "#64748b",
      border: "#e2e8f0",
      error: "#ef4444",
      warning: "#f59e0b",
      success: "#10b981",
    },
  },
  gaming: {
    id: "gaming",
    name: "Gaming",
    colors: {
      background: "#0a0a0a",
      surface: "#1a1a1a",
      primary: "#00ff88",
      secondary: "#ff0088",
      accent: "#00ffff",
      text: "#ffffff",
      textMuted: "#cccccc",
      border: "#333333",
      error: "#ff0040",
      warning: "#ffaa00",
      success: "#00ff88",
    },
  },
  rgb: {
    id: "rgb",
    name: "RGB",
    colors: {
      background: "#000000",
      surface: "#111111",
      primary: "#ff0000",
      secondary: "#00ff00",
      accent: "#0000ff",
      text: "#ffffff",
      textMuted: "#aaaaaa",
      border: "#444444",
      error: "#ff4444",
      warning: "#ffaa44",
      success: "#44ff44",
    },
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    colors: {
      background: "#fafafa",
      surface: "#ffffff",
      primary: "#000000",
      secondary: "#666666",
      accent: "#333333",
      text: "#000000",
      textMuted: "#666666",
      border: "#e0e0e0",
      error: "#cc0000",
      warning: "#ff8800",
      success: "#008800",
    },
  },
};

// Current theme state
let currentTheme: string = "dark";

export const ThemeConfig = {
  // Get theme configuration
  getTheme(themeId: string): Theme {
    return themes[themeId] || themes.dark;
  },

  // Get all available themes
  getThemes(): Theme[] {
    return Object.values(themes);
  },

  // Initialize theme system
  init(): void {
    // Load theme from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sensecanvas-theme");
      if (stored && themes[stored]) {
        currentTheme = stored;
      }
    }

    this.applyTheme(currentTheme);
  },

  // Get current theme ID
  getCurrentTheme(): string {
    return currentTheme;
  },

  // Apply theme to document
  applyTheme(themeId: string): void {
    const theme = this.getTheme(themeId);
    currentTheme = themeId;

    if (typeof window !== "undefined") {
      // Store in localStorage
      localStorage.setItem("sensecanvas-theme", themeId);

      // Apply CSS variables
      const root = document.documentElement;
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });

      // Apply theme class
      document.body.className = document.body.className.replace(
        /theme-\w+/g,
        "",
      );
      document.body.classList.add(`theme-${themeId}`);

      // Dispatch theme change event
      window.dispatchEvent(
        new CustomEvent("themeChanged", {
          detail: { theme: themeId, colors: theme.colors },
        }),
      );
    }
  },

  // Toggle between dark and light themes
  toggleTheme(): void {
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    this.applyTheme(newTheme);
  },

  // Get color value for current theme
  getColor(colorKey: string): string {
    const theme = this.getTheme(currentTheme);
    return (theme.colors as any)[colorKey] || "#ffffff";
  },
};
