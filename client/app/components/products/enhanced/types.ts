import type { Certificate, Fabric, Product, SizeChart } from "@shared/index";

// ============================================================================
// Hydrated Interfaces (Frontend-specific)
// These extend the DB schemas to include runtime data structures like JSONB parsing
// ============================================================================

export interface HydratedFabric extends Omit<Fabric, "properties"> {
  properties?: {
    performanceFeatures?: string[];
    compositions?: Array<{
      name: string;
      isDefault: boolean;
      fibers: Array<{
        fiberId: number | null;
        percentage: string;
      }>;
    }>;
    [key: string]: unknown; // Allow other properties but type known ones
  };
}

export interface HydratedProduct
  extends Omit<
    Product,
    | "specifications"
    | "careInstructions"
    | "technicalSpecs"
    | "tags"
    | "minimumOrderQuantity"
    | "leadTime"
    | "customWeight"
    | "customFit"
  > {
  specifications?: string[];
  careInstructions?: string[];
  technicalSpecs?: Record<string, string | number | boolean | string[]>;
  tags?: string[];

  // Hydrated Relations (optional because they might not always be fetched)
  fabric?: HydratedFabric | null;
  sizeChart?: SizeChart | null;
  certificates?: Certificate[];

  // Custom customizations often used in frontend
  customFit?: string | null;
  customWeight?: string | null;
  leadTime?: string | null;
  minimumOrderQuantity?: number | null;
}

export interface HydratedSizeChart extends Omit<SizeChart, "measurements"> {
  measurements?: Record<string, Record<string, string>>;
}

// Media Types
export const MediaType = {
  Image: "image",
  Video: "video",
  Model3D: "3d_model",
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export interface MediaItem {
  id: number;
  type: MediaType;
  src: string;
  thumbnail: string;
  filename?: string | undefined;
  mimeType?: string | undefined;
}

// Component Props Interfaces
export interface TabbedDetailsProps {
  product: HydratedProduct;
  certificates: Certificate[];
}

export interface FabricDisplayProps {
  fabric: HydratedFabric | null;
  fibers?: Array<{ id: number; name: string }>; // Typed based on common usage
}

export interface SizeChartDisplayProps {
  sizeChart: HydratedSizeChart | null;
}
