/**
 * ADMIN ROUTER MODULE
 * Extracted from routes.ts for better organization
 * Handles all administrative operations, cleanup, and system management
 */

import { Router } from "express";
import { z } from "zod";
import type { MediaAsset, Product } from "../../../shared/schema.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import { validateIdParam } from "../../utils.js";

const router = Router();

// Zod validation schemas for admin routes
const auditConfigSchema = z.object({
  enabled: z.boolean().optional(),
  trackedTables: z.array(z.string()).optional(),
});

const emptyBodySchema = z.strictObject({}); // For routes that should not accept any body data

// GET /api/admin/products/initial-data - Admin products batch data
router.get("/admin/products/initial-data", async (_req, res) => {
  try {
    const [allProducts, categories, fabrics, mediaAssets] = await withTimeout(
      Promise.all([
        getStorage().getProductsIncludingDeleted(),
        getStorage().getCategories(),
        getStorage().getFabrics(),
        getStorage().getMediaAssets(),
      ]),
      15000,
      "Fetch admin initial data",
    );

    // Filter for active products only (admin endpoint should show all active products)
    const products = allProducts.filter((p: Product) => p.isActive && !p.deletedAt);

    const validMediaAssets = mediaAssets.filter(
      (asset): asset is MediaAsset =>
        typeof asset.filename === "string" && asset.filename !== "undefined",
    );

    const referencedMediaIds = new Set<number>();
    const enhancedProducts = products.map((product: Product) => {
      if (product.primaryImageId) referencedMediaIds.add(product.primaryImageId);
      if (product.primaryVideoId) referencedMediaIds.add(product.primaryVideoId);
      if (product.modelFileId) referencedMediaIds.add(product.modelFileId);
      if (Array.isArray(product.imageIds)) {
        product.imageIds.forEach((id) => {
          if (typeof id === "number") referencedMediaIds.add(id);
        });
      }
      if (Array.isArray(product.videos)) {
        product.videos.forEach((id) => {
          if (typeof id === "number") referencedMediaIds.add(id);
        });
      }

      return {
        ...product,
        urlPath: product.urlPath || product.slug,
        canonicalUrl: product.urlPath
          ? `/categories/${product.urlPath}`
          : `/products/${product.slug}`,
        primaryModelId: product.modelFileId || null,
      };
    });

    const relevantMediaAssets = validMediaAssets.filter((asset: MediaAsset) =>
      referencedMediaIds.has(asset.id),
    );
    const additionalMedia = validMediaAssets
      .filter((asset: MediaAsset) => !referencedMediaIds.has(asset.id))
      .slice(0, 50);
    const allMediaToSend = [...relevantMediaAssets, ...additionalMedia].map((asset) => ({
      id: asset.id,
      filename: asset.filename,
      type: asset.type,
      url: asset.url || `/api/media/${asset.id}/content`,
      originalName: asset.originalName,
    }));

    return res.json({
      products: enhancedProducts,
      categories,
      fabrics,
      mediaAssets: allMediaToSend,
      meta: {
        totalProducts: products.length,
        totalCategories: categories.length,
        totalFabrics: fabrics.length,
        totalMediaAssets: validMediaAssets.length,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger.error("Route: Batched endpoint error:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to fetch initial data" },
    });
  }
});

// GET /api/admin/test - API routing test endpoint
router.get("/admin/test", (_req, res) => {
  return res.json({ message: "API routing works", timestamp: new Date() });
});

// POST /api/admin/fix-corrupted-media - Fix corrupted media URLs
// prettier-ignore
router.post("/admin/fix-corrupted-media", async (req, res) => {
  // security
  try {
    emptyBodySchema.parse(req.body); // Validate no body data expected
    logger.debug("Route: Starting cleanup of corrupted media URLs");
    const categories = await withTimeout(getStorage().getCategories(), 10000, "Get categories");
    logger.debug(`Route: Found ${categories.length} categories to check`);

    let fixedCount = 0;
    const fixedCategories: string[] = [];

    for (const category of categories) {
      if (category.featuredContent) {
        let needsUpdate = false;
        const updatedFeaturedContent = { ...category.featuredContent };

        for (const cardKey of ["card1", "card2", "card3", "card4"] as const) {
          const card = updatedFeaturedContent[cardKey as keyof typeof updatedFeaturedContent];
          if (card && "mediaUrl" in card && card.mediaUrl) {
            const mediaUrl = card.mediaUrl;
            if (mediaUrl.includes("undefined") || mediaUrl === "/api/media/undefined/content") {
              logger.debug(`Route: FOUND CORRUPTION: ${category.name} - ${cardKey}: ${mediaUrl}`);
              const cardToUpdate =
                updatedFeaturedContent[cardKey as keyof typeof updatedFeaturedContent];
              if (cardToUpdate && "mediaUrl" in cardToUpdate) {
                cardToUpdate.mediaUrl = "";
              }
              needsUpdate = true;
            }
          }
        }

        if (needsUpdate) {
          const updateResult = await withTimeout(
            getStorage().updateCategory(category.id, {
              featuredContent: updatedFeaturedContent,
            }),
            5000,
            `Update category ${category.id}`,
          );
          if (updateResult) {
            fixedCount++;
            fixedCategories.push(category.name);
          }
        }
      }
    }

    return res.json({
      success: true,
      message: `Corrupted media cleanup completed: ${fixedCount} categories fixed`,
      fixedCount,
      fixedCategories,
      timestamp: Date.now(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      });
    }
    logger.error("Route: Corrupted media cleanup failed:", { error });
    return res.status(500).json({
      success: false,
      error: {
        message: "Cleanup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
});

// GET /api/enterprise/audit-config - Audit configuration retrieval
router.get("/enterprise/audit-config", async (_req, res) => {
  try {
    return res.json({
      enabled: true,
      trackedTables: [
        "categories",
        "products",
        "mediaAssets",
        "fabrics",
        "fibers",
        "certificates",
        "sizeCharts",
        "accessories",
        "navigationItems",
        "footerLinks",
      ],
      retentionPeriods: { standard: 2555, high: 3650, critical: 7300 },
    });
  } catch (error) {
    logger.error("Route: Error getting audit config:", error);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to retrieve audit configuration" },
    });
  }
});

// POST /api/enterprise/audit-config - Audit configuration update
// prettier-ignore
router.post("/enterprise/audit-config", async (req, res) => {
  // security
  try {
    const validatedData = auditConfigSchema.parse(req.body);
    const { enabled, trackedTables } = validatedData;
    if (typeof enabled === "boolean") getStorage().setAuditTrailEnabled(enabled);
    if (Array.isArray(trackedTables)) getStorage().configureTrackedTables(trackedTables);
    return res.json({ success: true, message: "Audit configuration updated" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      });
    }
    logger.error("Route: Error updating audit config:", { error });
    return res.status(500).json({
      success: false,
      error: { message: "Failed to update audit configuration" },
    });
  }
});

// Restore endpoints
// prettier-ignore
router.post("/categories/:id/restore", async (req, res) => {
  // security
  try {
    emptyBodySchema.parse(req.body); // Validate no body data expected
    const id = validateIdParam(req, res, "id", "category");
    if (id === null) return; // Error response already sent

    const result = await withTimeout(getStorage().restoreCategory(id), 5000, "Restore category");
    return res.json({ success: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      });
    }
    logger.error("Route: Error restoring category:", { error });
    return res.status(500).json({
      success: false,
      error: { message: "Failed to restore category" },
    });
  }
});

// prettier-ignore
router.post("/products/:id/restore", async (req, res) => {
  // security
  try {
    emptyBodySchema.parse(req.body); // Validate no body data expected
    const id = validateIdParam(req, res, "id", "product");
    if (id === null) return; // Error response already sent

    const result = await withTimeout(getStorage().restoreProduct(id), 5000, "Restore product");
    return res.json({ success: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      });
    }
    logger.error("Route: Error restoring product:", { error });
    return res.status(500).json({
      success: false,
      error: { message: "Failed to restore product" },
    });
  }
});

// prettier-ignore
router.post("/media-assets/:id/restore", async (req, res) => {
  // security
  try {
    emptyBodySchema.parse(req.body); // Validate no body data expected
    const id = validateIdParam(req, res, "id", "media asset");
    if (id === null) return; // Error response already sent

    const result = await withTimeout(
      getStorage().restoreMediaAsset(id),
      5000,
      "Restore media asset",
    );
    return res.json({ success: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Validation error",
          details: error.issues,
        },
      });
    }
    logger.error("Route: Error restoring media asset:", { error });
    return res.status(500).json({
      success: false,
      error: { message: "Failed to restore media asset" },
    });
  }
});

export default router;
