/**
 * Slug Utilities
 * Consistent slug generation and normalization across the application
 */

/**
 * Normalizes a slug to lowercase kebab-case format
 * Ensures consistent URL formatting across the application
 *
 * @param slug - The slug to normalize
 * @returns Normalized slug in lowercase-kebab-case
 *
 * @example
 * normalizeSlug("Outer-Wear") // "outer-wear"
 * normalizeSlug("ACTIVE_WEAR") // "active-wear"
 * normalizeSlug("Sports Gear") // "sports-gear"
 */
export function normalizeSlug(slug: string): string {
  if (typeof slug !== "string" || !slug) {
    return "";
  }

  const bounded = slug.length > 500 ? slug.slice(0, 500) : slug;

  return bounded
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-") // Replace whitespace and underscores with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove non-alphanumeric except hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens in single pass
    .replace(/^-|-$/g, ""); // Trim hyphens from both ends in single pass
}

/**
 * Generates a URL-safe slug from a name
 * Converts any string into a valid slug format
 *
 * @param name - The name to convert to a slug
 * @returns URL-safe slug
 *
 * @example
 * generateSlug("Heritage Leather Jacket") // "heritage-leather-jacket"
 * generateSlug("T-Shirt (Premium)") // "t-shirt-premium"
 */
/** @public */ export function generateSlug(name: string): string {
  if (!name) {
    return "";
  }

  return normalizeSlug(name);
}

/**
 * Validates if a string is a valid slug format
 * Checks for lowercase-kebab-case pattern
 *
 * @param slug - The slug to validate
 * @returns True if valid slug format
 *
 * @example
 * isValidSlug("outer-wear") // true
 * isValidSlug("Outer-Wear") // false (uppercase)
 * isValidSlug("outer_wear") // false (underscore)
 */
/** @public */ export function isValidSlug(slug: string): boolean {
  if (!slug) {
    return false;
  }

  // Must be lowercase, alphanumeric with hyphens only
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
}
