/**
 * ADMIN SERVICE
 * Centralizes business logic for administrative operations,
 * data transformations, and system maintenance.
 */

import type {
  Certificate,
  Fiber,
  InsertCertificate,
  InsertFiber,
  InsertProduct,
  MediaAsset,
  Product,
} from "@run-remix/shared";
import { count } from "drizzle-orm";
import {
  accessories,
  categories,
  certificates,
  fabrics,
  fibers,
  inquiries,
  insertCertificateSchema,
  insertFiberSchema,
  mediaAssets,
  navigationItems,
  products,
  sizeCharts,
} from "../../../shared/index.js";
import { db } from "../../db.js";
import {
  mediaRepository,
  miscRepository,
  productRepository,
  systemRepository,
} from "../../lib/db/repositories/index.js";
import { encrypt, getBlindIndex } from "../../lib/encryption.js";
import { getLifecycleScheduler } from "../../lib/integrations/storage-lifecycle-scheduler.js";
import { logger } from "../../lib/monitoring/logger.js";
import { withTimeout } from "../../lib/resilience/request-timeout.js";
import type { SessionUser } from "../../types/session.js";

export interface AuditContext {
  user: SessionUser;
  userAgent: string | undefined;
  ipAddress: string | undefined;
}

export class AdminService {
  private readonly systemRepo: typeof systemRepository;
  private readonly productRepo: typeof productRepository;
  private readonly mediaRepo: typeof mediaRepository;
  private readonly miscRepo: typeof miscRepository;

  constructor(
    systemRepo = systemRepository,
    productRepo = productRepository,
    mediaRepo = mediaRepository,
    miscRepo = miscRepository,
  ) {
    this.systemRepo = systemRepo;
    this.productRepo = productRepo;
    this.mediaRepo = mediaRepo;
    this.miscRepo = miscRepo;
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
  ): Promise<{
    products: unknown[];
    categories: unknown[];
    fabrics: unknown[];
    mediaAssets: unknown[];
    meta: unknown;
  }> {
    const offset = (page - 1) * limit;

    const metadataPromises = options.skipMetadata
      ? [Promise.resolve([]), Promise.resolve([])]
      : [this.productRepo.getCategories(), this.miscRepo.getFabrics()];

    const [allProducts, totalProductsCount, categories, fabrics] = await withTimeout(
      Promise.all([
        this.productRepo.getProductsIncludingDeleted(limit, offset),
        this.productRepo.getProductsCount(),
        ...metadataPromises,
      ]),
      15000,
      "Fetch admin initial data",
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
  }): Promise<{
    products: unknown[];
    categories: unknown[];
    fabrics: unknown[];
    mediaAssets: unknown[];
    meta: unknown;
  }> {
    const { page = 1, limit = 50, search, categoryId, status } = options;
    const offset = (page - 1) * limit;

    // We can fetch initially to ensure we get some data and filter in-memory if needed
    // In a fully optimized system, the repo would handle all filtering
    const [allProductsData, totalProductsCount, categories, fabrics, media] = await Promise.all([
      this.productRepo.getProductsIncludingDeleted(limit, offset),
      this.productRepo.getProductsCount(),
      this.productRepo.getCategories(),
      this.miscRepo.getFabrics(),
      this.mediaRepo.getMediaAssets(100, 0), // get recent media
    ]);

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
  }

  /**
   * Creates a new product and logs the action
   */
  async createProduct(audit: AuditContext, data: InsertProduct): Promise<Product> {
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
  }

  /**
   * Updates an existing product and logs the action
   */
  async updateProduct(
    audit: AuditContext,
    id: number,
    data: Partial<InsertProduct>,
  ): Promise<Product> {
    // Get original for audit log
    const original = await this.productRepo.getProduct(id);

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
  }

  /**
   * Corrects media URL corruption in category featured content.
   * Optimized to process in parallel chunks and filter before processing.
   */
  async fixCorruptedMedia(
    audit: AuditContext,
    timeoutMs = 30000,
  ): Promise<{ fixedCount: number; fixedCategories: string[] }> {
    logger.debug("AdminService: Starting cleanup of corrupted media URLs", { timeoutMs });
    // Fetch all categories - this is fast
    const categories = await withTimeout(
      this.productRepo.getCategories(),
      10000,
      "Get all categories for media fix",
    );

    let fixedCount = 0;
    const fixedCategories: string[] = [];

    // Filter for categories that actually need updates (in memory optimization)
    const categoriesToUpdate = categories.filter((category) => {
      if (!category.featuredContent) return false;

      const content = category.featuredContent as Record<string, { mediaUrl?: string } | undefined>;
      const cardKeys = ["card1", "card2", "card3", "card4"];

      return cardKeys.some((key) => {
        const card = content[key];
        return (
          card?.mediaUrl &&
          (card.mediaUrl.includes("undefined") || card.mediaUrl === "/api/media/undefined/content")
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
              if (mediaUrl.includes("undefined") || mediaUrl === "/api/media/undefined/content") {
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
  }

  /**
   * Triggers system storage cleanup.
   */
  async triggerCleanup(audit: AuditContext, autoClean: boolean, timeoutMs = 60000) {
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

    return report;
  }

  /**
   * Updates enterprise audit configuration.
   */
  async updateAuditConfig(
    audit: AuditContext,
    config: { enabled?: boolean | undefined; trackedTables?: string[] | undefined },
  ) {
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
  }

  /**
   * Restores a soft-deleted category
   */
  async restoreCategory(audit: AuditContext, id: number) {
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
  }

  /**
   * Restores a soft-deleted product
   */
  async restoreProduct(audit: AuditContext, id: number) {
    const result = await withTimeout(this.productRepo.restoreProduct(id), 5000, "Restore product");

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
  }

  /**
   * Restores a soft-deleted media asset
   */
  async restoreMediaAsset(audit: AuditContext, id: number) {
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
  }

  /**
   * Retrieves aggregated statistics for the Admin CMS Dashboard
   */
  async getDashboardStats() {
    try {
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
    } catch (error) {
      logger.error("[AdminService] Failed to fetch dashboard stats", error);
      throw error;
    }
  }

  /**
   * Retrieves a single product by ID with full detail columns.
   */
  async getProductById(id: number) {
    const product = await withTimeout(this.productRepo.getProduct(id), 5000, "Get product by ID");
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return product;
  }

  /**
   * Soft-deletes a product (sets deletedAt) and logs the action.
   */
  async softDeleteProduct(audit: AuditContext, id: number) {
    // Fetch original to log old values
    const original = await this.productRepo.getProduct(id);
    if (!original) {
      throw new Error(`Product with ID ${id} not found`);
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
        oldValues: { name: original.name, isActive: original.isActive } as Record<string, unknown>,
      });
    }

    return result;
  }

  /**
   * Hard-deletes a product permanently and logs the action.
   * Requires `confirm === 'DELETE'` from the caller for safety.
   */
  async hardDeleteProduct(audit: AuditContext, id: number, confirm: string) {
    if (confirm !== "DELETE") {
      throw new Error("Hard delete requires { confirm: 'DELETE' } in request body");
    }

    // Fetch original to log old values
    const original = await this.productRepo.getProduct(id);
    if (!original) {
      throw new Error(`Product with ID ${id} not found`);
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
  }

  /**
   * Checks whether a slug is available (not taken by another product).
   * Optionally excludes a product ID (for edit mode).
   */
  async checkSlugAvailability(slug: string, excludeId?: number): Promise<{ available: boolean }> {
    const existing = await this.productRepo.getProductBySlug(slug);
    if (!existing) {
      return { available: true };
    }
    // If the slug belongs to the product being edited, consider it available
    if (excludeId && existing.id === excludeId) {
      return { available: true };
    }
    return { available: false };
  }

  // =============================================================================
  // CERTIFICATE MANAGEMENT
  // =============================================================================

  async getCertificatesList(): Promise<Certificate[]> {
    return this.miscRepo.getCertificates();
  }

  async createCertificate(audit: AuditContext, data: unknown): Promise<Certificate> {
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
  }

  async updateCertificate(
    audit: AuditContext,
    id: number,
    data: Partial<InsertCertificate>,
  ): Promise<Certificate> {
    const original = await this.miscRepo.getCertificate(id);
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
  }

  async deleteCertificate(audit: AuditContext, id: number) {
    const original = await this.miscRepo.getCertificate(id);
    const result = await this.miscRepo.deleteCertificate(id);

    if (result) {
      await this.logAudit({
        action: "DELETE",
        tableName: "certificates",
        recordId: id.toString(),
        user: audit.user,
        userAgent: audit.userAgent,
        ipAddress: audit.ipAddress,
        oldValues: { name: original?.name } as Record<string, unknown>,
      });
    }

    return result;
  }

  // =============================================================================
  // FIBER MANAGEMENT
  // =============================================================================

  async getFibersList(): Promise<Fiber[]> {
    return this.miscRepo.getFibers();
  }

  async createFiber(audit: AuditContext, data: unknown): Promise<Fiber> {
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
    return result!;
  }

  async updateFiber(audit: AuditContext, id: number, data: Partial<InsertFiber>): Promise<Fiber> {
    const original = await this.miscRepo.getFiber(id);
    const result = await this.miscRepo.updateFiber(id, data);

    await this.logAudit({
      action: "UPDATE",
      tableName: "fibers",
      recordId: id.toString(),
      user: audit.user,
      userAgent: audit.userAgent,
      ipAddress: audit.ipAddress,
      oldValues: original as Record<string, unknown>,
      newValues: result as Record<string, unknown>,
    });
    return result!;
  }

  async deleteFiber(audit: AuditContext, id: number) {
    const original = await this.miscRepo.getFiber(id);
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
  }
}

export const adminService = new AdminService();
