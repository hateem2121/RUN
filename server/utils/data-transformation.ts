/**
 * Data Transformation Utilities
 * Extracted from monolithic routes.ts for reusability
 */

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
