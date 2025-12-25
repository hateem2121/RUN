import sharp from "sharp";
import { appStorageService } from "./app-storage-service.js";
import { generateOrganizedStoragePath } from "./routes/media/utils.js";

export interface ImageVariants {
  thumbnail: string; // 200px - for cards/grids
  medium: string; // 800px - for product pages
  large: string; // 1600px - for lightbox/detail
  original: string; // Compressed original (<500KB)
}

export interface ImageMetadata {
  width: number;
  height: number;
  thumbnailFilename?: string;
  variants?: ImageVariants;
}

export async function processImage(
  fileBuffer: Buffer,
  originalFilename: string,
): Promise<ImageMetadata> {
  try {
    // Check if it's an SVG file
    const isSvg = originalFilename.toLowerCase().endsWith(".svg");

    if (isSvg) {
      // For SVG files, we can't use Sharp to process them
      // SVG files are vector-based and don't have fixed dimensions
      // We'll extract dimensions from the SVG content if possible
      const svgContent = fileBuffer.toString("utf-8");
      const widthMatch = svgContent.match(/width\s*=\s*["']?(\d+)["']?/);
      const heightMatch = svgContent.match(/height\s*=\s*["']?(\d+)["']?/);
      const viewBoxMatch = svgContent.match(/viewBox\s*=\s*["']?[^"']*?(\d+)\s+(\d+)["']?/);

      let width = 0;
      let height = 0;

      if (widthMatch?.[1] && heightMatch?.[1]) {
        width = parseInt(widthMatch[1], 10);
        height = parseInt(heightMatch[1], 10);
      } else if (viewBoxMatch?.[1] && viewBoxMatch?.[2]) {
        width = parseInt(viewBoxMatch[1], 10);
        height = parseInt(viewBoxMatch[2], 10);
      } else {
        // Default SVG dimensions if not specified
        width = 300;
        height = 150;
      }

      return {
        width,
        height,
        // No thumbnail for SVG files since they're vector-based
      };
    }

    // For raster images, use Sharp as before
    const metadata = await sharp(fileBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Could not extract image dimensions");
    }

    // Generate thumbnail (300x300px max, maintaining aspect ratio)
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(300, 300, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80, mozjpeg: true }) // Reduced from 85, added mozjpeg for better compression
      .toBuffer();

    // Generate thumbnail filename with proper sanitization
    const randomString = Math.random().toString(36).substring(2, 8);
    const baseName = originalFilename.replace(/\.[^/.]+$/, ""); // Remove extension
    // Sanitize filename: remove dots, spaces, and special chars that cause object storage issues
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "-");
    const thumbnailFilename = `${randomString}-thumb-${sanitizedBaseName}.jpg`;

    // Upload thumbnail to object storage using organized path: media/thumbnails/{yyyy}/{mm}/{timestamp}-{filename}
    const thumbnailPath = generateOrganizedStoragePath("thumbnails", thumbnailFilename);
    await appStorageService.uploadAsset(thumbnailPath, thumbnailBuffer);

    return {
      width: metadata.width,
      height: metadata.height,
      thumbnailFilename,
    };
  } catch (_error) {
    // If processing fails, return basic metadata without thumbnail
    try {
      const metadata = await sharp(fileBuffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
      };
    } catch {
      return {
        width: 0,
        height: 0,
      };
    }
  }
}

/**
 * Generate responsive image variants with aggressive compression
 * Targets: <500KB for all variants to fix 60-85s load times
 * Variants: 200px (thumbnail), 800px (medium), 1600px (large), compressed original
 */
export async function generateResponsiveVariants(
  fileBuffer: Buffer,
  originalFilename: string,
): Promise<ImageVariants> {
  const randomString = Math.random().toString(36).substring(2, 8);
  const baseName = originalFilename.replace(/\.[^/.]+$/, "");
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "-");

  // Helper function to compress image to target size
  async function compressToTarget(
    buffer: Buffer,
    width: number,
    targetSizeKB: number = 500,
  ): Promise<Buffer> {
    let quality = 78; // Reduced from 82 for smaller files with minimal quality loss
    let compressed: Buffer;

    // Try WebP first (better compression)
    compressed = await sharp(buffer)
      .resize(width, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 6 }) // Added effort: 6 for better compression
      .toBuffer();

    // If still too large, reduce quality iteratively
    while (compressed.length > targetSizeKB * 1024 && quality > 55) {
      // Reduced from 60 to 55
      quality -= 5;
      compressed = await sharp(buffer)
        .resize(width, null, { fit: "inside", withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();
    }

    return compressed;
  }

  // Generate variants in parallel for speed
  const [thumbnailBuffer, mediumBuffer, largeBuffer, compressedOriginal] = await Promise.all([
    compressToTarget(fileBuffer, 200, 50), // Thumbnail: 200px, <50KB
    compressToTarget(fileBuffer, 800, 200), // Medium: 800px, <200KB
    compressToTarget(fileBuffer, 1600, 500), // Large: 1600px, <500KB
    compressToTarget(fileBuffer, 3000, 500), // Compressed original: max 3000px, <500KB
  ]);

  // Generate variant paths (use 'images' folder type as variants are processed images)
  const thumbnailPath = generateOrganizedStoragePath(
    "images",
    `${randomString}-thumb-${sanitizedBaseName}.webp`,
  );
  const mediumPath = generateOrganizedStoragePath(
    "images",
    `${randomString}-med-${sanitizedBaseName}.webp`,
  );
  const largePath = generateOrganizedStoragePath(
    "images",
    `${randomString}-lg-${sanitizedBaseName}.webp`,
  );
  const originalPath = generateOrganizedStoragePath(
    "images",
    `${randomString}-orig-${sanitizedBaseName}.webp`,
  );

  // Upload all variants in parallel
  await Promise.all([
    appStorageService.uploadAsset(thumbnailPath, thumbnailBuffer),
    appStorageService.uploadAsset(mediumPath, mediumBuffer),
    appStorageService.uploadAsset(largePath, largeBuffer),
    appStorageService.uploadAsset(originalPath, compressedOriginal),
  ]);

  // Return storage paths (not URLs) for all variants
  return {
    thumbnail: thumbnailPath,
    medium: mediumPath,
    large: largePath,
    original: originalPath,
  };
}

export function isImageFile(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") &&
    ["image/jpeg", "image/png", "image/gif", "image/svg+xml"].includes(mimeType)
  );
}
