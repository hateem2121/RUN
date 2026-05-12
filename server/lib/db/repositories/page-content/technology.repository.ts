import { asc, eq, sql } from "drizzle-orm";
import {
  type InsertTechnologyCta,
  type InsertTechnologyEquipment,
  type InsertTechnologyGradientSettings,
  type InsertTechnologyHero,
  type InsertTechnologyInnovation,
  type InsertTechnologyResearch,
  type InsertTechnologyRoadmap,
  type TechnologyCta,
  type TechnologyEquipment,
  type TechnologyGradientSettings,
  type TechnologyHero,
  type TechnologyInnovation,
  type TechnologyResearch,
  type TechnologyRoadmap,
  technologyCta,
  technologyEquipment,
  technologyGradientSettings,
  technologyHero,
  technologyInnovations,
  technologyResearch,
  technologyRoadmap,
} from "../../../../../shared/index.js";
import { db } from "../../../../db.js";
import { emitCacheInvalidation } from "../../../cache/cache-events.js";
import { CacheOperations } from "../../../cache/cache-strategies.js";
import { UnifiedCache } from "../../../cache/unified-cache.js";

import { StorageSingleton } from "../../../storage-singleton.js";

const unifiedCache = UnifiedCache.getInstance();
const HOMEPAGE_CACHE_TTL = 3600; // 1 hour (in seconds)

export class TechnologyRepository {
  async getTechnologyHero(): Promise<TechnologyHero | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyHero();
    }
    const cacheKey = "technology:hero";
    const cached = await unifiedCache.get<TechnologyHero>(cacheKey);
    if (cached) return cached;

    const [hero] = await db.select().from(technologyHero).limit(1);
    if (hero) {
      unifiedCache.set(cacheKey, hero, HOMEPAGE_CACHE_TTL);
    }
    return hero ?? undefined;
  }

  async updateTechnologyHero(data: Partial<InsertTechnologyHero>): Promise<TechnologyHero> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateTechnologyHero(data);
    }
    const existing = await this.getTechnologyHero();
    await CacheOperations.invalidateTechnology();


    if (existing) {
      const [updated] = await db
        .update(technologyHero)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(technologyHero.id, existing.id))
        .returning();
      if (!updated) throw new Error("Failed to update technology hero");
      await emitCacheInvalidation("technology:hero", "update");
      return updated;
    } else {
      const [created] = await db
        .insert(technologyHero)
        .values(data as unknown as InsertTechnologyHero)
        .returning();
      if (!created) throw new Error("Failed to create technology hero");
      await emitCacheInvalidation("technology:hero", "create");
      return created;
    }
  }

  async getTechnologyCta(): Promise<TechnologyCta | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyCta();
    }
    const cacheKey = "technology:cta";
    const cached = await unifiedCache.get<TechnologyCta>(cacheKey);
    if (cached) return cached;

    const [cta] = await db.select().from(technologyCta).limit(1);
    if (cta) {
      unifiedCache.set(cacheKey, cta, HOMEPAGE_CACHE_TTL);
    }
    return cta ?? undefined;
  }

  async createTechnologyCta(data: InsertTechnologyCta): Promise<TechnologyCta> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createTechnologyCta(data);
    }
    const [created] = await db.insert(technologyCta).values(data).returning();
    if (!created) throw new Error("Failed to create technology cta");
    await CacheOperations.invalidateTechnology();

    await emitCacheInvalidation("technology:cta", "create");
    return created;
  }

  async updateTechnologyCta(data: Partial<InsertTechnologyCta>): Promise<TechnologyCta> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateTechnologyCta(data);
    }
    const existing = await this.getTechnologyCta();
    await CacheOperations.invalidateTechnology();


    if (existing) {
      const [updated] = await db
        .update(technologyCta)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(technologyCta.id, existing.id))
        .returning();
      if (!updated) throw new Error("Failed to update technology cta");
      await emitCacheInvalidation("technology:cta", "update");
      return updated;
    }

    const [created] = await db
      .insert(technologyCta)
      .values(data as InsertTechnologyCta)
      .returning();
    if (!created) throw new Error("Failed to create technology cta");
    await emitCacheInvalidation("technology:cta", "create");
    return created;
  }

  async deleteTechnologyCta(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteTechnologyCta(id);
    }
    await CacheOperations.invalidateTechnology();

    const result = await db.delete(technologyCta).where(eq(technologyCta.id, id));
    await emitCacheInvalidation("technology:cta", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async getTechnologyEquipment(): Promise<TechnologyEquipment[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyEquipment();
    }
    const cacheKey = "technology:equipment";
    const cached = await unifiedCache.get<TechnologyEquipment[]>(cacheKey);
    if (cached) return cached;

    const equipment = await db
      .select()
      .from(technologyEquipment)
      .where(eq(technologyEquipment.isActive, true))
      .orderBy(asc(technologyEquipment.sortOrder));

    unifiedCache.set(cacheKey, equipment, HOMEPAGE_CACHE_TTL);
    return equipment || [];
  }

  async getTechnologyEquipmentItem(id: number): Promise<TechnologyEquipment | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyEquipmentItem(id);
    }
    const [item] = await db
      .select()
      .from(technologyEquipment)
      .where(eq(technologyEquipment.id, id))
      .limit(1);
    return item ?? undefined;
  }

  async createTechnologyEquipment(data: InsertTechnologyEquipment): Promise<TechnologyEquipment> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createTechnologyEquipment(data);
    }
    const maxOrder = await db
      .select({ max: sql<number>`MAX(${technologyEquipment.sortOrder})` })
      .from(technologyEquipment);
    const newOrder = (Number(maxOrder[0]?.max) || 0) + 1;

    const [created] = await db
      .insert(technologyEquipment)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    if (!created) throw new Error("Failed to create technology equipment");
    await CacheOperations.invalidateTechnology();

    await emitCacheInvalidation("technology:equipment", "create");
    return created;
  }

  async updateTechnologyEquipment(
    id: number,
    data: Partial<InsertTechnologyEquipment>,
  ): Promise<TechnologyEquipment> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateTechnologyEquipment(id, data);
      if (!result) throw new Error(`updateTechnologyEquipment returned undefined for id ${id}`);
      return result;
    }
    await CacheOperations.invalidateTechnology();

    const [updated] = await db
      .update(technologyEquipment)
      .set(data)
      .where(eq(technologyEquipment.id, id))
      .returning();

    if (!updated) throw new Error(`Failed to update technology equipment with id ${id}`);
    await emitCacheInvalidation("technology:equipment", "update");
    return updated;
  }

  async deleteTechnologyEquipment(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteTechnologyEquipment(id);
    }
    await CacheOperations.invalidateTechnology();

    const result = await db.delete(technologyEquipment).where(eq(technologyEquipment.id, id));
    await emitCacheInvalidation("technology:equipment", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTechnologyEquipment(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderTechnologyEquipment(orderedIds);
    }
    await CacheOperations.invalidateTechnology();

    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(technologyEquipment)
          .set({ sortOrder: i + 1 })
          .where(eq(technologyEquipment.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("technology:equipment", "update");
  }

  async getTechnologyInnovations(includeInactive = false): Promise<TechnologyInnovation[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyInnovations(includeInactive);
    }
    let query = db.select().from(technologyInnovations).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(technologyInnovations.isActive, true));
    }

    return query.orderBy(asc(technologyInnovations.sortOrder));
  }

  async getTechnologyInnovation(id: number): Promise<TechnologyInnovation | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyInnovation(id);
    }
    const [innovation] = await db
      .select()
      .from(technologyInnovations)
      .where(eq(technologyInnovations.id, id))
      .limit(1);
    return innovation ?? undefined;
  }

  async createTechnologyInnovation(
    data: InsertTechnologyInnovation,
  ): Promise<TechnologyInnovation> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createTechnologyInnovation(data);
    }
    const maxOrder = await db
      .select({ max: sql<number>`MAX(${technologyInnovations.sortOrder})` })
      .from(technologyInnovations);
    const newOrder = (Number(maxOrder[0]?.max) || 0) + 1;

    const [created] = await db
      .insert(technologyInnovations)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    if (!created) throw new Error("Failed to create technology innovation");
    await CacheOperations.invalidateTechnology();

    await emitCacheInvalidation("technology:innovations", "create");
    return created;
  }

  async updateTechnologyInnovation(
    id: number,
    data: Partial<InsertTechnologyInnovation>,
  ): Promise<TechnologyInnovation> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateTechnologyInnovation(id, data);
      if (!result) throw new Error(`updateTechnologyInnovation returned undefined for id ${id}`);
      return result;
    }
    await CacheOperations.invalidateTechnology();

    const [updated] = await db
      .update(technologyInnovations)
      .set(data)
      .where(eq(technologyInnovations.id, id))
      .returning();

    if (!updated) throw new Error(`Failed to update technology innovation with id ${id}`);
    await emitCacheInvalidation("technology:innovations", "update");
    return updated;
  }

  async deleteTechnologyInnovation(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteTechnologyInnovation(id);
    }
    await CacheOperations.invalidateTechnology();

    const result = await db.delete(technologyInnovations).where(eq(technologyInnovations.id, id));
    await emitCacheInvalidation("technology:innovations", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTechnologyInnovations(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderTechnologyInnovations(orderedIds);
    }
    await CacheOperations.invalidateTechnology();

    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(technologyInnovations)
          .set({ sortOrder: i + 1 })
          .where(eq(technologyInnovations.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("technology:innovations", "update");
  }

  async getTechnologyResearch(includeInactive = false): Promise<TechnologyResearch[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyResearch(includeInactive);
    }
    let query = db.select().from(technologyResearch).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(technologyResearch.isActive, true));
    }

    return query.orderBy(asc(technologyResearch.sortOrder));
  }

  async getTechnologyResearchItem(id: number): Promise<TechnologyResearch | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyResearchItem(id);
    }
    const [item] = await db
      .select()
      .from(technologyResearch)
      .where(eq(technologyResearch.id, id))
      .limit(1);
    return item ?? undefined;
  }

  async createTechnologyResearch(data: InsertTechnologyResearch): Promise<TechnologyResearch> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createTechnologyResearch(data);
    }
    const maxOrder = await db
      .select({ max: sql<number>`MAX(${technologyResearch.sortOrder})` })
      .from(technologyResearch);
    const newOrder = (Number(maxOrder[0]?.max) || 0) + 1;

    const [created] = await db
      .insert(technologyResearch)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    if (!created) throw new Error("Failed to create technology research item");
    await CacheOperations.invalidateTechnology();

    await emitCacheInvalidation("technology:research", "create");
    return created;
  }

  async updateTechnologyResearch(
    id: number,
    data: Partial<InsertTechnologyResearch>,
  ): Promise<TechnologyResearch> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateTechnologyResearch(id, data);
      if (!result) throw new Error(`updateTechnologyResearch returned undefined for id ${id}`);
      return result;
    }
    await CacheOperations.invalidateTechnology();

    const [updated] = await db
      .update(technologyResearch)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(technologyResearch.id, id))
      .returning();

    if (!updated) throw new Error(`Failed to update technology research with id ${id}`);
    await emitCacheInvalidation("technology:research", "update");
    return updated;
  }

  async deleteTechnologyResearch(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteTechnologyResearch(id);
    }
    await CacheOperations.invalidateTechnology();

    const result = await db.delete(technologyResearch).where(eq(technologyResearch.id, id));
    await emitCacheInvalidation("technology:research", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTechnologyResearch(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderTechnologyResearch(orderedIds);
    }
    await CacheOperations.invalidateTechnology();

    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(technologyResearch)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(technologyResearch.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("technology:research", "update");
  }

  async getTechnologyRoadmap(includeInactive = false): Promise<TechnologyRoadmap[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyRoadmap(includeInactive);
    }
    let query = db.select().from(technologyRoadmap).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(technologyRoadmap.isActive, true));
    }

    return query.orderBy(asc(technologyRoadmap.sortOrder));
  }

  async getTechnologyRoadmapItem(id: number): Promise<TechnologyRoadmap | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyRoadmapItem(id);
    }
    const [item] = await db
      .select()
      .from(technologyRoadmap)
      .where(eq(technologyRoadmap.id, id))
      .limit(1);
    return item ?? undefined;
  }

  async createTechnologyRoadmap(data: InsertTechnologyRoadmap): Promise<TechnologyRoadmap> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createTechnologyRoadmap(data);
    }
    const maxOrder = await db
      .select({ max: sql<number>`MAX(${technologyRoadmap.sortOrder})` })
      .from(technologyRoadmap);
    const newOrder = (Number(maxOrder[0]?.max) || 0) + 1;

    const [created] = await db
      .insert(technologyRoadmap)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    if (!created) throw new Error("Failed to create technology roadmap item");
    await CacheOperations.invalidateTechnology();

    await emitCacheInvalidation("technology:roadmap", "create");
    return created;
  }

  async updateTechnologyRoadmap(
    id: number,
    data: Partial<InsertTechnologyRoadmap>,
  ): Promise<TechnologyRoadmap> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateTechnologyRoadmap(id, data);
      if (!result) throw new Error(`updateTechnologyRoadmap returned undefined for id ${id}`);
      return result;
    }
    await CacheOperations.invalidateTechnology();

    const [updated] = await db
      .update(technologyRoadmap)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(technologyRoadmap.id, id))
      .returning();

    if (!updated) throw new Error(`Failed to update technology roadmap with id ${id}`);
    await emitCacheInvalidation("technology:roadmap", "update");
    return updated;
  }

  async deleteTechnologyRoadmap(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteTechnologyRoadmap(id);
    }
    await CacheOperations.invalidateTechnology();

    const result = await db.delete(technologyRoadmap).where(eq(technologyRoadmap.id, id));
    await emitCacheInvalidation("technology:roadmap", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTechnologyRoadmap(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderTechnologyRoadmap(orderedIds);
    }
    await CacheOperations.invalidateTechnology();

    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(technologyRoadmap)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(technologyRoadmap.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("technology:roadmap", "update");
  }

  async getTechnologyGradientSettings(): Promise<TechnologyGradientSettings | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getTechnologyGradientSettings();
    }
    const cacheKey = "technology:gradient";
    const cached = await unifiedCache.get<TechnologyGradientSettings>(cacheKey);
    if (cached) return cached;

    const [settings] = await db.select().from(technologyGradientSettings).limit(1);
    if (settings) {
      unifiedCache.set(cacheKey, settings, HOMEPAGE_CACHE_TTL);
    }
    return settings ?? undefined;
  }

  async updateTechnologyGradientSettings(
    data: Partial<InsertTechnologyGradientSettings>,
  ): Promise<TechnologyGradientSettings> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateTechnologyGradientSettings(data);
    }
    const existing = await this.getTechnologyGradientSettings();
    await CacheOperations.invalidateTechnology();


    if (existing) {
      const [updated] = await db
        .update(technologyGradientSettings)
        .set(data)
        .where(eq(technologyGradientSettings.id, existing.id))
        .returning();
      if (!updated) throw new Error("Failed to update technology gradient settings");
      await emitCacheInvalidation("technology:gradient", "update");
      return updated;
    } else {
      const [created] = await db
        .insert(technologyGradientSettings)
        .values(data as unknown as InsertTechnologyGradientSettings)
        .returning();
      if (!created) throw new Error("Failed to create technology gradient settings");
      await emitCacheInvalidation("technology:gradient", "create");
      return created;
    }
  }
}

export const technologyRepository = new TechnologyRepository();
