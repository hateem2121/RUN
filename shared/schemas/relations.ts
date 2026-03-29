import { relations } from "drizzle-orm";
import { accessories, certificates, sizeCharts } from "./catalog";
import { categories } from "./categories";
import { fabricCompositions, fabrics, fibers } from "./materials";
import { mediaAssets } from "./media";
import { products } from "./products";

// Products Relations
export const productsRelations = relations(products, ({ one }) => ({
  // One-to-one with primary image
  primaryImage: one(mediaAssets, {
    fields: [products.primaryImageId],
    references: [mediaAssets.id],
    relationName: "productPrimaryImage",
  }),
  // One-to-one with primary video
  primaryVideo: one(mediaAssets, {
    fields: [products.primaryVideoId],
    references: [mediaAssets.id],
    relationName: "productPrimaryVideo",
  }),
  // One-to-one with 3D model file
  modelFile: one(mediaAssets, {
    fields: [products.modelFileId],
    references: [mediaAssets.id],
    relationName: "productModelFile",
  }),
  // One-to-one with category
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  // One-to-one with fabric
  fabric: one(fabrics, {
    fields: [products.fabricId],
    references: [fabrics.id],
  }),
  // One-to-one with size chart
  sizeChart: one(sizeCharts, {
    fields: [products.sizeChartId],
    references: [sizeCharts.id],
  }),
}));

// Categories Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  // Self-referencing parent category
  parentCategory: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryHierarchy",
  }),
  // One-to-one with primary image
  primaryImage: one(mediaAssets, {
    fields: [categories.primaryImageId],
    references: [mediaAssets.id],
  }),
  // One-to-many with products
  products: many(products),
  // One-to-many with child categories
  childCategories: many(categories, {
    relationName: "categoryHierarchy",
  }),
}));

// Fabrics Relations
export const fabricsRelations = relations(fabrics, ({ one, many }) => ({
  // One-to-one with visual swatch image
  visualSwatch: one(mediaAssets, {
    fields: [fabrics.visualSwatchId],
    references: [mediaAssets.id],
  }),
  // One-to-many with products using this fabric
  products: many(products),
  // One-to-many with fabric compositions (fiber breakdown)
  fabricCompositions: many(fabricCompositions),
}));

// Fibers Relations
export const fibersRelations = relations(fibers, ({ many }) => ({
  // One-to-many with fabric compositions
  fabricCompositions: many(fabricCompositions),
}));

// Certificates Relations
export const certificatesRelations = relations(certificates, ({ one }) => ({
  // One-to-one with certificate image
  image: one(mediaAssets, {
    fields: [certificates.imageId],
    references: [mediaAssets.id],
    relationName: "certificateImage",
  }),
  // One-to-one with certificate document
  document: one(mediaAssets, {
    fields: [certificates.documentId],
    references: [mediaAssets.id],
    relationName: "certificateDocument",
  }),
}));

// Size Charts Relations
export const sizeChartsRelations = relations(sizeCharts, ({ many }) => ({
  // One-to-many with products using this size chart
  products: many(products),
}));

// Accessories Relations
export const accessoriesRelations = relations(accessories, ({ one }) => ({
  // One-to-one with accessory image
  image: one(mediaAssets, {
    fields: [accessories.imageId],
    references: [mediaAssets.id],
  }),
}));

// Fabric Compositions Relations (Junction Table)
export const fabricCompositionsRelations = relations(fabricCompositions, ({ one }) => ({
  // Many-to-one with fabric
  fabric: one(fabrics, {
    fields: [fabricCompositions.fabricId],
    references: [fabrics.id],
  }),
  // Many-to-one with fiber
  fiber: one(fibers, {
    fields: [fabricCompositions.fiberId],
    references: [fibers.id],
  }),
}));
