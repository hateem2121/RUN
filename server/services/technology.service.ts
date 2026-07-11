import { err, ok, type Result } from "neverthrow";
import type {
  InsertTechnologyCta,
  InsertTechnologyEquipment,
  InsertTechnologyGradientSettings,
  InsertTechnologyHero,
  InsertTechnologyInnovation,
  InsertTechnologyResearch,
  InsertTechnologyRoadmap,
  TechnologyCta,
  TechnologyEquipment,
  TechnologyGradientSettings,
  TechnologyHero,
  TechnologyInnovation,
  TechnologyResearch,
  TechnologyRoadmap,
} from "../../shared/index.js";
import {
  insertTechnologyCtaSchema,
  insertTechnologyEquipmentSchema,
  insertTechnologyGradientSettingsSchema,
  insertTechnologyHeroSchema,
  insertTechnologyInnovationSchema,
  insertTechnologyResearchSchema,
  insertTechnologyRoadmapSchema,
} from "../../shared/index.js";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { mediaRepository, technologyRepository } from "../lib/db/repositories/index.js";
import { type AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { sanitizeHtml } from "../lib/sanitize-html.js";
import { extractMediaIds } from "../lib/utilities/media-utils.js";

/**
 * Service for managing Technology domain content
 * Enforces Result-based patterns and circuit breaker protection
 */
class TechnologyService {
  /**
   * Invalidates all technology related cache entries
   */
  private async invalidateCache(): Promise<void> {
    try {
      await CacheOperations.invalidateTechnology();
    } catch (error) {
      logger.error("[TechnologyService] Cache invalidation failed", error as Error);
    }
  }

  // Hero
  async getHero(): Promise<Result<TechnologyHero, AppError>> {
    try {
      const hero = await withCircuit(
        "get-technology-hero",
        () => technologyRepository.getTechnologyHero(),
        DB_CIRCUIT_OPTIONS,
      );

      if (!hero) {
        return err(new NotFoundError("Technology hero configuration"));
      }

      return ok(hero);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch hero", error as Error);
      return err(new InternalError("Failed to fetch technology hero configuration", { error }));
    }
  }

  async updateHero(data: Partial<InsertTechnologyHero>): Promise<Result<TechnologyHero, AppError>> {
    try {
      const updated = await withCircuit(
        "update-technology-hero",
        () =>
          technologyRepository.updateTechnologyHero(
            (() => {
              const parsed = insertTechnologyHeroSchema.partial().parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[TechnologyService] Failed to update hero", error as Error);
      return err(new InternalError("Failed to update technology hero configuration", { error }));
    }
  }

  // CTA
  async getCta(): Promise<Result<TechnologyCta, AppError>> {
    try {
      const cta = await withCircuit(
        "get-technology-cta",
        () => technologyRepository.getTechnologyCta(),
        DB_CIRCUIT_OPTIONS,
      );

      if (!cta) {
        return err(new NotFoundError("Technology CTA configuration"));
      }

      return ok(cta);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch CTA", error as Error);
      return err(new InternalError("Failed to fetch technology CTA configuration", { error }));
    }
  }

  async createCta(data: InsertTechnologyCta): Promise<Result<TechnologyCta, AppError>> {
    try {
      const created = await withCircuit(
        "create-technology-cta",
        () =>
          technologyRepository.createTechnologyCta(
            (() => {
              const parsed = insertTechnologyCtaSchema.parse(data);
              if (parsed.content) parsed.content = sanitizeHtml(parsed.content);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(created);
    } catch (error) {
      logger.error("[TechnologyService] Failed to create CTA", error as Error);
      return err(new InternalError("Failed to create technology CTA configuration", { error }));
    }
  }

  async updateCta(data: Partial<InsertTechnologyCta>): Promise<Result<TechnologyCta, AppError>> {
    try {
      const updated = await withCircuit(
        "update-technology-cta",
        () =>
          technologyRepository.updateTechnologyCta(
            (() => {
              const parsed = insertTechnologyCtaSchema.partial().parse(data);
              if (parsed.content) parsed.content = sanitizeHtml(parsed.content);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[TechnologyService] Failed to update CTA", error as Error);
      return err(new InternalError("Failed to update technology CTA configuration", { error }));
    }
  }

  async deleteCta(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-technology-cta-${id}`,
        () => technologyRepository.deleteTechnologyCta(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!deleted) {
        return err(new NotFoundError(`Technology CTA with ID ${id}`));
      }

      await this.invalidateCache();
      return ok(deleted);
    } catch (error) {
      logger.error("[TechnologyService] Failed to delete CTA", { id }, error as Error);
      return err(new InternalError(`Failed to delete technology CTA ${id}`, { error }));
    }
  }

  // Equipment
  async getEquipment(): Promise<Result<TechnologyEquipment[], AppError>> {
    try {
      const equipment = await withCircuit(
        "get-technology-equipment",
        () => technologyRepository.getTechnologyEquipment(),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(equipment);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch equipment", error as Error);
      return err(new InternalError("Failed to fetch technology equipment", { error }));
    }
  }

  async getEquipmentItem(id: number): Promise<Result<TechnologyEquipment, AppError>> {
    try {
      const item = await withCircuit(
        `get-technology-equipment-${id}`,
        () => technologyRepository.getTechnologyEquipmentItem(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!item) {
        return err(new NotFoundError(`Technology equipment item with ID ${id}`));
      }

      return ok(item);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch equipment item", { id }, error as Error);
      return err(new InternalError(`Failed to fetch technology equipment item ${id}`, { error }));
    }
  }

  async createEquipment(
    data: InsertTechnologyEquipment,
  ): Promise<Result<TechnologyEquipment, AppError>> {
    try {
      const created = await withCircuit(
        "create-technology-equipment",
        () =>
          technologyRepository.createTechnologyEquipment(
            (() => {
              const parsed = insertTechnologyEquipmentSchema.parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(created);
    } catch (error) {
      logger.error("[TechnologyService] Failed to create equipment", error as Error);
      return err(new InternalError("Failed to create technology equipment", { error }));
    }
  }

  async updateEquipment(
    id: number,
    data: Partial<InsertTechnologyEquipment>,
  ): Promise<Result<TechnologyEquipment, AppError>> {
    try {
      const updated = await withCircuit(
        `update-technology-equipment-${id}`,
        () =>
          technologyRepository.updateTechnologyEquipment(
            id,
            (() => {
              const parsed = insertTechnologyEquipmentSchema.partial().parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[TechnologyService] Failed to update equipment", { id }, error as Error);
      return err(new InternalError(`Failed to update technology equipment ${id}`, { error }));
    }
  }

  async deleteEquipment(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-technology-equipment-${id}`,
        () => technologyRepository.deleteTechnologyEquipment(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!deleted) {
        return err(new NotFoundError(`Technology equipment item with ID ${id}`));
      }

      await this.invalidateCache();
      return ok(deleted);
    } catch (error) {
      logger.error("[TechnologyService] Failed to delete equipment", { id }, error as Error);
      return err(new InternalError(`Failed to delete technology equipment ${id}`, { error }));
    }
  }

  async reorderEquipment(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-technology-equipment",
        () => technologyRepository.reorderTechnologyEquipment(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(undefined);
    } catch (error) {
      logger.error("[TechnologyService] Failed to reorder equipment", error as Error);
      return err(new InternalError("Failed to reorder technology equipment", { error }));
    }
  }

  // Innovations
  async getInnovations(includeInactive = false): Promise<Result<TechnologyInnovation[], AppError>> {
    try {
      const innovations = await withCircuit(
        "get-technology-innovations",
        () => technologyRepository.getTechnologyInnovations(includeInactive),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(innovations);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch innovations", error as Error);
      return err(new InternalError("Failed to fetch technology innovations", { error }));
    }
  }

  async getInnovation(id: number): Promise<Result<TechnologyInnovation, AppError>> {
    try {
      const innovation = await withCircuit(
        `get-technology-innovation-${id}`,
        () => technologyRepository.getTechnologyInnovation(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!innovation) {
        return err(new NotFoundError(`Technology innovation with ID ${id}`));
      }

      return ok(innovation);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch innovation", { id }, error as Error);
      return err(new InternalError(`Failed to fetch technology innovation ${id}`, { error }));
    }
  }

  async createInnovation(
    data: InsertTechnologyInnovation,
  ): Promise<Result<TechnologyInnovation, AppError>> {
    try {
      const created = await withCircuit(
        "create-technology-innovation",
        () =>
          technologyRepository.createTechnologyInnovation(
            (() => {
              const parsed = insertTechnologyInnovationSchema.parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(created);
    } catch (error) {
      logger.error("[TechnologyService] Failed to create innovation", error as Error);
      return err(new InternalError("Failed to create technology innovation", { error }));
    }
  }

  async updateInnovation(
    id: number,
    data: Partial<InsertTechnologyInnovation>,
  ): Promise<Result<TechnologyInnovation, AppError>> {
    try {
      const updated = await withCircuit(
        `update-technology-innovation-${id}`,
        () =>
          technologyRepository.updateTechnologyInnovation(
            id,
            (() => {
              const parsed = insertTechnologyInnovationSchema.partial().parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[TechnologyService] Failed to update innovation", { id }, error as Error);
      return err(new InternalError(`Failed to update technology innovation ${id}`, { error }));
    }
  }

  async deleteInnovation(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-technology-innovation-${id}`,
        () => technologyRepository.deleteTechnologyInnovation(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!deleted) {
        return err(new NotFoundError(`Technology innovation with ID ${id}`));
      }

      await this.invalidateCache();
      return ok(deleted);
    } catch (error) {
      logger.error("[TechnologyService] Failed to delete innovation", { id }, error as Error);
      return err(new InternalError(`Failed to delete technology innovation ${id}`, { error }));
    }
  }

  async reorderInnovations(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-technology-innovations",
        () => technologyRepository.reorderTechnologyInnovations(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(undefined);
    } catch (error) {
      logger.error("[TechnologyService] Failed to reorder innovations", error as Error);
      return err(new InternalError("Failed to reorder technology innovations", { error }));
    }
  }

  // Research
  async getResearch(includeInactive = false): Promise<Result<TechnologyResearch[], AppError>> {
    try {
      const research = await withCircuit(
        "get-technology-research",
        () => technologyRepository.getTechnologyResearch(includeInactive),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(research);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch research", error as Error);
      return err(new InternalError("Failed to fetch technology research items", { error }));
    }
  }

  async getResearchItem(id: number): Promise<Result<TechnologyResearch, AppError>> {
    try {
      const item = await withCircuit(
        `get-technology-research-${id}`,
        () => technologyRepository.getTechnologyResearchItem(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!item) {
        return err(new NotFoundError(`Technology research item with ID ${id}`));
      }

      return ok(item);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch research item", { id }, error as Error);
      return err(new InternalError(`Failed to fetch technology research item ${id}`, { error }));
    }
  }

  async createResearch(
    data: InsertTechnologyResearch,
  ): Promise<Result<TechnologyResearch, AppError>> {
    try {
      const created = await withCircuit(
        "create-technology-research",
        () =>
          technologyRepository.createTechnologyResearch(
            (() => {
              const parsed = insertTechnologyResearchSchema.parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(created);
    } catch (error) {
      logger.error("[TechnologyService] Failed to create research", error as Error);
      return err(new InternalError("Failed to create technology research item", { error }));
    }
  }

  async updateResearch(
    id: number,
    data: Partial<InsertTechnologyResearch>,
  ): Promise<Result<TechnologyResearch, AppError>> {
    try {
      const updated = await withCircuit(
        `update-technology-research-${id}`,
        () =>
          technologyRepository.updateTechnologyResearch(
            id,
            (() => {
              const parsed = insertTechnologyResearchSchema.partial().parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[TechnologyService] Failed to update research", { id }, error as Error);
      return err(new InternalError(`Failed to update technology research item ${id}`, { error }));
    }
  }

  async deleteResearch(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-technology-research-${id}`,
        () => technologyRepository.deleteTechnologyResearch(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!deleted) {
        return err(new NotFoundError(`Technology research item with ID ${id}`));
      }

      await this.invalidateCache();
      return ok(deleted);
    } catch (error) {
      logger.error("[TechnologyService] Failed to delete research", { id }, error as Error);
      return err(new InternalError(`Failed to delete technology research item ${id}`, { error }));
    }
  }

  async reorderResearch(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-technology-research",
        () => technologyRepository.reorderTechnologyResearch(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(undefined);
    } catch (error) {
      logger.error("[TechnologyService] Failed to reorder research", error as Error);
      return err(new InternalError("Failed to reorder technology research items", { error }));
    }
  }

  // Roadmap
  async getRoadmap(includeInactive = false): Promise<Result<TechnologyRoadmap[], AppError>> {
    try {
      const roadmap = await withCircuit(
        "get-technology-roadmap",
        () => technologyRepository.getTechnologyRoadmap(includeInactive),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(roadmap);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch roadmap", error as Error);
      return err(new InternalError("Failed to fetch technology roadmap", { error }));
    }
  }

  async getRoadmapItem(id: number): Promise<Result<TechnologyRoadmap, AppError>> {
    try {
      const item = await withCircuit(
        `get-technology-roadmap-${id}`,
        () => technologyRepository.getTechnologyRoadmapItem(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!item) {
        return err(new NotFoundError(`Technology roadmap item with ID ${id}`));
      }

      return ok(item);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch roadmap item", { id }, error as Error);
      return err(new InternalError(`Failed to fetch technology roadmap item ${id}`, { error }));
    }
  }

  async createRoadmapItem(
    data: InsertTechnologyRoadmap,
  ): Promise<Result<TechnologyRoadmap, AppError>> {
    try {
      const created = await withCircuit(
        "create-technology-roadmap",
        () =>
          technologyRepository.createTechnologyRoadmap(
            (() => {
              const parsed = insertTechnologyRoadmapSchema.parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(created);
    } catch (error) {
      logger.error("[TechnologyService] Failed to create roadmap", error as Error);
      return err(new InternalError("Failed to create technology roadmap item", { error }));
    }
  }

  async updateRoadmapItem(
    id: number,
    data: Partial<InsertTechnologyRoadmap>,
  ): Promise<Result<TechnologyRoadmap, AppError>> {
    try {
      const updated = await withCircuit(
        `update-technology-roadmap-${id}`,
        () =>
          technologyRepository.updateTechnologyRoadmap(
            id,
            (() => {
              const parsed = insertTechnologyRoadmapSchema.partial().parse(data);
              if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[TechnologyService] Failed to update roadmap", { id }, error as Error);
      return err(new InternalError(`Failed to update technology roadmap item ${id}`, { error }));
    }
  }

  async deleteRoadmapItem(id: number): Promise<Result<boolean, AppError>> {
    try {
      const deleted = await withCircuit(
        `delete-technology-roadmap-${id}`,
        () => technologyRepository.deleteTechnologyRoadmap(id),
        DB_CIRCUIT_OPTIONS,
      );

      if (!deleted) {
        return err(new NotFoundError(`Technology roadmap item with ID ${id}`));
      }

      await this.invalidateCache();
      return ok(deleted);
    } catch (error) {
      logger.error("[TechnologyService] Failed to delete roadmap", { id }, error as Error);
      return err(new InternalError(`Failed to delete technology roadmap item ${id}`, { error }));
    }
  }

  async reorderRoadmap(orderedIds: number[]): Promise<Result<void, AppError>> {
    try {
      await withCircuit(
        "reorder-technology-roadmap",
        () => technologyRepository.reorderTechnologyRoadmap(orderedIds),
        DB_CIRCUIT_OPTIONS,
      );

      await this.invalidateCache();
      return ok(undefined);
    } catch (error) {
      logger.error("[TechnologyService] Failed to reorder roadmap", error as Error);
      return err(new InternalError("Failed to reorder technology roadmap", { error }));
    }
  }

  // Gradient Settings
  async getGradientSettings(): Promise<Result<TechnologyGradientSettings, AppError>> {
    try {
      const settings = await withCircuit(
        "get-technology-gradient",
        () => technologyRepository.getTechnologyGradientSettings(),
        DB_CIRCUIT_OPTIONS,
      );
      if (!settings) return err(new NotFoundError("Technology gradient settings"));
      return ok(settings);
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch gradient settings", error as Error);
      return err(new InternalError("Failed to fetch technology gradient settings", { error }));
    }
  }

  async updateGradientSettings(
    data: Partial<InsertTechnologyGradientSettings>,
  ): Promise<Result<TechnologyGradientSettings, AppError>> {
    try {
      const updated = await withCircuit(
        "update-technology-gradient",
        () =>
          technologyRepository.updateTechnologyGradientSettings(
            (() => {
              const parsed = insertTechnologyGradientSettingsSchema.partial().parse(data);
              return parsed as typeof data;
            })(),
          ),
        DB_CIRCUIT_OPTIONS,
      );
      await this.invalidateCache();
      return ok(updated);
    } catch (error) {
      logger.error("[TechnologyService] Failed to update gradient settings", error as Error);
      return err(new InternalError("Failed to update technology gradient settings", { error }));
    }
  }

  /**
   * Transforms flat frontend gradient data to DB nested structure
   */
  transformFrontendGradient(
    data: Record<string, unknown>,
  ): Partial<InsertTechnologyGradientSettings> {
    return {
      gradientType: "linear",
      colors: data.gradientColors as string[],
      direction: ((data.angle as number) ?? 0).toString(),
      opacity: ((data.spotlightOpacity as number) ?? 1).toString(),
      settings: data,
      isActive: data.isActive as boolean,
    };
  }

  // Batch
  async getBatch(): Promise<Result<Record<string, unknown>, AppError>> {
    try {
      // Fetch all technology data in parallel using circuit breaker
      const [hero, innovations, equipment, research, roadmap, cta, gradientSettings] =
        await withCircuit(
          "get-technology-batch-db",
          () =>
            Promise.all([
              technologyRepository.getTechnologyHero(),
              technologyRepository.getTechnologyInnovations(),
              technologyRepository.getTechnologyEquipment(),
              technologyRepository.getTechnologyResearch(),
              technologyRepository.getTechnologyRoadmap(),
              technologyRepository.getTechnologyCta(),
              technologyRepository.getTechnologyGradientSettings(),
            ]),
          DB_CIRCUIT_OPTIONS,
        );

      // Collect and fetch specific media assets
      const dataToScan = [hero, innovations, equipment, research, roadmap, cta, gradientSettings];
      const mediaIds = extractMediaIds(dataToScan);

      const mediaAssets =
        mediaIds.size > 0
          ? await withCircuit(
              "get-technology-batch-media",
              () =>
                mediaRepository.getMediaAssetsByIds(
                  Array.from(mediaIds).map((id) => id.toString()),
                ),
              DB_CIRCUIT_OPTIONS,
            )
          : [];

      return ok({
        hero: hero || null,
        innovations: innovations || [],
        equipment: equipment || [],
        research: research || [],
        roadmap: roadmap || [],
        cta: cta || null,
        gradientSettings: gradientSettings || null,
        mediaAssets: mediaAssets || [],
        _meta: {
          fetchedAt: new Date().toISOString(),
          mediaAssetsLoaded: mediaAssets.length,
          mediaIdsRequested: Array.from(mediaIds),
        },
      });
    } catch (error) {
      logger.error("[TechnologyService] Failed to fetch batch", error as Error);
      return err(new InternalError("Failed to fetch technology page batch content", { error }));
    }
  }
}

export const technologyService = new TechnologyService();
