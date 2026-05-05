import type {
  AboutBatchResponse,
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
import type { Result } from "neverthrow";
import { safeQuery } from "../db.js";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { aboutRepository } from "../lib/db/repositories/index.js";
import type { AppError } from "../lib/errors.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";

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
  async getAllAboutData(): Promise<Result<AboutBatchResponse, AppError>> {
    const operation = async () => {
      return await aboutRepository.getAboutBatch();
    };

    return safeQuery(withCircuit("about-batch-get", operation, DB_CIRCUIT_OPTIONS));
  }

  // ===========================================================================
  // HERO SECTION
  // ===========================================================================

  async getHero(includeInactive: boolean = true): Promise<Result<AboutHero | null, AppError>> {
    const operation = async () => {
      const data = await aboutRepository.getAboutHero(includeInactive);
      return data ? (data as AboutHero) : null;
    };

    return safeQuery(withCircuit("about-hero-get", operation, DB_CIRCUIT_OPTIONS));
  }

  async updateHero(data: Partial<InsertAboutHero>): Promise<Result<AboutHero, AppError>> {
    const result = await safeQuery(aboutRepository.updateAboutHero(data));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  // ===========================================================================
  // TIMELINE
  // ===========================================================================

  async getTimeline(
    includeInactive: boolean = true,
  ): Promise<Result<AboutTimelineEntry[], AppError>> {
    const operation = async () => {
      const data = await aboutRepository.getAboutTimelineEntries(includeInactive);
      return (data as AboutTimelineEntry[]) || [];
    };

    return safeQuery(withCircuit("about-timeline-get", operation, DB_CIRCUIT_OPTIONS));
  }

  async getTimelineEntry(id: number): Promise<Result<AboutTimelineEntry | null, AppError>> {
    const operation = async () => {
      const data = await aboutRepository.getAboutTimelineEntry(id);
      return data ? (data as AboutTimelineEntry) : null;
    };

    return safeQuery(withCircuit("about-timeline-entry-get", operation, DB_CIRCUIT_OPTIONS));
  }

  async createTimelineEntry(
    data: InsertAboutTimelineEntry,
  ): Promise<Result<AboutTimelineEntry, AppError>> {
    const result = await safeQuery(aboutRepository.createAboutTimelineEntry(data));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  async updateTimelineEntry(
    id: number,
    data: Partial<InsertAboutTimelineEntry>,
  ): Promise<Result<AboutTimelineEntry, AppError>> {
    const result = await safeQuery(aboutRepository.updateAboutTimelineEntry(id, data));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  async deleteTimelineEntry(id: number): Promise<Result<boolean, AppError>> {
    const result = await safeQuery(aboutRepository.deleteAboutTimelineEntry(id));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  async reorderTimelineEntries(orderedIds: number[]): Promise<Result<boolean, AppError>> {
    const operation = async () => {
      await aboutRepository.reorderAboutTimelineEntries(orderedIds);
      return true;
    };

    const result = await safeQuery(
      withCircuit("about-timeline-reorder", operation, DB_CIRCUIT_OPTIONS),
    );

    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }

    return result;
  }

  // ===========================================================================
  // LOCATIONS
  // ===========================================================================

  async getLocations(
    includeInactive: boolean = true,
  ): Promise<Result<AboutMapLocation[], AppError>> {
    const operation = async () => {
      const data = await aboutRepository.getAboutMapLocations(includeInactive);
      return (data as AboutMapLocation[]) || [];
    };

    return safeQuery(withCircuit("about-locations-get", operation, DB_CIRCUIT_OPTIONS));
  }

  async getLocation(id: number): Promise<Result<AboutMapLocation | null, AppError>> {
    const operation = async () => {
      const data = await aboutRepository.getAboutMapLocation(id);
      return data ? (data as AboutMapLocation) : null;
    };

    return safeQuery(withCircuit("about-location-get", operation, DB_CIRCUIT_OPTIONS));
  }

  async createLocation(data: InsertAboutMapLocation): Promise<Result<AboutMapLocation, AppError>> {
    const result = await safeQuery(aboutRepository.createAboutMapLocation(data));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  async updateLocation(
    id: number,
    data: Partial<InsertAboutMapLocation>,
  ): Promise<Result<AboutMapLocation, AppError>> {
    const result = await safeQuery(aboutRepository.updateAboutMapLocation(id, data));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  async deleteLocation(id: number): Promise<Result<boolean, AppError>> {
    const result = await safeQuery(aboutRepository.deleteAboutMapLocation(id));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  async reorderLocations(orderedIds: number[]): Promise<Result<boolean, AppError>> {
    const operation = async () => {
      await aboutRepository.reorderAboutMapLocations(orderedIds);
      return true;
    };

    const result = await safeQuery(
      withCircuit("about-locations-reorder", operation, DB_CIRCUIT_OPTIONS),
    );

    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }

    return result;
  }

  // ===========================================================================
  // SECTIONS
  // ===========================================================================

  async getSections(includeInactive: boolean = true): Promise<Result<AboutSection[], AppError>> {
    const operation = async () => {
      const data = await aboutRepository.getAboutSections(includeInactive);
      return (data as AboutSection[]) || [];
    };

    return safeQuery(withCircuit("about-sections-get", operation, DB_CIRCUIT_OPTIONS));
  }

  async getSection(id: number): Promise<Result<AboutSection | null, AppError>> {
    const operation = async () => {
      const data = await aboutRepository.getAboutSection(id);
      return data ? (data as AboutSection) : null;
    };

    return safeQuery(withCircuit("about-section-get", operation, DB_CIRCUIT_OPTIONS));
  }

  async createSection(data: InsertAboutSection): Promise<Result<AboutSection, AppError>> {
    const result = await safeQuery(aboutRepository.createAboutSection(data));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  async updateSection(
    id: number,
    data: Partial<InsertAboutSection>,
  ): Promise<Result<AboutSection, AppError>> {
    const result = await safeQuery(aboutRepository.updateAboutSection(id, data));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  async deleteSection(id: number): Promise<Result<boolean, AppError>> {
    const result = await safeQuery(aboutRepository.deleteAboutSection(id));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  async reorderSections(orderedIds: number[]): Promise<Result<boolean, AppError>> {
    const operation = async () => {
      await aboutRepository.reorderAboutSections(orderedIds);
      return true;
    };

    const result = await safeQuery(
      withCircuit("about-sections-reorder", operation, DB_CIRCUIT_OPTIONS),
    );

    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }

    return result;
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  async getStatistics(
    includeInactive: boolean = true,
  ): Promise<Result<AboutStatistic[], AppError>> {
    const operation = async () => {
      const data = await aboutRepository.getAboutStatistics(includeInactive);
      return (data as AboutStatistic[]) || [];
    };

    return safeQuery(withCircuit("about-statistics-get", operation, DB_CIRCUIT_OPTIONS));
  }

  async getStatistic(id: number): Promise<Result<AboutStatistic | null, AppError>> {
    const operation = async () => {
      const data = await aboutRepository.getAboutStatistic(id);
      return data ? (data as AboutStatistic) : null;
    };

    return safeQuery(withCircuit("about-statistic-get", operation, DB_CIRCUIT_OPTIONS));
  }

  async createStatistic(data: InsertAboutStatistic): Promise<Result<AboutStatistic, AppError>> {
    const result = await safeQuery(aboutRepository.createAboutStatistic(data));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result as Result<AboutStatistic, AppError>;
  }

  async updateStatistic(
    id: number,
    data: Partial<InsertAboutStatistic>,
  ): Promise<Result<AboutStatistic, AppError>> {
    const result = await safeQuery(aboutRepository.updateAboutStatistic(id, data));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result as Result<AboutStatistic, AppError>;
  }

  async deleteStatistic(id: number): Promise<Result<boolean, AppError>> {
    const result = await safeQuery(aboutRepository.deleteAboutStatistic(id));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result;
  }

  async reorderStatistics(orderedIds: number[]): Promise<Result<boolean, AppError>> {
    const operation = async () => {
      await aboutRepository.reorderAboutStatistics(orderedIds);
      return true;
    };

    const result = await safeQuery(
      withCircuit("about-statistics-reorder", operation, DB_CIRCUIT_OPTIONS),
    );

    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }

    return result;
  }

  // ===========================================================================
  // TEAM MESSAGE
  // ===========================================================================

  async getTeamMessage(
    includeInactive: boolean = true,
  ): Promise<Result<AboutTeamMessage | null, AppError>> {
    const operation = async () => {
      const data = await aboutRepository.getAboutTeamMessage(includeInactive);
      return data ? (data as AboutTeamMessage) : null;
    };

    return safeQuery(withCircuit("about-team-message-get", operation, DB_CIRCUIT_OPTIONS));
  }

  async updateTeamMessage(
    data: Partial<InsertAboutTeamMessage>,
  ): Promise<Result<AboutTeamMessage, AppError>> {
    const result = await safeQuery(aboutRepository.updateAboutTeamMessage(data));
    if (result.isOk()) {
      await CacheOperations.invalidateAbout();
    }
    return result as Result<AboutTeamMessage, AppError>;
  }
}

// Export singleton instance
export const aboutService = new AboutService();
