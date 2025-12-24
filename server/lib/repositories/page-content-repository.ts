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
	technologyCta,
	technologyEquipment,
	technologyGradientSettings,
	technologyHero,
	technologyInnovations,
	technologyResearch,
	technologyRoadmap,
	type UnifiedSustainability,
	unifiedSustainability,
} from "../../../shared/schema.js";
import { type DbClient, db } from "../../db.js";
import { emitCacheInvalidation } from "../cache-events.js";
import { logger } from "../smart-logger.js";
import { UnifiedCache } from "../unified-cache.js";

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
			if (cached) return cached;
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

	async updateHomepageHero(
		hero: Partial<InsertHomepageHero>,
	): Promise<HomepageHero> {
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
			const [updated] = await db
				.update(homepageHero)
				.set({ ...hero, updatedAt: sql`NOW()` })
				.where(eq(homepageHero.id, existing[0]!.id))
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

	async getHomepageSlogans(): Promise<HomepageSlogan[]> {
		const cacheKey = "homepage:slogans";
		try {
			const cached = await unifiedCache.get<HomepageSlogan[]>(cacheKey, "data");
			if (cached) return cached;
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
		const [slogan] = await db
			.select()
			.from(homepageSlogans)
			.where(eq(homepageSlogans.id, id));
		return slogan;
	}

	async createHomepageSlogan(
		slogan: InsertHomepageSlogan,
	): Promise<HomepageSlogan> {
		try {
			await unifiedCache.delete("homepage:slogans");
		} catch (error) {
			logger.debug("[Cache] Failed to clear homepage slogans cache:", error);
		}

		const [created] = await db
			.insert(homepageSlogans)
			.values(slogan)
			.returning();

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

		const result = await db
			.delete(homepageSlogans)
			.where(eq(homepageSlogans.id, id));

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

	async getHomepageProcessCards(
		includeInactive = false,
	): Promise<HomepageProcessCard[]> {
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

		const result = await query
			.orderBy(asc(homepageProcessCards.sortOrder))
			.limit(100);

		try {
			await unifiedCache.set(cacheKey, result, HOMEPAGE_CACHE_TTL, "data");
		} catch (error) {
			logger.debug("[Cache] Failed to set cache:", error);
		}
		// Type assertion: Omitted columns (createdAt, category, position) are not used by frontend
		return result as HomepageProcessCard[];
	}

	async getHomepageProcessCard(
		id: number,
	): Promise<HomepageProcessCard | undefined> {
		const [card] = await db
			.select()
			.from(homepageProcessCards)
			.where(eq(homepageProcessCards.id, id));
		return card;
	}

	async createHomepageProcessCard(
		card: InsertHomepageProcessCard,
	): Promise<HomepageProcessCard> {
		const [created] = await db
			.insert(homepageProcessCards)
			.values(card)
			.returning();

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
		const result = await db
			.delete(homepageProcessCards)
			.where(eq(homepageProcessCards.id, id));

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

	async getHomepageSections(
		includeInactive: boolean = false,
	): Promise<HomepageSection[]> {
		const cacheKey = includeInactive
			? "homepage:sections:all"
			: "homepage:sections";
		try {
			const cached = await unifiedCache.get<HomepageSection[]>(
				cacheKey,
				"data",
			);
			if (cached) return cached;
		} catch (error) {
			logger.debug(
				"[Cache] Failed to get homepage sections from cache:",
				error,
			);
		}

		let query = db.select().from(homepageSections);

		if (!includeInactive) {
			// @ts-expect-error - dynamic query construction
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

	async getHomepageSectionById(
		id: number,
	): Promise<HomepageSection | undefined> {
		const [section] = await db
			.select()
			.from(homepageSections)
			.where(eq(homepageSections.id, id));
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
		const [existing] = await db
			.select()
			.from(homepageSections)
			.where(eq(homepageSections.id, id));

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
			const [updated] = await db
				.update(logoAnimationSettings)
				.set(settings)
				.where(eq(logoAnimationSettings.id, existing[0]!.id))
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

	// =============================================================================
	// FEATURED PRODUCTS SETTINGS METHODS
	// =============================================================================

	async getHomepageFeaturedProductsSettings(): Promise<any> {
		const cacheKey = "homepage:featured_products_settings";
		try {
			const cached = await unifiedCache.get(cacheKey, "data");
			if (cached) return cached;
		} catch (error) {
			logger.debug(
				"[Cache] Failed to get homepage featured products settings from cache:",
				error,
			);
		}

		const [settings] = await db
			.select()
			.from(homepageFeaturedProductsSettings)
			.limit(1);

		if (settings) {
			try {
				await unifiedCache.set(cacheKey, settings, HOMEPAGE_CACHE_TTL, "data");
			} catch (error) {
				logger.debug(
					"[Cache] Failed to set homepage featured products settings cache:",
					error,
				);
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
			logger.debug(
				"[Cache] Failed to clear homepage featured products settings cache:",
				error,
			);
		}

		const existing = await db
			.select()
			.from(homepageFeaturedProductsSettings)
			.limit(1);

		let result;
		if (existing.length === 0) {
			const [created] = await db
				.insert(homepageFeaturedProductsSettings)
				.values(settings as any)
				.returning();
			result = created!;
		} else {
			const [updated] = await db
				.update(homepageFeaturedProductsSettings)
				.set({ ...settings, updatedAt: sql`NOW()` })
				.where(eq(homepageFeaturedProductsSettings.id, existing[0]!.id))
				.returning();
			result = updated!;
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

	async getAboutHero(): Promise<AboutHero | undefined> {
		// PERFORMANCE: Cache about hero for 30min (truly static content, rarely changes)
		const cacheKey = "about:hero";
		try {
			const cached = await unifiedCache.get<AboutHero>(cacheKey, "data");
			if (cached) return cached;
		} catch (error) {
			logger.debug("[Cache] Failed to get about hero from cache:", error);
		}

		const [hero] = await db
			.select()
			.from(aboutHero)
			.where(eq(aboutHero.isActive, true))
			.limit(1);

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
			const [updated] = await db
				.update(aboutHero)
				.set({ ...hero, updatedAt: sql`NOW()` })
				.where(eq(aboutHero.id, existing[0]!.id))
				.returning();
			result = updated!;
		}

		try {
			await emitCacheInvalidation("about:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return result;
	}

	async getAboutTimelineEntries(): Promise<AboutTimelineEntry[]> {
		return await db
			.select()
			.from(aboutTimelineEntries)
			.where(eq(aboutTimelineEntries.isActive, true))
			.orderBy(asc(aboutTimelineEntries.sortOrder));
	}

	async getAboutTimelineEntry(
		id: number,
	): Promise<AboutTimelineEntry | undefined> {
		const [entry] = await db
			.select()
			.from(aboutTimelineEntries)
			.where(eq(aboutTimelineEntries.id, id));
		return entry;
	}

	async createAboutTimelineEntry(
		entry: InsertAboutTimelineEntry,
	): Promise<AboutTimelineEntry> {
		const [created] = await db
			.insert(aboutTimelineEntries)
			.values(entry)
			.returning();

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
		const result = await db
			.delete(aboutTimelineEntries)
			.where(eq(aboutTimelineEntries.id, id));

		try {
			await emitCacheInvalidation("about:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderAboutTimelineEntries(
		entries: { id: number; position: number }[],
	): Promise<void> {
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

	async getAboutMapLocations(): Promise<AboutMapLocation[]> {
		return await db
			.select()
			.from(aboutMapLocations)
			.where(eq(aboutMapLocations.isActive, true))
			.orderBy(asc(aboutMapLocations.name));
	}

	async getAboutMapLocation(id: number): Promise<AboutMapLocation | undefined> {
		const [location] = await db
			.select()
			.from(aboutMapLocations)
			.where(eq(aboutMapLocations.id, id));
		return location;
	}

	async createAboutMapLocation(
		location: InsertAboutMapLocation,
	): Promise<AboutMapLocation> {
		const [created] = await db
			.insert(aboutMapLocations)
			.values(location)
			.returning();

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
		const result = await db
			.delete(aboutMapLocations)
			.where(eq(aboutMapLocations.id, id));

		try {
			await emitCacheInvalidation("about:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async getAboutSections(): Promise<AboutSection[]> {
		return await db
			.select()
			.from(aboutSections)
			.where(eq(aboutSections.isActive, true))
			.orderBy(asc(aboutSections.sortOrder));
	}

	async getAboutSection(id: number): Promise<AboutSection | undefined> {
		const [section] = await db
			.select()
			.from(aboutSections)
			.where(eq(aboutSections.id, id));
		return section;
	}

	async createAboutSection(section: InsertAboutSection): Promise<AboutSection> {
		const [created] = await db
			.insert(aboutSections)
			.values(section)
			.returning();

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
		const result = await db
			.delete(aboutSections)
			.where(eq(aboutSections.id, id));

		try {
			await emitCacheInvalidation("about:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderAboutSections(
		sections: { id: number; position: number }[],
	): Promise<void> {
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

	async getAboutStatistics(): Promise<AboutStatistic[]> {
		return await db
			.select()
			.from(aboutStatistics)
			.where(eq(aboutStatistics.isActive, true))
			.orderBy(asc(aboutStatistics.sortOrder));
	}

	async getAboutStatistic(id: number): Promise<AboutStatistic | undefined> {
		const [statistic] = await db
			.select()
			.from(aboutStatistics)
			.where(eq(aboutStatistics.id, id));
		return statistic;
	}

	async createAboutStatistic(
		statistic: InsertAboutStatistic,
	): Promise<AboutStatistic> {
		const [created] = await db
			.insert(aboutStatistics)
			.values(statistic)
			.returning();

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
		const result = await db
			.delete(aboutStatistics)
			.where(eq(aboutStatistics.id, id));

		try {
			await emitCacheInvalidation("about:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderAboutStatistics(
		statistics: { id: number; position: number }[],
	): Promise<void> {
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

	async getAboutTeamMessage(): Promise<AboutTeamMessage | undefined> {
		const [message] = await db
			.select()
			.from(aboutTeamMessages)
			.where(eq(aboutTeamMessages.isActive, true))
			.limit(1);
		return message;
	}

	async updateAboutTeamMessage(
		message: Partial<InsertAboutTeamMessage>,
	): Promise<AboutTeamMessage> {
		const existing = await db.select().from(aboutTeamMessages).limit(1);

		let result;
		if (existing.length === 0) {
			// Create with default values for required fields
			const [created] = await db
				.insert(aboutTeamMessages)
				.values({
					name: message.title || "Team Message",
					message: message.message || "",
					...message,
				} as InsertAboutTeamMessage)
				.returning();
			result = created!;
		} else {
			const [updated] = await db
				.update(aboutTeamMessages)
				.set(message)
				.where(eq(aboutTeamMessages.id, existing[0]!.id))
				.returning();
			result = updated!;
		}

		try {
			await emitCacheInvalidation("about:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return result;
	}

	// =============================================================================
	// SUSTAINABILITY PAGE METHODS (continued in next message due to length)
	// =============================================================================

	async getSustainabilityHero(): Promise<SustainabilityHero | undefined> {
		const [hero] = await db
			.select()
			.from(sustainabilityHero)
			.where(eq(sustainabilityHero.isActive, true))
			.limit(1);
		return hero;
	}

	async updateSustainabilityHero(
		hero: Partial<InsertSustainabilityHero>,
	): Promise<SustainabilityHero> {
		const existing = await db.select().from(sustainabilityHero).limit(1);

		let result;
		if (existing.length === 0) {
			const [created] = await db
				.insert(sustainabilityHero)
				.values(hero as InsertSustainabilityHero)
				.returning();
			result = created!;
		} else {
			const [updated] = await db
				.update(sustainabilityHero)
				.set({ ...hero, updatedAt: sql`NOW()` })
				.where(eq(sustainabilityHero.id, existing[0]!.id))
				.returning();
			result = updated!;
		}

		try {
			await emitCacheInvalidation("sustainability:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return result;
	}

	async getSustainabilityMetrics(): Promise<SustainabilityMetric[]> {
		// PERFORMANCE: Cache for 30min (static content, rarely changes)
		const cacheKey = "sustainability:metrics";
		try {
			const cached = await unifiedCache.get<SustainabilityMetric[]>(
				cacheKey,
				"data",
			);
			if (cached) return cached;
		} catch (error) {
			logger.debug(
				"[Cache] Failed to get sustainability metrics from cache:",
				error,
			);
		}

		const result = await db
			.select()
			.from(sustainabilityMetrics)
			.where(eq(sustainabilityMetrics.isActive, true))
			.orderBy(asc(sustainabilityMetrics.sortOrder));

		try {
			await unifiedCache.set(cacheKey, result, 30 * 60 * 1000, "data"); // 30 min
		} catch (error) {
			logger.debug("[Cache] Failed to cache sustainability metrics:", error);
		}

		return result;
	}

	async getSustainabilityMetric(
		id: number,
	): Promise<SustainabilityMetric | undefined> {
		const [metric] = await db
			.select()
			.from(sustainabilityMetrics)
			.where(eq(sustainabilityMetrics.id, id));
		return metric;
	}

	async createSustainabilityMetric(
		metric: InsertSustainabilityMetric,
	): Promise<SustainabilityMetric> {
		try {
			await unifiedCache.delete("sustainability:metrics", "data");
			await unifiedCache.delete("batch:/api/sustainability/batch");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear sustainability metrics cache:",
				error,
			);
		}

		const [created] = await db
			.insert(sustainabilityMetrics)
			.values(metric)
			.returning();

		try {
			await emitCacheInvalidation("sustainability:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return created!;
	}

	async updateSustainabilityMetric(
		id: number,
		metric: Partial<InsertSustainabilityMetric>,
	): Promise<SustainabilityMetric | undefined> {
		try {
			await unifiedCache.delete("sustainability:metrics", "data");
			await unifiedCache.delete("batch:/api/sustainability/batch");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear sustainability metrics cache:",
				error,
			);
		}

		const [updated] = await db
			.update(sustainabilityMetrics)
			.set({ ...metric, updatedAt: sql`NOW()` })
			.where(eq(sustainabilityMetrics.id, id))
			.returning();

		try {
			await emitCacheInvalidation("sustainability:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return updated!;
	}

	async deleteSustainabilityMetric(id: number): Promise<boolean> {
		try {
			await unifiedCache.delete("sustainability:metrics", "data");
			await unifiedCache.delete("batch:/api/sustainability/batch");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear sustainability metrics cache:",
				error,
			);
		}

		const result = await db
			.delete(sustainabilityMetrics)
			.where(eq(sustainabilityMetrics.id, id));

		try {
			await emitCacheInvalidation("sustainability:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderSustainabilityMetrics(
		metrics: { id: number; position: number }[],
	): Promise<void> {
		for (const metric of metrics) {
			await db
				.update(sustainabilityMetrics)
				.set({ sortOrder: metric.position })
				.where(eq(sustainabilityMetrics.id, metric.id));
		}

		try {
			await unifiedCache.delete("sustainability:metrics", "data");
			await unifiedCache.delete("batch:/api/sustainability/batch");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear sustainability metrics cache:",
				error,
			);
		}

		try {
			await emitCacheInvalidation("sustainability:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}
	}

	async getSustainabilityInitiatives(): Promise<SustainabilityInitiative[]> {
		return await db
			.select()
			.from(sustainabilityInitiatives)
			.where(eq(sustainabilityInitiatives.isActive, true))
			.orderBy(asc(sustainabilityInitiatives.sortOrder));
	}

	async getSustainabilityInitiative(
		id: number,
	): Promise<SustainabilityInitiative | undefined> {
		const [initiative] = await db
			.select()
			.from(sustainabilityInitiatives)
			.where(eq(sustainabilityInitiatives.id, id));
		return initiative;
	}

	async createSustainabilityInitiative(
		initiative: InsertSustainabilityInitiative,
	): Promise<SustainabilityInitiative> {
		const [created] = await db
			.insert(sustainabilityInitiatives)
			.values(initiative)
			.returning();

		try {
			await emitCacheInvalidation("sustainability:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		await unifiedCache.delete("batch:/api/sustainability/batch");
		return created!;
	}

	async updateSustainabilityInitiative(
		id: number,
		initiative: Partial<InsertSustainabilityInitiative>,
	): Promise<SustainabilityInitiative | undefined> {
		const [updated] = await db
			.update(sustainabilityInitiatives)
			.set({ ...initiative, updatedAt: sql`NOW()` })
			.where(eq(sustainabilityInitiatives.id, id))
			.returning();

		try {
			await emitCacheInvalidation("sustainability:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		await unifiedCache.delete("batch:/api/sustainability/batch");
		return updated!;
	}

	async deleteSustainabilityInitiative(id: number): Promise<boolean> {
		const result = await db
			.delete(sustainabilityInitiatives)
			.where(eq(sustainabilityInitiatives.id, id));

		try {
			await emitCacheInvalidation("sustainability:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		await unifiedCache.delete("batch:/api/sustainability/batch");
		return (result.rowCount ?? 0) > 0;
	}

	async reorderSustainabilityInitiatives(
		initiatives: { id: number; position: number }[],
	): Promise<void> {
		for (const initiative of initiatives) {
			await db
				.update(sustainabilityInitiatives)
				.set({ sortOrder: initiative.position })
				.where(eq(sustainabilityInitiatives.id, initiative.id));
		}

		try {
			await emitCacheInvalidation("sustainability:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		await unifiedCache.delete("batch:/api/sustainability/batch");
	}

	async getSustainabilityGoals(): Promise<SustainabilityGoal[]> {
		return await db
			.select()
			.from(sustainabilityGoals)
			.where(eq(sustainabilityGoals.isActive, true))
			.orderBy(asc(sustainabilityGoals.sortOrder));
	}

	async getSustainabilityGoal(
		id: number,
	): Promise<SustainabilityGoal | undefined> {
		const [goal] = await db
			.select()
			.from(sustainabilityGoals)
			.where(eq(sustainabilityGoals.id, id));
		return goal;
	}

	async createSustainabilityGoal(
		goal: InsertSustainabilityGoal,
	): Promise<SustainabilityGoal> {
		const [created] = await db
			.insert(sustainabilityGoals)
			.values(goal)
			.returning();

		try {
			await emitCacheInvalidation("sustainability:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		await unifiedCache.delete("batch:/api/sustainability/batch");
		return created!;
	}

	async updateSustainabilityGoal(
		id: number,
		goal: Partial<InsertSustainabilityGoal>,
	): Promise<SustainabilityGoal | undefined> {
		const [updated] = await db
			.update(sustainabilityGoals)
			.set({ ...goal, updatedAt: sql`NOW()` })
			.where(eq(sustainabilityGoals.id, id))
			.returning();

		try {
			await emitCacheInvalidation("sustainability:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		await unifiedCache.delete("batch:/api/sustainability/batch");
		return updated!;
	}

	async deleteSustainabilityGoal(id: number): Promise<boolean> {
		const result = await db
			.delete(sustainabilityGoals)
			.where(eq(sustainabilityGoals.id, id));

		try {
			await emitCacheInvalidation("sustainability:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderSustainabilityGoals(
		goals: { id: number; position: number }[],
	): Promise<void> {
		for (const goal of goals) {
			await db
				.update(sustainabilityGoals)
				.set({ sortOrder: goal.position })
				.where(eq(sustainabilityGoals.id, goal.id));
		}

		try {
			await emitCacheInvalidation("sustainability:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
			await unifiedCache.delete("batch:/api/sustainability/batch");
		}
	}

	async getUnifiedSustainability(): Promise<UnifiedSustainability | undefined> {
		const [unified] = await db.select().from(unifiedSustainability).limit(1);
		return unified;
	}

	async updateUnifiedSustainability(
		data: Partial<InsertUnifiedSustainability>,
	): Promise<UnifiedSustainability> {
		const existing = await db.select().from(unifiedSustainability).limit(1);

		let result;
		if (existing.length === 0) {
			const [created] = await db
				.insert(unifiedSustainability)
				.values(data as InsertUnifiedSustainability)
				.returning();
			result = created!;
		} else {
			const [updated] = await db
				.update(unifiedSustainability)
				.set({ ...data, updatedAt: sql`NOW()` })
				.where(eq(unifiedSustainability.id, existing[0]!.id))
				.returning();
			result = updated!;
		}

		try {
			await emitCacheInvalidation("sustainability:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		await unifiedCache.delete("batch:/api/sustainability/batch");
		return result;
	}

	async migrateLegacySustainabilityData(): Promise<UnifiedSustainability> {
		const existing = await this.getUnifiedSustainability();
		if (existing) return existing;

		return await this.updateUnifiedSustainability({
			title: "Sustainability",
			content: "Our commitment to sustainable practices",
			data: {
				metrics: {},
				initiatives: [],
				goals: [],
			},
		});
	}

	// =============================================================================
	// MANUFACTURING PAGE METHODS
	// =============================================================================

	async getManufacturingHero(): Promise<ManufacturingHero | undefined> {
		const [hero] = await db
			.select()
			.from(manufacturingHero)
			.where(eq(manufacturingHero.isActive, true))
			.limit(1);
		return hero;
	}

	async updateManufacturingHero(
		hero: Partial<InsertManufacturingHero>,
	): Promise<ManufacturingHero> {
		const existing = await db.select().from(manufacturingHero).limit(1);

		let result;
		if (existing.length === 0) {
			const [created] = await db
				.insert(manufacturingHero)
				.values(hero as InsertManufacturingHero)
				.returning();
			result = created!;
		} else {
			const [updated] = await db
				.update(manufacturingHero)
				.set({ ...hero, updatedAt: sql`NOW()` })
				.where(eq(manufacturingHero.id, existing[0]!.id))
				.returning();
			result = updated!;
		}

		try {
			await emitCacheInvalidation("manufacturing:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return result;
	}

	async getManufacturingProcesses(): Promise<ManufacturingProcess[]> {
		// PERFORMANCE: Cache for 30min (static content, rarely changes)
		const cacheKey = "manufacturing:processes";
		try {
			const cached = await unifiedCache.get<ManufacturingProcess[]>(
				cacheKey,
				"data",
			);
			if (cached) return cached;
		} catch (error) {
			logger.debug(
				"[Cache] Failed to get manufacturing processes from cache:",
				error,
			);
		}

		// Explicit column selection for NEON optimization - prevents accidental over-fetching
		const result = await db
			.select({
				id: manufacturingProcesses.id,
				name: manufacturingProcesses.name,
				title: manufacturingProcesses.title,
				description: manufacturingProcesses.description,
				step: manufacturingProcesses.step,
				position: manufacturingProcesses.position,
				duration: manufacturingProcesses.duration,
				efficiency: manufacturingProcesses.efficiency,
				category: manufacturingProcesses.category,
				iconName: manufacturingProcesses.iconName,
				imageId: manufacturingProcesses.imageId,
				mediaIds: manufacturingProcesses.mediaIds,
				equipment: manufacturingProcesses.equipment,
				specifications: manufacturingProcesses.specifications,
				isActive: manufacturingProcesses.isActive,
				sortOrder: manufacturingProcesses.sortOrder,
				createdAt: manufacturingProcesses.createdAt,
			})
			.from(manufacturingProcesses)
			.where(eq(manufacturingProcesses.isActive, true))
			.orderBy(asc(manufacturingProcesses.sortOrder));

		try {
			await unifiedCache.set(cacheKey, result, 30 * 60 * 1000, "data"); // 30 min
		} catch (error) {
			logger.debug("[Cache] Failed to cache manufacturing processes:", error);
		}

		return result;
	}

	async getManufacturingProcess(
		id: number,
	): Promise<ManufacturingProcess | undefined> {
		const [process] = await db
			.select()
			.from(manufacturingProcesses)
			.where(eq(manufacturingProcesses.id, id));
		return process;
	}

	async createManufacturingProcess(
		process: InsertManufacturingProcess,
	): Promise<ManufacturingProcess> {
		try {
			await unifiedCache.delete("manufacturing:processes", "data");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear manufacturing processes cache:",
				error,
			);
		}

		const [created] = await db
			.insert(manufacturingProcesses)
			.values(process)
			.returning();

		try {
			await emitCacheInvalidation("manufacturing:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return created!;
	}

	async updateManufacturingProcess(
		id: number,
		process: Partial<InsertManufacturingProcess>,
	): Promise<ManufacturingProcess | undefined> {
		try {
			await unifiedCache.delete("manufacturing:processes", "data");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear manufacturing processes cache:",
				error,
			);
		}

		const [updated] = await db
			.update(manufacturingProcesses)
			.set(process)
			.where(eq(manufacturingProcesses.id, id))
			.returning();

		try {
			await emitCacheInvalidation("manufacturing:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return updated!;
	}

	async deleteManufacturingProcess(id: number): Promise<boolean> {
		try {
			await unifiedCache.delete("manufacturing:processes", "data");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear manufacturing processes cache:",
				error,
			);
		}

		const result = await db
			.delete(manufacturingProcesses)
			.where(eq(manufacturingProcesses.id, id));

		try {
			await emitCacheInvalidation("manufacturing:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderManufacturingProcesses(
		processes: { id: number; position: number }[],
	): Promise<void> {
		// Use Drizzle batch to execute all updates in a single round trip
		const updateQueries = processes.map((process) =>
			db
				.update(manufacturingProcesses)
				.set({ sortOrder: process.position })
				.where(eq(manufacturingProcesses.id, process.id)),
		);
		await db.batch(updateQueries as any);

		try {
			await unifiedCache.delete("manufacturing:processes", "data");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear manufacturing processes cache:",
				error,
			);
		}

		try {
			await emitCacheInvalidation("manufacturing:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}
	}

	async getManufacturingCapabilities(): Promise<ManufacturingCapability[]> {
		// Explicit column selection for NEON optimization - prevents accidental over-fetching
		return await db
			.select({
				id: manufacturingCapabilities.id,
				name: manufacturingCapabilities.name,
				title: manufacturingCapabilities.title,
				description: manufacturingCapabilities.description,
				capacity: manufacturingCapabilities.capacity,
				unit: manufacturingCapabilities.unit,
				category: manufacturingCapabilities.category,
				icon: manufacturingCapabilities.icon,
				imageId: manufacturingCapabilities.imageId,
				equipment: manufacturingCapabilities.equipment,
				specifications: manufacturingCapabilities.specifications,
				isActive: manufacturingCapabilities.isActive,
				sortOrder: manufacturingCapabilities.sortOrder,
				createdAt: manufacturingCapabilities.createdAt,
			})
			.from(manufacturingCapabilities)
			.where(eq(manufacturingCapabilities.isActive, true))
			.orderBy(asc(manufacturingCapabilities.sortOrder));
	}

	async getManufacturingCapability(
		id: number,
	): Promise<ManufacturingCapability | undefined> {
		const [capability] = await db
			.select()
			.from(manufacturingCapabilities)
			.where(eq(manufacturingCapabilities.id, id));
		return capability;
	}

	async createManufacturingCapability(
		capability: InsertManufacturingCapability,
	): Promise<ManufacturingCapability> {
		// Map 'title' to 'name' if 'name' is not provided (database requires name)
		// Build values object explicitly to ensure 'name' is always set
		const valuesToInsert = {
			name: capability.name || capability.title || "Untitled Capability",
			title: capability.title,
			description: capability.description,
			capacity: capability.capacity,
			category: capability.category,
			icon: capability.icon,
			imageId: capability.imageId,
			equipment: capability.equipment,
			specifications: capability.specifications,
			isActive: capability.isActive,
		};

		const [created] = await db
			.insert(manufacturingCapabilities)
			.values(valuesToInsert)
			.returning();

		try {
			await emitCacheInvalidation("manufacturing:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return created!;
	}

	async updateManufacturingCapability(
		id: number,
		capability: Partial<InsertManufacturingCapability>,
	): Promise<ManufacturingCapability | undefined> {
		// Map 'title' to 'name' if only 'title' is provided (database requires name)
		const dataToUpdate: any = { ...capability };
		// Handle both undefined and empty string cases for title → name mapping
		if ("title" in dataToUpdate && !dataToUpdate.name) {
			dataToUpdate.name = dataToUpdate.title || "Untitled Capability";
		}

		// Remove any undefined fields to prevent Drizzle from using column defaults
		Object.keys(dataToUpdate).forEach((key) => {
			if (dataToUpdate[key] === undefined) {
				delete dataToUpdate[key];
			}
		});

		const [updated] = await db
			.update(manufacturingCapabilities)
			.set(dataToUpdate)
			.where(eq(manufacturingCapabilities.id, id))
			.returning();

		try {
			await emitCacheInvalidation("manufacturing:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return updated!;
	}

	async deleteManufacturingCapability(id: number): Promise<boolean> {
		const result = await db
			.delete(manufacturingCapabilities)
			.where(eq(manufacturingCapabilities.id, id));

		try {
			await emitCacheInvalidation("manufacturing:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderManufacturingCapabilities(
		capabilities: { id: number; position: number }[],
	): Promise<void> {
		// Use Drizzle batch to execute all updates in a single round trip
		const updateQueries = capabilities.map((capability) =>
			db
				.update(manufacturingCapabilities)
				.set({ sortOrder: capability.position })
				.where(eq(manufacturingCapabilities.id, capability.id)),
		);
		await db.batch(updateQueries as any);

		try {
			await emitCacheInvalidation("manufacturing:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}
	}

	async getManufacturingQualities(): Promise<ManufacturingQuality[]> {
		// Explicit column selection for NEON optimization - prevents accidental over-fetching
		return await db
			.select({
				id: manufacturingQualities.id,
				standards: manufacturingQualities.standards,
				title: manufacturingQualities.title,
				description: manufacturingQualities.description,
				icon: manufacturingQualities.icon,
				imageId: manufacturingQualities.imageId,
				certificateId: manufacturingQualities.certificateId,
				category: manufacturingQualities.category,
				testingMethod: manufacturingQualities.testingMethod,
				frequency: manufacturingQualities.frequency,
				checkpoints: manufacturingQualities.checkpoints,
				criteria: manufacturingQualities.criteria,
				isActive: manufacturingQualities.isActive,
				sortOrder: manufacturingQualities.sortOrder,
				createdAt: manufacturingQualities.createdAt,
			})
			.from(manufacturingQualities)
			.where(eq(manufacturingQualities.isActive, true))
			.orderBy(asc(manufacturingQualities.sortOrder));
	}

	async getManufacturingQuality(
		id: number,
	): Promise<ManufacturingQuality | undefined> {
		const [quality] = await db
			.select()
			.from(manufacturingQualities)
			.where(eq(manufacturingQualities.id, id));
		return quality;
	}

	async createManufacturingQuality(
		quality: InsertManufacturingQuality,
	): Promise<ManufacturingQuality> {
		const [created] = await db
			.insert(manufacturingQualities)
			.values(quality)
			.returning();

		try {
			await emitCacheInvalidation("manufacturing:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return created!;
	}

	async updateManufacturingQuality(
		id: number,
		quality: Partial<InsertManufacturingQuality>,
	): Promise<ManufacturingQuality | undefined> {
		const [updated] = await db
			.update(manufacturingQualities)
			.set(quality)
			.where(eq(manufacturingQualities.id, id))
			.returning();

		try {
			await emitCacheInvalidation("manufacturing:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return updated!;
	}

	async deleteManufacturingQuality(id: number): Promise<boolean> {
		const result = await db
			.delete(manufacturingQualities)
			.where(eq(manufacturingQualities.id, id));

		try {
			await emitCacheInvalidation("manufacturing:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderManufacturingQualities(
		qualities: { id: number; position: number }[],
	): Promise<void> {
		// Use Drizzle batch to execute all updates in a single round trip
		const updateQueries = qualities.map((quality) =>
			db
				.update(manufacturingQualities)
				.set({ sortOrder: quality.position })
				.where(eq(manufacturingQualities.id, quality.id)),
		);
		await db.batch(updateQueries as any);

		try {
			await emitCacheInvalidation("manufacturing:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}
	}

	// =============================================================================
	// TECHNOLOGY PAGE METHODS
	// =============================================================================

	async getTechnologyHero(): Promise<TechnologyHero | undefined> {
		const [hero] = await db
			.select()
			.from(technologyHero)
			.where(eq(technologyHero.isActive, true))
			.limit(1);
		return hero;
	}

	async updateTechnologyHero(
		hero: Partial<InsertTechnologyHero>,
	): Promise<TechnologyHero> {
		const existing = await db.select().from(technologyHero).limit(1);

		let result;
		if (existing.length === 0) {
			const [created] = await db
				.insert(technologyHero)
				.values(hero as InsertTechnologyHero)
				.returning();
			result = created!;
		} else {
			const [updated] = await db
				.update(technologyHero)
				.set({ ...hero, updatedAt: sql`NOW()` })
				.where(eq(technologyHero.id, existing[0]!.id))
				.returning();
			result = updated!;
		}

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return result;
	}

	async getTechnologyInnovations(): Promise<TechnologyInnovation[]> {
		// PERFORMANCE: Cache for 30min (static content, rarely changes)
		const cacheKey = "technology:innovations";
		try {
			const cached = await unifiedCache.get<TechnologyInnovation[]>(
				cacheKey,
				"data",
			);
			if (cached) return cached;
		} catch (error) {
			logger.debug(
				"[Cache] Failed to get technology innovations from cache:",
				error,
			);
		}

		const result = await db
			.select()
			.from(technologyInnovations)
			.where(eq(technologyInnovations.isActive, true))
			.orderBy(asc(technologyInnovations.sortOrder));

		try {
			await unifiedCache.set(cacheKey, result, 30 * 60 * 1000, "data"); // 30 min
		} catch (error) {
			logger.debug("[Cache] Failed to cache technology innovations:", error);
		}

		return result;
	}

	async getTechnologyInnovation(
		id: number,
	): Promise<TechnologyInnovation | undefined> {
		const [innovation] = await db
			.select()
			.from(technologyInnovations)
			.where(eq(technologyInnovations.id, id));
		return innovation;
	}

	async createTechnologyInnovation(
		innovation: InsertTechnologyInnovation,
	): Promise<TechnologyInnovation> {
		try {
			await unifiedCache.delete("technology:innovations", "data");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear technology innovations cache:",
				error,
			);
		}

		const [created] = await db
			.insert(technologyInnovations)
			.values(innovation)
			.returning();

		try {
			await emitCacheInvalidation("technology:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return created!;
	}

	async updateTechnologyInnovation(
		id: number,
		innovation: Partial<InsertTechnologyInnovation>,
	): Promise<TechnologyInnovation | undefined> {
		try {
			await unifiedCache.delete("technology:innovations", "data");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear technology innovations cache:",
				error,
			);
		}

		const [updated] = await db
			.update(technologyInnovations)
			.set(innovation)
			.where(eq(technologyInnovations.id, id))
			.returning();

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return updated!;
	}

	async deleteTechnologyInnovation(id: number): Promise<boolean> {
		try {
			await unifiedCache.delete("technology:innovations", "data");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear technology innovations cache:",
				error,
			);
		}

		const result = await db
			.delete(technologyInnovations)
			.where(eq(technologyInnovations.id, id));

		try {
			await emitCacheInvalidation("technology:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderTechnologyInnovations(
		innovations: { id: number; position: number }[],
	): Promise<void> {
		if (innovations.length === 0) return;

		const caseWhenPairs = innovations.flatMap((i) => [
			sql`WHEN ${i.id}`,
			sql`THEN ${i.position}`,
		]);
		const ids = innovations.map((i) => i.id);

		await db.execute(sql`
      UPDATE technology_innovations 
      SET sort_order = CASE id ${sql.join(caseWhenPairs, sql` `)} END 
      WHERE id = ANY(${ids}::int[])
    `);

		try {
			await unifiedCache.delete("technology:innovations", "data");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear technology innovations cache:",
				error,
			);
		}

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}
	}

	async getTechnologyEquipment(): Promise<TechnologyEquipment[]> {
		const cacheKey = "technology:equipment";
		try {
			const cached = await unifiedCache.get<TechnologyEquipment[]>(
				cacheKey,
				"data",
			);
			if (cached) return cached;
		} catch (error) {
			logger.debug(
				"[Cache] Failed to get technology equipment from cache:",
				error,
			);
		}

		const result = await db
			.select()
			.from(technologyEquipment)
			.where(eq(technologyEquipment.isActive, true))
			.orderBy(asc(technologyEquipment.sortOrder));

		try {
			await unifiedCache.set(cacheKey, result, 30 * 60 * 1000, "data");
		} catch (error) {
			logger.debug("[Cache] Failed to cache technology equipment:", error);
		}

		return result;
	}

	async getTechnologyEquipmentItem(
		id: number,
	): Promise<TechnologyEquipment | undefined> {
		const [equipment] = await db
			.select()
			.from(technologyEquipment)
			.where(eq(technologyEquipment.id, id));
		return equipment;
	}

	async createTechnologyEquipment(
		equipment: InsertTechnologyEquipment,
	): Promise<TechnologyEquipment> {
		try {
			await unifiedCache.delete("technology:equipment");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear technology equipment cache:",
				error,
			);
		}

		const [created] = await db
			.insert(technologyEquipment)
			.values(equipment)
			.returning();

		try {
			await emitCacheInvalidation("technology:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return created!;
	}

	async updateTechnologyEquipment(
		id: number,
		equipment: Partial<InsertTechnologyEquipment>,
	): Promise<TechnologyEquipment | undefined> {
		try {
			await unifiedCache.delete("technology:equipment");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear technology equipment cache:",
				error,
			);
		}

		const [updated] = await db
			.update(technologyEquipment)
			.set(equipment)
			.where(eq(technologyEquipment.id, id))
			.returning();

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return updated!;
	}

	async deleteTechnologyEquipment(id: number): Promise<boolean> {
		try {
			await unifiedCache.delete("technology:equipment");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear technology equipment cache:",
				error,
			);
		}

		const result = await db
			.delete(technologyEquipment)
			.where(eq(technologyEquipment.id, id));

		try {
			await emitCacheInvalidation("technology:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderTechnologyEquipment(
		equipment: { id: number; position: number }[],
	): Promise<void> {
		if (equipment.length === 0) return;

		const caseWhenPairs = equipment.flatMap((e) => [
			sql`WHEN ${e.id}`,
			sql`THEN ${e.position}`,
		]);
		const ids = equipment.map((e) => e.id);

		await db.execute(sql`
      UPDATE technology_equipment 
      SET sort_order = CASE id ${sql.join(caseWhenPairs, sql` `)} END 
      WHERE id = ANY(${ids}::int[])
    `);

		try {
			await unifiedCache.delete("technology:equipment");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear technology equipment cache:",
				error,
			);
		}

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}
	}

	async getTechnologyResearch(): Promise<TechnologyResearch[]> {
		const cacheKey = "technology:research";
		try {
			const cached = await unifiedCache.get<TechnologyResearch[]>(
				cacheKey,
				"data",
			);
			if (cached) return cached;
		} catch (error) {
			logger.debug(
				"[Cache] Failed to get technology research from cache:",
				error,
			);
		}

		const result = await db
			.select()
			.from(technologyResearch)
			.where(eq(technologyResearch.isActive, true))
			.orderBy(asc(technologyResearch.sortOrder));

		try {
			await unifiedCache.set(cacheKey, result, 30 * 60 * 1000, "data");
		} catch (error) {
			logger.debug("[Cache] Failed to cache technology research:", error);
		}

		return result;
	}

	async getTechnologyResearchItem(
		id: number,
	): Promise<TechnologyResearch | undefined> {
		const [research] = await db
			.select()
			.from(technologyResearch)
			.where(eq(technologyResearch.id, id));
		return research;
	}

	async createTechnologyResearch(
		research: InsertTechnologyResearch,
	): Promise<TechnologyResearch> {
		try {
			await unifiedCache.delete("technology:research");
		} catch (error) {
			logger.debug("[Cache] Failed to clear technology research cache:", error);
		}

		const [created] = await db
			.insert(technologyResearch)
			.values(research)
			.returning();

		try {
			await emitCacheInvalidation("technology:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return created!;
	}

	async updateTechnologyResearch(
		id: number,
		research: Partial<InsertTechnologyResearch>,
	): Promise<TechnologyResearch | undefined> {
		try {
			await unifiedCache.delete("technology:research");
		} catch (error) {
			logger.debug("[Cache] Failed to clear technology research cache:", error);
		}

		const [updated] = await db
			.update(technologyResearch)
			.set({ ...research, updatedAt: sql`NOW()` })
			.where(eq(technologyResearch.id, id))
			.returning();

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return updated!;
	}

	async deleteTechnologyResearch(id: number): Promise<boolean> {
		try {
			await unifiedCache.delete("technology:research");
		} catch (error) {
			logger.debug("[Cache] Failed to clear technology research cache:", error);
		}

		const result = await db
			.delete(technologyResearch)
			.where(eq(technologyResearch.id, id));

		try {
			await emitCacheInvalidation("technology:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderTechnologyResearch(
		research: { id: number; position: number }[],
		tx?: DbClient,
	): Promise<void> {
		const dbConn = tx || db;
		for (const item of research) {
			await dbConn
				.update(technologyResearch)
				.set({ sortOrder: item.position })
				.where(eq(technologyResearch.id, item.id));
		}

		try {
			await unifiedCache.delete("technology:research");
		} catch (error) {
			logger.debug("[Cache] Failed to clear technology research cache:", error);
		}

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}
	}

	async getTechnologyRoadmap(): Promise<TechnologyRoadmap[]> {
		const cacheKey = "technology:roadmap";
		try {
			const cached = await unifiedCache.get<TechnologyRoadmap[]>(
				cacheKey,
				"data",
			);
			if (cached) return cached;
		} catch (error) {
			logger.debug(
				"[Cache] Failed to get technology roadmap from cache:",
				error,
			);
		}

		const result = await db
			.select()
			.from(technologyRoadmap)
			.where(eq(technologyRoadmap.isActive, true))
			.orderBy(asc(technologyRoadmap.sortOrder));

		try {
			await unifiedCache.set(cacheKey, result, 30 * 60 * 1000, "data");
		} catch (error) {
			logger.debug("[Cache] Failed to cache technology roadmap:", error);
		}

		return result;
	}

	async getTechnologyRoadmapItem(
		id: number,
	): Promise<TechnologyRoadmap | undefined> {
		const [item] = await db
			.select()
			.from(technologyRoadmap)
			.where(eq(technologyRoadmap.id, id));
		return item;
	}

	async createTechnologyRoadmap(
		item: InsertTechnologyRoadmap,
	): Promise<TechnologyRoadmap> {
		try {
			await unifiedCache.delete("technology:roadmap");
		} catch (error) {
			logger.debug("[Cache] Failed to clear technology roadmap cache:", error);
		}

		const [created] = await db
			.insert(technologyRoadmap)
			.values(item)
			.returning();

		try {
			await emitCacheInvalidation("technology:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return created!;
	}

	async updateTechnologyRoadmap(
		id: number,
		item: Partial<InsertTechnologyRoadmap>,
	): Promise<TechnologyRoadmap | undefined> {
		try {
			await unifiedCache.delete("technology:roadmap");
		} catch (error) {
			logger.debug("[Cache] Failed to clear technology roadmap cache:", error);
		}

		const [updated] = await db
			.update(technologyRoadmap)
			.set({ ...item, updatedAt: sql`NOW()` })
			.where(eq(technologyRoadmap.id, id))
			.returning();

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return updated!;
	}

	async deleteTechnologyRoadmap(id: number): Promise<boolean> {
		try {
			await unifiedCache.delete("technology:roadmap");
		} catch (error) {
			logger.debug("[Cache] Failed to clear technology roadmap cache:", error);
		}

		const result = await db
			.delete(technologyRoadmap)
			.where(eq(technologyRoadmap.id, id));

		try {
			await emitCacheInvalidation("technology:", "delete");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return (result.rowCount ?? 0) > 0;
	}

	async reorderTechnologyRoadmap(
		items: { id: number; position: number }[],
		tx?: DbClient,
	): Promise<void> {
		if (items.length === 0) return;

		const dbConn = tx || db;
		const caseWhenPairs = items.flatMap((i) => [
			sql`WHEN ${i.id}`,
			sql`THEN ${i.position}`,
		]);
		const ids = items.map((i) => i.id);

		await dbConn.execute(sql`
      UPDATE technology_roadmap 
      SET sort_order = CASE id ${sql.join(caseWhenPairs, sql` `)} END 
      WHERE id = ANY(${ids}::int[])
    `);

		try {
			await unifiedCache.delete("technology:roadmap");
		} catch (error) {
			logger.debug("[Cache] Failed to clear technology roadmap cache:", error);
		}

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}
	}

	async getTechnologyGradientSettings(): Promise<
		TechnologyGradientSettings | undefined
	> {
		const cacheKey = "technology:gradient_settings";
		try {
			const cached = await unifiedCache.get<TechnologyGradientSettings>(
				cacheKey,
				"data",
			);
			if (cached) return cached;
		} catch (error) {
			logger.debug(
				"[Cache] Failed to get technology gradient settings from cache:",
				error,
			);
		}

		const [settings] = await db
			.select()
			.from(technologyGradientSettings)
			.where(eq(technologyGradientSettings.isActive, true))
			.orderBy(desc(technologyGradientSettings.createdAt))
			.limit(1);

		if (settings) {
			try {
				await unifiedCache.set(cacheKey, settings, 30 * 60 * 1000, "data");
			} catch (error) {
				logger.debug(
					"[Cache] Failed to cache technology gradient settings:",
					error,
				);
			}
		}

		return settings;
	}

	async updateTechnologyGradientSettings(
		settings: Partial<InsertTechnologyGradientSettings>,
	): Promise<TechnologyGradientSettings> {
		try {
			await unifiedCache.delete("technology:gradient_settings");
		} catch (error) {
			logger.debug(
				"[Cache] Failed to clear technology gradient settings cache:",
				error,
			);
		}

		const [updated] = await db
			.update(technologyGradientSettings)
			.set({ ...settings, updatedAt: sql`NOW()` })
			.where(eq(technologyGradientSettings.isActive, true))
			.returning();

		let result;
		if (updated) {
			result = updated!;
		} else {
			const [created] = await db
				.insert(technologyGradientSettings)
				.values(settings as InsertTechnologyGradientSettings)
				.returning();
			result = created!;
		}

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return result;
	}

	async getTechnologyCta(): Promise<TechnologyCta | undefined> {
		const cacheKey = "technology:cta";
		try {
			const cached = await unifiedCache.get<TechnologyCta>(cacheKey, "data");
			if (cached) return cached;
		} catch (error) {
			logger.debug("[Cache] Failed to get technology CTA from cache:", error);
		}

		const [cta] = await db
			.select()
			.from(technologyCta)
			.where(eq(technologyCta.isActive, true))
			.orderBy(desc(technologyCta.createdAt))
			.limit(1);

		if (cta) {
			try {
				await unifiedCache.set(cacheKey, cta, 30 * 60 * 1000, "data");
			} catch (error) {
				logger.debug("[Cache] Failed to cache technology CTA:", error);
			}
		}

		return cta;
	}

	async updateTechnologyCta(
		cta: Partial<InsertTechnologyCta>,
	): Promise<TechnologyCta> {
		try {
			await unifiedCache.delete("technology:cta");
		} catch (error) {
			logger.debug("[Cache] Failed to clear technology CTA cache:", error);
		}

		const [updated] = await db
			.update(technologyCta)
			.set({ ...cta, updatedAt: sql`NOW()` })
			.where(eq(technologyCta.isActive, true))
			.returning();

		let result;
		if (updated) {
			result = updated!;
		} else {
			const [created] = await db
				.insert(technologyCta)
				.values(cta as InsertTechnologyCta)
				.returning();
			result = created!;
		}

		try {
			await emitCacheInvalidation("technology:", "update");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return result;
	}

	async createTechnologyCta(cta: InsertTechnologyCta): Promise<TechnologyCta> {
		try {
			await unifiedCache.delete("technology:cta");
		} catch (error) {
			logger.debug("[Cache] Failed to clear technology CTA cache:", error);
		}

		const [created] = await db.insert(technologyCta).values(cta).returning();

		try {
			await emitCacheInvalidation("technology:", "create");
		} catch (error) {
			logger.debug("[Cache] Failed to emit invalidation event:", error);
		}

		return created!;
	}
}
