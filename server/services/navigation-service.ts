import { err, ok, type Result } from "neverthrow";
import type {
  InsertNavigationItem,
  NavigationGlassmorphismSettings,
  NavigationItem,
} from "../../shared/index.js";
import { safeQuery } from "../db.js";
import { CacheKeys, CacheOperations } from "../lib/cache/cache-strategies.js";
import { twoTierBatchCache } from "../lib/cache/two-tier-batch.js";
import { unifiedCache } from "../lib/cache/unified-cache.js";
import { miscRepository } from "../lib/db/repositories/index.js";
import { AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { withTimeout } from "../lib/resilience/request-timeout.js";
import { removeUndefined } from "../lib/utilities/core-utils.js";

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
   * Get all navigation items with two-tier caching strategy (PC-403)
   */
  getItems: async (
    bypassCache = false,
  ): Promise<
    Result<
      {
        data: NavigationItem[];
        metadata: { cacheHit: string; responseTime: number; ttl: number };
      },
      AppError
    >
  > => {
    const startTime = performance.now();
    const cacheKey = CacheKeys.navigation.items();

    try {
      const { data, benchmark } = (await twoTierBatchCache.get(
        cacheKey,
        async () => {
          const result = await safeQuery(
            withCircuit(
              "get-navigation-items",
              () => withTimeout(miscRepository.getNavigationItems(), 5000, "Get navigation items"),
              DB_CIRCUIT_OPTIONS,
            ),
          );

          if (result.isErr()) throw result.error;
          return normalizeItems(result.value);
        },
        {
          bypassCache,
          swrConfig: {
            ttl: CACHE_TTL_NAVIGATION * 1000,
            staleWhileRevalidate: CACHE_TTL_NAVIGATION * 2 * 1000,
          },
        },
      )) || { data: [], benchmark: { hit: "MISS" } };

      if (!data) {
        return ok({
          data: [],
          metadata: {
            cacheHit: "MISS",
            responseTime: performance.now() - startTime,
            ttl: 0,
          },
        });
      }

      return ok({
        data: data as NavigationItem[],
        metadata: {
          cacheHit: benchmark.hit,
          responseTime: performance.now() - startTime,
          ttl: CACHE_TTL_NAVIGATION,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        return err(error);
      }
      return err(new InternalError("Failed to fetch navigation items", { error }));
    }
  },

  getItem: async (id: number): Promise<Result<NavigationItem, AppError>> => {
    const result = await safeQuery(
      withCircuit(
        "get-navigation-item",
        () => withTimeout(miscRepository.getNavigationItem(id), 5000, "Get navigation item"),
        DB_CIRCUIT_OPTIONS,
      ),
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
      withCircuit(
        "create-navigation-item",
        () =>
          withTimeout(
            miscRepository.createNavigationItem(itemData),
            5000,
            "Create navigation item",
          ),
        DB_CIRCUIT_OPTIONS,
      ),
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
      withCircuit(
        "update-navigation-item",
        () =>
          withTimeout(
            miscRepository.updateNavigationItem(id, updateData),
            5000,
            "Update navigation item",
          ),
        DB_CIRCUIT_OPTIONS,
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
      withCircuit(
        "delete-navigation-item",
        () => withTimeout(miscRepository.deleteNavigationItem(id), 5000, "Delete navigation item"),
        DB_CIRCUIT_OPTIONS,
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

    return ok(undefined);
  },

  reorderItems: async (
    items: { id: number; sortOrder: number }[],
  ): Promise<Result<NavigationItem[], AppError>> => {
    const storage = miscRepository;

    const result = await safeQuery(
      withCircuit(
        "reorder-navigation-items",
        () => withTimeout(storage.reorderNavigationItems(items), 5000, "Reorder navigation items"),
        DB_CIRCUIT_OPTIONS,
      ),
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
      withCircuit(
        "get-glassmorphism-settings",
        () =>
          withTimeout(
            miscRepository.getNavigationGlassmorphismSettings(),
            5000,
            "Get glassmorphism settings",
          ),
        DB_CIRCUIT_OPTIONS,
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
      withCircuit(
        "update-glassmorphism-settings",
        () =>
          withTimeout(
            miscRepository.updateNavigationGlassmorphismSettings(settingsData),
            5000,
            "Update glassmorphism settings",
          ),
        DB_CIRCUIT_OPTIONS,
      ),
    );

    if (result.isErr()) {
      return err(result.error);
    }

    await unifiedCache.delete("navigation-glassmorphism-settings");
    return ok(result.value);
  },
};
