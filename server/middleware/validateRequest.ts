import type { NextFunction, Request, Response } from "express";
import { type ZodError, type ZodSchema } from "zod";
import { ValidationError } from "../lib/errors.js";

/**
 * Format Zod errors into a structured object for API responses
 * Maps to RFC 9457 "invalid-params" extension format
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

/**
 * Middleware to validate request body against a Zod schema
 * @example
 * router.post("/products", validateBody(createProductSchema), createProduct);
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw new ValidationError("Validation failed", formatZodErrors(result.error));
    }

    // Attach validated data to request for type-safe access in handlers
    (req as Request & { validatedBody: T }).validatedBody = result.data;
    next();
  };
}

/**
 * Middleware to validate request query parameters against a Zod schema
 * @example
 * router.get("/products", validateQuery(listProductsQuerySchema), listProducts);
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      throw new ValidationError("Invalid query parameters", formatZodErrors(result.error));
    }

    (req as Request & { validatedQuery: T }).validatedQuery = result.data;
    next();
  };
}

/**
 * Middleware to validate request URL parameters against a Zod schema
 * @example
 * router.get("/products/:id", validateParams(productIdSchema), getProduct);
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      throw new ValidationError("Invalid URL parameters", formatZodErrors(result.error));
    }

    (req as Request & { validatedParams: T }).validatedParams = result.data;
    next();
  };
}

/**
 * Combined validator for requests with multiple validation targets
 * @example
 * router.put("/products/:id",
 *   validateRequest({
 *     params: productIdSchema,
 *     body: updateProductSchema,
 *   }),
 *   updateProduct
 * );
 */
export function validateRequest<
  TBody = unknown,
  TQuery = unknown,
  TParams = unknown,
>(schemas: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        Object.assign(errors, formatZodErrors(result.error));
      } else {
        (req as Request & { validatedBody: TBody }).validatedBody = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        const queryErrors = formatZodErrors(result.error);
        // Prefix query errors to distinguish from body errors
        for (const [key, messages] of Object.entries(queryErrors)) {
          errors[`query.${key}`] = messages;
        }
      } else {
        (req as Request & { validatedQuery: TQuery }).validatedQuery = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        const paramErrors = formatZodErrors(result.error);
        for (const [key, messages] of Object.entries(paramErrors)) {
          errors[`params.${key}`] = messages;
        }
      } else {
        (req as Request & { validatedParams: TParams }).validatedParams = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError("Validation failed", errors);
    }

    next();
  };
}

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}
