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
  brandPurple: "var(--color-primary)",
  brandPurpleLight: "var(--color-brand-purple-light)",
  surfaceDark: "var(--color-surface-dark)",
  surfaceLight: "var(--color-surface-light)",
  surfaceGray: "var(--color-surface-gray)",

  // Accent Colors
  accent: "var(--color-accent)",
  accentForeground: "var(--color-accent-foreground)",
  brandAccent: "var(--color-brand-accent)",

  // Semantic Colors
  destructive: "var(--color-destructive)",
  destructiveForeground: "var(--color-destructive-foreground)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",

  // Neutrals
  background: "var(--color-background)",
  backgroundAlt: "var(--color-background-alt)",
  surfaceBlack: "var(--color-surface-black)",
  foreground: "var(--color-foreground)",
  card: "var(--color-card)",
  cardForeground: "var(--color-card-foreground)",
  muted: "var(--color-muted)",
  mutedForeground: "var(--color-muted-foreground)",
  border: "var(--color-border)",
  input: "var(--color-input)",
  ring: "var(--color-ring)",

  // Brand Accents
  brandLime: "var(--color-brand-lime)",
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
 * Height tokens from @theme
 */
export const heights = {
  modalSm: "var(--height-modal-sm)",
  modalMd: "var(--height-modal-md)",
  modalLg: "var(--height-modal-lg)",
  modalFull: "var(--height-modal-full)",
  thumbnail: "var(--height-thumbnail)",
  thumbnailLg: "var(--height-thumbnail-lg)",
  tab: "var(--height-tab)",
  iconSm: "var(--height-icon-sm)",
  loadingCenter: "var(--height-loading-center)",
  loadingContent: "var(--height-loading-content)",
  minValueCard: "var(--min-height-value-card)",
  minProcessCard: "var(--min-height-process-card)",
} as const;

/**
 * Width tokens from @theme
 */
export const widths = {
  sheetSm: "var(--width-sheet-sm)",
  sheetMd: "var(--width-sheet-md)",
  sheetLg: "var(--width-sheet-lg)",
  sidebarCollapsed: "var(--width-sidebar-collapsed)",
  sidebarExpanded: "var(--width-sidebar-expanded)",
  maxToast: "var(--max-width-toast)",
  iconSm: "var(--width-icon-sm)",
  minThumbnail: "var(--min-width-thumbnail)",
  minLabel: "var(--min-width-label)",
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
  button: "var(--radius-button)",
  card: "var(--radius-card)",
  modal: "var(--radius-modal)",
  pill: "var(--radius-pill)",
} as const;

/**
 * Display font size tokens for hero/heading typography
 */
export const fontSizes = {
  displayXs: "var(--font-size-display-xs)",
  displaySm: "var(--font-size-display-sm)",
  displayMd: "var(--font-size-display-md)",
  displayLg: "var(--font-size-display-lg)",
  displayXl: "var(--font-size-display-xl)",
} as const;

/**
 * Shadow tokens for consistent elevation
 */
export const shadows = {
  card: "var(--shadow-card)",
  popup: "var(--shadow-popup)",
  glass: "var(--shadow-glass)",
} as const;

/**
 * Typography tokens
 */
export const fonts = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
} as const;

/**
 * Breakpoint tokens
 * Matches Tailwind standard breakpoints
 */
export const breakpoints = {
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// Type exports for strict type checking
export type ColorToken = keyof typeof colors;
export type ZIndexToken = keyof typeof zIndex;
export type SpacingToken = keyof typeof spacing;
export type HeightToken = keyof typeof heights;
export type WidthToken = keyof typeof widths;
export type RadiusToken = keyof typeof radius;
export type FontToken = keyof typeof fonts;
export type FontSizeToken = keyof typeof fontSizes;
export type ShadowToken = keyof typeof shadows;

/**
 * Helper to get CSS variable value at runtime.
 * Handles both plain variable names (--color-primary) and var() wrappers.
 */
export function getCssVar(name: string): string {
  if (typeof window === "undefined") return "";
  const cleanName = name
    .replace(/^var\(/, "")
    .replace(/\)$/, "")
    .trim();
  return getComputedStyle(document.documentElement).getPropertyValue(cleanName).trim();
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
  {
    hex: "#CCFF00",
    replacement: "brandLime",
    files: ["Footer.tsx", "Categories.tsx"],
  },
  {
    hex: "#10b981",
    replacement: "success",
    files: ["circular-progress-stat-optimized.tsx"],
  },
] as const;
