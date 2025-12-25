/**
 * CONSOLIDATED UTILITIES
 * Essential utility functions extracted from archived files
 * Single source of truth for common utilities across the application
 */

import { logger } from "./lib/smart-logger.js";
// import { z } from "zod";

// ============================================================================
// SAFE ID PARSING UTILITIES
// ============================================================================

export interface SafeIdResult {
  isValid: boolean;
  id?: number;
  error?: string;
  originalValue?: string;
  context?: string;
}

/**
 * Safely parses a string parameter to an integer with comprehensive validation
 */
export function safeParseId(
  param: string | undefined,
  context: string = "entity",
  requestInfo?: { method?: string; url?: string; userAgent?: string },
): SafeIdResult {
  const debugInfo = requestInfo ? ` [${requestInfo.method} ${requestInfo.url}]` : "";

  if (!param) {
    const error = `Missing ${context} ID parameter`;
    logger.warn(`[SafeIdParser]${debugInfo} ${error}`);
    return { isValid: false, error, originalValue: param, context };
  }

  const isLikelySlug = param.includes("-") || param.includes("_") || /[a-zA-Z]/.test(param);
  if (isLikelySlug) {
    const error = `SLUG_DETECTED: Received slug-like ${context} parameter: '${param}' - expected numeric ID`;
    logger.error(`[SafeIdParser]${debugInfo} ${error}`);
    return { isValid: false, error, originalValue: param, context };
  }

  if (!/^\d+$/.test(param)) {
    const error = `Invalid ${context} ID format: '${param}' - expected numeric ID`;
    logger.warn(`[SafeIdParser]${debugInfo} ${error}`);
    return { isValid: false, error, originalValue: param, context };
  }

  const id = parseInt(param, 10);

  if (isNaN(id)) {
    const error = `Failed to parse ${context} ID: '${param}' resulted in NaN`;
    logger.error(`[SafeIdParser]${debugInfo} CRITICAL: ${error}`);
    return { isValid: false, error, originalValue: param, context };
  }

  if (id <= 0) {
    const error = `Invalid ${context} ID: ${id} - must be positive integer`;
    logger.warn(`[SafeIdParser]${debugInfo} ${error}`);
    return { isValid: false, error, originalValue: param, context };
  }

  if (id > Number.MAX_SAFE_INTEGER) {
    const error = `${context} ID too large: ${id}`;
    logger.warn(`[SafeIdParser]${debugInfo} ${error}`);
    return { isValid: false, error, originalValue: param, context };
  }

  logger.debug(`[SafeIdParser]${debugInfo} Successfully parsed ${context} ID: ${id}`);
  return { isValid: true, id, originalValue: param, context };
}

/**
 * Middleware-style function for Express routes that handles ID validation
 */
import type { Request, Response } from "express";

export function validateIdParam(
  req: Request,
  res: Response,
  paramName: string = "id",
  context: string = "entity",
): number | null {
  const requestInfo = {
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get("User-Agent"),
  };

  const result = safeParseId(req.params[paramName], context, requestInfo);

  if (!result.isValid) {
    const errorResponse = {
      message: result.error || `Invalid ${context} ID parameter`,
      parameter: paramName,
      value: req.params[paramName],
      context,
      timestamp: new Date().toISOString(),
      ...(result.originalValue?.includes("-") && {
        hint: `Received slug-like parameter '${result.originalValue}'. Use /api/${context}s/by-slug/${result.originalValue} if looking up by slug.`,
      }),
    };

    if (result.originalValue?.includes("-")) {
      logger.error(
        `[RouteConfusion] ${context.toUpperCase()}_SLUG_TO_ID_ROUTE: Client sent slug '${result.originalValue}' to ID-based endpoint ${requestInfo.url}`,
      );
    }

    res.status(400).json(errorResponse);
    return null;
  }

  return result.id!;
}

// ============================================================================
// PHASE 2B: PAGINATION UTILITIES REMOVED
// ============================================================================
// PHASE 2B: Removed pagination schemas and types - eliminated to clean up pagination remnants after function removal

// PHASE 2B: Removed UnifiedPagination class - no longer needed after pagination removal

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

export function transformNullToUndefined<T>(obj: T): T {
  if (obj === null) return undefined as T;
  if (Array.isArray(obj)) return obj.map((item) => transformNullToUndefined(item)) as T;
  if (typeof obj === "object" && obj !== null) {
    const transformed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      transformed[key] = transformNullToUndefined(value);
    }
    return transformed as T;
  }
  return obj;
}

export function prepareForValidation<T>(obj: T): T {
  return transformNullToUndefined(obj);
}

export function cleanApiData<T>(obj: unknown): Partial<T> {
  if (!obj || typeof obj !== "object") return obj as Partial<T>;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      const cleanedArray = value
        .filter((item) => item !== null && item !== undefined)
        .map((item) => (typeof item === "object" ? cleanApiData(item) : item));
      if (cleanedArray.length > 0) cleaned[key] = cleanedArray;
    } else if (typeof value === "object") {
      const cleanedObject = cleanApiData(value);
      if (Object.keys(cleanedObject).length > 0) cleaned[key] = cleanedObject;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

export function validateAndSanitizeInput(input: unknown): unknown {
  if (typeof input === "string") {
    return input.trim().slice(0, 1000); // Prevent excessively long strings
  }
  return input;
}

export function checkRateLimit(): boolean {
  // Simplified rate limiting - can be enhanced later
  return true;
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, "").trim();
}

export function validateFilename(filename: string): string {
  if (!filename || typeof filename !== "string") {
    throw new Error("Invalid filename: must be a non-empty string");
  }
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    throw new Error("Invalid filename: path traversal detected");
  }
  return filename;
}

export function validateMediaId(id: unknown): number {
  const numId = parseInt(String(id));
  if (isNaN(numId) || numId <= 0) {
    throw new Error("Invalid media ID: must be a positive integer");
  }
  return numId;
}

export const setSecureCORSHeaders = (res: Response, origin?: string): void => {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else {
    const allowedOrigin =
      origin?.includes("replit.dev") || origin?.includes("replit.app") ? origin : "https://repl.co";
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "3600");
};

/**
 * Determines if the request should bypass caching mechanisms
 * Checks for 'nocache' query param or admin referer
 */
export function shouldBypassCache(req: Request): boolean {
  const referer = req.headers.referer || "";
  const nocache = req.query.nocache === "true";
  // Bypass if referer contains /admin or nocache param is true
  return referer.includes("/admin") || nocache;
}

// ============================================================================
// MEDIA URL UTILITIES
// ============================================================================

export class MediaUrlBuilder {
  static buildStorageKey(filename: string): string {
    return `media/${filename}`;
  }

  static isValidUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    if (url === "undefined" || url === "null") return false;
    if (url.includes("undefined") || url.includes("null")) return false;
    return true;
  }

  static extractFilename(url: string): string | null {
    if (url.startsWith("/api/media/") && url.includes("/content")) {
      return url.replace(/\/api\/media\/\d+\/content/, "");
    }
    if (url.startsWith("/api/media/proxy/")) {
      return url.replace("/api/media/proxy/", "");
    }
    if (!url.includes("/")) {
      return url;
    }
    return null;
  }
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

export const responseOptimizer = {
  optimizedJsonResponse: async (res: Response, data: unknown, _cacheKey?: string) => {
    res.setHeader("Content-Type", "application/json");
    res.json(data);
  },
};

// ============================================================================
// URL PATH UTILITIES
// ============================================================================

export class UrlPathService {
  static getInstance() {
    return new UrlPathService();
  }

  sanitizePath(path: string): string {
    return path.replace(/[^a-zA-Z0-9/-]/g, "").toLowerCase();
  }

  buildPath(segments: string[]): string {
    return segments.join("/").replace(/\/+/g, "/");
  }

  generateBreadcrumbs(
    product?: { name: string; slug: string },
    category?: { name: string; slug: string },
  ): Array<{ name: string; url: string }> {
    const breadcrumbs = [];
    if (category) {
      breadcrumbs.push({
        name: category.name,
        url: `/category/${category.slug}`,
      });
    }
    if (product) {
      breadcrumbs.push({ name: product.name, url: `/product/${product.slug}` });
    }
    return breadcrumbs;
  }
}

// ============================================================================
// RETRY UTILITIES
// ============================================================================

export class RetryManager {
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      }
    }
    throw new Error("Retry exhausted");
  }
}

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

export const migrationService = {
  migrateAllToPostgreSQL: async () => {
    logger.info("[Migration] Using Drizzle ORM migrations - enhanced migration service archived");
    return { status: "completed", message: "Using Drizzle ORM migrations" };
  },

  migrateProductsToPostgreSQL: async () => {
    logger.info("[Migration] Using Drizzle ORM migrations - enhanced migration service archived");
    return { status: "completed", message: "Using Drizzle ORM migrations" };
  },
};

// ============================================================================
// ADDITIONAL SIMPLIFIED UTILITIES (Phase 1 compatibility)
// ============================================================================

// Enhanced MediaValidator for compatibility
export const MediaValidator = {
  validateFilename: (filename: string): boolean => {
    if (!filename || typeof filename !== "string") return false;
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".mp4",
      ".webm",
      ".glb",
      ".gltf",
    ];
    return allowedExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  },
  validateFileType: (type: string): boolean => {
    const allowedTypes = ["image", "video", "model", "document"];
    return allowedTypes.includes(type);
  },
  validateFileSize: (size: number): boolean => {
    return size > 0 && size <= 500 * 1024 * 1024; // 500MB limit
  },
};

/**
 * MIME Type Correction System
 * Fixes NULL/incorrect MIME types for uploaded files, especially 3D models
 * Handles browser misdetection of .glb/.gltf files as application/octet-stream
 */
export function correctMimeType(originalMimeType: string, filename: string): string {
  const extension = filename.toLowerCase().split(".").pop();

  // Handle 3D model files specifically - these are commonly misdetected
  if (extension === "glb") {
    return "model/gltf-binary";
  }
  if (extension === "gltf") {
    return "model/gltf+json";
  }

  // Handle other common browser misdetections
  const extensionMimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    pdf: "application/pdf",
  };

  // If browser detected generic type, use extension mapping
  if (originalMimeType === "application/octet-stream" && extension && extensionMimeMap[extension]) {
    return extensionMimeMap[extension];
  }

  // Handle NULL or undefined MIME types
  if (!originalMimeType && extension && extensionMimeMap[extension]) {
    return extensionMimeMap[extension];
  }

  // Return original if it looks correct
  return originalMimeType || "application/octet-stream";
}

export default {
  transformNullToUndefined,
  prepareForValidation,
  cleanApiData,
  validateAndSanitizeInput,
  checkRateLimit,
  sanitizeString,
  validateFilename,
  validateMediaId,
  setSecureCORSHeaders,
  MediaUrlBuilder,
  responseOptimizer,
  UrlPathService,
  RetryManager,
  migrationService,
  correctMimeType,
};
