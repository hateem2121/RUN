/**
 * MEDIA & ORGANIZATION SEEDER
 * Seeds folders and enhanced media assets
 */

import { db } from "../../server/db.js";
import { folders, mediaAssets } from "../../shared/schema.js";
import { randomInt, type SeedResult, seedWithTransaction } from "../utils/seed-helpers.js";

/**
 * Seed folder structure for media organization
 */
export async function seedFolders(): Promise<SeedResult> {
  return seedWithTransaction("folders", async () => {
    const folderData = [
      {
        name: "Products",
        description: "Product photography and media assets",
        path: "/products",
        parentId: null,
        level: 0,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Marketing",
        description: "Marketing materials and promotional content",
        path: "/marketing",
        parentId: null,
        level: 0,
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "CMS Content",
        description: "Content management system media",
        path: "/cms-content",
        parentId: null,
        level: 0,
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "Team & About",
        description: "Team photos and about page content",
        path: "/team-about",
        parentId: null,
        level: 0,
        isActive: true,
        sortOrder: 4,
      },
      {
        name: "Manufacturing",
        description: "Manufacturing facility and process photos",
        path: "/manufacturing",
        parentId: null,
        level: 0,
        isActive: true,
        sortOrder: 5,
      },
      {
        name: "Technology",
        description: "Technology and equipment documentation",
        path: "/technology",
        parentId: null,
        level: 0,
        isActive: true,
        sortOrder: 6,
      },
      {
        name: "Sustainability",
        description: "Sustainability initiatives and environmental content",
        path: "/sustainability",
        parentId: null,
        level: 0,
        isActive: true,
        sortOrder: 7,
      },
      {
        name: "Archive",
        description: "Archived media assets",
        path: "/archive",
        parentId: null,
        level: 0,
        isActive: false,
        sortOrder: 99,
      },
    ];

    const inserted = await db.insert(folders).values(folderData).returning();

    // Create some nested folders
    const productsFolderId = inserted.find((f) => f.name === "Products")?.id;
    const cmsFolderId = inserted.find((f) => f.name === "CMS Content")?.id;

    const nestedFolders = [
      {
        name: "Hero Images",
        description: "Hero section background images",
        path: cmsFolderId ? `/cms-content/hero-images` : "/hero-images",
        parentId: cmsFolderId || null,
        level: 1,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Thumbnails",
        description: "Product thumbnail images",
        path: productsFolderId ? `/products/thumbnails` : "/thumbnails",
        parentId: productsFolderId || null,
        level: 1,
        isActive: true,
        sortOrder: 1,
      },
    ];

    const nestedInserted = await db.insert(folders).values(nestedFolders).returning();

    return [...inserted, ...nestedInserted];
  });
}

/**
 * Seed enhanced media assets - expanded to 60+ assets covering all types
 */
export async function seedEnhancedMediaAssets(): Promise<SeedResult> {
  return seedWithTransaction("mediaAssets", async () => {
    // First get folder IDs
    const allFolders = await db.select().from(folders);
    const productFolder = allFolders.find((f) => f.name === "Products");
    const cmsFolder = allFolders.find((f) => f.name === "CMS Content");
    const teamFolder = allFolders.find((f) => f.name === "Team & About");
    const mfgFolder = allFolders.find((f) => f.name === "Manufacturing");
    const techFolder = allFolders.find((f) => f.name === "Technology");
    const sustainFolder = allFolders.find((f) => f.name === "Sustainability");

    const mediaData: Array<typeof mediaAssets.$inferInsert> = [];

    // Product Images (20 assets)
    for (let i = 1; i <= 20; i++) {
      mediaData.push({
        filename: `product-${i.toString().padStart(3, "0")}.jpg`,
        originalName: `product-${i}.jpg`,
        mimeType: "image/jpeg",
        fileSize: randomInt(150000, 500000),
        url: `/assets/products/product-${i}.jpg`,
        storagePath: `public/media/products/product-${i}.jpg`,
        bucketName: "run-media",
        type: "image",
        altText: `Product ${i} - Professional sportswear`,
        folderId: productFolder?.id ?? null,
        isActive: true,
        metadata: {},
      });
    }

    // Team/About Images (10 assets)
    const teamRoles = [
      "CEO",
      "CTO",
      "Head of Manufacturing",
      "Design Lead",
      "Quality Manager",
      "Production Manager",
      "Marketing Director",
      "Sales Manager",
      "R&D Lead",
      "Sustainability Officer",
    ];
    for (let i = 1; i <= 10; i++) {
      mediaData.push({
        filename: `team-member-${i}.jpg`,
        originalName: `team-${i}.jpg`,
        mimeType: "image/jpeg",
        fileSize: randomInt(200000, 400000),
        url: `/assets/team/member-${i}.jpg`,
        storagePath: `public/media/team/member-${i}.jpg`,
        bucketName: "run-media",
        type: "image",
        altText: `Team member - ${teamRoles[i - 1]}`,
        caption: teamRoles[i - 1],
        folderId: teamFolder?.id ?? null,
        isActive: true,
        metadata: { role: teamRoles[i - 1] },
      });
    }

    // CMS Hero/Banner Images (8 assets)
    const heroSections = [
      "homepage",
      "about",
      "manufacturing",
      "sustainability",
      "technology",
      "products",
      "contact",
      "team",
    ];
    for (let i = 0; i < heroSections.length; i++) {
      mediaData.push({
        filename: `hero-${heroSections[i]}.jpg`,
        originalName: `${heroSections[i]}-hero.jpg`,
        mimeType: "image/jpeg",
        fileSize: randomInt(400000, 800000),
        url: `/assets/heroes/${heroSections[i]}.jpg`,
        storagePath: `public/media/heroes/${heroSections[i]}.jpg`,
        bucketName: "run-media",
        type: "image",
        altText: `${heroSections[i]?.charAt(0).toUpperCase() + heroSections[i]?.slice(1)} hero image`,
        folderId: cmsFolder?.id ?? null,
        isActive: true,
        metadata: { section: heroSections[i], purpose: "hero-banner" },
      });
    }

    // Manufacturing Process Images (6 assets)
    const mfgProcesses = [
      "cutting",
      "sewing",
      "quality-check",
      "packaging",
      "warehouse",
      "shipping",
    ];
    for (let i = 0; i < mfgProcesses.length; i++) {
      mediaData.push({
        filename: `process-${mfgProcesses[i]}.jpg`,
        originalName: `${mfgProcesses[i]}.jpg`,
        mimeType: "image/jpeg",
        fileSize: randomInt(250000, 450000),
        url: `/assets/manufacturing/${mfgProcesses[i]}.jpg`,
        storagePath: `public/media/manufacturing/${mfgProcesses[i]}.jpg`,
        bucketName: "run-media",
        type: "image",
        altText: `Manufacturing process - ${mfgProcesses[i]?.replace("-", " ")}`,
        folderId: mfgFolder?.id ?? null,
        isActive: true,
        metadata: { process: mfgProcesses[i] },
      });
    }

    // Technology/Equipment Images (5 assets)
    for (let i = 1; i <= 5; i++) {
      mediaData.push({
        filename: `equipment-${i}.jpg`,
        originalName: `tech-equipment-${i}.jpg`,
        mimeType: "image/jpeg",
        fileSize: randomInt(300000, 500000),
        url: `/assets/technology/equipment-${i}.jpg`,
        storagePath: `public/media/technology/equipment-${i}.jpg`,
        bucketName: "run-media",
        type: "image",
        altText: `Manufacturing equipment ${i}`,
        folderId: techFolder?.id ?? null,
        isActive: true,
        metadata: { category: "equipment" },
      });
    }

    // Sustainability Images (4 assets)
    const sustainTopics = [
      "recycling",
      "solar-panels",
      "water-conservation",
      "green-certification",
    ];
    for (let i = 0; i < sustainTopics.length; i++) {
      mediaData.push({
        filename: `sustainability-${sustainTopics[i]}.jpg`,
        originalName: `${sustainTopics[i]}.jpg`,
        mimeType: "image/jpeg",
        fileSize: randomInt(200000, 400000),
        url: `/assets/sustainability/${sustainTopics[i]}.jpg`,
        storagePath: `public/media/sustainability/${sustainTopics[i]}.jpg`,
        bucketName: "run-media",
        type: "image",
        altText: `Sustainability initiative - ${sustainTopics[i]?.replace("-", " ")}`,
        folderId: sustainFolder?.id ?? null,
        isActive: true,
        metadata: { initiative: sustainTopics[i] },
      });
    }

    // Video Assets (3 assets)
    mediaData.push(
      {
        filename: "company-intro.mp4",
        originalName: "company-introduction.mp4",
        mimeType: "video/mp4",
        fileSize: 15000000,
        url: "/assets/videos/company-intro.mp4",
        storagePath: "public/media/videos/company-intro.mp4",
        bucketName: "run-media",
        type: "video",
        altText: "Company introduction video",
        folderId: cmsFolder?.id ?? null,
        isActive: true,
        metadata: { duration: "02:30", resolution: "1920x1080" },
      },
      {
        filename: "manufacturing-tour.mp4",
        originalName: "facility-tour.mp4",
        mimeType: "video/mp4",
        fileSize: 25000000,
        url: "/assets/videos/manufacturing-tour.mp4",
        storagePath: "public/media/videos/manufacturing-tour.mp4",
        bucketName: "run-media",
        type: "video",
        altText: "Manufacturing facility tour",
        folderId: mfgFolder?.id ?? null,
        isActive: true,
        metadata: { duration: "04:15", resolution: "1920x1080" },
      },
      {
        filename: "sustainability-story.mp4",
        originalName: "our-sustainability-journey.mp4",
        mimeType: "video/mp4",
        fileSize: 18000000,
        url: "/assets/videos/sustainability-story.mp4",
        storagePath: "public/media/videos/sustainability-story.mp4",
        bucketName: "run-media",
        type: "video",
        altText: "Our sustainability journey",
        folderId: sustainFolder?.id ?? null,
        isActive: true,
        metadata: { duration: "03:00", resolution: "1920x1080" },
      },
    );

    // 3D Model Assets (2 assets)
    mediaData.push(
      {
        filename: "product-showcase.glb",
        originalName: "athletic-shirt-3d.glb",
        mimeType: "model/gltf-binary",
        fileSize: 2500000,
        url: "/assets/3d/product-showcase.glb",
        storagePath: "public/media/3d/product-showcase.glb",
        bucketName: "run-media",
        type: "3d-model",
        altText: "3D model of athletic shirt",
        folderId: productFolder?.id ?? null,
        isActive: true,
        metadata: { format: "glb", polycount: 15000 },
      },
      {
        filename: "product-tech-jacket.glb",
        originalName: "tech-jacket-3d.glb",
        mimeType: "model/gltf-binary",
        fileSize: 3200000,
        url: "/assets/3d/tech-jacket.glb",
        storagePath: "public/media/3d/tech-jacket.glb",
        bucketName: "run-media",
        type: "3d-model",
        altText: "3D model of technical jacket",
        folderId: productFolder?.id ?? null,
        isActive: true,
        metadata: { format: "glb", polycount: 22000 },
      },
    );

    // Document Assets (2 assets)
    mediaData.push(
      {
        filename: "product-catalog-2024.pdf",
        originalName: "catalog.pdf",
        mimeType: "application/pdf",
        fileSize: 5500000,
        url: "/assets/documents/catalog-2024.pdf",
        storagePath: "public/media/documents/catalog-2024.pdf",
        bucketName: "run-media",
        type: "document",
        altText: "2024 Product Catalog PDF",
        folderId: productFolder?.id ?? null,
        isActive: true,
        metadata: { pages: 48, year: 2024 },
      },
      {
        filename: "sustainability-report-2024.pdf",
        originalName: "sustainability-report.pdf",
        mimeType: "application/pdf",
        fileSize: 3200000,
        url: "/assets/documents/sustainability-2024.pdf",
        storagePath: "public/media/documents/sustainability-2024.pdf",
        bucketName: "run-media",
        type: "document",
        altText: "2024 Sustainability Report",
        folderId: sustainFolder?.id ?? null,
        isActive: true,
        metadata: { pages: 24, year: 2024 },
      },
    );

    return await db.insert(mediaAssets).values(mediaData).returning();
  });
}
