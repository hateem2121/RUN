import { z } from "zod";
import { CacheKeys, CacheOperations } from "../lib/cache/cache-strategies.js";
import { unifiedCache } from "../lib/cache/unified-cache.js";
import { ApiError } from "../lib/errors/api-error.js";
import { logger } from "../lib/monitoring/logger.js";
import { withTimeout } from "../lib/resilience/request-timeout.js";
import { getStorage } from "../lib/storage-singleton.js";
import { removeUndefined } from "../utils.js";

const CACHE_TTL_NAVIGATION = 7200; // 2 hours
const CACHE_TTL_STATIC = 10800; // 3 hours

export class NavigationService {
  /**
   * Normalize navigation items for frontend consumption
   */
  private static normalizeItems(items: any[]) {
    return items.map((item) => ({
      ...item,
      title: item.title || item.label || "",
      href: item.href || item.url || "#",
    }));
  }

  /**
   * Get all navigation items with caching strategy
   */
  static async getItems(bypassCache = false) {
    const startTime = performance.now();
    const storage = getStorage();

    // Admin/Bypass path
    if (bypassCache) {
      logger.info("[Navigation] Bypassing cache for real-time data");
      const items = await withTimeout(
        storage.getNavigationItems(),
        5000,
        "Get navigation items (bypass)",
      );
      return {
        data: NavigationService.normalizeItems(items),
        metadata: {
          cacheHit: false,
          responseTime: performance.now() - startTime,
          ttl: 0,
        },
      };
    }

    // Public/Cached path
    const cacheKey = CacheKeys.navigation.items();
    const cached = await unifiedCache.get(cacheKey);

    if (cached) {
      const items = Array.isArray(cached) ? cached : [cached];
      return {
        data: NavigationService.normalizeItems(items),
        metadata: {
          cacheHit: true,
          responseTime: performance.now() - startTime,
          ttl: CACHE_TTL_NAVIGATION,
        },
      };
    }

    // Cache miss
    const items = await withTimeout(storage.getNavigationItems(), 5000, "Get navigation items");
    const normalized = NavigationService.normalizeItems(items);
    await unifiedCache.set(cacheKey, normalized, CACHE_TTL_NAVIGATION * 1000);

    return {
      data: normalized,
      metadata: {
        cacheHit: false,
        responseTime: performance.now() - startTime,
        ttl: CACHE_TTL_NAVIGATION,
      },
    };
  }

  static async getItem(id: number) {
    const item = await withTimeout(getStorage().getNavigationItem(id), 5000, "Get navigation item");
    if (!item) throw ApiError.notFound(`Navigation item ${id} not found`);
    return item;
  }

  static async createItem(data: any) {
    // Transform logic
    const itemData = {
      title: data.title || data.label || "Untitled",
      href: data.href || data.url || "#",
      label: data.title || data.label || "Untitled",
      url: data.href || data.url || "#",
      iconType: data.iconType,
      iconSize: data.iconSize,
      fallbackIcon: data.fallbackIcon,
      mediaIconId: data.mediaIconId,
      sortOrder: data.sortOrder,
      isActive: data.isActive ?? true,
      showOnDesktop: data.showOnDesktop ?? true,
      showOnMobile: data.showOnMobile ?? true,
    };

    const newItem = await withTimeout(
      getStorage().createNavigationItem(itemData),
      5000,
      "Create navigation item",
    );

    // Invalidate cache
    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed:", err),
    );

    return newItem;
  }

  static async updateItem(id: number, data: any) {
    const updateData = removeUndefined({
      ...data,
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.showOnDesktop !== undefined && { showOnDesktop: data.showOnDesktop }),
      ...(data.showOnMobile !== undefined && { showOnMobile: data.showOnMobile }),
    });

    const updated = await withTimeout(
      getStorage().updateNavigationItem(id, updateData),
      5000,
      "Update navigation item",
    );

    if (!updated) throw ApiError.notFound(`Navigation item ${id} not found`);

    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed:", err),
    );

    return updated;
  }

  static async deleteItem(id: number) {
    const success = await withTimeout(
      getStorage().deleteNavigationItem(id),
      5000,
      "Delete navigation item",
    );

    if (!success) throw ApiError.notFound(`Navigation item ${id} not found`);

    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed:", err),
    );
  }

  static async reorderItems(items: { id: number; sortOrder: number }[]) {
    const storage = getStorage();

    // Sequential update (Atomic transaction not supported by NEON HTTP driver yet)
    // Using Promise.all would be faster but less safe if one fails
    // Sticking to sequential for robustness as per original logic
    for (const item of items) {
      const result = await storage.updateNavigationItem(item.id, { sortOrder: item.sortOrder });
      if (!result) throw ApiError.notFound(`Navigation item ${item.id} not found during reorder`);
    }

    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed:", err),
    );

    // Return updated list
    const { data } = await NavigationService.getItems(true);
    return data;
  }

  static async getGlassmorphismSettings() {
    const cacheKey = "navigation-glassmorphism-settings";
    const cached = await unifiedCache.get(cacheKey);
    if (cached) return cached;

    const settings = await withTimeout(
      getStorage().getNavigationGlassmorphismSettings(),
      5000,
      "Get glassmorphism settings",
    );

    const result = settings || {
      enabled: true,
      backgroundOpacity: "15",
      blurStrength: 5,
      borderOpacity: "30",
      shadowIntensity: "10",
      topHighlightOpacity: "80",
      leftHighlightOpacity: "80",
      innerShadowOpacity: "50",
      borderRadius: 20,
    };

    await unifiedCache.set(cacheKey, result, CACHE_TTL_STATIC * 1000);
    return result;
  }

  static async updateGlassmorphismSettings(data: any) {
    const settingsData = {
      ...data,
      opacity: data.opacity !== undefined ? String(data.opacity) : undefined,
    };

    const settings = await withTimeout(
      getStorage().updateNavigationGlassmorphismSettings(settingsData),
      5000,
      "Update glassmorphism settings",
    );

    await unifiedCache.delete("navigation-glassmorphism-settings");
    return settings;
  }
}
