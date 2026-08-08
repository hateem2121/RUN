import type { NextFunction, Request, Response } from "express";

/**
 * SANITIZATION MIDDLEWARE
 * Prevents XSS attacks by sanitizing request data.
 * Implements granular sanitization that preserves rich text fields while protecting standard inputs.
 */

import type { NextFunction, Request, Response } from "express";

// Rich text field patterns that should preserve HTML (for TipTap and similar)
const RICH_TEXT_PATHS = ["content", "description", "body", "message"];

/**
 * Sanitize a value based on its path in the object tree
 */
function sanitizeValue(value: unknown, path: string): unknown {
  if (typeof value === "string") {
    // Check if this is a rich text field that should preserve safe HTML
    const isRichTextField = RICH_TEXT_PATHS.some((keyword) =>
      path.toLowerCase().includes(keyword),
    );

    if (isRichTextField) {
      // For rich text, only remove dangerous tags but preserve formatting
      // This is a simplified approach - production should use DOMPurify
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/on\w+="[^"]*"/g, ""); // Remove inline event handlers
    }

    // Standard field sanitization - remove all HTML tags
    return value.replace(/[<>]/g, "");
  }

  if (Array.isArray(value)) {
    return value.map((item, idx) => sanitizeValue(item, `${path}[${idx}]`));
  }

  if (typeof value === "object" && value !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val, `${path}.${key}`);
    }
    return sanitized;
  }

  return value;
}

/**
 * Combined Middleware
 */
export function requestSanitization(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body, "");
  }
  next();
}
