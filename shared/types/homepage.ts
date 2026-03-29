/**
 * Homepage-specific type definitions
 * Extends base schema types with frontend-specific interfaces
 */

import type {
  HomepageFeaturedProductsSettings,
  HomepageHero,
  HomepageSection,
  HomepageSlogan,
} from "../schemas/content/home";

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

/**
 * Common wrapper for results fetched with a server timestamp
 */
export interface DataWithTimestamp<T> {
  result: T;
  timestamp: string;
}

/**
 * Visitor-facing product item (simplified for marquee/grid)
 */
export interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  image: string;
}

/**
 * Visitor-facing category item
 */
export interface CategoryItem {
  id: string;
  name: string;
  image: string;
}

/**
 * Visitor-facing process step
 */
export interface ProcessStep {
  id: string;
  title: string;
  description: string;
  image: string;
}

/**
 * Aliases for compatibility with legacy frontend types
 */
export type HeroData = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
};

export type HomepageSloganItem = HomepageSlogan;
export type HomepageSectionItem = HomepageSection;
export type HomepageFeaturedSettings = HomepageFeaturedProductsSettings;

/**
 * Canonical Homepage Batch API Response
 * Used by both visitor hooks and admin hooks
 */
export interface HomepageBatchResponse {
  hero: DataWithTimestamp<HomepageHero | undefined>;
  slogans: DataWithTimestamp<HomepageSloganItem[]>;
  sections: DataWithTimestamp<HomepageSectionItem[]>;
  featuredProductsSettings: DataWithTimestamp<HomepageFeaturedSettings | undefined>;
  products: DataWithTimestamp<ProductItem[]>;
  categories: DataWithTimestamp<CategoryItem[]>;
  processCards: DataWithTimestamp<ProcessStep[]>;
}
