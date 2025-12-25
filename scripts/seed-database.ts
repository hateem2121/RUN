#!/usr/bin/env tsx

// @ts-nocheck

/**
 * Database Seeding Script for RUN APPAREL (PVT) LTD
 * Seeds the database with realistic sportswear manufacturing B2B data
 */

import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import {
  accessories,
  categories,
  certificates,
  fabrics,
  fibers,
  mediaAssets,
  products,
  sizeCharts,
} from "../shared/schema.js";

async function seedDatabase() {
  try {
    await db.delete(products);
    await db.delete(categories);
    await db.delete(mediaAssets);
    await db.delete(fabrics);
    await db.delete(fibers);
    await db.delete(certificates);
    await db.delete(sizeCharts);
    await db.delete(accessories);
    const categoryData = [
      {
        name: "Athletic Wear",
        slug: "athletic-wear",
        description: "High-performance athletic clothing for sports and fitness",
        isActive: true,
        displayOrder: 1,
      },
      {
        name: "Casual Wear",
        slug: "casual-wear",
        description: "Comfortable everyday sportswear and casual clothing",
        isActive: true,
        displayOrder: 2,
      },
      {
        name: "Team Sports",
        slug: "team-sports",
        description: "Specialized uniforms and gear for team sports",
        isActive: true,
        displayOrder: 3,
      },
      {
        name: "Outdoor Gear",
        slug: "outdoor-gear",
        description: "Weather-resistant clothing for outdoor activities",
        isActive: true,
        displayOrder: 4,
      },
      {
        name: "Accessories",
        slug: "accessories",
        description: "Sports accessories and complementary items",
        isActive: true,
        displayOrder: 5,
      },
    ];

    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    const fabricData = [
      {
        name: "Moisture-Wicking Polyester",
        composition: "100% Polyester",
        properties: { quickDry: true, breathable: true, lightweight: true },
        careInstructions: "Machine wash cold, tumble dry low",
        isActive: true,
      },
      {
        name: "Cotton Blend Jersey",
        composition: "60% Cotton, 40% Polyester",
        properties: { soft: true, comfortable: true, durable: true },
        careInstructions: "Machine wash warm, tumble dry medium",
        isActive: true,
      },
      {
        name: "Technical Mesh",
        composition: "85% Nylon, 15% Spandex",
        properties: {
          breathable: true,
          flexible: true,
          moistureManagement: true,
        },
        careInstructions: "Machine wash cold, air dry",
        isActive: true,
      },
      {
        name: "Performance Fleece",
        composition: "100% Recycled Polyester",
        properties: {
          thermalInsulation: true,
          softTouch: true,
          sustainable: true,
        },
        careInstructions: "Machine wash cold, tumble dry low",
        isActive: true,
      },
    ];

    const insertedFabrics = await db.insert(fabrics).values(fabricData).returning();
    const productData = [
      // Athletic Wear Products
      {
        name: "Pro Performance Running Shirt",
        slug: "pro-performance-running-shirt",
        description: "High-performance running shirt with moisture-wicking technology",
        shortDescription: "Professional running shirt for athletes",
        sku: "RUN-SHIRT-001",
        categoryId: insertedCategories[0].id, // Athletic Wear
        fabricId: insertedFabrics[0].id, // Moisture-Wicking Polyester
        basePrice: "15.50",
        moq: 50,
        leadTime: "14-21 days",
        availableColors: ["Navy Blue", "Black", "White", "Royal Blue"],
        availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
        isFeatured: true,
        isActive: true,
        customizationOptions: "Logo printing, embroidery, color matching",
        sampleAvailability: true,
        fiberComposition: "100% Polyester",
        displayOrder: 1,
      },
      {
        name: "Athletic Training Shorts",
        slug: "athletic-training-shorts",
        description: "Lightweight training shorts with side pockets and drawstring waist",
        shortDescription: "Versatile training shorts for all sports",
        sku: "RUN-SHORTS-001",
        categoryId: insertedCategories[0].id, // Athletic Wear
        fabricId: insertedFabrics[2].id, // Technical Mesh
        basePrice: "12.75",
        moq: 100,
        leadTime: "10-14 days",
        availableColors: ["Black", "Navy", "Charcoal", "Red"],
        availableSizes: ["S", "M", "L", "XL", "XXL"],
        isFeatured: true,
        isActive: true,
        customizationOptions: "Side stripes, logo placement, custom colors",
        sampleAvailability: true,
        fiberComposition: "85% Nylon, 15% Spandex",
        displayOrder: 2,
      },

      // Casual Wear Products
      {
        name: "Comfort Cotton Polo",
        slug: "comfort-cotton-polo",
        description: "Classic polo shirt made with premium cotton blend for everyday wear",
        shortDescription: "Premium cotton polo for casual wear",
        sku: "RUN-POLO-001",
        categoryId: insertedCategories[1].id, // Casual Wear
        fabricId: insertedFabrics[1].id, // Cotton Blend Jersey
        basePrice: "18.00",
        moq: 75,
        leadTime: "12-18 days",
        availableColors: ["White", "Navy", "Gray", "Light Blue", "Green"],
        availableSizes: ["S", "M", "L", "XL", "XXL"],
        isFeatured: false,
        isActive: true,
        customizationOptions: "Embroidered logos, custom buttons, collar variations",
        sampleAvailability: true,
        fiberComposition: "60% Cotton, 40% Polyester",
        displayOrder: 3,
      },
      {
        name: "Casual Track Jacket",
        slug: "casual-track-jacket",
        description: "Stylish track jacket perfect for casual wear and light workouts",
        shortDescription: "Versatile track jacket for casual use",
        sku: "RUN-JACKET-001",
        categoryId: insertedCategories[1].id, // Casual Wear
        fabricId: insertedFabrics[3].id, // Performance Fleece
        basePrice: "24.50",
        moq: 25,
        leadTime: "18-25 days",
        availableColors: ["Black", "Navy", "Gray", "Maroon"],
        availableSizes: ["S", "M", "L", "XL", "XXL"],
        isFeatured: true,
        isActive: true,
        customizationOptions: "Full zip, pocket placement, color blocking",
        sampleAvailability: false,
        fiberComposition: "100% Recycled Polyester",
        displayOrder: 4,
      },

      // Team Sports Products
      {
        name: "Team Soccer Jersey",
        slug: "team-soccer-jersey",
        description: "Professional soccer jersey with advanced moisture management",
        shortDescription: "Professional soccer team jersey",
        sku: "RUN-SOCCER-001",
        categoryId: insertedCategories[2].id, // Team Sports
        fabricId: insertedFabrics[0].id, // Moisture-Wicking Polyester
        basePrice: "16.25",
        moq: 100,
        leadTime: "21-28 days",
        availableColors: ["Custom team colors available"],
        availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
        isFeatured: true,
        isActive: true,
        customizationOptions: "Team logos, player names, numbers, sublimation printing",
        sampleAvailability: true,
        fiberComposition: "100% Polyester",
        displayOrder: 5,
      },

      // Outdoor Gear Products
      {
        name: "Weather-Resistant Windbreaker",
        slug: "weather-resistant-windbreaker",
        description: "Lightweight windbreaker with water-resistant coating for outdoor activities",
        shortDescription: "Lightweight outdoor windbreaker",
        sku: "RUN-WIND-001",
        categoryId: insertedCategories[3].id, // Outdoor Gear
        fabricId: insertedFabrics[0].id, // Moisture-Wicking Polyester
        basePrice: "19.75",
        moq: 50,
        leadTime: "16-22 days",
        availableColors: ["Black", "Navy", "Forest Green", "Orange"],
        availableSizes: ["S", "M", "L", "XL", "XXL"],
        isFeatured: false,
        isActive: true,
        customizationOptions: "Reflective strips, hood options, pocket configurations",
        sampleAvailability: true,
        fiberComposition: "100% Polyester with DWR coating",
        displayOrder: 6,
      },
    ];

    const insertedProducts = await db.insert(products).values(productData).returning();
    const mediaData = [
      {
        filename: "pro-running-shirt-navy.jpg",
        originalFilename: "pro-running-shirt-navy.jpg",
        mimeType: "image/jpeg",
        fileSize: 245760,
        url: "/assets/products/pro-running-shirt-navy.jpg",
        type: "image" as const,
        altText: "Pro Performance Running Shirt in Navy Blue",
        isActive: true,
      },
      {
        filename: "athletic-shorts-black.jpg",
        originalFilename: "athletic-shorts-black.jpg",
        mimeType: "image/jpeg",
        fileSize: 198432,
        url: "/assets/products/athletic-shorts-black.jpg",
        type: "image" as const,
        altText: "Athletic Training Shorts in Black",
        isActive: true,
      },
      {
        filename: "cotton-polo-white.jpg",
        originalFilename: "cotton-polo-white.jpg",
        mimeType: "image/jpeg",
        fileSize: 267890,
        url: "/assets/products/cotton-polo-white.jpg",
        type: "image" as const,
        altText: "Comfort Cotton Polo in White",
        isActive: true,
      },
    ];

    const insertedMedia = await db.insert(mediaAssets).values(mediaData).returning();
    if (insertedProducts.length >= 3 && insertedMedia.length >= 3) {
      await db
        .update(products)
        .set({ primaryImageId: insertedMedia[0].id })
        .where(eq(products.id, insertedProducts[0].id));

      await db
        .update(products)
        .set({ primaryImageId: insertedMedia[1].id })
        .where(eq(products.id, insertedProducts[1].id));

      await db
        .update(products)
        .set({ primaryImageId: insertedMedia[2].id })
        .where(eq(products.id, insertedProducts[2].id));
    }
  } catch (error) {
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
