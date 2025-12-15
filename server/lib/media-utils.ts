/**
 * MEDIA UTILITIES
 *
 * Shared helper functions for media asset management and id extraction.
 * Reduces code duplication across batch routes.
 */

/**
 * Recursively extracts all media IDs from an object or array of objects.
 * Looks for common media field names:
 * - imageId
 * - videoId
 * - backgroundMediaId
 * - backgroundImageId
 * - mediaIds (array)
 *
 * @param data The data structure to scan (object, array, or primitive)
 * @returns Set of unique media ID numbers
 */
export function extractMediaIds(data: any): Set<number> {
  const mediaIds = new Set<number>();

  if (!data || typeof data !== "object") {
    return mediaIds;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    for (const item of data) {
      const subIds = extractMediaIds(item);
      subIds.forEach((id) => mediaIds.add(id));
    }
    return mediaIds;
  }

  // Handle Objects
  // Check known fields directly for performance (faster than iterating all keys)
  if ("imageId" in data && typeof data.imageId === "number") mediaIds.add(data.imageId);
  if ("videoId" in data && typeof data.videoId === "number") mediaIds.add(data.videoId);
  if ("backgroundMediaId" in data && typeof data.backgroundMediaId === "number")
    mediaIds.add(data.backgroundMediaId);
  if ("backgroundImageId" in data && typeof data.backgroundImageId === "number")
    mediaIds.add(data.backgroundImageId);
  if ("iconMediaId" in data && typeof data.iconMediaId === "number") mediaIds.add(data.iconMediaId);

  // Check for arrays of IDs
  if ("mediaIds" in data && Array.isArray(data.mediaIds)) {
    data.mediaIds.forEach((id: any) => {
      if (typeof id === "number") mediaIds.add(id);
    });
  }

  // Recursively check deeper for nested structures if needed
  // Note: For now, we rely on the top-level keys in our schema entities
  // to avoid deep traversal overhead on every field.
  // Most schema entities are flat or 1-level deep.

  return mediaIds;
}
