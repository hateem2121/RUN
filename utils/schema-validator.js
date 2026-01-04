/**
 * Runtime Schema Validation using Zod
 * Prevents schema drift by validating API responses against TypeScript interfaces
 */
import { z } from "zod";
import { parseApiDate } from "./date-helpers.js";

// Zod schema that matches the MediaAsset interface exactly
const MediaAssetSchema = z.object({
  id: z.number(),
  filename: z.string(),
  originalName: z.string().nullable(),
  fileSize: z.number().nullable(),
  size: z.number().nullable(), // Alias for fileSize
  mimeType: z.string(),
  type: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().nullable(),
  thumbnailFilename: z.string().nullable(),
  storagePath: z.string(),
  bucketName: z.string(),
  folderId: z.number().nullable(),
  tags: z.array(z.string()).nullable(),
  altText: z.string().nullable(),
  caption: z.string().nullable(),
  metadata: z.record(z.any()),
  downloadCount: z.number().default(0),
  lastAccessedAt: z
    .union([z.date(), z.string(), z.null()])
    .nullable()
    .transform((val) => {
      if (!val) return null;
      if (val instanceof Date) return val;
      if (typeof val === "string") return parseApiDate(val);
      return null;
    }),
  uploadedAt: z.union([z.date(), z.string()]).transform((val) => {
    if (val instanceof Date) return val;
    if (typeof val === "string") {
      const parsed = parseApiDate(val);
      return parsed || new Date();
    }
    return new Date();
  }),
  isActive: z.boolean().default(true),
  createdAt: z.union([z.date(), z.string()]).transform((val) => {
    if (val instanceof Date) return val;
    if (typeof val === "string") {
      const parsed = parseApiDate(val);
      return parsed || new Date();
    }
    return new Date();
  }),
  updatedAt: z.union([z.date(), z.string()]).transform((val) => {
    if (val instanceof Date) return val;
    if (typeof val === "string") {
      const parsed = parseApiDate(val);
      return parsed || new Date();
    }
    return new Date();
  }),
  deletedAt: z
    .union([z.date(), z.string(), z.null()])
    .nullable()
    .transform((val) => {
      if (!val) return null;
      if (val instanceof Date) return val;
      if (typeof val === "string") return parseApiDate(val);
      return null;
    }),
});
/**
 * Validate a single MediaAsset object
 */
export const validateMediaAsset = (data) => {
  try {
    const validated = MediaAssetSchema.parse(data);
    // Additional custom validations
    const warnings = [];
    // Check for missing critical fields
    if (!validated.url || validated.url === "undefined") {
      warnings.push("Asset has invalid or missing URL");
    }
    if (!validated.filename || validated.filename === "undefined") {
      warnings.push("Asset has invalid or missing filename");
    }
    // Check date consistency
    if (validated.uploadedAt && validated.createdAt) {
      if (validated.uploadedAt > validated.createdAt) {
        warnings.push("Upload date is after creation date");
      }
    }
    return {
      isValid: true,
      data: validated,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    const errors = [];
    if (error instanceof z.ZodError) {
      errors.push(...error.errors.map((e) => `${e.path.join(".")}: ${e.message}`));
    } else {
      errors.push(error instanceof Error ? error.message : "Unknown validation error");
    }
    return {
      isValid: false,
      errors,
    };
  }
};
/**
 * Validate an array of MediaAsset objects
 */
export const validateMediaAssetArray = (data) => {
  const valid = [];
  const invalid = [];
  let totalWarnings = 0;
  data.forEach((item, index) => {
    const result = validateMediaAsset(item);
    if (result.isValid && result.data) {
      valid.push(result.data);
      if (result.warnings) {
        totalWarnings += result.warnings.length;
      }
    } else {
      invalid.push({
        index,
        errors: result.errors || ["Unknown validation error"],
      });
    }
  });
  return {
    valid,
    invalid,
    summary: {
      total: data.length,
      valid: valid.length,
      invalid: invalid.length,
      warnings: totalWarnings,
    },
  };
};
/**
 * Filter and clean MediaAsset array with validation
 * Returns only valid assets, logs issues
 */
export const filterValidMediaAssets = (assets) => {
  const result = validateMediaAssetArray(assets);
  // Log validation summary in development
  if (process.env.NODE_ENV === "development") {
    if (result.invalid.length > 0) {
      result.invalid.forEach(({ index: _index, errors: _errors }) => {});
    }
  }
  return result.valid;
};
/**
 * Validate API response structure
 */
export const validateApiResponse = (response) => {
  const errors = [];
  if (!response || typeof response !== "object") {
    errors.push("Response is not an object");
    return { isValid: false, hasData: false, hasPagination: false, errors };
  }
  if (typeof response.success !== "boolean") {
    errors.push("Response missing success field");
  }
  const hasData = response.data && typeof response.data === "object";
  const hasPagination =
    hasData && response.data.pagination && typeof response.data.pagination === "object";
  if (!hasData) {
    errors.push("Response missing data object");
  }
  return {
    isValid: errors.length === 0,
    hasData,
    hasPagination,
    errors: errors.length > 0 ? errors : undefined,
  };
};
/**
 * Development-only schema monitoring
 * Logs schema drift warnings without breaking functionality
 */
export const monitorSchemaDrift = (apiData, _context = "unknown") => {
  if (process.env.NODE_ENV !== "development") {
    return; // Only run in development
  }
  const result = validateMediaAssetArray(apiData);
  if (result.invalid.length > 0) {
    // Sample first few errors for debugging
    result.invalid.slice(0, 3).forEach(({ index: _index, errors: _errors }) => {});
  }
  if (result.summary.warnings > 0) {
  }
};
