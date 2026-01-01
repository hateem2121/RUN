import { db } from "../server/db.js";
import { fibers } from "../shared/schema.js";

async function addMissingFibers() {
  try {
    const newFibers = [
      {
        name: "Merino Wool",
        type: "Natural",
        description:
          "High-performance natural wool fiber known for temperature regulation and odor resistance.",
        sustainabilityScore: 5,
        environmentalImpact: "Renewable and biodegradable.",
        properties: {},
        isActive: true,
      },
    ];

    const inserted = await db.insert(fibers).values(newFibers).returning();
    inserted.forEach((_f) => {});

    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

addMissingFibers();
