/**
 * Utility functions for responsive grid system
 */

export interface ResponsiveSpanConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

export const DEFAULT_CARD_SPANS = {
  card1: { mobile: 1, tablet: 2, desktop: 1 }, // Featured card, single column on desktop
  card2: { mobile: 1, tablet: 1, desktop: 1 }, // Compact card
  card3: { mobile: 1, tablet: 1, desktop: 1 }, // Compact card
  card4: { mobile: 1, tablet: 2, desktop: 2 }, // Wide card, spans 2 columns on desktop
};

/**
 * Generate responsive column span classes
 */
export function getResponsiveSpanClasses(cardType: keyof typeof DEFAULT_CARD_SPANS): string {
  const spans = DEFAULT_CARD_SPANS[cardType] || DEFAULT_CARD_SPANS.card2;

  return [
    `col-span-${spans.mobile}`,           // Mobile
    `md:col-span-${spans.tablet}`,        // Tablet
    `lg:col-span-${spans.desktop}`,       // Desktop
  ].join(' ');
}

/**
 * Generate responsive grid template columns
 */
export function getGridTemplateColumns(breakpoint: 'mobile' | 'tablet' | 'desktop'): string {
  const columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  };

  return `repeat(${columns[breakpoint]}, 1fr)`;
}

/**
 * Dynamic height system with content-aware constraints
 */
export const RESPONSIVE_HEIGHTS = {
  mobile: { min: '250px', max: '400px', ratio: '4:3' },
  tablet: { min: '300px', max: '450px', ratio: '3:2' },
  desktop: { min: '320px', max: '500px', ratio: '16:10' }
} as const;

/**
 * Card height constraints for consistent sizing
 */
export const CARD_HEIGHT_CONSTRAINTS = {
  minHeight: '320px',
  maxHeight: '500px',
  height: 'auto',
} as const;

/**
 * Enhanced responsive breakpoints for consistency
 */
export const BREAKPOINTS = {
  mobile: '360px',
  tablet: '768px',
  desktop: '1024px',
  large: '1440px',
} as const;

/**
 * Utility function to get responsive height styles
 */
export function getResponsiveHeightStyles(breakpoint: 'mobile' | 'tablet' | 'desktop'): string {
  const height = RESPONSIVE_HEIGHTS[breakpoint];
  return `min-height: ${height.min}; max-height: ${height.max}; height: auto;`;
}