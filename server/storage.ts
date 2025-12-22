import type {
  AboutHero,
  AboutMapLocation,
  AboutSection,
  AboutStatistic,
  AboutTeamMessage,
  AboutTimelineEntry,
  Accessory,
  AnimationError,
  AuditLog,
  Category,
  Certificate,
  ContactPageConfiguration,
  Fabric,
  Fiber,
  Folder,
  FooterConfiguration,
  HomepageHero,
  HomepageProcessCard,
  HomepageSection,
  HomepageSlogan,
  Inquiry,
  InsertAboutHero,
  InsertAboutMapLocation,
  InsertAboutSection,
  InsertAboutStatistic,
  InsertAboutTeamMessage,
  InsertAboutTimelineEntry,
  InsertAccessory,
  InsertAnimationError,
  InsertCategory,
  InsertCertificate,
  InsertContactPageConfiguration,
  InsertFabric,
  InsertFiber,
  InsertFolder,
  InsertFooterConfiguration,
  InsertHomepageHero,
  InsertHomepageProcessCard,
  InsertHomepageSection,
  InsertHomepageSlogan,
  InsertInquiry,
  InsertLogoAnimationSettings,
  InsertManufacturingCapability,
  InsertManufacturingHero,
  InsertManufacturingProcess,
  InsertManufacturingQuality,
  InsertMediaAsset,
  InsertNavigationGlassmorphismSettings,
  InsertNavigationItem,
  InsertPerformanceMetric,
  InsertProduct,
  InsertSizeChart,
  InsertStorageAnalysisResult,
  InsertStorageChangeLog,
  InsertSustainabilityGoal,
  InsertSustainabilityHero,
  InsertSustainabilityInitiative,
  InsertSustainabilityMetric,
  InsertTechnologyCta,
  InsertTechnologyEquipment,
  InsertTechnologyGradientSettings,
  InsertTechnologyHero,
  InsertTechnologyInnovation,
  InsertTechnologyResearch,
  InsertTechnologyRoadmap,
  InsertUnifiedSustainability,
  LogoAnimationSettings,
  ManufacturingCapability,
  ManufacturingHero,
  ManufacturingProcess,
  ManufacturingQuality,
  MediaAsset,
  NavigationGlassmorphismSettings,
  NavigationItem,
  PerformanceMetric,
  Product,
  SizeChart,
  StorageAnalysisResult,
  StorageChangeLog,
  SustainabilityGoal,
  SustainabilityHero,
  SustainabilityInitiative,
  SustainabilityMetric,
  TechnologyCta,
  TechnologyEquipment,
  TechnologyGradientSettings,
  TechnologyHero,
  TechnologyInnovation,
  TechnologyResearch,
  TechnologyRoadmap,
  UnifiedSustainability,
  UpsertUser,
  User,
} from "../shared/schema.js";
import type { ProductDetail, ProductSummary } from "./lib/repositories/product-repository.js";

export interface IStorage {
  // =============================================================================
  // USER OPERATIONS (Required for Replit Auth)
  // Reference: https://docs.replit.com/hosting/deployments/replit-authn
  // ✓ CHECKPOINT: PHASE-4-STORAGE-INTERFACE
  // =============================================================================
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category methods (CHUNK 5: Enhanced with pagination support)
  getCategories(limit?: number, offset?: number): Promise<Category[]>;
  getCategoriesCount(): Promise<number>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getDeletedCategories(): Promise<Category[]>;

  // Fiber methods
  getFibers(): Promise<Fiber[]>;
  getFiber(id: number): Promise<Fiber | undefined>;
  createFiber(fiber: InsertFiber): Promise<Fiber>;
  updateFiber(id: number, fiber: Partial<InsertFiber>): Promise<Fiber | undefined>;
  deleteFiber(id: number): Promise<boolean>;

  // Fabric methods
  getFabrics(): Promise<Fabric[]>;
  getFabric(id: number): Promise<Fabric | undefined>;
  createFabric(fabric: InsertFabric): Promise<Fabric>;
  updateFabric(id: number, fabric: Partial<InsertFabric>): Promise<Fabric | undefined>;
  deleteFabric(id: number): Promise<boolean>;

  // Certificate methods
  getCertificates(): Promise<Certificate[]>;
  getCertificate(id: number): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(
    id: number,
    certificate: Partial<InsertCertificate>,
  ): Promise<Certificate | undefined>;
  deleteCertificate(id: number): Promise<boolean>;

  // Size Chart methods
  getSizeCharts(): Promise<SizeChart[]>;
  getSizeChart(id: number): Promise<SizeChart | undefined>;
  createSizeChart(sizeChart: InsertSizeChart): Promise<SizeChart>;
  updateSizeChart(id: number, sizeChart: Partial<InsertSizeChart>): Promise<SizeChart | undefined>;
  deleteSizeChart(id: number): Promise<boolean>;

  // Accessory methods
  getAccessories(): Promise<Accessory[]>;
  getAccessory(id: number): Promise<Accessory | undefined>;
  createAccessory(accessory: InsertAccessory): Promise<Accessory>;
  updateAccessory(id: number, accessory: Partial<InsertAccessory>): Promise<Accessory | undefined>;
  deleteAccessory(id: number): Promise<boolean>;

  // Folder methods (NEW - Hierarchical folder structure)
  getFolders(): Promise<Folder[]>;
  getFolder(id: number): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, folder: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  getFoldersByParent(parentId: number | null): Promise<Folder[]>;
  getFolderPath(folderId: number): Promise<string>;
  getFolderChildren(folderId: number): Promise<Folder[]>;

  // Media Asset methods (CHUNK 5: Enhanced with pagination support & filtering)
  getMediaAssets(
    limit?: number,
    offset?: number,
    filters?: { type?: string; search?: string; folderId?: number },
  ): Promise<MediaAsset[]>;
  getMediaAssetsCount(filters?: {
    type?: string;
    search?: string;
    folderId?: number;
  }): Promise<number>;
  getMediaAssetsWithCount(
    limit?: number,
    offset?: number,
    filters?: { type?: string; search?: string; folderId?: number },
  ): Promise<{ assets: MediaAsset[]; total: number }>;
  getMediaAsset(id: number): Promise<MediaAsset | undefined>;
  createMediaAsset(mediaAsset: InsertMediaAsset): Promise<MediaAsset>;
  updateMediaAsset(
    id: number,
    mediaAsset: Partial<InsertMediaAsset>,
  ): Promise<MediaAsset | undefined>;
  deleteMediaAsset(id: number): Promise<boolean>;
  getMediaAssetsByFolder(folderId: number | null): Promise<MediaAsset[]>;
  moveMediaAsset(id: number, targetFolderId: number | null): Promise<MediaAsset | undefined>;

  // Product methods (CHUNK 5: Enhanced with pagination support)
  getProducts(limit?: number, offset?: number): Promise<ProductSummary[]>;
  getHomepageFeaturedProducts(limit?: number): Promise<Partial<Product>[]>; // PHASE 2D: Lightweight homepage query
  getProductsSummary(
    limit?: number,
    offset?: number,
  ): Promise<{ products: Partial<Product>[]; totalCount: number }>; // CHUNK 24-R + 27-R: 7 columns + count in one query
  getProductsCount(): Promise<number>;
  getProductsByCategoryCount(categoryId: number): Promise<number>;
  getProductsByTagCount(tag: string): Promise<number>;
  get3DModelMetadata(productId: number): Promise<any | null>; // PHASE 4: Lazy 3D model metadata endpoint
  searchProductsCount(query: string): Promise<number>;
  getProduct(id: number): Promise<ProductDetail | undefined>;
  getProductsByCategory(
    categoryId: number,
    limit?: number,
    offset?: number,
  ): Promise<ProductSummary[]>;
  getProductBySlug(slug: string): Promise<ProductDetail | undefined>;
  getProductByPath(urlPath: string): Promise<any>;
  getProductsByTag(tag: string, limit?: number, offset?: number): Promise<ProductSummary[]>;
  getRelatedProducts(productId: number): Promise<ProductSummary[]>;
  getActiveProducts(): Promise<ProductSummary[]>;
  getFeaturedProducts(): Promise<ProductSummary[]>;
  searchProducts(query: string, limit?: number, offset?: number): Promise<ProductSummary[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Navigation methods
  getNavigationItems(): Promise<NavigationItem[]>;
  getNavigationItem(id: number): Promise<NavigationItem | undefined>;
  createNavigationItem(navigationItem: InsertNavigationItem): Promise<NavigationItem>;
  updateNavigationItem(
    id: number,
    navigationItem: Partial<InsertNavigationItem>,
  ): Promise<NavigationItem | undefined>;
  deleteNavigationItem(id: number): Promise<boolean>;

  // Navigation Glassmorphism Settings methods
  getNavigationGlassmorphismSettings(): Promise<NavigationGlassmorphismSettings | undefined>;
  updateNavigationGlassmorphismSettings(
    settings: Partial<InsertNavigationGlassmorphismSettings>,
  ): Promise<NavigationGlassmorphismSettings>;

  // Contact Page Configuration methods
  getContactPageConfiguration(): Promise<ContactPageConfiguration | undefined>;
  createContactPageConfiguration(
    config: InsertContactPageConfiguration,
  ): Promise<ContactPageConfiguration>;
  updateContactPageConfiguration(
    id: number,
    config: Partial<InsertContactPageConfiguration>,
  ): Promise<ContactPageConfiguration | undefined>;

  // Inquiry methods
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiryById(id: number): Promise<Inquiry | undefined>;
  listInquiries(filters: {
    page?: number;
    limit?: number;
    status?: string;
    source?: string;
    search?: string;
  }): Promise<{ inquiries: Inquiry[]; total: number }>;
  updateInquiryStatus(
    id: number,
    status: string,
    adminNotes?: string,
  ): Promise<Inquiry | undefined>;
  deleteInquiry(id: number): Promise<boolean>;
  getInquiryStats(): Promise<{
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    recentCount: number;
  }>;

  // Homepage methods
  getHomepageHero(): Promise<HomepageHero | undefined>;
  updateHomepageHero(hero: Partial<InsertHomepageHero>): Promise<HomepageHero>;
  getHomepageSlogans(): Promise<HomepageSlogan[]>;
  getHomepageSlogan(id: number): Promise<HomepageSlogan | undefined>;
  createHomepageSlogan(slogan: InsertHomepageSlogan): Promise<HomepageSlogan>;
  updateHomepageSlogan(
    id: number,
    slogan: Partial<InsertHomepageSlogan>,
  ): Promise<HomepageSlogan | undefined>;
  deleteHomepageSlogan(id: number): Promise<boolean>;
  reorderHomepageSlogans(slogans: { id: number; position: number }[]): Promise<void>;
  getHomepageProcessCards(includeInactive?: boolean): Promise<HomepageProcessCard[]>;
  getHomepageProcessCard(id: number): Promise<HomepageProcessCard | undefined>;
  createHomepageProcessCard(card: InsertHomepageProcessCard): Promise<HomepageProcessCard>;
  updateHomepageProcessCard(
    id: number,
    card: Partial<InsertHomepageProcessCard>,
  ): Promise<HomepageProcessCard | undefined>;
  deleteHomepageProcessCard(id: number): Promise<boolean>;
  reorderHomepageProcessCards(cards: { id: number; position: number }[]): Promise<void>;
  getHomepageSections(includeInactive?: boolean): Promise<HomepageSection[]>;
  getHomepageSection(name: string): Promise<HomepageSection | undefined>;
  getHomepageSectionById(id: number): Promise<HomepageSection | undefined>;
  updateHomepageSection(
    name: string,
    section: Partial<InsertHomepageSection>,
  ): Promise<HomepageSection>;
  updateHomepageSectionById(
    id: number,
    section: Partial<InsertHomepageSection>,
  ): Promise<HomepageSection | undefined>;

  // Logo Animation methods
  getLogoAnimationSettings(): Promise<LogoAnimationSettings | undefined>;
  updateLogoAnimationSettings(
    settings: Partial<InsertLogoAnimationSettings>,
  ): Promise<LogoAnimationSettings>;

  // About Us Hero methods
  getAboutHero(): Promise<AboutHero | undefined>;
  updateAboutHero(hero: Partial<InsertAboutHero>): Promise<AboutHero>;

  // About Us Timeline methods
  getAboutTimelineEntries(): Promise<AboutTimelineEntry[]>;
  getAboutTimelineEntry(id: number): Promise<AboutTimelineEntry | undefined>;
  createAboutTimelineEntry(entry: InsertAboutTimelineEntry): Promise<AboutTimelineEntry>;
  updateAboutTimelineEntry(
    id: number,
    entry: Partial<InsertAboutTimelineEntry>,
  ): Promise<AboutTimelineEntry | undefined>;
  deleteAboutTimelineEntry(id: number): Promise<boolean>;
  reorderAboutTimelineEntries(entries: { id: number; position: number }[]): Promise<void>;

  // About Us Map Location methods
  getAboutMapLocations(): Promise<AboutMapLocation[]>;
  getAboutMapLocation(id: number): Promise<AboutMapLocation | undefined>;
  createAboutMapLocation(location: InsertAboutMapLocation): Promise<AboutMapLocation>;
  updateAboutMapLocation(
    id: number,
    location: Partial<InsertAboutMapLocation>,
  ): Promise<AboutMapLocation | undefined>;
  deleteAboutMapLocation(id: number): Promise<boolean>;

  // About Us Section methods
  getAboutSections(): Promise<AboutSection[]>;
  getAboutSection(id: number): Promise<AboutSection | undefined>;
  createAboutSection(section: InsertAboutSection): Promise<AboutSection>;
  updateAboutSection(
    id: number,
    section: Partial<InsertAboutSection>,
  ): Promise<AboutSection | undefined>;
  deleteAboutSection(id: number): Promise<boolean>;
  reorderAboutSections(sections: { id: number; position: number }[]): Promise<void>;

  // About Us Statistic methods
  getAboutStatistics(): Promise<AboutStatistic[]>;
  getAboutStatistic(id: number): Promise<AboutStatistic | undefined>;
  createAboutStatistic(statistic: InsertAboutStatistic): Promise<AboutStatistic>;
  updateAboutStatistic(
    id: number,
    statistic: Partial<InsertAboutStatistic>,
  ): Promise<AboutStatistic | undefined>;
  deleteAboutStatistic(id: number): Promise<boolean>;
  reorderAboutStatistics(statistics: { id: number; position: number }[]): Promise<void>;

  // About Us Team Message methods
  getAboutTeamMessage(): Promise<AboutTeamMessage | undefined>;
  updateAboutTeamMessage(message: Partial<InsertAboutTeamMessage>): Promise<AboutTeamMessage>;

  // Sustainability Page methods
  getSustainabilityHero(): Promise<SustainabilityHero | undefined>;
  updateSustainabilityHero(hero: Partial<InsertSustainabilityHero>): Promise<SustainabilityHero>;

  getSustainabilityMetrics(): Promise<SustainabilityMetric[]>;
  getSustainabilityMetric(id: number): Promise<SustainabilityMetric | undefined>;
  createSustainabilityMetric(metric: InsertSustainabilityMetric): Promise<SustainabilityMetric>;
  updateSustainabilityMetric(
    id: number,
    metric: Partial<InsertSustainabilityMetric>,
  ): Promise<SustainabilityMetric | undefined>;
  deleteSustainabilityMetric(id: number): Promise<boolean>;
  reorderSustainabilityMetrics(metrics: { id: number; position: number }[]): Promise<void>;

  getSustainabilityInitiatives(): Promise<SustainabilityInitiative[]>;
  getSustainabilityInitiative(id: number): Promise<SustainabilityInitiative | undefined>;
  createSustainabilityInitiative(
    initiative: InsertSustainabilityInitiative,
  ): Promise<SustainabilityInitiative>;
  updateSustainabilityInitiative(
    id: number,
    initiative: Partial<InsertSustainabilityInitiative>,
  ): Promise<SustainabilityInitiative | undefined>;
  deleteSustainabilityInitiative(id: number): Promise<boolean>;
  reorderSustainabilityInitiatives(initiatives: { id: number; position: number }[]): Promise<void>;

  getSustainabilityGoals(): Promise<SustainabilityGoal[]>;
  getSustainabilityGoal(id: number): Promise<SustainabilityGoal | undefined>;
  createSustainabilityGoal(goal: InsertSustainabilityGoal): Promise<SustainabilityGoal>;
  updateSustainabilityGoal(
    id: number,
    goal: Partial<InsertSustainabilityGoal>,
  ): Promise<SustainabilityGoal | undefined>;
  deleteSustainabilityGoal(id: number): Promise<boolean>;
  reorderSustainabilityGoals(goals: { id: number; position: number }[]): Promise<void>;

  // Unified Sustainability methods (consolidates all sustainability data)
  getUnifiedSustainability(): Promise<UnifiedSustainability | undefined>;
  updateUnifiedSustainability(
    data: Partial<InsertUnifiedSustainability>,
  ): Promise<UnifiedSustainability>;
  migrateLegacySustainabilityData(): Promise<UnifiedSustainability>;

  // Manufacturing Page methods
  getManufacturingHero(): Promise<ManufacturingHero | undefined>;
  updateManufacturingHero(hero: Partial<InsertManufacturingHero>): Promise<ManufacturingHero>;

  getManufacturingProcesses(): Promise<ManufacturingProcess[]>;
  getManufacturingProcess(id: number): Promise<ManufacturingProcess | undefined>;
  createManufacturingProcess(process: InsertManufacturingProcess): Promise<ManufacturingProcess>;
  updateManufacturingProcess(
    id: number,
    process: Partial<InsertManufacturingProcess>,
  ): Promise<ManufacturingProcess | undefined>;
  deleteManufacturingProcess(id: number): Promise<boolean>;
  reorderManufacturingProcesses(processes: { id: number; position: number }[]): Promise<void>;

  getManufacturingCapabilities(): Promise<ManufacturingCapability[]>;
  getManufacturingCapability(id: number): Promise<ManufacturingCapability | undefined>;
  createManufacturingCapability(
    capability: InsertManufacturingCapability,
  ): Promise<ManufacturingCapability>;
  updateManufacturingCapability(
    id: number,
    capability: Partial<InsertManufacturingCapability>,
  ): Promise<ManufacturingCapability | undefined>;
  deleteManufacturingCapability(id: number): Promise<boolean>;
  reorderManufacturingCapabilities(capabilities: { id: number; position: number }[]): Promise<void>;

  getManufacturingQualities(): Promise<ManufacturingQuality[]>;
  getManufacturingQuality(id: number): Promise<ManufacturingQuality | undefined>;
  createManufacturingQuality(quality: InsertManufacturingQuality): Promise<ManufacturingQuality>;
  updateManufacturingQuality(
    id: number,
    quality: Partial<InsertManufacturingQuality>,
  ): Promise<ManufacturingQuality | undefined>;
  deleteManufacturingQuality(id: number): Promise<boolean>;
  reorderManufacturingQualities(qualities: { id: number; position: number }[]): Promise<void>;

  // Technology Page methods
  getTechnologyHero(): Promise<TechnologyHero | undefined>;
  updateTechnologyHero(hero: Partial<InsertTechnologyHero>): Promise<TechnologyHero>;

  getTechnologyInnovations(): Promise<TechnologyInnovation[]>;
  getTechnologyInnovation(id: number): Promise<TechnologyInnovation | undefined>;
  createTechnologyInnovation(innovation: InsertTechnologyInnovation): Promise<TechnologyInnovation>;
  updateTechnologyInnovation(
    id: number,
    innovation: Partial<InsertTechnologyInnovation>,
  ): Promise<TechnologyInnovation | undefined>;
  deleteTechnologyInnovation(id: number): Promise<boolean>;
  reorderTechnologyInnovations(innovations: { id: number; position: number }[]): Promise<void>;

  getTechnologyEquipment(): Promise<TechnologyEquipment[]>;
  getTechnologyEquipmentItem(id: number): Promise<TechnologyEquipment | undefined>;
  createTechnologyEquipment(equipment: InsertTechnologyEquipment): Promise<TechnologyEquipment>;
  updateTechnologyEquipment(
    id: number,
    equipment: Partial<InsertTechnologyEquipment>,
  ): Promise<TechnologyEquipment | undefined>;
  deleteTechnologyEquipment(id: number): Promise<boolean>;
  reorderTechnologyEquipment(equipment: { id: number; position: number }[]): Promise<void>;

  getTechnologyResearch(): Promise<TechnologyResearch[]>;
  getTechnologyResearchItem(id: number): Promise<TechnologyResearch | undefined>;
  createTechnologyResearch(research: InsertTechnologyResearch): Promise<TechnologyResearch>;
  updateTechnologyResearch(
    id: number,
    research: Partial<InsertTechnologyResearch>,
  ): Promise<TechnologyResearch | undefined>;
  deleteTechnologyResearch(id: number): Promise<boolean>;
  reorderTechnologyResearch(research: { id: number; position: number }[]): Promise<void>;

  getTechnologyRoadmap(): Promise<TechnologyRoadmap[]>;
  getTechnologyRoadmapItem(id: number): Promise<TechnologyRoadmap | undefined>;
  createTechnologyRoadmap(roadmap: InsertTechnologyRoadmap): Promise<TechnologyRoadmap>;
  updateTechnologyRoadmap(
    id: number,
    roadmap: Partial<InsertTechnologyRoadmap>,
  ): Promise<TechnologyRoadmap | undefined>;
  deleteTechnologyRoadmap(id: number): Promise<boolean>;
  reorderTechnologyRoadmap(roadmap: { id: number; position: number }[]): Promise<void>;

  // Technology Page Gradient Settings methods
  getTechnologyGradientSettings(): Promise<TechnologyGradientSettings | undefined>;
  updateTechnologyGradientSettings(
    settings: Partial<InsertTechnologyGradientSettings>,
  ): Promise<TechnologyGradientSettings>;
  migrateGradientSettingsToSpecification(): Promise<any>;

  // Technology Page CTA Section methods
  getTechnologyCta(): Promise<TechnologyCta | undefined>;
  updateTechnologyCta(cta: Partial<InsertTechnologyCta>): Promise<TechnologyCta>;
  createTechnologyCta(cta: InsertTechnologyCta): Promise<TechnologyCta>;

  // Animation Error Logging methods
  getAnimationErrors(): Promise<AnimationError[]>;
  getAnimationError(id: number): Promise<AnimationError | undefined>;
  createAnimationError(error: InsertAnimationError): Promise<AnimationError>;
  updateAnimationError(
    id: number,
    error: Partial<InsertAnimationError>,
  ): Promise<AnimationError | undefined>;
  deleteAnimationError(id: number): Promise<boolean>;
  getUnresolvedAnimationErrors(): Promise<AnimationError[]>;
  markAnimationErrorResolved(id: number): Promise<boolean>;

  // Performance Metrics methods
  getPerformanceMetrics(): Promise<PerformanceMetric[]>;
  getPerformanceMetric(id: number): Promise<PerformanceMetric | undefined>;
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;
  deletePerformanceMetric(id: number): Promise<boolean>;
  getPerformanceMetricsByType(metricType: string): Promise<PerformanceMetric[]>;
  getPerformanceMetricsByComponent(componentName: string): Promise<PerformanceMetric[]>;
  getRecentPerformanceMetrics(hours: number): Promise<PerformanceMetric[]>;

  // Storage Analysis Results methods
  getStorageAnalysisResults(): Promise<StorageAnalysisResult[]>;
  addStorageAnalysisResult(result: InsertStorageAnalysisResult): Promise<StorageAnalysisResult>;
  deleteStorageAnalysisResult(id: number): Promise<boolean>;

  // Storage Change Logs methods
  getStorageChangeLogs(): Promise<StorageChangeLog[]>;
  addStorageChangeLog(changeLog: InsertStorageChangeLog): Promise<StorageChangeLog>;
  deleteStorageChangeLog(id: number): Promise<boolean>;

  // SOFT DELETE: Public soft delete methods for enterprise features
  // Category soft delete methods
  getCategoriesIncludingDeleted(): Promise<Category[]>;
  restoreCategory(id: number): Promise<boolean>;
  permanentlyDeleteCategory(id: number): Promise<boolean>;

  // Product soft delete methods
  getProductsIncludingDeleted(): Promise<Product[]>;
  restoreProduct(id: number): Promise<boolean>;
  permanentlyDeleteProduct(id: number): Promise<boolean>;

  // Media Asset soft delete methods
  getMediaAssetsIncludingDeleted(): Promise<MediaAsset[]>;
  restoreMediaAsset(id: number): Promise<boolean>;
  permanentlyDeleteMediaAsset(id: number): Promise<boolean>;

  // Fabric soft delete methods
  getFabricsIncludingDeleted(): Promise<Fabric[]>;
  restoreFabric(id: number): Promise<boolean>;
  permanentlyDeleteFabric(id: number): Promise<boolean>;

  // Fiber soft delete methods
  getFibersIncludingDeleted(): Promise<Fiber[]>;
  restoreFiber(id: number): Promise<boolean>;
  permanentlyDeleteFiber(id: number): Promise<boolean>;

  // Certificate soft delete methods
  getCertificatesIncludingDeleted(): Promise<Certificate[]>;
  restoreCertificate(id: number): Promise<boolean>;
  permanentlyDeleteCertificate(id: number): Promise<boolean>;

  // Size Chart soft delete methods
  getSizeChartsIncludingDeleted(): Promise<SizeChart[]>;
  restoreSizeChart(id: number): Promise<boolean>;
  permanentlyDeleteSizeChart(id: number): Promise<boolean>;

  // Accessory soft delete methods
  getAccessoriesIncludingDeleted(): Promise<Accessory[]>;
  restoreAccessory(id: number): Promise<boolean>;
  permanentlyDeleteAccessory(id: number): Promise<boolean>;

  // Navigation Item soft delete methods
  getNavigationItemsIncludingDeleted(): Promise<NavigationItem[]>;
  restoreNavigationItem(id: number): Promise<boolean>;
  permanentlyDeleteNavigationItem(id: number): Promise<boolean>;

  // Missing Homepage Featured Products Settings methods (causing TypeScript errors)
  getHomepageFeaturedProductsSettings(): Promise<Record<string, unknown>>;
  updateHomepageFeaturedProductsSettings(
    settings: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;

  // Additional missing storage methods (fixing remaining TypeScript errors)
  getMediaAssetsByIds(ids: string[]): Promise<MediaAsset[]>;

  // Batch update methods for N+1 optimization (Phase 5B)
  updateMediaAssetsFolder(ids: number[], folderId: number | null): Promise<number>;
  updateMediaAssetsTags(updates: Array<{ id: number; tags: string[] }>): Promise<number>;

  validateSustainabilitySync(): Promise<{
    success: boolean;
    issues?: string[];
  }>;
  syncUnifiedSustainabilityCollections(): Promise<{
    success: boolean;
    count: number;
  }>;
  getSustainabilitySectionHeaders(): Promise<unknown[]>;
  updateSustainabilitySectionHeaders(headers: unknown[]): Promise<unknown[]>;
  getSustainabilityFeatures(): Promise<unknown>;
  updateSustainabilityFeatures(features: unknown): Promise<unknown>;
  getSustainabilityFabricPortfolio(): Promise<unknown>;
  updateSustainabilityFabricPortfolio(portfolio: unknown): Promise<unknown>;
  getSustainabilityCallToAction(): Promise<unknown>;
  updateSustainabilityCallToAction(cta: unknown): Promise<unknown>;

  // AUDIT TRAIL: Enterprise audit trail methods (Phase 2.2)
  getAuditLogsForRecord(tableName: string, recordId: string): Promise<AuditLog[]>;
  getRecentAuditLogs(limit?: number): Promise<AuditLog[]>;
  setAuditTrailEnabled(enabled: boolean): void;
  configureTrackedTables(tables: string[]): void;

  // Database integrity methods
  repairDatabaseIntegrity(): Promise<{
    validated: number;
    repaired: number;
    removed: number;
  }>;

  // Database cleanup method - removes orphaned/corrupt entries
  cleanupAllCorruptEntries(): Promise<{
    totalCleaned: number;
    results: Record<string, any>;
  }>;

  // Backfill support methods for emergency thumbnail generation
  getAssetsNeedingThumbnails(): Promise<MediaAsset[]>;
  downloadAssetBuffer(id: number): Promise<Buffer | null>;
  updateAssetThumbnail(id: number, thumbnailFilename: string): Promise<boolean>;

  // Migration utilities (internal) - scoped to specific types for type safety
  getAllByType(type: "mediaAssets"): Promise<MediaAsset[]>;
  update(
    type: "mediaAssets",
    id: number,
    updates: Partial<MediaAsset>,
  ): Promise<MediaAsset | undefined>;

  // Footer Configuration methods
  getFooterConfiguration(): Promise<FooterConfiguration | undefined>;
  updateFooterConfiguration(
    config: Partial<InsertFooterConfiguration>,
  ): Promise<FooterConfiguration>;

  // CHUNK 8: Database health check method
  checkDatabaseHealth(): Promise<{ healthy: boolean; latency: number }>;
}

// Use DirectPostgreSQLStorage singleton for consistent NEON database access
import { getStorage } from "./lib/storage-singleton.js";

export const storage = getStorage();
