import { relations } from "drizzle-orm/relations";
import {
  aboutHero,
  aboutSections,
  aboutTeamMessages,
  aboutTimelineEntries,
  accessories,
  categories,
  certificates,
  fabricCompositions,
  fabrics,
  fibers,
  folders,
  homepageHero,
  homepageProcessCards,
  homepageSustainability,
  manufacturingCapabilities,
  manufacturingHero,
  manufacturingProcesses,
  manufacturingQualities,
  mediaAssets,
  navigationItems,
  productRelations,
  products,
  sizeCharts,
  sustainabilityFeatures,
  sustainabilityHero,
  sustainabilityInitiatives,
  technologyEquipment,
  technologyHero,
  technologyInnovations,
  technologyRoadmap,
  unifiedSustainability,
} from "./schema.js";

export const aboutSectionsRelations = relations(aboutSections, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [aboutSections.imageId],
    references: [mediaAssets.id],
  }),
}));

export const productRelationsRelations = relations(productRelations, ({ one }) => ({
  product: one(products, {
    fields: [productRelations.productId],
    references: [products.id],
    relationName: "productRelations_product",
  }),
  relatedProduct: one(products, {
    fields: [productRelations.relatedProductId],
    references: [products.id],
    relationName: "productRelations_relatedProduct",
  }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  aboutSections: many(aboutSections),
  aboutTeamMessages: many(aboutTeamMessages),
  aboutTimelineEntries: many(aboutTimelineEntries),
  accessories: many(accessories),
  aboutHeroes_imageId: many(aboutHero, {
    relationName: "aboutHero_imageId_mediaAssets_id",
  }),
  aboutHeroes_videoId: many(aboutHero, {
    relationName: "aboutHero_videoId_mediaAssets_id",
  }),
  aboutHeroes_backgroundMediaId: many(aboutHero, {
    relationName: "aboutHero_backgroundMediaId_mediaAssets_id",
  }),
  certificates_imageId: many(certificates, {
    relationName: "certificates_imageId_mediaAssets_id",
  }),
  certificates_documentId: many(certificates, {
    relationName: "certificates_documentId_mediaAssets_id",
  }),
  fabrics: many(fabrics),
  homepageProcessCards_imageId: many(homepageProcessCards, {
    relationName: "homepageProcessCards_imageId_mediaAssets_id",
  }),
  homepageProcessCards_iconMediaId: many(homepageProcessCards, {
    relationName: "homepageProcessCards_iconMediaId_mediaAssets_id",
  }),
  homepageSustainabilities: many(homepageSustainability),
  homepageHeroes_primaryImageId: many(homepageHero, {
    relationName: "homepageHero_primaryImageId_mediaAssets_id",
  }),
  homepageHeroes_backgroundImageId: many(homepageHero, {
    relationName: "homepageHero_backgroundImageId_mediaAssets_id",
  }),
  manufacturingHeroes_imageId: many(manufacturingHero, {
    relationName: "manufacturingHero_imageId_mediaAssets_id",
  }),
  manufacturingHeroes_videoId: many(manufacturingHero, {
    relationName: "manufacturingHero_videoId_mediaAssets_id",
  }),
  manufacturingHeroes_backgroundMediaId: many(manufacturingHero, {
    relationName: "manufacturingHero_backgroundMediaId_mediaAssets_id",
  }),
  manufacturingCapabilities: many(manufacturingCapabilities),
  navigationItems: many(navigationItems),
  manufacturingProcesses: many(manufacturingProcesses),
  products_primaryImageId: many(products, {
    relationName: "products_primaryImageId_mediaAssets_id",
  }),
  products_primaryVideoId: many(products, {
    relationName: "products_primaryVideoId_mediaAssets_id",
  }),
  products_modelFileId: many(products, {
    relationName: "products_modelFileId_mediaAssets_id",
  }),
  sizeCharts: many(sizeCharts),
  folder: one(folders, {
    fields: [mediaAssets.folderId],
    references: [folders.id],
  }),
  manufacturingQualities: many(manufacturingQualities),
  sustainabilityHeroes_imageId: many(sustainabilityHero, {
    relationName: "sustainabilityHero_imageId_mediaAssets_id",
  }),
  sustainabilityHeroes_videoId: many(sustainabilityHero, {
    relationName: "sustainabilityHero_videoId_mediaAssets_id",
  }),
  sustainabilityInitiatives: many(sustainabilityInitiatives),
  sustainabilityFeatures: many(sustainabilityFeatures),
  categories: many(categories),
  technologyHeroes_backgroundMediaId: many(technologyHero, {
    relationName: "technologyHero_backgroundMediaId_mediaAssets_id",
  }),
  technologyHeroes_imageId: many(technologyHero, {
    relationName: "technologyHero_imageId_mediaAssets_id",
  }),
  technologyHeroes_videoId: many(technologyHero, {
    relationName: "technologyHero_videoId_mediaAssets_id",
  }),
  unifiedSustainabilities: many(unifiedSustainability),
  technologyRoadmaps_imageId: many(technologyRoadmap, {
    relationName: "technologyRoadmap_imageId_mediaAssets_id",
  }),
  technologyRoadmaps_videoId: many(technologyRoadmap, {
    relationName: "technologyRoadmap_videoId_mediaAssets_id",
  }),
  technologyInnovations: many(technologyInnovations),
  technologyEquipments: many(technologyEquipment),
}));

export const aboutTeamMessagesRelations = relations(aboutTeamMessages, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [aboutTeamMessages.imageId],
    references: [mediaAssets.id],
  }),
}));

export const aboutTimelineEntriesRelations = relations(aboutTimelineEntries, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [aboutTimelineEntries.imageId],
    references: [mediaAssets.id],
  }),
}));

export const accessoriesRelations = relations(accessories, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [accessories.imageId],
    references: [mediaAssets.id],
  }),
}));

export const aboutHeroRelations = relations(aboutHero, ({ one }) => ({
  mediaAsset_imageId: one(mediaAssets, {
    fields: [aboutHero.imageId],
    references: [mediaAssets.id],
    relationName: "aboutHero_imageId_mediaAssets_id",
  }),
  mediaAsset_videoId: one(mediaAssets, {
    fields: [aboutHero.videoId],
    references: [mediaAssets.id],
    relationName: "aboutHero_videoId_mediaAssets_id",
  }),
  mediaAsset_backgroundMediaId: one(mediaAssets, {
    fields: [aboutHero.backgroundMediaId],
    references: [mediaAssets.id],
    relationName: "aboutHero_backgroundMediaId_mediaAssets_id",
  }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  mediaAsset_imageId: one(mediaAssets, {
    fields: [certificates.imageId],
    references: [mediaAssets.id],
    relationName: "certificates_imageId_mediaAssets_id",
  }),
  mediaAsset_documentId: one(mediaAssets, {
    fields: [certificates.documentId],
    references: [mediaAssets.id],
    relationName: "certificates_documentId_mediaAssets_id",
  }),
}));

export const fabricsRelations = relations(fabrics, ({ one, many }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [fabrics.visualSwatchId],
    references: [mediaAssets.id],
  }),
  products: many(products),
  fabricCompositions: many(fabricCompositions),
}));

export const homepageProcessCardsRelations = relations(homepageProcessCards, ({ one }) => ({
  mediaAsset_imageId: one(mediaAssets, {
    fields: [homepageProcessCards.imageId],
    references: [mediaAssets.id],
    relationName: "homepageProcessCards_imageId_mediaAssets_id",
  }),
  mediaAsset_iconMediaId: one(mediaAssets, {
    fields: [homepageProcessCards.iconMediaId],
    references: [mediaAssets.id],
    relationName: "homepageProcessCards_iconMediaId_mediaAssets_id",
  }),
}));

export const homepageSustainabilityRelations = relations(homepageSustainability, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [homepageSustainability.imageId],
    references: [mediaAssets.id],
  }),
}));

export const homepageHeroRelations = relations(homepageHero, ({ one }) => ({
  mediaAsset_primaryImageId: one(mediaAssets, {
    fields: [homepageHero.primaryImageId],
    references: [mediaAssets.id],
    relationName: "homepageHero_primaryImageId_mediaAssets_id",
  }),
  mediaAsset_backgroundImageId: one(mediaAssets, {
    fields: [homepageHero.backgroundImageId],
    references: [mediaAssets.id],
    relationName: "homepageHero_backgroundImageId_mediaAssets_id",
  }),
}));

export const manufacturingHeroRelations = relations(manufacturingHero, ({ one }) => ({
  mediaAsset_imageId: one(mediaAssets, {
    fields: [manufacturingHero.imageId],
    references: [mediaAssets.id],
    relationName: "manufacturingHero_imageId_mediaAssets_id",
  }),
  mediaAsset_videoId: one(mediaAssets, {
    fields: [manufacturingHero.videoId],
    references: [mediaAssets.id],
    relationName: "manufacturingHero_videoId_mediaAssets_id",
  }),
  mediaAsset_backgroundMediaId: one(mediaAssets, {
    fields: [manufacturingHero.backgroundMediaId],
    references: [mediaAssets.id],
    relationName: "manufacturingHero_backgroundMediaId_mediaAssets_id",
  }),
}));

export const manufacturingCapabilitiesRelations = relations(
  manufacturingCapabilities,
  ({ one }) => ({
    mediaAsset: one(mediaAssets, {
      fields: [manufacturingCapabilities.imageId],
      references: [mediaAssets.id],
    }),
  }),
);

export const navigationItemsRelations = relations(navigationItems, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [navigationItems.mediaIconId],
    references: [mediaAssets.id],
  }),
}));

export const manufacturingProcessesRelations = relations(manufacturingProcesses, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [manufacturingProcesses.imageId],
    references: [mediaAssets.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  mediaAsset_primaryImageId: one(mediaAssets, {
    fields: [products.primaryImageId],
    references: [mediaAssets.id],
    relationName: "products_primaryImageId_mediaAssets_id",
  }),
  mediaAsset_primaryVideoId: one(mediaAssets, {
    fields: [products.primaryVideoId],
    references: [mediaAssets.id],
    relationName: "products_primaryVideoId_mediaAssets_id",
  }),
  mediaAsset_modelFileId: one(mediaAssets, {
    fields: [products.modelFileId],
    references: [mediaAssets.id],
    relationName: "products_modelFileId_mediaAssets_id",
  }),
  fabric: one(fabrics, {
    fields: [products.fabricId],
    references: [fabrics.id],
  }),
  sizeChart: one(sizeCharts, {
    fields: [products.sizeChartId],
    references: [sizeCharts.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  products: many(products),
  mediaAsset: one(mediaAssets, {
    fields: [categories.primaryImageId],
    references: [mediaAssets.id],
  }),
  category: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categories_parentId_categories_id",
  }),
  categories: many(categories, {
    relationName: "categories_parentId_categories_id",
  }),
}));

export const sizeChartsRelations = relations(sizeCharts, ({ one, many }) => ({
  products: many(products),
  mediaAsset: one(mediaAssets, {
    fields: [sizeCharts.imageId],
    references: [mediaAssets.id],
  }),
}));

export const foldersRelations = relations(folders, ({ many }) => ({
  mediaAssets: many(mediaAssets),
}));

export const manufacturingQualitiesRelations = relations(manufacturingQualities, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [manufacturingQualities.imageId],
    references: [mediaAssets.id],
  }),
}));

export const sustainabilityHeroRelations = relations(sustainabilityHero, ({ one }) => ({
  mediaAsset_imageId: one(mediaAssets, {
    fields: [sustainabilityHero.imageId],
    references: [mediaAssets.id],
    relationName: "sustainabilityHero_imageId_mediaAssets_id",
  }),
  mediaAsset_videoId: one(mediaAssets, {
    fields: [sustainabilityHero.videoId],
    references: [mediaAssets.id],
    relationName: "sustainabilityHero_videoId_mediaAssets_id",
  }),
}));

export const sustainabilityInitiativesRelations = relations(
  sustainabilityInitiatives,
  ({ one }) => ({
    mediaAsset: one(mediaAssets, {
      fields: [sustainabilityInitiatives.imageId],
      references: [mediaAssets.id],
    }),
  }),
);

export const sustainabilityFeaturesRelations = relations(sustainabilityFeatures, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [sustainabilityFeatures.imageId],
    references: [mediaAssets.id],
  }),
}));

export const fabricCompositionsRelations = relations(fabricCompositions, ({ one }) => ({
  fabric: one(fabrics, {
    fields: [fabricCompositions.fabricId],
    references: [fabrics.id],
  }),
  fiber: one(fibers, {
    fields: [fabricCompositions.fiberId],
    references: [fibers.id],
  }),
}));

export const fibersRelations = relations(fibers, ({ many }) => ({
  fabricCompositions: many(fabricCompositions),
}));

export const technologyHeroRelations = relations(technologyHero, ({ one }) => ({
  mediaAsset_backgroundMediaId: one(mediaAssets, {
    fields: [technologyHero.backgroundMediaId],
    references: [mediaAssets.id],
    relationName: "technologyHero_backgroundMediaId_mediaAssets_id",
  }),
  mediaAsset_imageId: one(mediaAssets, {
    fields: [technologyHero.imageId],
    references: [mediaAssets.id],
    relationName: "technologyHero_imageId_mediaAssets_id",
  }),
  mediaAsset_videoId: one(mediaAssets, {
    fields: [technologyHero.videoId],
    references: [mediaAssets.id],
    relationName: "technologyHero_videoId_mediaAssets_id",
  }),
}));

export const unifiedSustainabilityRelations = relations(unifiedSustainability, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [unifiedSustainability.backgroundImageId],
    references: [mediaAssets.id],
  }),
}));

export const technologyRoadmapRelations = relations(technologyRoadmap, ({ one }) => ({
  mediaAsset_imageId: one(mediaAssets, {
    fields: [technologyRoadmap.imageId],
    references: [mediaAssets.id],
    relationName: "technologyRoadmap_imageId_mediaAssets_id",
  }),
  mediaAsset_videoId: one(mediaAssets, {
    fields: [technologyRoadmap.videoId],
    references: [mediaAssets.id],
    relationName: "technologyRoadmap_videoId_mediaAssets_id",
  }),
}));

export const technologyInnovationsRelations = relations(technologyInnovations, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [technologyInnovations.imageId],
    references: [mediaAssets.id],
  }),
}));

export const technologyEquipmentRelations = relations(technologyEquipment, ({ one }) => ({
  mediaAsset: one(mediaAssets, {
    fields: [technologyEquipment.imageId],
    references: [mediaAssets.id],
  }),
}));
