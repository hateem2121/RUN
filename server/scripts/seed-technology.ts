import { technologyEquipment, technologyResearch } from "../../shared/schemas/content/technology.js";
import { db } from "../db.js";

async function seedTechnologyData() {
  try {
    // 1. Seed Equipment
    const existingEquipment = await db.select().from(technologyEquipment).limit(1);

    if (existingEquipment.length === 0) {
      await db.insert(technologyEquipment).values([
        {
          name: "Automatic Cutting Machine",
          manufacturer: "Lectra",
          model: "VectorFashion iX",
          category: "Cutting",
          quantity: 2,
          capacity: "500 units/hour",
          description:
            "High-precision automated fabric cutting system for minimizing waste and ensuring consistent sizing.",
          specifications: { speed: "100m/min", max_thickness: "2.5cm" },
          isActive: true,
          sortOrder: 1,
        },
        {
          name: "Seamless Knitting Machine",
          manufacturer: "Santoni",
          model: "SM8-TOP2V",
          category: "Knitting",
          quantity: 5,
          capacity: "Continuous",
          description:
            "Circular knitting machine for seamless garment construction, reducing friction points for athletes.",
          specifications: { gauge: "28G", diameter: "14 inches" },
          isActive: true,
          sortOrder: 2,
        },
        {
          name: "Eco-Dyeing Chamber",
          manufacturer: "Thies",
          model: "iMaster H2O",
          category: "Dyeing",
          quantity: 1,
          capacity: "2000L",
          description:
            "Ultra-low liquor ratio dyeing machine reducing water consumption by up to 50%.",
          specifications: { liquor_ratio: "1:3.5", temp_max: "140C" },
          isActive: true,
          sortOrder: 3,
        },
      ]);
    } else {
    }

    // 2. Seed Research
    const existingResearch = await db.select().from(technologyResearch).limit(1);

    if (existingResearch.length === 0) {
      await db.insert(technologyResearch).values([
        {
          title: "Biodegradable Elastane Replacement",
          description:
            "Developing a fully compostable alternative to spandex/elastane without compromising stretch and recovery performance.",
          researchArea: "Materials Science",
          status: "Ongoing",
          startDate: new Date("2025-01-15"),
          expectedCompletion: new Date("2027-06-30"),
          objectives: [
            "Match spandex elongation",
            "Ensure home compostability",
            "Scale production costs",
          ],
          partners: ["University of Textiles", "EcoPolymers Inc"],
          isActive: true,
          sortOrder: 1,
        },
        {
          title: "Sweat-Responsive Vents",
          description:
            "Smart fabric technology that physically opens micropores when humidity rises to increase breathability instantly.",
          researchArea: "Smart Textiles",
          status: "Prototype",
          startDate: new Date("2024-11-01"),
          expectedCompletion: new Date("2026-03-01"),
          objectives: ["Passive activation", "Wash durability testing", "Consumer trials"],
          isActive: true,
          sortOrder: 2,
        },
        {
          title: "Closed-Loop Polyester Recycling",
          description:
            "Chemical recycling process to separate polyester from mixed blends, enabling true circularity for complex garments.",
          researchArea: "Sustainability",
          status: "Phase 2",
          startDate: new Date("2023-09-01"),
          expectedCompletion: new Date("2025-12-31"),
          objectives: ["99% purity recovery", "Energy efficient catalysis"],
          isActive: true,
          sortOrder: 3,
        },
      ]);
    } else {
    }
    process.exit(0);
  } catch (_error) {
    process.exit(1);
  }
}

seedTechnologyData();
