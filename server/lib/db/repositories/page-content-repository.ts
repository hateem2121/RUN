import { asc, desc, eq, sql } from "drizzle-orm";
import {
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
} from "../../../../shared/schema.js";
import { type DbClient, db } from "../../../db.js";
import { emitCacheInvalidation } from "../../cache/cache-events.js";
import { UnifiedCache } from "../../cache/unified-cache.js";
import { logger } from "../../monitoring/logger.js";

const unifiedCache = UnifiedCache.getInstance();

// Cache TTL for homepage content - marketing content changes infrequently
const HOMEPAGE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export class PageContentRepository {
  // =============================================================================
  // HOMEPAGE METHODS
  // =============================================================================

  async getHomepageHero(): Promise<HomepageHero | undefined> {
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
    const existing = await db
      .select()
      .from(homepageHero)
      .where(eq(homepageHero.isActive, true))
      .orderBy(asc(homepageHero.id))
      .limit(1);

    try {
      await unifiedCache.delete("homepage:hero");
    } catch (error) {
      logger.debug("[Cache] Failed to clear homepage hero cache:", error);
    }

    let result;
    if (existing.length === 0) {
      const [created] = await db
        .insert(homepageHero)
        .values(hero as InsertHomepageHero)
        .returning();
      result = created!;
    } else {
      if (existing.length > 0 && existing[0]?.id) {
        const [updated] = await db
          .update(homepageHero)
          .set({ ...hero, updatedAt: sql`NOW()` })
          .where(eq(homepageHero.id, existing[0].id))
          .returning();
        result = updated!;
      } else {
        result = existing[0] as HomepageHero;
      }
    }

    try {
      await emitCacheInvalidation("homepage:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return result;
  }

  async getHomepageSlogans(): Promise<HomepageSlogan[]> {
    const cacheKey = "homepage:slogans";
    try {
      const cached = await unifiedCache.get<HomepageSlogan[]>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get homepage slogans from cache:", error);
    }

    const startTime = performance.now();
    const slogans = await db
      .select()
      .from(homepageSlogans)
      .where(eq(homepageSlogans.isActive, true))
      .orderBy(asc(homepageSlogans.sortOrder));
    const duration = performance.now() - startTime;

    try {
      await unifiedCache.set(cacheKey, slogans, HOMEPAGE_CACHE_TTL, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set homepage slogans cache:", error);
    }

    if (duration > 50) {
      logger.debug(
        `[Performance] getHomepageSlogans took ${duration.toFixed(
          2,
        )}ms (threshold: 50ms) - CACHED for future requests`,
      );
    }
    return slogans;
  }

  async getHomepageSlogan(id: number): Promise<HomepageSlogan | undefined> {
    const [slogan] = await db.select().from(homepageSlogans).where(eq(homepageSlogans.id, id));
    return slogan;
  }

  async createHomepageSlogan(slogan: InsertHomepageSlogan): Promise<HomepageSlogan> {
    try {
      await unifiedCache.delete("homepage:slogans");
    } catch (error) {
      logger.debug("[Cache] Failed to clear homepage slogans cache:", error);
    }

    const [created] = await db.insert(homepageSlogans).values(slogan).returning();

    try {
      await emitCacheInvalidation("homepage:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async updateHomepageSlogan(
    id: number,
    slogan: Partial<InsertHomepageSlogan>,
  ): Promise<HomepageSlogan | undefined> {
    try {
      await unifiedCache.delete("homepage:slogans");
    } catch (error) {
      logger.debug("[Cache] Failed to clear homepage slogans cache:", error);
    }

    const [updated] = await db
      .update(homepageSlogans)
      .set(slogan)
      .where(eq(homepageSlogans.id, id))
      .returning();

    try {
      await emitCacheInvalidation("homepage:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated!;
  }

  async deleteHomepageSlogan(id: number): Promise<boolean> {
    try {
      await unifiedCache.delete("homepage:slogans");
    } catch (error) {
      logger.debug("[Cache] Failed to clear homepage slogans cache:", error);
    }

    const result = await db.delete(homepageSlogans).where(eq(homepageSlogans.id, id));

    try {
      await emitCacheInvalidation("homepage:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async reorderHomepageSlogans(
    slogans: { id: number; position: number }[],
    tx?: DbClient,
  ): Promise<void> {
    const dbConn = tx || db;
    for (const slogan of slogans) {
      // Validate that position is defined and is a finite number (rejects NaN, Infinity, -Infinity)
      if (!Number.isFinite(slogan.position)) {
        logger.warn(
          `[reorderHomepageSlogans] Skipping slogan ${slogan.id} - invalid position:`,
          slogan.position,
        );
        continue;
      }

      // Ensure position is an integer
      const sortOrder = Math.floor(slogan.position);

      await dbConn
        .update(homepageSlogans)
        .set({ sortOrder })
        .where(eq(homepageSlogans.id, slogan.id));
    }

    // Invalidate cache after reordering
    try {
      await unifiedCache.delete("homepage:slogans");
    } catch (error) {
      logger.debug("[Cache] Failed to clear homepage slogans cache:", error);
    }

    try {
      await emitCacheInvalidation("homepage:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
  }

  async getHomepageProcessCards(includeInactive = false): Promise<HomepageProcessCard[]> {
    const cacheKey = "homepage:process_cards";
    // Zombie Cache Fix: Disable cache read to ensure fresh data
    /*
    try {
      const cached = await unifiedCache.get<HomepageProcessCard[]>(cacheKey, "data");
      if (cached) return cached;
    } catch (error) {
      logger.debug("[Cache] Failed to get homepage process cards from cache:", error);
    }
    */

    // PERFORMANCE: Select only columns needed for display
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
      })
      .from(homepageProcessCards)
      .$dynamic(); // Enable dynamic query building

    // Only filter by isActive if includeInactive is false (default behavior)
    if (!includeInactive) {
      query.where(eq(homepageProcessCards.isActive, true));
    }

    const result = await query.orderBy(asc(homepageProcessCards.sortOrder)).limit(100);

    try {
      await unifiedCache.set(cacheKey, result, HOMEPAGE_CACHE_TTL, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set cache:", error);
    }
    // Type assertion: Omitted columns (createdAt, category, position) are not used by frontend
    return result as HomepageProcessCard[];
  }

  async getHomepageProcessCard(id: number): Promise<HomepageProcessCard | undefined> {
    const [card] = await db
      .select()
      .from(homepageProcessCards)
      .where(eq(homepageProcessCards.id, id));
    return card;
  }

  async createHomepageProcessCard(card: InsertHomepageProcessCard): Promise<HomepageProcessCard> {
    const [created] = await db.insert(homepageProcessCards).values(card).returning();

    try {
      await unifiedCache.delete("homepage:process_cards");
    } catch (error) {
      logger.debug("[Cache] Failed to clear cache:", error);
    }

    try {
      await emitCacheInvalidation("homepage:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async updateHomepageProcessCard(
    id: number,
    card: Partial<InsertHomepageProcessCard>,
  ): Promise<HomepageProcessCard | undefined> {
    const [updated] = await db
      .update(homepageProcessCards)
      .set(card)
      .where(eq(homepageProcessCards.id, id))
      .returning();

    try {
      await unifiedCache.delete("homepage:process_cards");
    } catch (error) {
      logger.debug("[Cache] Failed to clear cache:", error);
    }

    try {
      await emitCacheInvalidation("homepage:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated!;
  }

  async deleteHomepageProcessCard(id: number): Promise<boolean> {
    const result = await db.delete(homepageProcessCards).where(eq(homepageProcessCards.id, id));

    try {
      await unifiedCache.delete("homepage:process_cards");
    } catch (error) {
      logger.debug("[Cache] Failed to clear cache:", error);
    }

    try {
      await emitCacheInvalidation("homepage:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async reorderHomepageProcessCards(
    cards: { id: number; position: number }[],
    tx?: DbClient,
  ): Promise<void> {
    const dbConn = tx || db;
    for (const card of cards) {
      await dbConn
        .update(homepageProcessCards)
        .set({ sortOrder: card.position })
        .where(eq(homepageProcessCards.id, card.id));
    }

    try {
      await unifiedCache.delete("homepage:process_cards");
    } catch (error) {
      logger.debug("[Cache] Failed to clear cache:", error);
    }

    try {
      await emitCacheInvalidation("homepage:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
  }

  async getHomepageSections(includeInactive: boolean = false): Promise<HomepageSection[]> {
    const cacheKey = includeInactive ? "homepage:sections:all" : "homepage:sections";
    try {
      const cached = await unifiedCache.get<HomepageSection[]>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get homepage sections from cache:", error);
    }

    let query = db.select().from(homepageSections).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(homepageSections.isActive, true));
    }

    const sections = await query.orderBy(asc(homepageSections.sortOrder));

    try {
      await unifiedCache.set(cacheKey, sections, HOMEPAGE_CACHE_TTL, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set homepage sections cache:", error);
    }

    return sections;
  }

  async getHomepageSection(name: string): Promise<HomepageSection | undefined> {
    const [section] = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.name, name));
    return section;
  }

  async getHomepageSectionById(id: number): Promise<HomepageSection | undefined> {
    const [section] = await db.select().from(homepageSections).where(eq(homepageSections.id, id));
    return section;
  }

  async updateHomepageSection(
    name: string,
    section: Partial<InsertHomepageSection>,
  ): Promise<HomepageSection> {
    const [existing] = await db
      .select()
      .from(homepageSections)
      .where(eq(homepageSections.name, name));

    try {
      await unifiedCache.delete("homepage:sections");
    } catch (error) {
      logger.debug("[Cache] Failed to clear homepage sections cache:", error);
    }

    let result;
    if (!existing) {
      const [created] = await db
        .insert(homepageSections)
        .values({ ...section, name } as InsertHomepageSection)
        .returning();
      result = created!;
    } else {
      const [updated] = await db
        .update(homepageSections)
        .set({ ...section, updatedAt: sql`NOW()` })
        .where(eq(homepageSections.name, name))
        .returning();
      result = updated!;
    }

    try {
      await emitCacheInvalidation("homepage:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return result;
  }

  async updateHomepageSectionById(
    id: number,
    section: Partial<InsertHomepageSection>,
  ): Promise<HomepageSection | undefined> {
    const [existing] = await db.select().from(homepageSections).where(eq(homepageSections.id, id));

    if (!existing) {
      return undefined;
    }

    try {
      await unifiedCache.delete("homepage:sections");
    } catch (error) {
      logger.debug("[Cache] Failed to clear homepage sections cache:", error);
    }

    const [updated] = await db
      .update(homepageSections)
      .set({ ...section, updatedAt: sql`NOW()` })
      .where(eq(homepageSections.id, id))
      .returning();

    try {
      await emitCacheInvalidation("homepage:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated!;
  }

  async getLogoAnimationSettings(): Promise<LogoAnimationSettings | undefined> {
    const [settings] = await db.select().from(logoAnimationSettings).limit(1);
    return settings;
  }

  async updateLogoAnimationSettings(
    settings: Partial<InsertLogoAnimationSettings>,
  ): Promise<LogoAnimationSettings> {
    const existing = await db.select().from(logoAnimationSettings).limit(1);

    let result;
    if (existing.length === 0) {
      const [created] = await db
        .insert(logoAnimationSettings)
        .values(settings as InsertLogoAnimationSettings)
        .returning();
      result = created!;
    } else {
      if (existing.length > 0 && existing[0]?.id) {
        const [updated] = await db
          .update(logoAnimationSettings)
          .set(settings)
          .where(eq(logoAnimationSettings.id, existing[0].id))
          .returning();
        result = updated!;
      } else {
        result = existing[0] as LogoAnimationSettings;
      }
    }

    try {
      await emitCacheInvalidation("homepage:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return result;
  }

  // =============================================================================
  // FEATURED PRODUCTS SETTINGS METHODS
  // =============================================================================

  async getHomepageFeaturedProductsSettings(): Promise<any> {
    const cacheKey = "homepage:featured_products_settings";
    try {
      const cached = await unifiedCache.get(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get homepage featured products settings from cache:", error);
    }

    const [settings] = await db.select().from(homepageFeaturedProductsSettings).limit(1);

    if (settings) {
      try {
        await unifiedCache.set(cacheKey, settings, HOMEPAGE_CACHE_TTL, "data");
      } catch (error) {
        logger.debug("[Cache] Failed to set homepage featured products settings cache:", error);
      }
    }

    // Return default settings if none exist
    return (
      settings || {
        enabled: true,
        maxProducts: 8,
        sortBy: "featured",
        showPrices: true,
        autoSelect: true,
        selectedProductIds: [],
      }
    );
  }

  async updateHomepageFeaturedProductsSettings(
    settings: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    try {
      await unifiedCache.delete("homepage:featured_products_settings");
    } catch (error) {
      logger.debug("[Cache] Failed to clear homepage featured products settings cache:", error);
    }

    const existing = await db.select().from(homepageFeaturedProductsSettings).limit(1);

    let result;
    if (existing.length === 0) {
      const [created] = await db
        .insert(homepageFeaturedProductsSettings)
        .values(settings as any)
        .returning();
      result = created!;
    } else {
      if (existing.length > 0 && existing[0]?.id) {
        const [updated] = await db
          .update(homepageFeaturedProductsSettings)
          .set({ ...settings, updatedAt: sql`NOW()` })
          .where(eq(homepageFeaturedProductsSettings.id, existing[0].id))
          .returning();
        result = updated!;
      } else {
        result = existing[0] as unknown as Record<string, unknown>; // Cast to match return type
      }
    }

    try {
      await emitCacheInvalidation("homepage:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return result as Record<string, unknown>;
  }

  // =============================================================================
  // ABOUT PAGE METHODS
  // =============================================================================

  async getAboutHero(includeInactive: boolean = false): Promise<AboutHero | undefined> {
    // PERFORMANCE: Cache about hero for 30min (truly static content, rarely changes)
    const cacheKey = includeInactive ? "about:hero:all" : "about:hero";
    try {
      const cached = await unifiedCache.get<AboutHero>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get about hero from cache:", error);
    }

    let query = db.select().from(aboutHero).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(aboutHero.isActive, true));
    }

    const [hero] = await query.limit(1);

    if (hero) {
      try {
        await unifiedCache.set(cacheKey, hero, 30 * 60 * 1000, "data");
      } catch (error) {
        logger.debug("[Cache] Failed to set about hero cache:", error);
      }
    }

    return hero;
  }

  async updateAboutHero(hero: Partial<InsertAboutHero>): Promise<AboutHero> {
    // PERFORMANCE: Invalidate 30min cache on update to prevent stale data
    try {
      await unifiedCache.delete("about:hero");
    } catch (error) {
      logger.debug("[Cache] Failed to clear about hero cache:", error);
    }

    const existing = await db.select().from(aboutHero).limit(1);

    let result;
    if (existing.length === 0) {
      const [created] = await db
        .insert(aboutHero)
        .values(hero as InsertAboutHero)
        .returning();
      result = created!;
    } else {
      if (existing.length > 0 && existing[0]?.id) {
        const [updated] = await db
          .update(aboutHero)
          .set({ ...hero, updatedAt: sql`NOW()` })
          .where(eq(aboutHero.id, existing[0].id))
          .returning();
        result = updated!;
      } else {
        result = existing[0] as AboutHero;
      }
    }

    try {
      await emitCacheInvalidation("about:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return result;
  }

  async getAboutTimelineEntries(includeInactive: boolean = false): Promise<AboutTimelineEntry[]> {
    let query = db.select().from(aboutTimelineEntries).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(aboutTimelineEntries.isActive, true));
    }
    return await query.orderBy(asc(aboutTimelineEntries.sortOrder));
  }

  async getAboutTimelineEntry(id: number): Promise<AboutTimelineEntry | undefined> {
    const [entry] = await db
      .select()
      .from(aboutTimelineEntries)
      .where(eq(aboutTimelineEntries.id, id));
    return entry;
  }

  async createAboutTimelineEntry(entry: InsertAboutTimelineEntry): Promise<AboutTimelineEntry> {
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
  ): Promise<AboutTimelineEntry | undefined> {
    const [updated] = await db
      .update(aboutTimelineEntries)
      .set(entry)
      .where(eq(aboutTimelineEntries.id, id))
      .returning();

    try {
      await emitCacheInvalidation("about:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated!;
  }

  async deleteAboutTimelineEntry(id: number): Promise<boolean> {
    const result = await db.delete(aboutTimelineEntries).where(eq(aboutTimelineEntries.id, id));

    try {
      await emitCacheInvalidation("about:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async reorderAboutTimelineEntries(entries: { id: number; position: number }[]): Promise<void> {
    for (const entry of entries) {
      await db
        .update(aboutTimelineEntries)
        .set({ sortOrder: entry.position })
        .where(eq(aboutTimelineEntries.id, entry.id));
    }

    try {
      await emitCacheInvalidation("about:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
  }

  async getAboutMapLocations(includeInactive: boolean = false): Promise<AboutMapLocation[]> {
    let query = db.select().from(aboutMapLocations).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(aboutMapLocations.isActive, true));
    }
    return await query.orderBy(asc(aboutMapLocations.name));
  }

  async getAboutMapLocation(id: number): Promise<AboutMapLocation | undefined> {
    const [location] = await db
      .select()
      .from(aboutMapLocations)
      .where(eq(aboutMapLocations.id, id));
    return location;
  }

  async createAboutMapLocation(location: InsertAboutMapLocation): Promise<AboutMapLocation> {
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
  ): Promise<AboutMapLocation | undefined> {
    const [updated] = await db
      .update(aboutMapLocations)
      .set(location)
      .where(eq(aboutMapLocations.id, id))
      .returning();

    try {
      await emitCacheInvalidation("about:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated!;
  }

  async deleteAboutMapLocation(id: number): Promise<boolean> {
    const result = await db.delete(aboutMapLocations).where(eq(aboutMapLocations.id, id));

    try {
      await emitCacheInvalidation("about:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async getAboutSections(includeInactive: boolean = false): Promise<AboutSection[]> {
    let query = db.select().from(aboutSections).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(aboutSections.isActive, true));
    }
    return await query.orderBy(asc(aboutSections.sortOrder));
  }

  async getAboutSection(id: number): Promise<AboutSection | undefined> {
    const [section] = await db.select().from(aboutSections).where(eq(aboutSections.id, id));
    return section;
  }

  async createAboutSection(section: InsertAboutSection): Promise<AboutSection> {
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
  ): Promise<AboutSection | undefined> {
    const [updated] = await db
      .update(aboutSections)
      .set({ ...section, updatedAt: sql`NOW()` })
      .where(eq(aboutSections.id, id))
      .returning();

    try {
      await emitCacheInvalidation("about:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated!;
  }

  async deleteAboutSection(id: number): Promise<boolean> {
    const result = await db.delete(aboutSections).where(eq(aboutSections.id, id));

    try {
      await emitCacheInvalidation("about:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async reorderAboutSections(sections: { id: number; position: number }[]): Promise<void> {
    for (const section of sections) {
      await db
        .update(aboutSections)
        .set({ sortOrder: section.position })
        .where(eq(aboutSections.id, section.id));
    }

    try {
      await emitCacheInvalidation("about:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
  }

  async getAboutStatistics(includeInactive: boolean = false): Promise<AboutStatistic[]> {
    let query = db.select().from(aboutStatistics).$dynamic();
    if (!includeInactive) {
      query = query.where(eq(aboutStatistics.isActive, true));
    }
    return await query.orderBy(asc(aboutStatistics.sortOrder));
  }

  async getAboutStatistic(id: number): Promise<AboutStatistic | undefined> {
    const [statistic] = await db.select().from(aboutStatistics).where(eq(aboutStatistics.id, id));
    return statistic;
  }

  async createAboutStatistic(statistic: InsertAboutStatistic): Promise<AboutStatistic> {
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
    const result = await db.delete(aboutStatistics).where(eq(aboutStatistics.id, id));

    try {
      await emitCacheInvalidation("about:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async reorderAboutStatistics(statistics: { id: number; position: number }[]): Promise<void> {
    for (const statistic of statistics) {
      await db
        .update(aboutStatistics)
        .set({ sortOrder: statistic.position })
        .where(eq(aboutStatistics.id, statistic.id));
    }

    try {
      await emitCacheInvalidation("about:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
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
    const cacheKey = "sustainability:hero";
    const cached = unifiedCache.get<SustainabilityHero>(cacheKey);
    if (cached) return cached;

    const [hero] = await db.select().from(sustainabilityHero).limit(1);
    if (hero) {
      unifiedCache.set(cacheKey, hero, HOMEPAGE_CACHE_TTL);
    }
    return hero;
  }

  async updateSustainabilityHero(
    data: Partial<InsertSustainabilityHero>,
  ): Promise<SustainabilityHero> {
    const existing = await this.getSustainabilityHero();

    if (existing) {
      const [updated] = await db
        .update(sustainabilityHero)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(sustainabilityHero.id, existing.id))
        .returning();
      unifiedCache.del("sustainability:hero");
      emitCacheInvalidation("sustainability:hero");
      return updated;
    } else {
      const [created] = await db.insert(sustainabilityHero).values(data).returning();
      unifiedCache.del("sustainability:hero");
      emitCacheInvalidation("sustainability:hero");
      return created;
    }
  }

  async getSustainabilityGoals(includeInactive = false): Promise<SustainabilityGoal[]> {
    let query = db.select().from(sustainabilityGoals).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(sustainabilityGoals.isActive, true));
    }

    return query.orderBy(asc(sustainabilityGoals.sortOrder));
  }

  async getSustainabilityGoal(id: string): Promise<SustainabilityGoal | undefined> {
    const [goal] = await db
      .select()
      .from(sustainabilityGoals)
      .where(eq(sustainabilityGoals.id, id))
      .limit(1);
    return goal;
  }

  async createSustainabilityGoal(data: InsertSustainabilityGoal): Promise<SustainabilityGoal> {
    const maxOrder = await db
      .select({ max: sql`MAX(${sustainabilityGoals.sortOrder})` })
      .from(sustainabilityGoals);
    const newOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [created] = await db
      .insert(sustainabilityGoals)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    unifiedCache.del("sustainability:goals:*");
    emitCacheInvalidation("sustainability:goals");
    return created;
  }

  async updateSustainabilityGoal(
    id: string,
    data: Partial<InsertSustainabilityGoal>,
  ): Promise<SustainabilityGoal> {
    const [updated] = await db
      .update(sustainabilityGoals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sustainabilityGoals.id, id))
      .returning();

    unifiedCache.del("sustainability:goals:*");
    emitCacheInvalidation("sustainability:goals");
    return updated;
  }

  async deleteSustainabilityGoal(id: string): Promise<boolean> {
    await db.delete(sustainabilityGoals).where(eq(sustainabilityGoals.id, id));
    unifiedCache.del("sustainability:goals:*");
    emitCacheInvalidation("sustainability:goals");
    return true;
  }

  async reorderSustainabilityGoals(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(sustainabilityGoals)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(sustainabilityGoals.id, orderedIds[i]));
      }
    });
    unifiedCache.del("sustainability:goals:*");
    emitCacheInvalidation("sustainability:goals");
  }

  async getSustainabilityMetrics(): Promise<SustainabilityMetric[]> {
    const cacheKey = "sustainability:metrics";
    const cached = unifiedCache.get<SustainabilityMetric[]>(cacheKey);
    if (cached) return cached;

    const metrics = await db
      .select()
      .from(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.isActive, true))
      .orderBy(asc(sustainabilityMetrics.sortOrder));

    unifiedCache.set(cacheKey, metrics, HOMEPAGE_CACHE_TTL);
    return metrics;
  }

  async getSustainabilityMetric(id: string): Promise<SustainabilityMetric | undefined> {
    const [metric] = await db
      .select()
      .from(sustainabilityMetrics)
      .where(eq(sustainabilityMetrics.id, id))
      .limit(1);
    return metric;
  }

  async createSustainabilityMetric(
    data: InsertSustainabilityMetric,
  ): Promise<SustainabilityMetric> {
    const maxOrder = await db
      .select({ max: sql`MAX(${sustainabilityMetrics.sortOrder})` })
      .from(sustainabilityMetrics);
    const newOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [created] = await db
      .insert(sustainabilityMetrics)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    unifiedCache.del("sustainability:metrics");
    emitCacheInvalidation("sustainability:metrics");
    return created;
  }

  async updateSustainabilityMetric(
    id: string,
    data: Partial<InsertSustainabilityMetric>,
  ): Promise<SustainabilityMetric> {
    const [updated] = await db
      .update(sustainabilityMetrics)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sustainabilityMetrics.id, id))
      .returning();

    unifiedCache.del("sustainability:metrics");
    emitCacheInvalidation("sustainability:metrics");
    return updated;
  }

  async deleteSustainabilityMetric(id: string): Promise<boolean> {
    await db.delete(sustainabilityMetrics).where(eq(sustainabilityMetrics.id, id));
    unifiedCache.del("sustainability:metrics");
    emitCacheInvalidation("sustainability:metrics");
    return true;
  }

  async reorderSustainabilityMetrics(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(sustainabilityMetrics)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(sustainabilityMetrics.id, orderedIds[i]));
      }
    });
    unifiedCache.del("sustainability:metrics");
    emitCacheInvalidation("sustainability:metrics");
  }

  async getSustainabilityInitiatives(includeInactive = false): Promise<SustainabilityInitiative[]> {
    let query = db.select().from(sustainabilityInitiatives).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(sustainabilityInitiatives.isActive, true));
    }

    return query.orderBy(asc(sustainabilityInitiatives.sortOrder));
  }

  async getSustainabilityInitiative(id: string): Promise<SustainabilityInitiative | undefined> {
    const [initiative] = await db
      .select()
      .from(sustainabilityInitiatives)
      .where(eq(sustainabilityInitiatives.id, id))
      .limit(1);
    return initiative;
  }

  async createSustainabilityInitiative(
    data: InsertSustainabilityInitiative,
  ): Promise<SustainabilityInitiative> {
    const maxOrder = await db
      .select({ max: sql`MAX(${sustainabilityInitiatives.sortOrder})` })
      .from(sustainabilityInitiatives);
    const newOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [created] = await db
      .insert(sustainabilityInitiatives)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    unifiedCache.del("sustainability:initiatives:*");
    emitCacheInvalidation("sustainability:initiatives");
    return created;
  }

  async updateSustainabilityInitiative(
    id: string,
    data: Partial<InsertSustainabilityInitiative>,
  ): Promise<SustainabilityInitiative> {
    const [updated] = await db
      .update(sustainabilityInitiatives)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sustainabilityInitiatives.id, id))
      .returning();

    unifiedCache.del("sustainability:initiatives:*");
    emitCacheInvalidation("sustainability:initiatives");
    return updated;
  }

  async deleteSustainabilityInitiative(id: string): Promise<boolean> {
    await db.delete(sustainabilityInitiatives).where(eq(sustainabilityInitiatives.id, id));
    unifiedCache.del("sustainability:initiatives:*");
    emitCacheInvalidation("sustainability:initiatives");
    return true;
  }

  async reorderSustainabilityInitiatives(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(sustainabilityInitiatives)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(sustainabilityInitiatives.id, orderedIds[i]));
      }
    });
    unifiedCache.del("sustainability:initiatives:*");
    emitCacheInvalidation("sustainability:initiatives");
  }

  async getUnifiedSustainability(): Promise<UnifiedSustainability | undefined> {
    const cacheKey = "sustainability:unified";
    const cached = unifiedCache.get<UnifiedSustainability>(cacheKey);
    if (cached) return cached;

    const [data] = await db.select().from(unifiedSustainability).limit(1);
    if (data) {
      unifiedCache.set(cacheKey, data, HOMEPAGE_CACHE_TTL);
    }
    return data;
  }

  async updateUnifiedSustainability(
    data: Partial<InsertUnifiedSustainability>,
  ): Promise<UnifiedSustainability> {
    const existing = await this.getUnifiedSustainability();

    if (existing) {
      const [updated] = await db
        .update(unifiedSustainability)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(unifiedSustainability.id, existing.id))
        .returning();
      unifiedCache.del("sustainability:unified");
      emitCacheInvalidation("sustainability:unified");
      return updated;
    } else {
      const [created] = await db.insert(unifiedSustainability).values(data).returning();
      unifiedCache.del("sustainability:unified");
      emitCacheInvalidation("sustainability:unified");
      return created;
    }
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
        heroData: hero ? JSON.stringify(hero) : null,
        goalsData: goals.length > 0 ? JSON.stringify(goals) : null,
        metricsData: metrics.length > 0 ? JSON.stringify(metrics) : null,
        initiativesData: initiatives.length > 0 ? JSON.stringify(initiatives) : null,
      });
      migrated = (hero ? 1 : 0) + goals.length + metrics.length + initiatives.length;
    }

    return { migrated };
  }

  // =============================================================================
  // MANUFACTURING METHODS
  // =============================================================================

  async getManufacturingHero(): Promise<ManufacturingHero | undefined> {
    const cacheKey = "manufacturing:hero";
    const cached = unifiedCache.get<ManufacturingHero>(cacheKey);
    if (cached) return cached;

    const [hero] = await db.select().from(manufacturingHero).limit(1);
    if (hero) {
      unifiedCache.set(cacheKey, hero, HOMEPAGE_CACHE_TTL);
    }
    return hero;
  }

  async updateManufacturingHero(
    data: Partial<InsertManufacturingHero>,
  ): Promise<ManufacturingHero> {
    const existing = await this.getManufacturingHero();

    if (existing) {
      const [updated] = await db
        .update(manufacturingHero)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(manufacturingHero.id, existing.id))
        .returning();
      unifiedCache.del("manufacturing:hero");
      emitCacheInvalidation("manufacturing:hero");
      return updated;
    } else {
      const [created] = await db.insert(manufacturingHero).values(data).returning();
      unifiedCache.del("manufacturing:hero");
      emitCacheInvalidation("manufacturing:hero");
      return created;
    }
  }

  async createManufacturingCapability(
    data: InsertManufacturingCapability,
  ): Promise<ManufacturingCapability> {
    const maxOrder = await db
      .select({ max: sql`MAX(${manufacturingCapabilities.sortOrder})` })
      .from(manufacturingCapabilities);
    const newOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [created] = await db
      .insert(manufacturingCapabilities)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    unifiedCache.del("manufacturing:capabilities:*");
    emitCacheInvalidation("manufacturing:capabilities");
    return created;
  }

  async getManufacturingCapabilities(includeInactive = false): Promise<ManufacturingCapability[]> {
    let query = db.select().from(manufacturingCapabilities).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(manufacturingCapabilities.isActive, true));
    }

    return query.orderBy(asc(manufacturingCapabilities.sortOrder));
  }

  async getManufacturingCapability(id: string): Promise<ManufacturingCapability | undefined> {
    const [capability] = await db
      .select()
      .from(manufacturingCapabilities)
      .where(eq(manufacturingCapabilities.id, id))
      .limit(1);
    return capability;
  }

  async updateManufacturingCapability(
    id: string,
    data: Partial<InsertManufacturingCapability>,
  ): Promise<ManufacturingCapability> {
    const [updated] = await db
      .update(manufacturingCapabilities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(manufacturingCapabilities.id, id))
      .returning();

    unifiedCache.del("manufacturing:capabilities:*");
    emitCacheInvalidation("manufacturing:capabilities");
    return updated;
  }

  async deleteManufacturingCapability(id: string): Promise<boolean> {
    await db.delete(manufacturingCapabilities).where(eq(manufacturingCapabilities.id, id));
    unifiedCache.del("manufacturing:capabilities:*");
    emitCacheInvalidation("manufacturing:capabilities");
    return true;
  }

  async reorderManufacturingCapabilities(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(manufacturingCapabilities)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(manufacturingCapabilities.id, orderedIds[i]));
      }
    });
    unifiedCache.del("manufacturing:capabilities:*");
    emitCacheInvalidation("manufacturing:capabilities");
  }

  async getManufacturingProcess(id: string): Promise<ManufacturingProcess | undefined> {
    const [process] = await db
      .select()
      .from(manufacturingProcesses)
      .where(eq(manufacturingProcesses.id, id))
      .limit(1);
    return process;
  }

  async getManufacturingProcesses(includeInactive = false): Promise<ManufacturingProcess[]> {
    let query = db.select().from(manufacturingProcesses).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(manufacturingProcesses.isActive, true));
    }

    return query.orderBy(asc(manufacturingProcesses.sortOrder));
  }

  async createManufacturingProcess(
    data: InsertManufacturingProcess,
  ): Promise<ManufacturingProcess> {
    const maxOrder = await db
      .select({ max: sql`MAX(${manufacturingProcesses.sortOrder})` })
      .from(manufacturingProcesses);
    const newOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [created] = await db
      .insert(manufacturingProcesses)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    unifiedCache.del("manufacturing:processes:*");
    emitCacheInvalidation("manufacturing:processes");
    return created;
  }

  async updateManufacturingProcess(
    id: string,
    data: Partial<InsertManufacturingProcess>,
  ): Promise<ManufacturingProcess> {
    const [updated] = await db
      .update(manufacturingProcesses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(manufacturingProcesses.id, id))
      .returning();

    unifiedCache.del("manufacturing:processes:*");
    emitCacheInvalidation("manufacturing:processes");
    return updated;
  }

  async deleteManufacturingProcess(id: string): Promise<boolean> {
    await db.delete(manufacturingProcesses).where(eq(manufacturingProcesses.id, id));
    unifiedCache.del("manufacturing:processes:*");
    emitCacheInvalidation("manufacturing:processes");
    return true;
  }

  async reorderManufacturingProcesses(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(manufacturingProcesses)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(manufacturingProcesses.id, orderedIds[i]));
      }
    });
    unifiedCache.del("manufacturing:processes:*");
    emitCacheInvalidation("manufacturing:processes");
  }

  async getManufacturingQuality(id: string): Promise<ManufacturingQuality | undefined> {
    const [quality] = await db
      .select()
      .from(manufacturingQualities)
      .where(eq(manufacturingQualities.id, id))
      .limit(1);
    return quality;
  }

  async getManufacturingQualities(includeInactive = false): Promise<ManufacturingQuality[]> {
    let query = db.select().from(manufacturingQualities).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(manufacturingQualities.isActive, true));
    }

    return query.orderBy(asc(manufacturingQualities.sortOrder));
  }

  async createManufacturingQuality(
    data: InsertManufacturingQuality,
  ): Promise<ManufacturingQuality> {
    const maxOrder = await db
      .select({ max: sql`MAX(${manufacturingQualities.sortOrder})` })
      .from(manufacturingQualities);
    const newOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [created] = await db
      .insert(manufacturingQualities)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    unifiedCache.del("manufacturing:qualities:*");
    emitCacheInvalidation("manufacturing:qualities");
    return created;
  }

  async updateManufacturingQuality(
    id: string,
    data: Partial<InsertManufacturingQuality>,
  ): Promise<ManufacturingQuality> {
    const [updated] = await db
      .update(manufacturingQualities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(manufacturingQualities.id, id))
      .returning();

    unifiedCache.del("manufacturing:qualities:*");
    emitCacheInvalidation("manufacturing:qualities");
    return updated;
  }

  async deleteManufacturingQuality(id: string): Promise<boolean> {
    await db.delete(manufacturingQualities).where(eq(manufacturingQualities.id, id));
    unifiedCache.del("manufacturing:qualities:*");
    emitCacheInvalidation("manufacturing:qualities");
    return true;
  }

  async reorderManufacturingQualities(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(manufacturingQualities)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(manufacturingQualities.id, orderedIds[i]));
      }
    });
    unifiedCache.del("manufacturing:qualities:*");
    emitCacheInvalidation("manufacturing:qualities");
  }

  // =============================================================================
  // TECHNOLOGY METHODS
  // =============================================================================

  async getTechnologyHero(): Promise<TechnologyHero | undefined> {
    const cacheKey = "technology:hero";
    const cached = unifiedCache.get<TechnologyHero>(cacheKey);
    if (cached) return cached;

    const [hero] = await db.select().from(technologyHero).limit(1);
    if (hero) {
      unifiedCache.set(cacheKey, hero, HOMEPAGE_CACHE_TTL);
    }
    return hero;
  }

  async updateTechnologyHero(data: Partial<InsertTechnologyHero>): Promise<TechnologyHero> {
    const existing = await this.getTechnologyHero();

    if (existing) {
      const [updated] = await db
        .update(technologyHero)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(technologyHero.id, existing.id))
        .returning();
      unifiedCache.del("technology:hero");
      emitCacheInvalidation("technology:hero");
      return updated;
    } else {
      const [created] = await db.insert(technologyHero).values(data).returning();
      unifiedCache.del("technology:hero");
      emitCacheInvalidation("technology:hero");
      return created;
    }
  }

  async getTechnologyCta(): Promise<TechnologyCta | undefined> {
    const cacheKey = "technology:cta";
    const cached = unifiedCache.get<TechnologyCta>(cacheKey);
    if (cached) return cached;

    const [cta] = await db.select().from(technologyCta).limit(1);
    if (cta) {
      unifiedCache.set(cacheKey, cta, HOMEPAGE_CACHE_TTL);
    }
    return cta;
  }

  async createTechnologyCta(data: InsertTechnologyCta): Promise<TechnologyCta> {
    const [created] = await db.insert(technologyCta).values(data).returning();
    unifiedCache.del("technology:cta");
    emitCacheInvalidation("technology:cta");
    return created;
  }

  async updateTechnologyCta(
    id: string,
    data: Partial<InsertTechnologyCta>,
  ): Promise<TechnologyCta> {
    const [updated] = await db
      .update(technologyCta)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(technologyCta.id, id))
      .returning();

    unifiedCache.del("technology:cta");
    emitCacheInvalidation("technology:cta");
    return updated;
  }

  async deleteTechnologyCta(id: string): Promise<boolean> {
    await db.delete(technologyCta).where(eq(technologyCta.id, id));
    unifiedCache.del("technology:cta");
    emitCacheInvalidation("technology:cta");
    return true;
  }

  async getTechnologyEquipment(): Promise<TechnologyEquipment[]> {
    const cacheKey = "technology:equipment";
    const cached = unifiedCache.get<TechnologyEquipment[]>(cacheKey);
    if (cached) return cached;

    const equipment = await db
      .select()
      .from(technologyEquipment)
      .where(eq(technologyEquipment.isActive, true))
      .orderBy(asc(technologyEquipment.sortOrder));

    unifiedCache.set(cacheKey, equipment, HOMEPAGE_CACHE_TTL);
    return equipment;
  }

  async getTechnologyEquipmentItem(id: string): Promise<TechnologyEquipment | undefined> {
    const [item] = await db
      .select()
      .from(technologyEquipment)
      .where(eq(technologyEquipment.id, id))
      .limit(1);
    return item;
  }

  async createTechnologyEquipment(data: InsertTechnologyEquipment): Promise<TechnologyEquipment> {
    const maxOrder = await db
      .select({ max: sql`MAX(${technologyEquipment.sortOrder})` })
      .from(technologyEquipment);
    const newOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [created] = await db
      .insert(technologyEquipment)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    unifiedCache.del("technology:equipment");
    emitCacheInvalidation("technology:equipment");
    return created;
  }

  async updateTechnologyEquipment(
    id: string,
    data: Partial<InsertTechnologyEquipment>,
  ): Promise<TechnologyEquipment> {
    const [updated] = await db
      .update(technologyEquipment)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(technologyEquipment.id, id))
      .returning();

    unifiedCache.del("technology:equipment");
    emitCacheInvalidation("technology:equipment");
    return updated;
  }

  async deleteTechnologyEquipment(id: string): Promise<boolean> {
    await db.delete(technologyEquipment).where(eq(technologyEquipment.id, id));
    unifiedCache.del("technology:equipment");
    emitCacheInvalidation("technology:equipment");
    return true;
  }

  async reorderTechnologyEquipment(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(technologyEquipment)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(technologyEquipment.id, orderedIds[i]));
      }
    });
    unifiedCache.del("technology:equipment");
    emitCacheInvalidation("technology:equipment");
  }

  async getTechnologyInnovations(includeInactive = false): Promise<TechnologyInnovation[]> {
    let query = db.select().from(technologyInnovations).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(technologyInnovations.isActive, true));
    }

    return query.orderBy(asc(technologyInnovations.sortOrder));
  }

  async getTechnologyInnovation(id: string): Promise<TechnologyInnovation | undefined> {
    const [innovation] = await db
      .select()
      .from(technologyInnovations)
      .where(eq(technologyInnovations.id, id))
      .limit(1);
    return innovation;
  }

  async createTechnologyInnovation(
    data: InsertTechnologyInnovation,
  ): Promise<TechnologyInnovation> {
    const maxOrder = await db
      .select({ max: sql`MAX(${technologyInnovations.sortOrder})` })
      .from(technologyInnovations);
    const newOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [created] = await db
      .insert(technologyInnovations)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    unifiedCache.del("technology:innovations:*");
    emitCacheInvalidation("technology:innovations");
    return created;
  }

  async updateTechnologyInnovation(
    id: string,
    data: Partial<InsertTechnologyInnovation>,
  ): Promise<TechnologyInnovation> {
    const [updated] = await db
      .update(technologyInnovations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(technologyInnovations.id, id))
      .returning();

    unifiedCache.del("technology:innovations:*");
    emitCacheInvalidation("technology:innovations");
    return updated;
  }

  async deleteTechnologyInnovation(id: string): Promise<boolean> {
    await db.delete(technologyInnovations).where(eq(technologyInnovations.id, id));
    unifiedCache.del("technology:innovations:*");
    emitCacheInvalidation("technology:innovations");
    return true;
  }

  async reorderTechnologyInnovations(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(technologyInnovations)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(technologyInnovations.id, orderedIds[i]));
      }
    });
    unifiedCache.del("technology:innovations:*");
    emitCacheInvalidation("technology:innovations");
  }

  async getTechnologyResearch(includeInactive = false): Promise<TechnologyResearch[]> {
    let query = db.select().from(technologyResearch).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(technologyResearch.isActive, true));
    }

    return query.orderBy(asc(technologyResearch.sortOrder));
  }

  async getTechnologyResearchItem(id: string): Promise<TechnologyResearch | undefined> {
    const [item] = await db
      .select()
      .from(technologyResearch)
      .where(eq(technologyResearch.id, id))
      .limit(1);
    return item;
  }

  async createTechnologyResearch(data: InsertTechnologyResearch): Promise<TechnologyResearch> {
    const maxOrder = await db
      .select({ max: sql`MAX(${technologyResearch.sortOrder})` })
      .from(technologyResearch);
    const newOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [created] = await db
      .insert(technologyResearch)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    unifiedCache.del("technology:research:*");
    emitCacheInvalidation("technology:research");
    return created;
  }

  async updateTechnologyResearch(
    id: string,
    data: Partial<InsertTechnologyResearch>,
  ): Promise<TechnologyResearch> {
    const [updated] = await db
      .update(technologyResearch)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(technologyResearch.id, id))
      .returning();

    unifiedCache.del("technology:research:*");
    emitCacheInvalidation("technology:research");
    return updated;
  }

  async deleteTechnologyResearch(id: string): Promise<boolean> {
    await db.delete(technologyResearch).where(eq(technologyResearch.id, id));
    unifiedCache.del("technology:research:*");
    emitCacheInvalidation("technology:research");
    return true;
  }

  async reorderTechnologyResearch(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(technologyResearch)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(technologyResearch.id, orderedIds[i]));
      }
    });
    unifiedCache.del("technology:research:*");
    emitCacheInvalidation("technology:research");
  }

  async getTechnologyRoadmap(includeInactive = false): Promise<TechnologyRoadmap[]> {
    let query = db.select().from(technologyRoadmap).$dynamic();

    if (!includeInactive) {
      query = query.where(eq(technologyRoadmap.isActive, true));
    }

    return query.orderBy(asc(technologyRoadmap.sortOrder));
  }

  async getTechnologyRoadmapItem(id: string): Promise<TechnologyRoadmap | undefined> {
    const [item] = await db
      .select()
      .from(technologyRoadmap)
      .where(eq(technologyRoadmap.id, id))
      .limit(1);
    return item;
  }

  async createTechnologyRoadmap(data: InsertTechnologyRoadmap): Promise<TechnologyRoadmap> {
    const maxOrder = await db
      .select({ max: sql`MAX(${technologyRoadmap.sortOrder})` })
      .from(technologyRoadmap);
    const newOrder = (maxOrder[0]?.max ?? 0) + 1;

    const [created] = await db
      .insert(technologyRoadmap)
      .values({ ...data, sortOrder: newOrder })
      .returning();

    unifiedCache.del("technology:roadmap:*");
    emitCacheInvalidation("technology:roadmap");
    return created;
  }

  async updateTechnologyRoadmap(
    id: string,
    data: Partial<InsertTechnologyRoadmap>,
  ): Promise<TechnologyRoadmap> {
    const [updated] = await db
      .update(technologyRoadmap)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(technologyRoadmap.id, id))
      .returning();

    unifiedCache.del("technology:roadmap:*");
    emitCacheInvalidation("technology:roadmap");
    return updated;
  }

  async deleteTechnologyRoadmap(id: string): Promise<boolean> {
    await db.delete(technologyRoadmap).where(eq(technologyRoadmap.id, id));
    unifiedCache.del("technology:roadmap:*");
    emitCacheInvalidation("technology:roadmap");
    return true;
  }

  async reorderTechnologyRoadmap(orderedIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(technologyRoadmap)
          .set({ sortOrder: i + 1, updatedAt: new Date() })
          .where(eq(technologyRoadmap.id, orderedIds[i]));
      }
    });
    unifiedCache.del("technology:roadmap:*");
    emitCacheInvalidation("technology:roadmap");
  }

  async getTechnologyGradientSettings(): Promise<TechnologyGradientSettings | undefined> {
    const cacheKey = "technology:gradient";
    const cached = unifiedCache.get<TechnologyGradientSettings>(cacheKey);
    if (cached) return cached;

    const [settings] = await db.select().from(technologyGradientSettings).limit(1);
    if (settings) {
      unifiedCache.set(cacheKey, settings, HOMEPAGE_CACHE_TTL);
    }
    return settings;
  }

  async updateTechnologyGradientSettings(
    data: Partial<InsertTechnologyGradientSettings>,
  ): Promise<TechnologyGradientSettings> {
    const existing = await this.getTechnologyGradientSettings();

    if (existing) {
      const [updated] = await db
        .update(technologyGradientSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(technologyGradientSettings.id, existing.id))
        .returning();
      unifiedCache.del("technology:gradient");
      emitCacheInvalidation("technology:gradient");
      return updated;
    } else {
      const [created] = await db.insert(technologyGradientSettings).values(data).returning();
      unifiedCache.del("technology:gradient");
      emitCacheInvalidation("technology:gradient");
      return created;
    }
  }

  // =============================================================================
  // ABOUT SECTION UPDATE METHOD (missing)
  // =============================================================================

  async updateAboutTeamMessage(data: Partial<InsertAboutTeamMessage>): Promise<AboutTeamMessage> {
    const existing = await this.getAboutTeamMessage(true);

    if (existing) {
      const [updated] = await db
        .update(aboutTeamMessages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(aboutTeamMessages.id, existing.id))
        .returning();
      unifiedCache.del("about:team-message");
      emitCacheInvalidation("about:team-message");
      return updated;
    } else {
      const [created] = await db.insert(aboutTeamMessages).values(data).returning();
      unifiedCache.del("about:team-message");
      emitCacheInvalidation("about:team-message");
      return created;
    }
  }
}
