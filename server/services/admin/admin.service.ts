/**
 * ADMIN SERVICE
 * Centralizes business logic for administrative operations,
 * data transformations, and system maintenance.
 */

import type { MediaAsset, Product } from "@run-remix/shared";
import { getLifecycleScheduler } from "../../lib/integrations/storage-lifecycle-scheduler.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import { getStorage } from "../../lib/storage-singleton.js";
import type { SessionUser } from "../../types/session.js";

export class AdminService {
  /**
   * Centralized audit logging.
   */
  async logAudit(data: {
    action: string;
    tableName: string;
    recordId: string;
    user?: SessionUser | undefined;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
    metadata?: Record<string, any>;
    newValues?: Record<string, any>;
    oldValues?: Record<string, any>;
  }) {
    return getStorage().createAuditLog({
      action: data.action,
      tableName: data.tableName,
      recordId: data.recordId,
      userId: data.user?.id,
      userEmail: data.user?.email,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      metadata: data.metadata,
      newValues: data.newValues,
      oldValues: data.oldValues,
    });
  }

  /**
   * Fetches and processes initial data for the admin products dashboard.
   * Eliminates the need for complex transformations in the route handler.
   */
  async getInitialProductsData(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;

    const [allProducts, totalProductsCount, categories, fabrics] = await withTimeout(
      Promise.all([
        getStorage().getProductsIncludingDeleted(limit, offset),
        getStorage().getProductsCount(),
        getStorage().getCategories(),
        getStorage().getFabrics(),
      ]),
      15000,
      "Fetch admin initial data",
    );

    const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];

    // Filter for active/undeleted products (though getProductsIncludingDeleted returns potentially deleted ones,
    // the UI might expect them if it's an admin view. The previous code filtered them:
    // const products = safeAllProducts.filter((p: Product) => p.isActive && !p.deletedAt);
    // But getProductsIncludingDeleted serves a purpose. If the admin needs to see deleted, we should keep them.
    // However, to maintain parity with previous logic which explicitly filtered them ONLY for "products" variable:
    const products = safeAllProducts.filter((p: Product) => p.isActive && !p.deletedAt);

    // Calculate referenced media IDs from the PAGINATED products
    const referencedMediaIds = new Set<number>();
    const enhancedProducts = products.map((product: Product) => {
      if (product.primaryImageId) referencedMediaIds.add(product.primaryImageId);
      if (product.primaryVideoId) referencedMediaIds.add(product.primaryVideoId);
      if (product.modelFileId) referencedMediaIds.add(product.modelFileId);

      if (Array.isArray(product.imageIds)) {
        product.imageIds.forEach((id: number | string) => {
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

    // Efficiently fetch ONLY referenced media assets + some recent ones
    // Validating IDs before passing to DB
    const validMediaIds = Array.from(referencedMediaIds).filter((id) => !isNaN(id));
    const mediaIdsStrings = validMediaIds.map((id) => id.toString());

    const [referencedMedia, recentMedia] = await Promise.all([
      mediaIdsStrings.length > 0
        ? getStorage().getMediaAssetsByIds(mediaIdsStrings)
        : Promise.resolve([]),
      getStorage().getMediaAssets(50, 0), // Fetch recent 50 for picker/general use
    ]);

    // Merge and deduplicate media assets
    const mediaMap = new Map<number, MediaAsset>();
    [...referencedMedia, ...recentMedia].forEach((asset) => {
      if (asset && typeof asset.filename === "string" && asset.filename !== "undefined") {
        mediaMap.set(asset.id, asset);
      }
    });

    const allMediaToSend = Array.from(mediaMap.values()).map((asset) => ({
      id: asset.id,
      filename: asset.filename,
      type: asset.type,
      url: asset.url || `/api/media/${asset.id}/content`,
      originalName: asset.originalName,
    }));

    return {
      products: enhancedProducts,
      categories: Array.isArray(categories) ? categories : [],
      fabrics: Array.isArray(fabrics) ? fabrics : [],
      mediaAssets: allMediaToSend,
      meta: {
        totalProducts: totalProductsCount,
        totalCategories: Array.isArray(categories) ? categories.length : 0,
        totalFabrics: Array.isArray(fabrics) ? fabrics.length : 0,
        totalMediaAssets: allMediaToSend.length, // This is count of *sent* media, not total in DB.
        timestamp: Date.now(),
        page,
        limit,
        totalPages: Math.ceil(totalProductsCount / limit),
      },
    };
  }

  /**
   * Corrects media URL corruption in category featured content.
   * Optimized to process in parallel chunks and filter before processing.
   */
  async fixCorruptedMedia(timeoutMs = 30000) {
    logger.debug(
      `AdminService: Starting cleanup of corrupted media URLs (timeout: ${timeoutMs}ms)`,
    );
    // Fetch all categories - this is fast
    const categories = await withTimeout(
      getStorage().getCategories(),
      10000,
      "Get all categories for media fix",
    );

    let fixedCount = 0;
    const fixedCategories: string[] = [];

    // Filter for categories that actually need updates (in memory optimization)
    const categoriesToUpdate = categories.filter((category) => {
      if (!category.featuredContent) return false;

      const content = category.featuredContent as any;
      const cardKeys = ["card1", "card2", "card3", "card4"];

      return cardKeys.some((key) => {
        const card = content[key];
        return (
          card?.mediaUrl &&
          (card.mediaUrl.includes("undefined") || card.mediaUrl === "/api/media/undefined/content")
        );
      });
    });

    if (categoriesToUpdate.length === 0) {
      logger.info("AdminService: No corrupted media URLs found.");
      return { fixedCount: 0, fixedCategories: [] };
    }

    logger.info(
      `AdminService: Found ${categoriesToUpdate.length} categories with corrupted media. Processing updates...`,
    );

    // Process updates in parallel with concurrency limit to avoid DB contention
    // Using a simple chunking strategy
    const CHUNK_SIZE = 5;
    for (let i = 0; i < categoriesToUpdate.length; i += CHUNK_SIZE) {
      const chunk = categoriesToUpdate.slice(i, i + CHUNK_SIZE);

      await Promise.all(
        chunk.map(async (category) => {
          const updatedFeaturedContent = { ...category.featuredContent } as any;
          let needsUpdate = false;

          // Apply fixes
          for (const cardKey of ["card1", "card2", "card3", "card4"] as const) {
            const card = updatedFeaturedContent[cardKey];
            if (card?.mediaUrl) {
              const mediaUrl = card.mediaUrl;
              if (mediaUrl.includes("undefined") || mediaUrl === "/api/media/undefined/content") {
                card.mediaUrl = "";
                needsUpdate = true;
              }
            }
          }

          if (needsUpdate) {
            const updateResult = await withTimeout(
              getStorage().updateCategory(category.id, {
                featuredContent: updatedFeaturedContent,
              }),
              timeoutMs, // Use configurable timeout per update operation
              `Update category ${category.id}`,
            );

            if (updateResult) {
              fixedCount++;
              fixedCategories.push(category.name);
            }
          }
        }),
      );
    }

    return {
      fixedCount,
      fixedCategories,
    };
  }

  /**
   * Triggers system storage cleanup.
   */
  async triggerCleanup(autoClean: boolean, timeoutMs = 60000) {
    const scheduler = getLifecycleScheduler();
    // Assuming scheduler runs in background/async, but if we await a report, we should timeout the wait
    // If runCleanup is long, we wrap it.
    const report = await withTimeout(
      scheduler.runCleanup(autoClean === false),
      timeoutMs,
      "Storage cleanup",
    );

    logger.info(`[AdminService] Storage cleanup triggered (autoClean: ${autoClean})`, {
      cleanedFiles: report.cleanedFiles.length,
      orphanedFiles: report.orphanedFiles.length,
      spaceSaved: report.spaceSaved,
    });

    return report;
  }

  /**
   * Updates enterprise audit configuration.
   */
  async updateAuditConfig(config: { enabled?: boolean; trackedTables?: string[] }) {
    if (typeof config.enabled === "boolean") {
      getStorage().setAuditTrailEnabled(config.enabled);
    }
    if (Array.isArray(config.trackedTables)) {
      getStorage().configureTrackedTables(config.trackedTables);
    }
    return true;
  }
}

export const adminService = new AdminService();
