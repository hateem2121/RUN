/**
 * Homepage Constants
 * Shared constants for homepage section names and identifiers
 */

export const SECTION_NAMES = {
  MANUFACTURING: 'manufacturing',
  PRODUCTS: 'products',
  SUSTAINABILITY: 'sustainability',
} as const;

export type SectionName = typeof SECTION_NAMES[keyof typeof SECTION_NAMES];
