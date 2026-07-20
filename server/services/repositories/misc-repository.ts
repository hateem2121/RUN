import {
  type Accessory,
  accessories,
  type Certificate,
  type ContactPageConfiguration,
  certificates,
  contactPageConfigurations,
  type Fabric,
  type Fiber,
  type FooterConfiguration,
  fabrics,
  fibers,
  footerConfiguration,
  type Inquiry,
  type InsertAccessory,
  type InsertCertificate,
  type InsertContactPageConfiguration,
  type InsertFabric,
  type InsertFiber,
  type InsertFooterConfiguration,
  type InsertInquiry,
  type InsertNavigationGlassmorphismSettings,
  type InsertNavigationItem,
  type InsertSizeChart,
  inquiries,
  mediaAssets,
  type NavigationGlassmorphismSettings,
  type NavigationItem,
  navigationGlassmorphismSettings,
  navigationItems,
  newsletterSubscribers,
  type SizeChart,
  sizeCharts,
} from "@run-remix/shared";
import { and, asc, count, desc, eq, getTableColumns, isNull, like, or, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import { type DbClient, db } from "../../db.js";
import { emitCacheInvalidation } from "../../lib/cache/cache-events.js";
import { UnifiedCache } from "../../lib/cache/unified-cache.js";
import { dbCircuitBreaker } from "../../lib/db/db-circuit-breaker.js";
import { decrypt, encrypt, getBlindIndex } from "../../lib/encryption.js";
import { logger } from "../../lib/monitoring/logger.js";
import { StorageSingleton } from "../../lib/storage-singleton.js";

const unifiedCache = UnifiedCache.getInstance();

// CHUNK 2: Fibers cache key
const FIBERS_CACHE_KEY = "fibers:all";
const FIBERS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export class MiscRepository {
  // =============================================================================
  // FIBER METHODS
  // =============================================================================

  async getFibers(): Promise<Fiber[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getFibers();
    }
    try {
      // Use unifiedCache (Redis) instead of global memory for statelessness
      const cached = await unifiedCache.get<Fiber[]>(FIBERS_CACHE_KEY, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[MiscRepo] Failed to get fibers from cache:", error);
    }

    // Cache miss or error: fetch from database
    const result = await db
      .select()
      .from(fibers)
      .where(isNull(fibers.deletedAt))
      .orderBy(asc(fibers.name));

    try {
      await unifiedCache.set(FIBERS_CACHE_KEY, result, FIBERS_CACHE_TTL, "data");
    } catch (error) {
      logger.debug("[MiscRepo] Failed to set fibers cache:", error);
    }

    return result;
  }

  async getFiber(id: number): Promise<Fiber | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getFiber(id);
    }
    const [fiber] = await db
      .select()
      .from(fibers)
      .where(and(eq(fibers.id, id), isNull(fibers.deletedAt)));
    return fiber;
  }

  async createFiber(fiber: InsertFiber, tx?: DbClient): Promise<Fiber> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createFiber(fiber);
    }
    const dbConn = tx || db;
    const [created] = await dbConn.insert(fibers).values(fiber).returning();

    try {
      await unifiedCache.delete(FIBERS_CACHE_KEY);
    } catch (error) {
      logger.debug("[Cache] Failed to clear fiber cache:", error);
    }

    try {
      await emitCacheInvalidation("fibers:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async updateFiber(
    id: number,
    fiber: Partial<InsertFiber>,
    tx?: DbClient,
  ): Promise<Fiber | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateFiber(id, fiber);
    }
    const dbConn = tx || db;
    const [updated] = await dbConn
      .update(fibers)
      .set(fiber)
      .where(and(eq(fibers.id, id), isNull(fibers.deletedAt)))
      .returning();

    try {
      await unifiedCache.delete(FIBERS_CACHE_KEY);
    } catch (error) {
      logger.debug("[Cache] Failed to clear fiber cache:", error);
    }

    try {
      await emitCacheInvalidation("fibers:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated;
  }

  async deleteFiber(id: number, tx?: DbClient): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteFiber(id);
    }
    const dbConn = tx || db;
    const result = await dbConn
      .update(fibers)
      .set({ deletedAt: sql`NOW()` })
      .where(eq(fibers.id, id));

    try {
      await unifiedCache.delete(FIBERS_CACHE_KEY);
    } catch (error) {
      logger.debug("[Cache] Failed to clear fiber cache:", error);
    }

    try {
      await emitCacheInvalidation("fibers:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async getFibersIncludingDeleted(): Promise<Fiber[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getFibersIncludingDeleted();
    }
    return await db.select().from(fibers).orderBy(desc(fibers.createdAt));
  }

  async restoreFiber(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().restoreFiber(id);
    }
    const result = await db.update(fibers).set({ deletedAt: null }).where(eq(fibers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async permanentlyDeleteFiber(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().permanentlyDeleteFiber(id);
    }
    const result = await db.delete(fibers).where(eq(fibers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =============================================================================
  // FABRIC METHODS
  // =============================================================================

  async getFabrics(): Promise<Fabric[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getFabrics();
    }
    const cacheKey = "fabrics:all";
    try {
      const cached = await unifiedCache.get<Fabric[]>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get fabrics from cache:", error);
    }

    const result = await db
      .select()
      .from(fabrics)
      .where(isNull(fabrics.deletedAt))
      .orderBy(asc(fabrics.name));

    try {
      // PERFORMANCE: Increase TTL to 30min (static taxonomy data, rarely changes)
      await unifiedCache.set(cacheKey, result, 30 * 60 * 1000, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set cache:", error);
    }
    return result;
  }

  async getFabric(id: number): Promise<Fabric | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getFabric(id);
    }
    const [fabric] = await dbCircuitBreaker.execute(
      async () =>
        await db
          .select()
          .from(fabrics)
          .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt))),
      "getFabric",
    );
    return fabric;
  }

  async createFabric(fabric: InsertFabric, tx?: DbClient): Promise<Fabric> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createFabric(fabric);
    }
    const dbConn = tx || db;

    // Transform fabric data: separate database columns from properties fields
    const transformedFabric = this.transformFabricForDatabase(fabric);

    const [created] = await dbConn.insert(fabrics).values(transformedFabric).returning();

    try {
      await unifiedCache.delete("fabrics:all");
    } catch (error) {
      logger.debug("[Cache] Failed to clear fabric cache:", error);
    }

    try {
      await emitCacheInvalidation("fabrics:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async updateFabric(
    id: number,
    fabric: Partial<InsertFabric>,
    tx?: DbClient,
  ): Promise<Fabric | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateFabric(id, fabric);
    }
    const dbConn = tx || db;

    // Fetch existing fabric to preserve properties
    const existing = await this.getFabric(id);
    if (!existing) {
      return undefined;
    }

    // Transform fabric data: separate database columns from properties fields
    // Pass existing properties to merge with new ones
    const transformedFabric = this.transformFabricForDatabase(fabric, existing.properties);

    const [updated] = await dbConn
      .update(fabrics)
      .set(transformedFabric)
      .where(and(eq(fabrics.id, id), isNull(fabrics.deletedAt)))
      .returning();

    try {
      await unifiedCache.delete("fabrics:all");
    } catch (error) {
      logger.debug("[Cache] Failed to clear fabric cache:", error);
    }

    try {
      await emitCacheInvalidation("fabrics:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated;
  }

  /**
   * Transform fabric data for database storage
   * Separates database columns from properties fields
   * Merges new properties with existing ones to prevent data loss on updates
   */
  private transformFabricForDatabase(
    fabric: Partial<InsertFabric>,
    currentProperties?: Record<string, unknown> | null,
  ): InsertFabric {
    // Fields that have dedicated database columns
    const {
      name,
      description,
      fabricType,
      weight,
      weave,
      weaveType,
      weaveTypes,
      stretch,
      finishTreatment,
      careInstructions,
      sustainabilityScore,
      certifications,
      visualSwatchId,
      keyApplications,
      isActive,
      // B2B Core Fields with dedicated database columns
      sport,
      marketSegment,
      seasonality,
      properties: incomingProperties,
      // All technical specification fields that should go into properties
      composition, // DEPRECATED: Legacy field for backward compatibility
      compositions,
      stretchDirection,
      stretchPercentage,
      breathability,
      moistureManagement,
      enhancedMoistureManagement,
      wickingRate,
      dryingTime,
      airPermeability,
      waterColumn,
      performanceFeatures,
      yarnCountConstruction,
      colorfastness,
      tensileStrength,
      tearStrength,
      abrasionResistance,
      pillingGrade,
      shrinkageTolerancePercentage,
      washTemperature,
      certificationTags,
      certificationIds,
      endOfLifeOptions,
      recyclabilityNotes,
      useCases,
      finishTreatments,
      washCareInstructions,
      finish,
      ...otherFields
    } = fabric as Partial<InsertFabric> & {
      // Extra legacy/extended fields not in the base InsertFabric type
      composition?: string;
      compositions?: unknown;
      stretchDirection?: string;
      stretchPercentage?: unknown;
      breathability?: string;
      moistureManagement?: string;
      enhancedMoistureManagement?: unknown;
      wickingRate?: unknown;
      dryingTime?: unknown;
      airPermeability?: unknown;
      waterColumn?: unknown;
      performanceFeatures?: string[];
      yarnCountConstruction?: string;
      colorfastness?: string;
      tensileStrength?: unknown;
      tearStrength?: unknown;
      abrasionResistance?: unknown;
      pillingGrade?: unknown;
      shrinkageTolerancePercentage?: unknown;
      washTemperature?: string;
      certificationTags?: string[];
      certificationIds?: unknown;
      endOfLifeOptions?: string[];
      recyclabilityNotes?: string;
      useCases?: string[];
      finishTreatments?: string[];
      washCareInstructions?: string;
      finish?: string;
    }; // Cast for internal destructuring of mixed legacy/current fields

    // DEPRECATED FIELD MONITORING: Track usage of legacy composition field
    if (composition !== undefined) {
      logger.warn("[DEPRECATED_FIELD_USAGE] fabric.composition field used", {
        event: "deprecated_field_composition",
        fabricName: name || "unknown",
        hasCompositionsArray: !!compositions,
        compositionValue: composition,
        timestamp: new Date().toISOString(),
        deprecationRemovalDate: "2026-03",
      });
    }

    // Build the properties object with all technical specifications
    // Merge existing properties with new ones to prevent data loss on updates
    const technicalProperties: Record<string, unknown> = {
      ...(currentProperties || {}), // Start with existing properties
      ...(incomingProperties || {}), // Override with any incoming properties
    };

    // Pack all technical specification fields into properties
    if (compositions !== undefined) {
      technicalProperties.compositions = compositions;
    }
    if (stretchDirection !== undefined) {
      technicalProperties.stretchDirection = stretchDirection;
    }
    if (stretchPercentage !== undefined) {
      technicalProperties.stretchPercentage = stretchPercentage;
    }
    if (breathability !== undefined) {
      technicalProperties.breathability = breathability;
    }
    if (moistureManagement !== undefined) {
      technicalProperties.moistureManagement = moistureManagement;
    }
    if (enhancedMoistureManagement !== undefined) {
      technicalProperties.enhancedMoistureManagement = enhancedMoistureManagement;
    }
    if (wickingRate !== undefined) {
      technicalProperties.wickingRate = wickingRate;
    }
    if (dryingTime !== undefined) {
      technicalProperties.dryingTime = dryingTime;
    }
    if (airPermeability !== undefined) {
      technicalProperties.airPermeability = airPermeability;
    }
    if (waterColumn !== undefined) {
      technicalProperties.waterColumn = waterColumn;
    }
    if (performanceFeatures !== undefined) {
      technicalProperties.performanceFeatures = performanceFeatures;
    }
    if (yarnCountConstruction !== undefined) {
      technicalProperties.yarnCountConstruction = yarnCountConstruction;
    }
    if (colorfastness !== undefined) {
      technicalProperties.colorfastness = colorfastness;
    }
    if (tensileStrength !== undefined) {
      technicalProperties.tensileStrength = tensileStrength;
    }
    if (tearStrength !== undefined) {
      technicalProperties.tearStrength = tearStrength;
    }
    if (abrasionResistance !== undefined) {
      technicalProperties.abrasionResistance = abrasionResistance;
    }
    if (pillingGrade !== undefined) {
      technicalProperties.pillingGrade = pillingGrade;
    }
    if (shrinkageTolerancePercentage !== undefined) {
      technicalProperties.shrinkageTolerancePercentage = shrinkageTolerancePercentage;
    }
    if (washTemperature !== undefined) {
      technicalProperties.washTemperature = washTemperature;
    }
    if (certificationTags !== undefined) {
      technicalProperties.certificationTags = certificationTags;
    }
    if (certificationIds !== undefined) {
      technicalProperties.certificationIds = certificationIds;
    }
    if (endOfLifeOptions !== undefined) {
      technicalProperties.endOfLifeOptions = endOfLifeOptions;
    }
    if (recyclabilityNotes !== undefined) {
      technicalProperties.recyclabilityNotes = recyclabilityNotes;
    }
    if (useCases !== undefined) {
      technicalProperties.useCases = useCases;
    }
    if (finishTreatments !== undefined) {
      technicalProperties.finishTreatments = finishTreatments;
    }
    if (washCareInstructions !== undefined) {
      technicalProperties.washCareInstructions = washCareInstructions;
    }
    if (finish !== undefined) {
      technicalProperties.finish = finish;
    }

    // Convert sustainabilityScore to number if it's a string
    let scoreParsed: number | undefined;
    if (sustainabilityScore !== undefined) {
      if (typeof sustainabilityScore === "number") {
        scoreParsed = sustainabilityScore;
      } else if (typeof sustainabilityScore === "string") {
        const parsed = parseInt(sustainabilityScore, 10);
        if (!Number.isNaN(parsed)) {
          scoreParsed = parsed;
        }
      }
    }

    // Return the transformed fabric object with database columns + properties
    const result: InsertFabric = {
      name: name as string, // Guaranteed by InsertFabric requirement or handled by caller validation
      ...otherFields,
    };

    // Add defined database columns
    if (name !== undefined) {
      result.name = name;
    }
    if (description !== undefined) {
      result.description = description;
    }
    if (fabricType !== undefined) {
      result.fabricType = fabricType;
    }
    if (weight !== undefined) {
      result.weight = weight;
    }
    if (weave !== undefined) {
      result.weave = weave;
    }
    if (weaveType !== undefined) {
      result.weaveType = weaveType;
    }
    if (weaveTypes !== undefined) {
      result.weaveTypes = weaveTypes;
    }
    if (stretch !== undefined) {
      result.stretch = stretch;
    }
    if (finishTreatment !== undefined) {
      result.finishTreatment = finishTreatment;
    }
    if (careInstructions !== undefined) {
      result.careInstructions = careInstructions;
    }
    if (scoreParsed !== undefined) {
      result.sustainabilityScore = scoreParsed;
    }
    if (certifications !== undefined) {
      result.certifications = certifications;
    }
    if (visualSwatchId !== undefined) {
      result.visualSwatchId = visualSwatchId;
    }
    if (keyApplications !== undefined) {
      result.keyApplications = keyApplications;
    }
    if (isActive !== undefined) {
      result.isActive = isActive;
    }
    // B2B Core Fields
    if (sport !== undefined) {
      result.sport = sport;
    }
    if (marketSegment !== undefined) {
      result.marketSegment = marketSegment;
    }
    if (seasonality !== undefined) {
      result.seasonality = seasonality;
    }

    // Add properties with all technical specifications
    // Only assign if there are actual properties to preserve/update
    if (Object.keys(technicalProperties).length > 0) {
      result.properties = technicalProperties;
    }

    return result;
  }

  async deleteFabric(id: number, tx?: DbClient): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteFabric(id);
    }
    const dbConn = tx || db;
    const result = await dbConn
      .update(fabrics)
      .set({ deletedAt: sql`NOW()` })
      .where(eq(fabrics.id, id));

    try {
      await unifiedCache.delete("fabrics:all");
    } catch (error) {
      logger.debug("[Cache] Failed to clear fabric cache:", error);
    }

    try {
      await emitCacheInvalidation("fabrics:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async getFabricsIncludingDeleted(limit = 100, offset = 0): Promise<Fabric[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getFabricsIncludingDeleted(limit, offset);
    }
    return await db
      .select()
      .from(fabrics)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(fabrics.createdAt));
  }

  async restoreFabric(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().restoreFabric(id);
    }
    const result = await db.update(fabrics).set({ deletedAt: null }).where(eq(fabrics.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async permanentlyDeleteFabric(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().permanentlyDeleteFabric(id);
    }
    const result = await db.delete(fabrics).where(eq(fabrics.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =============================================================================
  // CERTIFICATE METHODS
  // =============================================================================

  // PERF: Define constant cache key to prevent mismatch bugs
  // V3: Bumped to force refresh after fixing invalidation bug where writes were clearing wrong key
  private readonly CERTIFICATES_CACHE_KEY = "certificates:active:v3";

  async getCertificates(): Promise<Certificate[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getCertificates();
    }
    try {
      const cached = await unifiedCache.get<Certificate[]>(this.CERTIFICATES_CACHE_KEY, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get certificates from cache:", error);
    }

    // CHUNK 3: Fetch certificates with media URL hydration
    // Problem: Certificates store imageId but frontend expects imageUrl to be populated
    // Fix: Join with mediaAssets and populate imageUrl if not already set
    const result = await db
      .select({
        ...getTableColumns(certificates),
        mediaUrl: mediaAssets.url, // Alias for joining
      })
      .from(certificates)
      .leftJoin(mediaAssets, eq(certificates.imageId, mediaAssets.id))
      .where(and(eq(certificates.isActive, true), isNull(certificates.deletedAt)))
      .orderBy(asc(certificates.name));

    // Map result to hydrate imageUrl from mediaUrl relation
    // This fixes broken images on frontend which relies on imageUrl property
    // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
    const hydratedResult = result.map((cert: any) => {
      const { mediaUrl, ...certData } = cert;
      return {
        ...certData,
        // Prefer existing imageUrl (if manually set), fallback to joined media URL
        imageUrl: certData.imageUrl || mediaUrl || null,
      };
    });

    try {
      // PERFORMANCE: Increase TTL to 30min (static taxonomy data, rarely changes)
      await unifiedCache.set(this.CERTIFICATES_CACHE_KEY, hydratedResult, 30 * 60 * 1000, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set cache:", error);
    }
    return hydratedResult;
  }

  async getCertificate(id: number): Promise<Certificate | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getCertificate(id);
    }
    const certificate = await dbCircuitBreaker.execute(async () => {
      const result = await db
        .select({
          ...getTableColumns(certificates),
          mediaUrl: mediaAssets.url,
        })
        .from(certificates)
        .leftJoin(mediaAssets, eq(certificates.imageId, mediaAssets.id))
        .where(and(eq(certificates.id, id), isNull(certificates.deletedAt)));

      if (!result[0]) {
        return undefined;
      }

      const { mediaUrl, ...certData } = result[0];
      return {
        ...certData,
        imageUrl: certData.imageUrl || mediaUrl || null,
      };
    }, "getCertificate");
    return certificate;
  }

  async createCertificate(certificate: InsertCertificate, tx?: DbClient): Promise<Certificate> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createCertificate(certificate);
    }
    const dbConn = tx || db;
    const [created] = await dbConn.insert(certificates).values(certificate).returning();

    try {
      await unifiedCache.delete(this.CERTIFICATES_CACHE_KEY);
    } catch (error) {
      logger.debug("[Cache] Failed to clear certificate cache:", error);
    }

    try {
      await emitCacheInvalidation("certificates:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    await unifiedCache.delete("batch:/api/sustainability/batch");
    return created!;
  }

  async updateCertificate(
    id: number,
    certificate: Partial<InsertCertificate>,
    tx?: DbClient,
  ): Promise<Certificate | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateCertificate(id, certificate);
    }
    const dbConn = tx || db;
    const [updated] = await dbConn
      .update(certificates)
      .set(certificate)
      .where(and(eq(certificates.id, id), isNull(certificates.deletedAt)))
      .returning();

    try {
      await unifiedCache.delete(this.CERTIFICATES_CACHE_KEY);
    } catch (error) {
      logger.debug("[Cache] Failed to clear certificate cache:", error);
    }

    try {
      await emitCacheInvalidation("certificates:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    await unifiedCache.delete("batch:/api/sustainability/batch");
    return updated;
  }

  async deleteCertificate(id: number, tx?: DbClient): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteCertificate(id);
    }
    const dbConn = tx || db;
    const result = await dbConn
      .update(certificates)
      .set({ deletedAt: sql`NOW()` })
      .where(eq(certificates.id, id));

    try {
      await unifiedCache.delete(this.CERTIFICATES_CACHE_KEY);
    } catch (error) {
      logger.debug("[Cache] Failed to clear certificate cache:", error);
    }

    try {
      await emitCacheInvalidation("certificates:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    await unifiedCache.delete("batch:/api/sustainability/batch");
    return (result.rowCount ?? 0) > 0;
  }

  async getCertificatesIncludingDeleted(): Promise<Certificate[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getCertificatesIncludingDeleted();
    }
    return await db.select().from(certificates).orderBy(desc(certificates.createdAt));
  }

  async restoreCertificate(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().restoreCertificate(id);
    }
    const result = await db
      .update(certificates)
      .set({ deletedAt: null })
      .where(eq(certificates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async permanentlyDeleteCertificate(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().permanentlyDeleteCertificate(id);
    }
    const result = await db.delete(certificates).where(eq(certificates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =============================================================================
  // SIZE CHART METHODS
  // =============================================================================

  async getSizeCharts(): Promise<SizeChart[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getSizeCharts();
    }
    const cacheKey = "size-charts:active";
    try {
      const cached = await unifiedCache.get<SizeChart[]>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get size charts from cache:", error);
    }

    const result = await db
      .select()
      .from(sizeCharts)
      .where(and(eq(sizeCharts.isActive, true), isNull(sizeCharts.deletedAt)))
      .orderBy(asc(sizeCharts.name));

    try {
      await unifiedCache.set(cacheKey, result, 24 * 60 * 60 * 1000, "data"); // 24 hours - size charts are static data
    } catch (error) {
      logger.debug("[Cache] Failed to set cache:", error);
    }
    return result;
  }

  async getSizeChart(id: number): Promise<SizeChart | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getSizeChart(id);
    }
    const [sizeChart] = await dbCircuitBreaker.execute(
      async () =>
        await db
          .select()
          .from(sizeCharts)
          .where(and(eq(sizeCharts.id, id), isNull(sizeCharts.deletedAt))),
      "getSizeChart",
    );
    return sizeChart;
  }

  async createSizeChart(sizeChart: InsertSizeChart, tx?: DbClient): Promise<SizeChart> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createSizeChart(sizeChart);
    }
    const dbConn = tx || db;
    const [created] = await dbConn.insert(sizeCharts).values(sizeChart).returning();

    try {
      await unifiedCache.delete("size-charts:active");
    } catch (error) {
      logger.debug("[Cache] Failed to clear size chart cache:", error);
    }

    try {
      await emitCacheInvalidation("size-charts:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async updateSizeChart(
    id: number,
    sizeChart: Partial<InsertSizeChart>,
    tx?: DbClient,
  ): Promise<SizeChart | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateSizeChart(id, sizeChart);
    }
    const dbConn = tx || db;
    const [updated] = await dbConn
      .update(sizeCharts)
      .set(sizeChart)
      .where(and(eq(sizeCharts.id, id), isNull(sizeCharts.deletedAt)))
      .returning();

    try {
      await unifiedCache.delete("size-charts:active");
    } catch (error) {
      logger.debug("[Cache] Failed to clear size chart cache:", error);
    }

    try {
      await emitCacheInvalidation("size-charts:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated;
  }

  async deleteSizeChart(id: number, tx?: DbClient): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteSizeChart(id);
    }
    const dbConn = tx || db;
    const result = await dbConn
      .update(sizeCharts)
      .set({ deletedAt: sql`NOW()` })
      .where(eq(sizeCharts.id, id));

    try {
      await unifiedCache.delete("size-charts:active");
    } catch (error) {
      logger.debug("[Cache] Failed to clear size chart cache:", error);
    }

    try {
      await emitCacheInvalidation("size-charts:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async getSizeChartsIncludingDeleted(): Promise<SizeChart[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getSizeChartsIncludingDeleted();
    }
    return await db.select().from(sizeCharts).orderBy(desc(sizeCharts.createdAt));
  }

  async restoreSizeChart(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().restoreSizeChart(id);
    }
    const result = await db
      .update(sizeCharts)
      .set({ deletedAt: null })
      .where(eq(sizeCharts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async permanentlyDeleteSizeChart(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().permanentlyDeleteSizeChart(id);
    }
    const result = await db.delete(sizeCharts).where(eq(sizeCharts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // =============================================================================
  // ACCESSORY METHODS
  // =============================================================================

  async getAccessories(): Promise<Accessory[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAccessories();
    }
    const cacheKey = "accessories:active";
    try {
      const cached = await unifiedCache.get<Accessory[]>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get accessories from cache:", error);
    }

    const result = await db
      .select()
      .from(accessories)
      .where(and(eq(accessories.isActive, true), isNull(accessories.deletedAt)))
      .orderBy(asc(accessories.name));

    try {
      await unifiedCache.set(cacheKey, result, 5 * 60 * 1000, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set cache:", error);
    }
    return result;
  }

  async getAccessory(id: number): Promise<Accessory | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getAccessory(id);
    }
    const [accessory] = await dbCircuitBreaker.execute(
      async () =>
        await db
          .select()
          .from(accessories)
          .where(and(eq(accessories.id, id), isNull(accessories.deletedAt))),
      "getAccessory",
    );
    return accessory;
  }

  async createAccessory(accessory: InsertAccessory, tx?: DbClient): Promise<Accessory> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createAccessory(accessory);
    }
    const dbConn = tx || db;
    const [created] = await dbConn.insert(accessories).values(accessory).returning();

    try {
      await unifiedCache.delete("accessories:active");
    } catch (error) {
      logger.debug("[Cache] Failed to clear accessory cache:", error);
    }

    try {
      await emitCacheInvalidation("accessories:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async updateAccessory(
    id: number,
    accessory: Partial<InsertAccessory>,
    tx?: DbClient,
  ): Promise<Accessory | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateAccessory(id, accessory);
    }
    const dbConn = tx || db;
    const [updated] = await dbConn
      .update(accessories)
      .set(accessory)
      .where(and(eq(accessories.id, id), isNull(accessories.deletedAt)))
      .returning();

    try {
      await unifiedCache.delete("accessories:active");
    } catch (error) {
      logger.debug("[Cache] Failed to clear accessory cache:", error);
    }

    try {
      await emitCacheInvalidation("accessories:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return updated;
  }

  async deleteAccessory(id: number, tx?: DbClient): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteAccessory(id);
    }
    const dbConn = tx || db;
    const result = await dbConn
      .update(accessories)
      .set({ deletedAt: sql`NOW()` })
      .where(eq(accessories.id, id));

    try {
      await unifiedCache.delete("accessories:active");
    } catch (error) {
      logger.debug("[Cache] Failed to clear accessory cache:", error);
    }

    try {
      await emitCacheInvalidation("accessories:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  // =============================================================================
  // NAVIGATION METHODS
  // =============================================================================

  async getNavigationItems(): Promise<NavigationItem[]> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getNavigationItems();
    }
    return await db
      .select()
      .from(navigationItems)
      .where(eq(navigationItems.isActive, true))
      .orderBy(asc(navigationItems.sortOrder));
  }

  async getNavigationItem(id: number): Promise<NavigationItem | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getNavigationItem(id);
    }
    const [item] = await db.select().from(navigationItems).where(eq(navigationItems.id, id));
    return item;
  }

  async createNavigationItem(item: InsertNavigationItem): Promise<NavigationItem> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createNavigationItem(item);
    }
    const [created] = await db.insert(navigationItems).values(item).returning();
    // CHUNK 4: Removed legacy cache code - caching now handled at route level
    try {
      await emitCacheInvalidation("navigation:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
    return created!;
  }

  async updateNavigationItem(
    id: number,
    item: Partial<InsertNavigationItem>,
  ): Promise<NavigationItem | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateNavigationItem(id, item);
    }
    const [updated] = await db
      .update(navigationItems)
      .set(item)
      .where(eq(navigationItems.id, id))
      .returning();
    // CHUNK 4: Removed legacy cache code - caching now handled at route level
    try {
      await emitCacheInvalidation("navigation:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
    return updated;
  }

  async deleteNavigationItem(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteNavigationItem(id);
    }
    const result = await db.delete(navigationItems).where(eq(navigationItems.id, id));
    // CHUNK 4: Removed legacy cache code - caching now handled at route level
    try {
      await emitCacheInvalidation("navigation:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
    return (result.rowCount ?? 0) > 0;
  }

  async reorderNavigationItems(items: { id: number; sortOrder: number }[]): Promise<void> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().reorderNavigationItems(items);
    }
    // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
    await db.transaction(async (tx: any) => {
      for (const item of items) {
        await tx
          .update(navigationItems)
          .set({ sortOrder: item.sortOrder })
          .where(eq(navigationItems.id, item.id));
      }
    });

    try {
      await emitCacheInvalidation("navigation:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
  }

  async getNavigationGlassmorphismSettings(): Promise<NavigationGlassmorphismSettings | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getNavigationGlassmorphismSettings();
    }
    const [settings] = await db.select().from(navigationGlassmorphismSettings).limit(1);
    return settings;
  }

  async updateNavigationGlassmorphismSettings(
    settings: Partial<InsertNavigationGlassmorphismSettings>,
  ): Promise<NavigationGlassmorphismSettings> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateNavigationGlassmorphismSettings(settings);
    }
    const existing = await db.select().from(navigationGlassmorphismSettings).limit(1);

    let result: NavigationGlassmorphismSettings;
    if (existing.length === 0) {
      const [created] = await db
        .insert(navigationGlassmorphismSettings)
        .values(settings as InsertNavigationGlassmorphismSettings)
        .returning();
      result = created!;
    } else {
      if (existing.length > 0 && existing[0]?.id) {
        const [updated] = await db
          .update(navigationGlassmorphismSettings)
          .set(settings)
          .where(eq(navigationGlassmorphismSettings.id, existing[0].id))
          .returning();
        result = updated!;
      } else {
        result = existing[0] as NavigationGlassmorphismSettings;
      }
    }

    try {
      await emitCacheInvalidation("navigation:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return result;
  }

  // =============================================================================
  // CONTACT PAGE CONFIGURATION METHODS
  // =============================================================================

  async getContactPageConfiguration(): Promise<ContactPageConfiguration | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getContactPageConfiguration();
    }
    const [config] = await db.select().from(contactPageConfigurations).limit(1);
    return config;
  }

  async createContactPageConfiguration(
    config: InsertContactPageConfiguration,
  ): Promise<ContactPageConfiguration> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createContactPageConfiguration(config);
    }
    const [created] = await db.insert(contactPageConfigurations).values(config).returning();
    try {
      await emitCacheInvalidation("contact:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
    return created!;
  }

  async updateContactPageConfiguration(
    id: number,
    config: Partial<InsertContactPageConfiguration>,
  ): Promise<ContactPageConfiguration | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateContactPageConfiguration(id, config);
    }
    const [updated] = await db
      .update(contactPageConfigurations)
      .set(config)
      .where(eq(contactPageConfigurations.id, id))
      .returning();
    try {
      await emitCacheInvalidation("contact:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }
    return updated;
  }

  // =============================================================================
  // FOOTER CONFIGURATION METHODS
  // =============================================================================

  async getFooterConfiguration(): Promise<FooterConfiguration | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getFooterConfiguration();
    }
    // PERFORMANCE: Cache footer config for 30min (truly static content, rarely changes)
    const cacheKey = "footer:config";
    try {
      const cached = await unifiedCache.get<FooterConfiguration>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get footer config from cache:", error);
    }

    const [config] = await db.select().from(footerConfiguration).limit(1);

    if (config) {
      try {
        await unifiedCache.set(cacheKey, config, 30 * 60 * 1000, "data");
      } catch (error) {
        logger.debug("[Cache] Failed to set footer config cache:", error);
      }
    }

    return config;
  }

  async getFooterSections(): Promise<
    Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }> }>
  > {
    const config = await this.getFooterConfiguration();
    return config?.navigationColumns || [];
  }

  async createFooterLink(link: {
    label: string;
    href: string;
    external?: boolean;
  }): Promise<Result<FooterConfiguration, Error>> {
    const config = await this.getFooterConfiguration();
    if (!config) {
      return err(new Error("Footer configuration not found"));
    }

    const nav = config.navigationColumns || [];
    // Basic implementation: add to first column or create one
    if (nav.length === 0) {
      nav.push({ title: "General", links: [link] });
    } else if (nav[0]) {
      nav[0].links.push(link);
    }

    return ok(
      await this.updateFooterConfiguration({
        navigationColumns: nav,
      }),
    );
  }

  async updateFooterConfiguration(
    config: Partial<InsertFooterConfiguration>,
  ): Promise<FooterConfiguration> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateFooterConfiguration(config);
    }
    // PERFORMANCE: Invalidate 30min cache on update to prevent stale data
    try {
      await unifiedCache.delete("footer:config");
    } catch (error) {
      logger.debug("[Cache] Failed to clear footer config cache:", error);
    }

    const existing = await db.select().from(footerConfiguration).limit(1);

    // Filter out metadata fields to prevent database errors
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...safeConfig } = config as Record<string, unknown>;

    let result: FooterConfiguration;
    if (existing.length === 0) {
      const [created] = await db
        .insert(footerConfiguration)
        .values(safeConfig as InsertFooterConfiguration)
        .returning();
      result = created!;
    } else {
      if (existing.length > 0 && existing[0]?.id) {
        const [updated] = await db
          .update(footerConfiguration)
          .set({ ...config, updatedAt: sql`NOW()` })
          .where(eq(footerConfiguration.id, existing[0].id))
          .returning();
        result = updated!;
      } else {
        result = existing[0] as FooterConfiguration;
      }
    }

    try {
      await emitCacheInvalidation("footer:", "update");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return result;
  }

  // =============================================================================
  // INQUIRY METHODS
  // =============================================================================

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().createInquiry(inquiry);
    }
    const encryptedData = {
      ...inquiry,
      name: inquiry.name ? encrypt(inquiry.name) : inquiry.name,
      email: inquiry.email ? encrypt(inquiry.email) : inquiry.email,
      emailIndex: inquiry.email ? getBlindIndex(inquiry.email) : null,
      company: inquiry.company ? encrypt(inquiry.company) : inquiry.company,
      phone: inquiry.phone ? encrypt(inquiry.phone) : inquiry.phone,
      message: inquiry.message ? encrypt(inquiry.message) : inquiry.message,
    };

    const [created] = await db.insert(inquiries).values(encryptedData).returning();

    try {
      await unifiedCache.delete("inquiries:stats");
    } catch (error) {
      logger.debug("[Cache] Failed to clear inquiry cache:", error);
    }

    try {
      await emitCacheInvalidation("inquiries:", "create");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return created!;
  }

  async getInquiryById(id: number): Promise<Inquiry | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getInquiryById(id);
    }
    const [inquiry] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry ? this.decryptInquiry(inquiry) : undefined;
  }

  async listInquiries(filters: {
    page?: number | undefined;
    limit?: number | undefined;
    status?: string | undefined;
    source?: string | undefined;
    search?: string | undefined;
  }): Promise<{ inquiries: Inquiry[]; total: number }> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().listInquiries(filters);
    }
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters.status && filters.status !== "all") {
      conditions.push(eq(inquiries.status, filters.status));
    }
    if (filters.source && filters.source !== "all") {
      conditions.push(eq(inquiries.source, filters.source));
    }
    if (filters.search) {
      if (filters.search.includes("@")) {
        // Search by email blind index for precision/security
        conditions.push(eq(inquiries.emailIndex, getBlindIndex(filters.search)));
      } else {
        // Fallback or warning: like search on encrypted fields is limited
        conditions.push(
          or(
            // Note: these will effectively only match non-encrypted legacy data or Fail
            like(inquiries.name, `%${filters.search}%`),
            like(inquiries.email, `%${filters.search}%`),
            like(inquiries.message, `%${filters.search}%`),
          ),
        );
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [results, totalResult] = await Promise.all([
      db
        .select()
        .from(inquiries)
        .where(whereClause)
        .orderBy(desc(inquiries.submittedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(inquiries).where(whereClause),
    ]);

    return {
      // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
      inquiries: results.map((inq: any) => this.decryptInquiry(inq)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async updateInquiry(id: number, data: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().updateInquiry(id, data);
    }
    const updateData: Partial<InsertInquiry> = { ...data };

    if (data.status === "read" || data.status === "responded") {
      updateData.respondedAt = sql`NOW()` as unknown as Date;
    }

    const [updated] = await db
      .update(inquiries)
      .set({ ...updateData, updatedAt: sql`NOW()` as unknown as Date } as Partial<InsertInquiry>)
      .where(eq(inquiries.id, id))
      .returning();

    if (updated) {
      try {
        await unifiedCache.delete("inquiries:stats");
      } catch (error) {
        logger.debug("[Cache] Failed to clear inquiry cache:", error);
      }

      try {
        await emitCacheInvalidation("inquiries:", "update");
      } catch (error) {
        logger.debug("[Cache] Failed to emit invalidation event:", error);
      }

      return this.decryptInquiry(updated as unknown as Inquiry);
    }
    return undefined;
  }

  async addCrmLog(
    id: number,
    log: { action: string; note: string; user?: string },
  ): Promise<Inquiry | undefined> {
    const inquiry = await this.getInquiryById(id);
    if (!inquiry) return undefined;

    const logs = [...(inquiry.crmLogs || [])];
    logs.unshift({
      date: new Date().toISOString(),
      ...log,
    });

    return await this.updateInquiry(id, { crmLogs: logs });
  }

  async deleteInquiry(id: number): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().deleteInquiry(id);
    }
    const result = await db.delete(inquiries).where(eq(inquiries.id, id));

    try {
      await unifiedCache.delete("inquiries:stats");
    } catch (error) {
      logger.debug("[Cache] Failed to clear inquiry cache:", error);
    }

    try {
      await emitCacheInvalidation("inquiries:", "delete");
    } catch (error) {
      logger.debug("[Cache] Failed to emit invalidation event:", error);
    }

    return (result.rowCount ?? 0) > 0;
  }

  async getInquiryStats(): Promise<{
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    recentCount: number;
  }> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().getInquiryStats();
    }
    const cacheKey = "inquiries:stats";
    try {
      const cached = await unifiedCache.get<{
        byStatus: Record<string, number>;
        bySource: Record<string, number>;
        recentCount: number;
      }>(cacheKey, "data");
      if (cached) {
        return cached;
      }
    } catch (error) {
      logger.debug("[Cache] Failed to get inquiry stats from cache:", error);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [statusStats, sourceStats, recentStats] = await Promise.all([
      db
        .select({
          status: inquiries.status,
          count: count(),
        })
        .from(inquiries)
        .groupBy(inquiries.status),

      db
        .select({
          source: inquiries.source,
          count: count(),
        })
        .from(inquiries)
        .groupBy(inquiries.source),

      db
        .select({ count: count() })
        .from(inquiries)
        .where(sql`${inquiries.submittedAt} >= ${sevenDaysAgo}`),
    ]);

    const byStatus: Record<string, number> = {};
    // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
    statusStats.forEach((stat: any) => {
      byStatus[stat.status] = stat.count;
    });

    const bySource: Record<string, number> = {};
    // biome-ignore lint/suspicious/noExplicitAny: bypass complex rhf type inference conflict
    sourceStats.forEach((stat: any) => {
      bySource[stat.source] = stat.count;
    });

    const recentCount = recentStats[0]?.count ?? 0;

    const stats = { byStatus, bySource, recentCount };

    try {
      await unifiedCache.set(cacheKey, stats, 5 * 60 * 1000, "data");
    } catch (error) {
      logger.debug("[Cache] Failed to set cache:", error);
    }

    return stats;
  }

  /**
   * Subscribe an email to the newsletter
   */
  async subscribeToNewsletter(email: string): Promise<boolean> {
    if (StorageSingleton.hasInstance()) {
      return StorageSingleton.getInstance().subscribeToNewsletter(email);
    }
    const encryptedEmail = encrypt(email);
    const index = getBlindIndex(email);
    try {
      const result = await db
        .insert(newsletterSubscribers)
        .values({
          email: encryptedEmail,
          emailIndex: index,
        })
        .onConflictDoNothing()
        .returning();
      return result.length > 0;
    } catch (error) {
      logger.error("Failed to subscribe to newsletter", { email, error });
      return false;
    }
  }

  private decryptInquiry(inquiry: Inquiry): Inquiry {
    try {
      return {
        ...inquiry,
        email: inquiry.email ? this.safeDecrypt(inquiry.email) : inquiry.email,
        name: inquiry.name ? this.safeDecrypt(inquiry.name) : inquiry.name,
        company: inquiry.company ? this.safeDecrypt(inquiry.company) : inquiry.company,
        phone: inquiry.phone ? this.safeDecrypt(inquiry.phone) : inquiry.phone,
        message: inquiry.message ? this.safeDecrypt(inquiry.message) : inquiry.message,
      };
    } catch (error) {
      logger.error(`[MiscRepository] Failed to decrypt inquiry ${inquiry.id}:`, error);
      return inquiry;
    }
  }

  private safeDecrypt(value: string): string {
    if (!value?.includes(":")) return value;
    try {
      return decrypt(value);
    } catch {
      return value;
    }
  }
}
