import { trace } from "@opentelemetry/api";
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
import {
  insertAboutHeroSchema,
  insertAboutMapLocationSchema,
  insertAboutSectionSchema,
  insertAboutStatisticSchema,
  insertAboutTeamMessageSchema,
  insertAboutTimelineEntrySchema,
} from "@run-remix/shared";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { sanitizeHtml } from "../lib/sanitize-html.js";
import { aboutRepository } from "./repositories/index.js";

/**
 * Service for managing About page domain content
 * Enforces Result-based patterns and circuit breaker protection
 */
const tracer = trace.getTracer("run-remix-services");

/** @public */ export class AboutService {
  /**
   * Invalidates all about page related cache entries
   */
  private async invalidateCache(): Promise<void> {
    try {
      await CacheOperations.invalidateAbout();
    } catch (error) {
      logger.error("[AboutService] Cache invalidation failed", error as Error);
    }
  }

  // Hero
  async getHero(includeInactive = false): Promise<Result<AboutHero, AppError>> {
    return tracer.startActiveSpan("AboutService.getHero", async (span) => {
      return new ResultAsync(
        (async (): Promise<Result<AboutHero, AppError>> => {
          const hero = await withCircuit(
            "get-about-hero",
            () => aboutRepository.getAboutHero(includeInactive),
            DB_CIRCUIT_OPTIONS,
          );

          if (!hero) {
            span.recordException(new Error("About hero configuration not found"));
            span.end();
            return err(new NotFoundError("About hero configuration"));
          }

          span.end();
          return ok(hero);
        })().catch((error) => {
          if (error instanceof AppError) return err(error);
          logger.error("[AboutService] Failed to fetch hero", error as Error);
          span.recordException(error as Error);
          span.end();
          return err(new InternalError("Failed to fetch about hero configuration", { error }));
        }),
      );
    });
  }

  async updateHero(data: Partial<InsertAboutHero>): Promise<Result<AboutHero, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutHero, AppError>> => {
        const updated = await withCircuit(
          "update-about-hero",
          () =>
            aboutRepository.updateAboutHero(
              (() => {
                const parsed = insertAboutHeroSchema.partial().parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
        if (updated.isErr()) return err(updated.error as any);
        return ok(updated.value);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to update hero", error as Error);
        return err(new InternalError("Failed to update about hero configuration", { error }));
      }),
    );
  }

  // Timeline
  async getTimelineEntries(
    includeInactive = false,
  ): Promise<Result<AboutTimelineEntry[], AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutTimelineEntry[], AppError>> => {
        const entries = await withCircuit(
          "get-about-timeline",
          () => aboutRepository.getAboutTimelineEntries(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(entries);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to fetch timeline entries", error as Error);
        return err(new InternalError("Failed to fetch about timeline entries", { error }));
      }),
    );
  }

  async getTimelineEntry(id: number): Promise<Result<AboutTimelineEntry, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutTimelineEntry, AppError>> => {
        const entry = await withCircuit(
          `get-about-timeline-${id}`,
          () => aboutRepository.getAboutTimelineEntry(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!entry) {
          return err(new NotFoundError(`About timeline entry with ID ${id}`));
        }

        return ok(entry);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to fetch timeline entry", { id }, error as Error);
        return err(new InternalError(`Failed to fetch about timeline entry ${id}`, { error }));
      }),
    );
  }

  async createTimelineEntry(
    data: InsertAboutTimelineEntry,
  ): Promise<Result<AboutTimelineEntry, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutTimelineEntry, AppError>> => {
        const created = await withCircuit(
          "create-about-timeline",
          () =>
            aboutRepository.createAboutTimelineEntry(
              (() => {
                const parsed = insertAboutTimelineEntrySchema.parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return ok(created);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to create timeline entry", error as Error);
        return err(new InternalError("Failed to create about timeline entry", { error }));
      }),
    );
  }

  async updateTimelineEntry(
    id: number,
    data: Partial<InsertAboutTimelineEntry>,
  ): Promise<Result<AboutTimelineEntry, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutTimelineEntry, AppError>> => {
        const updated = await withCircuit(
          `update-about-timeline-${id}`,
          () =>
            aboutRepository.updateAboutTimelineEntry(
              id,
              (() => {
                const parsed = insertAboutTimelineEntrySchema.partial().parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
        if (updated.isErr()) return err(updated.error as any);
        return ok(updated.value);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to update timeline entry", { id }, error as Error);
        return err(new InternalError(`Failed to update about timeline entry ${id}`, { error }));
      }),
    );
  }

  async deleteTimelineEntry(id: number): Promise<Result<boolean, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        const deleted = await withCircuit(
          `delete-about-timeline-${id}`,
          () => aboutRepository.deleteAboutTimelineEntry(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!deleted) {
          return err(new NotFoundError(`About timeline entry with ID ${id}`));
        }

        await this.invalidateCache();
        return ok(deleted);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to delete timeline entry", { id }, error as Error);
        return err(new InternalError(`Failed to delete about timeline entry ${id}`, { error }));
      }),
    );
  }

  async reorderTimelineEntries(orderedIds: number[]): Promise<Result<void, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<void, AppError>> => {
        await withCircuit(
          "reorder-about-timeline",
          () => aboutRepository.reorderAboutTimelineEntries(orderedIds),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return ok(undefined);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to reorder timeline entries", error as Error);
        return err(new InternalError("Failed to reorder about timeline entries", { error }));
      }),
    );
  }

  // Map Locations
  async getMapLocations(includeInactive = false): Promise<Result<AboutMapLocation[], AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutMapLocation[], AppError>> => {
        const locations = await withCircuit(
          "get-about-locations",
          () => aboutRepository.getAboutMapLocations(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(locations);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to fetch map locations", error as Error);
        return err(new InternalError("Failed to fetch about map locations", { error }));
      }),
    );
  }

  async getMapLocation(id: number): Promise<Result<AboutMapLocation, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutMapLocation, AppError>> => {
        const location = await withCircuit(
          `get-about-location-${id}`,
          () => aboutRepository.getAboutMapLocation(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!location) {
          return err(new NotFoundError(`About map location with ID ${id}`));
        }

        return ok(location);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to fetch map location", { id }, error as Error);
        return err(new InternalError(`Failed to fetch about map location ${id}`, { error }));
      }),
    );
  }

  async createMapLocation(
    data: InsertAboutMapLocation,
  ): Promise<Result<AboutMapLocation, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutMapLocation, AppError>> => {
        const created = await withCircuit(
          "create-about-location",
          () =>
            aboutRepository.createAboutMapLocation(
              (() => {
                const parsed = insertAboutMapLocationSchema.parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return ok(created);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to create map location", error as Error);
        return err(new InternalError("Failed to create about map location", { error }));
      }),
    );
  }

  async updateMapLocation(
    id: number,
    data: Partial<InsertAboutMapLocation>,
  ): Promise<Result<AboutMapLocation, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutMapLocation, AppError>> => {
        const updated = await withCircuit(
          `update-about-location-${id}`,
          () =>
            aboutRepository.updateAboutMapLocation(
              id,
              (() => {
                const parsed = insertAboutMapLocationSchema.partial().parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
        if (updated.isErr()) return err(updated.error as any);
        return ok(updated.value);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to update map location", { id }, error as Error);
        return err(new InternalError(`Failed to update about map location ${id}`, { error }));
      }),
    );
  }

  async deleteMapLocation(id: number): Promise<Result<boolean, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        const deleted = await withCircuit(
          `delete-about-location-${id}`,
          () => aboutRepository.deleteAboutMapLocation(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!deleted) {
          return err(new NotFoundError(`About map location with ID ${id}`));
        }

        await this.invalidateCache();
        return ok(deleted);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to delete map location", { id }, error as Error);
        return err(new InternalError(`Failed to delete about map location ${id}`, { error }));
      }),
    );
  }

  async reorderLocations(orderedIds: number[]): Promise<Result<void, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<void, AppError>> => {
        await withCircuit(
          "reorder-about-locations",
          () => aboutRepository.reorderAboutMapLocations(orderedIds),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return ok(undefined);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to reorder locations", error as Error);
        return err(new InternalError("Failed to reorder about map locations", { error }));
      }),
    );
  }

  // Sections
  async getSections(includeInactive = false): Promise<Result<AboutSection[], AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutSection[], AppError>> => {
        const sections = await withCircuit(
          "get-about-sections",
          () => aboutRepository.getAboutSections(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(sections);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to fetch sections", error as Error);
        return err(new InternalError("Failed to fetch about sections", { error }));
      }),
    );
  }

  async getSection(id: number): Promise<Result<AboutSection, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutSection, AppError>> => {
        const section = await withCircuit(
          `get-about-section-${id}`,
          () => aboutRepository.getAboutSection(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!section) {
          return err(new NotFoundError(`About section with ID ${id}`));
        }

        return ok(section);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to fetch section", { id }, error as Error);
        return err(new InternalError(`Failed to fetch about section ${id}`, { error }));
      }),
    );
  }

  async createSection(data: InsertAboutSection): Promise<Result<AboutSection, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutSection, AppError>> => {
        const created = await withCircuit(
          "create-about-section",
          () =>
            aboutRepository.createAboutSection(
              (() => {
                const parsed = insertAboutSectionSchema.parse(data);
                if (parsed.content) parsed.content = sanitizeHtml(parsed.content);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return ok(created);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to create section", error as Error);
        return err(new InternalError("Failed to create about section", { error }));
      }),
    );
  }

  async updateSection(
    id: number,
    data: Partial<InsertAboutSection>,
  ): Promise<Result<AboutSection, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutSection, AppError>> => {
        const updated = await withCircuit(
          `update-about-section-${id}`,
          () =>
            aboutRepository.updateAboutSection(
              id,
              (() => {
                const parsed = insertAboutSectionSchema.partial().parse(data);
                if (parsed.content) parsed.content = sanitizeHtml(parsed.content);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
        if (updated.isErr()) return err(updated.error as any);
        return ok(updated.value);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to update section", { id }, error as Error);
        return err(new InternalError(`Failed to update about section ${id}`, { error }));
      }),
    );
  }

  async deleteSection(id: number): Promise<Result<boolean, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        const deleted = await withCircuit(
          `delete-about-section-${id}`,
          () => aboutRepository.deleteAboutSection(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!deleted) {
          return err(new NotFoundError(`About section with ID ${id}`));
        }

        await this.invalidateCache();
        return ok(deleted);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to delete section", { id }, error as Error);
        return err(new InternalError(`Failed to delete about section ${id}`, { error }));
      }),
    );
  }

  async reorderSections(orderedIds: number[]): Promise<Result<void, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<void, AppError>> => {
        await withCircuit(
          "reorder-about-sections",
          () => aboutRepository.reorderAboutSections(orderedIds),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return ok(undefined);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to reorder sections", error as Error);
        return err(new InternalError("Failed to reorder about sections", { error }));
      }),
    );
  }

  // Statistics
  async getStatistics(includeInactive = false): Promise<Result<AboutStatistic[], AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutStatistic[], AppError>> => {
        const stats = await withCircuit(
          "get-about-statistics",
          () => aboutRepository.getAboutStatistics(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(stats);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to fetch statistics", error as Error);
        return err(new InternalError("Failed to fetch about statistics", { error }));
      }),
    );
  }

  async getStatistic(id: number): Promise<Result<AboutStatistic, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutStatistic, AppError>> => {
        const stat = await withCircuit(
          `get-about-statistic-${id}`,
          () => aboutRepository.getAboutStatistic(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!stat) {
          return err(new NotFoundError(`About statistic with ID ${id}`));
        }

        return ok(stat);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to fetch statistic", { id }, error as Error);
        return err(new InternalError(`Failed to fetch about statistic ${id}`, { error }));
      }),
    );
  }

  async createStatistic(data: InsertAboutStatistic): Promise<Result<AboutStatistic, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutStatistic, AppError>> => {
        const created = await withCircuit(
          "create-about-statistic",
          () =>
            aboutRepository.createAboutStatistic(
              (() => {
                const parsed = insertAboutStatisticSchema.parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return ok(created);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to create statistic", error as Error);
        return err(new InternalError("Failed to create about statistic", { error }));
      }),
    );
  }

  async updateStatistic(
    id: number,
    data: Partial<InsertAboutStatistic>,
  ): Promise<Result<AboutStatistic, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutStatistic, AppError>> => {
        const updated = await withCircuit(
          `update-about-statistic-${id}`,
          () =>
            aboutRepository.updateAboutStatistic(
              id,
              (() => {
                const parsed = insertAboutStatisticSchema.partial().parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        if (!updated) {
          return err(new NotFoundError(`About statistic with ID ${id}`));
        }

        await this.invalidateCache();
        return ok(updated);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to update statistic", { id }, error as Error);
        return err(new InternalError(`Failed to update about statistic ${id}`, { error }));
      }),
    );
  }

  async deleteStatistic(id: number): Promise<Result<boolean, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<boolean, AppError>> => {
        const deleted = await withCircuit(
          `delete-about-statistic-${id}`,
          () => aboutRepository.deleteAboutStatistic(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!deleted) {
          return err(new NotFoundError(`About statistic with ID ${id}`));
        }

        await this.invalidateCache();
        return ok(deleted);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to delete statistic", { id }, error as Error);
        return err(new InternalError(`Failed to delete about statistic ${id}`, { error }));
      }),
    );
  }

  async reorderStatistics(orderedIds: number[]): Promise<Result<void, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<void, AppError>> => {
        await withCircuit(
          "reorder-about-statistics",
          () => aboutRepository.reorderAboutStatistics(orderedIds),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return ok(undefined);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to reorder statistics", error as Error);
        return err(new InternalError("Failed to reorder about statistics", { error }));
      }),
    );
  }

  // Team Messages
  async getTeamMessage(includeInactive = false): Promise<Result<AboutTeamMessage, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutTeamMessage, AppError>> => {
        const message = await withCircuit(
          "get-about-team-message",
          () => aboutRepository.getAboutTeamMessage(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );

        if (!message) {
          return err(new NotFoundError("About team message"));
        }

        return ok(message);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to fetch team message", error as Error);
        return err(new InternalError("Failed to fetch about team message", { error }));
      }),
    );
  }

  async updateTeamMessage(
    data: Partial<InsertAboutTeamMessage>,
  ): Promise<Result<AboutTeamMessage, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutTeamMessage, AppError>> => {
        const updated = await withCircuit(
          "update-about-team-message",
          () =>
            aboutRepository.updateAboutTeamMessage(
              (() => {
                const parsed = insertAboutTeamMessageSchema.partial().parse(data);
                if (parsed.message) parsed.message = sanitizeHtml(parsed.message);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
        if (updated.isErr()) return err(updated.error as any);
        return ok(updated.value);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to update team message", error as Error);
        return err(new InternalError("Failed to update about team message", { error }));
      }),
    );
  }

  // Batch
  async getAllAboutData(): Promise<Result<AboutBatchResponse, AppError>> {
    return new ResultAsync(
      (async (): Promise<Result<AboutBatchResponse, AppError>> => {
        const batch = await withCircuit(
          "get-about-batch",
          () => aboutRepository.getAboutBatch(),
          DB_CIRCUIT_OPTIONS,
        );
        return ok(batch);
      })().catch((error) => {
        if (error instanceof AppError) return err(error);
        logger.error("[AboutService] Failed to fetch about batch", error as Error);
        return err(new InternalError("Failed to fetch about page batch content", { error }));
      }),
    );
  }

  // Alias for backward compatibility with routes
  async getBatch(): Promise<Result<AboutBatchResponse, AppError>> {
    return this.getAllAboutData();
  }
}

export const aboutService = new AboutService();
