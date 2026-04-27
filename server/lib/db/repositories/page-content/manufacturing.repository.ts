import { asc, eq, sql } from "drizzle-orm";
import {
  type InsertManufacturingCapability,
  type InsertManufacturingHero,
  type InsertManufacturingProcess,
  type InsertManufacturingQuality,
  type ManufacturingCapability,
  type ManufacturingHero,
  type ManufacturingProcess,
  type ManufacturingQuality,
  manufacturingCapabilities,
  manufacturingHero,
  manufacturingProcesses,
  manufacturingQualities,
} from "../../../../../shared/index.js";
import { db } from "../../../../db.js";
import { emitCacheInvalidation } from "../../../cache/cache-events.js";
import { UnifiedCache } from "../../../cache/unified-cache.js";
import { StorageSingleton } from "../../../storage-singleton.js";

const unifiedCache = UnifiedCache.getInstance();
const HOMEPAGE_CACHE_TTL = 3600; // 1 hour (in seconds)

export class ManufacturingRepository {
  async getManufacturingHero(): Promise<ManufacturingHero | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getManufacturingHero();
    }
    const cacheKey = "manufacturing:hero";
    const cached = await unifiedCache.get<ManufacturingHero>(cacheKey);
    if (cached) return cached;

    const [hero] = await db.select().from(manufacturingHero).limit(1);
    if (hero) {
      unifiedCache.set(cacheKey, hero, HOMEPAGE_CACHE_TTL);
    }
    return hero ?? undefined;
  }

  async updateManufacturingHero(
    data: Partial<InsertManufacturingHero>,
  ): Promise<ManufacturingHero> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateManufacturingHero(data);
    }
    const existing = await this.getManufacturingHero();
    await unifiedCache.del("manufacturing:hero");

    if (existing) {
      const [updated] = await db
        .update(manufacturingHero)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(manufacturingHero.id, existing.id))
        .returning();
      if (!updated) throw new Error("Failed to update manufacturing hero");
      await emitCacheInvalidation("manufacturing:hero", "update");
      return updated;
    } else {
      const [created] = await db
        .insert(manufacturingHero)
        .values(data as unknown as InsertManufacturingHero)
        .returning();
      if (!created) throw new Error("Failed to create manufacturing hero");
      await emitCacheInvalidation("manufacturing:hero", "create");
      return created;
    }
  }

  async createManufacturingCapability(
    data: InsertManufacturingCapability,
  ): Promise<ManufacturingCapability> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createManufacturingCapability(data);
    }
    const maxOrder = await db
      .select({ max: sql<number>`MAX(${manufacturingCapabilities.sortOrder})` })
      .from(manufacturingCapabilities);
    const newOrder = (Number(maxOrder[0]?.max) || 0) + 1;

    const [created] = await db
      .insert(manufacturingCapabilities)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    if (!created) throw new Error("Failed to create manufacturing capability");
    await unifiedCache.del("manufacturing:capabilities:*");
    await emitCacheInvalidation("manufacturing:capabilities", "create");
    return created;
  }

  async getManufacturingCapabilities(includeInactive = false): Promise<ManufacturingCapability[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getManufacturingCapabilities(includeInactive);
    }
    let query = db.select().from(manufacturingCapabilities).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(manufacturingCapabilities.isActive, true));
    }

    return query.orderBy(asc(manufacturingCapabilities.sortOrder));
  }

  async getManufacturingCapability(id: number): Promise<ManufacturingCapability | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getManufacturingCapability(id);
    }
    const [capability] = await db
      .select()
      .from(manufacturingCapabilities)
      .where(eq(manufacturingCapabilities.id, id))
      .limit(1);
    return capability ?? undefined;
  }

  async updateManufacturingCapability(
    id: number,
    data: Partial<InsertManufacturingCapability>,
  ): Promise<ManufacturingCapability> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateManufacturingCapability(id, data);
      if (!result) throw new Error(`updateManufacturingCapability returned undefined for id ${id}`);
      return result;
    }
    await unifiedCache.del("manufacturing:capabilities:*");
    const [updated] = await db
      .update(manufacturingCapabilities)
      .set(data)
      .where(eq(manufacturingCapabilities.id, id))
      .returning();

    if (!updated) throw new Error(`Failed to update manufacturing capability with id ${id}`);
    await emitCacheInvalidation("manufacturing:capabilities", "update");
    return updated;
  }

  async deleteManufacturingCapability(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteManufacturingCapability(id);
    }
    await unifiedCache.del("manufacturing:capabilities:*");
    const result = await db
      .delete(manufacturingCapabilities)
      .where(eq(manufacturingCapabilities.id, id));
    await emitCacheInvalidation("manufacturing:capabilities", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderManufacturingCapabilities(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderManufacturingCapabilities(orderedIds);
    }
    await unifiedCache.del("manufacturing:capabilities:*");
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(manufacturingCapabilities)
          .set({ sortOrder: i + 1 })
          .where(eq(manufacturingCapabilities.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("manufacturing:capabilities", "update");
  }

  async getManufacturingProcess(id: number): Promise<ManufacturingProcess | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getManufacturingProcess(id);
    }
    const [process] = await db
      .select()
      .from(manufacturingProcesses)
      .where(eq(manufacturingProcesses.id, id))
      .limit(1);
    return process ?? undefined;
  }

  async getManufacturingProcesses(includeInactive = false): Promise<ManufacturingProcess[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getManufacturingProcesses(includeInactive);
    }
    let query = db.select().from(manufacturingProcesses).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(manufacturingProcesses.isActive, true));
    }

    return query.orderBy(asc(manufacturingProcesses.sortOrder));
  }

  async createManufacturingProcess(
    data: InsertManufacturingProcess,
  ): Promise<ManufacturingProcess> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createManufacturingProcess(data);
    }
    const maxOrder = await db
      .select({ max: sql<number>`MAX(${manufacturingProcesses.sortOrder})` })
      .from(manufacturingProcesses);
    const newOrder = (Number(maxOrder[0]?.max) || 0) + 1;

    const [created] = await db
      .insert(manufacturingProcesses)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    if (!created) throw new Error("Failed to create manufacturing process");
    await unifiedCache.del("manufacturing:processes:*");
    await emitCacheInvalidation("manufacturing:processes", "create");
    return created;
  }

  async updateManufacturingProcess(
    id: number,
    data: Partial<InsertManufacturingProcess>,
  ): Promise<ManufacturingProcess> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateManufacturingProcess(id, data);
      if (!result) throw new Error(`updateManufacturingProcess returned undefined for id ${id}`);
      return result;
    }
    await unifiedCache.del("manufacturing:processes:*");
    const [updated] = await db
      .update(manufacturingProcesses)
      .set(data)
      .where(eq(manufacturingProcesses.id, id))
      .returning();

    if (!updated) throw new Error(`Failed to update manufacturing process with id ${id}`);
    await emitCacheInvalidation("manufacturing:processes", "update");
    return updated;
  }

  async deleteManufacturingProcess(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteManufacturingProcess(id);
    }
    await unifiedCache.del("manufacturing:processes:*");
    const result = await db.delete(manufacturingProcesses).where(eq(manufacturingProcesses.id, id));
    await emitCacheInvalidation("manufacturing:processes", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderManufacturingProcesses(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderManufacturingProcesses(orderedIds);
    }
    await unifiedCache.del("manufacturing:processes:*");
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(manufacturingProcesses)
          .set({ sortOrder: i + 1 })
          .where(eq(manufacturingProcesses.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("manufacturing:processes", "update");
  }

  async getManufacturingQuality(id: number): Promise<ManufacturingQuality | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getManufacturingQuality(id);
    }
    const [quality] = await db
      .select()
      .from(manufacturingQualities)
      .where(eq(manufacturingQualities.id, id))
      .limit(1);
    return quality ?? undefined;
  }

  async getManufacturingQualities(includeInactive = false): Promise<ManufacturingQuality[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getManufacturingQualities(includeInactive);
    }
    let query = db.select().from(manufacturingQualities).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(manufacturingQualities.isActive, true));
    }

    return query.orderBy(asc(manufacturingQualities.sortOrder));
  }

  async createManufacturingQuality(
    data: InsertManufacturingQuality,
  ): Promise<ManufacturingQuality> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createManufacturingQuality(data);
    }
    const maxOrder = await db
      .select({ max: sql<number>`MAX(${manufacturingQualities.sortOrder})` })
      .from(manufacturingQualities);
    const newOrder = (Number(maxOrder[0]?.max) || 0) + 1;

    const [created] = await db
      .insert(manufacturingQualities)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    if (!created) throw new Error("Failed to create manufacturing quality");
    await unifiedCache.del("manufacturing:qualities:*");
    await emitCacheInvalidation("manufacturing:qualities", "create");
    return created;
  }

  async updateManufacturingQuality(
    id: number,
    data: Partial<InsertManufacturingQuality>,
  ): Promise<ManufacturingQuality> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateManufacturingQuality(id, data);
      if (!result) throw new Error(`updateManufacturingQuality returned undefined for id ${id}`);
      return result;
    }
    await unifiedCache.del("manufacturing:qualities:*");
    const [updated] = await db
      .update(manufacturingQualities)
      .set(data)
      .where(eq(manufacturingQualities.id, id))
      .returning();

    if (!updated) throw new Error(`Failed to update manufacturing quality with id ${id}`);
    await emitCacheInvalidation("manufacturing:qualities", "update");
    return updated;
  }

  async deleteManufacturingQuality(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteManufacturingQuality(id);
    }
    await unifiedCache.del("manufacturing:qualities:*");
    const result = await db.delete(manufacturingQualities).where(eq(manufacturingQualities.id, id));
    await emitCacheInvalidation("manufacturing:qualities", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderManufacturingQualities(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderManufacturingQualities(orderedIds);
    }
    await unifiedCache.del("manufacturing:qualities:*");
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(manufacturingQualities)
          .set({ sortOrder: i + 1 })
          .where(eq(manufacturingQualities.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("manufacturing:qualities", "update");
  }
}

export const manufacturingRepository = new ManufacturingRepository();
