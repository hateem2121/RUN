/**
 * Runtime Schema Validation using Zod
 * Prevents schema drift by validating API responses against TypeScript interfaces
 */
import type { MediaAsset } from "../shared/schema.js";
import type { SchemaValidationResult } from "./types/validation.js";
/**
 * Validate a single MediaAsset object
 */
export declare const validateMediaAsset: (data: unknown) => SchemaValidationResult;
/**
 * Validate an array of MediaAsset objects
 */
export declare const validateMediaAssetArray: (data: unknown[]) => {
  valid: MediaAsset[];
  invalid: Array<{
    index: number;
    errors: string[];
  }>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
  };
};
/**
 * Filter and clean MediaAsset array with validation
 * Returns only valid assets, logs issues
 */
export declare const filterValidMediaAssets: (assets: unknown[]) => MediaAsset[];
/**
 * Validate API response structure
 */
export declare const validateApiResponse: (response: unknown) => {
  isValid: boolean;
  hasData: boolean;
  hasPagination: boolean;
  errors?: string[];
};
/**
 * Development-only schema monitoring
 * Logs schema drift warnings without breaking functionality
 */
export declare const monitorSchemaDrift: (apiData: unknown[], context?: string) => void;
//# sourceMappingURL=schema-validator.d.ts.map
