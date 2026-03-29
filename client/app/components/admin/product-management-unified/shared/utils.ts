/**
 * Shared utility functions for admin products
 */
import type { MediaAsset } from "@shared/index";

/**
 * Convert media IDs to MediaAsset objects using a getter function
 */
export function mapMediaIdsToAssets(
  mediaIds: number[],
  getMediaAsset: (id: number) => MediaAsset | undefined,
): MediaAsset[] {
  if (!Array.isArray(mediaIds) || typeof getMediaAsset !== "function") {
    return [];
  }

  return mediaIds
    .map((id) => {
      if (typeof id !== "number") {
        return undefined;
      }
      try {
        return getMediaAsset(id);
      } catch {
        return undefined;
      }
    })
    .filter((asset): asset is MediaAsset => asset !== undefined);
}

/**
 * Extract IDs from MediaAsset array
 */
export function extractMediaIds(mediaAssets: MediaAsset[]): number[] {
  return mediaAssets.map((asset) => asset.id);
}

/**
 * Validate media file for security
 */
export function validateMediaFile(file: File): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Check for malicious file signatures (magic bytes)
  const maliciousSignatures = [
    "PK\x03\x04", // ZIP-based malware
    "\x7fELF", // Linux executable
    "MZ", // Windows executable
    "\xca\xfe\xba\xbe", // Java class file
  ];

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
      const signature = Array.from(bytes)
        .map((b) => String.fromCharCode(b))
        .join("");

      for (const malicious of maliciousSignatures) {
        if (signature.startsWith(malicious)) {
          resolve({
            valid: false,
            error: "File contains potentially malicious content",
          });
          return;
        }
      }

      resolve({ valid: true });
    };

    reader.onerror = () => {
      resolve({ valid: false, error: "Failed to read file" });
    };

    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}

/**
 * Get media URL with proxy fallback
 */
export function getMediaUrl(asset: MediaAsset): string | undefined {
  if (asset.url) {
    return asset.url;
  }
  return asset.id && asset.id < 1000000000000 ? `/api/media/${asset.id}/content` : undefined;
}
