import type {
  InsertSustainabilityGoal,
  InsertSustainabilityHero,
  InsertSustainabilityInitiative,
  InsertSustainabilityMetric,
  InsertUnifiedSustainability,
  SustainabilityGoal,
  SustainabilityHero,
  SustainabilityInitiative,
  SustainabilityMetric,
  SustainabilityMetricHistory,
  UnifiedSustainability,
} from "@run-remix/shared";
import {
  insertSustainabilityGoalSchema,
  insertSustainabilityHeroSchema,
  insertSustainabilityInitiativeSchema,
  insertSustainabilityMetricSchema,
  insertUnifiedSustainabilitySchema,
} from "@run-remix/shared";
import { type Result, ResultAsync } from "neverthrow";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { sanitizeHtml } from "../lib/sanitize-html.js";
import { miscRepository, sustainabilityRepository } from "./repositories/index.js";

/**
 * Service for managing Sustainability domain content
 * Enforces Result-based patterns and circuit breaker protection
 */
class SustainabilityService {
  /**
   * Invalidates all sustainability related cache entries
   */
  private async invalidateCache(): Promise<void> {
    try {
      await CacheOperations.invalidateSustainability();
    } catch (error) {
      logger.error("[SustainabilityService] Cache invalidation failed", error as Error);
    }
  }

  // Hero
  async getHero(): Promise<Result<SustainabilityHero, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityHero> => {
        const hero = await withCircuit(
          "get-sustainability-hero",
          () => sustainabilityRepository.getSustainabilityHero(),
          DB_CIRCUIT_OPTIONS,
        );

        if (!hero) {
          throw new NotFoundError("Sustainability hero configuration");
        }

        return hero;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to fetch hero", error as Error);
        return new InternalError("Failed to fetch sustainability hero configuration", { error });
      },
    );
  }

  async updateHero(
    data: Partial<InsertSustainabilityHero>,
  ): Promise<Result<SustainabilityHero, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityHero> => {
        const updated = await withCircuit(
          "update-sustainability-hero",
          () =>
            sustainabilityRepository.updateSustainabilityHero(
              (() => {
                const parsed = insertSustainabilityHeroSchema.partial().parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to update hero", error as Error);
        return new InternalError("Failed to update sustainability hero configuration", { error });
      },
    );
  }

  // Goals
  async getGoals(includeInactive = false): Promise<Result<SustainabilityGoal[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityGoal[]> => {
        const goals = await withCircuit(
          "get-sustainability-goals",
          () => sustainabilityRepository.getSustainabilityGoals(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );
        return goals;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to fetch goals", error as Error);
        return new InternalError("Failed to fetch sustainability goals", { error });
      },
    );
  }

  async getGoal(id: number): Promise<Result<SustainabilityGoal, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityGoal> => {
        const goal = await withCircuit(
          `get-sustainability-goal-${id}`,
          () => sustainabilityRepository.getSustainabilityGoal(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!goal) {
          throw new NotFoundError(`Sustainability goal with ID ${id}`);
        }

        return goal;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to fetch goal", { id }, error as Error);
        return new InternalError(`Failed to fetch sustainability goal ${id}`, { error });
      },
    );
  }

  async createGoal(data: InsertSustainabilityGoal): Promise<Result<SustainabilityGoal, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityGoal> => {
        const created = await withCircuit(
          "create-sustainability-goal",
          () =>
            sustainabilityRepository.createSustainabilityGoal(
              (() => {
                const parsed = insertSustainabilityGoalSchema.parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return created;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to create goal", error as Error);
        return new InternalError("Failed to create sustainability goal", { error });
      },
    );
  }

  async updateGoal(
    id: number,
    data: Partial<InsertSustainabilityGoal>,
  ): Promise<Result<SustainabilityGoal, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityGoal> => {
        const updated = await withCircuit(
          `update-sustainability-goal-${id}`,
          () =>
            sustainabilityRepository.updateSustainabilityGoal(
              id,
              (() => {
                const parsed = insertSustainabilityGoalSchema.partial().parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to update goal", { id }, error as Error);
        return new InternalError(`Failed to update sustainability goal ${id}`, { error });
      },
    );
  }

  async deleteGoal(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const deleted = await withCircuit(
          `delete-sustainability-goal-${id}`,
          () => sustainabilityRepository.deleteSustainabilityGoal(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!deleted) {
          throw new NotFoundError(`Sustainability goal with ID ${id}`);
        }

        await this.invalidateCache();
        return deleted;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to delete goal", { id }, error as Error);
        return new InternalError(`Failed to delete sustainability goal ${id}`, { error });
      },
    );
  }

  async reorderGoals(orderedIds: number[]): Promise<Result<void, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<void> => {
        await withCircuit(
          "reorder-sustainability-goals",
          () => sustainabilityRepository.reorderSustainabilityGoals(orderedIds),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return undefined;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to reorder goals", error as Error);
        return new InternalError("Failed to reorder sustainability goals", { error });
      },
    );
  }

  // Metrics
  async getMetrics(): Promise<Result<SustainabilityMetric[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityMetric[]> => {
        const metrics = await withCircuit(
          "get-sustainability-metrics",
          () => sustainabilityRepository.getSustainabilityMetrics(),
          DB_CIRCUIT_OPTIONS,
        );
        return metrics;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to fetch metrics", error as Error);
        return new InternalError("Failed to fetch sustainability metrics", { error });
      },
    );
  }

  async getMetric(id: number): Promise<Result<SustainabilityMetric, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityMetric> => {
        const metric = await withCircuit(
          `get-sustainability-metric-${id}`,
          () => sustainabilityRepository.getSustainabilityMetric(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!metric) {
          throw new NotFoundError(`Sustainability metric with ID ${id}`);
        }

        return metric;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to fetch metric", { id }, error as Error);
        return new InternalError(`Failed to fetch sustainability metric ${id}`, { error });
      },
    );
  }

  async createMetric(
    data: InsertSustainabilityMetric,
  ): Promise<Result<SustainabilityMetric, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityMetric> => {
        const created = await withCircuit(
          "create-sustainability-metric",
          () =>
            sustainabilityRepository.createSustainabilityMetric(
              (() => {
                const parsed = insertSustainabilityMetricSchema.parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return created;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to create metric", error as Error);
        return new InternalError("Failed to create sustainability metric", { error });
      },
    );
  }

  async updateMetric(
    id: number,
    data: Partial<InsertSustainabilityMetric>,
  ): Promise<Result<SustainabilityMetric, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityMetric> => {
        const updated = await withCircuit(
          `update-sustainability-metric-${id}`,
          () =>
            sustainabilityRepository.updateSustainabilityMetric(
              id,
              (() => {
                const parsed = insertSustainabilityMetricSchema.partial().parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to update metric", { id }, error as Error);
        return new InternalError(`Failed to update sustainability metric ${id}`, { error });
      },
    );
  }

  async deleteMetric(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const deleted = await withCircuit(
          `delete-sustainability-metric-${id}`,
          () => sustainabilityRepository.deleteSustainabilityMetric(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!deleted) {
          throw new NotFoundError(`Sustainability metric with ID ${id}`);
        }

        await this.invalidateCache();
        return deleted;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to delete metric", { id }, error as Error);
        return new InternalError(`Failed to delete sustainability metric ${id}`, { error });
      },
    );
  }

  async reorderMetrics(orderedIds: number[]): Promise<Result<void, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<void> => {
        await withCircuit(
          "reorder-sustainability-metrics",
          () => sustainabilityRepository.reorderSustainabilityMetrics(orderedIds),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return undefined;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to reorder metrics", error as Error);
        return new InternalError("Failed to reorder sustainability metrics", { error });
      },
    );
  }

  async getMetricHistory(
    metricId: number,
  ): Promise<Result<SustainabilityMetricHistory[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityMetricHistory[]> => {
        const history = await withCircuit(
          `get-sustainability-metric-history-${metricId}`,
          () => sustainabilityRepository.getSustainabilityMetricHistory(metricId),
          DB_CIRCUIT_OPTIONS,
        );
        return history;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[SustainabilityService] Failed to fetch metric history",
          { metricId },
          error as Error,
        );
        return new InternalError(`Failed to fetch sustainability metric history for ${metricId}`, {
          error,
        });
      },
    );
  }

  // Initiatives
  async getInitiatives(
    includeInactive = false,
  ): Promise<Result<SustainabilityInitiative[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityInitiative[]> => {
        const initiatives = await withCircuit(
          "get-sustainability-initiatives",
          () => sustainabilityRepository.getSustainabilityInitiatives(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );
        return initiatives;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to fetch initiatives", error as Error);
        return new InternalError("Failed to fetch sustainability initiatives", { error });
      },
    );
  }

  async getInitiative(id: number): Promise<Result<SustainabilityInitiative, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityInitiative> => {
        const initiative = await withCircuit(
          `get-sustainability-initiative-${id}`,
          () => sustainabilityRepository.getSustainabilityInitiative(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!initiative) {
          throw new NotFoundError(`Sustainability initiative with ID ${id}`);
        }

        return initiative;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to fetch initiative", { id }, error as Error);
        return new InternalError(`Failed to fetch sustainability initiative ${id}`, { error });
      },
    );
  }

  async createInitiative(
    data: InsertSustainabilityInitiative,
  ): Promise<Result<SustainabilityInitiative, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityInitiative> => {
        const created = await withCircuit(
          "create-sustainability-initiative",
          () =>
            sustainabilityRepository.createSustainabilityInitiative(
              (() => {
                const parsed = insertSustainabilityInitiativeSchema.parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return created;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to create initiative", error as Error);
        return new InternalError("Failed to create sustainability initiative", { error });
      },
    );
  }

  async updateInitiative(
    id: number,
    data: Partial<InsertSustainabilityInitiative>,
  ): Promise<Result<SustainabilityInitiative, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<SustainabilityInitiative> => {
        const updated = await withCircuit(
          `update-sustainability-initiative-${id}`,
          () =>
            sustainabilityRepository.updateSustainabilityInitiative(
              id,
              (() => {
                const parsed = insertSustainabilityInitiativeSchema.partial().parse(data);
                if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to update initiative", { id }, error as Error);
        return new InternalError(`Failed to update sustainability initiative ${id}`, { error });
      },
    );
  }

  async deleteInitiative(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const deleted = await withCircuit(
          `delete-sustainability-initiative-${id}`,
          () => sustainabilityRepository.deleteSustainabilityInitiative(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!deleted) {
          throw new NotFoundError(`Sustainability initiative with ID ${id}`);
        }

        await this.invalidateCache();
        return deleted;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to delete initiative", { id }, error as Error);
        return new InternalError(`Failed to delete sustainability initiative ${id}`, { error });
      },
    );
  }

  async reorderInitiatives(orderedIds: number[]): Promise<Result<void, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<void> => {
        await withCircuit(
          "reorder-sustainability-initiatives",
          () => sustainabilityRepository.reorderSustainabilityInitiatives(orderedIds),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return undefined;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to reorder initiatives", error as Error);
        return new InternalError("Failed to reorder sustainability initiatives", { error });
      },
    );
  }

  // Unified Sustainability
  async getUnifiedConfig(): Promise<Result<UnifiedSustainability, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<UnifiedSustainability> => {
        const unified = await withCircuit(
          "get-unified-sustainability",
          () => sustainabilityRepository.getUnifiedSustainability(),
          DB_CIRCUIT_OPTIONS,
        );

        if (!unified) {
          throw new NotFoundError("Unified sustainability configuration");
        }

        return unified;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[SustainabilityService] Failed to fetch unified sustainability",
          error as Error,
        );
        return new InternalError("Failed to fetch unified sustainability configuration", { error });
      },
    );
  }

  async updateUnifiedConfig(
    data: Partial<InsertUnifiedSustainability>,
  ): Promise<Result<UnifiedSustainability, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<UnifiedSustainability> => {
        const updated = await withCircuit(
          "update-unified-sustainability",
          () =>
            sustainabilityRepository.updateUnifiedSustainability(
              (() => {
                const parsed = insertUnifiedSustainabilitySchema.partial().parse(data);
                return parsed as typeof data;
              })(),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[SustainabilityService] Failed to update unified sustainability",
          error as Error,
        );
        return new InternalError("Failed to update unified sustainability configuration", {
          error,
        });
      },
    );
  }

  // Batch
  async getBatch(): Promise<Result<Record<string, unknown>, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Record<string, unknown>> => {
        const [hero, metrics, initiatives, goals, certificates, fabrics] = await withCircuit(
          "get-sustainability-batch-db",
          () =>
            Promise.all([
              sustainabilityRepository.getUnifiedSustainability(),
              sustainabilityRepository.getSustainabilityMetrics(),
              sustainabilityRepository.getSustainabilityInitiatives(),
              sustainabilityRepository.getSustainabilityGoals(),
              miscRepository.getCertificates(),
              miscRepository.getFabrics(),
            ]),
          DB_CIRCUIT_OPTIONS,
        );

        return {
          hero: hero || null,
          metrics: (metrics || []).map((m: SustainabilityMetric) => ({
            ...m,
            title: m.name || "Untitled Metric",
          })),
          initiatives: (initiatives || []).map((i: SustainabilityInitiative) => ({
            ...i,
            title: i.title || "Untitled Initiative",
          })),
          goals: (goals || []).map((g: SustainabilityGoal) => ({
            ...g,
            title: g.title || "Untitled Goal",
          })),
          certificates: certificates || [],
          fabrics: fabrics || [],
          _meta: {
            fetchedAt: new Date().toISOString(),
          },
        };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[SustainabilityService] Failed to fetch batch", error as Error);
        return new InternalError("Failed to fetch sustainability batch content", { error });
      },
    );
  }
}

export const sustainabilityService = new SustainabilityService();
