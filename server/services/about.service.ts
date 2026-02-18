import type {
  InsertAboutHero,
  InsertAboutMapLocation,
  InsertAboutSection,
  InsertAboutStatistic,
  InsertAboutTeamMessage,
  InsertAboutTimelineEntry,
} from "../../shared/schema.js";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { pageContentRepository } from "../lib/db/repositories/index.js";

/**
 * AboutService - Centralized business logic for About page management
 *
 * Eliminated code duplication between batch and granular endpoints.
 * Provides a single source of truth for all "About Us" related data fetching and updates.
 *
 * REFACTORED: Now uses the Repository Pattern via getStorage() to be database-agnostic
 * and standardized with the rest of the Service Layer.
 */
export class AboutService {
  /**
   * Get all About page data in a single optimized aggregate call
   * Used by: /api/about-batch (public route)
   */
  async getAllAboutData() {
    // Note: Passing true to includeInactive to preserve original behavior where public API
    // received all data. In the future, we might want to pass false here for public views.
    const [hero, timeline, locations, sections, statistics, teamMessage] = await Promise.all([
      this.getHero(true),
      this.getTimeline(true),
      this.getLocations(true),
      this.getSections(true),
      this.getStatistics(true),
      this.getTeamMessage(true),
    ]);

    return { hero, timeline, locations, sections, statistics, teamMessage };
  }

  // ===========================================================================
  // HERO SECTION
  // ===========================================================================

  async getHero(includeInactive: boolean = true) {
    return pageContentRepository.getAboutHero(includeInactive);
  }

  async updateHero(data: Partial<InsertAboutHero>) {
    const result = await pageContentRepository.updateAboutHero(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // TIMELINE
  // ===========================================================================

  async getTimeline(includeInactive: boolean = true) {
    return pageContentRepository.getAboutTimelineEntries(includeInactive);
  }

  async getTimelineEntry(id: number) {
    return pageContentRepository.getAboutTimelineEntry(id);
  }

  async createTimelineEntry(data: InsertAboutTimelineEntry) {
    const result = await pageContentRepository.createAboutTimelineEntry(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateTimelineEntry(id: number, data: Partial<InsertAboutTimelineEntry>) {
    const result = await pageContentRepository.updateAboutTimelineEntry(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteTimelineEntry(id: number) {
    const result = await pageContentRepository.deleteAboutTimelineEntry(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // LOCATIONS
  // ===========================================================================

  async getLocations(includeInactive: boolean = true) {
    return pageContentRepository.getAboutMapLocations(includeInactive);
  }

  async getLocation(id: number) {
    return pageContentRepository.getAboutMapLocation(id);
  }

  async createLocation(data: InsertAboutMapLocation) {
    const result = await pageContentRepository.createAboutMapLocation(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateLocation(id: number, data: Partial<InsertAboutMapLocation>) {
    const result = await pageContentRepository.updateAboutMapLocation(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteLocation(id: number) {
    const result = await pageContentRepository.deleteAboutMapLocation(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // SECTIONS
  // ===========================================================================

  async getSections(includeInactive: boolean = true) {
    return pageContentRepository.getAboutSections(includeInactive);
  }

  async getSection(id: number) {
    return pageContentRepository.getAboutSection(id);
  }

  async createSection(data: InsertAboutSection) {
    const result = await pageContentRepository.createAboutSection(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateSection(id: number, data: Partial<InsertAboutSection>) {
    const result = await pageContentRepository.updateAboutSection(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteSection(id: number) {
    const result = await pageContentRepository.deleteAboutSection(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  async getStatistics(includeInactive: boolean = true) {
    return pageContentRepository.getAboutStatistics(includeInactive);
  }

  async getStatistic(id: number) {
    return pageContentRepository.getAboutStatistic(id);
  }

  async createStatistic(data: InsertAboutStatistic) {
    const result = await pageContentRepository.createAboutStatistic(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateStatistic(id: number, data: Partial<InsertAboutStatistic>) {
    const result = await pageContentRepository.updateAboutStatistic(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteStatistic(id: number) {
    const result = await pageContentRepository.deleteAboutStatistic(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // TEAM MESSAGE
  // ===========================================================================

  async getTeamMessage(includeInactive: boolean = true) {
    return pageContentRepository.getAboutTeamMessage(includeInactive);
  }

  async updateTeamMessage(data: Partial<InsertAboutTeamMessage>) {
    const result = await pageContentRepository.updateAboutTeamMessage(data);
    await CacheOperations.invalidateAbout();
    return result;
  }
}

// Export singleton instance
export const aboutService = new AboutService();
