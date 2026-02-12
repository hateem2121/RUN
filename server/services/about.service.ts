import type {
  InsertAboutHero,
  InsertAboutMapLocation,
  InsertAboutSection,
  InsertAboutStatistic,
  InsertAboutTeamMessage,
  InsertAboutTimelineEntry,
} from "../../shared/schema.js";
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
    return this.storage.updateAboutHero(data);
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
    return this.storage.createAboutTimelineEntry(data);
  }

  async updateTimelineEntry(id: number, data: Partial<InsertAboutTimelineEntry>) {
    return this.storage.updateAboutTimelineEntry(id, data);
  }

  async deleteTimelineEntry(id: number) {
    return this.storage.deleteAboutTimelineEntry(id);
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
    return this.storage.createAboutMapLocation(data);
  }

  async updateLocation(id: number, data: Partial<InsertAboutMapLocation>) {
    return this.storage.updateAboutMapLocation(id, data);
  }

  async deleteLocation(id: number) {
    return this.storage.deleteAboutMapLocation(id);
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
    return this.storage.createAboutSection(data);
  }

  async updateSection(id: number, data: Partial<InsertAboutSection>) {
    return this.storage.updateAboutSection(id, data);
  }

  async deleteSection(id: number) {
    return this.storage.deleteAboutSection(id);
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
    return this.storage.createAboutStatistic(data);
  }

  async updateStatistic(id: number, data: Partial<InsertAboutStatistic>) {
    return this.storage.updateAboutStatistic(id, data);
  }

  async deleteStatistic(id: number) {
    return this.storage.deleteAboutStatistic(id);
  }

  // ===========================================================================
  // TEAM MESSAGE
  // ===========================================================================

  async getTeamMessage(includeInactive: boolean = true) {
    return this.storage.getAboutTeamMessage(includeInactive);
  }

  async updateTeamMessage(data: Partial<InsertAboutTeamMessage>) {
    return this.storage.updateAboutTeamMessage(data);
  }
}

// Export singleton instance
export const aboutService = new AboutService();
