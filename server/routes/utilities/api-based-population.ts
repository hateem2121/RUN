// API-Based Population - Use existing endpoints to create data
// Creates all 47 business items using working API endpoints

import type { Express } from "express";
import { logger } from "../../lib/monitoring/logger.js";

import { authService } from "../../services/auth-service.js";

export function registerAPIBasedPopulationRoutes(app: Express): void {
  // Populate all data using existing API endpoints
  // prettier-ignore
  app.post("/api/api-based/populate-all", authService.requireAdmin, async (_req, res) => {
    try {
      logger.debug("[API Population] 🚀 Creating all 47 business items via APIs...");

      interface PopulationResults {
        categories: unknown[];
        fabrics: unknown[];
        fibers: unknown[];
        certificates: unknown[];
        accessories: unknown[];
      }

      const results: PopulationResults = {
        categories: [],
        fabrics: [],
        fibers: [],
        certificates: [],
        accessories: [],
      };

      // Helper function to make internal API calls
      const makeInternalAPICall = async (
        method: string,
        endpoint: string,
        data?: unknown,
      ): Promise<unknown> => {
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          method,
          headers: { "Content-Type": "application/json" },
          ...(data ? { body: JSON.stringify(data) } : {}),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `API call failed: ${method} ${endpoint} - ${response.status} ${errorText}`,
          );
        }
        return response.json();
      };

      // Create 3 Categories using API
      const categoryData = [
        {
          name: "EVERYDAY RUN",
          slug: "everyday-run",
          description: "Comfortable apparel for daily running activities",
          isActive: true,
        },
        {
          name: "RUN AS ONE",
          slug: "run-as-one",
          description: "Team-focused running gear and apparel",
          isActive: true,
        },
        {
          name: "ACTIVE RUN",
          slug: "active-run",
          description: "High-performance gear for intensive running",
          isActive: true,
        },
      ];

      for (const cat of categoryData) {
        try {
          const created = (await makeInternalAPICall("POST", "/api/categories", cat)) as {
            name: string;
          };
          results.categories.push(created);
          logger.debug("[API Population] ✅ Created category:", created.name);
        } catch (error) {
          logger.error(
            "[API Population] ❌ Failed to create category:",
            cat.name,
            error instanceof Error ? error : undefined,
          );
        }
      }

      // Create 6 Fabrics using API
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
        try {
          const created = (await makeInternalAPICall("POST", "/api/fabrics", fabric)) as {
            name: string;
          };
          results.fabrics.push(created);
          logger.debug("[API Population] ✅ Created fabric:", created.name);
        } catch (error) {
          logger.error(
            "[API Population] ❌ Failed to create fabric:",
            fabric.name,
            error instanceof Error ? error : undefined,
          );
        }
      }

      // Create 11 Fibers using API
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
        try {
          const created = (await makeInternalAPICall("POST", "/api/fibers", fiber)) as {
            name: string;
            sustainabilityScore: number;
          };
          results.fibers.push(created);
          logger.debug(
            `[API Population] ✅ Created fiber: ${created.name} Score: ${created.sustainabilityScore}`,
          );
        } catch (error) {
          logger.error(
            "[API Population] ❌ Failed to create fiber:",
            fiber.name,
            error instanceof Error ? error : undefined,
          );
        }
      }

      // Create 11 Certificates using API
      const certificateData = [
        {
          name: "GOTS",
          fullName: "Global Organic Textile Standard",
          issuingOrganization: "Global Organic Textile Standard International",
          description: "Organic textile certification",
          isActive: true,
        },
        {
          name: "OEKO-TEX Standard 100",
          fullName: "OEKO-TEX Standard 100",
          issuingOrganization: "OEKO-TEX Association",
          description: "Textile safety certification",
          isActive: true,
        },
        {
          name: "Cradle to Cradle",
          fullName: "Cradle to Cradle Certified",
          issuingOrganization: "Cradle to Cradle Products Innovation Institute",
          description: "Circular economy certification",
          isActive: true,
        },
        {
          name: "GRS",
          fullName: "Global Recycled Standard",
          issuingOrganization: "Textile Exchange",
          description: "Recycled content verification",
          isActive: true,
        },
        {
          name: "Better Cotton",
          fullName: "Better Cotton Initiative",
          issuingOrganization: "Better Cotton Initiative",
          description: "Sustainable cotton certification",
          isActive: true,
        },
        {
          name: "Responsible Wool",
          fullName: "Responsible Wool Standard",
          issuingOrganization: "Textile Exchange",
          description: "Ethical wool certification",
          isActive: true,
        },
        {
          name: "bluesign®",
          fullName: "bluesign® approved",
          issuingOrganization: "bluesign technologies ag",
          description: "Chemical safety certification",
          isActive: true,
        },
        {
          name: "GREENGUARD",
          fullName: "GREENGUARD Gold",
          issuingOrganization: "UL Environment",
          description: "Low chemical emissions",
          isActive: true,
        },
        {
          name: "Fair Trade",
          fullName: "Fair Trade Certified",
          issuingOrganization: "Fair Trade USA",
          description: "Fair labor practices certification",
          isActive: true,
        },
        {
          name: "ISO 14001",
          fullName: "ISO 14001 Environmental Management",
          issuingOrganization: "International Organization for Standardization",
          description: "Environmental management system",
          isActive: true,
        },
        {
          name: "SA8000",
          fullName: "Social Accountability 8000",
          issuingOrganization: "Social Accountability International",
          description: "Social accountability certification",
          isActive: true,
        },
      ];

      for (const cert of certificateData) {
        try {
          const created = (await makeInternalAPICall("POST", "/api/certificates", cert)) as {
            name: string;
          };
          results.certificates.push(created);
          logger.debug("[API Population] ✅ Created certificate:", created.name);
        } catch (error) {
          logger.error(
            "[API Population] ❌ Failed to create certificate:",
            cert.name,
            error instanceof Error ? error : undefined,
          );
        }
      }

      // Create 16 Accessories using API
      const accessoryData = [
        {
          name: "Performance Running Socks",
          description: "Moisture-wicking running socks",
          category: "Footwear",
          material: "Synthetic Blend",
          isActive: true,
        },
        {
          name: "Reflective Running Vest",
          description: "High-visibility safety vest",
          category: "Safety",
          material: "Mesh Polyester",
          isActive: true,
        },
        {
          name: "GPS Sports Watch",
          description: "Advanced running tracking device",
          category: "Technology",
          material: "Silicone/Plastic",
          isActive: true,
        },
        {
          name: "Hydration Belt",
          description: "Multi-bottle hydration system",
          category: "Hydration",
          material: "Nylon",
          isActive: true,
        },
        {
          name: "Compression Arm Sleeves",
          description: "Performance arm compression",
          category: "Compression",
          material: "Elastane Blend",
          isActive: true,
        },
        {
          name: "Running Headband",
          description: "Sweat-absorbing headband",
          category: "Headwear",
          material: "Moisture-wicking Fabric",
          isActive: true,
        },
        {
          name: "LED Safety Light",
          description: "Rechargeable safety light",
          category: "Safety",
          material: "Plastic/Electronics",
          isActive: true,
        },
        {
          name: "Insulated Water Bottle",
          description: "Temperature-controlled hydration",
          category: "Hydration",
          material: "Stainless Steel",
          isActive: true,
        },
        {
          name: "Running Gloves",
          description: "Lightweight performance gloves",
          category: "Handwear",
          material: "Synthetic Leather",
          isActive: true,
        },
        {
          name: "Heart Rate Monitor",
          description: "Chest strap heart rate sensor",
          category: "Technology",
          material: "Fabric/Electronics",
          isActive: true,
        },
        {
          name: "Running Hat",
          description: "Technical running cap",
          category: "Headwear",
          material: "Performance Polyester",
          isActive: true,
        },
        {
          name: "Calf Compression Sleeves",
          description: "Lower leg compression support",
          category: "Compression",
          material: "Elastane Blend",
          isActive: true,
        },
        {
          name: "Phone Armband",
          description: "Secure phone carrier",
          category: "Technology",
          material: "Neoprene",
          isActive: true,
        },
        {
          name: "Recovery Foam Roller",
          description: "Muscle recovery tool",
          category: "Recovery",
          material: "High-density Foam",
          isActive: true,
        },
        {
          name: "Running Belt",
          description: "Minimalist storage solution",
          category: "Storage",
          material: "Elastic Fabric",
          isActive: true,
        },
        {
          name: "Cooling Towel",
          description: "Instant cooling relief",
          category: "Recovery",
          material: "Microfiber",
          isActive: true,
        },
      ];

      for (const accessory of accessoryData) {
        try {
          const created = (await makeInternalAPICall("POST", "/api/accessories", accessory)) as {
            name: string;
          };
          results.accessories.push(created);
          logger.debug("[API Population] ✅ Created accessory:", created.name);
        } catch (error) {
          logger.error(
            "[API Population] ❌ Failed to create accessory:",
            accessory.name,
            error instanceof Error ? error : undefined,
          );
        }
      }

      const totalCreated =
        results.categories.length +
        results.fabrics.length +
        results.fibers.length +
        results.certificates.length +
        results.accessories.length;

      logger.debug(
        `[API Population] 🎉 Successfully created ${totalCreated} business items via APIs`,
      );

      res.json({
        success: true,
        message: `Successfully created ${totalCreated} business items via API calls`,
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
      logger.error(
        "[API Population] ❌ Failed to populate via APIs:",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  logger.debug("[API Population] ✅ API-based population routes registered");
}
