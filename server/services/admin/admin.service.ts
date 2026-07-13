/**
 * ADMIN SERVICE
 * Centralizes business logic for administrative operations,
 * data transformations, and system maintenance.
 */

import type {
  AboutTimelineEntry,
  Certificate,
  Fiber,
  InsertAboutTimelineEntry,
  InsertCertificate,
  InsertFiber,
  InsertProduct,
  MediaAsset,
  MediaAssetSummary,
  Product,
  ProductDetail,
} from "@run-remix/shared";
import {
  accessories,
  categories,
  certificates,
  fabrics,
  fibers,
  inquiries,
  insertAboutTimelineEntrySchema,
  insertCertificateSchema,
  insertFiberSchema,
  mediaAssets,
  navigationItems,
  products,
  sizeCharts,
} from "@run-remix/shared";
import { count } from "drizzle-orm";
import { type Result, ResultAsync } from "neverthrow";
import { db } from "../../db.js";
import { encrypt, getBlindIndex } from "../../lib/encryption.js";
import { AppError, InternalError, NotFoundError } from "../../lib/errors.js";
import { getLifecycleScheduler } from "../../lib/integrations/storage-lifecycle-scheduler.js";
import { logger } from "../../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../../lib/resilience/circuit-breaker.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import type { SessionUser } from "../../types/session.js";
import { aboutService } from "../about.service.js";
import {
  mediaRepository,
  miscRepository,
  productRepository,
  systemRepository,
} from "../repositories/index.js";

export interface AuditContext {
  user: SessionUser;
  userAgent: string | undefined;
  ipAddress: string | undefined;
}

/** @public */ export class AdminService {
  private readonly systemRepo: typeof systemRepository;
  private readonly productRepo: typeof productRepository;
  private readonly mediaRepo: typeof mediaRepository;
  private readonly miscRepo: typeof miscRepository;
  private readonly about: typeof aboutService;

  constructor(
    systemRepo = systemRepository,
    productRepo = productRepository,
    mediaRepo = mediaRepository,
    miscRepo = miscRepository,
    about = aboutService,
  ) {
    this.systemRepo = systemRepo;
    this.productRepo = productRepo;
    this.mediaRepo = mediaRepo;
    this.miscRepo = miscRepo;
    this.about = about;
  }

  /**
   * Centralizes audit logging.
   */
  async logAudit(data: {
    action: string;
    tableName: string;
    recordId: string;
    user?: SessionUser | undefined;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
    metadata?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    oldValues?: Record<string, unknown>;
  }) {
    const userEmail = data.user?.claims?.email;
    const encryptedUserEmail = userEmail ? encrypt(userEmail) : undefined;
    const userEmailIndex = userEmail ? getBlindIndex(userEmail) : undefined;
    const encryptedIpAddress = data.ipAddress ? encrypt(data.ipAddress) : undefined;
    // userAgent can be long, but encryption is fine
    const encryptedUserAgent = data.userAgent ? encrypt(data.userAgent) : undefined;

    return this.systemRepo.createAuditLog({
      action: data.action,
      tableName: data.tableName,
      recordId: data.recordId,
      userId: data.user?.claims?.sub,
      userEmail: encryptedUserEmail,
      userEmailIndex: userEmailIndex,
      userAgent: encryptedUserAgent,
      ipAddress: encryptedIpAddress,
      metadata: data.metadata,
      newValues: data.newValues,
      oldValues: data.oldValues,
    });
  }

  /**
   * Fetches and processes initial data for the admin products dashboard.
   * Eliminates the need for complex transformations in the route handler.
   */
  async getInitialProductsData(
    page: number = 1,
    limit: number = 50,
    options: { skipMetadata?: boolean; includeRecentMedia?: boolean } = {},
  ): Promise<
    Result<
      {
        products: unknown[];
        categories: unknown[];
        fabrics: unknown[];
        mediaAssets: unknown[];
        meta: unknown;
      },
      AppError
    >
  > {
    return ResultAsync.fromPromise(
      (async (): Promise<{
        products: unknown[];
        categories: unknown[];
        fabrics: unknown[];
        mediaAssets: unknown[];
        meta: unknown;
      }> => {
        const offset = (page - 1) * limit;

        const metadataPromises = options.skipMetadata
          ? [Promise.resolve([]), Promise.resolve([])]
          : [this.productRepo.getCategories(), this.miscRepo.getFabrics()];

        const [allProducts, totalProductsCount, categories, fabrics] = await withCircuit(
          "fetch-admin-initial-data",
          () =>
            Promise.all([
              this.productRepo.getProductsIncludingDeleted(limit, offset),
              this.productRepo.getProductsCount(),
              ...metadataPromises,
            ]),
          { ...DB_CIRCUIT_OPTIONS, timeout: 15000 },
        );

        const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];

        // Filter for active/undeleted products for the primary list
        const products = safeAllProducts.filter((p: Product) => p.isActive && !p.deletedAt);

        // Calculate referenced media IDs from the PAGINATED products
        const referencedMediaIds = new Set<number>();
        const enhancedProducts = products.map((product: Product) => {
          if (product.primaryImageId) referencedMediaIds.add(product.primaryImageId);
          if (product.primaryVideoId) referencedMediaIds.add(product.primaryVideoId);
          if (product.modelFileId) referencedMediaIds.add(product.modelFileId);

          if (Array.isArray(product.imageIds)) {
            product.imageIds.forEach((id: number | string) => {
              if (typeof id === "number") referencedMediaIds.add(id);
            });
          }

          return {
            ...product,
            urlPath: product.urlPath || product.slug,
            canonicalUrl: product.urlPath
              ? `/categories/${product.urlPath}`
              : `/products/${product.slug}`,
            primaryModelId: product.modelFileId || null,
          };
        });

        // Efficiently fetch ONLY referenced media assets + some recent ones if requested
        const validMediaIds = Array.from(referencedMediaIds).filter((id) => !Number.isNaN(id));
        const mediaIdsStrings = validMediaIds.map((id) => id.toString());

        const [referencedMedia, recentMedia] = await Promise.all([
          mediaIdsStrings.length > 0
            ? this.mediaRepo.getMediaAssetsByIds(mediaIdsStrings)
            : Promise.resolve([]),
          options.includeRecentMedia ? this.mediaRepo.getMediaAssets(50, 0) : Promise.resolve([]),
        ]);

        // Merge and deduplicate media assets
        const mediaMap = new Map<number, MediaAsset>();
        [...referencedMedia, ...recentMedia].forEach((asset) => {
          if (asset && typeof asset.filename === "string" && asset.filename !== "undefined") {
            mediaMap.set(asset.id, asset);
          }
        });

        const allMediaToSend = Array.from(mediaMap.values()).map((asset) => ({
          id: asset.id,
          filename: asset.filename,
          type: asset.type,
          url: asset.url || `/api/media/${asset.id}/content`,
          originalName: asset.originalName,
        }));

        return {
          products: enhancedProducts,
          categories: Array.isArray(categories) ? categories : [],
          fabrics: Array.isArray(fabrics) ? fabrics : [],
          mediaAssets: allMediaToSend,
          meta: {
            totalProducts: totalProductsCount,
            totalCategories: Array.isArray(categories) ? categories.length : 0,
            totalFabrics: Array.isArray(fabrics) ? fabrics.length : 0,
            totalMediaAssets: allMediaToSend.length,
            timestamp: Date.now(),
            page,
            limit,
            totalPages: Math.ceil(totalProductsCount / limit),
          },
        };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error(
          "[AdminService] Failed to fetch initial products data",
          undefined,
          error as Error,
        );
        return new InternalError("Failed to fetch initial products data", { error });
      },
    );
  }

  /**
   * Fetches paginated list of products for the admin panel with filtering
   */
  async getProductsList(options: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: string;
    status?: string;
  }): Promise<
    Result<
      {
        products: unknown[];
        categories: unknown[];
        fabrics: unknown[];
        mediaAssets: unknown[];
        meta: unknown;
      },
      AppError
    >
  > {
    return ResultAsync.fromPromise(
      (async (): Promise<{
        products: unknown[];
        categories: unknown[];
        fabrics: unknown[];
        mediaAssets: unknown[];
        meta: unknown;
      }> => {
        const { page = 1, limit = 50, search, categoryId, status } = options;
        const offset = (page - 1) * limit;

        // We can fetch initially to ensure we get some data and filter in-memory if needed
        // In a fully optimized system, the repo would handle all filtering
        const [allProductsData, totalProductsCount, categories, fabrics, media] = await Promise.all(
          [
            this.productRepo.getProductsIncludingDeleted(limit, offset),
            this.productRepo.getProductsCount(),
            this.productRepo.getCategories(),
            this.miscRepo.getFabrics(),
            this.mediaRepo.getMediaAssets(100, 0), // get recent media
          ],
        );

        const safeAllProducts = Array.isArray(allProductsData) ? allProductsData : [];
        let products = safeAllProducts;

        // Apply in-memory filtering since Drizzle queries might be complex to modify here dynamically without repo access
        if (search) {
          const s = search.toLowerCase();
          products = products.filter(
            (p) =>
              p.name.toLowerCase().includes(s) ||
              p.sku.toLowerCase().includes(s) ||
              p.description?.toLowerCase().includes(s),
          );
        }

        if (categoryId && categoryId !== "all") {
          const catId = parseInt(categoryId, 10);
          products = products.filter((p) => p.categoryId === catId);
        }

        if (status && status !== "all") {
          if (status === "active") {
            products = products.filter((p) => p.isActive && !p.deletedAt);
          } else if (status === "featured") {
            products = products.filter((p) => p.isFeatured && !p.deletedAt);
          } else if (status === "deleted") {
            products = products.filter((p) => !!p.deletedAt);
          } else if (status === "draft") {
            products = products.filter((p) => !p.isActive && !p.deletedAt);
          }
        }

        // Convert media to expected format
        const formattedMedia = (Array.isArray(media) ? media : []).map((asset) => ({
          id: asset.id,
          filename: asset.filename || "",
          type: asset.type || "image",
          url: asset.url || `/api/media/${asset.id}/content`,
          originalName: asset.originalName || "",
        }));

        // Enhance products with extra fields needed by UI
        const enhancedProducts = products.map((product) => ({
          ...product,
          urlPath: product.urlPath || product.slug,
          canonicalUrl: product.urlPath
            ? `/categories/${product.urlPath}`
            : `/products/${product.slug}`,
          primaryModelId: product.modelFileId || null,
        }));

        return {
          products: enhancedProducts,
          categories: Array.isArray(categories) ? categories : [],
          fabrics: Array.isArray(fabrics) ? fabrics : [],
          mediaAssets: formattedMedia,
          meta: {
            page,
            limit,
            totalProducts: products.length < limit ? products.length : totalProductsCount,
            totalPages: Math.ceil(
              (products.length < limit ? products.length : totalProductsCount) / limit,
            ),
            hasMore: offset + products.length < totalProductsCount,
          },
        };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to fetch products list", undefined, error as Error);
        return new InternalError("Failed to fetch products list", { error });
      },
    );
  }

  /**
   * Creates a new product and logs the action
   */
  async createProduct(
    audit: AuditContext,
    data: InsertProduct,
  ): Promise<Result<Product, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Product> => {
        const newProduct = await this.productRepo.createProduct(data);

        // Log the creation
        await this.logAudit({
          action: "INSERT",
          tableName: "products",
          recordId: newProduct.id.toString(),
          user: audit.user,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          newValues: newProduct as Record<string, unknown>,
        });

        return newProduct;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to create product", undefined, error as Error);
        return new InternalError("Failed to create product", { error });
      },
    );
  }

  /**
   * Updates an existing product and logs the action
   */
  async updateProduct(
    audit: AuditContext,
    id: number,
    data: Partial<InsertProduct>,
  ): Promise<Result<Product, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Product> => {
        // Get original for audit log
        const original = await this.productRepo.getProduct(id);
        if (!original) {
          throw new NotFoundError(`Product with ID ${id}`);
        }

        const updatedProduct = await this.productRepo.updateProduct(id, data);

        // Log the update
        await this.logAudit({
          action: "UPDATE",
          tableName: "products",
          recordId: id.toString(),
          user: audit.user,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          oldValues: original as Record<string, unknown>,
          newValues: updatedProduct! as Record<string, unknown>,
        });

        return updatedProduct!;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to update product", { id }, error as Error);
        return new InternalError("Failed to update product", { id, error });
      },
    );
  }

  /**
   * Corrects media URL corruption in category featured content.
   * Optimized to process in parallel chunks and filter before processing.
   */
  async fixCorruptedMedia(
    audit: AuditContext,
    timeoutMs = 30000,
  ): Promise<Result<{ fixedCount: number; fixedCategories: string[] }, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<{ fixedCount: number; fixedCategories: string[] }> => {
        logger.debug("AdminService: Starting cleanup of corrupted media URLs", { timeoutMs });
        // Fetch all categories - this is fast
        const categories = await withCircuit(
          "get-categories-media-fix",
          () => this.productRepo.getCategories(),
          DB_CIRCUIT_OPTIONS,
        );

        let fixedCount = 0;
        const fixedCategories: string[] = [];

        // Filter for categories that actually need updates (in memory optimization)
        const categoriesToUpdate = categories.filter((category) => {
          if (!category.featuredContent) return false;

          const content = category.featuredContent as Record<
            string,
            { mediaUrl?: string } | undefined
          >;
          const cardKeys = ["card1", "card2", "card3", "card4"];

          return cardKeys.some((key) => {
            const card = content[key];
            return (
              card?.mediaUrl &&
              (card.mediaUrl.includes("undefined") ||
                card.mediaUrl === "/api/media/undefined/content")
            );
          });
        });

        if (categoriesToUpdate.length === 0) {
          logger.info("AdminService: No corrupted media URLs found.");
          return { fixedCount: 0, fixedCategories: [] };
        }

        logger.info("AdminService: Found categories with corrupted media. Processing updates...", {
          count: categoriesToUpdate.length,
        });

        // Process updates in parallel with concurrency limit to avoid DB contention
        // Using a simple chunking strategy
        const CHUNK_SIZE = 5;
        for (let i = 0; i < categoriesToUpdate.length; i += CHUNK_SIZE) {
          const chunk = categoriesToUpdate.slice(i, i + CHUNK_SIZE);

          await Promise.all(
            chunk.map(async (category) => {
              const updatedFeaturedContent = { ...category.featuredContent } as Record<
                string,
                { mediaUrl?: string } | undefined
              >;
              let needsUpdate = false;

              // Apply fixes
              for (const cardKey of ["card1", "card2", "card3", "card4"] as const) {
                const card = updatedFeaturedContent[cardKey];
                if (card?.mediaUrl) {
                  const mediaUrl = card.mediaUrl;
                  if (
                    mediaUrl.includes("undefined") ||
                    mediaUrl === "/api/media/undefined/content"
                  ) {
                    card.mediaUrl = "";
                    needsUpdate = true;
                  }
                }
              }

              if (needsUpdate) {
                const updateResult = await withTimeout(
                  this.productRepo.updateCategory(category.id, {
                    featuredContent: updatedFeaturedContent,
                  }),
                  timeoutMs, // Use configurable timeout per update operation
                  `Update category ${category.id}`,
                );

                if (updateResult) {
                  fixedCount++;
                  fixedCategories.push(category.name);
                }
              }
            }),
          );
        }

        const result = {
          fixedCount,
          fixedCategories,
        };

        // SEC-F04: Audit Log
        if (fixedCount > 0) {
          await this.logAudit({
            action: "UPDATE",
            tableName: "categories",
            recordId: "BULK_FIX",
            user: audit.user,
            userAgent: audit.userAgent,
            ipAddress: audit.ipAddress,
            metadata: { operation: "fix-corrupted-media", result },
          });
        }

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to fix corrupted media", undefined, error as Error);
        return new InternalError("Failed to fix corrupted media", { error });
      },
    );
  }

  /**
   * Triggers system storage cleanup.
   */
  async triggerCleanup(
    audit: AuditContext,
    autoClean: boolean,
    timeoutMs = 60000,
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic cleanup report result
  ): Promise<Result<Record<string, unknown>, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Record<string, unknown>> => {
        const scheduler = getLifecycleScheduler();
        // Assuming scheduler runs in background/async, but if we await a report, we should timeout the wait
        // If runCleanup is long, we wrap it.
        const report = await withTimeout(
          scheduler.runCleanup(autoClean === false),
          timeoutMs,
          "Storage cleanup",
        );

        logger.info(`[AdminService] Storage cleanup triggered (autoClean: ${autoClean})`, {
          cleanedFiles: report.cleanedFiles.length,
          orphanedFiles: report.orphanedFiles.length,
          spaceSaved: report.spaceSaved,
        });

        // SEC-F04: Audit Log
        await this.logAudit({
          action: "DELETE",
          tableName: "storage",
          recordId: "CLEANUP",
          user: audit.user,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          metadata: { operation: "cleanup", autoClean, report },
        });

        // biome-ignore lint/suspicious/noExplicitAny: Dynamic cleanup report structure
        return report as unknown as Record<string, any>;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to trigger cleanup", undefined, error as Error);
        return new InternalError("Failed to trigger cleanup", { error });
      },
    );
  }

  /**
   * Updates enterprise audit configuration.
   */
  async updateAuditConfig(
    audit: AuditContext,
    config: { enabled?: boolean | undefined; trackedTables?: string[] | undefined },
  ): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        if (typeof config.enabled === "boolean") {
          this.systemRepo.setAuditTrailEnabled(config.enabled);
        }
        if (Array.isArray(config.trackedTables)) {
          this.systemRepo.configureTrackedTables(config.trackedTables);
        }

        // SEC-F04: Audit Log
        await this.logAudit({
          action: "UPDATE",
          tableName: "audit_configuration",
          recordId: "CONFIG",
          user: audit.user,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          newValues: config,
          metadata: { operation: "update-audit-config" },
        });

        return true;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to update audit config", undefined, error as Error);
        return new InternalError("Failed to update audit config", { error });
      },
    );
  }

  /**
   * Restores a soft-deleted category
   */
  async restoreCategory(audit: AuditContext, id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const result = await withTimeout(
          this.productRepo.restoreCategory(id),
          5000,
          "Restore category",
        );

        if (result) {
          // SEC-F04: Audit Log
          await this.logAudit({
            action: "RESTORE",
            tableName: "categories",
            recordId: id.toString(),
            user: audit.user,
            userAgent: audit.userAgent,
            ipAddress: audit.ipAddress,
          });
        }

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to restore category", { id }, error as Error);
        return new InternalError("Failed to restore category", { id, error });
      },
    );
  }

  /**
   * Restores a soft-deleted product
   */
  async restoreProduct(audit: AuditContext, id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const result = await withCircuit(
          "restore-product",
          () => this.productRepo.restoreProduct(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (result) {
          // SEC-F04: Audit Log
          await this.logAudit({
            action: "RESTORE",
            tableName: "products",
            recordId: id.toString(),
            user: audit.user,
            userAgent: audit.userAgent,
            ipAddress: audit.ipAddress,
          });
        }

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to restore product", { id }, error as Error);
        return new InternalError("Failed to restore product", { id, error });
      },
    );
  }

  /**
   * Restores a soft-deleted media asset
   */
  async restoreMediaAsset(audit: AuditContext, id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const result = await withTimeout(
          this.mediaRepo.restoreMediaAsset(id),
          5000,
          "Restore media asset",
        );

        if (result) {
          // SEC-F04: Audit Log
          await this.logAudit({
            action: "RESTORE",
            tableName: "media_assets",
            recordId: id.toString(),
            user: audit.user,
            userAgent: audit.userAgent,
            ipAddress: audit.ipAddress,
          });
        }

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to restore media asset", { id }, error as Error);
        return new InternalError("Failed to restore media asset", { id, error });
      },
    );
  }

  /**
   * Retrieves aggregated statistics for the Admin CMS Dashboard
   */
  async getDashboardStats(): Promise<Result<Record<string, number>, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Record<string, number>> => {
        const [
          productsCount,
          categoriesCount,
          mediaCount,
          fabricsCount,
          fibersCount,
          certificatesCount,
          sizeChartsCount,
          accessoriesCount,
          navigationItemsCount,
          inquiriesCount,
        ] = await Promise.all([
          db.select({ count: count() }).from(products),
          db.select({ count: count() }).from(categories),
          db.select({ count: count() }).from(mediaAssets),
          db.select({ count: count() }).from(fabrics),
          db.select({ count: count() }).from(fibers),
          db.select({ count: count() }).from(certificates),
          db.select({ count: count() }).from(sizeCharts),
          db.select({ count: count() }).from(accessories),
          db.select({ count: count() }).from(navigationItems),
          db.select({ count: count() }).from(inquiries),
        ]);

        return {
          products: productsCount[0]?.count || 0,
          categories: categoriesCount[0]?.count || 0,
          media: mediaCount[0]?.count || 0,
          fabrics: fabricsCount[0]?.count || 0,
          fibers: fibersCount[0]?.count || 0,
          certificates: certificatesCount[0]?.count || 0,
          sizeCharts: sizeChartsCount[0]?.count || 0,
          accessories: accessoriesCount[0]?.count || 0,
          navigationItems: navigationItemsCount[0]?.count || 0,
          inquiries: inquiriesCount[0]?.count || 0,
          storage: 0, // Implement proper storage metrics later
        };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to fetch dashboard stats", undefined, error as Error);
        return new InternalError("Failed to fetch dashboard stats", { error });
      },
    );
  }

  /**
   * Retrieves a single product by ID with full detail columns.
   */
  async getProductById(id: number): Promise<Result<ProductDetail, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<ProductDetail> => {
        const product = await withCircuit(
          "get-product-by-id",
          () => this.productRepo.getProduct(id),
          DB_CIRCUIT_OPTIONS,
        );
        if (!product) {
          throw new NotFoundError(`Product with ID ${id}`);
        }
        return product;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to fetch product", { id }, error as Error);
        return new InternalError("Failed to fetch product", { id, error });
      },
    );
  }

  /**
   * Soft-deletes a product (sets deletedAt) and logs the action.
   */
  async softDeleteProduct(audit: AuditContext, id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        // Fetch original to log old values
        const original = await this.productRepo.getProduct(id);
        if (!original) {
          throw new NotFoundError(`Product with ID ${id}`);
        }

        const result = await withTimeout(
          this.productRepo.deleteProduct(id),
          5000,
          "Soft delete product",
        );

        if (result) {
          await this.logAudit({
            action: "SOFT_DELETE",
            tableName: "products",
            recordId: id.toString(),
            user: audit.user,
            userAgent: audit.userAgent,
            ipAddress: audit.ipAddress,
            oldValues: { name: original.name, isActive: original.isActive } as Record<
              string,
              unknown
            >,
          });
        }

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to soft delete product", { id }, error as Error);
        return new InternalError("Failed to soft delete product", { id, error });
      },
    );
  }

  /**
   * Fetches all media assets for admin management.
   * Extracted from route handler to maintain thin controller pattern (AS-106).
   */
  async getMediaAssetsList(): Promise<Result<MediaAssetSummary[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<MediaAssetSummary[]> => {
        const assets = await withCircuit(
          "get-all-media-assets-admin",
          () => this.mediaRepo.getMediaAssets(),
          DB_CIRCUIT_OPTIONS,
        );
        return assets || [];
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to fetch all media assets", undefined, error as Error);
        return new InternalError("Failed to fetch all media assets", { error });
      },
    );
  }

  /**
   * Hard-deletes a product permanently and logs the action.
   * Requires `confirm === 'DELETE'` from the caller for safety.
   */
  async hardDeleteProduct(
    audit: AuditContext,
    id: number,
    confirm: string,
  ): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        if (confirm !== "DELETE") {
          throw new InternalError("Hard delete requires { confirm: 'DELETE' }");
        }

        // Fetch original to log old values
        const original = await this.productRepo.getProduct(id);
        if (!original) {
          throw new NotFoundError(`Product with ID ${id}`);
        }

        const result = await withTimeout(
          this.productRepo.permanentlyDeleteProduct(id),
          10000,
          "Hard delete product",
        );

        if (result) {
          await this.logAudit({
            action: "HARD_DELETE",
            tableName: "products",
            recordId: id.toString(),
            user: audit.user,
            userAgent: audit.userAgent,
            ipAddress: audit.ipAddress,
            oldValues: { name: original.name, sku: original.sku } as Record<string, unknown>,
          });
        }

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to hard delete product", { id }, error as Error);
        return new InternalError("Failed to hard delete product", { id, error });
      },
    );
  }

  /**
   * Checks whether a slug is available (not taken by another product).
   * Optionally excludes a product ID (for edit mode).
   */
  async checkSlugAvailability(
    slug: string,
    excludeId?: number,
  ): Promise<Result<{ available: boolean }, AppError>> {
    const { normalizeSlug } = await import("../../lib/utilities/slug-utils.js");
    const normalizedSlug = normalizeSlug(slug);

    return ResultAsync.fromPromise(
      (async (): Promise<{ available: boolean }> => {
        const existing = await this.productRepo.getProductBySlug(normalizedSlug);
        if (!existing) {
          return { available: true };
        }
        // If the slug belongs to the product being edited, consider it available
        if (excludeId && existing.id === excludeId) {
          return { available: true };
        }
        return { available: false };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to check slug availability", { slug }, error as Error);
        return new InternalError("Failed to check slug availability", { slug, error });
      },
    );
  }

  // =============================================================================
  // CERTIFICATE MANAGEMENT
  // =============================================================================

  async getCertificatesList(): Promise<Result<Certificate[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Certificate[]> => {
        const result = await this.miscRepo.getCertificates();
        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to fetch certificates list", undefined, error as Error);
        return new InternalError("Failed to fetch certificates list", { error });
      },
    );
  }

  async createCertificate(
    audit: AuditContext,
    data: unknown,
  ): Promise<Result<Certificate, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Certificate> => {
        const validated = insertCertificateSchema.parse(data);
        const result = await this.miscRepo.createCertificate(validated);

        await this.logAudit({
          action: "INSERT",
          tableName: "certificates",
          recordId: result.id.toString(),
          user: audit.user,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          newValues: result as Record<string, unknown>,
        });

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to create certificate", undefined, error as Error);
        return new InternalError("Failed to create certificate", { error });
      },
    );
  }

  async updateCertificate(
    audit: AuditContext,
    id: number,
    data: Partial<InsertCertificate>,
  ): Promise<Result<Certificate, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Certificate> => {
        const original = await this.miscRepo.getCertificate(id);
        if (!original) {
          throw new NotFoundError(`Certificate with ID ${id}`);
        }

        const result = await this.miscRepo.updateCertificate(id, data);

        await this.logAudit({
          action: "UPDATE",
          tableName: "certificates",
          recordId: id.toString(),
          user: audit.user,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          oldValues: original as Record<string, unknown>,
          newValues: result! as Record<string, unknown>,
        });

        return result!;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to update certificate", { id }, error as Error);
        return new InternalError("Failed to update certificate", { id, error });
      },
    );
  }

  async deleteCertificate(audit: AuditContext, id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const original = await this.miscRepo.getCertificate(id);
        if (!original) {
          throw new NotFoundError(`Certificate with ID ${id}`);
        }

        const result = await this.miscRepo.deleteCertificate(id);

        if (result) {
          await this.logAudit({
            action: "DELETE",
            tableName: "certificates",
            recordId: id.toString(),
            user: audit.user,
            userAgent: audit.userAgent,
            ipAddress: audit.ipAddress,
            oldValues: original as Record<string, unknown>,
          });
        }

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to delete certificate", { id }, error as Error);
        return new InternalError("Failed to delete certificate", { id, error });
      },
    );
  }

  // =============================================================================
  // FIBER MANAGEMENT
  // =============================================================================

  async getFibersList(): Promise<Result<Fiber[], AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Fiber[]> => {
        const result = await this.miscRepo.getFibers();
        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to fetch fibers list", undefined, error as Error);
        return new InternalError("Failed to fetch fibers list", { error });
      },
    );
  }

  async createFiber(audit: AuditContext, data: unknown): Promise<Result<Fiber, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Fiber> => {
        const validated = insertFiberSchema.parse(data);
        const result = await this.miscRepo.createFiber(validated);

        await this.logAudit({
          action: "INSERT",
          tableName: "fibers",
          recordId: result.id.toString(),
          user: audit.user,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          newValues: result as Record<string, unknown>,
        });
        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to create fiber", undefined, error as Error);
        return new InternalError("Failed to create fiber", { error });
      },
    );
  }

  async updateFiber(
    audit: AuditContext,
    id: number,
    data: Partial<InsertFiber>,
  ): Promise<Result<Fiber, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Fiber> => {
        const original = await this.miscRepo.getFiber(id);
        if (!original) {
          throw new NotFoundError(`Fiber with ID ${id}`);
        }

        const updatedFiber = await this.miscRepo.updateFiber(id, data);

        await this.logAudit({
          action: "UPDATE",
          tableName: "fibers",
          recordId: id.toString(),
          user: audit.user,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          oldValues: original as Record<string, unknown>,
          newValues: updatedFiber as Record<string, unknown>,
        });
        return updatedFiber!;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to update fiber", { id }, error as Error);
        return new InternalError("Failed to update fiber", { id, error });
      },
    );
  }

  async deleteFiber(audit: AuditContext, id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const original = await this.miscRepo.getFiber(id);
        if (!original) {
          throw new NotFoundError(`Fiber with ID ${id}`);
        }

        const result = await this.miscRepo.deleteFiber(id);

        if (result) {
          await this.logAudit({
            action: "DELETE",
            tableName: "fibers",
            recordId: id.toString(),
            user: audit.user,
            userAgent: audit.userAgent,
            ipAddress: audit.ipAddress,
            oldValues: { name: original?.name } as Record<string, unknown>,
          });
        }

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to delete fiber", { id }, error as Error);
        return new InternalError("Failed to delete fiber", { id, error });
      },
    );
  }

  // =============================================================================
  // ABOUT TIMELINE MANAGEMENT
  // =============================================================================

  async getAboutTimelineEntries(): Promise<Result<AboutTimelineEntry[], AppError>> {
    return this.about.getTimelineEntries(true);
  }

  async createAboutTimelineEntry(
    audit: AuditContext,
    data: unknown,
  ): Promise<Result<AboutTimelineEntry, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<AboutTimelineEntry> => {
        const validated = insertAboutTimelineEntrySchema.parse(data);
        const result = await this.about.createTimelineEntry(validated);

        if (result.isErr()) {
          throw result.error;
        }

        const entry = result.value;

        await this.logAudit({
          action: "INSERT",
          tableName: "about_timeline_entries",
          recordId: entry.id.toString(),
          user: audit.user,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          newValues: entry as Record<string, unknown>,
        });

        return entry;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to create timeline entry", undefined, error as Error);
        return new InternalError("Failed to create timeline entry", { error });
      },
    );
  }

  async updateAboutTimelineEntry(
    audit: AuditContext,
    id: number,
    data: Partial<InsertAboutTimelineEntry>,
  ): Promise<Result<AboutTimelineEntry, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<AboutTimelineEntry> => {
        const originalResult = await this.about.getTimelineEntry(id);
        if (originalResult.isErr()) {
          throw originalResult.error;
        }
        const original = originalResult.value;

        const updateResult = await this.about.updateTimelineEntry(id, data);
        if (updateResult.isErr()) {
          throw updateResult.error;
        }
        const result = updateResult.value;

        await this.logAudit({
          action: "UPDATE",
          tableName: "about_timeline_entries",
          recordId: id.toString(),
          user: audit.user,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          oldValues: original as Record<string, unknown>,
          newValues: result! as Record<string, unknown>,
        });

        return result!;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to update timeline entry", { id }, error as Error);
        return new InternalError("Failed to update timeline entry", { id, error });
      },
    );
  }

  async deleteAboutTimelineEntry(
    audit: AuditContext,
    id: number,
  ): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const originalResult = await this.about.getTimelineEntry(id);
        const original = originalResult.isOk() ? originalResult.value : null;

        const deleteResult = await this.about.deleteTimelineEntry(id);
        if (deleteResult.isErr()) {
          throw deleteResult.error;
        }
        const result = deleteResult.value;

        if (result) {
          await this.logAudit({
            action: "DELETE",
            tableName: "about_timeline_entries",
            recordId: id.toString(),
            user: audit.user,
            userAgent: audit.userAgent,
            ipAddress: audit.ipAddress,
            oldValues: { title: original?.title } as Record<string, unknown>,
          });
        }

        return result;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[AdminService] Failed to delete timeline entry", { id }, error as Error);
        return new InternalError("Failed to delete timeline entry", { id, error });
      },
    );
  }

  /**
   * Retrieves failed jobs from BullMQ for manual review [WJ-108]
   */
  async getFailedJobs(): Promise<
    Result<
      {
        id: string | undefined;
        queue: string;
        name: string;
        data: unknown;
        failedReason: string;
        timestamp: number;
      }[],
      AppError
    >
  > {
    const failedJobs: {
      id: string | undefined;
      queue: string;
      name: string;
      data: unknown;
      failedReason: string;
      timestamp: number;
    }[] = [];

    return ResultAsync.fromPromise(
      (async (): Promise<
        {
          id: string | undefined;
          queue: string;
          name: string;
          data: unknown;
          failedReason: string;
          timestamp: number;
        }[]
      > => {
        // Background jobs have been migrated to Google Cloud Tasks,
        // which manages its own dead-letter queues and retry policies.
        // Monitoring and retries are now performed via GCP Console.

        return failedJobs;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new InternalError("Failed to fetch failed jobs", { cause: error });
      },
    );
  }

  /**
   * Manually retries a failed job [WJ-108]
   */
  async retryJob(queueName: string, jobId: string): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        throw new NotFoundError(
          `Queue ${queueName} not found. Retries are managed via Cloud Tasks.`,
        );
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new InternalError(`Failed to retry job ${jobId}`, { cause: error });
      },
    );
  }
}

export const adminService = new AdminService();
