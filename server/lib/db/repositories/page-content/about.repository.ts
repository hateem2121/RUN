import { asc, eq, getTableColumns } from "drizzle-orm";
import {
  type AboutBatchResponse,
  type AboutHero,
  type AboutMapLocation,
  type AboutSection,
  type AboutStatistic,
  type AboutTeamMessage,
  type AboutTimelineEntry,
  aboutHero,
  aboutMapLocations,
  aboutSections,
  aboutStatistics,
  aboutTeamMessages,
  aboutTimelineEntries,
  type InsertAboutHero,
  type InsertAboutMapLocation,
  type InsertAboutSection,
  type InsertAboutStatistic,
  type InsertAboutTeamMessage,
  type InsertAboutTimelineEntry,
  type MediaAsset,
  mediaAssets,
} from "../../../../../shared/index.js";
import { db } from "../../../../db.js";
import { emitCacheInvalidation } from "../../../cache/cache-events.js";
import { UnifiedCache } from "../../../cache/unified-cache.js";
import { logger } from "../../../monitoring/logger.js";
import { StorageSingleton } from "../../../storage-singleton.js";

const unifiedCache = UnifiedCache.getInstance();

export class AboutRepository {
  async getAboutHero(includeInactive: boolean = false): Promise<AboutHero | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAboutHero(includeInactive);
    }
    const cacheKey = includeInactive ? "about:hero:all" : "about:hero";
    const cached = await unifiedCache.get<AboutHero>(cacheKey, "data");
    if (cached) return cached;

    let query = db.select().from(aboutHero).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(aboutHero.isActive, true));
    }

    const [hero] = await query.limit(1);

    if (hero) {
      await unifiedCache.set(cacheKey, hero, (30 * 60 * 1000) / 1000, "data");
    }

    return hero ?? undefined;
  }

  async updateAboutHero(hero: Partial<InsertAboutHero>): Promise<AboutHero> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateAboutHero(hero);
    }
    await unifiedCache.del("about:hero");
    await unifiedCache.del("about:batch");

    const existing = await db.select().from(aboutHero).limit(1);

    let result: AboutHero;
    if (existing.length === 0) {
      const [created] = await db
        .insert(aboutHero)
        .values(hero as InsertAboutHero)
        .returning();
      if (!created) throw new Error("Failed to create about hero");
      result = created;
      await emitCacheInvalidation("about:hero", "create");
    } else {
      const [updated] = await db
        .update(aboutHero)
        .set({ ...hero, updatedAt: new Date() })
        .where(eq(aboutHero.id, existing[0]!.id))
        .returning();
      if (!updated) throw new Error("Failed to update about hero");
      result = updated;
      await emitCacheInvalidation("about:hero", "update");
    }

    return result;
  }

  async getAboutTimelineEntries(
    includeInactive: boolean = false,
  ): Promise<(AboutTimelineEntry & { imageUrl: string | null })[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAboutTimelineEntries(includeInactive);
    }
    const query = db
      .select({
        ...getTableColumns(aboutTimelineEntries),
        mediaUrl: mediaAssets.url,
      })
      .from(aboutTimelineEntries)
      .leftJoin(mediaAssets, eq(aboutTimelineEntries.imageId, mediaAssets.id))
      .$dynamic();

    if (!includeInactive) {
      query.where(eq(aboutTimelineEntries.isActive, true));
    }

    const results = await query.orderBy(asc(aboutTimelineEntries.sortOrder));

    // Hydrate mediaUrl correctly for frontend components
    return results.map((entry) => {
      const { mediaUrl, ...entryData } = entry;
      return {
        ...entryData,
        imageUrl: mediaUrl || null,
      };
    });
  }

  async getAboutTimelineEntry(id: number): Promise<AboutTimelineEntry | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAboutTimelineEntry(id);
    }
    const [entry] = await db
      .select()
      .from(aboutTimelineEntries)
      .where(eq(aboutTimelineEntries.id, id));
    return entry;
  }

  async createAboutTimelineEntry(entry: InsertAboutTimelineEntry): Promise<AboutTimelineEntry> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createAboutTimelineEntry(entry);
    }
    await unifiedCache.del("about:batch");
    const [created] = await db.insert(aboutTimelineEntries).values(entry).returning();

    try {
      await emitCacheInvalidation("about:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async updateAboutTimelineEntry(
    id: number,
    entry: Partial<InsertAboutTimelineEntry>,
  ): Promise<AboutTimelineEntry> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateAboutTimelineEntry(id, entry);
      if (!result) throw new Error(`updateAboutTimelineEntry returned undefined for id ${id}`);
      return result;
    }
    await unifiedCache.del("about:timeline");
    await unifiedCache.del("about:batch");
    const [updated] = await db
      .update(aboutTimelineEntries)
      .set(entry)
      .where(eq(aboutTimelineEntries.id, id))
      .returning();

    if (!updated) throw new Error(`About timeline entry ${id} not found`);
    await emitCacheInvalidation("about:timeline", "update");
    return updated;
  }

  async deleteAboutTimelineEntry(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteAboutTimelineEntry(id);
    }
    await unifiedCache.del("about:batch");
    const result = await db.delete(aboutTimelineEntries).where(eq(aboutTimelineEntries.id, id));

    try {
      await emitCacheInvalidation("about:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async reorderAboutTimelineEntries(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderAboutTimelineEntries(orderedIds);
    }
    await unifiedCache.del("about:timeline");
    await unifiedCache.del("about:batch");
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i] as number;
        await tx
          .update(aboutTimelineEntries)
          .set({ sortOrder: i + 1 })
          .where(eq(aboutTimelineEntries.id, id));
      }
    });

    await emitCacheInvalidation("about:timeline", "update");
  }

  async getAboutMapLocations(includeInactive: boolean = false): Promise<AboutMapLocation[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAboutMapLocations(includeInactive);
    }
    const cacheKey = includeInactive ? "about:locations:all" : "about:locations";
    const cached = await unifiedCache.get<AboutMapLocation[]>(cacheKey, "data");
    if (cached) return cached;

    let query = db.select().from(aboutMapLocations).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(aboutMapLocations.isActive, true));
    }
    const results = await query.orderBy(asc(aboutMapLocations.sortOrder));

    if (results.length > 0) {
      await unifiedCache.set(cacheKey, results, (30 * 60 * 1000) / 1000, "data");
    }
    return results;
  }

  async getAboutMapLocation(id: number): Promise<AboutMapLocation | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAboutMapLocation(id);
    }
    const [location] = await db
      .select()
      .from(aboutMapLocations)
      .where(eq(aboutMapLocations.id, id));
    return location;
  }

  async createAboutMapLocation(location: InsertAboutMapLocation): Promise<AboutMapLocation> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createAboutMapLocation(location);
    }
    await unifiedCache.del("about:batch");
    const [created] = await db.insert(aboutMapLocations).values(location).returning();

    try {
      await emitCacheInvalidation("about:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async updateAboutMapLocation(
    id: number,
    location: Partial<InsertAboutMapLocation>,
  ): Promise<AboutMapLocation> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateAboutMapLocation(id, location);
      if (!result) throw new Error(`updateAboutMapLocation returned undefined for id ${id}`);
      return result;
    }
    await unifiedCache.del("about:locations");
    await unifiedCache.del("about:batch");
    const [updated] = await db
      .update(aboutMapLocations)
      .set(location)
      .where(eq(aboutMapLocations.id, id))
      .returning();

    if (!updated) throw new Error(`About map location ${id} not found`);
    await emitCacheInvalidation("about:locations", "update");
    return updated;
  }

  async deleteAboutMapLocation(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteAboutMapLocation(id);
    }
    await unifiedCache.del("about:batch");
    const result = await db.delete(aboutMapLocations).where(eq(aboutMapLocations.id, id));

    try {
      await emitCacheInvalidation("about:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async reorderAboutMapLocations(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderAboutMapLocations(orderedIds);
    }
    await unifiedCache.del("about:batch");
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i] as number;
        await tx
          .update(aboutMapLocations)
          .set({ sortOrder: i + 1 })
          .where(eq(aboutMapLocations.id, id));
      }
    });

    try {
      await emitCacheInvalidation("about:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
  }

  async getAboutSections(includeInactive: boolean = false): Promise<AboutSection[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAboutSections(includeInactive);
    }
    const cacheKey = includeInactive ? "about:sections:all" : "about:sections";
    const cached = await unifiedCache.get<AboutSection[]>(cacheKey, "data");
    if (cached) return cached;

    let query = db.select().from(aboutSections).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(aboutSections.isActive, true));
    }
    const results = await query.orderBy(asc(aboutSections.sortOrder));

    if (results.length > 0) {
      await unifiedCache.set(cacheKey, results, (30 * 60 * 1000) / 1000, "data");
    }
    return results;
  }

  async getAboutSection(id: number): Promise<AboutSection | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAboutSection(id);
    }
    const [section] = await db.select().from(aboutSections).where(eq(aboutSections.id, id));
    return section;
  }

  async createAboutSection(section: InsertAboutSection): Promise<AboutSection> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createAboutSection(section);
    }
    await unifiedCache.del("about:batch");
    const [created] = await db.insert(aboutSections).values(section).returning();

    try {
      await emitCacheInvalidation("about:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async updateAboutSection(
    id: number,
    section: Partial<InsertAboutSection>,
  ): Promise<AboutSection> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateAboutSection(id, section);
      if (!result) throw new Error(`updateAboutSection returned undefined for id ${id}`);
      return result;
    }
    await unifiedCache.del("about:sections");
    await unifiedCache.del("about:batch");
    const [updated] = await db
      .update(aboutSections)
      .set({ ...section, updatedAt: new Date() })
      .where(eq(aboutSections.id, id))
      .returning();

    if (!updated) throw new Error(`About section ${id} not found`);
    await emitCacheInvalidation("about:sections", "update");
    return updated;
  }

  async deleteAboutSection(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteAboutSection(id);
    }
    await unifiedCache.del("about:batch");
    const result = await db.delete(aboutSections).where(eq(aboutSections.id, id));

    try {
      await emitCacheInvalidation("about:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async reorderAboutSections(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderAboutSections(orderedIds);
    }
    await unifiedCache.del("about:batch");
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i] as number;
        await tx
          .update(aboutSections)
          .set({ sortOrder: i + 1 })
          .where(eq(aboutSections.id, id));
      }
    });

    try {
      await emitCacheInvalidation("about:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
  }

  async getAboutStatistics(includeInactive: boolean = false): Promise<AboutStatistic[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAboutStatistics(includeInactive);
    }
    const cacheKey = includeInactive ? "about:statistics:all" : "about:statistics";
    const cached = await unifiedCache.get<AboutStatistic[]>(cacheKey, "data");
    if (cached) return cached;

    let query = db.select().from(aboutStatistics).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(aboutStatistics.isActive, true));
    }
    const results = await query.orderBy(asc(aboutStatistics.sortOrder));

    if (results.length > 0) {
      await unifiedCache.set(cacheKey, results, (30 * 60 * 1000) / 1000, "data");
    }
    return results;
  }

  async getAboutStatistic(id: number): Promise<AboutStatistic | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAboutStatistic(id);
    }
    const [statistic] = await db.select().from(aboutStatistics).where(eq(aboutStatistics.id, id));
    return statistic;
  }

  async createAboutStatistic(statistic: InsertAboutStatistic): Promise<AboutStatistic> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createAboutStatistic(statistic);
    }
    await unifiedCache.del("about:batch");
    const [created] = await db.insert(aboutStatistics).values(statistic).returning();

    try {
      await emitCacheInvalidation("about:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async updateAboutStatistic(
    id: number,
    statistic: Partial<InsertAboutStatistic>,
  ): Promise<AboutStatistic | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateAboutStatistic(id, statistic);
    }
    await unifiedCache.del("about:batch");
    const [updated] = await db
      .update(aboutStatistics)
      .set(statistic)
      .where(eq(aboutStatistics.id, id))
      .returning();

    try {
      await emitCacheInvalidation("about:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated!;
  }

  async deleteAboutStatistic(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteAboutStatistic(id);
    }
    await unifiedCache.del("about:batch");
    const result = await db.delete(aboutStatistics).where(eq(aboutStatistics.id, id));

    try {
      await emitCacheInvalidation("about:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async reorderAboutStatistics(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderAboutStatistics(orderedIds);
    }
    await unifiedCache.del("about:statistics");
    await unifiedCache.del("about:batch");
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i] as number;
        await tx
          .update(aboutStatistics)
          .set({ sortOrder: i + 1 })
          .where(eq(aboutStatistics.id, id));
      }
    });

    await emitCacheInvalidation("about:statistics", "update");
  }

  async getAboutTeamMessage(
    includeInactive: boolean = false,
  ): Promise<AboutTeamMessage | undefined> {
    let query = db.select().from(aboutTeamMessages).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(aboutTeamMessages.isActive, true));
    }

    const [message] = await query.limit(1);
    return message;
  }

  async updateAboutTeamMessage(data: Partial<InsertAboutTeamMessage>): Promise<AboutTeamMessage> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateAboutTeamMessage(data);
    }
    const existing = await this.getAboutTeamMessage(true);
    await unifiedCache.del("about:team-message");
    await unifiedCache.del("about:batch");

    if (existing) {
      const [updated] = await db
        .update(aboutTeamMessages)
        .set(data)
        .where(eq(aboutTeamMessages.id, existing.id))
        .returning();
      if (!updated) throw new Error("Failed to update about team message");
      await emitCacheInvalidation("about:team-message", "update");
      return updated;
    } else {
      const [created] = await db
        .insert(aboutTeamMessages)
        .values(data as unknown as InsertAboutTeamMessage)
        .returning();
      if (!created) throw new Error("Failed to create about team message");
      await emitCacheInvalidation("about:team-message", "create");
      return created;
    }
  }

  /**
   * Aggregates all About page content into a single response.
   * Optimized for public-facing route performance.
   */
  async getAboutBatch(): Promise<AboutBatchResponse> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAboutBatch();
    }
    const startTime = Date.now();
    const cacheKey = "about:batch";
    const cached = await unifiedCache.get<AboutBatchResponse>(cacheKey, "data");
    if (cached) return cached;

    const [hero, timeline, locations, sections, statistics, teamMessage] = await Promise.all([
      this.getAboutHero(false),
      this.getAboutTimelineEntries(false),
      this.getAboutMapLocations(false),
      this.getAboutSections(false),
      this.getAboutStatistics(false),
      this.getAboutTeamMessage(false),
    ]);

    // Resolve media assets
    const mediaIds = new Set<number>();

    // Hero media
    if (hero?.imageId) mediaIds.add(hero.imageId);
    if (hero?.videoId) mediaIds.add(hero.videoId);
    if (hero?.backgroundMediaId) mediaIds.add(hero.backgroundMediaId);

    // Timeline media
    timeline.forEach((entry) => {
      if (entry.imageId) mediaIds.add(entry.imageId);
    });

    // Sections media
    sections.forEach((section) => {
      if (section.imageId) mediaIds.add(section.imageId);
      if (Array.isArray(section.mediaIds)) {
        section.mediaIds.forEach((id) => {
          if (typeof id === "number") mediaIds.add(id);
        });
      }
    });

    // Team message media
    if (teamMessage?.imageId) mediaIds.add(teamMessage.imageId);

    let mediaAssets: MediaAsset[] = [];
    if (mediaIds.size > 0) {
      const { mediaRepository } = await import("../../repositories/index.js");
      mediaAssets = await mediaRepository.getMediaAssetsByIds(Array.from(mediaIds).map(String));
    }

    const result: AboutBatchResponse = {
      hero: (hero as AboutHero) || null,
      timeline: timeline as AboutTimelineEntry[],
      locations: locations as AboutMapLocation[],
      sections: sections as AboutSection[],
      statistics: statistics as AboutStatistic[],
      teamMessage: (teamMessage as AboutTeamMessage) || null,
      mediaAssets,
      _meta: {
        fetchedAt: new Date().toISOString(),
        totalRequests: 7, // 6 about tables + 1 media table
        mediaAssetsLoaded: mediaAssets.length,
        mediaIdsRequested: Array.from(mediaIds),
        responseTime: Date.now() - startTime,
      },
    };

    // Cache for 30 minutes
    await unifiedCache.set(cacheKey, result, (30 * 60 * 1000) / 1000, "data");
    return result;
  }
}

export const aboutRepository = new AboutRepository();
