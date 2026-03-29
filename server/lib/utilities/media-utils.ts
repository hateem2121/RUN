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
export function extractMediaIds(data: unknown): Set<number> {
  const mediaIds = new Set<number>();

  if (!data || typeof data !== "object") {
    return mediaIds;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    for (const item of data) {
      const subIds = extractMediaIds(item);
      subIds.forEach((id) => {
        mediaIds.add(id);
      });
    }
    return mediaIds;
  }

  // Handle Objects
  const record = data as Record<string, unknown>;

  // Check known fields directly for performance (faster than iterating all keys)
  if ("imageId" in record && typeof record.imageId === "number") {
    mediaIds.add(record.imageId);
  }
  if ("videoId" in record && typeof record.videoId === "number") {
    mediaIds.add(record.videoId);
  }
  if ("backgroundMediaId" in record && typeof record.backgroundMediaId === "number") {
    mediaIds.add(record.backgroundMediaId);
  }
  if ("backgroundImageId" in record && typeof record.backgroundImageId === "number") {
    mediaIds.add(record.backgroundImageId);
  }
  if ("iconMediaId" in record && typeof record.iconMediaId === "number") {
    mediaIds.add(record.iconMediaId);
  }

  // Check for arrays of IDs
  if ("mediaIds" in record && Array.isArray(record.mediaIds)) {
    record.mediaIds.forEach((id: unknown) => {
      if (typeof id === "number") {
        mediaIds.add(id);
      }
    });
  }

  // Recursively check deeper for nested structures if needed
  // Note: For now, we rely on the top-level keys in our schema entities
  // to avoid deep traversal overhead on every field.
  // Most schema entities are flat or 1-level deep.

  return mediaIds;
}
