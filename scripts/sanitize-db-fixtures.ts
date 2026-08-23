/**
 * Database Seed & Fixture Sanitization Script for RUN APPAREL
 * Cleans all TEST-UI-SYNC-* and [QA-AUTO-*] test artifacts from the database
 * and ensures real B2B manufacturing copy is present across all heroes.
 *
 * Usage:
 *   npx tsx scripts/sanitize-db-fixtures.ts --dry-run
 *   npx tsx scripts/sanitize-db-fixtures.ts --apply
 */

import "dotenv/config";
import {
  aboutHero,
  homepageHero,
  manufacturingHero,
  products,
  sustainabilityHero,
  sustainabilityMetrics,
  technologyHero,
} from "@run-remix/shared";
import { eq, like, or } from "drizzle-orm";
import { closeDatabaseConnection, db } from "../server/db.js";

const isDryRun = !process.argv.includes("--apply");

async function sanitize() {
  console.log(
    `🧹 [DB Sanitizer] Starting database sanitization (${isDryRun ? "DRY RUN" : "APPLY MODE"})...`,
  );

  try {
    // 1. Check & Sanitize Homepage Hero
    const hpRows = await db.select().from(homepageHero);
    for (const row of hpRows) {
      if (
        row.title?.includes("TEST-") ||
        row.title?.includes("QA-AUTO") ||
        row.title?.includes("E2E-") ||
        row.title?.includes("Next-Generation") ||
        row.title !== "ENGINEERING HIGH-PERFORMANCE ATHLETIC APPAREL"
      ) {
        console.log(
          `[Homepage Hero] ID ${row.id}: "${row.title}" -> "ENGINEERING HIGH-PERFORMANCE ATHLETIC APPAREL"`,
        );
        if (!isDryRun) {
          await db
            .update(homepageHero)
            .set({
              title: "ENGINEERING HIGH-PERFORMANCE ATHLETIC APPAREL",
              subtitle:
                "Sustainable, high-performance, ethically manufactured sportswear engineered with biomechanical precision since 1889.",
              ctaText: "EXPLORE OUR CAPABILITIES",
              isActive: true,
            })
            .where(eq(homepageHero.id, row.id));
        }
      }
    }

    // 2. Check & Sanitize About Hero
    const aboutRows = await db.select().from(aboutHero);
    console.log(
      `[About Hero] Fetched ${aboutRows.length} rows:`,
      aboutRows.map((r) => ({ id: r.id, title: r.title, isActive: r.isActive })),
    );
    for (const row of aboutRows) {
      if (
        row.title?.includes("TEST-") ||
        row.title?.includes("QA-AUTO") ||
        row.title?.includes("E2E-") ||
        row.description?.includes("Faisalabad")
      ) {
        console.log(
          `[About Hero] ID ${row.id}: "${row.title}" -> updating to verified Sialkot HQ copy`,
        );
        if (!isDryRun) {
          await db
            .update(aboutHero)
            .set({
              title: "A Legacy of Excellence in Apparel Engineering",
              subtitle:
                "From heritage craftsmanship to modern innovation, we define the future of B2B sportswear.",
              description:
                "Based in Sialkot, Pakistan, RUN APPAREL (PVT) LTD (a division of Durus Industries, est. 1889) operates state-of-the-art manufacturing facilities powered by 80% solar energy, delivering 100,000+ units monthly to global athletic brands.",
              isActive: true,
            })
            .where(eq(aboutHero.id, row.id));
        }
      }
    }

    // 3. Check & Sanitize Manufacturing Hero
    const mfgRows = await db.select().from(manufacturingHero);
    for (const row of mfgRows) {
      if (
        row.headline?.includes("TEST-") ||
        row.headline?.includes("QA-AUTO") ||
        row.headline?.includes("E2E-") ||
        row.headline !== "PRECISION AT SCALE"
      ) {
        console.log(`[Manufacturing Hero] ID ${row.id}: "${row.headline}" -> "PRECISION AT SCALE"`);
        if (!isDryRun) {
          await db
            .update(manufacturingHero)
            .set({
              headline: "PRECISION AT SCALE",
              subheadline:
                "End-to-end technical apparel manufacturing backed by 135+ years of craftsmanship.",
              isActive: true,
            })
            .where(eq(manufacturingHero.id, row.id));
        }
      }
    }

    // 4. Check & Sanitize Technology Hero
    const techRows = await db.select().from(technologyHero);
    for (const row of techRows) {
      if (
        row.title?.includes("TEST-") ||
        row.title?.includes("QA-AUTO") ||
        row.title?.includes("E2E-") ||
        row.title !== "NEXT-GEN FIBER INTELLIGENCE"
      ) {
        console.log(
          `[Technology Hero] ID ${row.id}: "${row.title}" -> "NEXT-GEN FIBER INTELLIGENCE"`,
        );
        if (!isDryRun) {
          await db
            .update(technologyHero)
            .set({
              title: "NEXT-GEN FIBER INTELLIGENCE",
              subtitle: "Advanced R&D and automated precision sportswear manufacturing.",
              isActive: true,
            })
            .where(eq(technologyHero.id, row.id));
        }
      }
    }

    // 5. Check & Sanitize Sustainability Hero
    const sustRows = await db.select().from(sustainabilityHero);
    for (const row of sustRows) {
      if (
        row.title?.includes("TEST-") ||
        row.title?.includes("QA-AUTO") ||
        row.title?.includes("E2E-") ||
        row.title !== "GREEN MANUFACTURING EVOLUTION"
      ) {
        console.log(
          `[Sustainability Hero] ID ${row.id}: "${row.title}" -> "GREEN MANUFACTURING EVOLUTION"`,
        );
        if (!isDryRun) {
          await db
            .update(sustainabilityHero)
            .set({
              title: "GREEN MANUFACTURING EVOLUTION",
              subtitle:
                "Pioneering the future of eco-conscious sportswear manufacturing with zero-waste processes and 80% solar renewable energy.",
              isActive: true,
            })
            .where(eq(sustainabilityHero.id, row.id));
        }
      }
    }

    // 6. Check & Sanitize Sustainability Metrics
    const metricsRows = await db.select().from(sustainabilityMetrics);
    for (const row of metricsRows) {
      if (row.metricValue === "0" || row.metricValue === 0) {
        let updatedVal = "100";
        if (row.metricKey?.includes("water")) updatedVal = "250,000";
        else if (row.metricKey?.includes("co2") || row.metricKey?.includes("carbon"))
          updatedVal = "120";
        else if (row.metricKey?.includes("recycled") || row.metricKey?.includes("material"))
          updatedVal = "45";
        else if (row.metricKey?.includes("solar") || row.metricKey?.includes("energy"))
          updatedVal = "80";

        console.log(
          `[Sustainability Metric] ${row.metricKey}: "${row.metricValue}" -> "${updatedVal}"`,
        );
        if (!isDryRun) {
          await db
            .update(sustainabilityMetrics)
            .set({ metricValue: updatedVal })
            .where(eq(sustainabilityMetrics.id, row.id));
        }
      }
    }

    // 7. Check & Sanitize Products
    const dirtyProducts = await db
      .select()
      .from(products)
      .where(
        or(
          like(products.name, "%TEST-%"),
          like(products.name, "%QA-AUTO%"),
          like(products.name, "%E2E-%"),
        ),
      );

    for (const prod of dirtyProducts) {
      if (prod.name.startsWith("TEST-PRODUCT-") || prod.name.startsWith("E2E-PRODUCT-")) {
        console.log(`[Product] ID ${prod.id}: Deleting transient test product "${prod.name}"`);
        if (!isDryRun) {
          await db.delete(products).where(eq(products.id, prod.id));
        }
      } else {
        const cleanName = prod.name
          .replace(/\[QA-AUTO-?\d*\]/g, "")
          .replace(/TEST-UI-SYNC-\d+/g, "")
          .replace(/E2E-[A-Z]+-\d+/g, "")
          .trim();
        console.log(`[Product] ID ${prod.id}: "${prod.name}" -> "${cleanName}"`);
        if (!isDryRun) {
          await db.update(products).set({ name: cleanName }).where(eq(products.id, prod.id));
        }
      }
    }

    console.log(
      `✅ [DB Sanitizer] ${isDryRun ? "Dry run completed. To apply changes, run with --apply" : "All fixtures sanitized successfully."}`,
    );
  } catch (error) {
    console.error("❌ [DB Sanitizer] Error:", error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

if (process.env.NODE_ENV !== "test") {
  sanitize();
}
