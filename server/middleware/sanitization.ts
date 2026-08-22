import type { NextFunction, Request, Response } from "express";
import DOMPurify from "isomorphic-dompurify";

/**
 * SANITIZATION MIDDLEWARE
 * Prevents XSS attacks by sanitizing request data.
 * Implements granular sanitization that preserves rich text fields while protecting standard inputs.
 */

// Rich text field patterns that should preserve HTML (for TipTap and similar)
const RICH_TEXT_PATHS = ["content", "description", "body", "message"];

/**
 * Sanitize a value based on its path in the object tree
 */
function sanitizeValue(value: unknown, path: string): unknown {
  if (typeof value === "string") {
    // Check if this is a rich text field that should preserve safe HTML
    const isRichTextField = RICH_TEXT_PATHS.some((keyword) => path.toLowerCase().includes(keyword));

    if (isRichTextField) {
      // For rich text, use DOMPurify to strip dangerous tags and handlers while preserving safe formatting
      return DOMPurify.sanitize(value, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "b",
          "i",
          "em",
          "strong",
          "a",
          "ul",
          "ol",
          "li",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "blockquote",
          "code",
          "pre",
          "span",
          "div",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "img",
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel"],
      });
    }

    // Standard field sanitization - remove all HTML tags completely
    return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
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
