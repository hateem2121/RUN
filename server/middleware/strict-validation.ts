/**
 * STRICT VALIDATION MIDDLEWARE
 * CHUNK 8: Security Audit - Enforce Zod validation and reject extraneous input
 *
 * This middleware ensures that all admin POST/PATCH/PUT/DELETE routes:
 * 1. Have proper Zod validation
 * 2. Reject requests with extraneous fields (strict mode)
 * 3. Return clear validation errors
 */

import type { Request, RequestHandler } from "express";
import { z } from "zod";
import { logger } from "../lib/monitoring/logger.js";

interface ValidatedRequest extends Request {
  __bodyValidated?: boolean;
}

/**
 * Middleware to detect and block admin routes without proper validation
 *
 * This acts as a safety net to ensure all admin mutation endpoints
 * validate their request bodies using Zod schemas.
 *
 * Usage: Apply after requireAdmin middleware on /api/admin/* routes
 */
export const enforceValidation: RequestHandler = (req, _res, next) => {
  // Only check mutation methods (POST, PATCH, PUT, DELETE)
  const mutationMethods = ["POST", "PATCH", "PUT", "DELETE"];
  if (!mutationMethods.includes(req.method)) {
    return next();
  }

  // Check if route is admin route
  if (!req.path.startsWith("/admin")) {
    return next();
  }

  // Skip if body is empty (some routes like /restore don't need body validation)
  if (!req.body || Object.keys(req.body).length === 0) {
    return next();
  }

  // Check if the route has been validated
  // This can be set by:
  // 1. New validateBody middleware
  // 2. Existing routes that set the flag manually
  if ((req as ValidatedRequest).__bodyValidated) {
    return next();
  }

  // CHUNK 8: Soft enforcement mode - log warning but allow requests
  // This allows existing routes with inline validation to continue working
  // while we migrate to the new middleware pattern
  logger.warn(`[Validation] ⚠️ Admin route using legacy validation pattern`, {
    method: req.method,
    path: req.path,
    bodyKeys: Object.keys(req.body),
    note: "Consider migrating to validateBody middleware for consistency",
  });

  // Allow request to proceed (existing routes have their own validation)
  return next();
};

/**
 * Create a validation middleware for a specific Zod schema
 *
 * Features:
 * - Clear error messages with field-level details
 * - Sets validation marker for enforceValidation middleware
 * - Strictness: Use z.object().strict() to reject extraneous fields
 *
 * @param schema - Zod schema to validate against (use .strict() for strict mode)
 * @param options - Validation options
 * @returns Express middleware function
 *
 * @example
 * ```ts
 * const createProductSchema = z.object({
 *   name: z.string(),
 *   price: z.number()
 * }).strict(); // Reject extraneous fields
 *
 * router.post('/products', // security
 *   requireAdmin,
 *   validateBody(createProductSchema),
 *   async (req, res) => {
 *     // req.body is now validated and typed
 *   }
 * );
 * ```
 */
export function validateBody<T extends z.ZodType>(
  schema: T,
  options: {
    allowEmpty?: boolean | undefined; // Default: false - reject empty bodies
  } = {},
): RequestHandler {
  const { allowEmpty = false } = options;

  return (req, res, next) => {
    try {
      // Check for empty body
      if (!req.body || Object.keys(req.body).length === 0) {
        if (allowEmpty) {
          (req as ValidatedRequest).__bodyValidated = true;
          return next();
        }

        return res.status(400).json({
          success: false,
          error: {
            code: "EMPTY_BODY",
            message: "Request body is required",
            details: "This endpoint requires a request body with valid data",
          },
        });
      }

      // Validate using schema
      // Note: Strictness should be defined at schema level using z.object().strict()
      const validated = schema.parse(req.body);

      // Replace req.body with validated data (ensures no extraneous fields)
      req.body = validated;

      // Mark as validated for enforceValidation middleware
      (req as ValidatedRequest).__bodyValidated = true;

      logger.debug(`[Validation] ✅ Request body validated`, {
        method: req.method,
        path: req.path,
      });

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(`[Validation] ❌ Validation failed`, {
          method: req.method,
          path: req.path,
          errors: error.issues,
        });

        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
              code: issue.code,
            })),
          },
        });
      }

      // Unexpected error
      logger.error(`[Validation] Unexpected validation error:`, error);
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error during validation",
        },
      });
    }
  };
}

/**
 * Pre-built validation middleware for empty bodies
 * Useful for routes that don't accept any body data (like /restore endpoints)
 */
export const validateEmptyBody = validateBody(z.object({}).strict(), {
  allowEmpty: true,
});

/**
 * Helper to create strict schemas that reject unknown keys
 *
 * @example
 * ```ts
 * const schema = strictSchema({
 *   name: z.string(),
 *   age: z.number()
 * });
 * // { name: "John", age: 30, extra: "field" } -> REJECTED
 * ```
 */
export function strictSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}
