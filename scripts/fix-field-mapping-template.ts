import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";
import { eq } from "drizzle-orm";

// Fabric data (abbreviated for brevity - same as before)
const fabricsData = [
  {
    name: "RunTech™ Aero-Mesh 145",
    weight: "145",
    sport: "Soccer",
    marketSegment: "Professional Teamwear",
    seasonality: "Summer",
    description:
      'This is not your standard generic mesh; it is the engine of modern match-day performance. Engineered with a proprietary "Micro-Diamond" knit structure, it maximizes aerodynamic airflow while maintaining the high opacity required by pro leagues.',
    isActive: true,
    fabricType: "Micro-Eyelet Knit",
    // ROOT LEVEL (not in properties)
    weave: "Warp Knit (Tricot)",
    finish: "Hydrophilic Wicking Agent, Anti-Static",
    keyApplications: ["Match Jerseys", "Training Bibs", "Basketball Singlets"],
    weaveTypes: ["Micro-Pique Eyelet"],
    finishTreatments: ["Hydrophilic Wicking Agent", "Anti-Static"],
    stretchPercentage: "20-40%",
    stretchDirection: ["2-Way"],
    breathability: "Excellent",
    moistureManagement: "Excellent",
    enhancedMoistureManagement: "Instant",
    wickingRate: "< 2 seconds",
    dryingTime: "< 30 mins",
    airPermeability: "300 l/m²/s",
    waterColumn: "0",
    yarnCountConstruction: "75D/72F Micro-Filament",
    colorfastness: "Grade 5",
    tensileStrength: "High",
    tearStrength: "15 N",
    abrasionResistance: "25,000",
    pillingGrade: "4",
    shrinkageTolerancePercentage: "2",
    washTemperature: "40",
    sustainabilityScore: "85",
    certificationTags: ["Recycled Content", "Harmful Chemical Free"],
    endOfLifeOptions: ["Recyclable"],
    recyclabilityNotes:
      "As a mono-material polyester (PET), this fabric is a prime candidate for circular recycling.",
    useCases: ["Team Wear", "Professional Sports"],
    washCareInstructions: {
      instructions: "Machine wash inside out to protect prints. Do not use fabric softeners.",
      careSymbols: [],
      restrictions: [],
    },
    compositions: [
      { name: "Standard Poly", isDefault: true, fibers: [{ fiberId: 35, percentage: "100" }] },
      { name: "Eco-Poly", isDefault: false, fibers: [{ fiberId: 34, percentage: "100" }] },
      {
        name: "Poly-Flex",
        isDefault: false,
        fibers: [
          { fiberId: 35, percentage: "95" },
          { fiberId: 39, percentage: "5" },
        ],
      },
    ],
  },
  // Add other 7 fabrics here (keeping it concise for script example)
];

// FIBER MAP (same as before)
// const FIBER_MAP: Record<string, number> = {
//   Polyester: 35,
//   "Recycled Polyester": 34,
//   Elastane: 39,
//   "Eco-Elastane": 40,
//   Nylon: 41,
//   Cotton: 37,
//   "Organic Cotton": 38,
//   // ... etc
// };

async function fixFieldMapping() {
  try {
    console.log("🔧 Fixing field mapping to match frontend expectations...\n");

    for (const data of fabricsData) {
      console.log(`Processing ${data.name}...`);

      // Build the update object with fields at ROOT level (matching apiData structure)
      const updateData: any = {
        weight: data.weight,
        sport: data.sport,
        marketSegment: data.marketSegment,
        seasonality: data.seasonality,
        description: data.description,
        fabricType: data.fabricType,

        // These are at ROOT level, not in properties!
        weave: data.weave,
        finish: data.finish,
        keyApplications: data.keyApplications,
        weaveTypes: data.weaveTypes,
        finishTreatments: data.finishTreatments,
        stretchPercentage: data.stretchPercentage,
        stretchDirection: data.stretchDirection,
        breathability: data.breathability,
        moistureManagement: data.moistureManagement,
        enhancedMoistureManagement: data.enhancedMoistureManagement,
        wickingRate: data.wickingRate,
        dryingTime: data.dryingTime,
        airPermeability: data.airPermeability,
        waterColumn: data.waterColumn,
        yarnCountConstruction: data.yarnCountConstruction,
        colorfastness: data.colorfastness,
        tensileStrength: data.tensileStrength,
        tearStrength: data.tearStrength,
        abrasionResistance: data.abrasionResistance,
        pillingGrade: data.pillingGrade,
        shrinkageTolerancePercentage: data.shrinkageTolerancePercentage,
        washTemperature: data.washTemperature,
        sustainabilityScore: data.sustainabilityScore,
        certificationTags: data.certificationTags,
        endOfLifeOptions: data.endOfLifeOptions,
        recyclabilityNotes: data.recyclabilityNotes,
        useCases: data.useCases,
        washCareInstructions: data.washCareInstructions,
        compositions: data.compositions,
        updatedAt: new Date(),
      };

      await db.update(fabrics).set(updateData).where(eq(fabrics.name, data.name));

      console.log(`  ✅ Fixed ${data.name}`);
    }

    console.log("\n🎉 All fabrics fixed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixFieldMapping();
