/**
 * Design Token Utilities
 * Phase 3.3: Design Token Consolidation
 *
 * Provides type-safe access to CSS design tokens defined in index.css @theme block.
 * Use these instead of hardcoded hex values for consistency.
 */

/**
 * Color tokens from @theme
 * Reference: client/src/index.css
 */
export const colors = {
  // Brand Colors
  primary: "var(--color-primary)",
  primaryForeground: "var(--color-primary-foreground)",
  secondary: "var(--color-secondary)",
  secondaryForeground: "var(--color-secondary-foreground)",

  // Brand Accent (Purple)
  brandPurple: "var(--color-brand-purple)",
  brandPurpleLight: "var(--color-brand-purple-light)",

  // Accent Colors
  accent: "var(--color-accent)",
  accentForeground: "var(--color-accent-foreground)",

  // Semantic Colors
  destructive: "var(--color-destructive)",
  destructiveForeground: "var(--color-destructive-foreground)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",

  // Neutrals
  background: "var(--color-background)",
  foreground: "var(--color-foreground)",
  card: "var(--color-card)",
  cardForeground: "var(--color-card-foreground)",
  muted: "var(--color-muted)",
  mutedForeground: "var(--color-muted-foreground)",
  border: "var(--color-border)",
  input: "var(--color-input)",
  ring: "var(--color-ring)",
} as const;

/**
 * Z-Index tokens from @theme
 * Use these instead of magic numbers for predictable stacking
 */
export const zIndex = {
  /** Behind everything - negative z-index */
  behind: "var(--z-behind)",
  /** Default layer (0) */
  base: "var(--z-base)",
  /** General content layer (1) */
  default: "var(--z-default)",
  /** Slightly raised content */
  elevated: "var(--z-elevated)",
  /** Dropdown menus, tooltips */
  dropdown: "var(--z-dropdown)",
  /** Sticky elements like headers */
  sticky: "var(--z-sticky)",
  /** Floating dock/navigation */
  dock: "var(--z-dock)",
  /** Modal backdrop */
  modalBackdrop: "var(--z-modal-backdrop)",
  /** Modal content */
  modal: "var(--z-modal)",
  /** Nested dialog support */
  modalNested: "var(--z-modal-nested)",
  /** Popover tooltips */
  popover: "var(--z-popover)",
  /** Toast notifications */
  toast: "var(--z-toast)",
  /** Custom cursor layer */
  cursor: "var(--z-cursor)",
  /** Maximum z-index (emergency only) */
  max: "var(--z-max)",
} as const;

/**
 * Spacing tokens from @theme
 */
export const spacing = {
  container: "var(--spacing-container)",
} as const;

/**
 * Radius tokens from @theme
 */
export const radius = {
  sm: "var(--radius-sm)",
  default: "var(--radius)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  full: "9999px",
} as const;

/**
 * Typography tokens
 */
export const fonts = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
} as const;

// Type exports for strict type checking
export type ColorToken = keyof typeof colors;
export type ZIndexToken = keyof typeof zIndex;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type FontToken = keyof typeof fonts;

/**
 * Helper to get CSS variable value at runtime
 */
export function getCssVar(name: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Hardcoded colors that should be migrated to tokens
 * Use this list to track migration progress
 *
 * @deprecated Remove entries as they are migrated
 */
export const HARDCODED_COLORS_TO_MIGRATE = [
  {
    hex: "#5227FF",
    replacement: "brandPurple",
    files: ["GradientBlinds.tsx", "TechnologyGradientSettings.tsx"],
  },
  {
    hex: "#FF9FFC",
    replacement: "brandPurpleLight",
    files: ["GradientBlinds.tsx", "TechnologyGradientSettings.tsx"],
  },
  { hex: "#3300FF", replacement: "brandPurple", files: ["homepage-v2/*.tsx", "CustomCursor.tsx"] },
  { hex: "#CCFF00", replacement: "--color-success (new)", files: ["Footer.tsx", "Categories.tsx"] },
  { hex: "#050505", replacement: "--color-surface-dark (new)", files: ["homepage-v2/*.tsx"] },
  { hex: "#FAFAFA", replacement: "background", files: ["homepage-v2/*.tsx"] },
  { hex: "#10b981", replacement: "success", files: ["circular-progress-stat-optimized.tsx"] },
] as const;
