/**
 * ADMIN SERVICE
 * Centralizes business logic for administrative operations,
 * data transformations, and system maintenance.
 */

import { z } from "zod";
import type { MediaAsset, Product } from "../../shared/schema.js";
import { getLifecycleScheduler } from "../lib/integrations/storage-lifecycle-scheduler.js";
import { logger } from "../lib/monitoring/logger.js";
import { withTimeout } from "../lib/resilience/request-timeout.js";
import { getStorage } from "../lib/storage-singleton.js";

export class AdminService {
  /**
   * Fetches and processes initial data for the admin products dashboard.
   * Eliminates the need for complex transformations in the route handler.
   */
  async getInitialProductsData() {
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

    const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];
    const safeMediaAssets = Array.isArray(mediaAssets) ? mediaAssets : [];

    // Filter for active/undeleted products
    const products = safeAllProducts.filter((p: Product) => p.isActive && !p.deletedAt);

    // Filter valid media assets
    const validMediaAssets = safeMediaAssets.filter(
      (asset): asset is MediaAsset =>
        typeof asset.filename === "string" && asset.filename !== "undefined",
    );

    // Calculate referenced media
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

    // Partition media assets
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

    return {
      products: enhancedProducts,
      categories: Array.isArray(categories) ? categories : [],
      fabrics: Array.isArray(fabrics) ? fabrics : [],
      mediaAssets: allMediaToSend,
      meta: {
        totalProducts: products.length,
        totalCategories: Array.isArray(categories) ? categories.length : 0,
        totalFabrics: Array.isArray(fabrics) ? fabrics.length : 0,
        totalMediaAssets: validMediaAssets.length,
        timestamp: Date.now(),
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
