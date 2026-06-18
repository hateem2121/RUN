import { asc, eq } from "drizzle-orm";
import { type InsertService, type Service, services } from "../../../../../shared/index.js";
import { db } from "../../../../db.js";
import { invalidateHtmlCache } from "../../../../middleware/ssr-cache.js";
import { emitCacheInvalidation } from "../../../cache/cache-events.js";
import { UnifiedCache } from "../../../cache/unified-cache.js";
import { logger } from "../../../monitoring/logger.js";
import { StorageSingleton } from "../../../storage-singleton.js";

const unifiedCache = UnifiedCache.getInstance();
const SERVICES_CACHE_TTL = 3600; // 1 hour (in seconds)

class ServicesRepository {
  async getServices(includeInactive = false): Promise<Service[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getServices(includeInactive);
    }
    const cacheKey = includeInactive ? "services:all" : "services";
    try {
      const cached = await unifiedCache.get<Service[]>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get services from cache:", error);
    }

    const startTime = performance.now();
    let query = db.select().from(services).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(services.isActive, true));
    }
    const result = await query.orderBy(asc(services.sortOrder));
    const duration = performance.now() - startTime;

    try {
      await unifiedCache.set(cacheKey, result, SERVICES_CACHE_TTL, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set services cache:", error);
    }

    if (duration > 50) {
      logger.debug(
        `[Performance] getServices took ${duration.toFixed(
          2,
        )}ms (threshold: 50ms) - CACHED for future requests`,
      );
    }
    return result;
  }

  async getService(id: number): Promise<Service | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getService(id);
    }
    const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
    return service ?? undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createService(service);
    }
    await unifiedCache.del("services");
    await unifiedCache.del("services:all");
    const [created] = await db.insert(services).values(service).returning();
    if (!created) throw new Error("Failed to create service");
    await emitCacheInvalidation("services", "create");
    await invalidateHtmlCache("/services");
    return created;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateService(id, service);
    }
    await unifiedCache.del("services");
    await unifiedCache.del("services:all");
    const [updated] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();

    if (!updated) return undefined;
    await emitCacheInvalidation("services", "update");
    await invalidateHtmlCache("/services");
    return updated;
  }

  async deleteService(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteService(id);
    }
    await unifiedCache.del("services");
    await unifiedCache.del("services:all");
    const result = await db.delete(services).where(eq(services.id, id));
    await emitCacheInvalidation("services", "delete");
    await invalidateHtmlCache("/services");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderServices(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      const storage = StorageSingleton.getInstance();
      if (storage.reorderServices) {
        return storage.reorderServices(orderedIds);
      }
      return;
    }
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i] as number;
        await tx
          .update(services)
          .set({ sortOrder: i + 1 })
          .where(eq(services.id, id));
      }
    });

    await unifiedCache.del("services");
    await unifiedCache.del("services:all");
    await emitCacheInvalidation("services", "update");
    await invalidateHtmlCache("/services");
  }
}

export const servicesRepository = new ServicesRepository();
