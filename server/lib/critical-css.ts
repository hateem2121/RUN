/**
 * Critical CSS Configuration
 * Defines above-the-fold components for critical CSS extraction
 *
 * Phase 2.2: Critical CSS Extraction
 * Target: Inline critical CSS in SSR for <1.8s FCP
 */

/**
 * Components that render above-the-fold on initial page load
 * These should have their CSS inlined for optimal FCP
 */
export const CRITICAL_COMPONENTS = [
  // Navigation - always visible
  "navigation",
  "header",

  // Homepage above-fold
  "hero",
  "homepage-hero",

  // Skeleton loaders (visible during data fetch)
  "skeleton",
  "product-grid-skeleton",

  // Core layout
  "layout",
  "footer",
] as const;

/**
 * CSS files that should always be considered critical
 * These are loaded before any component-specific CSS
 */
export const CRITICAL_CSS_FILES = [
  // Tailwind base styles
  "index.css",

  // Core reset and variables
  "base.css",
] as const;

/**
 * Maximum size for inlined critical CSS (14KB recommended)
 * Exceeding this may hurt FCP due to HTML parsing time
 */
export const CRITICAL_CSS_MAX_BYTES = 14 * 1024; // 14KB

/**
 * CSS that should be deferred (loaded after initial render)
 * These patterns will be loaded with `media="print" onload="this.media='all'"`
 */
export const DEFERRED_CSS_PATTERNS = [
  // Admin-only styles
  /admin/i,
  /dashboard/i,

  // Heavy animation libraries
  /animation/i,
  /framer/i,

  // Chart and visualization
  /chart/i,
  /recharts/i,
] as const;

export type CriticalComponent = (typeof CRITICAL_COMPONENTS)[number];
export type CriticalCSSFile = (typeof CRITICAL_CSS_FILES)[number];
