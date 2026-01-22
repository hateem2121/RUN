/**
 * Repository Index
 * 
 * Central export point for all domain repositories.
 * Import repositories directly instead of using the legacy IStorage interface.
 * 
 * @example
 * // ❌ Legacy pattern (deprecated)
 * import { getStorage } from "../lib/storage-singleton.js";
 * const products = await getStorage().getProducts();
 * 
 * // ✅ New pattern (recommended)
 * import { productRepository } from "../lib/db/repositories/index.js";
 * const products = await productRepository.getProducts();
 */

// User operations
export { userRepository, UserRepository } from "./user-repository.js";

// Product and category operations
import { ProductRepository } from "./product-repository.js";
export { ProductRepository, type ProductSummary, type ProductDetail } from "./product-repository.js";
export const productRepository = new ProductRepository();

// Media and folder operations
export { mediaRepository, MediaRepository } from "./media-repository.js";

// Accessories
export { accessoryRepository, AccessoryRepository } from "./accessory-repository.js";

// Page content (homepage, about, manufacturing, etc.)
import { PageContentRepository } from "./page-content-repository.js";
export { PageContentRepository } from "./page-content-repository.js";
export const pageContentRepository = new PageContentRepository();

// Miscellaneous entities (fibers, fabrics, certificates, size charts)
import { MiscRepository } from "./misc-repository.js";
export { MiscRepository } from "./misc-repository.js";
export const miscRepository = new MiscRepository();

// Shared utilities
export * from "./shared-utils.js";
