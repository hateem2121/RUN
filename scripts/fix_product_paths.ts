// @ts-nocheck

import { sql } from "drizzle-orm";
import { db } from "../server/db.js";

async function fixProductPaths() {
	try {
		// 1. Get all products and their categories
		const productsResult = await db.execute(sql`
      SELECT p.id, p.name, p.slug, p.category_id, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `);

		let updatedCount = 0;
		const errors: any[] = [];

		// 2. Iterate and update
		for (const product of productsResult.rows) {
			if (!product.category_slug) {
				continue;
			}

			// Construct the functionality correct path
			const expectedPath = `/categories/${product.category_slug}/${product.slug}`;

			try {
				await db.execute(sql`
          UPDATE products 
          SET "url_path" = ${expectedPath}
          WHERE id = ${product.id} AND ("url_path" IS NULL OR "url_path" != ${expectedPath})
        `);
				updatedCount++;
			} catch (err) {
				errors.push({ id: product.id, error: err });
			}
		}

		process.exit(0);
	} catch (error) {
		process.exit(1);
	}
}

fixProductPaths();
