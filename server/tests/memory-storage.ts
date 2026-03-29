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
  InsertMediaAsset,
  InsertNavigationGlassmorphismSettings,
  InsertNavigationItem,
  InsertPerformanceMetric,
  InsertProduct,
  InsertSizeChart,
  InsertStorageAnalysisResult,
  InsertStorageChangeLog,
  LogoAnimationSettings,
  MediaAsset,
  NavigationGlassmorphismSettings,
  NavigationItem,
  PerformanceMetric,
  Product,
  SizeChart,
  StorageAnalysisResult,
  StorageChangeLog,
  UpsertUser,
  User,
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
    filters?: { type?: string; folderId?: number; search?: string },
  ): Promise<MediaAsset[]> {
    let assets = Array.from(this.mediaAssets.values()).filter((a) => !a.deletedAt);
    if (filters?.type) assets = assets.filter((a) => a.type === filters.type);
    if (filters?.folderId !== undefined)
      assets = assets.filter((a) => a.folderId === filters.folderId);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      assets = assets.filter(
        (a) => a.filename.toLowerCase().includes(s) || a.altText?.toLowerCase().includes(s),
      );
    }
    return assets.slice(offset, offset + limit);
  }
  async getMediaAssetsCount(filters?: {
    type?: string;
    folderId?: number;
    search?: string;
  }): Promise<number> {
    return (await this.getMediaAssets(100000, 0, filters)).length;
  }
  async getMediaAssetsWithCount(
    limit: number,
    offset: number,
    filters?: { type?: string; folderId?: number; search?: string },
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
  async getHomepageFeaturedProducts(limit = 20): Promise<Partial<Product>[]> {
    return Array.from(this.products.values())
      .filter((p) => p.isActive && !p.deletedAt && p.isFeatured)
      .slice(0, limit) as unknown as Partial<Product>[];
  }
  async getProductsSummary(
    limit = 100,
    offset = 0,
    _options?: RepositoryCacheOptions,
  ): Promise<{ products: Partial<Product>[]; totalCount: number }> {
    const products = await this.getProducts(limit, offset);
    const totalCount = await this.getProductsCount();
    return { products: products as unknown as Partial<Product>[], totalCount };
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
  async getFeaturedProducts(): Promise<ProductSummary[]> {
    return Array.from(this.products.values()).filter(
      (p) => p.isActive && !p.deletedAt && p.isFeatured,
    ) as unknown as ProductSummary[];
  }
  async searchProducts(query: string, limit = 100, offset = 0): Promise<ProductSummary[]> {
    const q = query.toLowerCase();
    return Array.from(this.products.values())
      .filter(
        (p) =>
          (p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) &&
          p.isActive &&
          !p.deletedAt,
      )
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
      product: { ...p, canonicalUrl: p.urlPath } as unknown as Product,
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
    _config: Partial<InsertContactPageConfiguration>,
  ): Promise<ContactPageConfiguration | undefined> {
    return undefined;
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
  async getInquiryStats(): Promise<unknown> {
    return { byStatus: {}, bySource: {}, recentCount: 0 };
  }

  // Content Repository - Stubs for rest
  async getHomepageHero(): Promise<HomepageHero | undefined> {
    return undefined;
  }
  async updateHomepageHero(hero: Partial<InsertHomepageHero>): Promise<HomepageHero> {
    return hero as unknown as HomepageHero;
  }
  async getHomepageSlogans(): Promise<HomepageSlogan[]> {
    return [];
  }
  async getHomepageSlogan(_id: number): Promise<HomepageSlogan | undefined> {
    return undefined;
  }
  async createHomepageSlogan(slogan: InsertHomepageSlogan): Promise<HomepageSlogan> {
    return slogan as unknown as HomepageSlogan;
  }
  async updateHomepageSlogan(
    _id: number,
    _slogan: Partial<InsertHomepageSlogan>,
  ): Promise<HomepageSlogan | undefined> {
    return undefined;
  }
  async deleteHomepageSlogan(_id: number): Promise<boolean> {
    return true;
  }
  async reorderHomepageSlogans(_slogans: unknown[]): Promise<void> {}
  async getHomepageProcessCards(_includeInactive?: boolean): Promise<HomepageProcessCard[]> {
    return [];
  }
  async getHomepageProcessCard(_id: number): Promise<HomepageProcessCard | undefined> {
    return undefined;
  }
  async createHomepageProcessCard(card: InsertHomepageProcessCard): Promise<HomepageProcessCard> {
    return card as unknown as HomepageProcessCard;
  }
  async updateHomepageProcessCard(
    _id: number,
    _card: Partial<InsertHomepageProcessCard>,
  ): Promise<HomepageProcessCard | undefined> {
    return undefined;
  }
  async deleteHomepageProcessCard(_id: number): Promise<boolean> {
    return true;
  }
  async reorderHomepageProcessCards(_cards: unknown[]): Promise<void> {}
  async getHomepageSections(): Promise<HomepageSection[]> {
    return [];
  }
  async getHomepageSection(_name: string): Promise<HomepageSection | undefined> {
    return undefined;
  }
  async getHomepageSectionById(_id: number): Promise<HomepageSection | undefined> {
    return undefined;
  }
  async updateHomepageSection(
    _name: string,
    section: Partial<InsertHomepageSection>,
  ): Promise<HomepageSection> {
    return section as unknown as HomepageSection;
  }
  async updateHomepageSectionById(
    _id: number,
    _section: Partial<InsertHomepageSection>,
  ): Promise<HomepageSection | undefined> {
    return undefined;
  }
  async getHomepageSustainability(): Promise<HomepageSustainability | undefined> {
    return undefined;
  }
  async updateHomepageSustainability(
    sustainability: Partial<InsertHomepageSustainability>,
  ): Promise<HomepageSustainability> {
    return sustainability as unknown as HomepageSustainability;
  }
  async getLogoAnimationSettings(): Promise<LogoAnimationSettings | undefined> {
    return undefined;
  }
  async updateLogoAnimationSettings(
    settings: Partial<InsertLogoAnimationSettings>,
  ): Promise<LogoAnimationSettings> {
    return settings as unknown as LogoAnimationSettings;
  }
  async getFooterSections(): Promise<unknown[]> {
    return [];
  }
  async getFooterConfiguration(): Promise<FooterConfiguration | undefined> {
    return undefined;
  }
  async createFooterLink(link: unknown): Promise<unknown> {
    return link;
  }
  async getAboutHero(_includeInactive?: boolean): Promise<AboutHero | undefined> {
    return undefined;
  }
  async updateAboutHero(hero: Partial<InsertAboutHero>): Promise<AboutHero> {
    return hero as unknown as AboutHero;
  }
  async getAboutTimelineEntries(_includeInactive?: boolean): Promise<AboutTimelineEntry[]> {
    return [];
  }
  async getAboutTimelineEntry(_id: number): Promise<AboutTimelineEntry | undefined> {
    return undefined;
  }
  async createAboutTimelineEntry(entry: InsertAboutTimelineEntry): Promise<AboutTimelineEntry> {
    return entry as unknown as AboutTimelineEntry;
  }
  async updateAboutTimelineEntry(
    _id: number,
    _entry: Partial<InsertAboutTimelineEntry>,
  ): Promise<AboutTimelineEntry | undefined> {
    return undefined;
  }
  async deleteAboutTimelineEntry(_id: number): Promise<boolean> {
    return true;
  }
  async reorderAboutTimelineEntries(_entries: unknown[]): Promise<void> {}
  async getAboutMapLocations(_includeInactive?: boolean): Promise<AboutMapLocation[]> {
    return [];
  }
  async getAboutMapLocation(_id: number): Promise<AboutMapLocation | undefined> {
    return undefined;
  }
  async createAboutMapLocation(location: InsertAboutMapLocation): Promise<AboutMapLocation> {
    return location as unknown as AboutMapLocation;
  }
  async updateAboutMapLocation(
    _id: number,
    _location: Partial<InsertAboutMapLocation>,
  ): Promise<AboutMapLocation | undefined> {
    return undefined;
  }
  async deleteAboutMapLocation(_id: number): Promise<boolean> {
    return true;
  }
  async getAboutSections(_includeInactive?: boolean): Promise<AboutSection[]> {
    return [];
  }
  async getAboutSection(_id: number): Promise<AboutSection | undefined> {
    return undefined;
  }
  async createAboutSection(section: InsertAboutSection): Promise<AboutSection> {
    return section as unknown as AboutSection;
  }
  async updateAboutSection(
    _id: number,
    _section: Partial<InsertAboutSection>,
  ): Promise<AboutSection | undefined> {
    return undefined;
  }
  async deleteAboutSection(_id: number): Promise<boolean> {
    return true;
  }
  async reorderAboutSections(_sections: unknown[]): Promise<void> {}
  async getAboutStatistics(_includeInactive?: boolean): Promise<AboutStatistic[]> {
    return [];
  }
  async getAboutStatistic(_id: number): Promise<AboutStatistic | undefined> {
    return undefined;
  }
  async createAboutStatistic(statistic: InsertAboutStatistic): Promise<AboutStatistic> {
    return statistic as unknown as AboutStatistic;
  }
  async updateAboutStatistic(
    _id: number,
    _statistic: Partial<InsertAboutStatistic>,
  ): Promise<AboutStatistic | undefined> {
    return undefined;
  }
  async deleteAboutStatistic(_id: number): Promise<boolean> {
    return true;
  }
  async reorderAboutStatistics(_statistics: unknown[]): Promise<void> {}
  async getAboutTeamMessage(_includeInactive?: boolean): Promise<AboutTeamMessage | undefined> {
    return undefined;
  }
  async updateAboutTeamMessage(
    message: Partial<InsertAboutTeamMessage>,
  ): Promise<AboutTeamMessage> {
    return message as unknown as AboutTeamMessage;
  }

  // Sustainability Repository - Stubs
  async getSustainabilityHero(): Promise<unknown> {
    return undefined;
  }
  async updateSustainabilityHero(hero: unknown): Promise<unknown> {
    return hero;
  }
  async getSustainabilityMetrics(): Promise<unknown[]> {
    return [];
  }
  async getSustainabilityMetric(_id: number): Promise<unknown> {
    return undefined;
  }
  async createSustainabilityMetric(metric: unknown): Promise<unknown> {
    return metric;
  }
  async updateSustainabilityMetric(_id: number, _metric: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteSustainabilityMetric(_id: number): Promise<boolean> {
    return true;
  }
  async reorderSustainabilityMetrics(_metrics: unknown[]): Promise<void> {}
  async getSustainabilityInitiatives(): Promise<unknown[]> {
    return [];
  }
  async getSustainabilityInitiative(_id: number): Promise<unknown> {
    return undefined;
  }
  async createSustainabilityInitiative(initiative: unknown): Promise<unknown> {
    return initiative;
  }
  async updateSustainabilityInitiative(_id: number, _initiative: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteSustainabilityInitiative(_id: number): Promise<boolean> {
    return true;
  }
  async reorderSustainabilityInitiatives(_initiatives: unknown[]): Promise<void> {}
  async getSustainabilityGoals(): Promise<unknown[]> {
    return [];
  }
  async getSustainabilityGoal(_id: number): Promise<unknown> {
    return undefined;
  }
  async createSustainabilityGoal(goal: unknown): Promise<unknown> {
    return goal;
  }
  async updateSustainabilityGoal(_id: number, _goal: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteSustainabilityGoal(_id: number): Promise<boolean> {
    return true;
  }
  async reorderSustainabilityGoals(_goals: unknown[]): Promise<void> {}
  async getUnifiedSustainability(): Promise<unknown> {
    return undefined;
  }
  async updateUnifiedSustainability(data: unknown): Promise<unknown> {
    return data;
  }
  async migrateLegacySustainabilityData(): Promise<unknown> {
    return undefined;
  }
  async validateSustainabilitySync(): Promise<unknown> {
    return { success: true };
  }
  async syncUnifiedSustainabilityCollections(): Promise<unknown> {
    return { success: true, count: 0 };
  }
  async getSustainabilitySectionHeaders(): Promise<unknown[]> {
    return [];
  }
  async updateSustainabilitySectionHeaders(headers: unknown[]): Promise<unknown[]> {
    return headers;
  }
  async getSustainabilityFeatures(): Promise<unknown> {
    return undefined;
  }
  async updateSustainabilityFeatures(features: unknown): Promise<unknown> {
    return features;
  }
  async getSustainabilityFabricPortfolio(): Promise<unknown> {
    return undefined;
  }
  async updateSustainabilityFabricPortfolio(portfolio: unknown): Promise<unknown> {
    return portfolio;
  }
  async getSustainabilityCallToAction(): Promise<unknown> {
    return undefined;
  }
  async updateSustainabilityCallToAction(cta: unknown): Promise<unknown> {
    return cta;
  }

  // Manufacturing Repository - Stubs
  async getManufacturingHero(): Promise<unknown> {
    return undefined;
  }
  async updateManufacturingHero(hero: unknown): Promise<unknown> {
    return hero;
  }
  async getManufacturingProcesses(): Promise<unknown[]> {
    return [];
  }
  async getManufacturingProcess(_id: number): Promise<unknown> {
    return undefined;
  }
  async createManufacturingProcess(process: unknown): Promise<unknown> {
    return process;
  }
  async updateManufacturingProcess(_id: number, _process: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteManufacturingProcess(_id: number): Promise<boolean> {
    return true;
  }
  async reorderManufacturingProcesses(_processes: unknown[]): Promise<void> {}
  async getManufacturingCapabilities(): Promise<unknown[]> {
    return [];
  }
  async getManufacturingCapability(_id: number): Promise<unknown> {
    return undefined;
  }
  async createManufacturingCapability(capability: unknown): Promise<unknown> {
    return capability;
  }
  async updateManufacturingCapability(_id: number, _capability: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteManufacturingCapability(_id: number): Promise<boolean> {
    return true;
  }
  async reorderManufacturingCapabilities(_capabilities: unknown[]): Promise<void> {}
  async getManufacturingQualities(): Promise<unknown[]> {
    return [];
  }
  async getManufacturingQuality(_id: number): Promise<unknown> {
    return undefined;
  }
  async createManufacturingQuality(quality: unknown): Promise<unknown> {
    return quality;
  }
  async updateManufacturingQuality(_id: number, _quality: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteManufacturingQuality(_id: number): Promise<boolean> {
    return true;
  }
  async reorderManufacturingQualities(_qualities: unknown[]): Promise<void> {}

  // Technology Repository - Stubs
  async getTechnologyHero(): Promise<unknown> {
    return undefined;
  }
  async updateTechnologyHero(hero: unknown): Promise<unknown> {
    return hero;
  }
  async getTechnologyInnovations(): Promise<unknown[]> {
    return [];
  }
  async getTechnologyInnovation(_id: number): Promise<unknown> {
    return undefined;
  }
  async createTechnologyInnovation(innovation: unknown): Promise<unknown> {
    return innovation;
  }
  async updateTechnologyInnovation(_id: number, _innovation: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteTechnologyInnovation(_id: number): Promise<boolean> {
    return true;
  }
  async reorderTechnologyInnovations(_innovations: unknown[]): Promise<void> {}
  async getTechnologyEquipment(): Promise<unknown[]> {
    return [];
  }
  async getTechnologyEquipmentItem(_id: number): Promise<unknown> {
    return undefined;
  }
  async createTechnologyEquipment(equipment: unknown): Promise<unknown> {
    return equipment;
  }
  async updateTechnologyEquipment(_id: number, _equipment: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteTechnologyEquipment(_id: number): Promise<boolean> {
    return true;
  }
  async reorderTechnologyEquipment(_equipment: unknown[]): Promise<void> {}
  async getTechnologyResearch(): Promise<unknown[]> {
    return [];
  }
  async getTechnologyResearchItem(_id: number): Promise<unknown> {
    return undefined;
  }
  async createTechnologyResearch(research: unknown): Promise<unknown> {
    return research;
  }
  async updateTechnologyResearch(_id: number, _research: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteTechnologyResearch(_id: number): Promise<boolean> {
    return true;
  }
  async reorderTechnologyResearch(_research: unknown[]): Promise<void> {}
  async getTechnologyRoadmap(): Promise<unknown[]> {
    return [];
  }
  async getTechnologyRoadmapItem(_id: number): Promise<unknown> {
    return undefined;
  }
  async createTechnologyRoadmap(roadmap: unknown): Promise<unknown> {
    return roadmap;
  }
  async updateTechnologyRoadmap(_id: number, _roadmap: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteTechnologyRoadmap(_id: number): Promise<boolean> {
    return true;
  }
  async reorderTechnologyRoadmap(_roadmap: unknown[]): Promise<void> {}
  async getTechnologyGradientSettings(): Promise<unknown> {
    return undefined;
  }
  async updateTechnologyGradientSettings(settings: unknown): Promise<unknown> {
    return settings;
  }
  async migrateGradientSettingsToSpecification(): Promise<unknown> {
    return undefined;
  }
  async getTechnologyCta(): Promise<unknown> {
    return undefined;
  }
  async updateTechnologyCta(cta: unknown): Promise<unknown> {
    return cta;
  }
  async createTechnologyCta(cta: unknown): Promise<unknown> {
    return cta;
  }

  // Webhook Repository - Stubs
  async getWebhookSubscriptions(): Promise<unknown[]> {
    return [];
  }
  async getWebhookSubscription(_id: number): Promise<unknown> {
    return undefined;
  }
  async createWebhookSubscription(subscription: unknown): Promise<unknown> {
    return subscription;
  }
  async updateWebhookSubscription(_id: number, _subscription: unknown): Promise<unknown> {
    return undefined;
  }
  async deleteWebhookSubscription(_id: number): Promise<boolean> {
    return true;
  }
  async logWebhookDelivery(_delivery: unknown): Promise<void> {}

  // System Repository
  async getAnimationErrors(): Promise<AnimationError[]> {
    return [];
  }
  async getAnimationError(_id: number): Promise<AnimationError | undefined> {
    return undefined;
  }
  async createAnimationError(error: InsertAnimationError): Promise<AnimationError> {
    return error as unknown as AnimationError;
  }
  async updateAnimationError(
    _id: number,
    _error: Partial<InsertAnimationError>,
  ): Promise<AnimationError | undefined> {
    return undefined;
  }
  async deleteAnimationError(_id: number): Promise<boolean> {
    return true;
  }
  async getUnresolvedAnimationErrors(): Promise<AnimationError[]> {
    return [];
  }
  async markAnimationErrorResolved(_id: number): Promise<boolean> {
    return true;
  }
  async getPerformanceMetrics(): Promise<PerformanceMetric[]> {
    return [];
  }
  async getPerformanceMetric(_id: number): Promise<PerformanceMetric | undefined> {
    return undefined;
  }
  async createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    return metric as unknown as PerformanceMetric;
  }
  async deletePerformanceMetric(_id: number): Promise<boolean> {
    return true;
  }
  async getPerformanceMetricsByType(_metricType: string): Promise<PerformanceMetric[]> {
    return [];
  }
  async getPerformanceMetricsByComponent(_componentName: string): Promise<PerformanceMetric[]> {
    return [];
  }
  async getRecentPerformanceMetrics(_hours: number): Promise<PerformanceMetric[]> {
    return [];
  }
  async getStorageAnalysisResults(): Promise<StorageAnalysisResult[]> {
    return [];
  }
  async addStorageAnalysisResult(
    result: InsertStorageAnalysisResult,
  ): Promise<StorageAnalysisResult> {
    return result as unknown as StorageAnalysisResult;
  }
  async deleteStorageAnalysisResult(_id: number): Promise<boolean> {
    return true;
  }
  async getStorageChangeLogs(): Promise<StorageChangeLog[]> {
    return [];
  }
  async addStorageChangeLog(changeLog: InsertStorageChangeLog): Promise<StorageChangeLog> {
    return changeLog as unknown as StorageChangeLog;
  }
  async deleteStorageChangeLog(_id: number): Promise<boolean> {
    return true;
  }
  async getAuditLogsForRecord(tableName: string, recordId: string): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).filter(
      (l) => l.tableName === tableName && l.recordId === recordId,
    );
  }
  async getRecentAuditLogs(limit = 100): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).slice(-limit);
  }
  async createAuditLog(log: unknown): Promise<AuditLog> {
    const id = this.nextIds.audit++;
    const a: AuditLog = { ...(log as object), id, timestamp: new Date() } as unknown as AuditLog;
    this.auditLogs.set(id, a);
    return a;
  }
  setAuditTrailEnabled(_enabled: boolean): void {}
  configureTrackedTables(_tables: string[]): void {}
  async repairDatabaseIntegrity(): Promise<unknown> {
    return { validated: 0, repaired: 0, removed: 0 };
  }
  async cleanupAllCorruptEntries(): Promise<unknown> {
    return { totalCleaned: 0, results: {} };
  }
  async checkDatabaseHealth(): Promise<unknown> {
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
}
