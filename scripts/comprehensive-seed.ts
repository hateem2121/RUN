#!/usr/bin/env tsx

// @ts-nocheck

/**
 * Comprehensive Database Seeding Script for RUN APPAREL (PVT) LTD
 * Enhanced version with extensive B2B sportswear manufacturing data
 * Includes complete data model coverage with relationships and validation
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

async function comprehensiveSeedDatabase() {
	try {
		await db.delete(products);
		// await db.delete(mediaAssets); // PROTECTED: Don't wipe user uploads
		await db.delete(categories);
		await db.delete(fabrics);
		await db.delete(fibers);
		await db.delete(certificates);
		await db.delete(sizeCharts);
		await db.delete(accessories);
		const fiberData = [
			{
				name: "Polyester",
				type: "synthetic",
				description:
					"Synthetic fiber known for durability and moisture-wicking properties",
				sustainabilityScore: 6,
				environmentalImpact:
					"Made from petroleum-based materials but highly durable and recyclable",
				properties: {
					synthetic: true,
					durable: true,
					quickDry: true,
					affordable: true,
				},
				isActive: true,
			},
			{
				name: "Cotton",
				type: "natural",
				description: "Natural fiber offering breathability and comfort",
				sustainabilityScore: 8,
				environmentalImpact:
					"Renewable natural resource, biodegradable, requires significant water",
				properties: {
					natural: true,
					breathable: true,
					comfortable: true,
					biodegradable: true,
				},
				isActive: true,
			},
			{
				name: "Nylon",
				type: "synthetic",
				description: "Strong synthetic fiber with excellent elasticity",
				sustainabilityScore: 5,
				environmentalImpact:
					"Petroleum-based synthetic with high durability but energy-intensive production",
				properties: {
					synthetic: true,
					strong: true,
					elastic: true,
					lightweight: true,
				},
				isActive: true,
			},
			{
				name: "Spandex",
				type: "synthetic",
				description: "Highly elastic synthetic fiber for stretch applications",
				sustainabilityScore: 4,
				environmentalImpact:
					"Petroleum-based with complex chemical processing, difficult to recycle",
				properties: {
					synthetic: true,
					highElasticity: true,
					flexible: true,
					recovery: true,
				},
				isActive: true,
			},
			{
				name: "Merino Wool",
				type: "natural",
				description: "Premium natural fiber with temperature regulation",
				sustainabilityScore: 9,
				environmentalImpact:
					"Renewable, biodegradable, naturally antimicrobial, ethical sourcing important",
				properties: {
					natural: true,
					thermoRegulation: true,
					antimicrobial: true,
					premium: true,
				},
				isActive: true,
			},
			{
				name: "Bamboo",
				type: "natural",
				description: "Sustainable natural fiber with antibacterial properties",
				sustainabilityScore: 9,
				environmentalImpact:
					"Fast-growing renewable resource, naturally antibacterial, minimal water needed",
				properties: {
					natural: true,
					sustainable: true,
					antibacterial: true,
					soft: true,
				},
				isActive: true,
			},
		];

		const insertedFibers = await db
			.insert(fibers)
			.values(fiberData)
			.returning();
		const certificateData = [
			{
				name: "OEKO-TEX Standard 100",
				description: "Textile tested for harmful substances",
				issuingOrganization: "OEKO-TEX Association",
				validityPeriod: "12 months",
				requirements: "Chemical safety testing of textile materials",
				isActive: true,
			},
			{
				name: "GOTS (Global Organic Textile Standard)",
				description:
					"Organic fiber certification with environmental and social criteria",
				issuingOrganization: "Global Organic Textile Standard",
				validityPeriod: "24 months",
				requirements: "Minimum 70% organic natural fibers",
				isActive: true,
			},
			{
				name: "WRAP Certification",
				description:
					"Worldwide Responsible Accredited Production certification",
				issuingOrganization: "Worldwide Responsible Accredited Production",
				validityPeriod: "24 months",
				requirements: "Ethical manufacturing and labor standards",
				isActive: true,
			},
			{
				name: "ISO 14001",
				description: "Environmental management system certification",
				issuingOrganization: "International Organization for Standardization",
				validityPeriod: "36 months",
				requirements: "Environmental management system implementation",
				isActive: true,
			},
		];

		const insertedCertificates = await db
			.insert(certificates)
			.values(certificateData)
			.returning();
		const fabricData = [
			{
				name: "Moisture-Wicking Polyester",
				description:
					"Advanced polyester fabric engineered for moisture management",
				fabricType: "technical",
				weight: "140 GSM",
				composition: "100% Polyester",
				weave: "Jersey knit",
				stretch: "2-way stretch",
				properties: {
					quickDry: true,
					breathable: true,
					lightweight: true,
					moistureWicking: true,
					uvProtection: true,
				},
				careInstructions:
					"Machine wash cold, tumble dry low, no fabric softener",
				sustainabilityScore: 7,
				certifications: ["OEKO-TEX Standard 100"],
				isActive: true,
			},
			{
				name: "Premium Cotton Blend Jersey",
				description: "Soft cotton blend perfect for casual and athletic wear",
				fabricType: "blend",
				weight: "180 GSM",
				composition: "60% Cotton, 40% Polyester",
				weave: "Single jersey",
				stretch: "Minimal stretch",
				properties: {
					soft: true,
					comfortable: true,
					durable: true,
					colorRetention: true,
					breathable: true,
				},
				careInstructions: "Machine wash warm, tumble dry medium",
				sustainabilityScore: 8,
				certifications: ["GOTS", "OEKO-TEX Standard 100"],
				isActive: true,
			},
			{
				name: "Technical Mesh Pro",
				description: "High-performance mesh for maximum breathability",
				fabricType: "technical",
				weight: "120 GSM",
				composition: "85% Nylon, 15% Spandex",
				weave: "Open mesh",
				stretch: "4-way stretch",
				properties: {
					breathable: true,
					flexible: true,
					moistureManagement: true,
					quickDry: true,
					lightweight: true,
				},
				careInstructions: "Machine wash cold, air dry recommended",
				sustainabilityScore: 6,
				certifications: ["OEKO-TEX Standard 100"],
				isActive: true,
			},
			{
				name: "Eco-Performance Fleece",
				description: "Sustainable fleece made from recycled polyester",
				fabricType: "fleece",
				weight: "280 GSM",
				composition: "100% Recycled Polyester",
				weave: "Brushed fleece",
				stretch: "Minimal stretch",
				properties: {
					thermalInsulation: true,
					softTouch: true,
					sustainable: true,
					pillResistant: true,
					colorfast: true,
				},
				careInstructions: "Machine wash cold, tumble dry low",
				sustainabilityScore: 9,
				certifications: ["GOTS", "ISO 14001"],
				isActive: true,
			},
			{
				name: "Merino Performance Blend",
				description: "Premium wool blend for temperature regulation",
				fabricType: "blend",
				weight: "200 GSM",
				composition: "70% Merino Wool, 30% Polyester",
				weave: "Interlock knit",
				stretch: "Natural stretch",
				properties: {
					thermoRegulation: true,
					antimicrobial: true,
					odorResistant: true,
					premium: true,
					naturalFeel: true,
				},
				careInstructions: "Hand wash or gentle machine wash, lay flat to dry",
				sustainabilityScore: 8,
				certifications: ["WRAP Certification"],
				isActive: true,
			},
			{
				name: "Bamboo-Polyester Athletic",
				description: "Sustainable bamboo blend for eco-conscious brands",
				fabricType: "blend",
				weight: "160 GSM",
				composition: "55% Bamboo, 45% Polyester",
				weave: "Single jersey",
				stretch: "2-way stretch",
				properties: {
					sustainable: true,
					antibacterial: true,
					soft: true,
					moistureWicking: true,
					biodegradable: true,
				},
				careInstructions: "Machine wash cold, tumble dry low",
				sustainabilityScore: 9,
				certifications: ["GOTS", "OEKO-TEX Standard 100"],
				isActive: true,
			},
		];

		const insertedFabrics = await db
			.insert(fabrics)
			.values(fabricData)
			.returning();
		const categoryData = [
			{
				name: "Athletic Wear",
				slug: "athletic-wear",
				description:
					"High-performance athletic clothing designed for sports and fitness activities",
				isActive: true,
				displayOrder: 1,
			},
			{
				name: "Casual Sportswear",
				slug: "casual-sportswear",
				description: "Comfortable everyday sportswear and lifestyle clothing",
				isActive: true,
				displayOrder: 2,
			},
			{
				name: "Team Sports",
				slug: "team-sports",
				description:
					"Specialized uniforms and gear for team sports and organizations",
				isActive: true,
				displayOrder: 3,
			},
			{
				name: "Outdoor & Adventure",
				slug: "outdoor-adventure",
				description:
					"Weather-resistant clothing for outdoor activities and adventures",
				isActive: true,
				displayOrder: 4,
			},
			{
				name: "Corporate & Workwear",
				slug: "corporate-workwear",
				description: "Professional uniforms and corporate branded apparel",
				isActive: true,
				displayOrder: 5,
			},
			{
				name: "Accessories",
				slug: "accessories",
				description: "Sports accessories and complementary items",
				isActive: true,
				displayOrder: 6,
			},
		];

		const insertedCategories = await db
			.insert(categories)
			.values(categoryData)
			.returning();
		const sizeChartData = [
			{
				name: "Standard Unisex Sizing",
				description: "Standard sizing for unisex athletic wear",
				category: "unisex",
				measurements: {
					sizes: ["XS", "S", "M", "L", "XL", "XXL"],
					chest: ['32-34"', '34-36"', '36-38"', '38-40"', '40-42"', '42-44"'],
					waist: ['28-30"', '30-32"', '32-34"', '34-36"', '36-38"', '38-40"'],
				},
				isActive: true,
			},
			{
				name: "Performance Fit Sizing",
				description: "Athletic fit sizing for performance wear",
				category: "performance",
				measurements: {
					sizes: ["XS", "S", "M", "L", "XL"],
					chest: ['31-33"', '33-35"', '35-37"', '37-39"', '39-41"'],
					waist: ['27-29"', '29-31"', '31-33"', '33-35"', '35-37"'],
				},
				isActive: true,
			},
		];

		const insertedSizeCharts = await db
			.insert(sizeCharts)
			.values(sizeChartData)
			.returning();
		const productData = [
			// Athletic Wear Products
			{
				name: "Pro Performance Running Shirt",
				slug: "pro-performance-running-shirt",
				description:
					"High-performance running shirt engineered with advanced moisture-wicking technology and UV protection for serious athletes.",
				shortDescription: "Professional running shirt for elite performance",
				sku: "RUN-SHIRT-001",
				categoryId: insertedCategories[0].id, // Athletic Wear
				fabricId: insertedFabrics[0].id, // Moisture-Wicking Polyester
				basePrice: "15.50",
				moq: 50,
				leadTime: "14-21 days",
				availableColors: [
					"Navy Blue",
					"Black",
					"White",
					"Royal Blue",
					"Red",
					"Forest Green",
				],
				availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
				isFeatured: true,
				isActive: true,
				customizationOptions:
					"Logo printing, embroidery, sublimation, color matching, reflective elements",
				sampleAvailability: true,
				fiberComposition: "100% Moisture-Wicking Polyester",
				displayOrder: 1,
			},
			{
				name: "Elite Training Shorts",
				slug: "elite-training-shorts",
				description:
					"Premium training shorts with advanced mesh panels, secure pockets, and ergonomic fit for all-day comfort.",
				shortDescription: "Elite shorts for intensive training",
				sku: "RUN-SHORTS-001",
				categoryId: insertedCategories[0].id, // Athletic Wear
				fabricId: insertedFabrics[2].id, // Technical Mesh Pro
				basePrice: "12.75",
				moq: 100,
				leadTime: "10-14 days",
				availableColors: ["Black", "Navy", "Charcoal", "Red", "Electric Blue"],
				availableSizes: ["S", "M", "L", "XL", "XXL"],
				isFeatured: true,
				isActive: true,
				customizationOptions:
					"Side stripes, logo placement, custom colors, pocket configurations",
				sampleAvailability: true,
				fiberComposition: "85% Nylon, 15% Spandex with mesh inserts",
				displayOrder: 2,
			},
			{
				name: "Performance Compression Leggings",
				slug: "performance-compression-leggings",
				description:
					"Full-length compression leggings with muscle support technology and flatlock seams for reduced chafing.",
				shortDescription: "Professional compression leggings",
				sku: "RUN-LEGGINGS-001",
				categoryId: insertedCategories[0].id, // Athletic Wear
				fabricId: insertedFabrics[2].id, // Technical Mesh Pro
				basePrice: "18.25",
				moq: 75,
				leadTime: "16-20 days",
				availableColors: ["Black", "Navy", "Charcoal", "Purple"],
				availableSizes: ["XS", "S", "M", "L", "XL"],
				isFeatured: true,
				isActive: true,
				customizationOptions:
					"Side panels, logo placement, waistband colors, length variations",
				sampleAvailability: true,
				fiberComposition: "85% Nylon, 15% Spandex compression fabric",
				displayOrder: 3,
			},

			// Casual Sportswear Products
			{
				name: "Premium Cotton Polo",
				slug: "premium-cotton-polo",
				description:
					"Classic polo shirt made with premium cotton blend featuring reinforced seams and fade-resistant colors.",
				shortDescription: "Premium cotton polo for everyday wear",
				sku: "RUN-POLO-001",
				categoryId: insertedCategories[1].id, // Casual Sportswear
				fabricId: insertedFabrics[1].id, // Premium Cotton Blend Jersey
				basePrice: "18.00",
				moq: 75,
				leadTime: "12-18 days",
				availableColors: [
					"White",
					"Navy",
					"Gray",
					"Light Blue",
					"Green",
					"Black",
				],
				availableSizes: ["S", "M", "L", "XL", "XXL"],
				isFeatured: false,
				isActive: true,
				customizationOptions:
					"Embroidered logos, custom buttons, collar variations, pocket additions",
				sampleAvailability: true,
				fiberComposition: "60% Premium Cotton, 40% Polyester",
				displayOrder: 4,
			},
			{
				name: "Eco-Fleece Hoodie",
				slug: "eco-fleece-hoodie",
				description:
					"Sustainable hoodie made from recycled materials with kangaroo pocket and adjustable drawstring hood.",
				shortDescription: "Sustainable fleece hoodie",
				sku: "RUN-HOODIE-001",
				categoryId: insertedCategories[1].id, // Casual Sportswear
				fabricId: insertedFabrics[3].id, // Eco-Performance Fleece
				basePrice: "28.50",
				moq: 25,
				leadTime: "18-25 days",
				availableColors: [
					"Heather Gray",
					"Navy",
					"Black",
					"Maroon",
					"Forest Green",
				],
				availableSizes: ["S", "M", "L", "XL", "XXL"],
				isFeatured: true,
				isActive: true,
				customizationOptions:
					"Full zip options, embroidered logos, color blocking, pocket styles",
				sampleAvailability: true,
				fiberComposition: "100% Recycled Polyester fleece",
				displayOrder: 5,
			},

			// Team Sports Products
			{
				name: "Team Soccer Jersey",
				slug: "team-soccer-jersey",
				description:
					"Professional soccer jersey with advanced moisture management, reinforced stress points, and sublimation-ready fabric.",
				shortDescription: "Professional soccer team jersey",
				sku: "RUN-SOCCER-001",
				categoryId: insertedCategories[2].id, // Team Sports
				fabricId: insertedFabrics[0].id, // Moisture-Wicking Polyester
				basePrice: "16.25",
				moq: 100,
				leadTime: "21-28 days",
				availableColors: ["Custom team colors available - full sublimation"],
				availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
				isFeatured: true,
				isActive: true,
				customizationOptions:
					"Full sublimation printing, team logos, player names, numbers, sponsor logos",
				sampleAvailability: true,
				fiberComposition: "100% Performance Polyester with moisture channels",
				displayOrder: 6,
			},
			{
				name: "Basketball Practice Jersey",
				slug: "basketball-practice-jersey",
				description:
					"Lightweight basketball practice jersey with mesh side panels for maximum ventilation during intense training.",
				shortDescription: "Basketball practice jersey",
				sku: "RUN-BASKETBALL-001",
				categoryId: insertedCategories[2].id, // Team Sports
				fabricId: insertedFabrics[2].id, // Technical Mesh Pro
				basePrice: "14.75",
				moq: 150,
				leadTime: "18-24 days",
				availableColors: ["Red", "Blue", "Black", "White", "Yellow", "Green"],
				availableSizes: ["S", "M", "L", "XL", "XXL"],
				isFeatured: false,
				isActive: true,
				customizationOptions:
					"Screen printing, heat transfer, numbering systems, contrast panels",
				sampleAvailability: true,
				fiberComposition: "85% Polyester, 15% Spandex mesh construction",
				displayOrder: 7,
			},

			// Outdoor & Adventure Products
			{
				name: "All-Weather Windbreaker",
				slug: "all-weather-windbreaker",
				description:
					"Versatile windbreaker with water-resistant coating, packable design, and reflective details for outdoor adventures.",
				shortDescription: "All-weather outdoor windbreaker",
				sku: "RUN-WIND-001",
				categoryId: insertedCategories[3].id, // Outdoor & Adventure
				fabricId: insertedFabrics[0].id, // Moisture-Wicking Polyester
				basePrice: "22.75",
				moq: 50,
				leadTime: "16-22 days",
				availableColors: ["Black", "Navy", "Forest Green", "Orange", "Gray"],
				availableSizes: ["S", "M", "L", "XL", "XXL"],
				isFeatured: true,
				isActive: true,
				customizationOptions:
					"Reflective strips, hood options, pocket configurations, DWR coating levels",
				sampleAvailability: true,
				fiberComposition: "100% Polyester with DWR water-resistant coating",
				displayOrder: 8,
			},

			// Corporate & Workwear Products
			{
				name: "Corporate Polo Shirt",
				slug: "corporate-polo-shirt",
				description:
					"Professional polo shirt perfect for corporate uniforms with stain-resistant treatment and professional fit.",
				shortDescription: "Corporate uniform polo",
				sku: "RUN-CORPORATE-001",
				categoryId: insertedCategories[4].id, // Corporate & Workwear
				fabricId: insertedFabrics[1].id, // Premium Cotton Blend Jersey
				basePrice: "19.50",
				moq: 100,
				leadTime: "20-30 days",
				availableColors: ["White", "Navy", "Light Blue", "Gray", "Burgundy"],
				availableSizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
				isFeatured: false,
				isActive: true,
				customizationOptions:
					"Embroidered corporate logos, monogramming, custom color matching",
				sampleAvailability: true,
				fiberComposition:
					"60% Cotton, 40% Polyester with stain-resistant finish",
				displayOrder: 9,
			},
		];

		const insertedProducts = await db
			.insert(products)
			.values(productData)
			.returning();
		const accessoryData = [
			{
				name: "Performance Wristbands",
				description: "Moisture-wicking wristbands for athletic activities",
				category: "athletic",
				specifications: {
					material: "Terry cotton blend",
					size: "One size fits most",
				},
				isActive: true,
			},
			{
				name: "Team Socks",
				description: "Cushioned athletic socks with moisture management",
				category: "team",
				specifications: { material: "Polyester blend", sizes: "S, M, L, XL" },
				isActive: true,
			},
			{
				name: "Corporate Ties",
				description: "Professional ties for corporate uniforms",
				category: "corporate",
				specifications: { material: "100% Polyester", length: 'Standard 58"' },
				isActive: true,
			},
		];

		const insertedAccessories = await db
			.insert(accessories)
			.values(accessoryData)
			.returning();
		const mediaData = [
			// Athletic Wear Media
			{
				filename: "pro-running-shirt-navy.jpg",
				originalFilename: "pro-running-shirt-navy.jpg",
				mimeType: "image/jpeg",
				fileSize: 245760,
				url: "/assets/products/pro-running-shirt-navy.jpg",
				storagePath: "public/media/seed/pro-running-shirt-navy.jpg",
				bucketName: "run-media",
				type: "image" as const,
				altText: "Pro Performance Running Shirt in Navy Blue - Athletic Wear",
				isActive: true,
			},
			{
				filename: "elite-training-shorts-black.jpg",
				originalFilename: "elite-training-shorts-black.jpg",
				mimeType: "image/jpeg",
				fileSize: 198432,
				url: "/assets/products/elite-training-shorts-black.jpg",
				storagePath: "public/media/seed/elite-training-shorts-black.jpg",
				bucketName: "run-media",
				type: "image" as const,
				altText: "Elite Training Shorts in Black - Performance Athletic Wear",
				isActive: true,
			},
			{
				filename: "compression-leggings-black.jpg",
				originalFilename: "compression-leggings-black.jpg",
				mimeType: "image/jpeg",
				fileSize: 220148,
				url: "/assets/products/compression-leggings-black.jpg",
				storagePath: "public/media/seed/compression-leggings-black.jpg",
				bucketName: "run-media",
				type: "image" as const,
				altText: "Performance Compression Leggings in Black",
				isActive: true,
			},

			// Casual Sportswear Media
			{
				filename: "premium-cotton-polo-white.jpg",
				originalFilename: "premium-cotton-polo-white.jpg",
				mimeType: "image/jpeg",
				fileSize: 267890,
				url: "/assets/products/premium-cotton-polo-white.jpg",
				storagePath: "public/media/seed/premium-cotton-polo-white.jpg",
				bucketName: "run-media",
				type: "image" as const,
				altText: "Premium Cotton Polo in White - Casual Sportswear",
				isActive: true,
			},
			{
				filename: "eco-fleece-hoodie-gray.jpg",
				originalFilename: "eco-fleece-hoodie-gray.jpg",
				mimeType: "image/jpeg",
				fileSize: 312445,
				url: "/assets/products/eco-fleece-hoodie-gray.jpg",
				storagePath: "public/media/seed/eco-fleece-hoodie-gray.jpg",
				bucketName: "run-media",
				type: "image" as const,
				altText: "Eco-Fleece Hoodie in Heather Gray - Sustainable Apparel",
				isActive: true,
			},

			// Team Sports Media
			{
				filename: "team-soccer-jersey.jpg",
				originalFilename: "team-soccer-jersey.jpg",
				mimeType: "image/jpeg",
				fileSize: 289156,
				url: "/assets/products/team-soccer-jersey.jpg",
				storagePath: "public/media/seed/team-soccer-jersey.jpg",
				bucketName: "run-media",
				type: "image" as const,
				altText: "Professional Team Soccer Jersey - Customizable",
				isActive: true,
			},
			{
				filename: "basketball-practice-jersey.jpg",
				originalFilename: "basketball-practice-jersey.jpg",
				mimeType: "image/jpeg",
				fileSize: 234567,
				url: "/assets/products/basketball-practice-jersey.jpg",
				storagePath: "public/media/seed/basketball-practice-jersey.jpg",
				bucketName: "run-media",
				type: "image" as const,
				altText: "Basketball Practice Jersey with Mesh Panels",
				isActive: true,
			},

			// Outdoor & Corporate Media
			{
				filename: "all-weather-windbreaker.jpg",
				originalFilename: "all-weather-windbreaker.jpg",
				mimeType: "image/jpeg",
				fileSize: 298123,
				url: "/assets/products/all-weather-windbreaker.jpg",
				storagePath: "public/media/seed/all-weather-windbreaker.jpg",
				bucketName: "run-media",
				type: "image" as const,
				altText: "All-Weather Windbreaker - Outdoor Adventure Gear",
				isActive: true,
			},
			{
				filename: "corporate-polo-navy.jpg",
				originalFilename: "corporate-polo-navy.jpg",
				mimeType: "image/jpeg",
				fileSize: 245789,
				url: "/assets/products/corporate-polo-navy.jpg",
				storagePath: "public/media/seed/corporate-polo-navy.jpg",
				bucketName: "run-media",
				type: "image" as const,
				altText: "Corporate Polo Shirt in Navy - Professional Uniform",
				isActive: true,
			},
		];

		const insertedMedia = await db
			.insert(mediaAssets)
			.values(mediaData)
			.returning();
		const mediaLinks = [
			{ productIndex: 0, mediaIndex: 0 }, // Pro Running Shirt -> Navy image
			{ productIndex: 1, mediaIndex: 1 }, // Elite Shorts -> Black image
			{ productIndex: 2, mediaIndex: 2 }, // Compression Leggings -> Black image
			{ productIndex: 3, mediaIndex: 3 }, // Premium Polo -> White image
			{ productIndex: 4, mediaIndex: 4 }, // Eco Hoodie -> Gray image
			{ productIndex: 5, mediaIndex: 5 }, // Soccer Jersey -> Team image
			{ productIndex: 6, mediaIndex: 6 }, // Basketball Jersey -> Practice image
			{ productIndex: 7, mediaIndex: 7 }, // Windbreaker -> Outdoor image
			{ productIndex: 8, mediaIndex: 8 }, // Corporate Polo -> Navy image
		];

		let linkedCount = 0;
		for (const link of mediaLinks) {
			if (
				insertedProducts[link.productIndex] &&
				insertedMedia[link.mediaIndex]
			) {
				await db
					.update(products)
					.set({ primaryImageId: insertedMedia[link.mediaIndex].id })
					.where(eq(products.id, insertedProducts[link.productIndex].id));
				linkedCount++;
			}
		}

		// Step 11: Verification Summary
		const finalCounts = {
			categories: insertedCategories.length,
			fabrics: insertedFabrics.length,
			fibers: insertedFibers.length,
			certificates: insertedCertificates.length,
			sizeCharts: insertedSizeCharts.length,
			products: insertedProducts.length,
			accessories: insertedAccessories.length,
			mediaAssets: insertedMedia.length,
			linkedProducts: linkedCount,
		};

		return finalCounts;
	} catch (error) {
		throw error;
	}
}

// Execute seeding
comprehensiveSeedDatabase()
	.then((results) => {
		process.exit(0);
	})
	.catch((error) => {
		process.exit(1);
	});
