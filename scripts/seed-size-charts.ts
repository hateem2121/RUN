import { db } from "../server/db.js";
import { sizeCharts } from "../shared/schema.js";

async function seedSizeCharts() {
  try {
    const newCharts = [
      {
        name: "Women's Sculpt & Stride Legging - US Standard",
        region: "US",
        type: "Apparel",
        description:
          'Engineered for our Active Wear lines. These measurements assume a "Second Skin" fit using high-elastane fabric.',
        measurements: {
          "XS (0-2)": {
            Waist: "61-64",
            Hip: "86-89",
            Inseam: "69",
            Thigh: "50",
          },
          "S (4-6)": {
            Waist: "66-69",
            Hip: "91-94",
            Inseam: "71",
            Thigh: "53",
          },
          "M (8-10)": {
            Waist: "71-74",
            Hip: "96-99",
            Inseam: "71",
            Thigh: "56",
          },
          "L (12-14)": {
            Waist: "77-81",
            Hip: "102-105",
            Inseam: "74",
            Thigh: "60",
          },
          "XL (16-18)": {
            Waist: "86-90",
            Hip: "110-114",
            Inseam: "74",
            Thigh: "65",
          },
        },
        isActive: true,
      },
      {
        name: "Unisex Heavyweight Fleece Hoodie - International",
        region: "INTL",
        type: "Apparel",
        description:
          'A versatile chart for Casual Wear and corporate programs. We utilize "Linear Grading" here to accommodate taller athletes in larger sizes without the garment becoming boxy.',
        measurements: {
          XS: { Chest: "90", Length: "66", Sleeve: "62", Shoulder: "40" },
          S: { Chest: "96", Length: "68", Sleeve: "63", Shoulder: "43" },
          M: { Chest: "102", Length: "70", Sleeve: "64", Shoulder: "46" },
          L: { Chest: "108", Length: "72", Sleeve: "65", Shoulder: "49" },
          XL: { Chest: "114", Length: "74", Sleeve: "66", Shoulder: "52" },
          "2XL": { Chest: "120", Length: "76", Sleeve: "67", Shoulder: "55" },
        },
        isActive: true,
      },
      {
        name: "Pro-Grip Glove Sizing",
        region: "INTL",
        type: "Accessories",
        description:
          "Precision sizing for our high-performance Sports Accessories. Glove fit is critical for ball control.",
        measurements: {
          "7 (Youth)": { "Hand Width": "8", "Hand Length": "17" },
          "8 (Adult S)": { "Hand Width": "9", "Hand Length": "18" },
          "9 (Adult M)": { "Hand Width": "10", "Hand Length": "19" },
          "10 (Adult L)": { "Hand Width": "11", "Hand Length": "20" },
          "11 (Adult XL)": { "Hand Width": "12", "Hand Length": "21" },
        },
        isActive: true,
      },
    ];

    const inserted = await db.insert(sizeCharts).values(newCharts).returning();
    inserted.forEach((chart) => {});
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

await seedSizeCharts();
