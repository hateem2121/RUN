import { err, ok, type Result } from "neverthrow";
import { safeQuery } from "../db.js";
import { AppError, DatabaseError, NotFoundError } from "../lib/errors.js";
import { CacheKeys, CacheOperations } from "../lib/cache/cache-strategies.js";
import { unifiedCache } from "../lib/cache/unified-cache.js";
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
  static async getItems(bypassCache = false): Promise<Result<{ data: any[]; metadata: any }, AppError>> {
    const startTime = performance.now();
    const storage = getStorage();

    // Admin/Bypass path
    if (bypassCache) {
      logger.info("[Navigation] Bypassing cache for real-time data");
      const result = await safeQuery(
        withTimeout(storage.getNavigationItems(), 5000, "Get navigation items (bypass)")
      );

      if (result.isErr()) return err(result.error);

      return ok({
        data: NavigationService.normalizeItems(result.value),
        metadata: {
          cacheHit: false,
          responseTime: performance.now() - startTime,
          ttl: 0,
        },
      });
    }

    // Public/Cached path
    const cacheKey = CacheKeys.navigation.items();
    const cached = await unifiedCache.get(cacheKey);

    if (cached) {
      const items = Array.isArray(cached) ? cached : [cached];
      return ok({
        data: NavigationService.normalizeItems(items),
        metadata: {
          cacheHit: true,
          responseTime: performance.now() - startTime,
          ttl: CACHE_TTL_NAVIGATION,
        },
      });
    }

    // Cache miss
    const result = await safeQuery(
      withTimeout(storage.getNavigationItems(), 5000, "Get navigation items")
    );

    if (result.isErr()) return err(result.error);

    const normalized = NavigationService.normalizeItems(result.value);
    await unifiedCache.set(cacheKey, normalized, CACHE_TTL_NAVIGATION * 1000);

    return ok({
      data: normalized,
      metadata: {
        cacheHit: false,
        responseTime: performance.now() - startTime,
        ttl: CACHE_TTL_NAVIGATION,
      },
    });
  }

  static async getItem(id: number): Promise<Result<any, AppError>> {
    const result = await safeQuery(
      withTimeout(getStorage().getNavigationItem(id), 5000, "Get navigation item")
    );

    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new NotFoundError(`Navigation item ${id} not found`));

    return ok(result.value);
  }

  static async createItem(data: any): Promise<Result<any, AppError>> {
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

    const result = await safeQuery(
      withTimeout(getStorage().createNavigationItem(itemData), 5000, "Create navigation item")
    );

    if (result.isErr()) return err(result.error);

    // Invalidate cache
    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed:", err)
    );

    return ok(result.value);
  }

  static async updateItem(id: number, data: any): Promise<Result<any, AppError>> {
    const updateData = removeUndefined({
      ...data,
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.showOnDesktop !== undefined && { showOnDesktop: data.showOnDesktop }),
      ...(data.showOnMobile !== undefined && { showOnMobile: data.showOnMobile }),
    });

    const result = await safeQuery(
      withTimeout(getStorage().updateNavigationItem(id, updateData), 5000, "Update navigation item")
    );

    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new NotFoundError(`Navigation item ${id} not found`));

    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed:", err)
    );

    return ok(result.value);
  }

  static async deleteItem(id: number): Promise<Result<void, AppError>> {
    const result = await safeQuery(
      withTimeout(getStorage().deleteNavigationItem(id), 5000, "Delete navigation item")
    );

    if (result.isErr()) return err(result.error);
    if (!result.value) return err(new NotFoundError(`Navigation item ${id} not found`));

    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed:", err)
    );

    return ok(undefined);
  }

  static async reorderItems(items: { id: number; sortOrder: number }[]): Promise<Result<any[], AppError>> {
    const storage = getStorage();

    // Sequential update
    for (const item of items) {
      const result = await safeQuery(
         storage.updateNavigationItem(item.id, { sortOrder: item.sortOrder })
      );
      
      if (result.isErr()) return err(result.error);
      if (!result.value) return err(new NotFoundError(`Navigation item ${item.id} not found during reorder`));
    }

    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed:", err)
    );

    // Return updated list - recursive call to getItems needs error handling
    const getResult = await NavigationService.getItems(true);
    if (getResult.isErr()) return err(getResult.error);
    
    return ok(getResult.value.data);
  }

  static async getGlassmorphismSettings(): Promise<Result<any, AppError>> {
    const cacheKey = "navigation-glassmorphism-settings";
    const cached = await unifiedCache.get(cacheKey);
    if (cached) return ok(cached);

    const result = await safeQuery(
      withTimeout(
        getStorage().getNavigationGlassmorphismSettings(),
        5000,
        "Get glassmorphism settings"
      )
    );

    if (result.isErr()) return err(result.error);

    const settings = result.value || {
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

    await unifiedCache.set(cacheKey, settings, CACHE_TTL_STATIC * 1000);
    return ok(settings);
  }

  static async updateGlassmorphismSettings(data: any): Promise<Result<any, AppError>> {
    const settingsData = {
      ...data,
      opacity: data.opacity !== undefined ? String(data.opacity) : undefined,
    };

    const result = await safeQuery(
      withTimeout(
        getStorage().updateNavigationGlassmorphismSettings(settingsData),
        5000,
        "Update glassmorphism settings"
      )
    );

    if (result.isErr()) return err(result.error);

    await unifiedCache.delete("navigation-glassmorphism-settings");
    return ok(result.value);
  }
}
