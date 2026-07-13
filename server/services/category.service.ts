import { type Category, categoryReorderSchema, insertCategorySchema } from "@run-remix/shared";
import { type Result, ResultAsync } from "neverthrow";
import { db } from "../db.js";
import { CacheOperations } from "../lib/cache/cache-strategies.js";
import { AppError, BadRequestError, InternalError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { withTimeout } from "../lib/resilience/request-timeout.js";
import { sanitizeHtml } from "../lib/sanitize-html.js";
import { removeUndefined, validateAndSanitizeInput } from "../lib/utilities/core-utils.js";
import { productRepository } from "./repositories/index.js";
import { webhookService } from "./webhook-service.js";

class CategoryService {
  /**
   * List all categories with optional pagination.
   */
  async getCategories(
    page?: number,
    limit?: number,
  ): Promise<
    Result<
      | Category[]
      | {
          data: Category[];
          pagination: { page: number; limit: number; total: number; pages: number };
        },
      AppError
    >
  > {
    return ResultAsync.fromPromise(
      (async (): Promise<
        | Category[]
        | {
            data: Category[];
            pagination: { page: number; limit: number; total: number; pages: number };
          }
      > => {
        if (page || limit) {
          const pageNum = page || 1;
          const pageSize = Math.min(limit || 50, 100);
          const offset = (pageNum - 1) * pageSize;

          const categories = await withCircuit(
            "get-categories-paginated",
            () => productRepository.getCategories(pageSize, offset),
            DB_CIRCUIT_OPTIONS,
          );
          const totalCount = await withCircuit(
            "get-categories-count",
            () => productRepository.getCategoriesCount(),
            DB_CIRCUIT_OPTIONS,
          );

          return {
            data: categories,
            pagination: {
              page: pageNum,
              limit: pageSize,
              total: totalCount,
              pages: Math.ceil(totalCount / pageSize),
            },
          };
        }

        const categories = await withCircuit(
          "get-categories-all",
          () => productRepository.getCategories(),
          DB_CIRCUIT_OPTIONS,
        );
        return categories;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[CategoryService] Failed to list categories", undefined, error as Error);
        return new InternalError("Failed to list categories", { error });
      },
    );
  }

  /**
   * Bulk reorder categories.
   */
  async reorderCategories(data: unknown): Promise<Result<{ updated: number }, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<{ updated: number }> => {
        const validatedData = categoryReorderSchema.parse(data);
        const startTime = Date.now();

        const results = await withTimeout(
          db.transaction(async () => {
            const updateResults = [];

            for (const categoryData of removeUndefined(validatedData).categories) {
              const existingCategory = await withCircuit(
                "get-category-reorder",
                () => productRepository.getCategory(categoryData.id),
                DB_CIRCUIT_OPTIONS,
              );
              if (existingCategory) {
                const updatedCategory = {
                  ...existingCategory,
                  isActive: existingCategory.isActive ?? undefined,
                  description: existingCategory.description ?? undefined,
                  gridPosition: existingCategory.gridPosition ?? undefined,
                  featuredOnHomepage: existingCategory.featuredOnHomepage ?? undefined,
                  featuredContent: existingCategory.featuredContent
                    ? (existingCategory.featuredContent as Record<string, unknown>)
                    : undefined,
                  level: existingCategory.level ?? undefined,
                  parentId: existingCategory.parentId ?? undefined,
                  sortOrder: categoryData.sortOrder,
                  ...(categoryData.parentId !== undefined && {
                    parentId: categoryData.parentId,
                  }),
                };
                const updated = await withCircuit(
                  "update-category-reorder",
                  () =>
                    productRepository.updateCategory(
                      categoryData.id,
                      updatedCategory as Record<string, unknown>,
                    ),
                  DB_CIRCUIT_OPTIONS,
                );
                updateResults.push(updated);
              }
            }
            return updateResults;
          }),
          15000,
          "Bulk reorder categories transaction",
        );

        const successCount = results.length;
        const duration = Date.now() - startTime;

        logger.debug(
          `[CategoryService] Bulk category reorder completed in ${duration}ms (${successCount} categories)`,
        );

        const updated = successCount;
        CacheOperations.invalidateCategories().catch((cacheError) =>
          logger.warn("[CACHE] Failed to invalidate category cache after reorder:", cacheError),
        );
        webhookService.trigger("category.reordered", { count: updated });

        return { updated };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[CategoryService] Failed to reorder categories", undefined, error as Error);
        return new InternalError("Failed to reorder categories", { error });
      },
    );
  }

  /**
   * Get category by ID.
   */
  async getCategoryById(id: number): Promise<Result<Category, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Category> => {
        const category = await withCircuit(
          "get-category-by-id",
          () => productRepository.getCategory(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!category) {
          throw new NotFoundError(`Category with ID ${id}`);
        }
        return category;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[CategoryService] Failed to fetch category", { id }, error as Error);
        return new InternalError("Failed to fetch category", { id, error });
      },
    );
  }

  /**
   * Get category by slug.
   */
  async getCategoryBySlug(slug: string): Promise<Result<Category, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Category> => {
        const category = await withCircuit(
          "get-category-by-slug",
          () => productRepository.getCategoryBySlug(slug),
          DB_CIRCUIT_OPTIONS,
        );
        if (!category) {
          throw new NotFoundError(`Category with slug ${slug}`);
        }
        return category;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[CategoryService] Failed to fetch category by slug",
          { slug },
          error as Error,
        );
        return new InternalError("Failed to fetch category by slug", { slug, error });
      },
    );
  }

  /**
   * Create a new category with validation and sort order logic.
   */
  async createCategory(data: unknown): Promise<Result<Category, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Category> => {
        const validatedData = insertCategorySchema.parse(data);
        if (validatedData.name)
          validatedData.name = validateAndSanitizeInput(validatedData.name) as string;
        if (validatedData.slug)
          validatedData.slug = validateAndSanitizeInput(validatedData.slug) as string;
        if (validatedData.description)
          validatedData.description = sanitizeHtml(validatedData.description);

        const allCategories = await withCircuit(
          "get-categories-validation",
          () => productRepository.getCategories(),
          DB_CIRCUIT_OPTIONS,
        );

        const cleanedData = removeUndefined(validatedData);

        // Grid position validation
        if (cleanedData.featuredOnHomepage && cleanedData.gridPosition) {
          const existingCategory = allCategories.find(
            (c) => c.featuredOnHomepage && c.gridPosition === cleanedData.gridPosition,
          );
          if (existingCategory) {
            throw new BadRequestError(
              `Grid position ${cleanedData.gridPosition} is already taken by category "${existingCategory.name}".`,
            );
          }
        }

        // Auto-assign sort order if missing
        if (!cleanedData.sortOrder) {
          const maxSortOrder = allCategories.reduce(
            (max, cat) => Math.max(max, cat.sortOrder || 0),
            0,
          );
          cleanedData.sortOrder = maxSortOrder + 10;
        }

        const category = await withCircuit(
          "create-category",
          () => productRepository.createCategory(cleanedData),
          DB_CIRCUIT_OPTIONS,
        );
        return category;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[CategoryService] Failed to create category", undefined, error as Error);
        if (error instanceof AppError) return error;
        return new InternalError("Failed to create category", { error });
      },
    );
  }

  /**
   * Update category with circular reference check.
   */
  async updateCategory(id: number, data: unknown): Promise<Result<Category, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Category> => {
        const validatedData = insertCategorySchema.partial().parse(data);
        if (validatedData.description)
          validatedData.description = sanitizeHtml(validatedData.description);
        const cleanedData = removeUndefined(validatedData);

        const allCategories = await withCircuit(
          "get-categories-validation",
          () => productRepository.getCategories(),
          DB_CIRCUIT_OPTIONS,
        );

        // Circular reference check
        if (cleanedData.parentId) {
          const isCircular = (categoryId: number, parentId: number): boolean => {
            if (categoryId === parentId) return true;
            const parent = allCategories.find((c) => c.id === parentId);
            if (!parent?.parentId) return false;
            return isCircular(categoryId, parent.parentId);
          };

          if (isCircular(id, cleanedData.parentId as number)) {
            throw new BadRequestError("Circular reference detected");
          }
        }

        const category = await withCircuit(
          "update-category",
          () => productRepository.updateCategory(id, cleanedData),
          DB_CIRCUIT_OPTIONS,
        );
        if (!category) {
          throw new NotFoundError(`Category with ID ${id}`);
        }

        CacheOperations.invalidateCategories(id).catch((cacheError) =>
          logger.warn("[CACHE] Failed to invalidate category cache:", cacheError),
        );
        webhookService.trigger("category.updated", category);

        return category;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[CategoryService] Failed to update category", { id }, error as Error);
        if (error instanceof AppError) return error;
        return new InternalError("Failed to update category", { id, error });
      },
    );
  }

  /**
   * Delete category.
   */
  async deleteCategory(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const deleted = await withCircuit(
          "delete-category",
          () => productRepository.deleteCategory(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!deleted) {
          throw new NotFoundError(`Category with ID ${id}`);
        }

        CacheOperations.invalidateCategories(id).catch((cacheError) =>
          logger.warn("[CACHE] Failed to invalidate category cache:", cacheError),
        );
        webhookService.trigger("category.deleted", { id });

        return true;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[CategoryService] Failed to delete category", { id }, error as Error);
        return new InternalError("Failed to delete category", { id, error });
      },
    );
  }

  /**
   * Restore deleted category.
   */
  async restoreCategory(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const restored = await withCircuit(
          "restore-category",
          () => productRepository.restoreCategory(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!restored) {
          throw new NotFoundError(`Category with ID ${id}`);
        }

        CacheOperations.invalidateCategories(id).catch((cacheError) =>
          logger.warn("[CACHE] Failed to invalidate category cache:", cacheError),
        );
        webhookService.trigger("category.restored", { id });

        return true;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[CategoryService] Failed to restore category", { id }, error as Error);
        return new InternalError("Failed to restore category", { id, error });
      },
    );
  }

  /**
   * Permanently delete category.
   */
  async hardDeleteCategory(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const hardDeleted = await withCircuit(
          "hard-delete-category",
          () => productRepository.permanentlyDeleteCategory(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!hardDeleted) {
          throw new NotFoundError(`Category with ID ${id}`);
        }

        CacheOperations.invalidateCategories(id).catch((cacheError) =>
          logger.warn("[CACHE] Failed to invalidate category cache:", cacheError),
        );
        webhookService.trigger("category.deleted", { id, permanent: true });

        return true;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[CategoryService] Failed to hard delete category", { id }, error as Error);
        return new InternalError("Failed to hard delete category", { id, error });
      },
    );
  }
}

export const categoryService = new CategoryService();
