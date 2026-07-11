import type {
  InsertManufacturingCapability,
  InsertManufacturingCaseStudy,
  InsertManufacturingHero,
  InsertManufacturingProcess,
  InsertManufacturingQuality,
  ManufacturingCapability,
  ManufacturingCaseStudy,
  ManufacturingHero,
  ManufacturingProcess,
  ManufacturingQuality,
} from "@run-remix/shared";
import {
  insertManufacturingCapabilitySchema,
  insertManufacturingCaseStudySchema,
  insertManufacturingHeroSchema,
  insertManufacturingProcessSchema,
  insertManufacturingQualitySchema,
} from "@run-remix/shared";
import { err, ok, type Result } from "neverthrow";
import { twoTierBatchCache } from "../lib/cache/two-tier-batch.js";
import { manufacturingRepository } from "../lib/db/repositories/index.js";
import { type AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { sanitizeHtml } from "../lib/sanitize-html.js";

/**
 * Service for managing Manufacturing domain content
 * Enforces Result-based patterns and circuit breaker protection
 */
class ManufacturingService {
  /**
   * Retrieves all manufacturing processes with tiered caching
   */
  async getProcesses(bypassCache = false): Promise<Result<ManufacturingProcess[], AppError>> {
    try {
      const { data: processes } = await twoTierBatchCache.get(
        "manufacturing:processes",
        () =>
          withCircuit(
            "get-manufacturing-processes",
            () => manufacturingRepository.getManufacturingProcesses(),
            DB_CIRCUIT_OPTIONS,
          ),
        {
          bypassCache,
          swrConfig: {
            staleWhileRevalidate: 60 * 60, // 1 hour stale
            ttl: 12 * 60 * 60, // 12 hours expire
          },
        },
      );

      return ok(processes);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to fetch processes", error as Error);
      return err(new InternalError("Failed to fetch manufacturing processes", { error }));
    }
  }

  /**
   * Retrieves a single manufacturing process by ID
   */
  async getProcess(id: number): Promise<Result<ManufacturingProcess, AppError>> {
    try {
      const process = await withCircuit(
        `get-manufacturing-process-${id}`,
        () => manufacturingRepository.getManufacturingProcess(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!process) {
        return err(new NotFoundError(`Manufacturing process with ID ${id}`));
      }

      return ok(process);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to fetch process", { id }, error as Error);
      return err(new InternalError(`Failed to fetch manufacturing process ${id}`, { error }));
    }
  }

  /**
   * Creates a new manufacturing process
   */
  async createProcess(
    data: InsertManufacturingProcess,
  ): Promise<Result<ManufacturingProcess, AppError>> {
    try {
      const created = await withCircuit(
        "create-manufacturing-process",
        () =>
          manufacturingRepository.createManufacturingProcess(
            (() => {
              const parsed = insertManufacturingProcessSchema.parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      return ok(created);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to create process", error as Error);
      return err(new InternalError("Failed to create manufacturing process", { error }));
    }
  }

  /**
   * Updates an existing manufacturing process
   */
  async updateProcess(
    id: number,
    data: Partial<InsertManufacturingProcess>,
  ): Promise<Result<ManufacturingProcess, AppError>> {
    try {
      const updated = await withCircuit(
        `update-manufacturing-process-${id}`,
        () =>
          manufacturingRepository.updateManufacturingProcess(
            id,
            (() => {
              const parsed = insertManufacturingProcessSchema.partial().parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      return ok(updated);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to update process", { id }, error as Error);
      return err(new InternalError(`Failed to update manufacturing process ${id}`, { error }));
    }
  }

  /**
   * Deletes a manufacturing process
   */
  async deleteProcess(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-manufacturing-process-${id}`,
        () => manufacturingRepository.deleteManufacturingProcess(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!deleted) {
        return err(new NotFoundError(`Manufacturing process with ID ${id}`));
      }

      return ok(deleted);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to delete process", { id }, error as Error);
      return err(new InternalError(`Failed to delete manufacturing process ${id}`, { error }));
    }
  }

  /**
   * Reorders manufacturing processes
   */
  async reorderProcesses(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-manufacturing-processes",
        () => manufacturingRepository.reorderManufacturingProcesses(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );

      return ok(undefined);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to reorder processes", error as Error);
      return err(new InternalError("Failed to reorder manufacturing processes", { error }));
    }
  }

  // Capabilities
  async getCapabilities(
    includeInactive = false,
  ): Promise<Result<ManufacturingCapability[], AppError>> {
    try {
      const capabilities = await withCircuit(
        "get-manufacturing-capabilities",
        () => manufacturingRepository.getManufacturingCapabilities(includeInactive),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(capabilities);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to fetch capabilities", error as Error);
      return err(new InternalError("Failed to fetch manufacturing capabilities", { error }));
    }
  }

  async getCapability(id: number): Promise<Result<ManufacturingCapability, AppError>> {
    try {
      const capability = await withCircuit(
        `get-manufacturing-capability-${id}`,
        () => manufacturingRepository.getManufacturingCapability(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!capability) return err(new NotFoundError(`Manufacturing capability with ID ${id}`));
      return ok(capability);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to fetch capability", { id }, error as Error);
      return err(new InternalError(`Failed to fetch manufacturing capability ${id}`, { error }));
    }
  }

  async createCapability(
    data: InsertManufacturingCapability,
  ): Promise<Result<ManufacturingCapability, AppError>> {
    try {
      const created = await withCircuit(
        "create-manufacturing-capability",
        () =>
          manufacturingRepository.createManufacturingCapability(
            (() => {
              const parsed = insertManufacturingCapabilitySchema.parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(created);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to create capability", error as Error);
      return err(new InternalError("Failed to create manufacturing capability", { error }));
    }
  }

  async updateCapability(
    id: number,
    data: Partial<InsertManufacturingCapability>,
  ): Promise<Result<ManufacturingCapability, AppError>> {
    try {
      const updated = await withCircuit(
        `update-manufacturing-capability-${id}`,
        () =>
          manufacturingRepository.updateManufacturingCapability(
            id,
            (() => {
              const parsed = insertManufacturingCapabilitySchema.partial().parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(updated);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to update capability", { id }, error as Error);
      return err(new InternalError(`Failed to update manufacturing capability ${id}`, { error }));
    }
  }

  async deleteCapability(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-manufacturing-capability-${id}`,
        () => manufacturingRepository.deleteManufacturingCapability(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!deleted) return err(new NotFoundError(`Manufacturing capability with ID ${id}`));
      return ok(deleted);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to delete capability", { id }, error as Error);
      return err(new InternalError(`Failed to delete manufacturing capability ${id}`, { error }));
    }
  }

  async reorderCapabilities(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-manufacturing-capabilities",
        () => manufacturingRepository.reorderManufacturingCapabilities(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(undefined);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to reorder capabilities", error as Error);
      return err(new InternalError("Failed to reorder manufacturing capabilities", { error }));
    }
  }

  // Case Studies
  async getCaseStudies(
    includeInactive = false,
  ): Promise<Result<ManufacturingCaseStudy[], AppError>> {
    try {
      const studies = await withCircuit(
        "get-manufacturing-case-studies",
        () => manufacturingRepository.getManufacturingCaseStudies(includeInactive),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(studies);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to fetch case studies", error as Error);
      return err(new InternalError("Failed to fetch manufacturing case studies", { error }));
    }
  }

  async createCaseStudy(
    data: InsertManufacturingCaseStudy,
  ): Promise<Result<ManufacturingCaseStudy, AppError>> {
    try {
      const created = await withCircuit(
        "create-manufacturing-case-study",
        () =>
          manufacturingRepository.createManufacturingCaseStudy(
            (() => {
              const parsed = insertManufacturingCaseStudySchema.parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(created);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to create case study", error as Error);
      return err(new InternalError("Failed to create manufacturing case study", { error }));
    }
  }

  async updateCaseStudy(
    id: number,
    data: Partial<InsertManufacturingCaseStudy>,
  ): Promise<Result<ManufacturingCaseStudy, AppError>> {
    try {
      const updated = await withCircuit(
        `update-manufacturing-case-study-${id}`,
        () =>
          manufacturingRepository.updateManufacturingCaseStudy(
            id,
            (() => {
              const parsed = insertManufacturingCaseStudySchema.partial().parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(updated);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to update case study", { id }, error as Error);
      return err(new InternalError(`Failed to update manufacturing case study ${id}`, { error }));
    }
  }

  async deleteCaseStudy(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-manufacturing-case-study-${id}`,
        () => manufacturingRepository.deleteManufacturingCaseStudy(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!deleted) return err(new NotFoundError(`Manufacturing case study with ID ${id}`));
      return ok(deleted);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to delete case study", { id }, error as Error);
      return err(new InternalError(`Failed to delete manufacturing case study ${id}`, { error }));
    }
  }

  async getCaseStudy(id: number): Promise<Result<ManufacturingCaseStudy, AppError>> {
    try {
      const study = await withCircuit(
        `get-manufacturing-case-study-${id}`,
        () => manufacturingRepository.getManufacturingCaseStudy(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!study) return err(new NotFoundError(`Manufacturing case study with ID ${id}`));
      return ok(study);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to fetch case study", { id }, error as Error);
      return err(new InternalError(`Failed to fetch manufacturing case study ${id}`, { error }));
    }
  }

  async reorderCaseStudies(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-manufacturing-case-studies",
        () => manufacturingRepository.reorderManufacturingCaseStudies(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(undefined);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to reorder case studies", error as Error);
      return err(new InternalError("Failed to reorder manufacturing case studies", { error }));
    }
  }

  // Hero
  async getHero(): Promise<Result<ManufacturingHero, AppError>> {
    try {
      const hero = await withCircuit(
        "get-manufacturing-hero",
        () => manufacturingRepository.getManufacturingHero(),
        DB_CIRCUIT_OPTIONS,
      );
      if (!hero) return err(new NotFoundError("Manufacturing hero configuration"));
      return ok(hero);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to fetch hero", error as Error);
      return err(new InternalError("Failed to fetch manufacturing hero configuration", { error }));
    }
  }

  async updateHero(
    data: Partial<InsertManufacturingHero>,
  ): Promise<Result<ManufacturingHero, AppError>> {
    try {
      const updated = await withCircuit(
        "update-manufacturing-hero",
        () =>
          manufacturingRepository.updateManufacturingHero(
            (() => {
              const parsed = insertManufacturingHeroSchema.partial().parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(updated);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to update hero", error as Error);
      return err(new InternalError("Failed to update manufacturing hero configuration", { error }));
    }
  }

  // Qualities
  async getQualities(includeInactive = false): Promise<Result<ManufacturingQuality[], AppError>> {
    try {
      const qualities = await withCircuit(
        "get-manufacturing-qualities",
        () => manufacturingRepository.getManufacturingQualities(includeInactive),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(qualities);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to fetch qualities", error as Error);
      return err(new InternalError("Failed to fetch manufacturing qualities", { error }));
    }
  }

  async getQuality(id: number): Promise<Result<ManufacturingQuality, AppError>> {
    try {
      const quality = await withCircuit(
        `get-manufacturing-quality-${id}`,
        () => manufacturingRepository.getManufacturingQuality(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!quality) return err(new NotFoundError(`Manufacturing quality with ID ${id}`));
      return ok(quality);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to fetch quality", { id }, error as Error);
      return err(new InternalError(`Failed to fetch manufacturing quality ${id}`, { error }));
    }
  }

  async createQuality(
    data: InsertManufacturingQuality,
  ): Promise<Result<ManufacturingQuality, AppError>> {
    try {
      const created = await withCircuit(
        "create-manufacturing-quality",
        () =>
          manufacturingRepository.createManufacturingQuality(
            (() => {
              const parsed = insertManufacturingQualitySchema.parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(created);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to create quality", error as Error);
      return err(new InternalError("Failed to create manufacturing quality", { error }));
    }
  }

  async updateQuality(
    id: number,
    data: Partial<InsertManufacturingQuality>,
  ): Promise<Result<ManufacturingQuality, AppError>> {
    try {
      const updated = await withCircuit(
        `update-manufacturing-quality-${id}`,
        () =>
          manufacturingRepository.updateManufacturingQuality(
            id,
            (() => {
              const parsed = insertManufacturingQualitySchema.partial().parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(updated);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to update quality", { id }, error as Error);
      return err(new InternalError(`Failed to update manufacturing quality ${id}`, { error }));
    }
  }

  async deleteQuality(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-manufacturing-quality-${id}`,
        () => manufacturingRepository.deleteManufacturingQuality(id),
        DB_CIRCUIT_OPTIONS,
      );
      if (!deleted) return err(new NotFoundError(`Manufacturing quality with ID ${id}`));
      return ok(deleted);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to delete quality", { id }, error as Error);
      return err(new InternalError(`Failed to delete manufacturing quality ${id}`, { error }));
    }
  }

  async reorderQualities(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-manufacturing-qualities",
        () => manufacturingRepository.reorderManufacturingQualities(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(undefined);
    } catch (error) {
      logger.error("[ManufacturingService] Failed to reorder qualities", error as Error);
      return err(new InternalError("Failed to reorder manufacturing qualities", { error }));
    }
  }
}

export const manufacturingService = new ManufacturingService();
