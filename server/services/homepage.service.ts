import type {
  HomepageFeaturedProductsSettings,
  HomepageHero,
  HomepageProcessCard,
  HomepageSection,
  HomepageSlogan,
  InsertHomepageFeaturedProductsSettings,
  InsertHomepageHero,
  InsertHomepageProcessCard,
  InsertHomepageSection,
  InsertHomepageSlogan,
  InsertLogoAnimationSettings,
  LogoAnimationSettings,
} from "@run-remix/shared";
import {
  insertHomepageFeaturedProductsSettingsSchema,
  insertHomepageHeroSchema,
  insertHomepageProcessCardSchema,
  insertHomepageSectionSchema,
  insertHomepageSloganSchema,
} from "@run-remix/shared";
import { type Result, ResultAsync } from "neverthrow";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { AppError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { sanitizeHtml } from "../lib/sanitize-html.js";
import { homepageRepository } from "./repositories/index.js";

/**
 * Service for managing Homepage domain content
 * Enforces Result-based patterns and circuit breaker protection
 */
class HomepageService {
  /**
   * Invalidates all homepage related cache entries
   */
  private async invalidateCache(): Promise<void> {
    try {
      await CacheOperations.invalidateHomepage();
    } catch (error) {
      logger.error("[HomepageService] Cache invalidation failed", error as Error);
    }
  }

  // Hero
  async getHero(_bypassCache = false): Promise<Result<HomepageHero, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageHero> => {
        const hero = await withCircuit(
          "get-homepage-hero",
          () => homepageRepository.getHomepageHero(),
          DB_CIRCUIT_OPTIONS,
        );

        if (!hero) {
          throw new NotFoundError("Homepage hero configuration");
        }

        return hero;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to fetch hero", error as Error);
        return new InternalError("Failed to fetch homepage hero configuration", { error });
      },
    );
  }

  async updateHero(data: Partial<InsertHomepageHero>): Promise<Result<HomepageHero, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageHero> => {
        const updated = await withCircuit(
          "update-homepage-hero",
          () =>
            homepageRepository.updateHomepageHero(
              (() => {
                const parsed = insertHomepageHeroSchema.partial().parse(data);
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
        logger.error("[HomepageService] Failed to update hero", error as Error);
        return new InternalError("Failed to update homepage hero configuration", { error });
      },
    );
  }

  // Slogans
  async getSlogans(): Promise<Result<HomepageSlogan[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageSlogan[]> => {
        const slogans = await withCircuit(
          "get-homepage-slogans",
          () => homepageRepository.getHomepageSlogans(),
          DB_CIRCUIT_OPTIONS,
        );
        return slogans;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to fetch slogans", error as Error);
        return new InternalError("Failed to fetch homepage slogans", { error });
      },
    );
  }

  async getSlogan(id: number): Promise<Result<HomepageSlogan, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageSlogan> => {
        const slogan = await withCircuit(
          `get-homepage-slogan-${id}`,
          () => homepageRepository.getHomepageSlogan(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!slogan) {
          throw new NotFoundError(`Homepage slogan with ID ${id}`);
        }

        return slogan;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to fetch slogan", { id }, error as Error);
        return new InternalError(`Failed to fetch homepage slogan ${id}`, { error });
      },
    );
  }

  async createSlogan(data: InsertHomepageSlogan): Promise<Result<HomepageSlogan, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageSlogan> => {
        const created = await withCircuit(
          "create-homepage-slogan",
          () =>
            homepageRepository.createHomepageSlogan(
              (() => {
                const parsed = insertHomepageSloganSchema.parse(data);
                if (parsed.text) parsed.text = sanitizeHtml(parsed.text);
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
        logger.error("[HomepageService] Failed to create slogan", error as Error);
        return new InternalError("Failed to create homepage slogan", { error });
      },
    );
  }

  async updateSlogan(
    id: number,
    data: Partial<InsertHomepageSlogan>,
  ): Promise<Result<HomepageSlogan, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageSlogan> => {
        const updated = await withCircuit(
          `update-homepage-slogan-${id}`,
          () =>
            homepageRepository.updateHomepageSlogan(
              id,
              (() => {
                const parsed = insertHomepageSloganSchema.partial().parse(data);
                if (parsed.text) parsed.text = sanitizeHtml(parsed.text);
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
        logger.error("[HomepageService] Failed to update slogan", { id }, error as Error);
        return new InternalError(`Failed to update homepage slogan ${id}`, { error });
      },
    );
  }

  async deleteSlogan(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const deleted = await withCircuit(
          `delete-homepage-slogan-${id}`,
          () => homepageRepository.deleteHomepageSlogan(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!deleted) {
          throw new NotFoundError(`Homepage slogan with ID ${id}`);
        }

        await this.invalidateCache();
        return deleted;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to delete slogan", { id }, error as Error);
        return new InternalError(`Failed to delete homepage slogan ${id}`, { error });
      },
    );
  }

  async reorderSlogans(orderedIds: number[]): Promise<Result<void, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<void> => {
        await withCircuit(
          "reorder-homepage-slogans",
          () => homepageRepository.reorderHomepageSlogans(orderedIds),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return undefined;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to reorder slogans", error as Error);
        return new InternalError("Failed to reorder homepage slogans", { error });
      },
    );
  }

  // Process Cards
  async getProcessCards(includeInactive = false): Promise<Result<HomepageProcessCard[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageProcessCard[]> => {
        const cards = await withCircuit(
          "get-homepage-process-cards",
          () => homepageRepository.getHomepageProcessCards(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );
        return cards;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to fetch process cards", error as Error);
        return new InternalError("Failed to fetch homepage process cards", { error });
      },
    );
  }

  async getProcessCard(id: number): Promise<Result<HomepageProcessCard, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageProcessCard> => {
        const card = await withCircuit(
          `get-homepage-process-card-${id}`,
          () => homepageRepository.getHomepageProcessCard(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!card) {
          throw new NotFoundError(`Homepage process card with ID ${id}`);
        }

        return card;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to fetch process card", { id }, error as Error);
        return new InternalError(`Failed to fetch homepage process card ${id}`, { error });
      },
    );
  }

  async createProcessCard(
    data: InsertHomepageProcessCard,
  ): Promise<Result<HomepageProcessCard, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageProcessCard> => {
        const created = await withCircuit(
          "create-homepage-process-card",
          () =>
            homepageRepository.createHomepageProcessCard(
              (() => {
                const parsed = insertHomepageProcessCardSchema.parse(data);
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
        logger.error("[HomepageService] Failed to create process card", error as Error);
        return new InternalError("Failed to create homepage process card", { error });
      },
    );
  }

  async updateProcessCard(
    id: number,
    data: Partial<InsertHomepageProcessCard>,
  ): Promise<Result<HomepageProcessCard, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageProcessCard> => {
        const updated = await withCircuit(
          `update-homepage-process-card-${id}`,
          () =>
            homepageRepository.updateHomepageProcessCard(
              id,
              (() => {
                const parsed = insertHomepageProcessCardSchema.partial().parse(data);
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
        logger.error("[HomepageService] Failed to update process card", { id }, error as Error);
        return new InternalError(`Failed to update homepage process card ${id}`, { error });
      },
    );
  }

  async deleteProcessCard(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const deleted = await withCircuit(
          `delete-homepage-process-card-${id}`,
          () => homepageRepository.deleteHomepageProcessCard(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!deleted) {
          throw new NotFoundError(`Homepage process card with ID ${id}`);
        }

        await this.invalidateCache();
        return deleted;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to delete process card", { id }, error as Error);
        return new InternalError(`Failed to delete homepage process card ${id}`, { error });
      },
    );
  }

  async reorderProcessCards(orderedIds: number[]): Promise<Result<void, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<void> => {
        await withCircuit(
          "reorder-homepage-process-cards",
          () => homepageRepository.reorderHomepageProcessCards(orderedIds),
          DB_CIRCUIT_OPTIONS,
        );

        await this.invalidateCache();
        return undefined;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to reorder process cards", error as Error);
        return new InternalError("Failed to reorder homepage process cards", { error });
      },
    );
  }

  // Sections
  async getSections(includeInactive = false): Promise<Result<HomepageSection[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageSection[]> => {
        const sections = await withCircuit(
          "get-homepage-sections",
          () => homepageRepository.getHomepageSections(includeInactive),
          DB_CIRCUIT_OPTIONS,
        );
        return sections;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to fetch sections", error as Error);
        return new InternalError("Failed to fetch homepage sections", { error });
      },
    );
  }

  async getSection(name: string): Promise<Result<HomepageSection, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageSection> => {
        const section = await withCircuit(
          `get-homepage-section-${name}`,
          () => homepageRepository.getHomepageSection(name),
          DB_CIRCUIT_OPTIONS,
        );

        if (!section) {
          throw new NotFoundError(`Homepage section with name ${name}`);
        }

        return section;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to fetch section", { name }, error as Error);
        return new InternalError(`Failed to fetch homepage section ${name}`, { error });
      },
    );
  }

  async getSectionById(id: number): Promise<Result<HomepageSection, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageSection> => {
        const section = await withCircuit(
          `get-homepage-section-id-${id}`,
          () => homepageRepository.getHomepageSectionById(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!section) {
          throw new NotFoundError(`Homepage section with ID ${id}`);
        }

        return section;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to fetch section by ID", { id }, error as Error);
        return new InternalError(`Failed to fetch homepage section ${id}`, { error });
      },
    );
  }

  async updateSection(
    name: string,
    data: Partial<InsertHomepageSection>,
  ): Promise<Result<HomepageSection, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageSection> => {
        const updated = await withCircuit(
          `update-homepage-section-${name}`,
          () =>
            homepageRepository.updateHomepageSection(
              name,
              (() => {
                const parsed = insertHomepageSectionSchema.partial().parse(data);
                if (parsed.content) parsed.content = sanitizeHtml(parsed.content);
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
        logger.error("[HomepageService] Failed to update section", { name }, error as Error);
        return new InternalError(`Failed to update homepage section ${name}`, { error });
      },
    );
  }

  async updateSectionById(
    id: number,
    data: Partial<InsertHomepageSection>,
  ): Promise<Result<HomepageSection, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageSection> => {
        const updated = await withCircuit(
          `update-homepage-section-id-${id}`,
          () => homepageRepository.updateHomepageSectionById(id, data),
          DB_CIRCUIT_OPTIONS,
        );

        if (!updated) {
          throw new NotFoundError(`Homepage section with ID ${id}`);
        }

        await this.invalidateCache();
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to update section by ID", { id }, error as Error);
        return new InternalError(`Failed to update homepage section ${id}`, { error });
      },
    );
  }

  // Featured Products Settings
  async getFeaturedProductsSettings(): Promise<Result<HomepageFeaturedProductsSettings, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageFeaturedProductsSettings> => {
        const settings = await withCircuit(
          "get-homepage-featured-products-settings",
          () => homepageRepository.getHomepageFeaturedProductsSettings(),
          DB_CIRCUIT_OPTIONS,
        );
        return settings;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[HomepageService] Failed to fetch featured products settings",
          error as Error,
        );
        return new InternalError("Failed to fetch homepage featured products settings", { error });
      },
    );
  }

  async updateFeaturedProductsSettings(
    data: Partial<InsertHomepageFeaturedProductsSettings>,
  ): Promise<Result<HomepageFeaturedProductsSettings, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<HomepageFeaturedProductsSettings> => {
        const updated = await withCircuit(
          "update-homepage-featured-products-settings",
          () =>
            homepageRepository.updateHomepageFeaturedProductsSettings(
              (() => {
                const parsed = insertHomepageFeaturedProductsSettingsSchema.partial().parse(data);
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
          "[HomepageService] Failed to update featured products settings",
          error as Error,
        );
        return new InternalError("Failed to update homepage featured products settings", { error });
      },
    );
  }

  // Logo Animation Settings
  async getLogoAnimationSettings(): Promise<Result<LogoAnimationSettings, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<LogoAnimationSettings> => {
        const settings = await withCircuit(
          "get-logo-animation-settings",
          () => homepageRepository.getLogoAnimationSettings(),
          DB_CIRCUIT_OPTIONS,
        );
        if (!settings) throw new NotFoundError("Logo animation settings");
        return settings;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to fetch logo animation settings", error as Error);
        return new InternalError("Failed to fetch logo animation settings", { error });
      },
    );
  }

  async updateLogoAnimationSettings(
    data: Partial<InsertLogoAnimationSettings>,
  ): Promise<Result<LogoAnimationSettings, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<LogoAnimationSettings> => {
        const updated = await withCircuit(
          "update-logo-animation-settings",
          () => homepageRepository.updateLogoAnimationSettings(data),
          DB_CIRCUIT_OPTIONS,
        );
        await this.invalidateCache();
        return updated;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[HomepageService] Failed to update logo animation settings", error as Error);
        return new InternalError("Failed to update logo animation settings", { error });
      },
    );
  }
}

export const homepageService = new HomepageService();
