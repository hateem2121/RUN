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
  BlogCategory,
  BlogPost,
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
  InsertAuditLog,
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
  InsertSustainabilityFeatures,
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
  SustainabilityCallToAction,
  SustainabilityFeatures,
  SustainabilityGoal,
  SustainabilityHero,
  SustainabilityInitiative,
  SustainabilityMetric,
  SustainabilitySectionHeaders,
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
import type { IStorage } from "../repositories/storage-interfaces.js";

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private categories = new Map<number, Category>();
  private products = new Map<number, Product>();
  private mediaAssets = new Map<number, MediaAsset>();
  private auditLogs = new Map<number, AuditLog>();
  private folders = new Map<number, Folder>();
  private fibers = new Map<number, Fiber>();
  private fabrics = new Map<number, Fabric>();
  private certificates = new Map<number, Certificate>();
  private sizeCharts = new Map<number, SizeChart>();
  private accessories = new Map<number, Accessory>();
  private inquiries = new Map<number, Inquiry>();
  private navigationItems = new Map<number, NavigationItem>();
  private blogPosts = new Map<number, BlogPost>();
  private blogCategories = new Map<number, BlogCategory>();
  private homepageHeroes = new Map<number, HomepageHero>();
  private homepageSlogans = new Map<number, HomepageSlogan>();
  private homepageProcessCards = new Map<number, HomepageProcessCard>();
  private homepageSections = new Map<number, HomepageSection>();
  private homepageSustainability = new Map<number, HomepageSustainability>();
  private logoAnimationSettings = new Map<number, LogoAnimationSettings>();
  private aboutHeroes = new Map<number, AboutHero>();
  private aboutTimelineEntries = new Map<number, AboutTimelineEntry>();
  private aboutMapLocations = new Map<number, AboutMapLocation>();
  private aboutSections = new Map<number, AboutSection>();
  private aboutStatistics = new Map<number, AboutStatistic>();
  private aboutTeamMessages = new Map<number, AboutTeamMessage>();
  private sustainabilityHero = new Map<number, SustainabilityHero>();
  private sustainabilityMetrics = new Map<number, SustainabilityMetric>();
  private sustainabilityInitiatives = new Map<number, SustainabilityInitiative>();
  private sustainabilityGoals = new Map<number, SustainabilityGoal>();
  private unifiedSustainability = new Map<number, UnifiedSustainability>();
  private sustainabilityFeatures = new Map<number, SustainabilityFeatures>();
  private sustainabilitySectionHeaders = new Map<number, SustainabilitySectionHeaders>();
  private sustainabilityCallToAction = new Map<number, SustainabilityCallToAction>();
  private manufacturingHero = new Map<number, ManufacturingHero>();
  private manufacturingProcesses = new Map<number, ManufacturingProcess>();
  private manufacturingCapabilities = new Map<number, ManufacturingCapability>();
  private manufacturingQualities = new Map<number, ManufacturingQuality>();
  private technologyHero = new Map<number, TechnologyHero>();
  private technologyInnovations = new Map<number, TechnologyInnovation>();
  private technologyEquipment = new Map<number, TechnologyEquipment>();
  private technologyResearch = new Map<number, TechnologyResearch>();
  private technologyRoadmap = new Map<number, TechnologyRoadmap>();
  private technologyGradientSettings = new Map<number, TechnologyGradientSettings>();
  private technologyCta = new Map<number, TechnologyCta>();
  private animationErrors = new Map<number, AnimationError>();
  private performanceMetrics = new Map<number, PerformanceMetric>();
  private storageAnalysisResults = new Map<number, StorageAnalysisResult>();
  private storageChangeLogs = new Map<number, StorageChangeLog>();
  private webhookSubscriptions = new Map<number, WebhookSubscription>();
  private webhookDeliveries = new Map<number, unknown>();

  private nextIds = {
    category: 1,
    product: 1,
    media: 1,
    audit: 1,
    folder: 1,
    fiber: 1,
    fabric: 1,
    certificate: 1,
    sizeChart: 1,
    accessory: 1,
    inquiry: 1,
    navigationItem: 1,
    blogPost: 1,
    blogCategory: 1,
    homepageSlogan: 1,
    homepageProcessCard: 1,
    homepageSection: 1,
    aboutTimelineEntry: 1,
    aboutMapLocation: 1,
    aboutSection: 1,
    aboutStatistic: 1,
    sustainabilityMetric: 1,
    sustainabilityInitiative: 1,
    sustainabilityGoal: 1,
    sustainabilityFeatures: 1,
    manufacturingHero: 1,
    manufacturingProcess: 1,
    manufacturingCapability: 1,
    manufacturingQuality: 1,
    technologyHero: 1,
    technologyInnovation: 1,
    technologyEquipment: 1,
    technologyResearch: 1,
    technologyRoadmap: 1,
    technologyGradientSettings: 1,
    technologyCta: 1,
    animationError: 1,
    performanceMetric: 1,
    storageAnalysisResult: 1,
    storageChangeLog: 1,
    webhookSubscription: 1,
  };

  // User Repository
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === email);
  }
  async upsertUser(userData: UpsertUser): Promise<User> {
    const email = userData.email || "";
    const existing = await this.getUserByEmail(email);
    if (existing) {
      const updated = { ...existing, ...userData, updatedAt: new Date() };
      this.users.set(existing.id, updated as User);
      return updated as User;
    }
    const id =
      (userData as unknown as { id?: string }).id || Math.random().toString(36).substring(7);
    const newUser: User = {
      ...userData,
      id,
      isAdmin: userData.isAdmin === true,
      isLocked: false,
      loginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User;
    this.users.set(id, newUser);
    return newUser;
  }
  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated as User);
    return updated as User;
  }
  async setAdminStatus(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, isAdmin, updatedAt: new Date() };
    this.users.set(userId, updated as User);
    return updated as User;
  }
  async getAdminUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter((u) => u.isAdmin);
  }

  // Category Repository
  async getCategories(limit = 100, offset = 0): Promise<Category[]> {
    return Array.from(this.categories.values())
      .filter((c) => !c.deletedAt)
      .slice(offset, offset + limit);
  }
  async getCategoriesCount(): Promise<number> {
    return Array.from(this.categories.values()).filter((c) => !c.deletedAt).length;
  }
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find((c) => c.slug === slug);
  }
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.nextIds.category++;
    const newCategory: Category = {
      ...category,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    } as unknown as Category;
    this.categories.set(id, newCategory);
    return newCategory;
  }
  async updateCategory(
    id: number,
    category: Partial<InsertCategory>,
  ): Promise<Category | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...category, updatedAt: new Date() };
    this.categories.set(id, updated as Category);
    return updated as Category;
  }
  async deleteCategory(id: number): Promise<boolean> {
    const existing = this.categories.get(id);
    if (!existing) return false;
    this.categories.set(id, { ...existing, deletedAt: new Date() } as Category);
    return true;
  }
  async getCategoriesIncludingDeleted(limit = 100, offset = 0): Promise<Category[]> {
    return Array.from(this.categories.values()).slice(offset, offset + limit);
  }
  async restoreCategory(id: number): Promise<boolean> {
    const existing = this.categories.get(id);
    if (!existing) return false;
    this.categories.set(id, { ...existing, deletedAt: null } as Category);
    return true;
  }
  async permanentlyDeleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Fiber Repository
  async getFibers(): Promise<Fiber[]> {
    return Array.from(this.fibers.values()).filter((f) => !f.deletedAt);
  }
  async getFiber(id: number): Promise<Fiber | undefined> {
    return this.fibers.get(id);
  }
  async createFiber(fiber: InsertFiber): Promise<Fiber> {
    const id = this.nextIds.fiber++;
    const newFiber: Fiber = {
      ...fiber,
      id,
      createdAt: new Date(),
      deletedAt: null,
    } as unknown as Fiber;
    this.fibers.set(id, newFiber);
    return newFiber;
  }
  async updateFiber(id: number, fiber: Partial<InsertFiber>): Promise<Fiber | undefined> {
    const existing = this.fibers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...fiber };
    this.fibers.set(id, updated as Fiber);
    return updated as Fiber;
  }
  async deleteFiber(id: number): Promise<boolean> {
    const existing = this.fibers.get(id);
    if (!existing) return false;
    this.fibers.set(id, { ...existing, deletedAt: new Date() } as Fiber);
    return true;
  }
  async getFibersIncludingDeleted(): Promise<Fiber[]> {
    return Array.from(this.fibers.values());
  }
  async restoreFiber(id: number): Promise<boolean> {
    const existing = this.fibers.get(id);
    if (!existing) return false;
    this.fibers.set(id, { ...existing, deletedAt: null } as Fiber);
    return true;
  }
  async permanentlyDeleteFiber(id: number): Promise<boolean> {
    return this.fibers.delete(id);
  }

  // Fabric Repository
  async getFabrics(): Promise<Fabric[]> {
    return Array.from(this.fabrics.values()).filter((f) => !f.deletedAt);
  }
  async getFabric(id: number): Promise<Fabric | undefined> {
    return this.fabrics.get(id);
  }
  async createFabric(fabric: InsertFabric): Promise<Fabric> {
    const id = this.nextIds.fabric++;
    const newFabric: Fabric = {
      ...fabric,
      id,
      createdAt: new Date(),
      deletedAt: null,
    } as unknown as Fabric;
    this.fabrics.set(id, newFabric);
    return newFabric;
  }
  async updateFabric(id: number, fabric: Partial<InsertFabric>): Promise<Fabric | undefined> {
    const existing = this.fabrics.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...fabric };
    this.fabrics.set(id, updated as Fabric);
    return updated as Fabric;
  }
  async deleteFabric(id: number): Promise<boolean> {
    const existing = this.fabrics.get(id);
    if (!existing) return false;
    this.fabrics.set(id, { ...existing, deletedAt: new Date() } as Fabric);
    return true;
  }
  async getFabricsIncludingDeleted(limit = 100, offset = 0): Promise<Fabric[]> {
    return Array.from(this.fabrics.values()).slice(offset, offset + limit);
  }
  async restoreFabric(id: number): Promise<boolean> {
    const existing = this.fabrics.get(id);
    if (!existing) return false;
    this.fabrics.set(id, { ...existing, deletedAt: null } as Fabric);
    return true;
  }
  async permanentlyDeleteFabric(id: number): Promise<boolean> {
    return this.fabrics.delete(id);
  }

  // Certificate Repository
  async getCertificates(): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).filter((f) => !f.deletedAt);
  }
  async getCertificate(id: number): Promise<Certificate | undefined> {
    return this.certificates.get(id);
  }
  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const id = this.nextIds.certificate++;
    const newCert: Certificate = {
      ...certificate,
      id,
      createdAt: new Date(),
      deletedAt: null,
    } as unknown as Certificate;
    this.certificates.set(id, newCert);
    return newCert;
  }
  async updateCertificate(
    id: number,
    certificate: Partial<InsertCertificate>,
  ): Promise<Certificate | undefined> {
    const existing = this.certificates.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...certificate };
    this.certificates.set(id, updated as Certificate);
    return updated as Certificate;
  }
  async deleteCertificate(id: number): Promise<boolean> {
    const existing = this.certificates.get(id);
    if (!existing) return false;
    this.certificates.set(id, { ...existing, deletedAt: new Date() } as Certificate);
    return true;
  }
  async getCertificatesIncludingDeleted(): Promise<Certificate[]> {
    return Array.from(this.certificates.values());
  }
  async restoreCertificate(id: number): Promise<boolean> {
    const existing = this.certificates.get(id);
    if (!existing) return false;
    this.certificates.set(id, { ...existing, deletedAt: null } as Certificate);
    return true;
  }
  async permanentlyDeleteCertificate(id: number): Promise<boolean> {
    return this.certificates.delete(id);
  }

  // Size Chart Repository
  async getSizeCharts(): Promise<SizeChart[]> {
    return Array.from(this.sizeCharts.values()).filter((f) => !f.deletedAt);
  }
  async getSizeChart(id: number): Promise<SizeChart | undefined> {
    return this.sizeCharts.get(id);
  }
  async createSizeChart(sizeChart: InsertSizeChart): Promise<SizeChart> {
    const id = this.nextIds.sizeChart++;
    const s: SizeChart = {
      ...sizeChart,
      id,
      createdAt: new Date(),
      deletedAt: null,
    } as unknown as SizeChart;
    this.sizeCharts.set(id, s);
    return s;
  }
  async updateSizeChart(
    id: number,
    sizeChart: Partial<InsertSizeChart>,
  ): Promise<SizeChart | undefined> {
    const existing = this.sizeCharts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...sizeChart };
    this.sizeCharts.set(id, updated as SizeChart);
    return updated as SizeChart;
  }
  async deleteSizeChart(id: number): Promise<boolean> {
    const existing = this.sizeCharts.get(id);
    if (!existing) return false;
    this.sizeCharts.set(id, { ...existing, deletedAt: new Date() } as SizeChart);
    return true;
  }
  async getSizeChartsIncludingDeleted(): Promise<SizeChart[]> {
    return Array.from(this.sizeCharts.values());
  }
  async restoreSizeChart(id: number): Promise<boolean> {
    const existing = this.sizeCharts.get(id);
    if (!existing) return false;
    this.sizeCharts.set(id, { ...existing, deletedAt: null } as SizeChart);
    return true;
  }
  async permanentlyDeleteSizeChart(id: number): Promise<boolean> {
    return this.sizeCharts.delete(id);
  }

  // Accessory Repository
  async getAccessories(): Promise<Accessory[]> {
    return Array.from(this.accessories.values()).filter((f) => !f.deletedAt);
  }
  async getAccessory(id: number): Promise<Accessory | undefined> {
    return this.accessories.get(id);
  }
  async createAccessory(accessory: InsertAccessory): Promise<Accessory> {
    const id = this.nextIds.accessory++;
    const a: Accessory = {
      ...accessory,
      id,
      createdAt: new Date(),
      deletedAt: null,
    } as unknown as Accessory;
    this.accessories.set(id, a);
    return a;
  }
  async updateAccessory(
    id: number,
    accessory: Partial<InsertAccessory>,
  ): Promise<Accessory | undefined> {
    const existing = this.accessories.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...accessory };
    this.accessories.set(id, updated as Accessory);
    return updated as Accessory;
  }
  async deleteAccessory(id: number): Promise<boolean> {
    const existing = this.accessories.get(id);
    if (!existing) return false;
    this.accessories.set(id, { ...existing, deletedAt: new Date() } as Accessory);
    return true;
  }
  async getAccessoriesIncludingDeleted(): Promise<Accessory[]> {
    return Array.from(this.accessories.values());
  }
  async restoreAccessory(id: number): Promise<boolean> {
    const existing = this.accessories.get(id);
    if (!existing) return false;
    this.accessories.set(id, { ...existing, deletedAt: null } as Accessory);
    return true;
  }
  async permanentlyDeleteAccessory(id: number): Promise<boolean> {
    return this.accessories.delete(id);
  }

  // Media Repository
  async getFolders(): Promise<Folder[]> {
    return Array.from(this.folders.values());
  }
  async getFolder(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }
  async createFolder(folder: InsertFolder): Promise<Folder> {
    const id = this.nextIds.folder++;
    const f: Folder = { ...folder, id, createdAt: new Date() } as unknown as Folder;
    this.folders.set(id, f);
    return f;
  }
  async updateFolder(id: number, folder: Partial<InsertFolder>): Promise<Folder | undefined> {
    const existing = this.folders.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...folder };
    this.folders.set(id, updated as Folder);
    return updated as Folder;
  }
  async deleteFolder(id: number): Promise<boolean> {
    return this.folders.delete(id);
  }
  async getFoldersByParent(parentId: number | null): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter((f) => f.parentId === parentId);
  }
  async getFolderPath(folderId: number): Promise<string> {
    const folder = this.folders.get(folderId);
    if (!folder) return "/";
    if (folder.parentId === null) return `/${folder.name}`;
    const parentPath = await this.getFolderPath(folder.parentId);
    return `${parentPath}/${folder.name}`;
  }
  async getFolderChildren(folderId: number): Promise<Folder[]> {
    return this.getFoldersByParent(folderId);
  }
  async getMediaAssets(
    limit = 100,
    offset = 0,
    filters?: { type?: string; folderId?: number; searchTerm?: string },
  ): Promise<MediaAsset[]> {
    let assets = Array.from(this.mediaAssets.values()).filter((a) => !a.deletedAt);
    if (filters?.type) assets = assets.filter((a) => a.type === filters.type);
    if (filters?.folderId !== undefined)
      assets = assets.filter((a) => a.folderId === filters.folderId);
    if (filters?.searchTerm) {
      const s = filters.searchTerm.toLowerCase();
      assets = assets.filter(
        (a) => a.filename.toLowerCase().includes(s) || a.altText?.toLowerCase().includes(s),
      );
    }
    return assets.slice(offset, offset + limit);
  }
  async getMediaAssetsCount(filters?: {
    type?: string;
    folderId?: number;
    searchTerm?: string;
  }): Promise<number> {
    return (await this.getMediaAssets(100000, 0, filters)).length;
  }
  async getMediaAssetsWithCount(
    limit: number,
    offset: number,
    filters?: { type?: string; folderId?: number; searchTerm?: string },
  ): Promise<{ assets: MediaAsset[]; total: number }> {
    const total = await this.getMediaAssetsCount(filters);
    const assets = await this.getMediaAssets(limit, offset, filters);
    return { assets, total };
  }
  async getMediaAsset(id: number): Promise<MediaAsset | undefined> {
    return this.mediaAssets.get(id);
  }
  async createMediaAsset(mediaAsset: InsertMediaAsset): Promise<MediaAsset> {
    const id = this.nextIds.media++;
    const m: MediaAsset = {
      ...mediaAsset,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      fileSize: mediaAsset.fileSize ?? 0,
      mimeType: mediaAsset.mimeType ?? "application/octet-stream",
    } as unknown as MediaAsset;
    this.mediaAssets.set(id, m);
    return m;
  }
  async updateMediaAsset(
    id: number,
    mediaAsset: Partial<InsertMediaAsset>,
  ): Promise<MediaAsset | undefined> {
    const existing = this.mediaAssets.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...mediaAsset, updatedAt: new Date() };
    this.mediaAssets.set(id, updated as MediaAsset);
    return updated as MediaAsset;
  }
  async get3DModelMetadata(id: number): Promise<MediaAsset | null> {
    const asset = this.mediaAssets.get(id);
    return asset && asset.type === "model" ? asset : null;
  }
  async deleteMediaAsset(id: number): Promise<boolean> {
    const existing = this.mediaAssets.get(id);
    if (!existing) return false;
    this.mediaAssets.set(id, { ...existing, deletedAt: new Date() } as MediaAsset);
    return true;
  }
  async getMediaAssetsByFolder(folderId: number | null): Promise<MediaAsset[]> {
    return Array.from(this.mediaAssets.values()).filter(
      (a) => a.folderId === folderId && !a.deletedAt,
    );
  }
  async moveMediaAsset(id: number, targetFolderId: number | null): Promise<MediaAsset | undefined> {
    const asset = this.mediaAssets.get(id);
    if (!asset) return undefined;
    const updated = { ...asset, folderId: targetFolderId, updatedAt: new Date() } as MediaAsset;
    this.mediaAssets.set(id, updated);
    return updated;
  }
  async getMediaAssetsIncludingDeleted(limit = 100, offset = 0): Promise<MediaAsset[]> {
    return Array.from(this.mediaAssets.values()).slice(offset, offset + limit);
  }
  async restoreMediaAsset(id: number): Promise<boolean> {
    const existing = this.mediaAssets.get(id);
    if (!existing) return false;
    this.mediaAssets.set(id, { ...existing, deletedAt: null } as MediaAsset);
    return true;
  }
  async permanentlyDeleteMediaAsset(id: number): Promise<boolean> {
    return this.mediaAssets.delete(id);
  }
  async getMediaAssetsByIds(ids: string[]): Promise<MediaAsset[]> {
    const numIds = ids.map((id) => Number.parseInt(id, 10)).filter((id) => !Number.isNaN(id));
    return Array.from(this.mediaAssets.values()).filter((a) => numIds.includes(a.id));
  }
  async updateMediaAssetsFolder(ids: number[], folderId: number | null): Promise<number> {
    let count = 0;
    for (const id of ids) {
      if (await this.moveMediaAsset(id, folderId)) count++;
    }
    return count;
  }
  async updateMediaAssetsTags(updates: Array<{ id: number; tags: string[] }>): Promise<number> {
    let count = 0;
    for (const update of updates) {
      if (await this.updateMediaAsset(update.id, { tags: update.tags })) count++;
    }
    return count;
  }
  async getAssetsNeedingThumbnails(): Promise<MediaAsset[]> {
    return Array.from(this.mediaAssets.values()).filter(
      (a) => !a.thumbnailFilename && a.type === "image",
    );
  }
  async downloadAssetBuffer(_id: number): Promise<Buffer | null> {
    return null; // Mock
  }
  async updateAssetThumbnail(id: number, thumbnailFilename: string): Promise<boolean> {
    const asset = this.mediaAssets.get(id);
    if (!asset) return false;
    this.mediaAssets.set(id, { ...asset, thumbnailFilename } as MediaAsset);
    return true;
  }
  async getAllByType(_type: "mediaAssets"): Promise<MediaAsset[]> {
    return Array.from(this.mediaAssets.values());
  }
  async update(
    _type: "mediaAssets",
    id: number,
    updates: Partial<MediaAsset>,
  ): Promise<MediaAsset | undefined> {
    return this.updateMediaAsset(id, updates);
  }

  // Product Repository
  async getProducts(limit = 100, offset = 0): Promise<ProductSummary[]> {
    return Array.from(this.products.values())
      .filter((p) => p.isActive && !p.deletedAt)
      .slice(offset, offset + limit) as unknown as ProductSummary[];
  }
  async getHomepageFeaturedProducts(limit = 20): Promise<ProductSummary[]> {
    return Array.from(this.products.values())
      .filter((p) => p.isActive && !p.deletedAt && p.isFeatured)
      .slice(0, limit) as unknown as ProductSummary[];
  }
  async getProductsSummary(
    limit = 100,
    offset = 0,
    _options?: RepositoryCacheOptions,
  ): Promise<{ products: ProductSummary[]; totalCount: number }> {
    const products = await this.getProducts(limit, offset);
    const totalCount = await this.getProductsCount();
    return { products: products as unknown as ProductSummary[], totalCount };
  }
  async getProductsCount(): Promise<number> {
    return Array.from(this.products.values()).filter((p) => p.isActive && !p.deletedAt).length;
  }
  async getProductsByCategoryCount(categoryId: number): Promise<number> {
    return Array.from(this.products.values()).filter(
      (p) => p.categoryId === categoryId && p.isActive && !p.deletedAt,
    ).length;
  }
  async getProductsByTagCount(tag: string): Promise<number> {
    return Array.from(this.products.values()).filter(
      (p) => p.tags?.includes(tag) && p.isActive && !p.deletedAt,
    ).length;
  }
  async searchProductsCount(query: string): Promise<number> {
    const q = query.toLowerCase();
    return Array.from(this.products.values()).filter(
      (p) =>
        (p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) &&
        p.isActive &&
        !p.deletedAt,
    ).length;
  }
  async getProduct(id: number): Promise<ProductDetail | undefined> {
    return this.products.get(id) as unknown as ProductDetail | undefined;
  }
  async getProductsByCategory(
    categoryId: number,
    limit = 100,
    offset = 0,
  ): Promise<ProductSummary[]> {
    return Array.from(this.products.values())
      .filter((p) => p.categoryId === categoryId && p.isActive && !p.deletedAt)
      .slice(offset, offset + limit) as unknown as ProductSummary[];
  }
  async getProductBySlug(slug: string): Promise<ProductDetail | undefined> {
    return Array.from(this.products.values()).find((p) => p.slug === slug) as unknown as
      | ProductDetail
      | undefined;
  }
  async getProductsByTag(tag: string, limit = 100, offset = 0): Promise<ProductSummary[]> {
    return Array.from(this.products.values())
      .filter((p) => p.tags?.includes(tag) && p.isActive && !p.deletedAt)
      .slice(offset, offset + limit) as unknown as ProductSummary[];
  }
  async getRelatedProducts(productId: number): Promise<ProductSummary[]> {
    const p = this.products.get(productId);
    if (!p) return [];
    return Array.from(this.products.values())
      .filter(
        (prod) =>
          prod.categoryId === p.categoryId &&
          prod.id !== productId &&
          prod.isActive &&
          !prod.deletedAt,
      )
      .slice(0, 5) as unknown as ProductSummary[];
  }
  async getActiveProducts(): Promise<ProductSummary[]> {
    return Array.from(this.products.values()).filter(
      (p) => p.isActive && !p.deletedAt,
    ) as unknown as ProductSummary[];
  }
  async getProductsCursor(
    limit = 100,
    cursor?: string,
  ): Promise<{ products: ProductSummary[]; nextCursor: string | null }> {
    const products = Array.from(this.products.values()).filter((p) => p.isActive && !p.deletedAt);
    const startIndex = cursor ? Number.parseInt(cursor, 10) : 0;
    const paginated = products.slice(startIndex, startIndex + limit);
    const nextCursor =
      startIndex + limit < products.length ? (startIndex + limit).toString() : null;

    return {
      products: paginated as unknown as ProductSummary[],
      nextCursor,
    };
  }
  async getFeaturedProducts(limit = 100, offset = 0): Promise<ProductSummary[]> {
    const all = Array.from(this.products.values()).filter(
      (p) => p.isActive && !p.deletedAt && p.isFeatured,
    );
    return all.slice(offset, offset + limit) as unknown as ProductSummary[];
  }

  async getFeaturedProductsCount(): Promise<number> {
    return Array.from(this.products.values()).filter(
      (p) => p.isActive && !p.deletedAt && p.isFeatured,
    ).length;
  }
  async searchProducts(
    query: string,
    filters?: { categoryId?: number; isActive?: boolean; isFeatured?: boolean },
    limit = 100,
    offset = 0,
  ): Promise<ProductSummary[]> {
    const q = query.toLowerCase();
    return Array.from(this.products.values())
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = (p.description || "").toLowerCase().includes(q);
        const matchesFilters =
          (!filters?.categoryId || p.categoryId === filters.categoryId) &&
          (filters?.isActive === undefined || p.isActive === filters.isActive) &&
          (filters?.isFeatured === undefined || p.isFeatured === filters.isFeatured);
        return (nameMatch || descMatch) && matchesFilters && !p.deletedAt;
      })
      .slice(offset, offset + limit) as unknown as ProductSummary[];
  }
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.nextIds.product++;
    const p: Product = {
      ...product,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false,
    } as unknown as Product;
    this.products.set(id, p);
    return p;
  }
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...product, updatedAt: new Date() };
    this.products.set(id, updated as Product);
    return updated as Product;
  }
  async deleteProduct(id: number): Promise<boolean> {
    const existing = this.products.get(id);
    if (!existing) return false;
    this.products.set(id, { ...existing, deletedAt: new Date() } as Product);
    return true;
  }
  async getProductByPath(path: string): Promise<ProductDetailWithContext | null> {
    const p = Array.from(this.products.values()).find(
      (prod) => prod.urlPath === path && prod.isActive && !prod.deletedAt,
    );
    if (!p) return null;
    const cat = p.categoryId ? this.categories.get(p.categoryId) : undefined;
    return {
      product: {
        ...p,
        canonicalUrl: p.urlPath || null,
        urlPath: p.urlPath as string, // Ensure required fields exist in ProductDetail context
      } as unknown as ProductDetail & { canonicalUrl: string | null },
      context: {
        category: cat || null,
        subcategory: null,
        categoryTree: cat ? [cat] : [],
        breadcrumb: cat ? [{ id: cat.id, name: cat.name, url: `/categories/${cat.slug}` }] : [],
        fabric: null,
        certificates: [],
        sizeChart: null,
        accessories: [],
        fibers: [],
      },
      media: [],
      relatedProducts: [],
      categoryProducts: [],
      navigation: { previousProduct: null, nextProduct: null },
    };
  }
  async getProductsIncludingDeleted(limit = 100, offset = 0): Promise<Product[]> {
    return Array.from(this.products.values()).slice(offset, offset + limit);
  }
  async restoreProduct(id: number): Promise<boolean> {
    const existing = this.products.get(id);
    if (!existing) return false;
    this.products.set(id, { ...existing, deletedAt: null } as Product);
    return true;
  }
  async permanentlyDeleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  async getHomepageFeaturedProductsSettings(): Promise<Record<string, unknown>> {
    return {};
  }
  async updateHomepageFeaturedProductsSettings(
    settings: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return settings;
  }

  // Navigation Repository
  async getNavigationItems(): Promise<NavigationItem[]> {
    return Array.from(this.navigationItems.values())
      .filter((i) => !i.deletedAt)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  async getNavigationItem(id: number): Promise<NavigationItem | undefined> {
    return this.navigationItems.get(id);
  }
  async createNavigationItem(item: InsertNavigationItem): Promise<NavigationItem> {
    const id = this.nextIds.navigationItem++;
    const ni: NavigationItem = { ...item, id, createdAt: new Date() } as unknown as NavigationItem;
    this.navigationItems.set(id, ni);
    return ni;
  }
  async updateNavigationItem(
    id: number,
    item: Partial<InsertNavigationItem>,
  ): Promise<NavigationItem | undefined> {
    const existing = this.navigationItems.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...item };
    this.navigationItems.set(id, updated as NavigationItem);
    return updated as NavigationItem;
  }
  async reorderNavigationItems(items: { id: number; sortOrder: number }[]): Promise<void> {
    for (const item of items) {
      const ni = this.navigationItems.get(item.id);
      if (ni) this.navigationItems.set(item.id, { ...ni, sortOrder: item.sortOrder });
    }
  }
  async deleteNavigationItem(id: number): Promise<boolean> {
    const existing = this.navigationItems.get(id);
    if (!existing) return false;
    this.navigationItems.set(id, { ...existing, deletedAt: new Date() } as NavigationItem);
    return true;
  }
  async getNavigationGlassmorphismSettings(): Promise<NavigationGlassmorphismSettings | undefined> {
    return undefined;
  }
  async updateNavigationGlassmorphismSettings(
    settings: Partial<InsertNavigationGlassmorphismSettings>,
  ): Promise<NavigationGlassmorphismSettings> {
    return settings as unknown as NavigationGlassmorphismSettings;
  }
  async getNavigationItemsIncludingDeleted(): Promise<NavigationItem[]> {
    return Array.from(this.navigationItems.values());
  }
  async restoreNavigationItem(id: number): Promise<boolean> {
    const existing = this.navigationItems.get(id);
    if (!existing) return false;
    this.navigationItems.set(id, { ...existing, deletedAt: null } as NavigationItem);
    return true;
  }
  async permanentlyDeleteNavigationItem(id: number): Promise<boolean> {
    return this.navigationItems.delete(id);
  }

  // Contact Repository
  async getContactPageConfiguration(): Promise<ContactPageConfiguration | undefined> {
    return undefined;
  }
  async createContactPageConfiguration(
    config: InsertContactPageConfiguration,
  ): Promise<ContactPageConfiguration> {
    return config as unknown as ContactPageConfiguration;
  }
  async updateContactPageConfiguration(
    _id: number,
    config: Partial<InsertContactPageConfiguration>,
  ): Promise<ContactPageConfiguration | undefined> {
    // Basic implementation since config is a singleton
    return config as unknown as ContactPageConfiguration;
  }

  // Footer Repository
  async getFooterConfiguration(): Promise<FooterConfiguration | undefined> {
    return undefined;
  }
  async getFooterSections(): Promise<unknown[]> {
    return [];
  }
  async createFooterLink(link: unknown): Promise<unknown> {
    return link;
  }
  async updateFooterConfiguration(
    _id: number,
    config: Partial<FooterConfiguration>,
  ): Promise<FooterConfiguration | undefined> {
    return config as unknown as FooterConfiguration;
  }

  // Inquiry Repository
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.nextIds.inquiry++;
    const i: Inquiry = { ...inquiry, id, createdAt: new Date() } as unknown as Inquiry;
    this.inquiries.set(id, i);
    return i;
  }
  async getInquiryById(id: number): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }
  async listInquiries(_filters: unknown): Promise<{ inquiries: Inquiry[]; total: number }> {
    return { inquiries: Array.from(this.inquiries.values()), total: this.inquiries.size };
  }
  async updateInquiryStatus(
    id: number,
    status: string,
    adminNotes?: string,
  ): Promise<Inquiry | undefined> {
    const i = this.inquiries.get(id);
    if (!i) return undefined;
    const updated = { ...i, status, adminNotes };
    this.inquiries.set(id, updated as Inquiry);
    return updated as Inquiry;
  }
  async deleteInquiry(id: number): Promise<boolean> {
    return this.inquiries.delete(id);
  }
  async getInquiryStats(): Promise<{
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    recentCount: number;
  }> {
    return { byStatus: {}, bySource: {}, recentCount: 0 };
  }

  // Content Repository - Stubs for rest
  async getHomepageHero(): Promise<HomepageHero | undefined> {
    return Array.from(this.homepageHeroes.values())[0];
  }
  async updateHomepageHero(hero: Partial<InsertHomepageHero>): Promise<HomepageHero> {
    const existing = await this.getHomepageHero();
    const updated = {
      ...existing,
      ...hero,
      id: existing?.id || 1,
    } as HomepageHero;
    this.homepageHeroes.set(updated.id, updated);
    return updated;
  }
  async getHomepageSlogans(): Promise<HomepageSlogan[]> {
    return Array.from(this.homepageSlogans.values()).sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
    );
  }
  async getHomepageSlogan(id: number): Promise<HomepageSlogan | undefined> {
    return this.homepageSlogans.get(id);
  }
  async createHomepageSlogan(slogan: InsertHomepageSlogan): Promise<HomepageSlogan> {
    const id = this.nextIds.homepageSlogan++;
    const newSlogan = { ...slogan, id } as HomepageSlogan;
    this.homepageSlogans.set(id, newSlogan);
    return newSlogan;
  }
  async updateHomepageSlogan(
    id: number,
    slogan: Partial<InsertHomepageSlogan>,
  ): Promise<HomepageSlogan | undefined> {
    const existing = this.homepageSlogans.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...slogan } as HomepageSlogan;
    this.homepageSlogans.set(id, updated);
    return updated;
  }
  async deleteHomepageSlogan(id: number): Promise<boolean> {
    return this.homepageSlogans.delete(id);
  }
  async reorderHomepageSlogans(orderedIds: number[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const slogan = this.homepageSlogans.get(id);
      if (slogan) {
        this.homepageSlogans.set(id, { ...slogan, sortOrder: index });
      }
    });
  }
  async getHomepageProcessCards(includeInactive?: boolean): Promise<HomepageProcessCard[]> {
    return Array.from(this.homepageProcessCards.values())
      .filter((c) => includeInactive || c.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  async getHomepageProcessCard(id: number): Promise<HomepageProcessCard | undefined> {
    return this.homepageProcessCards.get(id);
  }
  async createHomepageProcessCard(card: InsertHomepageProcessCard): Promise<HomepageProcessCard> {
    const id = this.nextIds.homepageProcessCard++;
    const newCard = { ...card, id } as HomepageProcessCard;
    this.homepageProcessCards.set(id, newCard);
    return newCard;
  }
  async updateHomepageProcessCard(
    id: number,
    card: Partial<InsertHomepageProcessCard>,
  ): Promise<HomepageProcessCard | undefined> {
    const existing = this.homepageProcessCards.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...card } as HomepageProcessCard;
    this.homepageProcessCards.set(id, updated);
    return updated;
  }
  async deleteHomepageProcessCard(id: number): Promise<boolean> {
    return this.homepageProcessCards.delete(id);
  }
  async reorderHomepageProcessCards(orderedIds: number[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const card = this.homepageProcessCards.get(id);
      if (card) {
        this.homepageProcessCards.set(id, { ...card, sortOrder: index });
      }
    });
  }
  async getHomepageSections(): Promise<HomepageSection[]> {
    return Array.from(this.homepageSections.values());
  }
  async getHomepageSection(name: string): Promise<HomepageSection | undefined> {
    return Array.from(this.homepageSections.values()).find((s) => s.name === name);
  }
  async getHomepageSectionById(id: number): Promise<HomepageSection | undefined> {
    return this.homepageSections.get(id);
  }
  async updateHomepageSection(
    name: string,
    section: Partial<InsertHomepageSection>,
  ): Promise<HomepageSection> {
    const existing = await this.getHomepageSection(name);
    const updated = {
      ...existing,
      ...section,
      name,
      id: existing?.id || this.nextIds.homepageSection++,
    } as HomepageSection;
    this.homepageSections.set(updated.id, updated);
    return updated;
  }
  async updateHomepageSectionById(
    id: number,
    section: Partial<InsertHomepageSection>,
  ): Promise<HomepageSection | undefined> {
    const existing = this.homepageSections.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...section } as HomepageSection;
    this.homepageSections.set(id, updated);
    return updated;
  }
  async getHomepageSustainability(): Promise<HomepageSustainability | undefined> {
    return Array.from(this.homepageSustainability.values())[0];
  }
  async updateHomepageSustainability(
    sustainability: Partial<InsertHomepageSustainability>,
  ): Promise<HomepageSustainability> {
    const existing = await this.getHomepageSustainability();
    const updated = {
      ...existing,
      ...sustainability,
    } as HomepageSustainability;
    this.homepageSustainability.set(1, updated);
    return updated;
  }
  async getLogoAnimationSettings(): Promise<LogoAnimationSettings | undefined> {
    return Array.from(this.logoAnimationSettings.values())[0];
  }
  async updateLogoAnimationSettings(
    settings: Partial<InsertLogoAnimationSettings>,
  ): Promise<LogoAnimationSettings> {
    const existing = await this.getLogoAnimationSettings();
    const updated = {
      ...existing,
      ...settings,
      id: existing?.id || 1,
    } as LogoAnimationSettings;
    this.logoAnimationSettings.set(updated.id, updated);
    return updated;
  }
  async getAboutHero(includeInactive?: boolean): Promise<AboutHero | undefined> {
    const hero = Array.from(this.aboutHeroes.values())[0];
    if (hero && !includeInactive && !hero.isActive) return undefined;
    return hero;
  }
  async updateAboutHero(hero: Partial<InsertAboutHero>): Promise<AboutHero> {
    const existing = await this.getAboutHero(true);
    const updated = {
      ...existing,
      ...hero,
      id: existing?.id || 1,
    } as AboutHero;
    this.aboutHeroes.set(updated.id, updated);
    return updated;
  }
  async getAboutTimelineEntries(includeInactive?: boolean): Promise<AboutTimelineEntry[]> {
    return Array.from(this.aboutTimelineEntries.values())
      .filter((e) => includeInactive || e.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  async getAboutTimelineEntry(id: number): Promise<AboutTimelineEntry | undefined> {
    return this.aboutTimelineEntries.get(id);
  }
  async createAboutTimelineEntry(entry: InsertAboutTimelineEntry): Promise<AboutTimelineEntry> {
    const id = this.nextIds.aboutTimelineEntry++;
    const newEntry = { ...entry, id } as AboutTimelineEntry;
    this.aboutTimelineEntries.set(id, newEntry);
    return newEntry;
  }
  async updateAboutTimelineEntry(
    id: number,
    entry: Partial<InsertAboutTimelineEntry>,
  ): Promise<AboutTimelineEntry | undefined> {
    const existing = this.aboutTimelineEntries.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...entry } as AboutTimelineEntry;
    this.aboutTimelineEntries.set(id, updated);
    return updated;
  }
  async deleteAboutTimelineEntry(id: number): Promise<boolean> {
    return this.aboutTimelineEntries.delete(id);
  }
  async reorderAboutTimelineEntries(orderedIds: number[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const entry = this.aboutTimelineEntries.get(id);
      if (entry) {
        this.aboutTimelineEntries.set(id, { ...entry, sortOrder: index });
      }
    });
  }
  async getAboutMapLocations(includeInactive?: boolean): Promise<AboutMapLocation[]> {
    return Array.from(this.aboutMapLocations.values()).filter((l) => includeInactive || l.isActive);
  }
  async getAboutMapLocation(id: number): Promise<AboutMapLocation | undefined> {
    return this.aboutMapLocations.get(id);
  }
  async createAboutMapLocation(location: InsertAboutMapLocation): Promise<AboutMapLocation> {
    const id = this.nextIds.aboutMapLocation++;
    const newLocation = { ...location, id } as AboutMapLocation;
    this.aboutMapLocations.set(id, newLocation);
    return newLocation;
  }
  async updateAboutMapLocation(
    id: number,
    location: Partial<InsertAboutMapLocation>,
  ): Promise<AboutMapLocation | undefined> {
    const existing = this.aboutMapLocations.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...location } as AboutMapLocation;
    this.aboutMapLocations.set(id, updated);
    return updated;
  }
  async deleteAboutMapLocation(id: number): Promise<boolean> {
    return this.aboutMapLocations.delete(id);
  }
  async getAboutSections(includeInactive?: boolean): Promise<AboutSection[]> {
    return Array.from(this.aboutSections.values())
      .filter((s) => includeInactive || s.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  async getAboutSection(id: number): Promise<AboutSection | undefined> {
    return this.aboutSections.get(id);
  }
  async createAboutSection(section: InsertAboutSection): Promise<AboutSection> {
    const id = this.nextIds.aboutSection++;
    const newSection = { ...section, id } as AboutSection;
    this.aboutSections.set(id, newSection);
    return newSection;
  }
  async updateAboutSection(
    id: number,
    section: Partial<InsertAboutSection>,
  ): Promise<AboutSection | undefined> {
    const existing = this.aboutSections.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...section } as AboutSection;
    this.aboutSections.set(id, updated);
    return updated;
  }
  async deleteAboutSection(id: number): Promise<boolean> {
    return this.aboutSections.delete(id);
  }
  async reorderAboutSections(orderedIds: number[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const section = this.aboutSections.get(id);
      if (section) {
        this.aboutSections.set(id, { ...section, sortOrder: index });
      }
    });
  }
  async getAboutStatistics(includeInactive?: boolean): Promise<AboutStatistic[]> {
    return Array.from(this.aboutStatistics.values())
      .filter((s) => includeInactive || s.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  async getAboutStatistic(id: number): Promise<AboutStatistic | undefined> {
    return this.aboutStatistics.get(id);
  }
  async createAboutStatistic(statistic: InsertAboutStatistic): Promise<AboutStatistic> {
    const id = this.nextIds.aboutStatistic++;
    const newStatistic = { ...statistic, id } as AboutStatistic;
    this.aboutStatistics.set(id, newStatistic);
    return newStatistic;
  }
  async updateAboutStatistic(
    id: number,
    statistic: Partial<InsertAboutStatistic>,
  ): Promise<AboutStatistic | undefined> {
    const existing = this.aboutStatistics.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...statistic } as AboutStatistic;
    this.aboutStatistics.set(id, updated);
    return updated;
  }
  async deleteAboutStatistic(id: number): Promise<boolean> {
    return this.aboutStatistics.delete(id);
  }
  async reorderAboutStatistics(orderedIds: number[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      const stat = this.aboutStatistics.get(id);
      if (stat) {
        this.aboutStatistics.set(id, { ...stat, sortOrder: index });
      }
    });
  }
  async getAboutTeamMessage(includeInactive?: boolean): Promise<AboutTeamMessage | undefined> {
    const message = Array.from(this.aboutTeamMessages.values())[0];
    if (message && !includeInactive && !message.isActive) return undefined;
    return message;
  }
  async updateAboutTeamMessage(
    message: Partial<InsertAboutTeamMessage>,
  ): Promise<AboutTeamMessage> {
    const existing = await this.getAboutTeamMessage(true);
    const updated = {
      ...existing,
      ...message,
      id: existing?.id || 1,
    } as AboutTeamMessage;
    this.aboutTeamMessages.set(updated.id, updated);
    return updated;
  }
  async getAboutBatch(): Promise<AboutBatchResponse> {
    return {
      hero: await this.getAboutHero(),
      timeline: await this.getAboutTimelineEntries(),
      mapLocations: await this.getAboutMapLocations(),
      sections: await this.getAboutSections(),
      statistics: await this.getAboutStatistics(),
      teamMessage: await this.getAboutTeamMessage(),
    };
  }

  // Sustainability Repository - Stubs
  async getSustainabilityHero(): Promise<SustainabilityHero | undefined> {
    return Array.from(this.sustainabilityHero.values())[0];
  }
  async updateSustainabilityHero(
    hero: Partial<InsertSustainabilityHero>,
  ): Promise<SustainabilityHero> {
    const existing = await this.getSustainabilityHero();
    const updated = {
      id: existing?.id || 1,
      title: hero.title || existing?.title || "Sustainability",
      subtitle: hero.subtitle || existing?.subtitle || null,
      description: hero.description || existing?.description || null,
      imageId: hero.imageId || existing?.imageId || null,
      videoId: hero.videoId || existing?.videoId || null,
      isActive: hero.isActive !== undefined ? hero.isActive : existing?.isActive || true,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    } as SustainabilityHero;
    this.sustainabilityHero.set(updated.id, updated);
    return updated;
  }
  async getSustainabilityMetrics(): Promise<SustainabilityMetric[]> {
    return Array.from(this.sustainabilityMetrics.values());
  }
  async getSustainabilityMetric(id: number): Promise<SustainabilityMetric | undefined> {
    return this.sustainabilityMetrics.get(id);
  }
  async createSustainabilityMetric(
    metric: InsertSustainabilityMetric,
  ): Promise<SustainabilityMetric> {
    const id = this.nextIds.sustainabilityMetric++;
    const newMetric: SustainabilityMetric = {
      ...metric,
      id: id,
      description: metric.description || null,
      isActive: metric.isActive !== undefined ? metric.isActive : true,
      sortOrder: metric.sortOrder || 0,
      category: metric.category || null,
      unit: metric.unit || null,
      iconName: metric.iconName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SustainabilityMetric;
    this.sustainabilityMetrics.set(id, newMetric);
    return newMetric;
  }
  async updateSustainabilityMetric(
    id: number,
    metric: Partial<InsertSustainabilityMetric>,
  ): Promise<SustainabilityMetric | undefined> {
    const existing = this.sustainabilityMetrics.get(id);
    if (!existing) return undefined;
    const updated: SustainabilityMetric = {
      ...existing,
      ...metric,
      id,
      updatedAt: new Date(),
    } as SustainabilityMetric;
    this.sustainabilityMetrics.set(id, updated);
    return updated;
  }
  async deleteSustainabilityMetric(id: number): Promise<boolean> {
    return this.sustainabilityMetrics.delete(id);
  }
  async reorderSustainabilityMetrics(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id === undefined) continue;
      const metric = this.sustainabilityMetrics.get(id);
      if (metric) {
        metric.sortOrder = i;
        this.sustainabilityMetrics.set(metric.id, metric);
      }
    }
  }
  async getSustainabilityInitiatives(): Promise<SustainabilityInitiative[]> {
    return Array.from(this.sustainabilityInitiatives.values());
  }
  async getSustainabilityInitiative(id: number): Promise<SustainabilityInitiative | undefined> {
    return this.sustainabilityInitiatives.get(id);
  }
  async createSustainabilityInitiative(
    initiative: InsertSustainabilityInitiative,
  ): Promise<SustainabilityInitiative> {
    const id = this.nextIds.sustainabilityInitiative++;
    const newInitiative: SustainabilityInitiative = {
      ...initiative,
      id: id,
      description: initiative.description || null,
      impact: initiative.impact || null,
      imageId: initiative.imageId || null,
      iconName: initiative.iconName || null,
      category: initiative.category || null,
      highlightedFeatures: initiative.highlightedFeatures || null,
      status: initiative.status || "active",
      startDate: initiative.startDate || null,
      targetDate: initiative.targetDate || null,
      isActive: initiative.isActive !== undefined ? initiative.isActive : true,
      sortOrder: initiative.sortOrder || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SustainabilityInitiative;
    this.sustainabilityInitiatives.set(id, newInitiative);
    return newInitiative;
  }
  async updateSustainabilityInitiative(
    id: number,
    initiative: Partial<InsertSustainabilityInitiative>,
  ): Promise<SustainabilityInitiative | undefined> {
    const existing = this.sustainabilityInitiatives.get(id);
    if (!existing) return undefined;
    const updated: SustainabilityInitiative = {
      ...existing,
      ...initiative,
      id,
      updatedAt: new Date(),
    } as SustainabilityInitiative;
    this.sustainabilityInitiatives.set(id, updated);
    return updated;
  }
  async deleteSustainabilityInitiative(id: number): Promise<boolean> {
    return this.sustainabilityInitiatives.delete(id);
  }
  async reorderSustainabilityInitiatives(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id === undefined) continue;
      const item = this.sustainabilityInitiatives.get(id);
      if (item) {
        item.sortOrder = i;
        this.sustainabilityInitiatives.set(item.id, item);
      }
    }
  }
  async getSustainabilityGoals(): Promise<SustainabilityGoal[]> {
    return Array.from(this.sustainabilityGoals.values());
  }
  async getSustainabilityGoal(id: number): Promise<SustainabilityGoal | undefined> {
    return this.sustainabilityGoals.get(id);
  }
  async createSustainabilityGoal(goal: InsertSustainabilityGoal): Promise<SustainabilityGoal> {
    const id = this.nextIds.sustainabilityGoal++;
    const newGoal: SustainabilityGoal = {
      ...goal,
      id: id,
      description: goal.description || null,
      target: goal.target || null,
      currentProgress: goal.currentProgress || "0",
      currentValue: goal.currentValue || "0",
      targetValue: goal.targetValue || "0",
      targetYear: goal.targetYear || null,
      unit: goal.unit || null,
      targetDate: goal.targetDate || null,
      category: goal.category || null,
      priority: goal.priority || "medium",
      isActive: goal.isActive !== undefined ? goal.isActive : true,
      sortOrder: goal.sortOrder || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SustainabilityGoal;
    this.sustainabilityGoals.set(id, newGoal);
    return newGoal;
  }
  async updateSustainabilityGoal(
    id: number,
    goal: Partial<InsertSustainabilityGoal>,
  ): Promise<SustainabilityGoal | undefined> {
    const existing = this.sustainabilityGoals.get(id);
    if (!existing) return undefined;
    const updated: SustainabilityGoal = {
      ...existing,
      ...goal,
      id,
      updatedAt: new Date(),
    } as SustainabilityGoal;
    this.sustainabilityGoals.set(id, updated);
    return updated;
  }
  async deleteSustainabilityGoal(id: number): Promise<boolean> {
    return this.sustainabilityGoals.delete(id);
  }
  async reorderSustainabilityGoals(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id === undefined) continue;
      const item = this.sustainabilityGoals.get(id);
      if (item) {
        item.sortOrder = i;
        this.sustainabilityGoals.set(item.id, item);
      }
    }
  }
  async getUnifiedSustainability(): Promise<UnifiedSustainability | undefined> {
    return Array.from(this.unifiedSustainability.values())[0];
  }
  async updateUnifiedSustainability(
    data: Partial<InsertUnifiedSustainability>,
  ): Promise<UnifiedSustainability> {
    const existing = await this.getUnifiedSustainability();
    const id = existing ? existing.id : 1;
    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date(),
    } as UnifiedSustainability;
    this.unifiedSustainability.set(id, updated);
    return updated;
  }
  async migrateLegacySustainabilityData(): Promise<{ migrated: number }> {
    return { migrated: 0 };
  }
  async validateSustainabilitySync(): Promise<{ success: boolean; issues?: string[] }> {
    return { success: true };
  }
  async syncUnifiedSustainabilityCollections(): Promise<{ success: boolean; count: number }> {
    return { success: true, count: 0 };
  }
  async getSustainabilitySectionHeaders(): Promise<unknown[]> {
    return Array.from(this.sustainabilitySectionHeaders.values()) as unknown as unknown[];
  }
  async updateSustainabilitySectionHeaders(headers: unknown[]): Promise<unknown[]> {
    // Basic implementation since headers is unknown[] but usually contains one header object
    const h = headers[0] as SustainabilitySectionHeaders;
    const id = 1;
    this.sustainabilitySectionHeaders.set(id, h);
    return [h] as unknown as unknown[];
  }
  async getSustainabilityFeatures(): Promise<SustainabilityFeatures | undefined> {
    return Array.from(this.sustainabilityFeatures.values())[0];
  }
  async updateSustainabilityFeatures(
    features: Partial<InsertSustainabilityFeatures>,
  ): Promise<SustainabilityFeatures> {
    const existingArray = Array.from(this.sustainabilityFeatures.values());
    const existing = existingArray[0];
    const id = existing ? existing.id : this.nextIds.sustainabilityFeatures++;
    const updated = {
      ...existing,
      ...features,
      id,
      createdAt: existing?.createdAt || new Date(),
    } as SustainabilityFeatures;
    this.sustainabilityFeatures.set(id, updated);
    return updated;
  }
  async getSustainabilityFabricPortfolio(): Promise<unknown> {
    // Current schema doesn't have a specific table for this, usually part of unifiedSustainability or JSONB
    return undefined;
  }
  async updateSustainabilityFabricPortfolio(portfolio: unknown): Promise<unknown> {
    return portfolio;
  }
  async getSustainabilityCallToAction(): Promise<SustainabilityCallToAction | undefined> {
    return Array.from(this.sustainabilityCallToAction.values())[0];
  }
  async updateSustainabilityCallToAction(
    cta: Partial<SustainabilityCallToAction>,
  ): Promise<SustainabilityCallToAction> {
    const existing = await this.getSustainabilityCallToAction();
    const updated = {
      ...existing,
      ...cta,
    } as SustainabilityCallToAction;
    this.sustainabilityCallToAction.set(1, updated);
    return updated;
  }

  // Manufacturing Repository
  async getRawManufacturingHero(): Promise<ManufacturingHero | undefined> {
    return Array.from(this.manufacturingHero.values())[0];
  }
  async getManufacturingHero(): Promise<ManufacturingHero | undefined> {
    return this.getRawManufacturingHero();
  }
  async updateManufacturingHero(
    hero: Partial<InsertManufacturingHero>,
  ): Promise<ManufacturingHero> {
    const existing = await this.getRawManufacturingHero();
    const id = existing ? existing.id : this.nextIds.manufacturingHero++;
    const updated = {
      ...existing,
      ...hero,
      id,
      updatedAt: new Date(),
    } as ManufacturingHero;
    this.manufacturingHero.set(id, updated);
    return updated;
  }
  async getManufacturingProcesses(): Promise<ManufacturingProcess[]> {
    return Array.from(this.manufacturingProcesses.values());
  }
  async getManufacturingProcess(id: number): Promise<ManufacturingProcess | undefined> {
    return this.manufacturingProcesses.get(id);
  }
  async createManufacturingProcess(
    process: InsertManufacturingProcess,
  ): Promise<ManufacturingProcess> {
    const id = this.nextIds.manufacturingProcess++;
    const newProcess: ManufacturingProcess = {
      ...process,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ManufacturingProcess;
    this.manufacturingProcesses.set(id, newProcess);
    return newProcess;
  }
  async updateManufacturingProcess(
    id: number,
    process: Partial<InsertManufacturingProcess>,
  ): Promise<ManufacturingProcess | undefined> {
    const existing = this.manufacturingProcesses.get(id);
    if (!existing) return undefined;
    const updated: ManufacturingProcess = {
      ...existing,
      ...process,
      id,
      updatedAt: new Date(),
    } as ManufacturingProcess;
    this.manufacturingProcesses.set(id, updated);
    return updated;
  }
  async deleteManufacturingProcess(id: number): Promise<boolean> {
    return this.manufacturingProcesses.delete(id);
  }
  async reorderManufacturingProcesses(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id === undefined) continue;
      const p = this.manufacturingProcesses.get(id);
      if (p) {
        p.sortOrder = i;
        this.manufacturingProcesses.set(p.id, p);
      }
    }
  }
  async getManufacturingCapabilities(): Promise<ManufacturingCapability[]> {
    return Array.from(this.manufacturingCapabilities.values());
  }
  async getManufacturingCapability(id: number): Promise<ManufacturingCapability | undefined> {
    return this.manufacturingCapabilities.get(id);
  }
  async createManufacturingCapability(
    capability: InsertManufacturingCapability,
  ): Promise<ManufacturingCapability> {
    const id = this.nextIds.manufacturingCapability++;
    const newCap: ManufacturingCapability = {
      ...capability,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ManufacturingCapability;
    this.manufacturingCapabilities.set(id, newCap);
    return newCap;
  }
  async updateManufacturingCapability(
    id: number,
    capability: Partial<InsertManufacturingCapability>,
  ): Promise<ManufacturingCapability | undefined> {
    const existing = this.manufacturingCapabilities.get(id);
    if (!existing) return undefined;
    const updated: ManufacturingCapability = {
      ...existing,
      ...capability,
      id,
      updatedAt: new Date(),
    } as ManufacturingCapability;
    this.manufacturingCapabilities.set(id, updated);
    return updated;
  }
  async deleteManufacturingCapability(id: number): Promise<boolean> {
    return this.manufacturingCapabilities.delete(id);
  }
  async reorderManufacturingCapabilities(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id === undefined) continue;
      const c = this.manufacturingCapabilities.get(id);
      if (c) {
        c.sortOrder = i;
        this.manufacturingCapabilities.set(c.id, c);
      }
    }
  }
  async getManufacturingQualities(): Promise<ManufacturingQuality[]> {
    return Array.from(this.manufacturingQualities.values());
  }
  async getManufacturingQuality(id: number): Promise<ManufacturingQuality | undefined> {
    return this.manufacturingQualities.get(id);
  }
  async createManufacturingQuality(
    quality: InsertManufacturingQuality,
  ): Promise<ManufacturingQuality> {
    const id = this.nextIds.manufacturingQuality++;
    const newQual: ManufacturingQuality = {
      ...quality,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ManufacturingQuality;
    this.manufacturingQualities.set(id, newQual);
    return newQual;
  }
  async updateManufacturingQuality(
    id: number,
    quality: Partial<InsertManufacturingQuality>,
  ): Promise<ManufacturingQuality | undefined> {
    const existing = this.manufacturingQualities.get(id);
    if (!existing) return undefined;
    const updated: ManufacturingQuality = {
      ...existing,
      ...quality,
      id,
      updatedAt: new Date(),
    } as ManufacturingQuality;
    this.manufacturingQualities.set(id, updated);
    return updated;
  }
  async deleteManufacturingQuality(id: number): Promise<boolean> {
    return this.manufacturingQualities.delete(id);
  }
  async reorderManufacturingQualities(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id === undefined) continue;
      const q = this.manufacturingQualities.get(id);
      if (q) {
        q.sortOrder = i;
        this.manufacturingQualities.set(q.id, q);
      }
    }
  }

  // Technology Repository
  async getTechnologyHero(): Promise<TechnologyHero | undefined> {
    return Array.from(this.technologyHero.values())[0];
  }
  async updateTechnologyHero(hero: Partial<InsertTechnologyHero>): Promise<TechnologyHero> {
    const existing = Array.from(this.technologyHero.values())[0];
    const id = existing ? existing.id : this.nextIds.technologyHero++;
    const updated = {
      ...existing,
      ...hero,
      id,
      updatedAt: new Date(),
    } as TechnologyHero;
    this.technologyHero.set(id, updated);
    return updated;
  }
  async getTechnologyInnovations(): Promise<TechnologyInnovation[]> {
    return Array.from(this.technologyInnovations.values());
  }
  async getTechnologyInnovation(id: number): Promise<TechnologyInnovation | undefined> {
    return this.technologyInnovations.get(id);
  }
  async createTechnologyInnovation(
    innovation: InsertTechnologyInnovation,
  ): Promise<TechnologyInnovation> {
    const id = this.nextIds.technologyInnovation++;
    const newInnovation = {
      ...innovation,
      id,
      createdAt: new Date(),
    } as TechnologyInnovation;
    this.technologyInnovations.set(id, newInnovation);
    return newInnovation;
  }
  async updateTechnologyInnovation(
    id: number,
    innovation: Partial<InsertTechnologyInnovation>,
  ): Promise<TechnologyInnovation | undefined> {
    const existing = this.technologyInnovations.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...innovation, id } as TechnologyInnovation;
    this.technologyInnovations.set(id, updated);
    return updated;
  }
  async deleteTechnologyInnovation(id: number): Promise<boolean> {
    return this.technologyInnovations.delete(id);
  }
  async reorderTechnologyInnovations(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id === undefined) continue;
      const item = this.technologyInnovations.get(id);
      if (item) {
        item.sortOrder = i;
        this.technologyInnovations.set(item.id, item);
      }
    }
  }
  async getTechnologyEquipment(): Promise<TechnologyEquipment[]> {
    return Array.from(this.technologyEquipment.values());
  }
  async getTechnologyEquipmentItem(id: number): Promise<TechnologyEquipment | undefined> {
    return this.technologyEquipment.get(id);
  }
  async createTechnologyEquipment(
    equipment: InsertTechnologyEquipment,
  ): Promise<TechnologyEquipment> {
    const id = this.nextIds.technologyEquipment++;
    const newItem = {
      ...equipment,
      id,
      createdAt: new Date(),
    } as TechnologyEquipment;
    this.technologyEquipment.set(id, newItem);
    return newItem;
  }
  async updateTechnologyEquipment(
    id: number,
    equipment: Partial<InsertTechnologyEquipment>,
  ): Promise<TechnologyEquipment | undefined> {
    const existing = this.technologyEquipment.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...equipment, id } as TechnologyEquipment;
    this.technologyEquipment.set(id, updated);
    return updated;
  }
  async deleteTechnologyEquipment(id: number): Promise<boolean> {
    return this.technologyEquipment.delete(id);
  }
  async reorderTechnologyEquipment(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id === undefined) continue;
      const item = this.technologyEquipment.get(id);
      if (item) {
        item.sortOrder = i;
        this.technologyEquipment.set(item.id, item);
      }
    }
  }
  async getTechnologyResearch(): Promise<TechnologyResearch[]> {
    return Array.from(this.technologyResearch.values());
  }
  async getTechnologyResearchItem(id: number): Promise<TechnologyResearch | undefined> {
    return this.technologyResearch.get(id);
  }
  async createTechnologyResearch(research: InsertTechnologyResearch): Promise<TechnologyResearch> {
    const id = this.nextIds.technologyResearch++;
    const newItem = {
      ...research,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TechnologyResearch;
    this.technologyResearch.set(id, newItem);
    return newItem;
  }
  async updateTechnologyResearch(
    id: number,
    research: Partial<InsertTechnologyResearch>,
  ): Promise<TechnologyResearch | undefined> {
    const existing = this.technologyResearch.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...research, id, updatedAt: new Date() } as TechnologyResearch;
    this.technologyResearch.set(id, updated);
    return updated;
  }
  async deleteTechnologyResearch(id: number): Promise<boolean> {
    return this.technologyResearch.delete(id);
  }
  async reorderTechnologyResearch(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id === undefined) continue;
      const item = this.technologyResearch.get(id);
      if (item) {
        item.sortOrder = i;
        this.technologyResearch.set(item.id, item);
      }
    }
  }
  async getTechnologyRoadmap(): Promise<TechnologyRoadmap[]> {
    return Array.from(this.technologyRoadmap.values());
  }
  async getTechnologyRoadmapItem(id: number): Promise<TechnologyRoadmap | undefined> {
    return this.technologyRoadmap.get(id);
  }
  async createTechnologyRoadmap(roadmap: InsertTechnologyRoadmap): Promise<TechnologyRoadmap> {
    const id = this.nextIds.technologyRoadmap++;
    const newItem = {
      ...roadmap,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TechnologyRoadmap;
    this.technologyRoadmap.set(id, newItem);
    return newItem;
  }
  async updateTechnologyRoadmap(
    id: number,
    roadmap: Partial<InsertTechnologyRoadmap>,
  ): Promise<TechnologyRoadmap | undefined> {
    const existing = this.technologyRoadmap.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...roadmap, id, updatedAt: new Date() } as TechnologyRoadmap;
    this.technologyRoadmap.set(id, updated);
    return updated;
  }
  async deleteTechnologyRoadmap(id: number): Promise<boolean> {
    return this.technologyRoadmap.delete(id);
  }
  async reorderTechnologyRoadmap(orderedIds: number[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i];
      if (id === undefined) continue;
      const item = this.technologyRoadmap.get(id);
      if (item) {
        item.sortOrder = i;
        this.technologyRoadmap.set(item.id, item);
      }
    }
  }
  async getTechnologyGradientSettings(): Promise<TechnologyGradientSettings | undefined> {
    return Array.from(this.technologyGradientSettings.values())[0];
  }
  async updateTechnologyGradientSettings(
    settings: Partial<InsertTechnologyGradientSettings>,
  ): Promise<TechnologyGradientSettings> {
    const existing = await this.getTechnologyGradientSettings();
    const updated = {
      ...existing,
      ...settings,
    } as TechnologyGradientSettings;
    this.technologyGradientSettings.set(updated.id || 1, updated);
    return updated;
  }
  async migrateGradientSettingsToSpecification(): Promise<unknown> {
    return { success: true };
  }
  async getTechnologyCta(): Promise<TechnologyCta | undefined> {
    return Array.from(this.technologyCta.values())[0];
  }
  async updateTechnologyCta(cta: Partial<TechnologyCta>): Promise<TechnologyCta> {
    const existing = await this.getTechnologyCta();
    const updated = {
      ...existing,
      ...cta,
    } as TechnologyCta;
    this.technologyCta.set(updated.id || 1, updated);
    return updated;
  }
  async createTechnologyCta(cta: InsertTechnologyCta): Promise<TechnologyCta> {
    const id = this.nextIds.technologyCta++;
    const newItem = {
      ...cta,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TechnologyCta;
    this.technologyCta.set(id, newItem);
    return newItem;
  }

  // Webhook Repository
  async getWebhookSubscriptions(): Promise<WebhookSubscription[]> {
    return [];
  }
  async getWebhookSubscription(_id: number): Promise<WebhookSubscription | undefined> {
    return undefined;
  }
  async createWebhookSubscription(
    subscription: InsertWebhookSubscription,
  ): Promise<WebhookSubscription> {
    return subscription as unknown as WebhookSubscription;
  }
  async updateWebhookSubscription(
    _id: number,
    _subscription: Partial<InsertWebhookSubscription>,
  ): Promise<WebhookSubscription | undefined> {
    return undefined;
  }
  async deleteWebhookSubscription(_id: number): Promise<boolean> {
    return true;
  }
  async logWebhookDelivery(_delivery: InsertWebhookDelivery): Promise<void> {
    // No-op for tests
  }

  // System Repository
  async getAnimationErrors(): Promise<AnimationError[]> {
    return Array.from(this.animationErrors.values());
  }
  async getAnimationError(id: number): Promise<AnimationError | undefined> {
    return this.animationErrors.get(id);
  }
  async createAnimationError(error: InsertAnimationError): Promise<AnimationError> {
    const id = this.nextIds.animationError++;
    const newError = { ...error, id, createdAt: new Date() } as AnimationError;
    this.animationErrors.set(id, newError);
    return newError;
  }
  async updateAnimationError(
    id: number,
    error: Partial<InsertAnimationError>,
  ): Promise<AnimationError | undefined> {
    const existing = this.animationErrors.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...error } as AnimationError;
    this.animationErrors.set(id, updated);
    return updated;
  }
  async deleteAnimationError(id: number): Promise<boolean> {
    return this.animationErrors.delete(id);
  }
  async getUnresolvedAnimationErrors(): Promise<AnimationError[]> {
    return Array.from(this.animationErrors.values()).filter((e) => !e.resolved);
  }
  async markAnimationErrorResolved(id: number): Promise<boolean> {
    const error = this.animationErrors.get(id);
    if (!error) return false;
    this.animationErrors.set(id, {
      ...error,
      resolved: true,
      resolvedAt: new Date(),
    } as AnimationError);
    return true;
  }
  async getPerformanceMetrics(): Promise<PerformanceMetric[]> {
    return Array.from(this.performanceMetrics.values());
  }
  async getPerformanceMetric(id: number): Promise<PerformanceMetric | undefined> {
    return this.performanceMetrics.get(id);
  }
  async createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const id = this.nextIds.performanceMetric++;
    const newMetric = { ...metric, id, timestamp: new Date() } as PerformanceMetric;
    this.performanceMetrics.set(id, newMetric);
    return newMetric;
  }
  async deletePerformanceMetric(id: number): Promise<boolean> {
    return this.performanceMetrics.delete(id);
  }
  async getPerformanceMetricsByType(metricType: string): Promise<PerformanceMetric[]> {
    return Array.from(this.performanceMetrics.values()).filter((m) => m.metricType === metricType);
  }
  async getPerformanceMetricsByComponent(componentName: string): Promise<PerformanceMetric[]> {
    return Array.from(this.performanceMetrics.values()).filter(
      (m) => m.componentName === componentName,
    );
  }
  async getRecentPerformanceMetrics(hours: number): Promise<PerformanceMetric[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.performanceMetrics.values()).filter((m) => {
      if (!m.timestamp) return false;
      return new Date(m.timestamp) >= cutoff;
    });
  }
  async getStorageAnalysisResults(): Promise<StorageAnalysisResult[]> {
    return Array.from(this.storageAnalysisResults.values());
  }
  async addStorageAnalysisResult(
    result: InsertStorageAnalysisResult,
  ): Promise<StorageAnalysisResult> {
    const id = this.nextIds.storageAnalysisResult++;
    const newResult = {
      ...result,
      id,
      timestamp: new Date().toISOString(),
    } as StorageAnalysisResult;
    this.storageAnalysisResults.set(id, newResult);
    return newResult;
  }
  async deleteStorageAnalysisResult(id: number): Promise<boolean> {
    return this.storageAnalysisResults.delete(id);
  }
  async getStorageChangeLogs(): Promise<StorageChangeLog[]> {
    return Array.from(this.storageChangeLogs.values());
  }
  async addStorageChangeLog(changeLog: InsertStorageChangeLog): Promise<StorageChangeLog> {
    const id = this.nextIds.storageChangeLog++;
    const newLog = { ...changeLog, id, timestamp: new Date().toISOString() } as StorageChangeLog;
    this.storageChangeLogs.set(id, newLog);
    return newLog;
  }
  async deleteStorageChangeLog(id: number): Promise<boolean> {
    return this.storageChangeLogs.delete(id);
  }
  async getAuditLogsForRecord(tableName: string, recordId: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).filter(
      (l) => l.tableName === tableName && l.recordId === recordId,
    );
  }
  async getRecentAuditLogs(limit = 100): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).slice(-limit);
  }
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const id = this.nextIds.audit++;
    const a: AuditLog = { ...log, id, timestamp: new Date() } as unknown as AuditLog;
    this.auditLogs.set(id, a);
    return a;
  }
  setAuditTrailEnabled(_enabled: boolean): void {}
  configureTrackedTables(_tables: string[]): void {}
  async repairDatabaseIntegrity(): Promise<{
    validated: number;
    repaired: number;
    removed: number;
  }> {
    return { validated: 0, repaired: 0, removed: 0 };
  }
  async cleanupAllCorruptEntries(): Promise<{
    totalCleaned: number;
    results: Record<string, unknown>;
  }> {
    return { totalCleaned: 0, results: {} };
  }
  async checkDatabaseHealth(): Promise<{ healthy: boolean; latency: number }> {
    return { healthy: true, latency: 0 };
  }

  // Blog Repository
  async getBlogPosts(
    limit = 50,
    offset = 0,
    filters?: {
      status?: string;
      categoryId?: number;
      authorId?: string;
      search?: string;
      includeDeleted?: boolean;
    },
  ): Promise<{ posts: BlogPost[]; total: number }> {
    let posts = Array.from(this.blogPosts.values());

    if (!filters?.includeDeleted) {
      posts = posts.filter((p) => !p.deletedAt);
    }

    if (filters?.status) {
      posts = posts.filter((p) => p.status === filters.status);
    }

    if (filters?.categoryId) {
      posts = posts.filter((p) => p.categoryId === filters.categoryId);
    }

    if (filters?.authorId) {
      posts = posts.filter((p) => p.authorId === filters.authorId);
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.content.toLowerCase().includes(s) ||
          p.excerpt?.toLowerCase().includes(s),
      );
    }

    const total = posts.length;
    const paginated = posts.slice(offset, offset + limit);

    return { posts: paginated, total };
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find((p) => p.slug === slug);
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.nextIds.blogPost++;
    const newPost: BlogPost = {
      ...post,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      publishedAt: post.status === "published" ? new Date() : null,
      featuredImageId: post.featuredImageId ?? null,
      metaTitle: post.metaTitle ?? null,
      metaDescription: post.metaDescription ?? null,
      canonicalUrl: post.canonicalUrl ?? null,
      ogImage: post.ogImage ?? null,
      keywords: post.keywords ?? null,
    } as unknown as BlogPost;
    this.blogPosts.set(id, newPost);
    return newPost;
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existing = this.blogPosts.get(id);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...post,
      updatedAt: new Date(),
      publishedAt:
        post.status === "published" && !existing.publishedAt ? new Date() : existing.publishedAt,
    } as BlogPost;

    this.blogPosts.set(id, updated);
    return updated;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const post = this.blogPosts.get(id);
    if (!post) return false;
    this.blogPosts.set(id, { ...post, deletedAt: new Date() } as BlogPost);
    return true;
  }

  async restoreBlogPost(id: number): Promise<boolean> {
    const post = this.blogPosts.get(id);
    if (!post) return false;
    this.blogPosts.set(id, { ...post, deletedAt: null } as BlogPost);
    return true;
  }

  async getBlogCategories(): Promise<BlogCategory[]> {
    return Array.from(this.blogCategories.values());
  }

  async createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
    const id = this.nextIds.blogCategory++;
    const newCategory: BlogCategory = {
      ...category,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as BlogCategory;
    this.blogCategories.set(id, newCategory);
    return newCategory;
  }

  async updateBlogCategory(
    id: number,
    category: Partial<InsertBlogCategory>,
  ): Promise<BlogCategory | undefined> {
    const existing = this.blogCategories.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...category, updatedAt: new Date() };
    this.blogCategories.set(id, updated as BlogCategory);
    return updated as BlogCategory;
  }

  async deleteBlogCategory(id: number): Promise<boolean> {
    return this.blogCategories.delete(id);
  }

  async addCrmLog(_inquiryId: number, _log: string): Promise<void> {
    // Mock
  }
  async subscribeToNewsletter(email: string): Promise<{ success: boolean }> {
    return { success: true };
  }
  async getDeletedCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).filter((c) => !!c.deletedAt);
  }
}
