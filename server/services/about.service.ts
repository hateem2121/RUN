import type {
  InsertAboutHero,
  InsertAboutMapLocation,
  InsertAboutSection,
  InsertAboutStatistic,
  InsertAboutTeamMessage,
  InsertAboutTimelineEntry,
} from "../../shared/index.js";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { pageContentRepository } from "../lib/db/repositories/index.js";
import { logger } from "../lib/monitoring/logger.js";

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
    // Use Promise.allSettled for resilience: a single failing query
    // (e.g., missing DB column after schema change) won't crash the entire batch
    const results = await Promise.allSettled([
      this.getHero(true),
      this.getTimeline(true),
      this.getLocations(true),
      this.getSections(true),
      this.getStatistics(true),
      this.getTeamMessage(true),
    ]);

    const getValue = <T>(result: PromiseSettledResult<T>, fallback: T): T => {
      if (result.status === "fulfilled") return result.value;
      logger.warn("[AboutService] Partial batch failure, using fallback", {
        reason: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
      return fallback;
    };

    return {
      hero: getValue(results[0], null),
      timeline: getValue(results[1], []),
      locations: getValue(results[2], []),
      sections: getValue(results[3], []),
      statistics: getValue(results[4], []),
      teamMessage: getValue(results[5], null),
    };
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
