/**
 * Shared types for admin products unified system
 */
import type { MediaAsset } from "@shared/index";

// =============================================================================
// FABRIC & COMPOSITION TYPES
// =============================================================================

/**
 * Fiber composition item - represents a single fiber in a composition
 */
export interface FiberCompositionItem {
  fiberId: number;
  percentage: number;
}

/**
 * Fabric composition - represents a complete fiber composition
 */
export interface FabricComposition {
  name: string;
  isDefault?: boolean;
  fibers: FiberCompositionItem[];
}

/**
 * Extended fabric type with compositions
 */
export interface FabricWithCompositions {
  id: number;
  name: string;
  description?: string | null;
  compositions?: FabricComposition[];
  [key: string]: unknown;
}

// =============================================================================
// PRODUCT FORM FIELD VALUE TYPES
// =============================================================================

/**
 * Technical specifications - key-value pairs for product specs
 */
export type TechnicalSpecs = Record<string, string>;

/**
 * Customization option - structured customization data
 */
export interface CustomizationOption {
  name?: string;
  value?: string;
  [key: string]: unknown;
}

/**
 * Union type for all possible product form field values
 * This replaces 'any' types in onInputChange handlers
 */
export type ProductFormFieldValue =
  | string
  | number
  | boolean
  | null
  | number[]
  | string[]
  | TechnicalSpecs
  | CustomizationOption[]
  | Record<string, unknown>;

// =============================================================================
// MEDIA TYPES
// =============================================================================

// Media grid component props
export interface MediaGridBaseProps {
  mediaAssets: MediaAsset[];
  onOrderChange?: (reorderedAssets: MediaAsset[]) => void;
  className?: string;
  gridCols?: "auto" | 2 | 3 | 4 | 5 | 6;
  itemSize?: "sm" | "md" | "lg" | "xl";
  showTypeBadges?: boolean;
  draggable?: boolean;
}

// Media removal handler type
export type MediaRemovalHandler = (mediaType: string, mediaId: number) => void;

// Media field types for the picker
export type MediaFieldType = "images" | "videos" | "primaryImage" | "primaryVideo" | "model";

// Media picker handler
export type MediaSelectHandler = (mediaIds: number[]) => void;

// Form data structure for media assets section
export interface MediaAssetsFormData {
  primaryImageId: number | null;
  primaryVideoId: number | null;
  imageIds: number[];
  videos: number[];
  modelFileId: number | null;
}
