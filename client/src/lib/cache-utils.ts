/**
 * Cache Utilities
 * Helper functions for working with cached API responses
 */

/**
 * Type-safe unwrapping helper for potentially cached results
 * Handles responses that may be wrapped in { result: T } format
 */
type MaybeCached<T> = { result: T } | T;

export function unwrapResult<T>(x: MaybeCached<T> | undefined): T | undefined {
  if (!x) return undefined;
  if (typeof x === "object" && x !== null && "result" in x) {
    return x.result;
  }
  return x as T;
}
