// Direct PostgreSQL Population - Bypass storage issues
// Creates all 47 business items directly in PostgreSQL

import type { Express } from "express";
import { accessories, categories, certificates, fabrics, fibers } from "../../../shared/schema.js";
import { db } from "../../db.js";
import { logger } from "../../lib/monitoring/logger.js";
import { authService } from "../../services/auth-service.js";

export function registerDirectPostgresPopulationRoutes(app: Express): void {
  // Populate PostgreSQL directly with all business data
  // prettier-ignore
  app.post("/api/direct-postgres/populate-all", authService.requireAdmin, async (_req, res) => {
    try {
      logger.debug("[Direct PostgreSQL] 🚀 Populating all 47 business items directly...");

      const startTime = Date.now();

      // Wrap ALL table inserts in a transaction for atomicity (all-or-nothing)
      const results = await db.transaction(async (tx) => {
        const txResults: any = {
          categories: [],
          fabrics: [],
          fibers: [],
          certificates: [],
          accessories: [],
        };

        // Create 3 Categories
        const categoryData = [
          {
            name: "EVERYDAY RUN",
            slug: "everyday-run",
            description: "Comfortable apparel for daily running activities",
            isActive: true,
            sortOrder: 10,
          },
          {
            name: "RUN AS ONE",
            slug: "run-as-one",
            description: "Team-focused running gear and apparel",
            isActive: true,
            sortOrder: 20,
          },
          {
            name: "ACTIVE RUN",
            slug: "active-run",
            description: "High-performance gear for intensive running",
            isActive: true,
            sortOrder: 30,
          },
        ];

        for (const cat of categoryData) {
          const [created] = await tx.insert(categories).values(cat).returning();
          if (!created) {
            throw new Error("Failed to create category");
          }
          txResults.categories.push(created);
          logger.debug(
            `[Direct PostgreSQL] ✅ Created category: ${created.name} ID: ${created.id}`,
          );
        }

        // Create 6 Fabrics
        const fabricData = [
          {
            name: "Performance Blend",
            description: "High-performance moisture-wicking fabric",
            composition: "60% Polyester, 40% Cotton",
            isActive: true,
          },
          {
            name: "EcoTech Cotton",
            description: "Sustainable organic cotton blend",
            composition: "80% Organic Cotton, 20% Recycled Polyester",
            isActive: true,
          },
          {
            name: "FlexiWeave",
            description: "Ultra-stretch fabric for maximum mobility",
            composition: "70% Nylon, 30% Elastane",
            isActive: true,
          },
          {
            name: "CoolMax Pro",
            description: "Advanced cooling technology fabric",
            composition: "100% CoolMax Polyester",
            isActive: true,
          },
          {
            name: "Merino Performance",
            description: "Natural merino wool performance blend",
            composition: "70% Merino Wool, 30% Synthetic",
            isActive: true,
          },
          {
            name: "Weather Shield",
            description: "Water-resistant outdoor fabric",
            composition: "85% Polyester, 15% DWR Coating",
            isActive: true,
          },
        ];

        for (const fabric of fabricData) {
          const [created] = await tx.insert(fabrics).values(fabric).returning();
          if (!created) {
            throw new Error("Failed to create fabric");
          }
          txResults.fabrics.push(created);
          logger.debug(`[Direct PostgreSQL] ✅ Created fabric: ${created.name} ID: ${created.id}`);
        }

        // Create 11 Fibers
        const fiberData = [
          {
            name: "Organic Cotton",
            type: "Natural",
            sustainabilityScore: 5,
            description: "100% certified organic cotton fiber",
            isActive: true,
          },
          {
            name: "Recycled Polyester",
            type: "Synthetic",
            sustainabilityScore: 4,
            description: "Made from recycled plastic bottles",
            isActive: true,
          },
          {
            name: "Merino Wool",
            type: "Natural",
            sustainabilityScore: 4,
            description: "Ethically sourced merino wool",
            isActive: true,
          },
          {
            name: "Hemp Fiber",
            type: "Natural",
            sustainabilityScore: 5,
            description: "Sustainable hemp-based fiber",
            isActive: true,
          },
          {
            name: "TENCEL™ Lyocell",
            type: "Semi-Synthetic",
            sustainabilityScore: 4,
            description: "Sustainably sourced wood fiber",
            isActive: true,
          },
          {
            name: "Bamboo Viscose",
            type: "Semi-Synthetic",
            sustainabilityScore: 3,
            description: "Bamboo-derived viscose fiber",
            isActive: true,
          },
          {
            name: "Conventional Cotton",
            type: "Natural",
            sustainabilityScore: 2,
            description: "Standard cotton fiber",
            isActive: true,
          },
          {
            name: "Regular Polyester",
            type: "Synthetic",
            sustainabilityScore: 2,
            description: "Standard polyester fiber",
            isActive: true,
          },
          {
            name: "Elastane",
            type: "Synthetic",
            sustainabilityScore: 2,
            description: "Stretch performance fiber",
            isActive: true,
          },
          {
            name: "Nylon 6.6",
            type: "Synthetic",
            sustainabilityScore: 3,
            description: "High-performance nylon fiber",
            isActive: true,
          },
          {
            name: "Modal",
            type: "Semi-Synthetic",
            sustainabilityScore: 3,
            description: "Beech tree-derived fiber",
            isActive: true,
          },
        ];

        for (const fiber of fiberData) {
          const [created] = await tx.insert(fibers).values(fiber).returning();
          if (!created) {
            throw new Error("Failed to create fiber");
          }
          txResults.fibers.push(created);
          logger.debug(
            `[Direct PostgreSQL] ✅ Created fiber: ${created.name} Score: ${created.sustainabilityScore}`,
          );
        }

        // Create 11 Certificates
        const certificateData = [
          {
            name: "GOTS",
            fullName: "Global Organic Textile Standard",
            issuingBody: "Global Organic Textile Standard International",
            description: "Organic textile certification",
            isActive: true,
          },
          {
            name: "OEKO-TEX Standard 100",
            fullName: "OEKO-TEX Standard 100",
            issuingBody: "OEKO-TEX Association",
            description: "Textile safety certification",
            isActive: true,
          },
          {
            name: "Cradle to Cradle",
            fullName: "Cradle to Cradle Certified",
            issuingBody: "Cradle to Cradle Products Innovation Institute",
            description: "Circular economy certification",
            isActive: true,
          },
          {
            name: "GRS",
            fullName: "Global Recycled Standard",
            issuingBody: "Textile Exchange",
            description: "Recycled content verification",
            isActive: true,
          },
          {
            name: "Better Cotton",
            fullName: "Better Cotton Initiative",
            issuingBody: "Better Cotton Initiative",
            description: "Sustainable cotton certification",
            isActive: true,
          },
          {
            name: "Responsible Wool",
            fullName: "Responsible Wool Standard",
            issuingBody: "Textile Exchange",
            description: "Ethical wool certification",
            isActive: true,
          },
          {
            name: "bluesign®",
            fullName: "bluesign® approved",
            issuingBody: "bluesign technologies ag",
            description: "Chemical safety certification",
            isActive: true,
          },
          {
            name: "GREENGUARD",
            fullName: "GREENGUARD Gold",
            issuingBody: "UL Environment",
            description: "Low chemical emissions",
            isActive: true,
          },
          {
            name: "Fair Trade",
            fullName: "Fair Trade Certified",
            issuingBody: "Fair Trade USA",
            description: "Fair labor practices certification",
            isActive: true,
          },
          {
            name: "ISO 14001",
            fullName: "ISO 14001 Environmental Management",
            issuingBody: "International Organization for Standardization",
            description: "Environmental management system",
            isActive: true,
          },
          {
            name: "SA8000",
            fullName: "Social Accountability 8000",
            issuingBody: "Social Accountability International",
            description: "Social accountability certification",
            isActive: true,
          },
        ];

        for (const cert of certificateData) {
          const [created] = await tx.insert(certificates).values(cert).returning();
          if (!created) {
            throw new Error("Failed to create certificate");
          }
          txResults.certificates.push(created);
          logger.debug(`[Direct PostgreSQL] ✅ Created certificate: ${created.name}`);
        }

        // Create 16 Accessories
        const accessoryData = [
          {
            name: "Performance Running Socks",
            description:
              "Moisture-wicking running socks - Cushioned heel/toe, seamless construction, arch support",
            isActive: true,
          },
          {
            name: "Reflective Running Vest",
            description:
              "High-visibility safety vest - 360° reflectivity, lightweight mesh, adjustable fit",
            isActive: true,
          },
          {
            name: "GPS Sports Watch",
            description:
              "Advanced running tracking device - GPS, heart rate monitor, 20-hour battery, waterproof",
            isActive: true,
          },
          {
            name: "Hydration Belt",
            description:
              "Multi-bottle hydration system - 4 x 8oz bottles, adjustable belt, bounce-free design",
            isActive: true,
          },
          {
            name: "Compression Arm Sleeves",
            description:
              "Performance arm compression - Graduated compression, UV protection, moisture-wicking",
            isActive: true,
          },
          {
            name: "Running Headband",
            description:
              "Sweat-absorbing headband - Non-slip grip, quick-dry fabric, one size fits all",
            isActive: true,
          },
          {
            name: "LED Safety Light",
            description:
              "Rechargeable safety light - USB rechargeable, 3 light modes, water-resistant",
            isActive: true,
          },
          {
            name: "Insulated Water Bottle",
            description:
              "Temperature-controlled hydration - 24oz capacity, double-wall vacuum, 24hr cold retention",
            isActive: true,
          },
          {
            name: "Running Gloves",
            description:
              "Lightweight performance gloves - Touchscreen compatible, reflective details, breathable palm",
            isActive: true,
          },
          {
            name: "Heart Rate Monitor",
            description:
              "Chest strap heart rate sensor - Bluetooth/ANT+ connectivity, soft textile strap, real-time data",
            isActive: true,
          },
          {
            name: "Running Hat",
            description:
              "Technical running cap - UPF 50+ sun protection, mesh panels, adjustable fit",
            isActive: true,
          },
          {
            name: "Calf Compression Sleeves",
            description:
              "Lower leg compression support - Graduated compression, shin splint relief, moisture management",
            isActive: true,
          },
          {
            name: "Phone Armband",
            description:
              'Secure phone carrier - Fits 6.5" phones, sweat-resistant, easy access design',
            isActive: true,
          },
          {
            name: "Recovery Foam Roller",
            description: 'Muscle recovery tool - High-density foam, textured surface, 18" length',
            isActive: true,
          },
          {
            name: "Running Belt",
            description:
              "Minimalist storage solution - Expandable pocket, bounce-free, fits phones/keys/gels",
            isActive: true,
          },
          {
            name: "Cooling Towel",
            description:
              "Instant cooling relief - Microfiber construction, activated by water, reusable",
            isActive: true,
          },
        ];

        for (const accessory of accessoryData) {
          const [created] = await tx.insert(accessories).values(accessory).returning();
          if (!created) {
            throw new Error("Failed to create accessory");
          }
          txResults.accessories.push(created);
          logger.debug(`[Direct PostgreSQL] ✅ Created accessory: ${created.name}`);
        }

        return txResults;
      });

      const duration = Date.now() - startTime;
      const totalCreated =
        results.categories.length +
        results.fabrics.length +
        results.fibers.length +
        results.certificates.length +
        results.accessories.length;

      logger.debug(
        `[Transaction] Direct PostgreSQL population completed in ${duration}ms (${totalCreated} items across 5 tables)`,
      );
      logger.debug(
        `[Direct PostgreSQL] 🎉 Successfully populated PostgreSQL with ${totalCreated} business items`,
      );

      res.json({
        success: true,
        message: `Successfully populated PostgreSQL with ${totalCreated} business items`,
        data: {
          summary: {
            categories: results.categories.length,
            fabrics: results.fabrics.length,
            fibers: results.fibers.length,
            certificates: results.certificates.length,
            accessories: results.accessories.length,
            total: totalCreated,
          },
          details: results,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("[Direct PostgreSQL] ❌ Failed to populate PostgreSQL:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.debug("[Direct PostgreSQL] ✅ Direct PostgreSQL population routes registered");
}
