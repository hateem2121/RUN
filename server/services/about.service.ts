import { asc, eq } from "drizzle-orm";
import type {
	InsertAboutHero,
	InsertAboutMapLocation,
	InsertAboutSection,
	InsertAboutStatistic,
	InsertAboutTeamMessage,
	InsertAboutTimelineEntry,
} from "../../shared/schema.js";
import {
	aboutHero,
	aboutMapLocations,
	aboutSections,
	aboutStatistics,
	aboutTeamMessages,
	aboutTimelineEntries,
} from "../../shared/schema.js";
import { db } from "../db.js";

/**
 * AboutService - Centralized business logic for About page management
 *
 * Eliminated code duplication between batch and granular endpoints.
 * Provides a single source of truth for all "About Us" related data fetching and updates.
 */
export class AboutService {
	/**
	 * Get all About page data in a single optimized aggregate call
	 * Used by: /api/about-batch (public route)
	 */
	async getAllAboutData() {
		const [hero, timeline, locations, sections, statistics, teamMessage] =
			await Promise.all([
				this.getHero(),
				this.getTimeline(),
				this.getLocations(),
				this.getSections(),
				this.getStatistics(),
				this.getTeamMessage(),
			]);

		return { hero, timeline, locations, sections, statistics, teamMessage };
	}

	// ===========================================================================
	// HERO SECTION
	// ===========================================================================

	async getHero() {
		const results = await db.select().from(aboutHero).limit(1);
		return results[0] || null;
	}

	async updateHero(data: Partial<InsertAboutHero>) {
		// Check if exists
		const existing = await this.getHero();

		if (existing) {
			const [updated] = await db
				.update(aboutHero)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(aboutHero.id, existing.id))
				.returning();
			return updated;
		} else {
			// If table is empty (shouldn't happen usually but good fallback), create it
			const [created] = await db
				.insert(aboutHero)
				.values(data as InsertAboutHero)
				.returning();
			return created;
		}
	}

	// ===========================================================================
	// TIMELINE
	// ===========================================================================

	async getTimeline() {
		return db
			.select()
			.from(aboutTimelineEntries)
			.orderBy(asc(aboutTimelineEntries.sortOrder));
	}

	async getTimelineEntry(id: number) {
		const results = await db
			.select()
			.from(aboutTimelineEntries)
			.where(eq(aboutTimelineEntries.id, id))
			.limit(1);
		return results[0] || null;
	}

	async createTimelineEntry(data: InsertAboutTimelineEntry) {
		const [created] = await db
			.insert(aboutTimelineEntries)
			.values(data)
			.returning();
		return created;
	}

	async updateTimelineEntry(
		id: number,
		data: Partial<InsertAboutTimelineEntry>,
	) {
		const [updated] = await db
			.update(aboutTimelineEntries)
			.set(data)
			.where(eq(aboutTimelineEntries.id, id))
			.returning();
		return updated;
	}

	async deleteTimelineEntry(id: number) {
		const [deleted] = await db
			.delete(aboutTimelineEntries)
			.where(eq(aboutTimelineEntries.id, id))
			.returning();
		return deleted;
	}

	// ===========================================================================
	// LOCATIONS
	// ===========================================================================

	async getLocations() {
		// Note: aboutMapLocations schema does not have sortOrder currently (checked in schema.ts)
		// Ordered by ID for stable ordering
		return db
			.select()
			.from(aboutMapLocations)
			.orderBy(asc(aboutMapLocations.id));
	}

	async getLocation(id: number) {
		const results = await db
			.select()
			.from(aboutMapLocations)
			.where(eq(aboutMapLocations.id, id))
			.limit(1);
		return results[0] || null;
	}

	async createLocation(data: InsertAboutMapLocation) {
		const [created] = await db
			.insert(aboutMapLocations)
			.values(data)
			.returning();
		return created;
	}

	async updateLocation(id: number, data: Partial<InsertAboutMapLocation>) {
		const [updated] = await db
			.update(aboutMapLocations)
			.set(data)
			.where(eq(aboutMapLocations.id, id))
			.returning();
		return updated;
	}

	async deleteLocation(id: number) {
		const [deleted] = await db
			.delete(aboutMapLocations)
			.where(eq(aboutMapLocations.id, id))
			.returning();
		return deleted;
	}

	// ===========================================================================
	// SECTIONS
	// ===========================================================================

	async getSections() {
		return db
			.select()
			.from(aboutSections)
			.orderBy(asc(aboutSections.sortOrder));
	}

	async getSection(id: number) {
		const results = await db
			.select()
			.from(aboutSections)
			.where(eq(aboutSections.id, id))
			.limit(1);
		return results[0] || null;
	}

	async createSection(data: InsertAboutSection) {
		const [created] = await db.insert(aboutSections).values(data).returning();
		return created;
	}

	async updateSection(id: number, data: Partial<InsertAboutSection>) {
		const [updated] = await db
			.update(aboutSections)
			.set(data)
			.where(eq(aboutSections.id, id))
			.returning();
		return updated;
	}

	async deleteSection(id: number) {
		const [deleted] = await db
			.delete(aboutSections)
			.where(eq(aboutSections.id, id))
			.returning();
		return deleted;
	}

	// ===========================================================================
	// STATISTICS
	// ===========================================================================

	async getStatistics() {
		return db
			.select()
			.from(aboutStatistics)
			.orderBy(asc(aboutStatistics.sortOrder));
	}

	async getStatistic(id: number) {
		const results = await db
			.select()
			.from(aboutStatistics)
			.where(eq(aboutStatistics.id, id))
			.limit(1);
		return results[0] || null;
	}

	async createStatistic(data: InsertAboutStatistic) {
		const [created] = await db.insert(aboutStatistics).values(data).returning();
		return created;
	}

	async updateStatistic(id: number, data: Partial<InsertAboutStatistic>) {
		const [updated] = await db
			.update(aboutStatistics)
			.set(data)
			.where(eq(aboutStatistics.id, id))
			.returning();
		return updated;
	}

	async deleteStatistic(id: number) {
		const [deleted] = await db
			.delete(aboutStatistics)
			.where(eq(aboutStatistics.id, id))
			.returning();
		return deleted;
	}

	// ===========================================================================
	// TEAM MESSAGE
	// ===========================================================================

	async getTeamMessage() {
		const results = await db.select().from(aboutTeamMessages).limit(1);
		return results[0] || null;
	}

	async updateTeamMessage(data: Partial<InsertAboutTeamMessage>) {
		const existing = await this.getTeamMessage();

		if (existing) {
			const [updated] = await db
				.update(aboutTeamMessages)
				.set(data)
				.where(eq(aboutTeamMessages.id, existing.id))
				.returning();
			return updated;
		} else {
			const [created] = await db
				.insert(aboutTeamMessages)
				.values(data as InsertAboutTeamMessage)
				.returning();
			return created;
		}
	}
}

// Export singleton instance
export const aboutService = new AboutService();
