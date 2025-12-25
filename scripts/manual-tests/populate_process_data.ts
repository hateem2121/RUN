// @ts-nocheck

import { sql } from "drizzle-orm";
import { db } from "../../server/db.js";

async function populateData() {
  try {
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
    process.exit(0);
  } catch (e) {
    process.exit(1);
  }
}
populateData();
