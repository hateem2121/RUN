// @ts-nocheck
import { db } from "../../server/db.js";
import { sql } from "drizzle-orm";

async function populateData() {
  try {
    console.log("Populating sample data for manufacturing_processes...");

    // Update Fabric Selection & Inspection
    await db.execute(sql`
      UPDATE manufacturing_processes 
      SET icon_name = 'Search', efficiency = 95 
      WHERE name = 'Fabric Selection & Inspection';
    `);

    // Update Pattern Making & Cutting
    await db.execute(sql`
      UPDATE manufacturing_processes 
      SET icon_name = 'Scissors', efficiency = 98 
      WHERE name = 'Pattern Making & Cutting';
    `);

    // Update Assembly & Sewing
    await db.execute(sql`
      UPDATE manufacturing_processes 
      SET icon_name = 'Factory', efficiency = 92 
      WHERE name = 'Assembly & Sewing';
    `);

    // Update Quality Control
    await db.execute(sql`
      UPDATE manufacturing_processes 
      SET icon_name = 'CheckCircle2', efficiency = 99 
      WHERE name = 'Quality Control';
    `);

    // Update Finishing & Packaging
    await db.execute(sql`
      UPDATE manufacturing_processes 
      SET icon_name = 'Package', efficiency = 96 
      WHERE name = 'Finishing & Packaging';
    `);

    console.log("Sample data populated successfully.");
    process.exit(0);
  } catch (e) {
    console.error("Failed to populate data:", e);
    process.exit(1);
  }
}
populateData();
