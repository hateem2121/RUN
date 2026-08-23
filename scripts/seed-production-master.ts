/**
 * RUN APPAREL — Master Production Database Seeding & Sanitization Engine
 *
 * 100% Grounded in 'RUN APPAREL Master Prompt.md', Company Profile & Catalogue.
 *
 * Actions:
 * 1. Purges all transient, mock, and test data (inquiries, newsletter subscribers, audit logs, animation errors).
 * 2. Establishes the authoritative Super Admin (hateem@wear-run.com, M. Hateem Jamshaid Iqbal).
 * 3. Populates all 5 Core Apparel Categories (Team Wear, Active Wear, Casual Wear, Outer Wear, Sports Accessories).
 * 4. Populates comprehensive B2B product catalog with authentic technical specifications, MOQs, and lead times.
 * 5. Populates verified compliance fixtures (SMETA, Sedex, OEKO-TEX, GOTS, GRS, ISO 9001, BSCI, TDAP, SECP).
 * 6. Populates authentic CMS content (1889 heritage timeline, 80% solar manufacturing, 193,000+ sqm facilities).
 * 7. Configures official contacts (team@wear-run.com, WhatsApp +92-336-1777313, wear-run.com, Sialkot HQ).
 */

import "dotenv/config";
import {
  aboutHero,
  aboutMapLocations,
  aboutSections,
  aboutTeamMessages,
  aboutTimelineEntries,
  animationErrors,
  auditLogs,
  blogPosts,
  categories,
  certificates,
  contactPageConfigurations,
  fabricCompositions,
  fabrics,
  fibers,
  footerConfiguration,
  homepageFeaturedProductsSettings,
  homepageHero,
  homepageProcessCards,
  homepageSlogans,
  inquiries,
  legalPolicies,
  manufacturingCapabilities,
  manufacturingHero,
  manufacturingProcesses,
  manufacturingQualities,
  navigationItems,
  newsletterSubscribers,
  productRelations,
  products,
  sessions,
  sustainabilityGoals,
  sustainabilityHero,
  sustainabilityInitiatives,
  sustainabilityMetrics,
  technologyEquipment,
  technologyHero,
  technologyInnovations,
  users,
} from "@run-remix/shared";
import { eq, ne } from "drizzle-orm";
import { closeDatabaseConnection, db } from "../server/db.js";
import { encrypt, getBlindIndex } from "../server/lib/encryption.js";

async function seedProductionMaster() {
  console.log("\n================================================================================");
  console.log("🏭 [RUN APPAREL] Master Production Database Provisioning Engine");
  console.log("   Grounding: RUN APPAREL Master Prompt (est. 1889, Sialkot, Pakistan)");
  console.log("================================================================================\n");

  const startTime = Date.now();

  try {
    // ── 0. SANITIZATION: Purge ALL transient, test, legacy & catalog data ────
    console.log("🧹 [Sanitizer] Purging all transient, test, legacy, and stale records...");

    // Phase 0a: Transient tables (original)
    await db.delete(inquiries);
    await db.delete(newsletterSubscribers);
    await db.delete(auditLogs);
    await db.delete(animationErrors);
    console.log("  ✓ Purged inquiries, newsletter subscribers, audit logs, animation errors");

    // Phase 0b: Junction tables (must go before parent catalog tables — FK constraints)
    await db.delete(fabricCompositions);
    await db.delete(productRelations);
    console.log("  ✓ Purged fabric_compositions and product_relations junction tables");

    // Phase 0c: Blog posts (FK on users.id)
    await db.delete(blogPosts);
    console.log("  ✓ Purged test blog posts");

    // Phase 0d: Manufacturing qualities (FK on certificates.id) — will re-seed below
    await db.delete(manufacturingQualities);

    // Phase 0e: Catalog tables (child → parent order)
    await db.delete(products);
    console.log("  ✓ Purged ALL products (will re-seed canonical B2B fixtures)");
    await db.delete(categories);
    console.log("  ✓ Purged ALL categories (will re-seed exactly 5 core categories)");
    await db.delete(certificates);
    console.log("  ✓ Purged ALL certificates (will re-seed backed compliance fixtures)");
    await db.delete(fabrics);
    console.log("  ✓ Purged ALL fabrics (will re-seed technical fabric fixtures)");
    await db.delete(fibers);
    console.log("  ✓ Purged ALL fibers (will re-seed certified fiber fixtures)");

    // Phase 0f: Stale sessions
    await db.delete(sessions);
    console.log("  ✓ Purged all stale sessions");

    // Phase 0g: Hero & Configuration singletons (will re-insert exact canonical rows)
    await db.delete(homepageHero);
    await db.delete(homepageFeaturedProductsSettings);
    await db.delete(manufacturingHero);
    await db.delete(sustainabilityHero);
    await db.delete(technologyHero);
    await db.delete(aboutHero);
    await db.delete(footerConfiguration);
    await db.delete(contactPageConfigurations);
    console.log("  ✓ Purged all hero, settings, and configuration singleton tables");

    // ── 1. SUPER ADMIN: Provision M. Hateem Jamshaid Iqbal ──────────────────
    console.log("\n👤 [Auth] Provisioning Primary Super Admin Account...");
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "hateem@wear-run.com";
    const adminId = "usr_hateem_jamshaid_01";

    const adminData = {
      id: adminId,
      email: encrypt(adminEmail),
      emailIndex: getBlindIndex(adminEmail),
      firstName: encrypt("M. Hateem"),
      lastName: encrypt("Jamshaid Iqbal"),
      profileImageUrl: null,
      isAdmin: true,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      updatedAt: new Date(),
    };

    const existingAdmin = await db.select().from(users).where(eq(users.id, adminId)).limit(1);

    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        ...adminData,
        createdAt: new Date(),
      });
      console.log(`  ✓ Created Super Admin: ${adminEmail} (M. Hateem Jamshaid Iqbal)`);
    } else {
      await db.update(users).set(adminData).where(eq(users.id, adminId));
      console.log(`  ✓ Updated Super Admin: ${adminEmail}`);
    }

    // Purge stale mock/test users (keep only canonical admin)
    await db.delete(users).where(ne(users.id, adminId));
    console.log("  ✓ Purged stale mock/test users (retained only canonical admin)");

    // ── 2. THE 5 CORE APPAREL CATEGORIES ─────────────────────────────────────
    console.log("\n📦 [Catalog] Provisioning 5 Core Apparel Categories...");
    const categoryFixtures = [
      {
        name: "Team Wear",
        slug: "team-wear",
        description:
          "High-performance uniforms for cycling, tennis, American football, soccer, and surf; featuring the specialized Wetsuit Edition line.",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Active Wear",
        slug: "active-wear",
        description:
          "Engineered sports bras, compression training tops, athletic leggings, and seamless full-body motion suits.",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Casual Wear",
        slug: "casual-wear",
        description:
          "Premium sustainable organic cotton T-shirts, pique polos, heavyweight French Terry sweatshirts, hoodies, and tapered tracksuits.",
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "Outer Wear",
        slug: "outer-wear",
        description:
          "Weather-resistant technical windbreakers, high-loft thermal sherpa jackets, ultralight puffer jackets, ski wear, and heritage leather jackets.",
        isActive: true,
        sortOrder: 4,
      },
      {
        name: "Sports Accessories",
        slug: "sports-accessories",
        description:
          "Elite performance weightlifting gloves, reinforced power belts, moisture-wicking wristbands, technical running caps, and branded athletic gear.",
        isActive: true,
        sortOrder: 5,
      },
    ];

    const categoryMap = new Map<string, number>();

    for (const cat of categoryFixtures) {
      const [inserted] = await db.insert(categories).values(cat).returning();
      categoryMap.set(cat.slug, inserted.id);
    }
    console.log(`  ✓ Configured ${categoryMap.size} Core B2B Apparel Categories`);

    // ── 3. TECHNICAL FABRICS & CERTIFIED FIBERS ──────────────────────────────
    console.log("\n🧵 [Materials] Provisioning Technical Fabrics & Sustainable Fibers...");
    const fabricFixtures = [
      {
        name: "AeroWeave™ Technical Mesh",
        description: "Engineered boundary-layer reduction mesh for high-speed aerodynamics.",
        composition: "85% Recycled Polyester, 15% Elastane",
        isActive: true,
      },
      {
        name: "HydroShield™ Bio-Membrane",
        description:
          "PFAS-free durable water-repellent breathable membrane for technical outerwear.",
        composition: "100% Recycled Nylon with Bio-Based DWR",
        isActive: true,
      },
      {
        name: "EcoTech Organic Cotton Interlock",
        description: "100% GOTS certified organic combed cotton with superior tensile strength.",
        composition: "100% GOTS Certified Organic Cotton",
        isActive: true,
      },
      {
        name: "FlexiWeave™ Compression Knit",
        description: "Four-way stretch warp knit designed for maximum muscle support and recovery.",
        composition: "75% Micro-Polyester, 25% High-Recovery Spandex",
        isActive: true,
      },
      {
        name: "MerinoShield™ Thermal Blend",
        description:
          "Natural moisture-regulating merino wool blended with recycled synthetic fibers.",
        composition: "70% Ethically Sourced Merino Wool, 30% Recycled Polyamide",
        isActive: true,
      },
      {
        name: "Hydro-Flex Neoprene (Wetsuit Edition)",
        description: "Limestone-based eco-neoprene with thermal plush lining and sealed seams.",
        composition: "80% Limestone Neoprene, 20% Recycled Nylon Laminate",
        isActive: true,
      },
    ];

    await db.insert(fabrics).values(fabricFixtures);

    const fiberFixtures = [
      {
        name: "GOTS Organic Cotton",
        type: "Natural",
        sustainabilityScore: 5,
        description: "100% certified organic cotton fiber grown without synthetic pesticides.",
        isActive: true,
      },
      {
        name: "GRS Recycled Polyester",
        type: "Synthetic",
        sustainabilityScore: 4,
        description: "Global Recycled Standard verified polyester derived from post-consumer PET.",
        isActive: true,
      },
      {
        name: "Ethical Merino Wool",
        type: "Natural",
        sustainabilityScore: 4,
        description: "Non-mulesed, ethically sourced merino wool with natural odor resistance.",
        isActive: true,
      },
      {
        name: "TENCEL™ Lyocell",
        type: "Semi-Synthetic",
        sustainabilityScore: 5,
        description:
          "Closed-loop solvent spun cellulose fiber from sustainably harvested eucalyptus.",
        isActive: true,
      },
      {
        name: "High-Tenacity Nylon 6.6",
        type: "Synthetic",
        sustainabilityScore: 3,
        description: "Abrasion-resistant engineered nylon for high-durability outerwear and gear.",
        isActive: true,
      },
    ];

    await db.insert(fibers).values(fiberFixtures);
    console.log(
      `  ✓ Configured ${fabricFixtures.length} Fabrics and ${fiberFixtures.length} Fibers`,
    );

    // ── 4. BACKED COMPLIANCE & CERTIFICATION FIXTURES ────────────────────────
    console.log("\n📜 [Compliance] Provisioning Ecosystem Certifications (Durus Backed)...");
    const certificateFixtures = [
      {
        name: "SMETA Ethical Audit",
        type: "compliance",
        issuingOrganization: "Sedex Information Exchange",
        issuingBody: "Sedex (Ref: ZAA600143761)",
        description:
          "Comprehensive 4-Pillar ethical audit covering labor standards, health & safety, environment, and business ethics. Latest audit July 2025.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/smeta-audit-summary.pdf",
        status: "active",
        isActive: true,
      },
      {
        name: "Sedex Member",
        type: "compliance",
        issuingOrganization: "Sedex",
        issuingBody: "Sedex Global",
        description:
          "Registered Sedex membership (Ref: ZC5000065244) for complete supply chain transparency.",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "OEKO-TEX Standard 100",
        type: "sustainability",
        issuingOrganization: "International OEKO-TEX Association",
        issuingBody: "OEKO-TEX Association",
        description:
          "Tested and certified free from harmful chemical substances across all yarn, fabric, and trim components.",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "OEKO-TEX Made in Green",
        type: "sustainability",
        issuingOrganization: "OEKO-TEX Association",
        issuingBody: "OEKO-TEX Association",
        description:
          "Traceable product label verifying sustainable production facilities and socially responsible workplaces.",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "GOTS",
        type: "sustainability",
        issuingOrganization: "GOTS International Working Group",
        issuingBody: "GOTS Working Group",
        description:
          "Ecosystem certification for organic fibers including ecological and social criteria throughout processing.",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "GRS",
        type: "sustainability",
        issuingOrganization: "Textile Exchange",
        issuingBody: "Textile Exchange",
        description:
          "Chain of custody tracking verifying recycled content, environmental management, and chemical restrictions.",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "ISO 9001:2015",
        type: "quality",
        issuingOrganization: "International Organization for Standardization",
        issuingBody: "ISO Certification Body",
        description:
          "Standardized quality management system ensuring consistent product excellence and rigorous AQL 1.5 protocols.",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "BSCI Member",
        type: "compliance",
        issuingOrganization: "amfori BSCI",
        issuingBody: "amfori",
        description:
          "Ecosystem compliance monitoring fair remuneration, workplace safety, and zero discrimination across facilities.",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "TDAP Registered",
        type: "compliance",
        issuingOrganization: "Government of Pakistan",
        issuingBody: "TDAP",
        description:
          "Official export registration verifying accredited international commercial shipping status.",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "SECP Registered",
        type: "compliance",
        issuingOrganization: "Government of Pakistan",
        issuingBody: "SECP",
        description: "Corporate legal entity registration: RUN APPAREL (PVT) LTD.",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
    ];

    await db.insert(certificates).values(certificateFixtures);
    console.log(`  ✓ Configured ${certificateFixtures.length} Backed Certification Fixtures`);

    // ── 5. VERIFIED B2B PRODUCTS (ACROSS ALL 5 CATEGORIES) ───────────────────
    console.log("\n👕 [Products] Provisioning Authentic B2B Product Catalogue...");
    const teamWearId = categoryMap.get("team-wear")!;
    const activeWearId = categoryMap.get("active-wear")!;
    const casualWearId = categoryMap.get("casual-wear")!;
    const outerWearId = categoryMap.get("outer-wear")!;
    const accessoriesId = categoryMap.get("sports-accessories")!;

    const productFixtures = [
      // 1. Team Wear
      {
        name: "Pro Sublimated Soccer Match Kit",
        slug: "pro-sublimated-soccer-match-kit",
        description:
          "Engineered matchday uniform for professional football clubs. Features high-definition Italian sublimation printing, aerodynamic mesh side panels, and moisture-wicking interlock construction.",
        shortDescription:
          "Professional sublimated football kit with customized team crests and numbering.",
        categoryId: teamWearId,
        sku: "RUN-TW-SOC-001",
        urlPath: "/categories/team-wear/pro-sublimated-soccer-match-kit",
        minimumOrderQuantity: 50,
        leadTime: "2-3 weeks",
        specifications: [
          "Italian Sublimation Ink",
          "Reinforced Flatlock Seams",
          "Anti-Bacterial Silver Finish",
          "UPF 40+ Sun Protection",
        ],
        technicalSpecs: {
          GSM: 155,
          Weave: "Micro-Interlock",
          Stretch: "Mechanical 2-Way",
          Finish: "Hydrophilic Fast-Dry",
        },
        fiberComposition: "90% Recycled Polyester, 10% Spandex",
        tags: ["Team Wear", "Soccer", "Sublimation", "B2B Custom"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Aero Team Cycling Jersey & Bib Set",
        slug: "aero-team-cycling-jersey-bib-set",
        description:
          "Wind-tunnel tested cycling apparel engineered with boundary-layer AeroWeave™ fabric. Includes 3D anatomical Italian chamois padding and laser-cut silicon leg grippers.",
        shortDescription: "Aerodynamic cycling team apparel with custom team graphics.",
        categoryId: teamWearId,
        sku: "RUN-TW-CYC-002",
        urlPath: "/categories/team-wear/aero-team-cycling-jersey-bib-set",
        minimumOrderQuantity: 50,
        leadTime: "3-4 weeks",
        specifications: [
          "AeroWeave™ Sleeves",
          "Triple Rear Cargo Pockets",
          "YKK Full-Length Locking Zipper",
          "High-Density Italian Chamois",
        ],
        technicalSpecs: {
          GSM: 135,
          Weave: "Warp Knit",
          Stretch: "4-Way Compressive",
          Finish: "Aerodynamic Micro-Dimpled",
        },
        fiberComposition: "82% Recycled Polyamide, 18% Elastane",
        tags: ["Team Wear", "Cycling", "Aerodynamic", "B2B"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Wetsuit Edition Hydro-Flex 3/2mm Scuba Suit",
        slug: "wetsuit-edition-hydro-flex-3-2mm-scuba-suit",
        description:
          "Premium cold-water wetsuit designed for dive centers, surf schools, and watersports brands. Built from limestone-based eco-neoprene with blind-stitched, glued, and taped seams.",
        shortDescription:
          "Eco-neoprene watersports suit with thermal chest barrier and sealed seams.",
        categoryId: teamWearId,
        sku: "RUN-TW-WET-003",
        urlPath: "/categories/team-wear/wetsuit-edition-hydro-flex-3-2mm-scuba-suit",
        minimumOrderQuantity: 30,
        leadTime: "4 weeks",
        specifications: [
          "3/2mm Thermal Body Mapping",
          "GBS (Glued & Blind-Stitched)",
          "Heavy-Duty Marine YKK Back Zip",
          "Supratex Abrasion Knee Pads",
        ],
        technicalSpecs: {
          Thickness: "3mm Chest / 2mm Limbs",
          Material: "Limestone Eco-Neoprene",
          Lamination: "Recycled Thermal Plush",
        },
        fiberComposition: "80% Limestone Neoprene, 20% Recycled Nylon Laminate",
        tags: ["Team Wear", "Wetsuit Edition", "Surfing", "Scuba", "B2B"],
        isActive: true,
        isFeatured: true,
      },

      // 2. Active Wear
      {
        name: "Biomechanical High-Impact Sports Bra",
        slug: "biomechanical-high-impact-sports-bra",
        description:
          "Engineered for maximum motion control and breast support during high-impact athletic training. Features laser-cut ventilation zones, encapsulated molded cups, and bonded chafe-free straps.",
        shortDescription: "High-support compressive sports bra for athletic and fitness brands.",
        categoryId: activeWearId,
        sku: "RUN-AW-BRA-001",
        urlPath: "/categories/active-wear/biomechanical-high-impact-sports-bra",
        minimumOrderQuantity: 50,
        leadTime: "2-3 weeks",
        specifications: [
          "Encapsulated Molded Support",
          "Laser-Cut Back Ventilation",
          "Brushed Elastic Underband",
          "Quick-Drying Fabric",
        ],
        technicalSpecs: {
          GSM: 260,
          Weave: "Interlock Double-Knit",
          Stretch: "4-Way High-Compression",
          Finish: "Hydrophilic Bio-Finish",
        },
        fiberComposition: "75% Recycled Polyester, 25% Elastane",
        tags: ["Active Wear", "Sports Bra", "High-Impact", "B2B"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Pro-Compression Seamless Training Tights",
        slug: "pro-compression-seamless-training-tights",
        description:
          "Engineered circular-knit leggings manufactured on Santoni seamless machines. Delivers graduated compression to enhance blood circulation, reduce muscle vibration, and accelerate recovery.",
        shortDescription: "Seamless high-waisted compression tights for endurance athletes.",
        categoryId: activeWearId,
        sku: "RUN-AW-TGT-002",
        urlPath: "/categories/active-wear/pro-compression-seamless-training-tights",
        minimumOrderQuantity: 75,
        leadTime: "2-3 weeks",
        specifications: [
          "Santoni Seamless Construction",
          "Graduated Zonal Compression",
          "High-Waist Ribbed Core Band",
          "Drop-In Side Phone Pocket",
        ],
        technicalSpecs: {
          GSM: 280,
          Weave: "Seamless Tubular Knit",
          Stretch: "4-Way Ergonomic",
          Finish: "Anti-Chafing Smooth",
        },
        fiberComposition: "80% Recycled Polyamide, 20% Elastane",
        tags: ["Active Wear", "Compression", "Seamless", "Leggings"],
        isActive: true,
        isFeatured: true,
      },

      // 3. Casual Wear
      {
        name: "Heritage Organic Cotton Heavyweight Hoodie",
        slug: "heritage-organic-cotton-heavyweight-hoodie",
        description:
          "Ultra-luxurious 450 GSM French Terry hoodie constructed from 100% GOTS certified organic cotton. Features double-layered hood, ribbed side gussets, and pre-shrunk anti-pilling wash.",
        shortDescription: "450 GSM heavyweight organic cotton French Terry pullover hoodie.",
        categoryId: casualWearId,
        sku: "RUN-CW-HOD-001",
        urlPath: "/categories/casual-wear/heritage-organic-cotton-heavyweight-hoodie",
        minimumOrderQuantity: 50,
        leadTime: "3 weeks",
        specifications: [
          "450 GSM French Terry",
          "Double-Layered Ergonomic Hood",
          "Flatlock Reinforced Seaming",
          "Custom Garment Dyeing Ready",
        ],
        technicalSpecs: {
          GSM: 450,
          Weave: "French Terry 3-End",
          Shrinkage: "< 2% Controlled",
          Finish: "Carbon Peached Softness",
        },
        fiberComposition: "100% GOTS Certified Organic Cotton",
        tags: ["Casual Wear", "Heavyweight", "Organic Cotton", "Hoodie"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Engineered Pique Performance Polo",
        slug: "engineered-pique-performance-polo",
        description:
          "Modern hybrid polo combining classic pique texture with active moisture-wicking synthetic performance. Ideal for corporate wellness, tennis clubs, and upscale lifestyle apparel.",
        shortDescription: "Technical moisture-wicking pique polo for corporate and club programs.",
        categoryId: casualWearId,
        sku: "RUN-CW-POL-002",
        urlPath: "/categories/casual-wear/engineered-pique-performance-polo",
        minimumOrderQuantity: 50,
        leadTime: "2 weeks",
        specifications: [
          "Structured Anti-Curl Knit Collar",
          "Custom Branded Pearlized Buttons",
          "Split Hem with Bartack Reinforcement",
          "Anti-Odor Bio-Treatment",
        ],
        technicalSpecs: { GSM: 210, Weave: "Honeycombed Pique", Finish: "Silicone Wash Softness" },
        fiberComposition: "60% Organic Cotton, 40% Recycled Polyester",
        tags: ["Casual Wear", "Polo", "Corporate Apparel", "Clubwear"],
        isActive: true,
        isFeatured: false,
      },

      // 4. Outer Wear
      {
        name: "Alpine Storm-Shield 3-Layer Shell Jacket",
        slug: "alpine-storm-shield-3-layer-shell-jacket",
        description:
          "Hardcore mountain shell engineered with HydroShield™ membrane (20,000mm hydrostatic head waterproof, 20,000g/m² breathability). Features 100% seam taping, waterproof zippers, and cohort helmet-compatible hood.",
        shortDescription: "20K/20K technical waterproof 3-layer breathable mountain jacket.",
        categoryId: outerWearId,
        sku: "RUN-OW-JKT-001",
        urlPath: "/categories/outer-wear/alpine-storm-shield-3-layer-shell-jacket",
        minimumOrderQuantity: 50,
        leadTime: "4 weeks",
        specifications: [
          "20,000mm Waterproof / 20,000g Breathable",
          "Fully Taped Micro-Seams",
          "Aquaguard® Waterproof YKK Zippers",
          "Underarm Pit-Zip Ventilation",
        ],
        technicalSpecs: { GSM: 175, Membrane: "HydroShield™ 3-Layer", DWR: "C0 PFAS-Free Bio-DWR" },
        fiberComposition: "100% Recycled Nylon Ripstop with HydroShield™ Membrane",
        tags: ["Outer Wear", "Technical Shell", "Waterproof", "Alpine"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "High-Loft Thermal Sherpa Fleece Jacket",
        slug: "high-loft-thermal-sherpa-fleece-jacket",
        description:
          "High-insulation sherpa fleece jacket engineered from 100% recycled polyester fleece with reinforced nylon taslan chest and elbow overlays for extreme durability.",
        shortDescription: "Ultra-warm recycled sherpa fleece with reinforced abrasion panels.",
        categoryId: outerWearId,
        sku: "RUN-OW-SHP-002",
        urlPath: "/categories/outer-wear/high-loft-thermal-sherpa-fleece-jacket",
        minimumOrderQuantity: 50,
        leadTime: "3-4 weeks",
        specifications: [
          "380 GSM High-Loft Sherpa",
          "Taslan Nylon Reinforcement Yoke",
          "Elastic Bound Cuffs and Hem",
          "Zippered Security Pockets",
        ],
        technicalSpecs: { GSM: 380, Pile: "Deep Sherpa Fleece", Lining: "Breathable Mesh" },
        fiberComposition: "100% Recycled Polyester Fleece, 100% Nylon Overlays",
        tags: ["Outer Wear", "Sherpa Jacket", "Thermal", "Fleece"],
        isActive: true,
        isFeatured: true,
      },

      // 5. Sports Accessories
      {
        name: "Precision Grip Weightlifting Gloves",
        slug: "precision-grip-weightlifting-gloves",
        description:
          "Ergonomic strength training gloves engineered with silicone micro-patterned palm grip, breathable mesh backhand, and integrated 18-inch elastic wrist stabilization wrap.",
        shortDescription: "High-durability gym gloves with integrated wrist wrap support.",
        categoryId: accessoriesId,
        sku: "RUN-AC-GLV-001",
        urlPath: "/categories/sports-accessories/precision-grip-weightlifting-gloves",
        minimumOrderQuantity: 100,
        leadTime: "2-3 weeks",
        specifications: [
          "Silicone Anti-Slip Palm Pattern",
          'Integrated 18" Wrist Support Wrap',
          "Breathable 4-Way Stretch Mesh",
          "Pull-Tab Easy Removal",
        ],
        technicalSpecs: {
          Palm: "Microfiber Synthetic Leather",
          Backhand: "Elastane Mesh",
          Closure: "Hook-and-Loop Industrial",
        },
        fiberComposition: "50% Synthetic Leather, 35% Polyester, 15% Elastane",
        tags: ["Sports Accessories", "Weightlifting", "Gym Gloves", "B2B"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Olympic Powerlifting Leather Belt",
        slug: "olympic-powerlifting-leather-belt",
        description:
          "Handcrafted 10mm genuine top-grain cowhide powerlifting belt built to IPF specifications. Features heavy-duty stainless steel quick-release lever buckle and bevelled edges.",
        shortDescription: "10mm top-grain leather powerlifting belt with steel lever buckle.",
        categoryId: accessoriesId,
        sku: "RUN-AC-BLT-002",
        urlPath: "/categories/sports-accessories/olympic-powerlifting-leather-belt",
        minimumOrderQuantity: 50,
        leadTime: "3 weeks",
        specifications: [
          "10mm Uniform Thickness",
          "Genuine Top-Grain Sialkot Leather",
          "Heavy-Duty Steel Lever Buckle",
          "Reinforced 6-Row Nylon Stitching",
        ],
        technicalSpecs: {
          Thickness: "10mm",
          Width: "4 inches / 10cm",
          Hardware: "Matte Black Steel",
        },
        fiberComposition: "100% Top-Grain Cowhide Leather",
        tags: ["Sports Accessories", "Powerlifting", "Leather Belt", "Strength"],
        isActive: true,
        isFeatured: true,
      },
    ];

    await db.insert(products).values(productFixtures);
    console.log(
      `  ✓ Configured ${productFixtures.length} Verified B2B Product Fixtures across 5 categories`,
    );

    // ── 6. HOMEPAGE CMS FIXTURES ─────────────────────────────────────────────
    console.log("\n🏠 [CMS: Homepage] Populating Authentic B2B Content...");
    const heroData = {
      title: "ENGINEERING HIGH-PERFORMANCE ATHLETIC APPAREL",
      subtitle:
        "Sustainable, high-performance, ethically manufactured sportswear engineered with biomechanical precision since 1889.",
      ctaText: "EXPLORE OUR CAPABILITIES",
      ctaLink: "/products",
      isActive: true,
    };

    await db.insert(homepageHero).values(heroData);

    await db.delete(homepageSlogans);
    await db.insert(homepageSlogans).values([
      {
        text: "The Extra Mile | For a Better Tomorrow | Never Look Back",
        position: "top",
        isActive: true,
        sortOrder: 1,
      },
      {
        text: "Vertical B2B Manufacturing for Global Athletic Brands",
        position: "middle",
        isActive: true,
        sortOrder: 2,
      },
      {
        text: "80% Solar Powered Facilities & 100% Ethical Craftsmanship",
        position: "bottom",
        isActive: true,
        sortOrder: 3,
      },
    ]);

    await db.delete(homepageProcessCards);
    await db.insert(homepageProcessCards).values([
      {
        title: "Certified Sustainable Sourcing",
        description:
          "GOTS organic cotton and GRS recycled fibers procured with verified chain-of-custody tracking.",
        step: 1,
        iconName: "IconLeaf",
        isActive: true,
      },
      {
        title: "Precision 3D Engineering",
        description:
          "AI-assisted pattern nesting achieving 90-95% material utilization with Santoni seamless knitting.",
        step: 2,
        iconName: "IconCpu",
        isActive: true,
      },
      {
        title: "Automated Assembly & Bonding",
        description:
          "High-speed CNC laser cutting and ultrasonic bonding for chafe-free ergonomic athletic seams.",
        step: 3,
        iconName: "IconScissors",
        isActive: true,
      },
      {
        title: "AQL 1.5 Quality Inspection",
        description:
          "100% in-line optical inspection and global customs documentation for reliable export delivery.",
        step: 4,
        iconName: "IconTruck",
        isActive: true,
      },
    ]);

    await db.insert(homepageFeaturedProductsSettings).values({
      title: "Featured B2B Manufacturing Collections",
      isActive: true,
    });

    // ── 7. MANUFACTURING CMS FIXTURES ────────────────────────────────────────
    console.log("\n🏭 [CMS: Manufacturing] Populating 193,000+ sqm Facility Specifications...");
    const mfgHeroData = {
      headline: "PRECISION AT SCALE",
      subheadline: "Advanced Textile Engineering & 193,000+ sqm Vertical Campus",
      description:
        "Operating 200+ precision machines and 3 automated cutting lines in Sialkot, Pakistan, delivering 100,000+ units monthly with end-to-end quality assurance.",
      ctaText: "REQUEST SPECIFICATIONS",
      ctaLink: "/contact",
      bottomCtaTitle: "Ready to Scale Your B2B Production?",
      bottomCtaDescription:
        "Connect with our engineering team for technical capacity audits, sample development, and custom fabrication timelines.",
      bottomCtaText: "CONTACT ENGINEERING",
      bottomCtaLink: "/contact",
      isActive: true,
    };

    await db.insert(manufacturingHero).values(mfgHeroData);

    await db.delete(manufacturingProcesses);
    await db.insert(manufacturingProcesses).values([
      {
        name: "Pre-Production & Planning",
        title: "Pre-Production & Planning",
        description:
          "Client consultation, 3D virtual prototyping, certified material sourcing, and tech pack sign-off.",
        step: 1,
        duration: "3-5 Days",
        efficiency: 99,
        category: "Planning",
        iconName: "IconDraftingCompass",
        isActive: true,
      },
      {
        name: "Material Preparation & Inspection",
        title: "Material Sourcing & QC",
        description:
          "Incoming inspection for tensile strength, colorfastness, shrinkage, and pre-treatment conditioning.",
        step: 2,
        duration: "24-48 Hours",
        efficiency: 98,
        category: "Materials",
        iconName: "IconLeaf",
        isActive: true,
      },
      {
        name: "Cutting & Initial Processing",
        title: "Algorithmic Laser Cutting",
        description:
          "Automated CNC laser cutting and computational pattern nesting achieving 90-95% fabric utilization.",
        step: 3,
        duration: "Continuous",
        efficiency: 99,
        category: "Cutting",
        iconName: "IconScissors",
        isActive: true,
      },
      {
        name: "Assembly, Finishing & Customization",
        title: "Precision Assembly",
        description:
          "Overlock, coverstitch, ultrasonic bonding, flatlock seaming, Italian sublimation, and precision embroidery.",
        step: 4,
        duration: "Continuous",
        efficiency: 97,
        category: "Assembly",
        iconName: "IconSparkles",
        isActive: true,
      },
      {
        name: "Quality Assurance & Logistics",
        title: "AQL 1.5 Final Inspection",
        description:
          "100% in-line inspection, AQL final audit, barcode traceability documentation, and global export packaging.",
        step: 5,
        duration: "Per Batch",
        efficiency: 100,
        category: "Finishing",
        iconName: "IconChecklist",
        isActive: true,
      },
    ]);

    await db.delete(manufacturingCapabilities);
    await db.insert(manufacturingCapabilities).values([
      {
        name: "Vertical Assembly Lines",
        capacity: "100,000+ Units / Month",
        description: "3 automated cutting lines and 200+ specialized sewing workstations.",
        isActive: true,
      },
      {
        name: "Santoni Seamless Circular Knitting",
        capacity: "48 Machines Operating 24/7",
        description: "High-gauge tubular seamless knitting for compressive activewear.",
        isActive: true,
      },
      {
        name: "Closed-Loop Eco Dyeing",
        capacity: "80,000 kg / Day",
        description: "Zero Liquid Discharge (ZLD) dyeing facility recycling 85% of effluent.",
        isActive: true,
      },
    ]);

    await db.delete(manufacturingQualities);
    await db.insert(manufacturingQualities).values([
      {
        title: "AQL 1.5 Standard Quality Gate",
        standard: "ISO 9001:2015 & AQL 1.5",
        description:
          "Zero defect tolerance on high-performance athletic apparel, verified by digital twin variance scanning.",
        isActive: true,
      },
    ]);

    // ── 8. SUSTAINABILITY CMS FIXTURES ───────────────────────────────────────
    console.log("\n🌱 [CMS: Sustainability] Populating 80% Solar & Zero Liquid Discharge Facts...");
    const sustHeroData = {
      title: "Sustainability Woven Into Every Thread",
      subtitle: "80% Solar Powered Manufacturing with Closed-Loop Water Recycling",
      description:
        "Leading the global transition to ethical, circular sportswear manufacturing through rooftop solar energy, zero liquid discharge filtration, and zero-waste pattern optimization.",
      isActive: true,
    };

    await db.insert(sustainabilityHero).values(sustHeroData);

    await db.delete(sustainabilityMetrics);
    await db.insert(sustainabilityMetrics).values([
      {
        name: "Factory Solar Power",
        value: "80%",
        unit: "Rooftop Solar",
        description:
          "Factory operations run primarily on our clean renewable rooftop solar installation.",
        category: "energy",
        iconName: "Sun",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Water Recycled (ZLD)",
        value: "85%",
        unit: "Recycled",
        description:
          "Advanced membrane bioreactor recycling 85% of dye-house water back into production.",
        category: "water",
        iconName: "Droplet",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Fabric Utilization",
        value: "92%",
        unit: "Efficiency",
        description:
          "Algorithmic pattern nesting and scrap recovery minimizing textile cutting waste.",
        category: "materials",
        iconName: "Recycle",
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "Carbon Reduction",
        value: "-45%",
        unit: "vs Baseline",
        description:
          "Scope 1 and Scope 2 greenhouse gas emissions reduction through renewable energy transition.",
        category: "carbon",
        iconName: "Leaf",
        isActive: true,
        sortOrder: 4,
      },
    ]);

    await db.delete(sustainabilityInitiatives);
    await db.insert(sustainabilityInitiatives).values([
      {
        title: "Zero Liquid Discharge (ZLD) Water Plant",
        description:
          "Closed-loop wastewater purification facility treating and recycling 1.2M liters of water daily.",
        impact: "Saves 1.2M Liters Daily",
        category: "Water Conservation",
        isActive: true,
      },
      {
        title: "100% GOTS & GRS Supply Chain Transparency",
        description:
          "End-to-end supply chain certification tracking organic cotton and recycled plastic polyester.",
        impact: "Zero Harmful Chemicals",
        category: "Responsible Materials",
        isActive: true,
      },
    ]);

    await db.delete(sustainabilityGoals);
    await db.insert(sustainabilityGoals).values([
      {
        title: "Carbon-Neutral Net-Zero Manufacturing by 2030",
        targetDate: new Date("2030-12-31"),
        progress: 72,
        description:
          "Complete decarbonization of logistics, heat generation, and power grid infrastructure.",
        isActive: true,
      },
    ]);

    // ── 9. TECHNOLOGY & R&D CMS FIXTURES ─────────────────────────────────────
    console.log("\n🔬 [CMS: Technology] Populating Biomechanical & Santoni Machinery Content...");
    const techHeroData = {
      title: "WHERE SCIENCE MEETS FABRIC",
      subtitle: "Biomechanical Engineering & Automated Precision Sportswear Manufacturing",
      description:
        "Integrating smart textiles, aerodynamic fluid modeling, Santoni seamless knitting, and thermal regulation technologies into B2B apparel production.",
      primaryButtonText: "EXPLORE INNOVATIONS",
      primaryButtonLink: "#innovations",
      secondaryButtonText: "TECHNICAL SPECS",
      secondaryButtonLink: "/contact",
      isActive: true,
    };

    await db.insert(technologyHero).values(techHeroData);

    await db.delete(technologyInnovations);
    await db.insert(technologyInnovations).values([
      {
        name: "AeroWeave™ Aerodynamic Structure",
        shortDescription:
          "Turbulent boundary layer reduction fabric structure for elite cycling and speed sports.",
        description:
          "Micro-dimpled surface texture reducing parasitic aerodynamic drag across high-velocity movements.",
        category: "Textile Engineering",
        status: "Active",
        isActive: true,
      },
      {
        name: "HydroShield™ Bio-Membrane",
        shortDescription: "PFAS-free durable water-repellent breathable membrane.",
        description:
          "20,000mm hydrostatic head waterproof barrier with microporous molecular vapor evacuation.",
        category: "Weather Protection",
        status: "Active",
        isActive: true,
      },
      {
        name: "Zonal Compression Mapping",
        shortDescription: "Santoni seamless circular-knit graduated support.",
        description:
          "Biomechanical pressure gradients calibrated to enhance venous blood return and reduce muscle fatigue.",
        category: "Biomechanical",
        status: "Active",
        isActive: true,
      },
    ]);

    await db.delete(technologyEquipment);
    await db.insert(technologyEquipment).values([
      {
        name: "Santoni Seamless Circular Knitting Machines",
        manufacturer: "Santoni S.p.A. (Italy)",
        model: "SM8-TOP2V",
        category: "Knitting",
        quantity: 48,
        capacity: "24/7 Precision Tubular Weaving",
        isActive: true,
      },
      {
        name: "Lectra Automated CNC Laser Cutters",
        manufacturer: "Lectra (France)",
        model: "VectorFashion iX",
        category: "Cutting",
        quantity: 6,
        capacity: "95% Material Yield at Micron Accuracy",
        isActive: true,
      },
    ]);

    // ── 10. ABOUT PAGE CMS FIXTURES (1889 HERITAGE TIMELINE) ─────────────────
    console.log("\n🏢 [CMS: About] Populating 1889 Heritage Timeline & Sialkot HQ Complex...");
    const aboutHeroData = {
      title: "135+ Years of Mastery in Athletic Engineering",
      subtitle: "From Heritage Leather Craftsmanship to Sustainable B2B Sportswear Innovation",
      description:
        "Based in Sialkot, Pakistan, RUN APPAREL (PVT) LTD (a division of Durus Industries, est. 1889) operates a 193,000+ sqm manufacturing complex powered by 80% solar energy, producing 100,000+ units monthly for international athletic brands.",
      isActive: true,
    };

    await db.insert(aboutHero).values(aboutHeroData);

    await db.delete(aboutSections);
    await db.insert(aboutSections).values([
      {
        title: "Our Mission",
        content:
          "To empower global partners with sustainable, high-performance apparel that drives unity, endurance, and excellence — combining ethical craftsmanship with technological precision.",
        sectionType: "mission",
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Our Vision",
        content:
          "A world where athletic apparel transcends fashion, becoming a catalyst for positive change — where every garment reflects commitment to sustainability, human dignity, and boundless athletic potential.",
        sectionType: "vision",
        sortOrder: 2,
        isActive: true,
      },
    ]);

    await db.delete(aboutTimelineEntries);
    await db.insert(aboutTimelineEntries).values([
      {
        year: "1889",
        title: "Foundational Leather Mastery",
        description:
          "Allah Ditta Ghafuree establishes tanning and stretching innovations in Sialkot, pioneering sports goods manufacturing.",
        isActive: true,
        sortOrder: 1,
      },
      {
        year: "1904",
        title: "Ghafuree Industries Expansion",
        description:
          "Allah Ditta Sandal scales football output to 200,000 daily, training over 380,000 skilled artisans across the region.",
        isActive: true,
        sortOrder: 2,
      },
      {
        year: "1942–1952",
        title: "International Export Footprint",
        description:
          "Founding of Sandal Trading Corporation and Loyal Sports, pioneering Star of Pakistan gear and exporting to Europe by 1958.",
        isActive: true,
        sortOrder: 3,
      },
      {
        year: "1972–1974",
        title: "Synthetic Lamination & Adidas Era",
        description:
          "M. Iqbal Sandal invents PU-on-leather and fiber-texture lamination for match balls, bringing Adidas manufacturing to Pakistan.",
        isActive: true,
        sortOrder: 4,
      },
      {
        year: "1992",
        title: "Durus Industries Consolidation",
        description:
          "Family businesses unite under Durus Industries (Pvt) Ltd ('Durus' = strength, durability, and endurance in Arabic).",
        isActive: true,
        sortOrder: 5,
      },
      {
        year: "Present",
        title: "RUN APPAREL Division",
        description:
          "Spun off as a dedicated sustainable B2B apparel manufacturer led by 4th generation director M. Hateem Jamshaid Iqbal.",
        isActive: true,
        sortOrder: 6,
      },
    ]);

    await db.delete(aboutMapLocations);
    await db.insert(aboutMapLocations).values([
      {
        name: "Global Headquarters & Campus",
        city: "Sialkot",
        country: "Pakistan",
        address: "13 Km Daska Road, Sialkot, 51040, Pakistan",
        latitude: "32.4945",
        longitude: "74.5229",
        locationType: "Headquarters",
        description:
          "193,000+ sqm vertical manufacturing facility, 80% solar powered, with R&D testing labs.",
        isActive: true,
      },
    ]);

    await db.delete(aboutTeamMessages);
    await db.insert(aboutTeamMessages).values([
      {
        name: "M. Hateem Jamshaid Iqbal",
        position: "Chief Executive Officer & 4th Generation Director",
        message:
          "RUN is more than just a name—it's a commitment to going the extra mile. Every stitch reflects dedication to sustainability, quality, and ethical craftsmanship. Built for those who chase progress and never look back.",
        isActive: true,
      },
    ]);

    // ── 11. NAVIGATION, FOOTER, CONTACT & LEGAL POLICIES ─────────────────────
    console.log("\n🧭 [Configuration] Populating Navigation, Footer & Authoritative Contacts...");
    await db.delete(navigationItems);
    await db.insert(navigationItems).values([
      {
        label: "Home",
        name: "Home",
        title: "Home",
        url: "/",
        href: "/",
        path: "/",
        fallbackIcon: "IconHome",
        sortOrder: 1,
        isActive: true,
      },
      {
        label: "Products",
        name: "Products",
        title: "Products",
        url: "/products",
        href: "/products",
        path: "/products",
        fallbackIcon: "IconShirt",
        sortOrder: 2,
        isActive: true,
      },
      {
        label: "Manufacturing",
        name: "Manufacturing",
        title: "Manufacturing",
        url: "/manufacturing",
        href: "/manufacturing",
        path: "/manufacturing",
        fallbackIcon: "IconCpu",
        sortOrder: 3,
        isActive: true,
      },
      {
        label: "Sustainability",
        name: "Sustainability",
        title: "Sustainability",
        url: "/sustainability",
        href: "/sustainability",
        path: "/sustainability",
        fallbackIcon: "IconLeaf",
        sortOrder: 4,
        isActive: true,
      },
      {
        label: "Technology",
        name: "Technology",
        title: "Technology",
        url: "/technology",
        href: "/technology",
        path: "/technology",
        fallbackIcon: "IconCpu",
        sortOrder: 5,
        isActive: true,
      },
      {
        label: "About",
        name: "About",
        title: "About",
        url: "/about",
        href: "/about",
        path: "/about",
        fallbackIcon: "IconInfoCircle",
        sortOrder: 6,
        isActive: true,
      },
      {
        label: "Contact",
        name: "Contact",
        title: "Contact",
        url: "/contact",
        href: "/contact",
        path: "/contact",
        fallbackIcon: "IconMessage",
        sortOrder: 7,
        isActive: true,
      },
    ]);

    const footerRows = await db.select().from(footerConfiguration).limit(1);
    const footerData = {
      companyName: "RUN APPAREL (PVT) LTD",
      companyAddress: "13 Km Daska Road, Sialkot, 51040, Pakistan",
      companyEmail: "team@wear-run.com",
      companyPhone: "+92 336 1777313",
      brandText: "RUN APPAREL",
      brandTagline: "The Extra Mile | For a Better Tomorrow | Never Look Back",
      brandSubtext: "Premium Sustainable B2B Sportswear Manufacturing",
      contactFormHeading: "PARTNER WITH RUN APPAREL",
      contactFormEnabled: true,
      navigationColumns: [
        {
          title: "Capabilities",
          links: [
            { label: "Team Wear", href: "/categories/team-wear" },
            { label: "Active Wear", href: "/categories/active-wear" },
            { label: "Casual Wear", href: "/categories/casual-wear" },
            { label: "Outer Wear", href: "/categories/outer-wear" },
            { label: "Sports Accessories", href: "/categories/sports-accessories" },
          ],
        },
        {
          title: "Manufacturing & R&D",
          links: [
            { label: "Manufacturing Scale", href: "/manufacturing" },
            { label: "Sustainability & Solar", href: "/sustainability" },
            { label: "Advanced Technology", href: "/technology" },
            { label: "Certifications", href: "/certifications" },
          ],
        },
        {
          title: "Company",
          links: [
            { label: "About Our Heritage", href: "/about" },
            { label: "Material Sourcing", href: "/fabrics" },
            { label: "Contact Engineering", href: "/contact" },
          ],
        },
      ],
      legalLinks: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Ethical Sourcing", href: "/ethical-sourcing" },
      ],
    };

    await db.insert(footerConfiguration).values(footerData);

    const contactConfigData = {
      title: "Contact RUN APPAREL",
      heroTitle: "Partner With Us for Precision B2B Manufacturing",
      description:
        "Connect directly with our engineering and production team in Sialkot, Pakistan for custom technical proposals, sample development, and bulk production quotes.",
      email: "team@wear-run.com",
      phone: "+92-336-1777313",
      address: "13 Km Daska Road, Sialkot, 51040, Pakistan",
      workingHours: "Monday - Friday: 08:00 - 18:00 PKT (WhatsApp Available 24/7)",
      formButtonText: "Request Technical Proposal",
      isActive: true,
    };

    await db.insert(contactPageConfigurations).values(contactConfigData);

    await db.delete(legalPolicies);
    await db.insert(legalPolicies).values([
      {
        slug: "privacy-policy",
        title: "Privacy Policy",
        content:
          "RUN APPAREL (PVT) LTD is committed to safeguarding client data, proprietary technical tech packs, and corporate information. We never share proprietary designs, custom molds, or partner data with third parties.",
        isActive: true,
      },
      {
        slug: "terms-and-conditions",
        title: "Terms and Conditions",
        content:
          "All B2B apparel manufacturing contracts are executed pursuant to agreed technical specifications, AQL 1.5 quality control criteria, and Incoterms 2020 international commercial trade standards.",
        isActive: true,
      },
      {
        slug: "ethical-sourcing",
        title: "Ethical Sourcing & Social Accountability Policy",
        content:
          "Our operations adhere strictly to SMETA 4-Pillar, SA8000, and BSCI social compliance standards. We guarantee safe working conditions, fair living wages, and zero child labor across all facilities.",
        isActive: true,
      },
    ]);

    const elapsed = Date.now() - startTime;
    console.log(
      `\n================================================================================`,
    );
    console.log(
      `🎉 [RUN APPAREL] Master Production Database Provisioned Successfully in ${elapsed}ms!`,
    );
    console.log(`   - Super Admin: ${adminEmail}`);
    console.log(
      `   - 5 Core Categories: Team Wear, Active Wear, Casual Wear, Outer Wear, Sports Accessories`,
    );
    console.log(`   - 100% Grounded in RUN APPAREL Master Prompt`);
    console.log(
      `================================================================================\n`,
    );
  } catch (error) {
    console.error("❌ [Seed Engine] Provisioning failed:", error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

seedProductionMaster();
