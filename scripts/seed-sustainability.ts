import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import {
  sustainabilityGoals,
  sustainabilityInitiatives,
  sustainabilityMetrics,
} from "../shared/schemas/content/sustainability.js";

async function seed() {
  try {
    const metricsData = [
      {
        name: "Recycled Polyester",
        value: "100",
        unit: "%",
        description: "Of our polyester is sourced from recycled plastic bottles.",
        iconName: "Recycle",
        sortOrder: 1,
      },
      {
        name: "Carbon Reduction",
        value: "40",
        unit: "%",
        description: "Reduction in greenhouse gas emissions since 2020.",
        iconName: "CloudRain",
        sortOrder: 2,
      },
      {
        name: "Water Saved",
        value: "60",
        unit: "%",
        description: "Reduction in water usage through closed-loop systems.",
        iconName: "Droplets",
        sortOrder: 3,
      },
    ];

    for (const data of metricsData) {
      const existing = await db
        .select()
        .from(sustainabilityMetrics)
        .where(eq(sustainabilityMetrics.name, data.name));
      if (existing.length === 0) {
        await db.insert(sustainabilityMetrics).values(data);
      }
    }
    const initiativesData = [
      {
        title: "Zero Waste Packaging",
        description:
          "We are committed to eliminating single-use plastics from our shipping process.",
        impact: "Saved 50 tons of plastic in 2025.",
        iconName: "Package",
        sortOrder: 1,
      },
      {
        title: "Solar Powered Factories",
        description:
          "Our primary manufacturing facilities are now powered by 100% renewable solar energy.",
        impact: "Offset 1.2M tons of CO2 annually.",
        iconName: "Sun",
        sortOrder: 2,
      },
    ];

    for (const data of initiativesData) {
      const existing = await db
        .select()
        .from(sustainabilityInitiatives)
        .where(eq(sustainabilityInitiatives.title, data.title));
      if (existing.length === 0) {
        await db.insert(sustainabilityInitiatives).values(data);
      }
    }
    const goalsData = [
      {
        title: "100% Sustainable Materials",
        description:
          "Transition all core materials to recycled, organic, or regenerative sources by 2030.",
        target: "100% by 2030",
        currentProgress: "75.00",
        targetYear: 2030,
        sortOrder: 1,
      },
      {
        title: "Net Zero Emissions",
        description:
          "Achieve carbon neutrality across our entire supply chain through reduction and offsets.",
        target: "Net Zero by 2040",
        currentProgress: "45.00",
        targetYear: 2040,
        sortOrder: 2,
      },
    ];

    for (const data of goalsData) {
      const existing = await db
        .select()
        .from(sustainabilityGoals)
        .where(eq(sustainabilityGoals.title, data.title));
      if (existing.length === 0) {
        await db.insert(sustainabilityGoals).values(data);
      }
    }
  } catch (_error) {
    process.exit(1);
  }
}

seed();
