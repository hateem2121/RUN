/**
 * PHASE 3.1: Unified Validation System
 * Consolidates all validation functionality across the platform
 */

import { z } from "zod";

// Unified validation result interface (consolidates multiple similar interfaces)
export interface UnifiedValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  fieldErrors?: Record<string, string>;
  performance?: {
    validationTime?: number;
    cacheTime?: number;
    operationTime?: number;
  };
}

// Validation configuration for different contexts
export interface ValidationConfig {
  criticalFields: string[];
  validateOnBlur: boolean;
  validateOnSubmit: boolean;
  cacheResults: boolean;
  performanceTracking: boolean;
}

// Default configurations for different validation contexts
export const ValidationConfigs = {
  MEDIA: {
    criticalFields: ["filename", "type", "size"],
    validateOnBlur: false,
    validateOnSubmit: true,
    cacheResults: true,
    performanceTracking: true,
  } as ValidationConfig,

  CACHE: {
    criticalFields: ["queryKey", "data"],
    validateOnBlur: false,
    validateOnSubmit: false,
    cacheResults: false,
    performanceTracking: true,
  } as ValidationConfig,

  PRODUCT: {
    criticalFields: ["name", "sku"],
    validateOnBlur: true,
    validateOnSubmit: true,
    cacheResults: true,
    performanceTracking: false,
  } as ValidationConfig,
};

/**
 * Unified Validation System - Single point for all validation
 * Replaces multiple validation classes with unified approach
 */
export class UnifiedValidationSystem {
  private static instance: UnifiedValidationSystem;
  private validationCache = new Map<string, UnifiedValidationResult>();

  static getInstance(): UnifiedValidationSystem {
    if (!UnifiedValidationSystem.instance) {
      UnifiedValidationSystem.instance = new UnifiedValidationSystem();
    }
    return UnifiedValidationSystem.instance;
  }

  /**
   * Generic validation method that can handle any validation context
   */
  async validate<T>(
    data: T,
    schema: z.ZodSchema<T>,
    config: ValidationConfig = ValidationConfigs.PRODUCT,
    context: string = "generic",
  ): Promise<UnifiedValidationResult> {
    const startTime = Date.now();

    const result: UnifiedValidationResult = {
      success: true,
      errors: [],
      warnings: [],
      fieldErrors: {},
      performance: {},
    };

    try {
      // Check cache if enabled
      const cacheKey = `${context}:${JSON.stringify(data)}`;
      if (config.cacheResults && this.validationCache.has(cacheKey)) {
        const cached = this.validationCache.get(cacheKey)!;
        if (config.performanceTracking) {
          cached.performance!.cacheTime = Date.now() - startTime;
        }
        return cached;
      }

      // Perform schema validation
      const schemaResult = schema.safeParse(data);
      if (!schemaResult.success) {
        result.success = false;
        result.errors.push("Schema validation failed");
        schemaResult.error.issues.forEach((error) => {
          const fieldPath = error.path.join(".");
          result.fieldErrors![fieldPath] = error.message;
        });
      }

      // Perform field-specific validation for critical fields
      if (data && typeof data === "object") {
        for (const field of config.criticalFields) {
          const value = (data as Record<string, unknown>)[field];
          const fieldError = this.validateField(field, value, context);
          if (fieldError) {
            result.fieldErrors![field] = fieldError;
            result.success = false;
          }
        }
      }

      // Performance tracking
      if (config.performanceTracking) {
        result.performance!.validationTime = Date.now() - startTime;
      }

      // Cache result if enabled
      if (config.cacheResults) {
        this.validationCache.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(
        `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return result;
    }
  }

  /**
   * Field-specific validation rules (consolidated from multiple files)
   */
  private validateField(field: string, value: unknown, context: string): string | null {
    // Media validation rules
    if (context === "media") {
      switch (field) {
        case "filename":
          if (!value || typeof value !== "string") {
            return "Filename is required";
          }
          if (value.length > 255) {
            return "Filename too long";
          }
          return null;
        case "type":
          if (!value) {
            return "File type is required";
          }
          return null;
        case "size":
          if (!value || typeof value !== "number" || value <= 0) {
            return "File size must be positive";
          }
          if (value > 10 * 1024 * 1024) {
            return "File size cannot exceed 10MB";
          }
          return null;
      }
    }

    // Product validation rules (from useSmartValidation)
    if (context === "product") {
      switch (field) {
        case "name":
          if (!value || typeof value !== "string" || value.trim().length === 0) {
            return "Product name is required";
          }
          if (value.length < 3) {
            return "Product name must be at least 3 characters";
          }
          if (value.length > 100) {
            return "Product name must be less than 100 characters";
          }
          return null;
        case "sku":
          if (!value || typeof value !== "string" || value.trim().length === 0) {
            return "SKU is required";
          }
          if (!/^[A-Z0-9_-]+$/i.test(value)) {
            return "SKU can only contain letters, numbers, hyphens and underscores";
          }
          if (value.length > 50) {
            return "SKU must be less than 50 characters";
          }
          return null;
      }
    }

    // Cache validation rules
    if (context === "cache") {
      switch (field) {
        case "queryKey":
          if (!value || typeof value !== "string") {
            return "Query key is required";
          }
          return null;
        case "data":
          if (value === undefined) {
            return "Data cannot be undefined";
          }
          return null;
      }
    }

    return null;
  }

  /**
   * Validate multiple items in batch (performance optimization)
   */
  async validateBatch<T>(
    items: T[],
    schema: z.ZodSchema<T>,
    config: ValidationConfig = ValidationConfigs.PRODUCT,
    context: string = "batch",
  ): Promise<UnifiedValidationResult[]> {
    return Promise.all(
      items.map((item) => this.validate(item, schema, config, `${context}:${items.indexOf(item)}`)),
    );
  }

  /**
   * Clear validation cache (useful for testing)
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.validationCache.size,
      keys: Array.from(this.validationCache.keys()),
    };
  }
}

// Export singleton instance for easy usage
export const unifiedValidator = UnifiedValidationSystem.getInstance();

// Export commonly used schemas (consolidated from media-api-schemas.ts)
export const UnifiedSchemas = {
  MediaAsset: z.object({
    id: z.number(),
    filename: z.string(),
    originalName: z.string(),
    size: z.number(),
    type: z.string(),
    mimeType: z.string(),
    url: z.string().nullable(),
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.string(), z.any()).default({}),
    createdAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
    updatedAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
    isActive: z.boolean().optional(),
  }),

  Product: z.object({
    id: z.number().optional(),
    name: z.string().min(3).max(100),
    sku: z.string().min(1).max(50),
    description: z.string().max(5000).optional(),
    minimumOrderQuantity: z.number().min(1).optional(),
    leadTime: z.string().max(100).optional(),
  }),

  CacheItem: z.object({
    queryKey: z.string(),
    data: z.any(),
    lastFetch: z.number(),
    isStale: z.boolean(),
  }),
};
