/**
 * CMS MANUFACTURING PAGE SEEDER
 * Seeds all manufacturing-page-related CMS tables
 */

import { eq } from "drizzle-orm";
import { db } from "../../server/db.js";
import {
	manufacturingCapabilities,
	manufacturingHero,
	manufacturingProcesses,
	manufacturingQualities,
	mediaAssets,
} from "../../shared/schema.js";
import { type SeedResult, seedWithTransaction } from "../utils/seed-helpers.js";

/**
 * Seed manufacturing hero section
 */
export async function seedManufacturingHero(): Promise<SeedResult> {
	return seedWithTransaction("manufacturingHero", async () => {
		const heroImages = await db
			.select()
			.from(mediaAssets)
			.where(eq(mediaAssets.filename, "hero-manufacturing.jpg"));
		const heroImageId = heroImages[0]?.id || null;

		const heroData = {
			title: "State-of-the-Art Manufacturing",
			subtitle: "Where Innovation Meets Precision",
			description:
				"Our cutting-edge facilities combine advanced technology with skilled craftsmanship to deliver premium quality sportswear at scale.",
			imageId: heroImageId,
			backgroundMediaId: heroImageId,
			isActive: true,
		};

		return await db.insert(manufacturingHero).values(heroData).returning();
	});
}

/**
 * Seed manufacturing processes
 */
export async function seedManufacturingProcesses(): Promise<SeedResult> {
	return seedWithTransaction("manufacturingProcesses", async () => {
		const allMedia = await db.select().from(mediaAssets);
		const processImages = allMedia.filter((m) =>
			m.filename?.startsWith("process-"),
		);

		const processesData = [
			{
				name: "Fabric Selection & Inspection",
				title: "Fabric Selection & Inspection",
				description:
					"Every roll of fabric undergoes rigorous quality inspection before entering production. We verify weight, composition, and performance characteristics.",
				step: 1,
				duration: "2-4 hours",
				imageId: processImages[0]?.id || null,
				isActive: true,
				sortOrder: 1,
			},
			{
				name: "Pattern Making & Cutting",
				title: "Pattern Making & Cutting",
				description:
					"CAD-designed patterns optimized for minimal waste. Automated cutting systems ensure precision and consistency across all sizes.",
				step: 2,
				duration: "4-6 hours",
				imageId: processImages[1]?.id || null,
				isActive: true,
				sortOrder: 2,
			},
			{
				name: "Assembly & Sewing",
				title: "Assembly & Sewing",
				description:
					"Skilled seamstresses use industrial-grade equipment. Multiple quality checkpoints ensure perfect stitching and construction.",
				step: 3,
				duration: "6-8 hours",
				imageId: processImages[2]?.id || null,
				isActive: true,
				sortOrder: 3,
			},
			{
				name: "Quality Control",
				title: "Quality Control",
				description:
					"Multi-stage inspection process checking fit, finish, and functionality. Each garment must pass 15+ quality checkpoints.",
				step: 4,
				duration: "2-3 hours",
				imageId: processImages[3]?.id || null,
				isActive: true,
				sortOrder: 4,
			},
			{
				name: "Finishing & Packaging",
				title: "Finishing & Packaging",
				description:
					"Professional finishing touches including pressing, tagging, and custom packaging per client specifications.",
				step: 5,
				duration: "3-4 hours",
				imageId: processImages[4]?.id || null,
				isActive: true,
				sortOrder: 5,
			},
			{
				name: "Shipping & Logistics",
				title: "Shipping & Logistics",
				description:
					"Efficient logistics system with real-time tracking. Global shipping capabilities with express options available.",
				step: 6,
				duration: "1-2 days",
				imageId: processImages[5]?.id || null,
				isActive: true,
				sortOrder: 6,
			},
		];

		return await db
			.insert(manufacturingProcesses)
			.values(processesData)
			.returning();
	});
}

/**
 * Seed manufacturing capabilities
 */
export async function seedManufacturingCapabilities(): Promise<SeedResult> {
	return seedWithTransaction("manufacturingCapabilities", async () => {
		const capabilitiesData = [
			{
				name: "Custom Design & Development",
				title: "Custom Design & Development",
				description: "Full in-house design team to bring your vision to life",
				category: "design",
				icon: "Palette",
				isActive: true,
				sortOrder: 1,
			},
			{
				name: "Sublimation Printing",
				title: "Sublimation Printing",
				description:
					"High-definition full-color printing with unlimited design possibilities",
				category: "printing",
				icon: "Printer",
				isActive: true,
				sortOrder: 2,
			},
			{
				name: "Embroidery Services",
				title: "Embroidery Services",
				description:
					"Premium embroidery for logos and branding in up to 15 colors",
				category: "embroidery",
				icon: "Scissors",
				isActive: true,
				sortOrder: 3,
			},
			{
				name: "Heat Transfer Application",
				title: "Heat Transfer Application",
				description: "Durable heat-applied graphics and numbering systems",
				category: "printing",
				icon: "Flame",
				isActive: true,
				sortOrder: 4,
			},
			{
				name: "Sample Development",
				title: "Sample Development",
				description: "Rapid prototyping and sample creation for approval",
				category: "development",
				icon: "Zap",
				isActive: true,
				sortOrder: 5,
			},
			{
				name: "Size Grading",
				title: "Size Grading",
				description:
					"Complete size runs from XS to 5XL with custom sizing available",
				category: "sizing",
				icon: "Maximize",
				isActive: true,
				sortOrder: 6,
			},
			{
				name: "Quality Assurance",
				title: "Quality Assurance",
				description: "ISO-certified QA process with comprehensive testing",
				category: "quality",
				icon: "Shield",
				isActive: true,
				sortOrder: 7,
			},
			{
				name: "Private Labeling",
				title: "Private Labeling",
				description:
					"Custom branding, tags, and labels for your brand identity",
				category: "branding",
				icon: "Tag",
				isActive: true,
				sortOrder: 8,
			},
		];

		return await db
			.insert(manufacturingCapabilities)
			.values(capabilitiesData)
			.returning();
	});
}

/**
 * Seed manufacturing qualities
 */
export async function seedManufacturingQualities(): Promise<SeedResult> {
	return seedWithTransaction("manufacturingQualities", async () => {
		const qualitiesData = [
			{
				title: "ISO 9001 Certified",
				description:
					"International quality management system certification ensuring consistent excellence",
				icon: "Award",
				category: "certification",
				isActive: true,
				sortOrder: 1,
			},
			{
				title: "Fabric Testing",
				description:
					"Comprehensive fabric testing for durability, colorfastness, and performance",
				icon: "TestTube",
				category: "testing",
				testingMethod: "Laboratory analysis",
				frequency: "Every batch",
				isActive: true,
				sortOrder: 2,
			},
			{
				title: "Stitch Quality Control",
				description:
					"Minimum 12 stitches per inch with reinforced stress points",
				icon: "Target",
				category: "construction",
				testingMethod: "Visual and stress testing",
				frequency: "Every garment",
				isActive: true,
				sortOrder: 3,
			},
			{
				title: "Dimensional Accuracy",
				description: "Precise measurements with ±2% tolerance across all sizes",
				icon: "Ruler",
				category: "sizing",
				testingMethod: "Measurement verification",
				frequency: "Random sampling",
				isActive: true,
				sortOrder: 4,
			},
			{
				title: "Colorfastness Testing",
				description:
					"Grade 4-5 colorfastness to washing, light, and perspiration",
				icon: "Droplet",
				category: "fabric",
				testingMethod: "ISO 105 standard testing",
				frequency: "Per color lot",
				isActive: true,
				sortOrder: 5,
			},
		];

		return await db
			.insert(manufacturingQualities)
			.values(qualitiesData)
			.returning();
	});
}

// Export all seeders
export const manufacturingSeeders = {
	seedManufacturingHero,
	seedManufacturingProcesses,
	seedManufacturingCapabilities,
	seedManufacturingQualities,
};
