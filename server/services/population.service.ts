import { accessories, categories, certificates, fabrics, fibers } from "@run-remix/shared";
import { err, ok, type Result, ResultAsync } from "neverthrow";
import { AppError, DatabaseError, InternalError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";

interface PopulationResults {
  categories: unknown[];
  fabrics: unknown[];
  fibers: unknown[];
  certificates: unknown[];
  accessories: unknown[];
}

class PopulationService {
  async populateApiBased(port: string | number): Promise<Result<PopulationResults, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<PopulationResults> => {
        const results: PopulationResults = {
          categories: [],
          fabrics: [],
          fibers: [],
          certificates: [],
          accessories: [],
        };

        const makeInternalAPICall = async (
          method: string,
          endpoint: string,
          data?: unknown,
        ): Promise<Result<unknown, AppError>> => {
          return ResultAsync.fromPromise(
            (async (): Promise<PopulationResults> => {
              const response = await fetch(`http://localhost:${port}${endpoint}`, {
                method,
                headers: { "Content-Type": "application/json" },
                ...(data ? { body: JSON.stringify(data) } : {}),
              });
              if (!response.ok) {
                const errorText = await response.text();
                throw new InternalError(
                  `API call failed: ${method} ${endpoint} - ${response.status} ${errorText}`,
                );
              }
              return (await response.json()) as PopulationResults;
            })(),
            (error) => {
              if (error instanceof AppError) return error;
              return new InternalError(`API call exception for ${endpoint}`, { error });
            },
          );
        };

        // Create 3 Categories
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
          const res = await makeInternalAPICall("POST", "/api/categories", cat);
          if (res.isOk()) {
            results.categories.push(res.value);
          } else {
            logger.error("[API Population] ❌ Failed to create category:", cat.name, res.error);
          }
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
          const res = await makeInternalAPICall("POST", "/api/fabrics", fabric);
          if (res.isOk()) {
            results.fabrics.push(res.value);
          } else {
            logger.error("[API Population] ❌ Failed to create fabric:", fabric.name, res.error);
          }
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
          const res = await makeInternalAPICall("POST", "/api/fibers", fiber);
          if (res.isOk()) {
            results.fibers.push(res.value);
          } else {
            logger.error("[API Population] ❌ Failed to create fiber:", fiber.name, res.error);
          }
        }

        // Create 11 Certificates
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
          const res = await makeInternalAPICall("POST", "/api/certificates", cert);
          if (res.isOk()) {
            results.certificates.push(res.value);
          } else {
            logger.error("[API Population] ❌ Failed to create certificate:", cert.name, res.error);
          }
        }

        // Create 16 Accessories
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
          const res = await makeInternalAPICall("POST", "/api/accessories", accessory);
          if (res.isOk()) {
            results.accessories.push(res.value);
          } else {
            logger.error(
              "[API Population] ❌ Failed to create accessory:",
              accessory.name,
              res.error,
            );
          }
        }

        return results;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        logger.error("[PopulationService] API population failed", error as Error);
        return new InternalError("API population failed", { error });
      },
    );
  }
  async populateDirectPostgres(): Promise<Result<PopulationResults, AppError>> {
    const { transactionalResult } = await import("../lib/db/transaction-utils.js");

    return await transactionalResult(async (tx) => {
      const txResults: PopulationResults = {
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
        if (!created) return err(new DatabaseError("Failed to create category"));
        txResults.categories.push(created);
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
        if (!created) return err(new DatabaseError("Failed to create fabric"));
        txResults.fabrics.push(created);
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
        if (!created) return err(new DatabaseError("Failed to create fiber"));
        txResults.fibers.push(created);
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
        if (!created) return err(new DatabaseError("Failed to create certificate"));
        txResults.certificates.push(created);
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

      for (const acc of accessoryData) {
        const [created] = await tx.insert(accessories).values(acc).returning();
        if (!created) return err(new DatabaseError("Failed to create accessory"));
        txResults.accessories.push(created);
      }

      return ok(txResults);
    });
  }
}

export const populationService = new PopulationService();
