// @ts-nocheck

import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

async function check() {
  try {
    const _result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'manufacturing_hero';
    `);
    const _processes = await db.execute(
      sql`select id, name, icon_name, efficiency from manufacturing_processes limit 5`,
    );
    const _products = await db.execute(
      sql`SELECT id, name, sku, slug, url_path FROM products LIMIT 5`,
    );

    process.exit(0);
  } catch (_e) {
    process.exit(1);
  }
}
check();
