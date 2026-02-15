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
  HomepageSustainability,
  Inquiry,
  InsertAboutHero,
  InsertAboutMapLocation,
  InsertAboutSection,
  InsertAboutStatistic,
  InsertAboutTeamMessage,
  InsertAboutTimelineEntry,
  InsertAccessory,
  InsertAnimationError,
  InsertBlogCategory,
  InsertBlogPost,
  InsertCategory,
  InsertCertificate,
  InsertContactPageConfiguration,
  InsertFabric,
  InsertFiber,
  InsertFolder,
  InsertHomepageHero,
  InsertHomepageProcessCard,
  InsertHomepageSection,
  InsertHomepageSlogan,
  InsertHomepageSustainability,
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
  BlogPost,
  BlogCategory,
} from "../../shared/schema.js";
import type { RepositoryCacheOptions } from "../lib/cache/cache-strategies.js";
import type {
  ProductDetail,
  ProductDetailWithContext,
  ProductSummary,
} from "../lib/db/repositories/product-repository.js";

// User Repository
export interface IUserRepository {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
}

// Category Repository
export interface ICategoryRepository {
  getCategories(limit?: number, offset?: number): Promise<Category[]>;
  getCategoriesCount(): Promise<number>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getCategoriesIncludingDeleted(limit?: number, offset?: number): Promise<Category[]>;
  restoreCategory(id: number): Promise<boolean>;
  permanentlyDeleteCategory(id: number): Promise<boolean>;
}

// Product Attribute Repositories
export interface IFiberRepository {
  getFibers(): Promise<Fiber[]>;
  getFiber(id: number): Promise<Fiber | undefined>;
  createFiber(fiber: InsertFiber): Promise<Fiber>;
  updateFiber(id: number, fiber: Partial<InsertFiber>): Promise<Fiber | undefined>;
  deleteFiber(id: number): Promise<boolean>;
  getFibersIncludingDeleted(): Promise<Fiber[]>;
  restoreFiber(id: number): Promise<boolean>;
  permanentlyDeleteFiber(id: number): Promise<boolean>;
}

export interface IFabricRepository {
  getFabrics(): Promise<Fabric[]>;
  getFabric(id: number): Promise<Fabric | undefined>;
  createFabric(fabric: InsertFabric): Promise<Fabric>;
  updateFabric(id: number, fabric: Partial<InsertFabric>): Promise<Fabric | undefined>;
  deleteFabric(id: number): Promise<boolean>;
  getFabricsIncludingDeleted(limit?: number, offset?: number): Promise<Fabric[]>;
  restoreFabric(id: number): Promise<boolean>;
  permanentlyDeleteFabric(id: number): Promise<boolean>;
}

export interface ICertificateRepository {
  getCertificates(): Promise<Certificate[]>;
  getCertificate(id: number): Promise<Certificate | undefined>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificate(
    id: number,
    certificate: Partial<InsertCertificate>,
  ): Promise<Certificate | undefined>;
  deleteCertificate(id: number): Promise<boolean>;
  getCertificatesIncludingDeleted(): Promise<Certificate[]>;
  restoreCertificate(id: number): Promise<boolean>;
  permanentlyDeleteCertificate(id: number): Promise<boolean>;
}

export interface ISizeChartRepository {
  getSizeCharts(): Promise<SizeChart[]>;
  getSizeChart(id: number): Promise<SizeChart | undefined>;
  createSizeChart(sizeChart: InsertSizeChart): Promise<SizeChart>;
  updateSizeChart(id: number, sizeChart: Partial<InsertSizeChart>): Promise<SizeChart | undefined>;
  deleteSizeChart(id: number): Promise<boolean>;
  getSizeChartsIncludingDeleted(): Promise<SizeChart[]>;
  restoreSizeChart(id: number): Promise<boolean>;
  permanentlyDeleteSizeChart(id: number): Promise<boolean>;
}

export interface IAccessoryRepository {
  getAccessories(): Promise<Accessory[]>;
  getAccessory(id: number): Promise<Accessory | undefined>;
  createAccessory(accessory: InsertAccessory): Promise<Accessory>;
  updateAccessory(id: number, accessory: Partial<InsertAccessory>): Promise<Accessory | undefined>;
  deleteAccessory(id: number): Promise<boolean>;
  getAccessoriesIncludingDeleted(): Promise<Accessory[]>;
  restoreAccessory(id: number): Promise<boolean>;
  permanentlyDeleteAccessory(id: number): Promise<boolean>;
}

// Media Repository
export interface IMediaRepository {
  getFolders(): Promise<Folder[]>;
  getFolder(id: number): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, folder: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: number): Promise<boolean>;
  getFoldersByParent(parentId: number | null): Promise<Folder[]>;
  getFolderPath(folderId: number): Promise<string>;
  getFolderChildren(folderId: number): Promise<Folder[]>;
  getMediaAssets(
    limit?: number,
    offset?: number,
    filters?: {
      type?: string | undefined;
      search?: string | undefined;
      folderId?: number | undefined;
    },
  ): Promise<MediaAsset[]>;
  getMediaAssetsCount(filters?: {
    type?: string | undefined;
    search?: string | undefined;
    folderId?: number | undefined;
  }): Promise<number>;
  getMediaAssetsWithCount(
    limit: number,
    offset: number,
    filters?: {
      type?: string | undefined;
      searchTerm?: string | undefined;
      folderId?: number;
    },
  ): Promise<{ assets: MediaAsset[]; total: number }>;
  getMediaAsset(id: number): Promise<MediaAsset | undefined>;
  createMediaAsset(mediaAsset: InsertMediaAsset): Promise<MediaAsset>;
  updateMediaAsset(
    id: number,
    mediaAsset: Partial<InsertMediaAsset>,
  ): Promise<MediaAsset | undefined>;
  get3DModelMetadata(id: number): Promise<MediaAsset | null>;
  deleteMediaAsset(id: number): Promise<boolean>;
  getMediaAssetsByFolder(folderId: number | null): Promise<MediaAsset[]>;
  moveMediaAsset(id: number, targetFolderId: number | null): Promise<MediaAsset | undefined>;
  getMediaAssetsIncludingDeleted(limit?: number, offset?: number): Promise<MediaAsset[]>;
  restoreMediaAsset(id: number): Promise<boolean>;
  permanentlyDeleteMediaAsset(id: number): Promise<boolean>;
  getMediaAssetsByIds(ids: string[]): Promise<MediaAsset[]>;
  updateMediaAssetsFolder(ids: number[], folderId: number | null): Promise<number>;
  updateMediaAssetsTags(updates: Array<{ id: number; tags: string[] }>): Promise<number>;
  getAssetsNeedingThumbnails(): Promise<MediaAsset[]>;
  downloadAssetBuffer(id: number): Promise<Buffer | null>;
  updateAssetThumbnail(id: number, thumbnailFilename: string): Promise<boolean>;
  getAllByType(type: "mediaAssets"): Promise<MediaAsset[]>;
  update(
    type: "mediaAssets",
    id: number,
    updates: Partial<MediaAsset>,
  ): Promise<MediaAsset | undefined>;
}

// Product Repository
export interface IProductRepository {
  getProducts(limit?: number, offset?: number): Promise<ProductSummary[]>;
  getHomepageFeaturedProducts(limit?: number): Promise<Partial<Product>[]>;
  getProductsSummary(
    limit?: number,
    offset?: number,
    options?: RepositoryCacheOptions,
  ): Promise<{ products: Partial<Product>[]; totalCount: number }>;
  getProductsCount(): Promise<number>;
  getProductsByCategoryCount(categoryId: number): Promise<number>;
  getProductsByTagCount(tag: string): Promise<number>;
  searchProductsCount(query: string): Promise<number>;
  getProduct(id: number): Promise<ProductDetail | undefined>;
  getProductsByCategory(
    categoryId: number,
    limit?: number,
    offset?: number,
  ): Promise<ProductSummary[]>;
  getProductBySlug(slug: string): Promise<ProductDetail | undefined>;
  getProductsByTag(tag: string, limit?: number, offset?: number): Promise<ProductSummary[]>;
  getRelatedProducts(productId: number): Promise<ProductSummary[]>;
  getActiveProducts(): Promise<ProductSummary[]>;
  getFeaturedProducts(): Promise<ProductSummary[]>;
  searchProducts(query: string, limit?: number, offset?: number): Promise<ProductSummary[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getProductByPath(path: string): Promise<ProductDetailWithContext | null>;
  getProductsIncludingDeleted(limit?: number, offset?: number): Promise<Product[]>;
  restoreProduct(id: number): Promise<boolean>;
  permanentlyDeleteProduct(id: number): Promise<boolean>;
  getHomepageFeaturedProductsSettings(): Promise<Record<string, unknown>>;
  updateHomepageFeaturedProductsSettings(
    settings: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}

// Navigation Repository
export interface INavigationRepository {
  getNavigationItems(): Promise<NavigationItem[]>;
  getNavigationItem(id: number): Promise<NavigationItem | undefined>;
  createNavigationItem(navigationItem: InsertNavigationItem): Promise<NavigationItem>;
  updateNavigationItem(
    id: number,
    navigationItem: Partial<InsertNavigationItem>,
  ): Promise<NavigationItem | undefined>;
  reorderNavigationItems(items: { id: number; sortOrder: number }[]): Promise<void>;
  deleteNavigationItem(id: number): Promise<boolean>;
  getNavigationGlassmorphismSettings(): Promise<NavigationGlassmorphismSettings | undefined>;
  updateNavigationGlassmorphismSettings(
    settings: Partial<InsertNavigationGlassmorphismSettings>,
  ): Promise<NavigationGlassmorphismSettings>;
  getNavigationItemsIncludingDeleted(): Promise<NavigationItem[]>;
  restoreNavigationItem(id: number): Promise<boolean>;
  permanentlyDeleteNavigationItem(id: number): Promise<boolean>;
}

// Contact Repository
export interface IContactRepository {
  getContactPageConfiguration(): Promise<ContactPageConfiguration | undefined>;
  createContactPageConfiguration(
    config: InsertContactPageConfiguration,
  ): Promise<ContactPageConfiguration>;
  updateContactPageConfiguration(
    id: number,
    config: Partial<InsertContactPageConfiguration>,
  ): Promise<ContactPageConfiguration | undefined>;
}

// Inquiry Repository
export interface IInquiryRepository {
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiryById(id: number): Promise<Inquiry | undefined>;
  listInquiries(filters: {
    page?: number | undefined;
    limit?: number | undefined;
    status?: string | undefined;
    source?: string | undefined;
    search?: string | undefined;
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
}

// Content Repositories (Homepage, About, Sustainability, Technology, Footer)
export interface IContentRepository {
  // Homepage
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
  getHomepageSections(): Promise<HomepageSection[]>;
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
  getHomepageSustainability(): Promise<HomepageSustainability | undefined>;
  updateHomepageSustainability(
    sustainability: Partial<InsertHomepageSustainability>,
  ): Promise<HomepageSustainability>;
  getLogoAnimationSettings(): Promise<LogoAnimationSettings | undefined>;
  updateLogoAnimationSettings(
    settings: Partial<InsertLogoAnimationSettings>,
  ): Promise<LogoAnimationSettings>;

  // Footer
  getFooterSections(): Promise<unknown[]>;
  getFooterConfiguration(): Promise<FooterConfiguration | undefined>;
  createFooterLink(link: unknown): Promise<unknown>;

  // About
  getAboutHero(includeInactive?: boolean): Promise<AboutHero | undefined>;
  updateAboutHero(hero: Partial<InsertAboutHero>): Promise<AboutHero>;
  getAboutTimelineEntries(includeInactive?: boolean): Promise<AboutTimelineEntry[]>;
  getAboutTimelineEntry(id: number): Promise<AboutTimelineEntry | undefined>;
  createAboutTimelineEntry(entry: InsertAboutTimelineEntry): Promise<AboutTimelineEntry>;
  updateAboutTimelineEntry(
    id: number,
    entry: Partial<InsertAboutTimelineEntry>,
  ): Promise<AboutTimelineEntry | undefined>;
  deleteAboutTimelineEntry(id: number): Promise<boolean>;
  reorderAboutTimelineEntries(entries: { id: number; position: number }[]): Promise<void>;
  getAboutMapLocations(includeInactive?: boolean): Promise<AboutMapLocation[]>;
  getAboutMapLocation(id: number): Promise<AboutMapLocation | undefined>;
  createAboutMapLocation(location: InsertAboutMapLocation): Promise<AboutMapLocation>;
  updateAboutMapLocation(
    id: number,
    location: Partial<InsertAboutMapLocation>,
  ): Promise<AboutMapLocation | undefined>;
  deleteAboutMapLocation(id: number): Promise<boolean>;
  getAboutSections(includeInactive?: boolean): Promise<AboutSection[]>;
  getAboutSection(id: number): Promise<AboutSection | undefined>;
  createAboutSection(section: InsertAboutSection): Promise<AboutSection>;
  updateAboutSection(
    id: number,
    section: Partial<InsertAboutSection>,
  ): Promise<AboutSection | undefined>;
  deleteAboutSection(id: number): Promise<boolean>;
  reorderAboutSections(sections: { id: number; position: number }[]): Promise<void>;
  getAboutStatistics(includeInactive?: boolean): Promise<AboutStatistic[]>;
  getAboutStatistic(id: number): Promise<AboutStatistic | undefined>;
  createAboutStatistic(statistic: InsertAboutStatistic): Promise<AboutStatistic>;
  updateAboutStatistic(
    id: number,
    statistic: Partial<InsertAboutStatistic>,
  ): Promise<AboutStatistic | undefined>;
  deleteAboutStatistic(id: number): Promise<boolean>;
  reorderAboutStatistics(statistics: { id: number; position: number }[]): Promise<void>;
  getAboutTeamMessage(includeInactive?: boolean): Promise<AboutTeamMessage | undefined>;
  updateAboutTeamMessage(message: Partial<InsertAboutTeamMessage>): Promise<AboutTeamMessage>;
}

export interface ISustainabilityRepository {
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
  getUnifiedSustainability(): Promise<UnifiedSustainability | undefined>;
  updateUnifiedSustainability(
    data: Partial<InsertUnifiedSustainability>,
  ): Promise<UnifiedSustainability>;
  migrateLegacySustainabilityData(): Promise<UnifiedSustainability>;
  validateSustainabilitySync(): Promise<{ success: boolean; issues?: string[] }>;
  syncUnifiedSustainabilityCollections(): Promise<{ success: boolean; count: number }>;
  getSustainabilitySectionHeaders(): Promise<unknown[]>;
  updateSustainabilitySectionHeaders(headers: unknown[]): Promise<unknown[]>;
  getSustainabilityFeatures(): Promise<unknown>;
  updateSustainabilityFeatures(features: unknown): Promise<unknown>;
  getSustainabilityFabricPortfolio(): Promise<unknown>;
  updateSustainabilityFabricPortfolio(portfolio: unknown): Promise<unknown>;
  getSustainabilityCallToAction(): Promise<unknown>;
  updateSustainabilityCallToAction(cta: unknown): Promise<unknown>;
}

export interface IManufacturingRepository {
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
}

export interface ITechnologyRepository {
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
  getTechnologyGradientSettings(): Promise<TechnologyGradientSettings | undefined>;
  updateTechnologyGradientSettings(
    settings: Partial<InsertTechnologyGradientSettings>,
  ): Promise<TechnologyGradientSettings>;
  migrateGradientSettingsToSpecification(): Promise<any>;
  getTechnologyCta(): Promise<TechnologyCta | undefined>;
  updateTechnologyCta(cta: Partial<InsertTechnologyCta>): Promise<TechnologyCta>;
  createTechnologyCta(cta: InsertTechnologyCta): Promise<TechnologyCta>;
}

export interface IWebhookRepository {
  getWebhookSubscriptions(): Promise<any[]>;
  getWebhookSubscription(id: number): Promise<any | undefined>;
  createWebhookSubscription(subscription: any): Promise<any>;
  updateWebhookSubscription(id: number, subscription: any): Promise<any | undefined>;
  deleteWebhookSubscription(id: number): Promise<boolean>;
  logWebhookDelivery(delivery: any): Promise<void>;
}

// System, Metrics & Audit
export interface ISystemRepository {
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
  getPerformanceMetrics(): Promise<PerformanceMetric[]>;
  getPerformanceMetric(id: number): Promise<PerformanceMetric | undefined>;
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;
  deletePerformanceMetric(id: number): Promise<boolean>;
  getPerformanceMetricsByType(metricType: string): Promise<PerformanceMetric[]>;
  getPerformanceMetricsByComponent(componentName: string): Promise<PerformanceMetric[]>;
  getRecentPerformanceMetrics(hours: number): Promise<PerformanceMetric[]>;
  getStorageAnalysisResults(): Promise<StorageAnalysisResult[]>;
  addStorageAnalysisResult(result: InsertStorageAnalysisResult): Promise<StorageAnalysisResult>;
  deleteStorageAnalysisResult(id: number): Promise<boolean>;
  getStorageChangeLogs(): Promise<StorageChangeLog[]>;
  addStorageChangeLog(changeLog: InsertStorageChangeLog): Promise<StorageChangeLog>;
  deleteStorageChangeLog(id: number): Promise<boolean>;
  getAuditLogsForRecord(tableName: string, recordId: string): Promise<AuditLog[]>;
  getRecentAuditLogs(limit?: number): Promise<AuditLog[]>;
  createAuditLog(log: import("../../shared/schema.js").InsertAuditLog): Promise<AuditLog>;
  setAuditTrailEnabled(enabled: boolean): void;
  configureTrackedTables(tables: string[]): void;
  repairDatabaseIntegrity(): Promise<{ validated: number; repaired: number; removed: number }>;
  cleanupAllCorruptEntries(): Promise<{ totalCleaned: number; results: Record<string, unknown> }>;
  checkDatabaseHealth(): Promise<{ healthy: boolean; latency: number }>;
}

// Blog Repository
export interface IBlogRepository {
  getBlogPosts(
    limit?: number,
    offset?: number,
    filters?: {
      status?: string;
      categoryId?: number;
      authorId?: string;
      search?: string;
      includeDeleted?: boolean;
    },
  ): Promise<{ posts: BlogPost[]; total: number }>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  restoreBlogPost(id: number): Promise<boolean>;
  getBlogCategories(): Promise<BlogCategory[]>;
  createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory>;
  updateBlogCategory(
    id: number,
    category: Partial<InsertBlogCategory>,
  ): Promise<BlogCategory | undefined>;
  deleteBlogCategory(id: number): Promise<boolean>;
}

export interface IStorage
  extends IUserRepository,
    ICategoryRepository,
    IFiberRepository,
    IFabricRepository,
    ICertificateRepository,
    ISizeChartRepository,
    IAccessoryRepository,
    IMediaRepository,
    IProductRepository,
    INavigationRepository,
    IContactRepository,
    IInquiryRepository,
    IContentRepository,
    ISustainabilityRepository,
    IManufacturingRepository,
    ITechnologyRepository,
    IWebhookRepository,
    ISystemRepository,
    IBlogRepository {}
