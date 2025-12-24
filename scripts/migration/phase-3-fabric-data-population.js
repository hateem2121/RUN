#!/usr/bin/env node

// PHASE 3: Fabric Data Population from Comprehensive Guide
import Database from "@replit/database";

const fabricData = [
	{
		name: "Single Jersey",
		description:
			"Single Jersey represents the foundation of modern sportswear knitting technology, featuring a classic single-bed knit construction that creates a smooth face and looped back texture. This lightweight, stretchy fabric offers exceptional versatility for athletic applications, providing the perfect balance of comfort, breathability, and performance that makes it ideal for base layers, t-shirts, and everyday activewear.",
		fabricType: "Single Knit",
		weight: "120-180",
		composition: [
			{ fiberId: 1, percentage: 100, name: "Polyester" }, // Pure polyester option
			{ fiberId: 2, percentage: 100, name: "Recycled Polyester" }, // Sustainable option
			{ fiberId: 1, percentage: 95, name: "Polyester" }, // Blend with elastane
			{ fiberId: 4, percentage: 5, name: "Spandex" },
		],
		performanceFeatures: [
			"Moisture-wicking",
			"Quick-dry",
			"Lightweight",
			"Breathable",
			"Soft hand feel",
			"Easy care",
		],
		keyApplications: [
			"T-shirts & Polos",
			"Base layers",
			"Casual sportswear",
			"Everyday activewear",
			"Loungewear",
			"Athletic undergarments",
		],
		care: "Machine washable 30°C, tumble dry low, no bleach, no fabric softener",
		sustainabilityScore: "3",
		certificationTags: ["OEKO-TEX Standard 100"],
		isActive: true,
	},
	{
		name: "Interlock Jersey",
		description:
			"Interlock Jersey showcases advanced double-knit construction technology that creates a fabric with identical smooth surfaces on both sides, eliminating the looped back texture of single jersey. This premium construction delivers superior dimensional stability, enhanced durability, and a luxurious hand feel that makes it perfect for high-end athletic wear requiring both performance and sophisticated appearance.",
		fabricType: "Double Knit",
		weight: "160-220",
		composition: [
			{ fiberId: 1, percentage: 92, name: "Polyester" },
			{ fiberId: 4, percentage: 8, name: "Spandex" },
		],
		performanceFeatures: [
			"Superior stability",
			"Smooth both sides",
			"Enhanced durability",
			"Excellent drape",
			"Moisture management",
			"Shape retention",
		],
		keyApplications: [
			"Premium polo shirts",
			"Performance golf wear",
			"Corporate athletic wear",
			"High-end activewear",
			"Athletic dresses",
			"Sophisticated sportswear",
		],
		care: "Machine washable 30°C, hang dry preferred, gentle cycle, no bleach",
		sustainabilityScore: "3",
		certificationTags: ["OEKO-TEX Standard 100", "Bluesign"],
		isActive: true,
	},
	{
		name: "Pique Knit",
		description:
			"Pique Knit features a distinctive raised geometric pattern created through specialized knitting techniques that form a textured surface with enhanced breathability and visual appeal. This classic construction creates natural air channels that promote ventilation while maintaining the fabric's structural integrity, making it the preferred choice for traditional polo shirts and sophisticated athletic wear.",
		fabricType: "Textured Knit",
		weight: "180-240",
		composition: [
			{ fiberId: 5, percentage: 60, name: "Cotton" },
			{ fiberId: 1, percentage: 40, name: "Polyester" },
		],
		performanceFeatures: [
			"Textured surface",
			"Enhanced breathability",
			"Moisture absorption",
			"Classic appearance",
			"Dimensional stability",
			"Natural ventilation",
		],
		keyApplications: [
			"Traditional polo shirts",
			"Golf apparel",
			"Tennis wear",
			"Casual sportswear",
			"Country club attire",
			"Classic activewear",
		],
		care: "Machine washable 40°C, tumble dry medium, iron low heat, pre-treat stains",
		sustainabilityScore: "4",
		certificationTags: [
			"Better Cotton Initiative (BCI)",
			"OEKO-TEX Standard 100",
		],
		isActive: true,
	},
	{
		name: "Mesh Knit",
		description:
			"Mesh Knit represents the pinnacle of athletic ventilation technology, featuring an open-structure construction that maximizes airflow and breathability for intense physical activities. This specialized knitting technique creates deliberate openings in the fabric structure that allow maximum air circulation while maintaining necessary coverage and durability for demanding sports applications.",
		fabricType: "Open Mesh",
		weight: "100-150",
		composition: [
			{ fiberId: 1, percentage: 88, name: "Polyester" },
			{ fiberId: 4, percentage: 12, name: "Spandex" },
		],
		performanceFeatures: [
			"Maximum breathability",
			"Exceptional ventilation",
			"Quick moisture transfer",
			"Lightweight construction",
			"High stretch",
			"Rapid cooling",
		],
		keyApplications: [
			"Athletic jerseys",
			"Sports mesh panels",
			"Ventilation zones",
			"High-intensity training wear",
			"Basketball shorts",
			"Athletic overlays",
		],
		care: "Machine washable 30°C, air dry preferred, gentle cycle, no fabric softener",
		sustainabilityScore: "2",
		certificationTags: ["OEKO-TEX Standard 100"],
		isActive: true,
	},
	{
		name: "French Terry",
		description:
			"French Terry combines the comfort of cotton with advanced knitting technology to create a fabric with a smooth exterior and soft looped interior, providing warmth without bulk. This medium-weight construction offers excellent moisture absorption while maintaining breathability, making it ideal for athletic wear that transitions seamlessly from workout to casual wear.",
		fabricType: "Loop Knit",
		weight: "240-320",
		composition: [
			{ fiberId: 5, percentage: 70, name: "Cotton" },
			{ fiberId: 2, percentage: 25, name: "Recycled Polyester" },
			{ fiberId: 4, percentage: 5, name: "Spandex" },
		],
		performanceFeatures: [
			"Soft interior loops",
			"Smooth exterior",
			"Moisture absorption",
			"Thermal regulation",
			"Comfortable stretch",
			"Casual versatility",
		],
		keyApplications: [
			"Hoodies & sweatshirts",
			"Joggers & track pants",
			"Athleisure wear",
			"Post-workout comfort",
			"Casual sportswear",
			"Lifestyle activewear",
		],
		care: "Machine washable 30°C, tumble dry low, inside out washing, gentle detergent",
		sustainabilityScore: "4",
		certificationTags: [
			"Better Cotton Initiative (BCI)",
			"Recycled Claim Standard (RCS)",
			"OEKO-TEX Standard 100",
		],
		isActive: true,
	},
	{
		name: "Fleece",
		description:
			"Fleece represents advanced thermal insulation technology through specialized brushing and napping processes that create a plush, warm surface while maintaining lightweight properties. This high-performance fabric provides exceptional warmth-to-weight ratio and superior moisture management, making it essential for cold-weather athletic activities and outdoor sports applications.",
		fabricType: "Brushed Knit",
		weight: "200-400",
		composition: [
			{ fiberId: 2, percentage: 100, name: "Recycled Polyester" }, // Sustainable fleece option
		],
		performanceFeatures: [
			"Superior insulation",
			"Lightweight warmth",
			"Moisture-wicking",
			"Soft brushed surface",
			"Wind resistance",
			"Quick-drying",
		],
		keyApplications: [
			"Jackets & outerwear",
			"Cold-weather base layers",
			"Athletic pullovers",
			"Outdoor sports gear",
			"Winter training wear",
			"Performance mid-layers",
		],
		care: "Machine washable 30°C, tumble dry low, no fabric softener, wash separately",
		sustainabilityScore: "4",
		certificationTags: [
			"Recycled Claim Standard (RCS)",
			"Bluesign",
			"OEKO-TEX Standard 100",
		],
		isActive: true,
	},
];

async function populateFabricData() {
	const db = new Database();

	// Check current fabric counter
	const counterResult = await db.get("fabrics:counter");
	const currentCounter = counterResult?.ok ? counterResult.value : 0;

	let newId = currentCounter + 1;

	for (const fabric of fabricData) {
		try {
			// Create the fabric with proper structure
			const fabricRecord = {
				id: newId,
				...fabric,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Store in database
			await db.set(`fabrics:${newId}`, JSON.stringify(fabricRecord));

			// Update counter
			await db.set("fabrics:counter", newId);

			newId++;
		} catch (error) {}
	}
}

populateFabricData().catch(console.error);
