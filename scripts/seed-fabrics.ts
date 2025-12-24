import { db } from "../server/db.js";
import { fabrics, fibers } from "../shared/schema.js";

// import { eq } from 'drizzle-orm';

// Helper to find fiber ID by name (fuzzy match)
async function getFiberMap() {
	const allFibers = await db.select().from(fibers);
	return allFibers;
}

function findFiberId(allFibers: any[], name: string): number | null {
	const lowerName = name.toLowerCase();

	// Direct match
	const direct = allFibers.find((f) => f.name.toLowerCase() === lowerName);
	if (direct) return direct.id;

	// Keyword matching
	if (lowerName.includes("polyester") || lowerName.includes("poly")) {
		if (
			lowerName.includes("recycled") ||
			lowerName.includes("rpet") ||
			lowerName.includes("eco")
		) {
			return (
				allFibers.find((f) => f.name === "Recycled Polyester (rPET)")?.id ||
				null
			);
		}
		if (lowerName.includes("graphene")) {
			return (
				allFibers.find((f) => f.name === "Graphene-Infused Polyester")?.id ||
				null
			);
		}
		return (
			allFibers.find(
				(f) => f.name === "Virgin Polyester (Standard Performance)",
			)?.id || null
		);
	}

	if (lowerName.includes("cotton")) {
		if (lowerName.includes("organic")) {
			return (
				allFibers.find((f) => f.name === "Organic Cotton (GOTS)")?.id || null
			);
		}
		return (
			allFibers.find((f) => f.name === "Conventional Cotton (Carded/Combed)")
				?.id || null
		);
	}

	if (
		lowerName.includes("elastane") ||
		lowerName.includes("spandex") ||
		lowerName.includes("lycra")
	) {
		if (lowerName.includes("eco") || lowerName.includes("recycled")) {
			return (
				allFibers.find(
					(f) => f.name === "Eco-Smart Elastane (Recycled Content)",
				)?.id || null
			);
		}
		return (
			allFibers.find((f) => f.name === "Standard Elastane (Spandex/Lycra)")
				?.id || null
		);
	}

	if (lowerName.includes("nylon") || lowerName.includes("polyamide")) {
		if (lowerName.includes("recycled") || lowerName.includes("bio")) {
			return (
				allFibers.find((f) => f.name === "Recycled Nylon (pre-consumer)")?.id ||
				null
			);
		}
		return (
			allFibers.find((f) => f.name === "Virgin Nylon 6 (Polyamide)")?.id || null
		);
	}

	if (lowerName.includes("fleece")) {
		if (lowerName.includes("recycled")) {
			return (
				allFibers.find((f) => f.name === "Recycled Performance Fleece")?.id ||
				null
			);
		}
		return (
			allFibers.find((f) => f.name === "Standard Micro-Fleece")?.id || null
		);
	}

	if (lowerName.includes("neoprene") || lowerName.includes("rubber")) {
		if (lowerName.includes("limestone") || lowerName.includes("bio")) {
			return (
				allFibers.find((f) => f.name === "Eco-Limestone Neoprene")?.id || null
			);
		}
		return (
			allFibers.find((f) => f.name === "Standard Neoprene (Petroleum)")?.id ||
			null
		);
	}

	if (lowerName.includes("hemp")) {
		return allFibers.find((f) => f.name === "Performance Hemp")?.id || null;
	}

	if (
		lowerName.includes("modal") ||
		lowerName.includes("tencel") ||
		lowerName.includes("bamboo") ||
		lowerName.includes("rayon")
	) {
		return (
			allFibers.find((f) => f.name === "MicroModal (Beechwood)")?.id || null
		);
	}

	if (lowerName.includes("polypropylene") || lowerName.includes("olefin")) {
		return (
			allFibers.find((f) => f.name === "Polypropylene (Olefin)")?.id || null
		);
	}

	return null;
}

const fabricsData = [
	{
		name: "RunTech™ Aero-Mesh 145",
		weight: "145 GSM",
		sport: "Soccer, Basketball, American Football",
		marketSegment: "Professional Teamwear",
		seasonality: "Summer / High-Output",
		description:
			"Our flagship performance eyelet mesh. Engineered with a micro-diamond knit structure that maximizes airflow while maintaining high opacity. The surface is treated for high-definition sublimation printing, ensuring player numbers and sponsor logos remain crisp.",
		fabricType: "Micro-Eyelet Knit",
		isActive: true,
		properties: {
			stretchPercentage: "20-40%",
			airPermeability: "300 (High)",
			moistureManagement: "Excellent",
			wickingRate: "Instant (< 2 sec)",
			abrasionResistance: "25,000 Cycles",
			pillingGrade: "Grade 4",
			shrinkageTolerancePercentage: "2%",
			washTemperature: "40°C",
			sustainabilityScore: "85",
			certificationTags: [], // Would need IDs, skipping for now
			washCareInstructions: {
				instructions: "Machine wash inside out. No softeners.",
				careSymbols: [],
				restrictions: [],
			},
			compositions: [
				{
					name: "Standard Poly",
					isDefault: true,
					fibers: [{ name: "Virgin Polyester", percentage: "100" }],
				},
				{
					name: "Eco-Poly",
					isDefault: false,
					fibers: [{ name: "Recycled Polyester", percentage: "100" }],
				},
				{
					name: "Poly-Flex",
					isDefault: false,
					fibers: [
						{ name: "Polyester", percentage: "95" },
						{ name: "Elastane", percentage: "5" },
					],
				},
				{
					name: "Eco-Poly Flex",
					isDefault: false,
					fibers: [
						{ name: "Recycled Polyester", percentage: "95" },
						{ name: "Eco-Smart Elastane", percentage: "5" },
					],
				},
				{
					name: "Tech-Graphene",
					isDefault: false,
					fibers: [
						{ name: "Polyester", percentage: "92" },
						{ name: "Graphene-Infused Polyester", percentage: "8" },
					],
				},
				{
					name: "Promo-Poly",
					isDefault: false,
					fibers: [{ name: "Spun Polyester", percentage: "100" }],
				},
			],
		},
	},
	{
		name: "Sculpt-Core™ 260",
		weight: "260 GSM",
		sport: "Yoga, Pilates, Gym, Running",
		marketSegment: "Premium Activewear",
		seasonality: "All-Season",
		description:
			'The "Rolls Royce" of leggings fabrics. A double-knit interlock construction that provides high compression without sheerness (guaranteed "Squat-Proof"). Features a matte finish and a "Cool-to-Touch" sensation.',
		fabricType: "Interlock Double-Knit",
		isActive: true,
		properties: {
			stretchPercentage: "200% (4-Way Power Stretch)",
			airPermeability: "50 (Low)",
			moistureManagement: "Good",
			abrasionResistance: "50,000 Cycles",
			pillingGrade: "Grade 5",
			shrinkageTolerancePercentage: "3%",
			washTemperature: "30°C",
			sustainabilityScore: "75",
			washCareInstructions: {
				instructions: "Wash cold. Lay flat to dry.",
				careSymbols: [],
				restrictions: [],
			},
			compositions: [
				{
					name: "Nylon-Flex",
					isDefault: true,
					fibers: [
						{ name: "Nylon 6.6", percentage: "75" },
						{ name: "High-Modulus Elastane", percentage: "25" },
					],
				},
				{
					name: "Bio-Nylon Flex",
					isDefault: false,
					fibers: [
						{ name: "Bio-Based Polyamide", percentage: "75" },
						{ name: "Eco-Smart Elastane", percentage: "25" },
					],
				},
				{
					name: "Tencel-Flex",
					isDefault: false,
					fibers: [
						{ name: "Tencel™ Active Lyocell", percentage: "80" },
						{ name: "Elastane", percentage: "20" },
					],
				},
				{
					name: "Eco-Poly Flex",
					isDefault: false,
					fibers: [
						{ name: "Recycled Polyester", percentage: "77" },
						{ name: "Elastane", percentage: "23" },
					],
				},
				{
					name: "Elite-Matte",
					isDefault: false,
					fibers: [
						{ name: "Nylon 6", percentage: "70" },
						{ name: "Lycra® Black", percentage: "30" },
					],
				},
				{
					name: "Heather-Blend",
					isDefault: false,
					fibers: [
						{ name: "Nylon", percentage: "45" },
						{ name: "Polyester", percentage: "45" },
						{ name: "Elastane", percentage: "10" },
					],
				},
			],
		},
	},
	{
		name: "Heritage French Terry 350",
		weight: "350 GSM",
		sport: "Lifestyle, Recovery, Corporate",
		marketSegment: "Premium Streetwear",
		seasonality: "Fall / Winter",
		description:
			"A substantial, heavyweight knit that defines quality. Smooth face for screen printing, with a structured loop-back interior that breathes better than fleece.",
		fabricType: "French Terry (Loop Back)",
		isActive: true,
		properties: {
			stretchPercentage: "10-15%",
			airPermeability: "Moderate",
			moistureManagement: "High (Absorbent)",
			pillingGrade: "Grade 3-4",
			shrinkageTolerancePercentage: "5%",
			washTemperature: "40°C",
			sustainabilityScore: "90",
			washCareInstructions: {
				instructions: "Machine wash warm. Tumble dry medium.",
				careSymbols: [],
				restrictions: [],
			},
			compositions: [
				{
					name: "Standard Cotton",
					isDefault: true,
					fibers: [{ name: "Combed Cotton", percentage: "100" }],
				},
				{
					name: "Organic Cotton",
					isDefault: false,
					fibers: [{ name: "Organic Cotton", percentage: "100" }],
				},
				{
					name: "CVC Blend",
					isDefault: false,
					fibers: [
						{ name: "Cotton", percentage: "60" },
						{ name: "Polyester", percentage: "40" },
					],
				},
				{
					name: "Eco-CVC Blend",
					isDefault: false,
					fibers: [
						{ name: "Organic Cotton", percentage: "60" },
						{ name: "Recycled Polyester", percentage: "40" },
					],
				},
				{
					name: "Cotton-Flex",
					isDefault: false,
					fibers: [
						{ name: "Cotton", percentage: "95" },
						{ name: "Elastane", percentage: "5" },
					],
				},
				{
					name: "Bamboo-Blend",
					isDefault: false,
					fibers: [
						{ name: "Bamboo Viscose", percentage: "70" },
						{ name: "Organic Cotton", percentage: "30" },
					],
				},
			],
		},
	},
	{
		name: "Storm-Shield™ 3L Softshell",
		weight: "280 GSM",
		sport: "Outdoor, Sideline, Hiking",
		marketSegment: "Performance Outerwear",
		seasonality: "Winter / Foul Weather",
		description:
			"A 3-Layer bonded fabric system. The outer layer repels rain, the middle membrane blocks wind but allows vapor escape, and the inner micro-fleece traps heat.",
		fabricType: "Bonded Composite",
		isActive: true,
		properties: {
			stretchPercentage: "10-15%",
			waterColumn: "10,000mm",
			moistureManagement: "Breathable Membrane",
			abrasionResistance: "Very High",
			shrinkageTolerancePercentage: "1%",
			washTemperature: "30°C",
			sustainabilityScore: "70",
			washCareInstructions: {
				instructions: "Machine wash cold. Tumble dry low (reactivate DWR).",
				careSymbols: [],
				restrictions: [],
			},
			compositions: [
				{
					name: "Poly-Shield",
					isDefault: true,
					fibers: [
						{ name: "Polyester", percentage: "94" },
						{ name: "Spandex", percentage: "6" },
					],
				},
				{
					name: "Eco-Poly Shield",
					isDefault: false,
					fibers: [
						{ name: "Recycled Polyester", percentage: "94" },
						{ name: "Spandex", percentage: "6" },
					],
				},
				{
					name: "Nylon-Shield",
					isDefault: false,
					fibers: [
						{ name: "Nylon 6", percentage: "92" },
						{ name: "Spandex", percentage: "8" },
					],
				},
				{
					name: "Thermal-Shield",
					isDefault: false,
					fibers: [
						{ name: "Polyester", percentage: "90" },
						{ name: "Spandex", percentage: "10" },
					],
				},
				{
					name: "Flex-Shield",
					isDefault: false,
					fibers: [
						{ name: "Polyester", percentage: "88" },
						{ name: "Spandex", percentage: "12" },
					],
				},
				{
					name: "Workwear-Shield",
					isDefault: false,
					fibers: [{ name: "Polyester Ripstop", percentage: "100" }],
				},
			],
		},
	},
	{
		name: "Zen-Luxe™ Performance Jersey",
		weight: "180 GSM",
		sport: "Golf, Travel, Corporate Casual",
		marketSegment: "Premium Lifestyle",
		seasonality: "Summer / Spring",
		description:
			'The ultimate "Travel Tee" fabric. Blending the durability of cotton with the technical properties of Bamboo/Modal for natural odor resistance and temperature regulation.',
		fabricType: "Single Jersey Knit",
		isActive: true,
		properties: {
			stretchPercentage: "30-40%",
			moistureManagement: "High",
			performanceFeatures: ["Anti-Odor"],
			pillingGrade: "Grade 3-4",
			shrinkageTolerancePercentage: "4%",
			washTemperature: "30°C",
			sustainabilityScore: "80",
			washCareInstructions: {
				instructions: "Wash cold. Line dry.",
				careSymbols: [],
				restrictions: [],
			},
			compositions: [
				{
					name: "Hybrid-Bamboo",
					isDefault: true,
					fibers: [
						{ name: "Cotton", percentage: "50" },
						{ name: "Bamboo Viscose", percentage: "45" },
						{ name: "Elastane", percentage: "5" },
					],
				},
				{
					name: "Eco-Hybrid Bamboo",
					isDefault: false,
					fibers: [
						{ name: "Organic Cotton", percentage: "50" },
						{ name: "Bamboo Lyocell", percentage: "45" },
						{ name: "Eco-Elastane", percentage: "5" },
					],
				},
				{
					name: "Tri-Blend",
					isDefault: false,
					fibers: [
						{ name: "Polyester", percentage: "50" },
						{ name: "Cotton", percentage: "25" },
						{ name: "Rayon", percentage: "25" },
					],
				},
				{
					name: "Pure-Bamboo Flex",
					isDefault: false,
					fibers: [
						{ name: "Bamboo Charcoal Viscose", percentage: "95" },
						{ name: "Elastane", percentage: "5" },
					],
				},
				{
					name: "Modal-Flex",
					isDefault: false,
					fibers: [
						{ name: "MicroModal", percentage: "95" },
						{ name: "Elastane", percentage: "5" },
					],
				},
				{
					name: "CVC Blend",
					isDefault: false,
					fibers: [
						{ name: "Cotton", percentage: "60" },
						{ name: "Polyester", percentage: "40" },
					],
				},
			],
		},
	},
	{
		name: "Thermo-Skin™ Pro",
		weight: "130 GSM",
		sport: "Skiing, Winter Football, Running",
		marketSegment: "Technical Base Layer",
		seasonality: "Winter",
		description:
			"The lightest thermal fabric on the market. Using hollow-core or hydrophobic technology to trap heat without bulk.",
		fabricType: "Seamless Circular Knit",
		isActive: true,
		properties: {
			stretchPercentage: "150% (High Compression)",
			moistureManagement: "Hydrophobic",
			dryingTime: "Instant",
			abrasionResistance: "Moderate",
			shrinkageTolerancePercentage: "1%",
			washTemperature: "30°C",
			sustainabilityScore: "60",
			washCareInstructions: {
				instructions: "Wash cool. Do not tumble dry.",
				careSymbols: [],
				restrictions: [],
			},
			compositions: [
				{
					name: "Polypro-Flex",
					isDefault: true,
					fibers: [
						{ name: "Polypropylene", percentage: "90" },
						{ name: "Elastane", percentage: "10" },
					],
				},
				{
					name: "Eco-Poly Thermal",
					isDefault: false,
					fibers: [
						{ name: "Recycled Polyester", percentage: "90" },
						{ name: "Elastane", percentage: "10" },
					],
				},
				{
					name: "Pure-Merino",
					isDefault: false,
					fibers: [{ name: "Merino Wool", percentage: "100" }],
				},
				{
					name: "Merino-Blend",
					isDefault: false,
					fibers: [
						{ name: "Merino Wool", percentage: "50" },
						{ name: "Recycled Polyester", percentage: "50" },
					],
				},
				{
					name: "Nylon-Thermal",
					isDefault: false,
					fibers: [
						{ name: "Nylon 6.6", percentage: "85" },
						{ name: "Spandex", percentage: "15" },
					],
				},
				{
					name: "Poly-Thermal",
					isDefault: false,
					fibers: [
						{ name: "Polyester", percentage: "92" },
						{ name: "Spandex", percentage: "8" },
					],
				},
			],
		},
	},
	{
		name: "Eco-Flex™ Scuba 3.0",
		weight: "N/A (Measured in mm)",
		sport: "Surfing, Diving, Triathlon",
		marketSegment: "Water Sports",
		description:
			"Revolutionary limestone-derived rubber. 94% nitrogen bubble structure makes it lighter and warmer than oil-based neoprene.",
		fabricType: "Closed-Cell Foam",
		isActive: true,
		properties: {
			stretchPercentage: "400%",
			waterColumn: "Infinite",
			performanceFeatures: ["Insulation: Extreme", "UV Resistance: High"],
			washTemperature: "Cold Rinse",
			sustainabilityScore: "75",
			washCareInstructions: {
				instructions: "Rinse fresh water. Hang dry shade.",
				careSymbols: [],
				restrictions: [],
			},
			compositions: [
				{
					name: "Limestone-Nylon",
					isDefault: true,
					fibers: [
						{ name: "Limestone Rubber", percentage: "100" },
						{ name: "Nylon Jersey", percentage: "0" },
					],
				},
				{
					name: "Limestone-Eco Poly",
					isDefault: false,
					fibers: [
						{ name: "Limestone Rubber", percentage: "100" },
						{ name: "rPET Face", percentage: "0" },
					],
				},
				{
					name: "Limestone-Thermal",
					isDefault: false,
					fibers: [
						{ name: "Limestone Rubber", percentage: "100" },
						{ name: "Fleece Lining", percentage: "0" },
					],
				},
				{
					name: "Standard-Petroleum",
					isDefault: false,
					fibers: [
						{ name: "Petroleum Neoprene", percentage: "100" },
						{ name: "Nylon Face", percentage: "0" },
					],
				},
				{
					name: "Limestone-Smooth",
					isDefault: false,
					fibers: [
						{ name: "Limestone Rubber", percentage: "100" },
						{ name: "Smooth Skin", percentage: "0" },
					],
				},
				{
					name: "Bio-Rubber",
					isDefault: false,
					fibers: [
						{ name: "Natural Rubber", percentage: "100" },
						{ name: "Recycled Nylon", percentage: "0" },
					],
				},
			],
		},
	},
	{
		name: "Velocity™ Diamond Ripstop",
		weight: "85 GSM",
		sport: "Running Shorts, Windbreakers",
		marketSegment: "Performance Woven",
		description:
			'Featherweight woven fabric with "Diamond" reinforcement grid to prevent tears. Wind-resistant and highly breathable.',
		fabricType: "Woven Ripstop",
		isActive: true,
		properties: {
			stretchPercentage: "0-15%",
			waterColumn: "DWR Repellent",
			tearStrength: "Very High",
			abrasionResistance: "High",
			shrinkageTolerancePercentage: "0-1%",
			washTemperature: "30°C",
			sustainabilityScore: "80",
			washCareInstructions: {
				instructions: "Wash cold. Tumble dry low.",
				careSymbols: [],
				restrictions: [],
			},
			compositions: [
				{
					name: "Standard Poly",
					isDefault: true,
					fibers: [{ name: "Polyester Micro-Fiber", percentage: "100" }],
				},
				{
					name: "Eco-Poly",
					isDefault: false,
					fibers: [{ name: "Recycled Polyester", percentage: "100" }],
				},
				{
					name: "Poly-Flex Woven",
					isDefault: false,
					fibers: [
						{ name: "Polyester", percentage: "90" },
						{ name: "Spandex", percentage: "10" },
					],
				},
				{
					name: "Eco-Poly Flex Woven",
					isDefault: false,
					fibers: [
						{ name: "rPET", percentage: "90" },
						{ name: "Eco-Spandex", percentage: "10" },
					],
				},
				{
					name: "Standard Nylon",
					isDefault: false,
					fibers: [{ name: "Nylon 6", percentage: "100" }],
				},
				{
					name: "Mechanical Poly",
					isDefault: false,
					fibers: [{ name: "Polyester", percentage: "100" }],
				},
			],
		},
	},
];

async function seedFabrics() {
	try {
		const allFibers = await getFiberMap();

		const fabricsToInsert = fabricsData.map((fabric) => {
			// Map fibers in compositions
			const mappedCompositions = fabric.properties.compositions.map((comp) => ({
				...comp,
				fibers: comp.fibers.map((f) => ({
					fiberId: findFiberId(allFibers, f.name),
					percentage: f.percentage,
				})),
			}));

			return {
				name: fabric.name,
				description: fabric.description,
				weight: fabric.weight,
				sport: fabric.sport,
				marketSegment: fabric.marketSegment,
				seasonality: fabric.seasonality,
				fabricType: fabric.fabricType,
				sustainabilityScore: parseInt(fabric.properties.sustainabilityScore),
				isActive: fabric.isActive,
				properties: {
					...fabric.properties,
					compositions: mappedCompositions,
				},
			};
		});

		const inserted = await db
			.insert(fabrics)
			.values(fabricsToInsert)
			.returning();
		inserted.forEach((f) => {});
		process.exit(0);
	} catch (error) {
		process.exit(1);
	}
}

await seedFabrics();
