import type { RequestHandler } from "express";
import sharp from "sharp";
import { logger } from "../monitoring/logger.js";

/**
 * Image Optimization Middleware
 * - Resizes images to max 2048px width/height
 * - Converts to WebP if supported (or stays original format with compression)
 * - Reduces quality to 80%
 * - Updates req.file.buffer and size
 */
export const optimizeImageMiddleware: RequestHandler = async (req, _res, next) => {
  if (!req.file || !req.file.buffer) {
    return next();
  }

  const { mimetype, size } = req.file;

  // Only optimize images
  if (!mimetype.startsWith("image/")) {
    return next();
  }

  // Skip SVGs or small files (< 100KB)
  if (mimetype === "image/svg+xml" || size < 100 * 1024) {
    return next();
  }

  try {
    const start = Date.now();
    let transformer = sharp(req.file.buffer).rotate(); // Auto-rotate based on EXIF

    const metadata = await transformer.metadata();

    // Resize if too large
    if ((metadata.width && metadata.width > 2048) || (metadata.height && metadata.height > 2048)) {
      transformer = transformer.resize({
        width: 2048,
        height: 2048,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Compress
    if (mimetype === "image/jpeg") {
      transformer = transformer.jpeg({ quality: 80, mozjpeg: true });
    } else if (mimetype === "image/png") {
      transformer = transformer.png({ quality: 80, compressionLevel: 8 });
    } else if (mimetype === "image/webp") {
      transformer = transformer.webp({ quality: 80 });
    } else {
      // Convert others to WebP for standardization if configured?
      // For now, keep original format or fallback to jpeg
      // transformer = transformer.toFormat("jpeg");
    }

    const outputBuffer = await transformer.toBuffer();
    const outputSize = outputBuffer.length;
    const savings = size > 0 ? ((size - outputSize) / size) * 100 : 0;

    // Update req.file
    req.file.buffer = outputBuffer;
    req.file.size = outputSize;

    logger.info(
      `[ImageOptimizer] Optimized ${req.file.originalname}: ${Math.round(size / 1024)}KB -> ${Math.round(outputSize / 1024)}KB (${savings.toFixed(1)}% savings) in ${Date.now() - start}ms`,
    );

    next();
  } catch (err) {
    logger.error("[ImageOptimizer] Failed to optimize image:", err);
    // On error, proceed with original file (fail safe)
    next();
  }
};
