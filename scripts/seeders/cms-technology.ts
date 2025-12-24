/**
 * CMS TECHNOLOGY PAGE SEEDER
 * Seeds all technology-page-related CMS tables
 */

import { eq } from "drizzle-orm";
import { db } from "../../server/db.js";
import {
	mediaAssets,
	technologyCta,
	technologyEquipment,
	technologyGradientSettings,
	technologyHero,
	technologyInnovations,
	technologyResearch,
	technologyRoadmap,
} from "../../shared/schema.js";
import { type SeedResult, seedWithTransaction } from "../utils/seed-helpers.js";

/**
 * Seed technology hero section
 */
export async function seedTechnologyHero(): Promise<SeedResult> {
	return seedWithTransaction("technologyHero", async () => {
		const heroImages = await db
			.select()
			.from(mediaAssets)
			.where(eq(mediaAssets.filename, "hero-technology.jpg"));
		const heroImageId = heroImages[0]?.id || null;

		const heroData = {
			title: "Innovation Driving Excellence",
			subtitle: "Advanced Technology in Textile Manufacturing",
			description:
				"Our investment in cutting-edge technology enables us to deliver superior quality, faster turnaround, and innovative solutions.",
			primaryButtonText: "Explore Our Tech",
			primaryButtonLink: "#innovations",
			secondaryButtonText: "View Equipment",
			secondaryButtonLink: "#equipment",
			imageId: heroImageId,
			backgroundMediaId: heroImageId,
			isActive: true,
		};

		return await db.insert(technologyHero).values(heroData).returning();
	});
}

/**
 * Seed technology innovations
 */
export async function seedTechnologyInnovations(): Promise<SeedResult> {
	return seedWithTransaction("technologyInnovations", async () => {
		const innovationsData = [
			{
				name: "3D Knitting Technology",
				description:
					"Seamless garment construction using advanced 3D knitting machines for enhanced comfort and fit",
				category: "manufacturing",
				benefits: [
					"Zero waste production",
					"Enhanced durability",
					"Perfect fit",
					"Faster production",
				],
				developmentYear: "2022",
				isActive: true,
				sortOrder: 1,
			},
			{
				name: "Laser Cutting System",
				description:
					"Precision laser cutting for intricate patterns and designs with minimal fabric waste",
				category: "cutting",
				benefits: [
					"99.9% accuracy",
					"Complex designs",
					"Reduced waste",
					"Faster processing",
				],
				developmentYear: "2021",
				isActive: true,
				sortOrder: 2,
			},
			{
				name: "Automated Quality Inspection",
				description:
					"AI-powered visual inspection system detecting defects with 99.5% accuracy",
				category: "quality",
				benefits: [
					"Consistent quality",
					"Early defect detection",
					"Reduced waste",
					"24/7 monitoring",
				],
				developmentYear: "2023",
				isActive: true,
				sortOrder: 3,
			},
			{
				name: "Digital Printing Innovation",
				description:
					"Water-based digital printing for vibrant, eco-friendly designs",
				category: "printing",
				benefits: [
					"Unlimited colors",
					"Eco-friendly",
					"Small batch capable",
					"Fast turnaround",
				],
				developmentYear: "2020",
				isActive: true,
				sortOrder: 4,
			},
			{
				name: "Smart Inventory Management",
				description:
					"RFID-based inventory tracking providing real-time stock visibility",
				category: "logistics",
				benefits: [
					"Real-time tracking",
					"Reduced errors",
					"Optimized storage",
					"Faster fulfillment",
				],
				developmentYear: "2021",
				isActive: true,
				sortOrder: 5,
			},
			{
				name: "Performance Testing Lab",
				description:
					"In-house lab testing fabric durability, moisture management, and performance",
				category: "research",
				benefits: [
					"Quality assurance",
					"Data-driven decisions",
					"Innovation testing",
					"Certification support",
				],
				developmentYear: "2022",
				isActive: true,
				sortOrder: 6,
			},
		];

		return await db
			.insert(technologyInnovations)
			.values(innovationsData)
			.returning();
	});
}

/**
 * Seed technology equipment
 */
export async function seedTechnologyEquipment(): Promise<SeedResult> {
	return seedWithTransaction("technologyEquipment", async () => {
		const allMedia = await db.select().from(mediaAssets);
		const equipmentImages = allMedia.filter((m) =>
			m.filename?.startsWith("equipment-"),
		);

		const equipmentData = [
			{
				name: "Shima Seiki 3D Knitting Machines",
				description: "World-leading seamless knitting technology from Japan",
				category: "knitting",
				manufacturer: "Shima Seiki",
				model: "MACH2XS",
				quantity: 12,
				capabilities: [
					"Seamless construction",
					"3D design",
					"Multi-color knitting",
				],
				imageId: equipmentImages[0]?.id || null,
				isActive: true,
				sortOrder: 1,
			},
			{
				name: "Gerber Automated Cutting System",
				description: "High-speed automated cutting with precision control",
				category: "cutting",
				manufacturer: "Gerber Technology",
				model: "GERBERcutter Z7",
				quantity: 8,
				capabilities: [
					"Multi-layer cutting",
					"Laser precision",
					"CAD integration",
				],
				imageId: equipmentImages[1]?.id || null,
				isActive: true,
				sortOrder: 2,
			},
			{
				name: "Brother Industrial Sewing Machines",
				description:
					"High-performance industrial sewing with precision stitching",
				category: "sewing",
				manufacturer: "Brother",
				model: "S-7300A",
				quantity: 150,
				capabilities: [
					"High-speed operation",
					"Consistent stitch quality",
					"Low maintenance",
				],
				imageId: equipmentImages[2]?.id || null,
				isActive: true,
				sortOrder: 3,
			},
			{
				name: "Mimaki Digital Textile Printer",
				description:
					"Advanced digital printing for vibrant, eco-friendly designs",
				category: "printing",
				manufacturer: "Mimaki",
				model: "TS300P-1800",
				quantity: 6,
				capabilities: ["Water-based inks", "High resolution", "Wide format"],
				imageId: equipmentImages[3]?.id || null,
				isActive: true,
				sortOrder: 4,
			},
			{
				name: "Tajima Embroidery Machines",
				description: "Multi-head embroidery systems for complex designs",
				category: "embroidery",
				manufacturer: "Tajima",
				model: "TFMX-II",
				quantity: 10,
				capabilities: [
					"15-head system",
					"Up to 15 colors",
					"High-speed operation",
				],
				imageId: equipmentImages[4]?.id || null,
				isActive: true,
				sortOrder: 5,
			},
		];

		return await db
			.insert(technologyEquipment)
			.values(equipmentData)
			.returning();
	});
}

/**
 * Seed technology research
 */
export async function seedTechnologyResearch(): Promise<SeedResult> {
	return seedWithTransaction("technologyResearch", async () => {
		const researchData = [
			{
				title: "Biodegradable Performance Fabrics",
				description:
					"Developing high-performance fabrics that biodegrade at end of life",
				researchArea: "materials",
				status: "ongoing",
				startDate: new Date("2023-03-01"),
				expectedCompletion: new Date("2025-12-31"),
				isActive: true,
				sortOrder: 1,
			},
			{
				title: "Smart Textile Integration",
				description:
					"Embedding sensors and conductive threads for performance tracking",
				researchArea: "wearables",
				status: "ongoing",
				startDate: new Date("2023-06-01"),
				expectedCompletion: new Date("2026-06-30"),
				isActive: true,
				sortOrder: 2,
			},
			{
				title: "Carbon-Neutral Dyeing Process",
				description: "Revolutionary dyeing process with zero carbon emissions",
				researchArea: "sustainability",
				status: "testing",
				startDate: new Date("2022-01-01"),
				expectedCompletion: new Date("2024-12-31"),
				isActive: true,
				sortOrder: 3,
			},
			{
				title: "AI-Powered Design Optimization",
				description:
					"Machine learning algorithms for optimal pattern layouts and minimal waste",
				researchArea: "efficiency",
				status: "completed",
				startDate: new Date("2021-06-01"),
				expectedCompletion: new Date("2023-06-30"),
				isActive: true,
				sortOrder: 4,
			},
		];

		return await db.insert(technologyResearch).values(researchData).returning();
	});
}

/**
 * Seed technology roadmap
 */
export async function seedTechnologyRoadmap(): Promise<SeedResult> {
	return seedWithTransaction("technologyRoadmap", async () => {
		const roadmapData = [
			{
				title: "Automated Warehouse System",
				description: "Fully automated inventory management and picking system",
				timeline: "Q2 2025",
				category: "logistics",
				priority: "high",
				isActive: true,
				sortOrder: 1,
			},
			{
				title: "AR Design Visualization",
				description: "Augmented reality tools for client design visualization",
				timeline: "Q3 2025",
				category: "design",
				priority: "medium",
				isActive: true,
				sortOrder: 2,
			},
			{
				title: "Blockchain Supply Chain",
				description: "Blockchain-based supply chain transparency and tracking",
				timeline: "Q4 2025",
				category: "transparency",
				priority: "medium",
				isActive: true,
				sortOrder: 3,
			},
			{
				title: "AI Quality Prediction",
				description:
					"Predictive quality analytics to prevent defects before production",
				timeline: "Q1 2026",
				category: "quality",
				priority: "high",
				isActive: true,
				sortOrder: 4,
			},
			{
				title: "Zero-Waste Manufacturing",
				description:
					"Complete elimination of production waste through circular processes",
				timeline: "Q2 2026",
				category: "sustainability",
				priority: "high",
				isActive: true,
				sortOrder: 5,
			},
		];

		return await db.insert(technologyRoadmap).values(roadmapData).returning();
	});
}

/**
 * Seed technology gradient settings (UI configuration)
 */
export async function seedTechnologyGradientSettings(): Promise<SeedResult> {
	return seedWithTransaction("technologyGradientSettings", async () => {
		const gradientData = {
			gradientType: "linear",
			colors: ["#1976d2", "#0d47a1", "#42a5f5"],
			direction: "to-right",
			isActive: true,
		};

		return await db
			.insert(technologyGradientSettings)
			.values(gradientData)
			.returning();
	});
}

/**
 * Seed technology CTA sections
 */
export async function seedTechnologyCta(): Promise<SeedResult> {
	return seedWithTransaction("technologyCta", async () => {
		const ctaData = [
			{
				title: "See Our Technology in Action",
				description:
					"Schedule a virtual facility tour to see our advanced equipment and processes firsthand",
				ctaText: "Book a Tour",
				ctaLink: "/contact?subject=facility-tour",
				isActive: true,
				sortOrder: 1,
			},
			{
				title: "Innovation Partnership Opportunities",
				description:
					"Collaborate with our R&D team on cutting-edge textile technology projects",
				ctaText: "Explore Partnerships",
				ctaLink: "/contact?subject=partnership",
				isActive: true,
				sortOrder: 2,
			},
		];

		return await db.insert(technologyCta).values(ctaData).returning();
	});
}

// Export all seeders
export const technologySeeders = {
	seedTechnologyHero,
	seedTechnologyInnovations,
	seedTechnologyEquipment,
	seedTechnologyResearch,
	seedTechnologyRoadmap,
	seedTechnologyGradientSettings,
	seedTechnologyCta,
};
