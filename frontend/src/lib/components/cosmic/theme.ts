// Cosmic UI Theme Configuration for SenseCanvas
// SVG-first design system with sci-fi aesthetic

export const cosmicColors = {
  primary: "rgb(20, 160, 230)",
  primaryForeground: "rgb(255, 255, 255)",
  accent: "rgb(202, 65, 34)",
  accentForeground: "rgb(255, 255, 255)",
  secondary: "color-mix(in oklab, var(--color-primary), white 50%)",
  success: "rgb(20, 184, 166)",
  background: "color-mix(in oklab, var(--color-primary), black 80%)",
  foreground: "white",

  // Frame-specific colors
  frame1Stroke: "var(--color-primary)",
  frame1Fill: "transparent",
  frame2Stroke: "var(--color-accent)",
  frame2Fill: "rgba(202, 65, 34, 0.1)",
  frame3Stroke: "var(--color-success)",
  frame3Fill: "transparent",
  frame4Stroke: "var(--color-primary)",
  frame4Fill: "rgba(20, 160, 230, 0.05)",
  frame5Stroke: "rgba(255, 255, 255, 0.3)",
  frame5Fill: "rgba(255, 255, 255, 0.02)",
} as const;

export const cosmicSizes = {
  xs: "12px",
  sm: "14px",
  md: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "30px",
  "4xl": "36px",
} as const;

export const cosmicSpacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  "3xl": "64px",
  "4xl": "96px",
} as const;

// CSS Custom Properties for Cosmic UI
export function injectCosmicTheme() {
  const root = document.documentElement;

  // Set CSS custom properties
  root.style.setProperty("--color-primary", cosmicColors.primary);
  root.style.setProperty(
    "--color-primary-foreground",
    cosmicColors.primaryForeground,
  );
  root.style.setProperty("--color-accent", cosmicColors.accent);
  root.style.setProperty(
    "--color-accent-foreground",
    cosmicColors.accentForeground,
  );
  root.style.setProperty("--color-secondary", cosmicColors.secondary);
  root.style.setProperty("--color-success", cosmicColors.success);
  root.style.setProperty("--color-background", cosmicColors.background);
  root.style.setProperty("--color-foreground", cosmicColors.foreground);

  // Frame colors
  root.style.setProperty("--color-frame-1-stroke", cosmicColors.frame1Stroke);
  root.style.setProperty("--color-frame-1-fill", cosmicColors.frame1Fill);
  root.style.setProperty("--color-frame-2-stroke", cosmicColors.frame2Stroke);
  root.style.setProperty("--color-frame-2-fill", cosmicColors.frame2Fill);
  root.style.setProperty("--color-frame-3-stroke", cosmicColors.frame3Stroke);
  root.style.setProperty("--color-frame-3-fill", cosmicColors.frame3Fill);
  root.style.setProperty("--color-frame-4-stroke", cosmicColors.frame4Stroke);
  root.style.setProperty("--color-frame-4-fill", cosmicColors.frame4Fill);
  root.style.setProperty("--color-frame-5-stroke", cosmicColors.frame5Stroke);
  root.style.setProperty("--color-frame-5-fill", cosmicColors.frame5Fill);
}

// Helper function to create mutable path data
function createPathData(
  show: boolean,
  strokeWidth: string,
  stroke: string,
  fill: string,
  path: string[][],
) {
  return {
    show,
    style: {
      strokeWidth,
      stroke,
      fill,
    },
    path,
  };
}

// Default frame paths for different component types
export const defaultFramePaths = {
  // Standard rectangular frame with clipped corners
  standard: [
    createPathData(
      true,
      "2",
      "var(--color-frame-1-stroke)",
      "var(--color-frame-1-fill)",
      [
        ["M", "15", "15"],
        ["L", "85%", "15"],
        ["L", "100% - 15", "30"],
        ["L", "100% - 15", "85%"],
        ["L", "85%", "100% - 15"],
        ["L", "15", "100% - 15"],
        ["L", "15", "15"],
      ],
    ),
  ],

  // Highlighted frame for active states
  highlighted: [
    createPathData(
      true,
      "2",
      "var(--color-frame-2-stroke)",
      "var(--color-frame-2-fill)",
      [
        ["M", "10", "10"],
        ["L", "90%", "10"],
        ["L", "100% - 10", "25"],
        ["L", "100% - 10", "90%"],
        ["L", "90%", "100% - 10"],
        ["L", "10", "100% - 10"],
        ["L", "10", "10"],
      ],
    ),
  ],

  // Panel frame with inner glow
  panel: [
    createPathData(
      true,
      "1",
      "var(--color-frame-5-stroke)",
      "var(--color-frame-5-fill)",
      [
        ["M", "20", "20"],
        ["L", "80%", "20"],
        ["L", "100% - 20", "35"],
        ["L", "100% - 20", "80%"],
        ["L", "80%", "100% - 20"],
        ["L", "20", "100% - 20"],
        ["L", "20", "20"],
      ],
    ),
  ],
};
