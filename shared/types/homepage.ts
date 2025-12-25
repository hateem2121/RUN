/**
 * Homepage-specific type definitions
 * Extends base schema types with frontend-specific interfaces
 */

/**
 * Sustainability section data structure
 * Used in homepageSections.data field for sustainability section
 */
export interface SustainabilitySectionData {
  primaryCta?: {
    text?: string;
    link?: string;
  };
  secondaryCta?: {
    text?: string;
    link?: string;
  };
  newsletter?: {
    title?: string;
    description?: string;
    buttonText?: string;
  };
}

/**
 * Media item for product galleries
 */
export interface ProductMediaItem {
  id: number;
  url: string;
  type: "image" | "video";
  alt: string;
}
