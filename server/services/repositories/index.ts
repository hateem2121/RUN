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
export { userRepository } from "./user-repository.js";

// Product and category operations
import { ProductRepository } from "./product-repository.js";
export const productRepository = new ProductRepository();

// Accessories
export { accessoryRepository } from "./accessory-repository.js";
// Media and folder operations
export { mediaRepository } from "./media-repository.js";

// Page content (homepage, about, manufacturing, etc.)
export * from "./page-content/index.js";

// Miscellaneous entities (fibers, fabrics, certificates, size charts)
import { MiscRepository } from "./misc-repository.js";
export const miscRepository = new MiscRepository();

// Blog operations
import { BlogRepository } from "./blog-repository.js";

export const blogRepository = new BlogRepository();

// Shared utilities
export * from "./shared-utils.js";
// System operations (audit logs, settings)
export { systemRepository } from "./system-repository.js";
export { webhookRepository } from "./webhook-repository.js";
