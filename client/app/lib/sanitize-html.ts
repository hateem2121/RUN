/**
 * HTML Sanitization Utility
 * Phase 1, Block 1C: XSS Prevention
 *
 * Provides safe HTML escaping to prevent XSS attacks
 * No external dependencies - native JavaScript only
 */

/**
 * Escapes HTML special characters to prevent XSS
 * Converts: < > & " ' to their HTML entity equivalents
 *
 * @param str - String to escape
 * @returns Escaped string safe for HTML rendering
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export const escapeHtml = (str: string | null | undefined): string => {
  if (str == null) {
    return "";
  }
  if (typeof str !== "string") {
    return String(str);
  }

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Sanitizes object for JSON-LD structured data
 * Recursively escapes all string values in nested objects
 * Preserves arrays, numbers, booleans, null
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object safe for JSON.stringify
 */
export const sanitizeStructuredData = <T extends Record<string, unknown> | unknown>(obj: T): T => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    return typeof obj === "string" ? (escapeHtml(obj) as T) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeStructuredData(item)) as T;
  }

  const sanitized = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = escapeHtml(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeStructuredData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
};

/**
 * Sanitizes CSS property values
 * Removes potentially dangerous characters from CSS
 * Allows: alphanumeric, #, -, %, (, ), space, comma
 *
 * @param cssValue - CSS value to sanitize
 * @returns Safe CSS value
 */
export const sanitizeCssValue = (cssValue: string | null | undefined): string => {
  if (cssValue == null) {
    return "";
  }
  if (typeof cssValue !== "string") {
    return "";
  }

  // Allow common CSS patterns: colors, units, calc(), rgb(), etc.
  // Remove anything that could break out of CSS context
  return cssValue.replace(/[^a-zA-Z0-9#\-%.(),\s]/g, "").trim();
};

/**
 * Sanitizes CSS variable names (custom properties)
 * Ensures valid CSS custom property naming
 *
 * @param varName - CSS variable name
 * @returns Safe CSS variable name
 */
export const sanitizeCssVariableName = (varName: string): string => {
  if (!varName) {
    return "";
  }

  // CSS custom properties must start with -- and contain only alphanumeric, -, _
  return varName.replace(/[^a-zA-Z0-9\-_]/g, "");
};
