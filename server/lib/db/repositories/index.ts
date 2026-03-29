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
export { UserRepository, userRepository } from "./user-repository.js";

// Product and category operations
import { ProductRepository } from "./product-repository.js";

export {
  type ProductDetail,
  ProductRepository,
  type ProductSummary,
} from "./product-repository.js";
export const productRepository = new ProductRepository();

// Accessories
export { AccessoryRepository, accessoryRepository } from "./accessory-repository.js";
// Media and folder operations
export { MediaRepository, mediaRepository } from "./media-repository.js";

// Page content (homepage, about, manufacturing, etc.)
import { PageContentRepository } from "./page-content-repository.js";

export { PageContentRepository } from "./page-content-repository.js";
export const pageContentRepository = new PageContentRepository();

// Miscellaneous entities (fibers, fabrics, certificates, size charts)
import { MiscRepository } from "./misc-repository.js";

export { MiscRepository } from "./misc-repository.js";
export const miscRepository = new MiscRepository();

// Blog operations
import { BlogRepository } from "./blog-repository.js";

export { BlogRepository } from "./blog-repository.js";
export const blogRepository = new BlogRepository();

// Shared utilities
export * from "./shared-utils.js";
// System operations (audit logs, settings)
export { SystemRepository, systemRepository } from "./system-repository.js";
export { WebhookRepository, webhookRepository } from "./webhook-repository.js";
