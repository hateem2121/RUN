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

export class AdminService {
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
   */
  async fixCorruptedMedia() {
    logger.debug("AdminService: Starting cleanup of corrupted media URLs");
    const categories = await withTimeout(getStorage().getCategories(), 10000, "Get categories");

    let fixedCount = 0;
    const fixedCategories: string[] = [];

    for (const category of categories) {
      if (category.featuredContent) {
        let needsUpdate = false;
        const updatedFeaturedContent = { ...category.featuredContent };

        for (const cardKey of ["card1", "card2", "card3", "card4"] as const) {
          const card = updatedFeaturedContent[
            cardKey as keyof typeof updatedFeaturedContent
          ] as any;
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

    return {
      fixedCount,
      fixedCategories,
    };
  }

  /**
   * Triggers system storage cleanup.
   */
  async triggerCleanup(autoClean: boolean) {
    const scheduler = getLifecycleScheduler();
    const report = await scheduler.runCleanup(autoClean === false);

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
