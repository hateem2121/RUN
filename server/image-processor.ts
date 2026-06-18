import sharp from "sharp";
import { appStorageService } from "./lib/storage/app-service.js";
import { generateOrganizedStoragePath } from "./routes/media/utils.js";

interface ImageVariants {
  thumbnail: string; // 200px - for cards/grids
  medium: string; // 800px - for product pages
  large: string; // 1600px - for lightbox/detail
  original: string; // Compressed original (<500KB)
}

interface ImageMetadata {
  width: number;
  height: number;
  thumbnailFilename?: string | undefined;
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
 * Generate responsive image variants with efficient single-pass compression
 * Optimized for speed and size to fix 60-85s cold-start delays.
 * Uses sequential downsampling (Large -> Medium -> Thumbnail) for better performance.
 */
export async function generateResponsiveVariants(
  fileBuffer: Buffer,
  originalFilename: string,
): Promise<ImageVariants> {
  const randomString = Math.random().toString(36).substring(2, 8);
  const baseName = originalFilename.replace(/\.[^/.]+$/, "");
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "-");

  // Fixed quality heuristic (safe for WebP, provides excellent compression vs quality)
  const QUALITY = 75;
  const EFFORT = 6; // Max effort for smallest file size at fixed quality

  // 1. Generate Compressed Original (Max 3000px)
  const originalBuffer = await sharp(fileBuffer)
    .resize(3000, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, effort: EFFORT }) // Slightly higher quality for the "original"
    .toBuffer();

  // 2. Generate Large Variant (1600px) from Original Buffer
  // We use the original buffer for the first resize to maintain quality
  const largeBuffer = await sharp(fileBuffer)
    .resize(1600, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: EFFORT })
    .toBuffer();

  // 3. Generate Medium Variant (800px) from Large Buffer (Sequential Downsampling)
  // This is faster than processing from the original high-res buffer
  const mediumBuffer = await sharp(largeBuffer)
    .resize(800, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: EFFORT })
    .toBuffer();

  // 4. Generate Thumbnail Variant (200px) from Medium Buffer
  const thumbnailBuffer = await sharp(mediumBuffer)
    .resize(200, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: EFFORT })
    .toBuffer();

  // Generate organized storage paths
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
  // This is safe even for many uploads as GCS handles high concurrency well
  await Promise.all([
    appStorageService.uploadAsset(thumbnailPath, thumbnailBuffer),
    appStorageService.uploadAsset(mediumPath, mediumBuffer),
    appStorageService.uploadAsset(largePath, largeBuffer),
    appStorageService.uploadAsset(originalPath, originalBuffer),
  ]);

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
