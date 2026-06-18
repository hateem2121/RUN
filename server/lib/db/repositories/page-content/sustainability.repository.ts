import { asc, eq, sql } from "drizzle-orm";
import {
  type InsertSustainabilityGoal,
  type InsertSustainabilityHero,
  type InsertSustainabilityInitiative,
  type InsertSustainabilityMetric,
  type InsertUnifiedSustainability,
  type SustainabilityGoal,
  type SustainabilityHero,
  type SustainabilityInitiative,
  type SustainabilityMetric,
  type SustainabilityMetricHistory,
  sustainabilityGoals,
  sustainabilityHero,
  sustainabilityInitiatives,
  sustainabilityMetricHistory,
  sustainabilityMetrics,
  type UnifiedSustainability,
  unifiedSustainability,
} from "../../../../../shared/index.js";
import { db } from "../../../../db.js";
import { emitCacheInvalidation } from "../../../cache/cache-events.js";
import { CacheOperations } from "../../../cache/cache-strategies.js";
import { UnifiedCache } from "../../../cache/unified-cache.js";
import { StorageSingleton } from "../../../storage-singleton.js";

const unifiedCache = UnifiedCache.getInstance();
const HOMEPAGE_CACHE_TTL = 3600; // 1 hour (in seconds)

class SustainabilityRepository {
  async getSustainabilityHero(): Promise<SustainabilityHero | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getSustainabilityHero();
    }
    const cacheKey = "sustainability:hero";
    const cached = await unifiedCache.get<SustainabilityHero>(cacheKey);
    if (cached) return cached;

    const [hero] = await db.select().from(sustainabilityHero).limit(1);
    if (hero) {
      await unifiedCache.set(cacheKey, hero, HOMEPAGE_CACHE_TTL / 1000);
    }
    return hero ?? undefined;
  }

  async updateSustainabilityHero(
    data: Partial<InsertSustainabilityHero>,
  ): Promise<SustainabilityHero> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateSustainabilityHero(data);
    }
    const existing = await this.getSustainabilityHero();
    await CacheOperations.invalidateSustainability();

    if (existing) {
      const [updated] = await db
        .update(sustainabilityHero)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(sustainabilityHero.id, existing.id))
        .returning();

      if (!updated) throw new Error("Failed to update sustainability hero");
      await emitCacheInvalidation("sustainability:hero", "update");
      await CacheOperations.invalidateSustainability();
      return updated;
    }

    const [created] = await db
      .insert(sustainabilityHero)
      .values(data as InsertSustainabilityHero)
      .returning();
    if (!created) throw new Error("Failed to create sustainability hero");
    await emitCacheInvalidation("sustainability:hero", "create");
    await CacheOperations.invalidateSustainability();
    return created;
  }

  async getSustainabilityGoals(includeInactive = false): Promise<SustainabilityGoal[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getSustainabilityGoals(includeInactive);
    }
    let query = db.select().from(sustainabilityGoals).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(sustainabilityGoals.isActive, true));
    }

    return query.orderBy(asc(sustainabilityGoals.sortOrder));
  }

  async getSustainabilityGoal(id: number): Promise<SustainabilityGoal | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getSustainabilityGoal(id);
    }
    const [goal] = await db
      .select()
      .from(sustainabilityGoals)
      .where(eq(sustainabilityGoals.id, id))
      .limit(1);
    return goal;
  }

  async createSustainabilityGoal(data: InsertSustainabilityGoal): Promise<SustainabilityGoal> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createSustainabilityGoal(data);
    }
    const maxOrderRes = await db
      .select({ max: sql<number>`MAX(${sustainabilityGoals.sortOrder})` })
      .from(sustainabilityGoals);
    const newOrder = (Number(maxOrderRes[0]?.max) || 0) + 1;

    const [created] = await db
      .insert(sustainabilityGoals)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    if (!created) {
      throw new Error("Failed to create sustainability goal");
    }

    await unifiedCache.del("sustainability:goals:*");
    await emitCacheInvalidation("sustainability:goals", "create");
    await CacheOperations.invalidateSustainability();
    return created;
  }

  async updateSustainabilityGoal(
    id: number,
    data: Partial<InsertSustainabilityGoal>,
  ): Promise<SustainabilityGoal> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateSustainabilityGoal(id, data);
      if (!result) throw new Error(`updateSustainabilityGoal returned undefined for id ${id}`);
      return result;
    }
    await unifiedCache.del("sustainability:goals:*");
    const [updated] = await db
      .update(sustainabilityGoals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sustainabilityGoals.id, id))
      .returning();

    if (!updated) throw new Error(`Failed to update sustainability goal with id ${id}`);
    await emitCacheInvalidation("sustainability:goal", "update");
    await CacheOperations.invalidateSustainability();
    return updated;
  }

  async deleteSustainabilityGoal(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteSustainabilityGoal(id);
    }
    await unifiedCache.del("sustainability:goals:*");
    const result = await db.delete(sustainabilityGoals).where(eq(sustainabilityGoals.id, id));
    await emitCacheInvalidation("sustainability:goals", "delete");
    await CacheOperations.invalidateSustainability();
    return (result.rowCount ?? 0) > 0;
  }

  async reorderSustainabilityGoals(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderSustainabilityGoals(orderedIds);
    }
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(sustainabilityGoals)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(sustainabilityGoals.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("sustainability:goals", "update");
    await CacheOperations.invalidateSustainability();
  }

  async getSustainabilityMetrics(): Promise<SustainabilityMetric[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getSustainabilityMetrics();
    }
    const cacheKey = "sustainability:metrics";
    const cached = await unifiedCache.get<SustainabilityMetric[]>(cacheKey);
    if (cached) return cached;

    const metrics = await db
      .select()
      .from(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.isActive, true))
      .orderBy(asc(sustainabilityMetrics.sortOrder));

    await unifiedCache.set(cacheKey, metrics, HOMEPAGE_CACHE_TTL / 1000);
    return metrics;
  }

  async getSustainabilityMetric(id: number): Promise<SustainabilityMetric | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getSustainabilityMetric(id);
    }
    const [metric] = await db
      .select()
      .from(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.id, id))
      .limit(1);
    return metric ?? undefined;
  }

  async createSustainabilityMetric(
    data: InsertSustainabilityMetric,
  ): Promise<SustainabilityMetric> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createSustainabilityMetric(data);
    }
    const maxOrderRes = await db
      .select({ max: sql<number>`MAX(${sustainabilityMetrics.sortOrder})` })
      .from(sustainabilityMetrics);
    const newOrder = (Number(maxOrderRes[0]?.max) || 0) + 1;

    const [created] = await db
      .insert(sustainabilityMetrics)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    if (created) {
      // Record initial history
      await db.insert(sustainabilityMetricHistory).values({
        metricId: created.id,
        value: created.value,
        notes: "Initial value",
      });
    }

    if (!created) {
      throw new Error("Failed to create sustainability metric");
    }

    await unifiedCache.del("sustainability:metrics");
    await emitCacheInvalidation("sustainability:metrics", "create");
    await CacheOperations.invalidateSustainability();
    return created;
  }

  async updateSustainabilityMetric(
    id: number,
    data: Partial<InsertSustainabilityMetric>,
  ): Promise<SustainabilityMetric> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateSustainabilityMetric(id, data);
      if (!result) throw new Error(`updateSustainabilityMetric returned undefined for id ${id}`);
      return result;
    }
    const [updated] = await db
      .update(sustainabilityMetrics)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sustainabilityMetrics.id, id))
      .returning();

    if (updated && data.value !== undefined) {
      // Record history change
      await db.insert(sustainabilityMetricHistory).values({
        metricId: updated.id,
        value: updated.value,
        notes: "Value updated",
      });
    }

    if (!updated) {
      throw new Error(`Failed to update sustainability metric with id ${id}`);
    }

    await emitCacheInvalidation("sustainability:metrics", "update");
    await CacheOperations.invalidateSustainability();
    return updated;
  }

  async deleteSustainabilityMetric(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteSustainabilityMetric(id);
    }
    const result = await db.delete(sustainabilityMetrics).where(eq(sustainabilityMetrics.id, id));
    await emitCacheInvalidation("sustainability:metrics", "delete");
    await CacheOperations.invalidateSustainability();
    return (result.rowCount ?? 0) > 0;
  }

  async reorderSustainabilityMetrics(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderSustainabilityMetrics(orderedIds);
    }
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(sustainabilityMetrics)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(sustainabilityMetrics.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("sustainability:metrics", "update");
    await CacheOperations.invalidateSustainability();
  }

  async getSustainabilityMetricHistory(metricId: number): Promise<SustainabilityMetricHistory[]> {
    return db
      .select()
      .from(sustainabilityMetricHistory)
      .where(eq(sustainabilityMetricHistory.metricId, metricId))
      .orderBy(asc(sustainabilityMetricHistory.recordedAt));
  }

  async getSustainabilityInitiatives(includeInactive = false): Promise<SustainabilityInitiative[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getSustainabilityInitiatives(includeInactive);
    }
    let query = db.select().from(sustainabilityInitiatives).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(sustainabilityInitiatives.isActive, true));
    }

    return query.orderBy(asc(sustainabilityInitiatives.sortOrder));
  }

  async getSustainabilityInitiative(id: number): Promise<SustainabilityInitiative | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getSustainabilityInitiative(id);
    }
    const [initiative] = await db
      .select()
      .from(sustainabilityInitiatives)
      .where(eq(sustainabilityInitiatives.id, id))
      .limit(1);
    return initiative ?? undefined;
  }

  async createSustainabilityInitiative(
    data: InsertSustainabilityInitiative,
  ): Promise<SustainabilityInitiative> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createSustainabilityInitiative(data);
    }
    const maxOrderRes = await db
      .select({ max: sql<number>`MAX(${sustainabilityInitiatives.sortOrder})` })
      .from(sustainabilityInitiatives);
    const newOrder = (Number(maxOrderRes[0]?.max) || 0) + 1;

    const [created] = await db
      .insert(sustainabilityInitiatives)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    if (!created) {
      throw new Error("Failed to create sustainability initiative");
    }

    await CacheOperations.invalidateSustainability();
    await emitCacheInvalidation("sustainability:initiatives", "create");
    return created;
  }

  async updateSustainabilityInitiative(
    id: number,
    data: Partial<InsertSustainabilityInitiative>,
  ): Promise<SustainabilityInitiative> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateSustainabilityInitiative(id, data);
      if (!result)
        throw new Error(`updateSustainabilityInitiative returned undefined for id ${id}`);
      return result;
    }
    const [updated] = await db
      .update(sustainabilityInitiatives)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sustainabilityInitiatives.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Failed to update sustainability initiative with id ${id}`);
    }

    await emitCacheInvalidation("sustainability:initiatives", "update");
    await CacheOperations.invalidateSustainability();
    return updated;
  }

  async deleteSustainabilityInitiative(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteSustainabilityInitiative(id);
    }
    const result = await db
      .delete(sustainabilityInitiatives)
      .where(eq(sustainabilityInitiatives.id, id));
    await emitCacheInvalidation("sustainability:initiatives", "delete");
    await CacheOperations.invalidateSustainability();
    return (result.rowCount ?? 0) > 0;
  }

  async reorderSustainabilityInitiatives(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderSustainabilityInitiatives(orderedIds);
    }
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(sustainabilityInitiatives)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(sustainabilityInitiatives.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("sustainability:initiatives", "update");
    await CacheOperations.invalidateSustainability();
  }

  async getUnifiedSustainability(): Promise<UnifiedSustainability | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getUnifiedSustainability();
    }
    const cacheKey = "sustainability:unified";
    const cached = await unifiedCache.get<UnifiedSustainability>(cacheKey);
    if (cached) return cached;

    const [data] = await db.select().from(unifiedSustainability).limit(1);
    if (data) {
      await unifiedCache.set(cacheKey, data, HOMEPAGE_CACHE_TTL / 1000);
    }
    return data ?? undefined;
  }

  async updateUnifiedSustainability(
    data: Partial<InsertUnifiedSustainability>,
  ): Promise<UnifiedSustainability> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateUnifiedSustainability(data);
    }
    const existing = await this.getUnifiedSustainability();
    await CacheOperations.invalidateSustainability();

    if (existing) {
      const [updated] = await db
        .update(unifiedSustainability)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(unifiedSustainability.id, existing.id))
        .returning();

      if (!updated) throw new Error("Failed to update unified sustainability");
      await emitCacheInvalidation("sustainability:unified", "update");
      await CacheOperations.invalidateSustainability();
      return updated;
    }

    const [created] = await db
      .insert(unifiedSustainability)
      .values(data as InsertUnifiedSustainability)
      .returning();
    if (!created) throw new Error("Failed to create unified sustainability");
    await emitCacheInvalidation("sustainability:unified", "create");
    await CacheOperations.invalidateSustainability();
    return created;
  }

  async migrateLegacySustainabilityData(): Promise<{ migrated: number }> {
    // Migration helper for legacy data formats
    const hero = await this.getSustainabilityHero();
    const goals = await this.getSustainabilityGoals(true);
    const metrics = await this.getSustainabilityMetrics();
    const initiatives = await this.getSustainabilityInitiatives(true);

    let migrated = 0;

    // If we have legacy data in old format, migrate to unified
    if (hero || goals.length > 0 || metrics.length > 0 || initiatives.length > 0) {
      await this.updateUnifiedSustainability({
        title: "Sustainability",
        sectionType: "unified",
        data: {
          heroData: hero ? JSON.stringify(hero) : null,
          goalsData: goals.length > 0 ? JSON.stringify(goals) : null,
          metricsData: metrics.length > 0 ? JSON.stringify(metrics) : null,
          initiativesData: initiatives.length > 0 ? JSON.stringify(initiatives) : null,
        },
      } as unknown as Partial<InsertUnifiedSustainability>);
      migrated = (hero ? 1 : 0) + goals.length + metrics.length + initiatives.length;
    }

    return { migrated };
  }
}

export const sustainabilityRepository = new SustainabilityRepository();
