import type {
  AboutHero,
  AboutMapLocation,
  AboutSection,
  AboutStatistic,
  AboutTeamMessage,
  AboutTimelineEntry,
  InsertAboutHero,
  InsertAboutMapLocation,
  InsertAboutSection,
  InsertAboutStatistic,
  InsertAboutTeamMessage,
  InsertAboutTimelineEntry,
} from "@run-remix/shared";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { pageContentRepository } from "../lib/db/repositories/index.js";
import { logger } from "../lib/monitoring/logger.js";

export interface AboutBatchResponse {
  hero: AboutHero | null;
  timeline: AboutTimelineEntry[];
  locations: AboutMapLocation[];
  sections: AboutSection[];
  statistics: AboutStatistic[];
  teamMessage: AboutTeamMessage | null;
}

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
  async getAllAboutData(): Promise<AboutBatchResponse> {
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

  async getHero(includeInactive: boolean = true): Promise<AboutHero | null> {
    const result = await pageContentRepository.getAboutHero(includeInactive);
    return result ?? null;
  }

  async updateHero(data: Partial<InsertAboutHero>): Promise<AboutHero> {
    const result = await pageContentRepository.updateAboutHero(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // TIMELINE
  // ===========================================================================

  async getTimeline(includeInactive: boolean = true): Promise<AboutTimelineEntry[]> {
    return pageContentRepository.getAboutTimelineEntries(includeInactive);
  }

  async getTimelineEntry(id: number): Promise<AboutTimelineEntry | null> {
    const result = await pageContentRepository.getAboutTimelineEntry(id);
    return result ?? null;
  }

  async createTimelineEntry(data: InsertAboutTimelineEntry): Promise<AboutTimelineEntry> {
    const result = await pageContentRepository.createAboutTimelineEntry(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateTimelineEntry(
    id: number,
    data: Partial<InsertAboutTimelineEntry>,
  ): Promise<AboutTimelineEntry> {
    const result = await pageContentRepository.updateAboutTimelineEntry(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteTimelineEntry(id: number): Promise<boolean> {
    const result = await pageContentRepository.deleteAboutTimelineEntry(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // LOCATIONS
  // ===========================================================================

  async getLocations(includeInactive: boolean = true): Promise<AboutMapLocation[]> {
    return pageContentRepository.getAboutMapLocations(includeInactive);
  }

  async getLocation(id: number): Promise<AboutMapLocation | null> {
    const result = await pageContentRepository.getAboutMapLocation(id);
    return result ?? null;
  }

  async createLocation(data: InsertAboutMapLocation): Promise<AboutMapLocation> {
    const result = await pageContentRepository.createAboutMapLocation(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateLocation(
    id: number,
    data: Partial<InsertAboutMapLocation>,
  ): Promise<AboutMapLocation> {
    const result = await pageContentRepository.updateAboutMapLocation(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteLocation(id: number): Promise<boolean> {
    const result = await pageContentRepository.deleteAboutMapLocation(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // SECTIONS
  // ===========================================================================

  async getSections(includeInactive: boolean = true): Promise<AboutSection[]> {
    return pageContentRepository.getAboutSections(includeInactive);
  }

  async getSection(id: number): Promise<AboutSection | null> {
    const result = await pageContentRepository.getAboutSection(id);
    return result ?? null;
  }

  async createSection(data: InsertAboutSection): Promise<AboutSection> {
    const result = await pageContentRepository.createAboutSection(data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async updateSection(id: number, data: Partial<InsertAboutSection>): Promise<AboutSection> {
    const result = await pageContentRepository.updateAboutSection(id, data);
    await CacheOperations.invalidateAbout();
    return result;
  }

  async deleteSection(id: number): Promise<boolean> {
    const result = await pageContentRepository.deleteAboutSection(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  async getStatistics(includeInactive: boolean = true): Promise<AboutStatistic[]> {
    return pageContentRepository.getAboutStatistics(includeInactive);
  }

  async getStatistic(id: number): Promise<AboutStatistic | null> {
    const result = await pageContentRepository.getAboutStatistic(id);
    return result ?? null;
  }

  async createStatistic(data: InsertAboutStatistic): Promise<AboutStatistic> {
    const result = await pageContentRepository.createAboutStatistic(data);
    await CacheOperations.invalidateAbout();
    return result as AboutStatistic;
  }

  async updateStatistic(id: number, data: Partial<InsertAboutStatistic>): Promise<AboutStatistic> {
    const result = await pageContentRepository.updateAboutStatistic(id, data);
    await CacheOperations.invalidateAbout();
    return result as AboutStatistic;
  }

  async deleteStatistic(id: number): Promise<boolean> {
    const result = await pageContentRepository.deleteAboutStatistic(id);
    await CacheOperations.invalidateAbout();
    return result;
  }

  // ===========================================================================
  // TEAM MESSAGE
  // ===========================================================================

  async getTeamMessage(includeInactive: boolean = true): Promise<AboutTeamMessage | null> {
    const result = await pageContentRepository.getAboutTeamMessage(includeInactive);
    return result ?? null;
  }

  async updateTeamMessage(data: Partial<InsertAboutTeamMessage>): Promise<AboutTeamMessage> {
    const result = await pageContentRepository.updateAboutTeamMessage(data);
    await CacheOperations.invalidateAbout();
    return result as AboutTeamMessage;
  }
}

// Export singleton instance
export const aboutService = new AboutService();
