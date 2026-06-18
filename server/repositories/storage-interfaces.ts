import type {
  AboutBatchResponse,
  AboutHero,
  AboutMapLocation,
  AboutSection,
  AboutStatistic,
  AboutTeamMessage,
  AboutTimelineEntry,
  Accessory,
  AnimationError,
  AuditLog,
  BlogCategory,
  BlogPost,
  Category,
  Certificate,
  ContactPageConfiguration,
  Fabric,
  Fiber,
  Folder,
  FooterConfiguration,
  HomepageFeaturedProductsSettings,
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
  InsertFooterConfiguration,
  InsertHomepageFeaturedProductsSettings,
  InsertHomepageHero,
  InsertHomepageProcessCard,
  InsertHomepageSection,
  InsertHomepageSlogan,
  InsertHomepageSustainability,
  InsertInquiry,
  InsertLegalPolicy,
  InsertLogoAnimationSettings,
  InsertManufacturingCapability,
  InsertManufacturingCaseStudy,
  InsertManufacturingHero,
  InsertManufacturingProcess,
  InsertManufacturingQuality,
  InsertMediaAsset,
  InsertNavigationGlassmorphismSettings,
  InsertNavigationItem,
  InsertPerformanceMetric,
  InsertProduct,
  InsertService,
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
  InsertWebhookDelivery,
  InsertWebhookSubscription,
  LegalPolicy,
  LogoAnimationSettings,
  ManufacturingCapability,
  ManufacturingCaseStudy,
  ManufacturingHero,
  ManufacturingProcess,
  ManufacturingQuality,
  MediaAsset,
  NavigationGlassmorphismSettings,
  NavigationItem,
  PerformanceMetric,
  Product,
  Service,
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
  WebhookSubscription,
} from "../../shared/index.js";
import type { RepositoryCacheOptions } from "../lib/cache/cache-strategies.js";
import type {
  ProductDetail,
  ProductDetailWithContext,
  ProductSummary,
} from "../lib/db/repositories/product-repository.js";

// User Repository
interface IUserRepository {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  setAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined>;
  getAdminUsers(): Promise<User[]>;
}

// Category Repository
interface ICategoryRepository {
  getCategories(limit?: number, offset?: number): Promise<Category[]>;
  getCategoriesCount(): Promise<number>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getCategoriesIncludingDeleted(limit?: number, offset?: number): Promise<Category[]>;
  getDeletedCategories(): Promise<Category[]>;
  restoreCategory(id: number): Promise<boolean>;
  permanentlyDeleteCategory(id: number): Promise<boolean>;
}

// Product Attribute Repositories
interface IFiberRepository {
  getFibers(): Promise<Fiber[]>;
  getFiber(id: number): Promise<Fiber | undefined>;
  createFiber(fiber: InsertFiber): Promise<Fiber>;
  updateFiber(id: number, fiber: Partial<InsertFiber>): Promise<Fiber | undefined>;
  deleteFiber(id: number): Promise<boolean>;
  getFibersIncludingDeleted(): Promise<Fiber[]>;
  restoreFiber(id: number): Promise<boolean>;
  permanentlyDeleteFiber(id: number): Promise<boolean>;
}

interface IFabricRepository {
  getFabrics(): Promise<Fabric[]>;
  getFabric(id: number): Promise<Fabric | undefined>;
  createFabric(fabric: InsertFabric): Promise<Fabric>;
  updateFabric(id: number, fabric: Partial<InsertFabric>): Promise<Fabric | undefined>;
  deleteFabric(id: number): Promise<boolean>;
  getFabricsIncludingDeleted(limit?: number, offset?: number): Promise<Fabric[]>;
  restoreFabric(id: number): Promise<boolean>;
  permanentlyDeleteFabric(id: number): Promise<boolean>;
}

interface ICertificateRepository {
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

interface ISizeChartRepository {
  getSizeCharts(): Promise<SizeChart[]>;
  getSizeChart(id: number): Promise<SizeChart | undefined>;
  createSizeChart(sizeChart: InsertSizeChart): Promise<SizeChart>;
  updateSizeChart(id: number, sizeChart: Partial<InsertSizeChart>): Promise<SizeChart | undefined>;
  deleteSizeChart(id: number): Promise<boolean>;
  getSizeChartsIncludingDeleted(): Promise<SizeChart[]>;
  restoreSizeChart(id: number): Promise<boolean>;
  permanentlyDeleteSizeChart(id: number): Promise<boolean>;
}

interface IAccessoryRepository {
  getAccessories(
    limit?: number,
    offset?: number,
    filters?: { category?: string | undefined; search?: string | undefined },
  ): Promise<Accessory[]>;
  getAccessoriesCount(filters?: {
    category?: string | undefined;
    search?: string | undefined;
  }): Promise<number>;
  getAccessory(id: number): Promise<Accessory | undefined>;
  createAccessory(accessory: InsertAccessory): Promise<Accessory>;
  updateAccessory(id: number, accessory: Partial<InsertAccessory>): Promise<Accessory | undefined>;
  deleteAccessory(id: number): Promise<boolean>;
  getAccessoriesIncludingDeleted(): Promise<Accessory[]>;
  restoreAccessory(id: number): Promise<boolean>;
  permanentlyDeleteAccessory(id: number): Promise<boolean>;
}

// Media Repository
interface IMediaRepository {
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
interface IProductRepository {
  getProducts(limit?: number, offset?: number): Promise<ProductSummary[]>;
  getProductsCursor(limit?: number, cursor?: number): Promise<ProductSummary[]>;
  getHomepageFeaturedProducts(limit?: number): Promise<ProductSummary[]>;
  getProductsSummary(
    limit?: number,
    offset?: number,
    options?: RepositoryCacheOptions,
  ): Promise<{ products: ProductSummary[]; totalCount: number }>;
  getProductsCount(): Promise<number>;
  getProductsByCategoryCount(categoryId: number): Promise<number>;
  getProductsByTagCount(tag: string): Promise<number>;
  searchProductsCount(
    query: string,
    filters?: { categoryId?: number; isActive?: boolean; isFeatured?: boolean },
  ): Promise<number>;
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
  getFeaturedProducts(limit?: number, offset?: number): Promise<ProductSummary[]>;
  getFeaturedProductsCount(): Promise<number>;
  searchProducts(
    query: string,
    filters?: { categoryId?: number; isActive?: boolean; isFeatured?: boolean },
    limit?: number,
    offset?: number,
  ): Promise<ProductSummary[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getProductByPath(path: string): Promise<ProductDetailWithContext | null>;
  getProductsIncludingDeleted(limit?: number, offset?: number): Promise<Product[]>;
  restoreProduct(id: number): Promise<boolean>;
  permanentlyDeleteProduct(id: number): Promise<boolean>;
  getHomepageFeaturedProductsSettings(): Promise<HomepageFeaturedProductsSettings>;
  updateHomepageFeaturedProductsSettings(
    settings: Partial<InsertHomepageFeaturedProductsSettings>,
  ): Promise<HomepageFeaturedProductsSettings>;
}

// Navigation Repository
interface INavigationRepository {
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
interface IContactRepository {
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
interface IInquiryRepository {
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
  updateInquiry(id: number, data: Partial<InsertInquiry>): Promise<Inquiry | undefined>;
  deleteInquiry(id: number): Promise<boolean>;
  getInquiryStats(): Promise<{
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    recentCount: number;
  }>;
  subscribeToNewsletter(email: string): Promise<boolean>;
}

// Content Repositories (Homepage, About, Sustainability, Technology, Footer)
interface IContentRepository {
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
  reorderHomepageSlogans(orderedIds: number[]): Promise<void>;
  getHomepageProcessCards(includeInactive?: boolean): Promise<HomepageProcessCard[]>;
  getHomepageProcessCard(id: number): Promise<HomepageProcessCard | undefined>;
  createHomepageProcessCard(card: InsertHomepageProcessCard): Promise<HomepageProcessCard>;
  updateHomepageProcessCard(
    id: number,
    card: Partial<InsertHomepageProcessCard>,
  ): Promise<HomepageProcessCard | undefined>;
  deleteHomepageProcessCard(id: number): Promise<boolean>;
  reorderHomepageProcessCards(orderedIds: number[]): Promise<void>;
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
  updateFooterConfiguration(
    config: Partial<InsertFooterConfiguration>,
  ): Promise<FooterConfiguration>;
  createFooterLink(link: unknown): Promise<unknown>;

  // About
  getAboutHero(includeInactive?: boolean): Promise<AboutHero | undefined>;
  updateAboutHero(hero: Partial<InsertAboutHero>): Promise<AboutHero>;
  getAboutTimelineEntries(
    includeInactive?: boolean,
  ): Promise<(AboutTimelineEntry & { imageUrl: string | null })[]>;
  getAboutTimelineEntry(id: number): Promise<AboutTimelineEntry | undefined>;
  createAboutTimelineEntry(entry: InsertAboutTimelineEntry): Promise<AboutTimelineEntry>;
  updateAboutTimelineEntry(
    id: number,
    entry: Partial<InsertAboutTimelineEntry>,
  ): Promise<AboutTimelineEntry | undefined>;
  deleteAboutTimelineEntry(id: number): Promise<boolean>;
  reorderAboutTimelineEntries(orderedIds: number[]): Promise<void>;
  getAboutMapLocations(includeInactive?: boolean): Promise<AboutMapLocation[]>;
  getAboutMapLocation(id: number): Promise<AboutMapLocation | undefined>;
  createAboutMapLocation(location: InsertAboutMapLocation): Promise<AboutMapLocation>;
  updateAboutMapLocation(
    id: number,
    location: Partial<InsertAboutMapLocation>,
  ): Promise<AboutMapLocation | undefined>;
  deleteAboutMapLocation(id: number): Promise<boolean>;
  reorderAboutMapLocations(orderedIds: number[]): Promise<void>;
  getAboutSections(includeInactive?: boolean): Promise<AboutSection[]>;
  getAboutSection(id: number): Promise<AboutSection | undefined>;
  createAboutSection(section: InsertAboutSection): Promise<AboutSection>;
  updateAboutSection(
    id: number,
    section: Partial<InsertAboutSection>,
  ): Promise<AboutSection | undefined>;
  deleteAboutSection(id: number): Promise<boolean>;
  reorderAboutSections(orderedIds: number[]): Promise<void>;
  getAboutStatistics(includeInactive?: boolean): Promise<AboutStatistic[]>;
  getAboutStatistic(id: number): Promise<AboutStatistic | undefined>;
  createAboutStatistic(statistic: InsertAboutStatistic): Promise<AboutStatistic>;
  updateAboutStatistic(
    id: number,
    statistic: Partial<InsertAboutStatistic>,
  ): Promise<AboutStatistic | undefined>;
  deleteAboutStatistic(id: number): Promise<boolean>;
  reorderAboutStatistics(orderedIds: number[]): Promise<void>;
  getAboutTeamMessage(includeInactive?: boolean): Promise<AboutTeamMessage | undefined>;
  updateAboutTeamMessage(message: Partial<InsertAboutTeamMessage>): Promise<AboutTeamMessage>;
  getAboutBatch(): Promise<AboutBatchResponse>;
}

interface ISustainabilityRepository {
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
  reorderSustainabilityMetrics(orderedIds: number[]): Promise<void>;
  getSustainabilityInitiatives(includeInactive?: boolean): Promise<SustainabilityInitiative[]>;
  getSustainabilityInitiative(id: number): Promise<SustainabilityInitiative | undefined>;
  createSustainabilityInitiative(
    initiative: InsertSustainabilityInitiative,
  ): Promise<SustainabilityInitiative>;
  updateSustainabilityInitiative(
    id: number,
    initiative: Partial<InsertSustainabilityInitiative>,
  ): Promise<SustainabilityInitiative | undefined>;
  deleteSustainabilityInitiative(id: number): Promise<boolean>;
  reorderSustainabilityInitiatives(orderedIds: number[]): Promise<void>;
  getSustainabilityGoals(includeInactive?: boolean): Promise<SustainabilityGoal[]>;
  getSustainabilityGoal(id: number): Promise<SustainabilityGoal | undefined>;
  createSustainabilityGoal(goal: InsertSustainabilityGoal): Promise<SustainabilityGoal>;
  updateSustainabilityGoal(
    id: number,
    goal: Partial<InsertSustainabilityGoal>,
  ): Promise<SustainabilityGoal | undefined>;
  deleteSustainabilityGoal(id: number): Promise<boolean>;
  reorderSustainabilityGoals(orderedIds: number[]): Promise<void>;
  getUnifiedSustainability(): Promise<UnifiedSustainability | undefined>;
  updateUnifiedSustainability(
    data: Partial<InsertUnifiedSustainability>,
  ): Promise<UnifiedSustainability>;
  migrateLegacySustainabilityData(): Promise<{ migrated: number }>;
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

interface IManufacturingRepository {
  getManufacturingHero(): Promise<ManufacturingHero | undefined>;
  updateManufacturingHero(hero: Partial<InsertManufacturingHero>): Promise<ManufacturingHero>;
  getManufacturingProcesses(includeInactive?: boolean): Promise<ManufacturingProcess[]>;
  getManufacturingProcess(id: number): Promise<ManufacturingProcess | undefined>;
  createManufacturingProcess(process: InsertManufacturingProcess): Promise<ManufacturingProcess>;
  updateManufacturingProcess(
    id: number,
    process: Partial<InsertManufacturingProcess>,
  ): Promise<ManufacturingProcess | undefined>;
  deleteManufacturingProcess(id: number): Promise<boolean>;
  reorderManufacturingProcesses(orderedIds: number[]): Promise<void>;
  getManufacturingCapabilities(includeInactive?: boolean): Promise<ManufacturingCapability[]>;
  getManufacturingCapability(id: number): Promise<ManufacturingCapability | undefined>;
  createManufacturingCapability(
    capability: InsertManufacturingCapability,
  ): Promise<ManufacturingCapability>;
  updateManufacturingCapability(
    id: number,
    capability: Partial<InsertManufacturingCapability>,
  ): Promise<ManufacturingCapability | undefined>;
  deleteManufacturingCapability(id: number): Promise<boolean>;
  reorderManufacturingCapabilities(orderedIds: number[]): Promise<void>;
  getManufacturingQualities(includeInactive?: boolean): Promise<ManufacturingQuality[]>;
  getManufacturingQuality(id: number): Promise<ManufacturingQuality | undefined>;
  createManufacturingQuality(quality: InsertManufacturingQuality): Promise<ManufacturingQuality>;
  updateManufacturingQuality(
    id: number,
    quality: Partial<InsertManufacturingQuality>,
  ): Promise<ManufacturingQuality | undefined>;
  deleteManufacturingQuality(id: number): Promise<boolean>;
  reorderManufacturingQualities(orderedIds: number[]): Promise<void>;
  getManufacturingCaseStudies(includeInactive?: boolean): Promise<ManufacturingCaseStudy[]>;
  getManufacturingCaseStudy(id: number): Promise<ManufacturingCaseStudy | undefined>;
  createManufacturingCaseStudy(
    caseStudy: InsertManufacturingCaseStudy,
  ): Promise<ManufacturingCaseStudy>;
  updateManufacturingCaseStudy(
    id: number,
    caseStudy: Partial<InsertManufacturingCaseStudy>,
  ): Promise<ManufacturingCaseStudy | undefined>;
  deleteManufacturingCaseStudy(id: number): Promise<boolean>;
  reorderManufacturingCaseStudies(orderedIds: number[]): Promise<void>;
}

interface ITechnologyRepository {
  getTechnologyHero(): Promise<TechnologyHero | undefined>;
  updateTechnologyHero(hero: Partial<InsertTechnologyHero>): Promise<TechnologyHero>;
  getTechnologyInnovations(includeInactive?: boolean): Promise<TechnologyInnovation[]>;
  getTechnologyInnovation(id: number): Promise<TechnologyInnovation | undefined>;
  createTechnologyInnovation(innovation: InsertTechnologyInnovation): Promise<TechnologyInnovation>;
  updateTechnologyInnovation(
    id: number,
    innovation: Partial<InsertTechnologyInnovation>,
  ): Promise<TechnologyInnovation | undefined>;
  deleteTechnologyInnovation(id: number): Promise<boolean>;
  reorderTechnologyInnovations(orderedIds: number[]): Promise<void>;
  getTechnologyEquipment(): Promise<TechnologyEquipment[]>;
  getTechnologyEquipmentItem(id: number): Promise<TechnologyEquipment | undefined>;
  createTechnologyEquipment(equipment: InsertTechnologyEquipment): Promise<TechnologyEquipment>;
  updateTechnologyEquipment(
    id: number,
    equipment: Partial<InsertTechnologyEquipment>,
  ): Promise<TechnologyEquipment | undefined>;
  deleteTechnologyEquipment(id: number): Promise<boolean>;
  reorderTechnologyEquipment(orderedIds: number[]): Promise<void>;
  getTechnologyResearch(includeInactive?: boolean): Promise<TechnologyResearch[]>;
  getTechnologyResearchItem(id: number): Promise<TechnologyResearch | undefined>;
  createTechnologyResearch(research: InsertTechnologyResearch): Promise<TechnologyResearch>;
  updateTechnologyResearch(
    id: number,
    research: Partial<InsertTechnologyResearch>,
  ): Promise<TechnologyResearch | undefined>;
  deleteTechnologyResearch(id: number): Promise<boolean>;
  reorderTechnologyResearch(orderedIds: number[]): Promise<void>;
  getTechnologyRoadmap(includeInactive?: boolean): Promise<TechnologyRoadmap[]>;
  getTechnologyRoadmapItem(id: number): Promise<TechnologyRoadmap | undefined>;
  createTechnologyRoadmap(roadmap: InsertTechnologyRoadmap): Promise<TechnologyRoadmap>;
  updateTechnologyRoadmap(
    id: number,
    roadmap: Partial<InsertTechnologyRoadmap>,
  ): Promise<TechnologyRoadmap | undefined>;
  deleteTechnologyRoadmap(id: number): Promise<boolean>;
  reorderTechnologyRoadmap(orderedIds: number[]): Promise<void>;
  getTechnologyGradientSettings(): Promise<TechnologyGradientSettings | undefined>;
  updateTechnologyGradientSettings(
    settings: Partial<InsertTechnologyGradientSettings>,
  ): Promise<TechnologyGradientSettings>;
  migrateGradientSettingsToSpecification(): Promise<unknown>;
  getTechnologyCta(): Promise<TechnologyCta | undefined>;
  updateTechnologyCta(cta: Partial<InsertTechnologyCta>): Promise<TechnologyCta>;
  createTechnologyCta(cta: InsertTechnologyCta): Promise<TechnologyCta>;
  deleteTechnologyCta(id: number): Promise<boolean>;
}

// Webhook Repository
interface IWebhookRepository {
  getWebhookSubscriptions(): Promise<WebhookSubscription[]>;
  getWebhookSubscription(id: number): Promise<WebhookSubscription | undefined>;
  createWebhookSubscription(subscription: InsertWebhookSubscription): Promise<WebhookSubscription>;
  updateWebhookSubscription(
    id: number,
    subscription: Partial<InsertWebhookSubscription>,
  ): Promise<WebhookSubscription | undefined>;
  deleteWebhookSubscription(id: number): Promise<boolean>;
  logWebhookDelivery(delivery: InsertWebhookDelivery): Promise<void>;
}

// System, Metrics & Audit
interface ISystemRepository {
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
  createAuditLog(log: import("../../shared/index.js").InsertAuditLog): Promise<AuditLog>;
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

interface IServicesRepository {
  getServices(includeInactive?: boolean): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  reorderServices?(orderedIds: number[]): Promise<void>;
}

interface ILegalRepository {
  getLegalPolicies(includeInactive?: boolean): Promise<LegalPolicy[]>;
  getLegalPolicyBySlug(slug: string, includeInactive?: boolean): Promise<LegalPolicy | undefined>;
  getLegalPolicy(id: number): Promise<LegalPolicy | undefined>;
  createLegalPolicy(policy: InsertLegalPolicy): Promise<LegalPolicy>;
  updateLegalPolicy(
    id: number,
    policy: Partial<InsertLegalPolicy>,
  ): Promise<LegalPolicy | undefined>;
  deleteLegalPolicy(id: number): Promise<boolean>;
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
    IBlogRepository,
    IServicesRepository,
    ILegalRepository {}
