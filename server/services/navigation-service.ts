import { err, ok, type Result } from "neverthrow";
import type {
  InsertNavigationItem,
  NavigationGlassmorphismSettings,
  NavigationItem,
} from "../../shared/index.js";
import { safeQuery } from "../db.js";
import { CacheKeys, CacheOperations } from "../lib/cache/cache-strategies.js";
import { unifiedCache } from "../lib/cache/unified-cache.js";
import { miscRepository } from "../lib/db/repositories/index.js";
import { type AppError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { withTimeout } from "../lib/resilience/request-timeout.js";
import { removeUndefined } from "../utils.js";

const CACHE_TTL_NAVIGATION = 7200; // 2 hours
const CACHE_TTL_STATIC = 10800; // 3 hours

/**
 * Normalize navigation items for frontend consumption
 */
const normalizeItems = (items: NavigationItem[]): NavigationItem[] => {
  return items.map((item) => ({
    ...item,
    title: item.title || "",
    label: item.label || "",
    href: item.href || "#",
  }));
};

export const NavigationService = {
  /**
   * Get all navigation items with caching strategy
   */
  getItems: async (
    bypassCache = false,
  ): Promise<
    Result<
      {
        data: NavigationItem[];
        metadata: { cacheHit: boolean; responseTime: number; ttl: number };
      },
      AppError
    >
  > => {
    const startTime = performance.now();
    const storage = miscRepository;

    // Admin/Bypass path
    if (bypassCache) {
      logger.info("[Navigation] Bypassing cache for real-time data", { bypassCache });
      const result = await safeQuery(
        withTimeout(storage.getNavigationItems(), 5000, "Get navigation items (bypass)"),
      );

      if (result.isErr()) {
        return err(result.error);
      }

      return ok({
        data: normalizeItems(result.value),
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
        data: normalizeItems(items),
        metadata: {
          cacheHit: true,
          responseTime: performance.now() - startTime,
          ttl: CACHE_TTL_NAVIGATION,
        },
      });
    }

    // Cache miss
    const result = await safeQuery(
      withTimeout(storage.getNavigationItems(), 5000, "Get navigation items"),
    );

    if (result.isErr()) {
      return err(result.error);
    }

    const normalized = normalizeItems(result.value);
    await unifiedCache.set(cacheKey, normalized, CACHE_TTL_NAVIGATION);

    return ok({
      data: normalized,
      metadata: {
        cacheHit: false,
        responseTime: performance.now() - startTime,
        ttl: CACHE_TTL_NAVIGATION,
      },
    });
  },

  getItem: async (id: number): Promise<Result<NavigationItem, AppError>> => {
    const result = await safeQuery(
      withTimeout(miscRepository.getNavigationItem(id), 5000, "Get navigation item"),
    );

    if (result.isErr()) {
      return err(result.error);
    }
    if (!result.value) {
      return err(new NotFoundError(`Navigation item ${id} not found`));
    }

    return ok(result.value);
  },

  createItem: async (
    data: Partial<InsertNavigationItem>,
  ): Promise<Result<NavigationItem, AppError>> => {
    // Transform logic
    const itemData = {
      title: data.title || data.label || "Untitled",
      label: data.label || data.title || "Untitled",
      href: data.href || data.url || "#",
      url: data.url || data.href || "#",
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
      withTimeout(miscRepository.createNavigationItem(itemData), 5000, "Create navigation item"),
    );

    if (result.isErr()) {
      return err(result.error);
    }

    // Invalidate cache
    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed", { error: err }),
    );

    return ok(result.value);
  },

  updateItem: async (
    id: number,
    data: Partial<InsertNavigationItem>,
  ): Promise<Result<NavigationItem, AppError>> => {
    const updateData = removeUndefined({
      ...data,
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.showOnDesktop !== undefined && { showOnDesktop: data.showOnDesktop }),
      ...(data.showOnMobile !== undefined && { showOnMobile: data.showOnMobile }),
    });

    const result = await safeQuery(
      withTimeout(
        miscRepository.updateNavigationItem(id, updateData),
        5000,
        "Update navigation item",
      ),
    );

    if (result.isErr()) {
      return err(result.error);
    }
    if (!result.value) {
      return err(new NotFoundError(`Navigation item ${id} not found`));
    }

    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed", { error: err }),
    );

    return ok(result.value);
  },

  deleteItem: async (id: number): Promise<Result<void, AppError>> => {
    const result = await safeQuery(
      withTimeout(miscRepository.deleteNavigationItem(id), 5000, "Delete navigation item"),
    );

    if (result.isErr()) {
      return err(result.error);
    }
    if (!result.value) {
      return err(new NotFoundError(`Navigation item ${id} not found`));
    }

    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed", { error: err }),
    );

    return ok(undefined);
  },

  reorderItems: async (
    items: { id: number; sortOrder: number }[],
  ): Promise<Result<NavigationItem[], AppError>> => {
    const storage = miscRepository;

    const result = await safeQuery(
      withTimeout(storage.reorderNavigationItems(items), 5000, "Reorder navigation items"),
    );

    if (result.isErr()) {
      return err(result.error);
    }

    await CacheOperations.invalidateNavigation().catch((err) =>
      logger.error("[Navigation] Cache invalidation failed", { error: err }),
    );

    // Return updated list - recursive call to getItems needs error handling
    const getResult = await NavigationService.getItems(true);
    if (getResult.isErr()) {
      return err(getResult.error);
    }

    return ok(getResult.value.data);
  },

  getGlassmorphismSettings: async (): Promise<
    Result<NavigationGlassmorphismSettings | Partial<NavigationGlassmorphismSettings>, AppError>
  > => {
    const cacheKey = "navigation-glassmorphism-settings";
    const cached = await unifiedCache.get(cacheKey);
    if (cached) {
      return ok(cached);
    }

    const result = await safeQuery(
      withTimeout(
        miscRepository.getNavigationGlassmorphismSettings(),
        5000,
        "Get glassmorphism settings",
      ),
    );

    if (result.isErr()) {
      return err(result.error);
    }

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

    await unifiedCache.set(cacheKey, settings, CACHE_TTL_STATIC);
    return ok(settings);
  },

  updateGlassmorphismSettings: async (
    data: Partial<NavigationGlassmorphismSettings>,
  ): Promise<Result<NavigationGlassmorphismSettings | Record<string, unknown>, AppError>> => {
    const settingsData = {
      ...data,
      opacity: data.opacity !== undefined ? String(data.opacity) : undefined,
    };

    const result = await safeQuery(
      withTimeout(
        miscRepository.updateNavigationGlassmorphismSettings(settingsData),
        5000,
        "Update glassmorphism settings",
      ),
    );

    if (result.isErr()) {
      return err(result.error);
    }

    await unifiedCache.delete("navigation-glassmorphism-settings");
    return ok(result.value);
  },
};
