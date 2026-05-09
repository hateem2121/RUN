import { err, ok, type Result } from "neverthrow";
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
} from "../../shared/index.js";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { miscRepository, sustainabilityRepository } from "../lib/db/repositories/index.js";
import { type AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";

/**
 * Service for managing Sustainability domain content
 * Enforces Result-based patterns and circuit breaker protection
 */
export class SustainabilityService {
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
    try {
      const hero = await withCircuit(
        "get-sustainability-hero",
        () => sustainabilityRepository.getSustainabilityHero(),
        DB_CIRCUIT_OPTIONS,
      );

      if (!hero) {
        return err(new NotFoundError("Sustainability hero configuration"));
      }

      return ok(hero);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to fetch hero", error as Error);
      return err(new InternalError("Failed to fetch sustainability hero configuration", { error }));
    }
  }

  async updateHero(
    data: Partial<InsertSustainabilityHero>,
  ): Promise<Result<SustainabilityHero, AppError>> {
    try {
      const updated = await withCircuit(
        "update-sustainability-hero",
        () => sustainabilityRepository.updateSustainabilityHero(data),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to update hero", error as Error);
      return err(
        new InternalError("Failed to update sustainability hero configuration", { error }),
      );
    }
  }

  // Goals
  async getGoals(includeInactive = false): Promise<Result<SustainabilityGoal[], AppError>> {
    try {
      const goals = await withCircuit(
        "get-sustainability-goals",
        () => sustainabilityRepository.getSustainabilityGoals(includeInactive),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(goals);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to fetch goals", error as Error);
      return err(new InternalError("Failed to fetch sustainability goals", { error }));
    }
  }

  async getGoal(id: number): Promise<Result<SustainabilityGoal, AppError>> {
    try {
      const goal = await withCircuit(
        `get-sustainability-goal-${id}`,
        () => sustainabilityRepository.getSustainabilityGoal(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!goal) {
        return err(new NotFoundError(`Sustainability goal with ID ${id}`));
      }

      return ok(goal);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to fetch goal", { id }, error as Error);
      return err(new InternalError(`Failed to fetch sustainability goal ${id}`, { error }));
    }
  }

  async createGoal(data: InsertSustainabilityGoal): Promise<Result<SustainabilityGoal, AppError>> {
    try {
      const created = await withCircuit(
        "create-sustainability-goal",
        () => sustainabilityRepository.createSustainabilityGoal(data),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(created);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to create goal", error as Error);
      return err(new InternalError("Failed to create sustainability goal", { error }));
    }
  }

  async updateGoal(
    id: number,
    data: Partial<InsertSustainabilityGoal>,
  ): Promise<Result<SustainabilityGoal, AppError>> {
    try {
      const updated = await withCircuit(
        `update-sustainability-goal-${id}`,
        () => sustainabilityRepository.updateSustainabilityGoal(id, data),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to update goal", { id }, error as Error);
      return err(new InternalError(`Failed to update sustainability goal ${id}`, { error }));
    }
  }

  async deleteGoal(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-sustainability-goal-${id}`,
        () => sustainabilityRepository.deleteSustainabilityGoal(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!deleted) {
        return err(new NotFoundError(`Sustainability goal with ID ${id}`));
      }

      await this.invalidateCache();
      return ok(deleted);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to delete goal", { id }, error as Error);
      return err(new InternalError(`Failed to delete sustainability goal ${id}`, { error }));
    }
  }

  async reorderGoals(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-sustainability-goals",
        () => sustainabilityRepository.reorderSustainabilityGoals(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(undefined);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to reorder goals", error as Error);
      return err(new InternalError("Failed to reorder sustainability goals", { error }));
    }
  }

  // Metrics
  async getMetrics(): Promise<Result<SustainabilityMetric[], AppError>> {
    try {
      const metrics = await withCircuit(
        "get-sustainability-metrics",
        () => sustainabilityRepository.getSustainabilityMetrics(),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(metrics);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to fetch metrics", error as Error);
      return err(new InternalError("Failed to fetch sustainability metrics", { error }));
    }
  }

  async getMetric(id: number): Promise<Result<SustainabilityMetric, AppError>> {
    try {
      const metric = await withCircuit(
        `get-sustainability-metric-${id}`,
        () => sustainabilityRepository.getSustainabilityMetric(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!metric) {
        return err(new NotFoundError(`Sustainability metric with ID ${id}`));
      }

      return ok(metric);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to fetch metric", { id }, error as Error);
      return err(new InternalError(`Failed to fetch sustainability metric ${id}`, { error }));
    }
  }

  async createMetric(
    data: InsertSustainabilityMetric,
  ): Promise<Result<SustainabilityMetric, AppError>> {
    try {
      const created = await withCircuit(
        "create-sustainability-metric",
        () => sustainabilityRepository.createSustainabilityMetric(data),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(created);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to create metric", error as Error);
      return err(new InternalError("Failed to create sustainability metric", { error }));
    }
  }

  async updateMetric(
    id: number,
    data: Partial<InsertSustainabilityMetric>,
  ): Promise<Result<SustainabilityMetric, AppError>> {
    try {
      const updated = await withCircuit(
        `update-sustainability-metric-${id}`,
        () => sustainabilityRepository.updateSustainabilityMetric(id, data),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to update metric", { id }, error as Error);
      return err(new InternalError(`Failed to update sustainability metric ${id}`, { error }));
    }
  }

  async deleteMetric(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-sustainability-metric-${id}`,
        () => sustainabilityRepository.deleteSustainabilityMetric(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!deleted) {
        return err(new NotFoundError(`Sustainability metric with ID ${id}`));
      }

      await this.invalidateCache();
      return ok(deleted);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to delete metric", { id }, error as Error);
      return err(new InternalError(`Failed to delete sustainability metric ${id}`, { error }));
    }
  }

  async reorderMetrics(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-sustainability-metrics",
        () => sustainabilityRepository.reorderSustainabilityMetrics(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(undefined);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to reorder metrics", error as Error);
      return err(new InternalError("Failed to reorder sustainability metrics", { error }));
    }
  }

  async getMetricHistory(
    metricId: number,
  ): Promise<Result<SustainabilityMetricHistory[], AppError>> {
    try {
      const history = await withCircuit(
        `get-sustainability-metric-history-${metricId}`,
        () => sustainabilityRepository.getSustainabilityMetricHistory(metricId),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(history);
    } catch (error) {
      logger.error(
        "[SustainabilityService] Failed to fetch metric history",
        { metricId },
        error as Error,
      );
      return err(
        new InternalError(`Failed to fetch sustainability metric history for ${metricId}`, {
          error,
        }),
      );
    }
  }

  // Initiatives
  async getInitiatives(
    includeInactive = false,
  ): Promise<Result<SustainabilityInitiative[], AppError>> {
    try {
      const initiatives = await withCircuit(
        "get-sustainability-initiatives",
        () => sustainabilityRepository.getSustainabilityInitiatives(includeInactive),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(initiatives);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to fetch initiatives", error as Error);
      return err(new InternalError("Failed to fetch sustainability initiatives", { error }));
    }
  }

  async getInitiative(id: number): Promise<Result<SustainabilityInitiative, AppError>> {
    try {
      const initiative = await withCircuit(
        `get-sustainability-initiative-${id}`,
        () => sustainabilityRepository.getSustainabilityInitiative(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!initiative) {
        return err(new NotFoundError(`Sustainability initiative with ID ${id}`));
      }

      return ok(initiative);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to fetch initiative", { id }, error as Error);
      return err(new InternalError(`Failed to fetch sustainability initiative ${id}`, { error }));
    }
  }

  async createInitiative(
    data: InsertSustainabilityInitiative,
  ): Promise<Result<SustainabilityInitiative, AppError>> {
    try {
      const created = await withCircuit(
        "create-sustainability-initiative",
        () => sustainabilityRepository.createSustainabilityInitiative(data),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(created);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to create initiative", error as Error);
      return err(new InternalError("Failed to create sustainability initiative", { error }));
    }
  }

  async updateInitiative(
    id: number,
    data: Partial<InsertSustainabilityInitiative>,
  ): Promise<Result<SustainabilityInitiative, AppError>> {
    try {
      const updated = await withCircuit(
        `update-sustainability-initiative-${id}`,
        () => sustainabilityRepository.updateSustainabilityInitiative(id, data),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to update initiative", { id }, error as Error);
      return err(new InternalError(`Failed to update sustainability initiative ${id}`, { error }));
    }
  }

  async deleteInitiative(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-sustainability-initiative-${id}`,
        () => sustainabilityRepository.deleteSustainabilityInitiative(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!deleted) {
        return err(new NotFoundError(`Sustainability initiative with ID ${id}`));
      }

      await this.invalidateCache();
      return ok(deleted);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to delete initiative", { id }, error as Error);
      return err(new InternalError(`Failed to delete sustainability initiative ${id}`, { error }));
    }
  }

  async reorderInitiatives(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-sustainability-initiatives",
        () => sustainabilityRepository.reorderSustainabilityInitiatives(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(undefined);
    } catch (error) {
      logger.error("[SustainabilityService] Failed to reorder initiatives", error as Error);
      return err(new InternalError("Failed to reorder sustainability initiatives", { error }));
    }
  }

  // Unified Sustainability
  async getUnifiedConfig(): Promise<Result<UnifiedSustainability, AppError>> {
    try {
      const unified = await withCircuit(
        "get-unified-sustainability",
        () => sustainabilityRepository.getUnifiedSustainability(),
        DB_CIRCUIT_OPTIONS,
      );

      if (!unified) {
        return err(new NotFoundError("Unified sustainability configuration"));
      }

      return ok(unified);
    } catch (error) {
      logger.error(
        "[SustainabilityService] Failed to fetch unified sustainability",
        error as Error,
      );
      return err(
        new InternalError("Failed to fetch unified sustainability configuration", { error }),
      );
    }
  }

  async updateUnifiedConfig(
    data: Partial<InsertUnifiedSustainability>,
  ): Promise<Result<UnifiedSustainability, AppError>> {
    try {
      const updated = await withCircuit(
        "update-unified-sustainability",
        () => sustainabilityRepository.updateUnifiedSustainability(data),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error(
        "[SustainabilityService] Failed to update unified sustainability",
        error as Error,
      );
      return err(
        new InternalError("Failed to update unified sustainability configuration", { error }),
      );
    }
  }

  // Batch
  async getBatch(): Promise<Result<Record<string, unknown>, AppError>> {
    try {
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

      return ok({
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
      });
    } catch (error) {
      logger.error("[SustainabilityService] Failed to fetch batch", error as Error);
      return err(new InternalError("Failed to fetch sustainability batch content", { error }));
    }
  }
}

export const sustainabilityService = new SustainabilityService();
