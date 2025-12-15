
import { db } from "../server/db.js";
import {
    mediaAssets, products, categories, fabrics, fabricCompositions,
    homepageHero, homepageSections,
    aboutHero,
    manufacturingHero, manufacturingProcesses,
    sustainabilityHero, sustainabilityGoals,
    technologyHero,
    navigationItems, footerConfiguration,
    inquiries, performanceMetrics
} from "../shared/schema.js";
import { eq, sql, and, isNotNull, lte, isNull, notLike, lt } from "drizzle-orm";

// ANSI Colors
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

async function main() {
    console.log(`${colors.bold}${colors.blue}🔍 Starting Comprehensive Data Logic Validation...${colors.reset}\n`);

    let totalErrors = 0;
    let totalWarnings = 0;

    // Helper for logging
    const logPass = (msg: string) => console.log(`${colors.green}   ✅ ${msg}${colors.reset}`);
    const logFail = (msg: string) => {
        console.log(`${colors.red}   ❌ ${msg}${colors.reset}`);
        totalErrors++;
    };
    const logWarn = (msg: string) => {
        console.log(`${colors.yellow}   ⚠️ ${msg}${colors.reset}`);
        totalWarnings++;
    };
    const section = (name: string) => console.log(`\n${colors.bold}📦 ${name}${colors.reset}`);

    try {
        // =========================================================================
        // 1. PRODUCT ECOSYSTEM LOGIC
        // =========================================================================
        section("Product Ecosystem Logic");

        // 1.1 Product Prices - REMOVED (No price field in products table)
        // We can check minimumOrderQuantity instead
        const invalidMOQ = await db.select().from(products).where(lte(products.minimumOrderQuantity, 0));
        if (invalidMOQ.length > 0) {
            logFail(`Found ${invalidMOQ.length} products with invalid MOQ (<= 0)`);
        } else {
            logPass("All products have valid positive MOQ");
        }

        // 1.2 Orphaned Products (No Category)
        const orphanedProducts = await db.select().from(products).where(isNull(products.categoryId));
        if (orphanedProducts.length > 0) {
            logWarn(`Found ${orphanedProducts.length} products without a category (orphaned)`);
        } else {
            logPass("All products are assigned to a category");
        }

        // 1.3 Category Hierarchy (Circular Check - Simple Depth)
        const allCategories = await db.select().from(categories);
        let circularError = false;
        for (const cat of allCategories) {
            if (cat.parentId === cat.id) {
                logFail(`Category ${cat.name} (ID: ${cat.id}) is its own parent`);
                circularError = true;
            }
        }
        if (!circularError) logPass("No immediate circular category dependencies");

        // 1.4 Fabric Composition Logic
        // Check if we have fabrics with no composition defined
        // (This might be valid, but good to know)
        const fabricsWithComp = await db.select({
            fabricId: fabricCompositions.fabricId,
            count: sql<number>`count(*)`
        })
            .from(fabricCompositions)
            .groupBy(fabricCompositions.fabricId);

        const fabricIdsWithComp = new Set(fabricsWithComp.map(f => f.fabricId));
        const allFabrics = await db.select().from(fabrics);
        const fabricsWithoutComp = allFabrics.filter(f => !fabricIdsWithComp.has(f.id));

        if (fabricsWithoutComp.length > 0) {
            logWarn(`${fabricsWithoutComp.length} fabrics have no fiber composition defined`);
        } else {
            logPass("All fabrics have defined fiber compositions");
        }

        // =========================================================================
        // 2. CMS CONTENT INTEGRITY
        // =========================================================================
        section("CMS Content Integrity");

        // 2.1 Homepage
        const hpHero = await db.select().from(homepageHero).limit(1);
        if (hpHero.length === 0) logFail("Homepage Hero is missing");
        else logPass("Homepage Hero exists");

        const hpSections = await db.select().from(homepageSections);
        if (hpSections.length === 0) logWarn("No Homepage Sections defined");
        else logPass(`Homepage has ${hpSections.length} active sections`);

        // 2.2 About Page
        const abtHero = await db.select().from(aboutHero).limit(1);
        if (abtHero.length === 0) logFail("About Page Hero is missing");
        else logPass("About Page Hero exists");

        // 2.3 Manufacturing
        const mfgHero = await db.select().from(manufacturingHero).limit(1);
        if (mfgHero.length === 0) logFail("Manufacturing Hero is missing");
        else logPass("Manufacturing Hero exists");

        const mfgProcs = await db.select().from(manufacturingProcesses);
        if (mfgProcs.length === 0) logWarn("No Manufacturing Processes defined");
        else logPass(`Manufacturing has ${mfgProcs.length} processes defined`);

        // 2.4 Sustainability
        const susHero = await db.select().from(sustainabilityHero).limit(1);
        if (susHero.length === 0) logFail("Sustainability Hero is missing");
        else logPass("Sustainability Hero exists");

        const susGoals = await db.select().from(sustainabilityGoals);
        // Logic check: Target year should be future or current if progress < 100
        const currentYear = new Date().getFullYear();
        const pastGoals = susGoals.filter(g =>
            g.targetYear !== null &&
            g.targetYear < currentYear &&
            (g.currentProgress ? parseFloat(g.currentProgress) < 100 : true)
        );
        if (pastGoals.length > 0) {
            logWarn(`${pastGoals.length} sustainability goals have past target years but are not 100% complete`);
        } else {
            logPass("Sustainability goals logic (year/progress) seems valid");
        }

        // 2.5 Technology
        const techHero = await db.select().from(technologyHero).limit(1);
        if (techHero.length === 0) logFail("Technology Hero is missing");
        else logPass("Technology Hero exists");

        // =========================================================================
        // 3. CONFIGURATION & SYSTEM
        // =========================================================================
        section("Configuration & System");

        // 3.1 Navigation
        const navItems = await db.select().from(navigationItems);
        if (navItems.length === 0) logFail("No Navigation Items defined (Menu is empty)");
        else logPass(`Navigation has ${navItems.length} items`);

        // 3.2 Footer
        const footer = await db.select().from(footerConfiguration).limit(1);
        if (footer.length === 0) logFail("Footer Configuration is missing");
        else logPass("Footer Configuration exists");

        // 3.3 Inquiries (Data Validity)
        const invalidEmails = await db.select().from(inquiries).where(notLike(inquiries.email, '%@%'));
        if (invalidEmails.length > 0) {
            logFail(`Found ${invalidEmails.length} inquiries with invalid email formats`);
        } else {
            logPass("All inquiry emails have valid format");
        }

        // 3.4 Performance Metrics
        const negativeMetrics = await db.select().from(performanceMetrics).where(lt(performanceMetrics.value, "0"));
        if (negativeMetrics.length > 0) {
            logFail(`Found ${negativeMetrics.length} performance metrics with negative values`);
        } else {
            logPass("All performance metrics are non-negative");
        }

        // =========================================================================
        // 4. MEDIA REFERENCE CHECK (Sample)
        // =========================================================================
        section("Media Reference Logic");

        // Check Products -> Media
        const productsMissingMedia = await db.select({ id: products.id, name: products.name })
            .from(products)
            .leftJoin(mediaAssets, eq(products.primaryImageId, mediaAssets.id))
            .where(and(isNotNull(products.primaryImageId), sql`${mediaAssets.id} IS NULL`));

        if (productsMissingMedia.length > 0) {
            logFail(`${productsMissingMedia.length} products reference non-existent media assets`);
        } else {
            logPass("All product media references are valid");
        }

        // Check Categories -> Media
        const catsMissingMedia = await db.select({ id: categories.id, name: categories.name })
            .from(categories)
            .leftJoin(mediaAssets, eq(categories.primaryImageId, mediaAssets.id))
            .where(and(isNotNull(categories.primaryImageId), sql`${mediaAssets.id} IS NULL`));

        if (catsMissingMedia.length > 0) {
            logFail(`${catsMissingMedia.length} categories reference non-existent media assets`);
        } else {
            logPass("All category media references are valid");
        }

        // =========================================================================
        // SUMMARY
        // =========================================================================
        console.log(`\n${colors.bold}📊 Validation Summary${colors.reset}`);
        console.log(`   Errors:   ${totalErrors === 0 ? colors.green : colors.red}${totalErrors}${colors.reset}`);
        console.log(`   Warnings: ${totalWarnings === 0 ? colors.green : colors.yellow}${totalWarnings}${colors.reset}`);

        if (totalErrors > 0) {
            console.log(`\n${colors.red}❌ Validation Failed: Critical issues found.${colors.reset}`);
            process.exit(1);
        } else {
            console.log(`\n${colors.green}✨ Validation Passed: Data logic is sound!${colors.reset}`);
            process.exit(0);
        }

    } catch (error) {
        console.error(`${colors.red}❌ Fatal Error during validation:${colors.reset}`, error);
        process.exit(1);
    }
}

main();
