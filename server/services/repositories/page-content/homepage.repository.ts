import {
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
  type InsertHomepageFeaturedProductsSettings,
  type InsertHomepageHero,
  type InsertHomepageProcessCard,
  type InsertHomepageSection,
  type InsertHomepageSlogan,
  type InsertLogoAnimationSettings,
  type LogoAnimationSettings,
  logoAnimationSettings,
} from "@run-remix/shared";
import { asc, eq } from "drizzle-orm";
import { db } from "../../../db.js";
import { emitCacheInvalidation } from "../../../lib/cache/cache-events.js";
import { UnifiedCache } from "../../../lib/cache/unified-cache.js";
import { logger } from "../../../lib/monitoring/logger.js";
import { StorageSingleton } from "../../../lib/storage-singleton.js";
import { invalidateHtmlCache } from "../../../middleware/ssr-cache.js";

const unifiedCache = UnifiedCache.getInstance();

// Cache TTL for homepage content - marketing content changes infrequently
const HOMEPAGE_CACHE_TTL = 3600; // 1 hour (in seconds)

class HomepageRepository {
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
      await invalidateHtmlCache("/");
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
    await invalidateHtmlCache("/");
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
    await invalidateHtmlCache("/");
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
    // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
    await db.transaction(async (tx: any) => {
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
    await invalidateHtmlCache("/");
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
    // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
    await db.transaction(async (tx: any) => {
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
    await invalidateHtmlCache("/");
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
}

export const homepageRepository = new HomepageRepository();
