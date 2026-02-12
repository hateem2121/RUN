import type {
  InsertAboutHero,
  InsertAboutMapLocation,
  InsertAboutSection,
  InsertAboutStatistic,
  InsertAboutTeamMessage,
  InsertAboutTimelineEntry,
} from "../../shared/schema.js";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { getStorage } from "../lib/storage-singleton.js";

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
  private get storage() {
    return getStorage();
  }

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
    return this.storage.getAboutHero(includeInactive);
  }

  async updateHero(data: Partial<InsertAboutHero>) {
    const result = await this.storage.updateAboutHero(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // TIMELINE
  // ===========================================================================

  async getTimeline(includeInactive: boolean = true) {
    return this.storage.getAboutTimelineEntries(includeInactive);
  }

  async getTimelineEntry(id: number) {
    return this.storage.getAboutTimelineEntry(id);
  }

  async createTimelineEntry(data: InsertAboutTimelineEntry) {
    const result = await this.storage.createAboutTimelineEntry(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateTimelineEntry(id: number, data: Partial<InsertAboutTimelineEntry>) {
    const result = await this.storage.updateAboutTimelineEntry(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteTimelineEntry(id: number) {
    const result = await this.storage.deleteAboutTimelineEntry(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // LOCATIONS
  // ===========================================================================

  async getLocations(includeInactive: boolean = true) {
    return this.storage.getAboutMapLocations(includeInactive);
  }

  async getLocation(id: number) {
    return this.storage.getAboutMapLocation(id);
  }

  async createLocation(data: InsertAboutMapLocation) {
    const result = await this.storage.createAboutMapLocation(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateLocation(id: number, data: Partial<InsertAboutMapLocation>) {
    const result = await this.storage.updateAboutMapLocation(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteLocation(id: number) {
    const result = await this.storage.deleteAboutMapLocation(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // SECTIONS
  // ===========================================================================

  async getSections(includeInactive: boolean = true) {
    return this.storage.getAboutSections(includeInactive);
  }

  async getSection(id: number) {
    return this.storage.getAboutSection(id);
  }

  async createSection(data: InsertAboutSection) {
    const result = await this.storage.createAboutSection(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateSection(id: number, data: Partial<InsertAboutSection>) {
    const result = await this.storage.updateAboutSection(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteSection(id: number) {
    const result = await this.storage.deleteAboutSection(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  async getStatistics(includeInactive: boolean = true) {
    return this.storage.getAboutStatistics(includeInactive);
  }

  async getStatistic(id: number) {
    return this.storage.getAboutStatistic(id);
  }

  async createStatistic(data: InsertAboutStatistic) {
    const result = await this.storage.createAboutStatistic(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateStatistic(id: number, data: Partial<InsertAboutStatistic>) {
    const result = await this.storage.updateAboutStatistic(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteStatistic(id: number) {
    const result = await this.storage.deleteAboutStatistic(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // TEAM MESSAGE
  // ===========================================================================

  async getTeamMessage(includeInactive: boolean = true) {
    return this.storage.getAboutTeamMessage(includeInactive);
  }

  async updateTeamMessage(data: Partial<InsertAboutTeamMessage>) {
    const result = await this.storage.updateAboutTeamMessage(data);
    await CacheOperations.invalidateAbout();
    return result;
  }
}

// Export singleton instance
export const aboutService = new AboutService();
