import { asc, eq, getTableColumns, sql } from "drizzle-orm";
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
  type HomepageFeaturedProductsSettings,
  type HomepageHero,
  type HomepageProcessCard,
  type HomepageSection,
  type HomepageSlogan,
  homepageFeaturedProductsSettings,
  homepageHero,
  homepageProcessCards,
  homepageSections,
  homepageSlogans,
  type InsertAboutHero,
  type InsertAboutMapLocation,
  type InsertAboutSection,
  type InsertAboutStatistic,
  type InsertAboutTeamMessage,
  type InsertAboutTimelineEntry,
  type InsertHomepageFeaturedProductsSettings,
  type InsertHomepageHero,
  type InsertHomepageProcessCard,
  type InsertHomepageSection,
  type InsertHomepageSlogan,
  type InsertLogoAnimationSettings,
  type InsertManufacturingCapability,
  type InsertManufacturingHero,
  type InsertManufacturingProcess,
  type InsertManufacturingQuality,
  type InsertSustainabilityGoal,
  type InsertSustainabilityHero,
  type InsertSustainabilityInitiative,
  type InsertSustainabilityMetric,
  type InsertTechnologyCta,
  type InsertTechnologyEquipment,
  type InsertTechnologyGradientSettings,
  type InsertTechnologyHero,
  type InsertTechnologyInnovation,
  type InsertTechnologyResearch,
  type InsertTechnologyRoadmap,
  type InsertUnifiedSustainability,
  type LogoAnimationSettings,
  logoAnimationSettings,
  type ManufacturingCapability,
  type ManufacturingHero,
  type ManufacturingProcess,
  type ManufacturingQuality,
  manufacturingCapabilities,
  manufacturingHero,
  manufacturingProcesses,
  manufacturingQualities,
  mediaAssets,
  type SustainabilityGoal,
  type SustainabilityHero,
  type SustainabilityInitiative,
  type SustainabilityMetric,
  sustainabilityGoals,
  sustainabilityHero,
  sustainabilityInitiatives,
  sustainabilityMetrics,
  type TechnologyCta,
  type TechnologyEquipment,
  type TechnologyGradientSettings,
  type TechnologyHero,
  type TechnologyInnovation,
  type TechnologyResearch,
  type TechnologyRoadmap,
  // type TechnologyTesting, // Not used - removed to fix TS error
  technologyCta,
  technologyEquipment,
  technologyGradientSettings,
  technologyHero,
  technologyInnovations,
  technologyResearch,
  technologyRoadmap,
  type UnifiedSustainability,
  unifiedSustainability,
} from "../../../../shared/index.js";
import { db } from "../../../db.js";
import { emitCacheInvalidation } from "../../cache/cache-events.js";
import { UnifiedCache } from "../../cache/unified-cache.js";
import { logger } from "../../monitoring/logger.js";
import { StorageSingleton } from "../../storage-singleton.js";

const unifiedCache = UnifiedCache.getInstance();

// Cache TTL for homepage content - marketing content changes infrequently
const HOMEPAGE_CACHE_TTL = 3600; // 1 hour (in seconds)

export class PageContentRepository {
  // =============================================================================
  // HOMEPAGE METHODS
  // =============================================================================

  async getHomepageHero(): Promise<HomepageHero | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getHomepageHero();
    }
    const cacheKey = "homepage:hero";
    try {
      const cached = await unifiedCache.get<HomepageHero>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get homepage hero from cache:", error);
    }

    const startTime = performance.now();
    const [hero] = await db
      .select()
      .from(homepageHero)
      .where(eq(homepageHero.isActive, true))
      .orderBy(asc(homepageHero.id))
      .limit(1);
    const duration = performance.now() - startTime;

    if (hero) {
      try {
        await unifiedCache.set(cacheKey, hero, HOMEPAGE_CACHE_TTL, "data");
      } catch (error) {
        logger.debug("[Cache] Failed to set homepage hero cache:", error);
      }
    }

    if (duration > 50) {
      logger.debug(
        `[Performance] getHomepageHero took ${duration.toFixed(
          2,
        )}ms (threshold: 50ms) - CACHED for future requests`,
      );
    }
    return hero;
  }

  async updateHomepageHero(hero: Partial<InsertHomepageHero>): Promise<HomepageHero> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateHomepageHero(hero);
    }
    const existing = await db
      .select()
      .from(homepageHero)
      .where(eq(homepageHero.isActive, true))
      .orderBy(asc(homepageHero.id))
      .limit(1);

    await unifiedCache.del("homepage:hero");

    let result: HomepageHero;
    if (existing.length === 0) {
      const [created] = await db
        .insert(homepageHero)
        .values(hero as InsertHomepageHero)
        .returning();
      if (!created) throw new Error("Failed to create homepage hero");
      result = created;
      await emitCacheInvalidation("homepage:hero", "create");
    } else {
      const heroId = existing[0]!.id;
      const [updated] = await db
        .update(homepageHero)
        .set({ ...hero, updatedAt: new Date() })
        .where(eq(homepageHero.id, heroId))
        .returning();
      if (!updated) throw new Error("Failed to update homepage hero");
      result = updated;
      await emitCacheInvalidation("homepage:hero", "update");
    }

    return result;
  }

  async getHomepageSlogans(): Promise<HomepageSlogan[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getHomepageSlogans();
    }
    const cacheKey = "homepage:slogans";
    const cached = await unifiedCache.get<HomepageSlogan[]>(cacheKey, "data");
    if (cached) return cached;

    const slogans = await db
      .select()
      .from(homepageSlogans)
      .where(eq(homepageSlogans.isActive, true))
      .orderBy(asc(homepageSlogans.sortOrder));

    await unifiedCache.set(cacheKey, slogans, HOMEPAGE_CACHE_TTL / 1000, "data");
    return slogans;
  }

  async getHomepageSlogan(id: number): Promise<HomepageSlogan | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getHomepageSlogan(id);
    }
    const [slogan] = await db
      .select()
      .from(homepageSlogans)
      .where(eq(homepageSlogans.id, id))
      .limit(1);
    return slogan ?? undefined;
  }

  async createHomepageSlogan(slogan: InsertHomepageSlogan): Promise<HomepageSlogan> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createHomepageSlogan(slogan);
    }
    await unifiedCache.del("homepage:slogans");
    const [created] = await db.insert(homepageSlogans).values(slogan).returning();
    if (!created) throw new Error("Failed to create homepage slogan");
    await emitCacheInvalidation("homepage:slogans", "create");
    return created;
  }

  async updateHomepageSlogan(
    id: number,
    slogan: Partial<InsertHomepageSlogan>,
  ): Promise<HomepageSlogan> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateHomepageSlogan(id, slogan);
      if (!result) throw new Error(`updateHomepageSlogan returned undefined for id ${id}`);
      return result;
    }
    await unifiedCache.del("homepage:slogans");
    const [updated] = await db
      .update(homepageSlogans)
      .set(slogan)
      .where(eq(homepageSlogans.id, id))
      .returning();

    if (!updated) throw new Error(`Failed to update homepage slogan with id ${id}`);
    await emitCacheInvalidation("homepage:slogans", "update");
    return updated;
  }

  async deleteHomepageSlogan(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteHomepageSlogan(id);
    }
    await unifiedCache.del("homepage:slogans");
    const result = await db.delete(homepageSlogans).where(eq(homepageSlogans.id, id));
    await emitCacheInvalidation("homepage:slogans", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderHomepageSlogans(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderHomepageSlogans(orderedIds);
    }
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i] as number;
        await tx
          .update(homepageSlogans)
          .set({ sortOrder: i + 1 })
          .where(eq(homepageSlogans.id, id));
      }
    });

    await unifiedCache.del("homepage:slogans");
    await emitCacheInvalidation("homepage:slogans", "update");
  }

  async getHomepageProcessCards(includeInactive = false): Promise<HomepageProcessCard[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getHomepageProcessCards(includeInactive);
    }
    const cacheKey = includeInactive ? "homepage:process_cards:all" : "homepage:process_cards";
    const cached = await unifiedCache.get<HomepageProcessCard[]>(cacheKey, "data");
    if (cached) return cached;

    const query = db
      .select({
        id: homepageProcessCards.id,
        title: homepageProcessCards.title,
        description: homepageProcessCards.description,
        imageId: homepageProcessCards.imageId,
        iconName: homepageProcessCards.iconName,
        icon: homepageProcessCards.icon,
        iconMediaId: homepageProcessCards.iconMediaId,
        iconType: homepageProcessCards.iconType,
        step: homepageProcessCards.step,
        sortOrder: homepageProcessCards.sortOrder,
        isActive: homepageProcessCards.isActive,
        category: homepageProcessCards.category,
        position: homepageProcessCards.position,
        createdAt: homepageProcessCards.createdAt,
      })
      .from(homepageProcessCards)
      .$dynamic();

    if (!includeInactive) {
      query.where(eq(homepageProcessCards.isActive, true));
    }

    const result = await query.orderBy(asc(homepageProcessCards.sortOrder)).limit(100);

    await unifiedCache.set(cacheKey, result, HOMEPAGE_CACHE_TTL / 1000, "data");
    return result as HomepageProcessCard[];
  }

  async getHomepageProcessCard(id: number): Promise<HomepageProcessCard | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getHomepageProcessCard(id);
    }
    const [card] = await db
      .select()
      .from(homepageProcessCards)
      .where(eq(homepageProcessCards.id, id))
      .limit(1);
    return card ?? undefined;
  }

  async createHomepageProcessCard(card: InsertHomepageProcessCard): Promise<HomepageProcessCard> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createHomepageProcessCard(card);
    }
    await unifiedCache.del("homepage:process_cards:*");
    const [created] = await db.insert(homepageProcessCards).values(card).returning();
    if (!created) throw new Error("Failed to create homepage process card");
    await emitCacheInvalidation("homepage:process_cards", "create");
    return created;
  }

  async updateHomepageProcessCard(
    id: number,
    card: Partial<InsertHomepageProcessCard>,
  ): Promise<HomepageProcessCard> {
    await unifiedCache.del("homepage:process_cards:*");
    const [updated] = await db
      .update(homepageProcessCards)
      .set(card)
      .where(eq(homepageProcessCards.id, id))
      .returning();

    if (!updated) throw new Error(`Failed to update homepage process card with id ${id}`);
    await emitCacheInvalidation("homepage:process_cards", "update");
    return updated;
  }

  async deleteHomepageProcessCard(id: number): Promise<boolean> {
    await unifiedCache.del("homepage:process_cards:*");
    const result = await db.delete(homepageProcessCards).where(eq(homepageProcessCards.id, id));
    await emitCacheInvalidation("homepage:process_cards", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderHomepageProcessCards(orderedIds: number[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i] as number;
        await tx
          .update(homepageProcessCards)
          .set({ sortOrder: i + 1 })
          .where(eq(homepageProcessCards.id, id));
      }
    });

    await unifiedCache.del("homepage:process_cards:*");
    await emitCacheInvalidation("homepage:process_cards", "update");
  }

  async getHomepageSections(includeInactive: boolean = false): Promise<HomepageSection[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getHomepageSections(includeInactive);
    }
    const cacheKey = includeInactive ? "homepage:sections:all" : "homepage:sections";
    const cached = await unifiedCache.get<HomepageSection[]>(cacheKey, "data");
    if (cached) return cached;

    let query = db.select().from(homepageSections).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(homepageSections.isActive, true));
    }

    const sections = await query.orderBy(asc(homepageSections.sortOrder));
    await unifiedCache.set(cacheKey, sections, HOMEPAGE_CACHE_TTL / 1000, "data");
    return sections;
  }

  async getHomepageSection(name: string): Promise<HomepageSection | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getHomepageSection(name);
    }
    const [section] = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.name, name))
      .limit(1);
    return section ?? undefined;
  }

  async getHomepageSectionById(id: number): Promise<HomepageSection | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getHomepageSectionById(id);
    }
    const [section] = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.id, id))
      .limit(1);
    return section ?? undefined;
  }

  async updateHomepageSection(
    name: string,
    section: Partial<InsertHomepageSection>,
  ): Promise<HomepageSection> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateHomepageSection(name, section);
    }
    const [existing] = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.name, name))
      .limit(1);

    await unifiedCache.del("homepage:sections:*");

    let result: HomepageSection;
    if (!existing) {
      const [created] = await db
        .insert(homepageSections)
        .values({ ...section, name } as InsertHomepageSection)
        .returning();
      if (!created) throw new Error(`Failed to create homepage section: ${name}`);
      result = created;
    } else {
      const [updated] = await db
        .update(homepageSections)
        .set({ ...section, updatedAt: new Date() })
        .where(eq(homepageSections.name, name))
        .returning();
      if (!updated) throw new Error(`Failed to update homepage section: ${name}`);
      result = updated;
    }

    await emitCacheInvalidation("homepage:sections", "update");
    return result;
  }

  async updateHomepageSectionById(
    id: number,
    section: Partial<InsertHomepageSection>,
  ): Promise<HomepageSection | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateHomepageSectionById(id, section);
    }
    await unifiedCache.del("homepage:sections:*");

    const [updated] = await db
      .update(homepageSections)
      .set({ ...section, updatedAt: new Date() })
      .where(eq(homepageSections.id, id))
      .returning();

    if (updated) {
      await emitCacheInvalidation("homepage:sections", "update");
    }

    return updated ?? undefined;
  }

  async getLogoAnimationSettings(): Promise<LogoAnimationSettings | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getLogoAnimationSettings();
    }
    const [settings] = await db.select().from(logoAnimationSettings).limit(1);
    return settings ?? undefined;
  }

  async updateLogoAnimationSettings(
    settings: Partial<InsertLogoAnimationSettings>,
  ): Promise<LogoAnimationSettings> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateLogoAnimationSettings(settings);
    }
    const existing = await db.select().from(logoAnimationSettings).limit(1);

    let result: LogoAnimationSettings;
    if (existing.length === 0) {
      const [created] = await db
        .insert(logoAnimationSettings)
        .values(settings as InsertLogoAnimationSettings)
        .returning();
      if (!created) throw new Error("Failed to create logo animation settings");
      result = created;
    } else {
      const settingsId = existing[0]!.id;
      const [updated] = await db
        .update(logoAnimationSettings)
        .set(settings)
        .where(eq(logoAnimationSettings.id, settingsId))
        .returning();
      if (!updated) throw new Error("Failed to update logo animation settings");
      result = updated;
    }

    await emitCacheInvalidation("logo:animation", "update");
    return result;
  }

  // =============================================================================
  // FEATURED PRODUCTS SETTINGS METHODS
  // =============================================================================

  async getHomepageFeaturedProductsSettings(): Promise<HomepageFeaturedProductsSettings> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getHomepageFeaturedProductsSettings();
    }
    const cacheKey = "homepage:featured_products_settings";
    const cached = await unifiedCache.get<HomepageFeaturedProductsSettings>(cacheKey, "data");
    if (cached) return cached;

    const [settings] = await db.select().from(homepageFeaturedProductsSettings).limit(1);

    if (settings) {
      await unifiedCache.set(cacheKey, settings, HOMEPAGE_CACHE_TTL / 1000, "data");
    }

    // Return default settings if none exist
    return (settings || {
      enabled: true,
      maxProducts: 8,
      sortBy: "featured",
      showPrices: true,
      autoSelect: true,
      selectedProductIds: [],
    }) as unknown as HomepageFeaturedProductsSettings;
  }

  async updateHomepageFeaturedProductsSettings(
    settings: Partial<InsertHomepageFeaturedProductsSettings>,
  ): Promise<HomepageFeaturedProductsSettings> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateHomepageFeaturedProductsSettings(settings);
    }
    await unifiedCache.del("homepage:featured_products_settings");

    const existing = await db.select().from(homepageFeaturedProductsSettings).limit(1);

    let result: HomepageFeaturedProductsSettings;
    if (existing.length === 0) {
      const [created] = await db
        .insert(homepageFeaturedProductsSettings)
        .values(settings as InsertHomepageFeaturedProductsSettings)
        .returning();
      if (!created) throw new Error("Failed to create homepage featured products settings");
      result = created;
    } else {
      const [updated] = await db
        .update(homepageFeaturedProductsSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(homepageFeaturedProductsSettings.id, existing[0]!.id))
        .returning();
      if (!updated) throw new Error("Failed to update homepage featured products settings");
      result = updated;
    }

    await emitCacheInvalidation("homepage:featured_products_settings", "update");
    return result;
  }

  // =============================================================================
  // ABOUT PAGE METHODS
  // =============================================================================

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

  // =============================================================================
  // SUSTAINABILITY METHODS
  // =============================================================================

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
    await unifiedCache.del("sustainability:hero");

    if (existing) {
      const [updated] = await db
        .update(sustainabilityHero)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(sustainabilityHero.id, existing.id))
        .returning();

      if (!updated) throw new Error("Failed to update sustainability hero");
      await emitCacheInvalidation("sustainability:hero", "update");
      return updated;
    }

    const [created] = await db
      .insert(sustainabilityHero)
      .values(data as InsertSustainabilityHero)
      .returning();
    if (!created) throw new Error("Failed to create sustainability hero");
    await emitCacheInvalidation("sustainability:hero", "create");
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
    await emitCacheInvalidation("sustainability:goals", "update");
    return updated;
  }

  async deleteSustainabilityGoal(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteSustainabilityGoal(id);
    }
    await unifiedCache.del("sustainability:goals:*");
    const result = await db.delete(sustainabilityGoals).where(eq(sustainabilityGoals.id, id));
    await emitCacheInvalidation("sustainability:goals", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderSustainabilityGoals(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderSustainabilityGoals(orderedIds);
    }
    await unifiedCache.del("sustainability:goals:*");
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(sustainabilityGoals)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(sustainabilityGoals.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("sustainability:goals", "update");
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

    if (!created) {
      throw new Error("Failed to create sustainability metric");
    }

    await unifiedCache.del("sustainability:metrics");
    await emitCacheInvalidation("sustainability:metrics", "create");
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

    if (!updated) {
      throw new Error(`Failed to update sustainability metric with id ${id}`);
    }

    await unifiedCache.del("sustainability:metrics");
    await emitCacheInvalidation("sustainability:metrics", "update");
    return updated;
  }

  async deleteSustainabilityMetric(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteSustainabilityMetric(id);
    }
    const result = await db.delete(sustainabilityMetrics).where(eq(sustainabilityMetrics.id, id));
    await unifiedCache.del("sustainability:metrics");
    await emitCacheInvalidation("sustainability:metrics", "delete");
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
    await unifiedCache.del("sustainability:metrics");
    await emitCacheInvalidation("sustainability:metrics", "update");
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

    await unifiedCache.del("sustainability:initiatives:*");
    await emitCacheInvalidation("sustainability:initiatives", "create");
    return created;
  }

  async updateSustainabilityInitiative(
    id: number,
    data: Partial<InsertSustainabilityInitiative>,
  ): Promise<SustainabilityInitiative> {
    if (StorageSingleton.hasInstance()) {
      const result = await StorageSingleton.getInstance().updateSustainabilityInitiative(id, data);
      if (!result) throw new Error(`updateSustainabilityInitiative returned undefined for id ${id}`);
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

    await unifiedCache.del("sustainability:initiatives:*");
    await emitCacheInvalidation("sustainability:initiatives", "update");
    return updated;
  }

  async deleteSustainabilityInitiative(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteSustainabilityInitiative(id);
    }
    const result = await db
      .delete(sustainabilityInitiatives)
      .where(eq(sustainabilityInitiatives.id, id));
    await unifiedCache.del("sustainability:initiatives:*");
    await emitCacheInvalidation("sustainability:initiatives", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderSustainabilityInitiatives(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderSustainabilityInitiatives(orderedIds);
    }
    await unifiedCache.del("sustainability:initiatives:*");
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(sustainabilityInitiatives)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(sustainabilityInitiatives.id, orderedIds[i] as number));
      }
    });
    await emitCacheInvalidation("sustainability:initiatives", "update");
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
    await unifiedCache.del("sustainability:unified");

    if (existing) {
      const [updated] = await db
        .update(unifiedSustainability)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(unifiedSustainability.id, existing.id))
        .returning();

      if (!updated) throw new Error("Failed to update unified sustainability");
      await emitCacheInvalidation("sustainability:unified", "update");
      return updated;
    }

    const [created] = await db
      .insert(unifiedSustainability)
      .values(data as InsertUnifiedSustainability)
      .returning();
    if (!created) throw new Error("Failed to create unified sustainability");
    await emitCacheInvalidation("sustainability:unified", "create");
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

  // =============================================================================
  // MANUFACTURING METHODS
  // =============================================================================

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
    await unifiedCache.del("manufacturing:qualities:*");
    const result = await db.delete(manufacturingQualities).where(eq(manufacturingQualities.id, id));
    await emitCacheInvalidation("manufacturing:qualities", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderManufacturingQualities(orderedIds: number[]): Promise<void> {
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

  // =============================================================================
  // TECHNOLOGY METHODS
  // =============================================================================

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
    await unifiedCache.del("technology:hero");

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
    await unifiedCache.del("technology:cta");
    await emitCacheInvalidation("technology:cta", "create");
    return created;
  }

  async updateTechnologyCta(data: Partial<InsertTechnologyCta>): Promise<TechnologyCta> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateTechnologyCta(data);
    }
    const existing = await this.getTechnologyCta();
    await unifiedCache.del("technology:cta");

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
    await unifiedCache.del("technology:cta");
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
    await unifiedCache.del("technology:equipment");
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
    await unifiedCache.del("technology:equipment");
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
    await unifiedCache.del("technology:equipment");
    const result = await db.delete(technologyEquipment).where(eq(technologyEquipment.id, id));
    await emitCacheInvalidation("technology:equipment", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTechnologyEquipment(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderTechnologyEquipment(orderedIds);
    }
    await unifiedCache.del("technology:equipment");
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
    await unifiedCache.del("technology:innovations:*");
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
    await unifiedCache.del("technology:innovations:*");
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
    await unifiedCache.del("technology:innovations:*");
    const result = await db.delete(technologyInnovations).where(eq(technologyInnovations.id, id));
    await emitCacheInvalidation("technology:innovations", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTechnologyInnovations(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderTechnologyInnovations(orderedIds);
    }
    await unifiedCache.del("technology:innovations:*");
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
    await unifiedCache.del("technology:research:*");
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
    await unifiedCache.del("technology:research:*");
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
    await unifiedCache.del("technology:research:*");
    const result = await db.delete(technologyResearch).where(eq(technologyResearch.id, id));
    await emitCacheInvalidation("technology:research", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTechnologyResearch(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderTechnologyResearch(orderedIds);
    }
    await unifiedCache.del("technology:research:*");
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
    await unifiedCache.del("technology:roadmap:*");
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
    await unifiedCache.del("technology:roadmap:*");
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
    await unifiedCache.del("technology:roadmap:*");
    const result = await db.delete(technologyRoadmap).where(eq(technologyRoadmap.id, id));
    await emitCacheInvalidation("technology:roadmap", "delete");
    return (result.rowCount ?? 0) > 0;
  }

  async reorderTechnologyRoadmap(orderedIds: number[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderTechnologyRoadmap(orderedIds);
    }
    await unifiedCache.del("technology:roadmap:*");
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
    await unifiedCache.del("technology:gradient");

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

  // =============================================================================
  // ABOUT SECTION UPDATE METHOD (missing)
  // =============================================================================

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

    const result: AboutBatchResponse = {
      hero: (hero as AboutHero) || null,
      timeline: timeline as AboutTimelineEntry[],
      locations: locations as AboutMapLocation[],
      sections: sections as AboutSection[],
      statistics: statistics as AboutStatistic[],
      teamMessage: (teamMessage as AboutTeamMessage) || null,
    };

    // Cache for 30 minutes
    await unifiedCache.set(cacheKey, result, (30 * 60 * 1000) / 1000, "data");
    return result;
  }
}
