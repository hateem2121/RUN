/**
 * SERVER SERVICES BARREL EXPORT
 *
 * Centralized entry point for all server domain services organized by bounded context.
 */

// Admin Services
export * from "./admin/index.js";

// Catalog Domain Services
export * from "./catalog/accessory.service.js";
export * from "./catalog/category.service.js";
export * from "./catalog/product.service.js";

// CMS Domain Services
export * from "./cms/about.service.js";
export * from "./cms/blog.service.js";
export * from "./cms/footer.service.js";
export * from "./cms/homepage.service.js";
export * from "./cms/legal.service.js";
export * from "./cms/manufacturing.service.js";
export * from "./cms/misc.service.js";
export * from "./cms/navigation.service.js";
export * from "./cms/services.service.js";
export * from "./cms/sustainability.service.js";
export * from "./cms/technology.service.js";
export * from "./media/media.service.js";
// Media Domain Services
export * from "./media/media-content.service.js";
export * from "./media/media-query.service.js";
export * from "./media/media-upload.service.js";

// System Domain Services
export * from "./system/auth.service.js";
export * from "./system/contact.service.js";
export * from "./system/embedding.service.js";
export * from "./system/inquiry.service.js";
export * from "./system/job-metrics.service.js";
export * from "./system/metrics.service.js";
export * from "./system/newsletter.service.js";
export * from "./system/semantic-search.service.js";
export * from "./system/system.service.js";
export * from "./system/webhook.service.js";

// Background Task Services
export * from "./tasks/media-queue.service.js";
