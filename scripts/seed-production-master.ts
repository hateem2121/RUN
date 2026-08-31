/**
 * RUN APPAREL — Master Production Database Seeding & Sanitization Engine
 *
 * 100% Grounded in 'RUN APPAREL Master Prompt.md', Company Profile & Catalogue.
 *
 * Actions:
 * 1. Purges all transient, mock, and test data (inquiries, newsletter subscribers, audit logs, animation errors).
 * 2. Purges and re-populates media_assets library with all WebP/PNG production images.
 * 3. Establishes the authoritative Super Admin (hateem@wear-run.com, M. Hateem Jamshaid Iqbal).
 * 4. Populates all 5 Core Apparel Categories linked to primary media assets.
 * 5. Populates comprehensive 17-product B2B catalog with authentic technical specifications, MOQs, lead times, and media gallery links.
 * 6. Populates 6 Technical Fabrics & 5 Certified Fibers with swatch image associations.
 * 7. Populates 10 verified compliance fixtures (SMETA, Sedex, OEKO-TEX, GOTS, GRS, ISO 9001, BSCI, TDAP, SECP) with certificate badges.
 * 8. Populates 4 authentic B2B blog articles with featured image references.
 * 9. Populates authentic CMS content across Homepage, Manufacturing, Sustainability, Technology, About (1889 heritage timeline), Footer, Navigation, and Contacts.
 */

import "dotenv/config";
import {
  aboutHero,
  aboutMapLocations,
  aboutSections,
  aboutTeamMessages,
  aboutTimelineEntries,
  auditLogs,
  blogCategories,
  blogPosts,
  categories,
  certificates,
  contactPageConfigurations,
  fabricCompositions,
  fabrics,
  fibers,
  folders,
  footerConfiguration,
  homepageFeaturedProductsSettings,
  homepageHero,
  homepageProcessCards,
  homepageSections,
  homepageSlogans,
  inquiries,
  legalPolicies,
  manufacturingCapabilities,
  manufacturingHero,
  manufacturingProcesses,
  manufacturingQualities,
  mediaAssets,
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

function createMediaItem(
  url: string,
  altText: string,
  tags: string[],
  caption?: string,
): typeof mediaAssets.$inferInsert {
  const filename = url.split("/").pop() || "asset.webp";
  const storagePath = url.startsWith("/") ? url.slice(1) : url;
  return {
    filename,
    originalName: filename,
    fileSize: 65536,
    size: 65536,
    mimeType: "image/webp",
    type: "image",
    url,
    thumbnailUrl: url,
    thumbnailFilename: filename,
    thumbnailStoragePath: storagePath,
    imageVariants: {
      thumbnail: url,
      medium: url,
      large: url,
      original: url,
    },
    storagePath,
    bucketName: "run-apparel-production-assets",
    folderId: null,
    tags,
    altText,
    caption: caption || altText,
    metadata: {},
    isActive: true,
  };
}

async function seedProductionMaster() {
  console.log("\n================================================================================");
  console.log("🏭 [RUN APPAREL] Master Production Database Provisioning Engine");
  console.log("   Grounding: RUN APPAREL Master Prompt (est. 1889, Sialkot, Pakistan)");
  console.log("================================================================================\n");

  const startTime = Date.now();

  try {
    // ── 0. SANITIZATION: Purge ALL transient, test, legacy & catalog data ────
    console.log(
      "🧹 [Sanitizer] Purging all transient, test, legacy, content, and media records...",
    );

    // Phase 0a: Transient tables
    await db.delete(inquiries);
    await db.delete(newsletterSubscribers);
    await db.delete(auditLogs);
    console.log("  ✓ Purged inquiries, newsletter subscribers, audit logs");

    // Phase 0b: Junction tables
    await db.delete(fabricCompositions);
    await db.delete(productRelations);
    console.log("  ✓ Purged fabric_compositions and product_relations junction tables");

    // Phase 0c: Blog posts & categories
    await db.delete(blogPosts);
    await db.delete(blogCategories);
    console.log("  ✓ Purged blog posts and blog categories");

    // Phase 0d: Content & CMS child tables (child -> parent)
    await db.delete(manufacturingQualities);
    await db.delete(manufacturingProcesses);
    await db.delete(manufacturingCapabilities);
    await db.delete(sustainabilityMetrics);
    await db.delete(sustainabilityInitiatives);
    await db.delete(sustainabilityGoals);
    await db.delete(technologyInnovations);
    await db.delete(technologyEquipment);
    await db.delete(aboutTimelineEntries);
    await db.delete(aboutMapLocations);
    await db.delete(aboutSections);
    await db.delete(aboutTeamMessages);
    await db.delete(homepageSlogans);
    await db.delete(homepageProcessCards);
    await db.delete(homepageSections);
    console.log("  ✓ Purged all CMS child components");

    // Phase 0e: Catalog tables (child → parent order)
    await db.delete(products);
    console.log("  ✓ Purged ALL products (will re-seed 17 canonical B2B fixtures)");
    await db.delete(categories);
    console.log("  ✓ Purged ALL categories (will re-seed exactly 5 core categories)");
    await db.delete(certificates);
    console.log("  ✓ Purged ALL certificates (will re-seed 10 backed compliance fixtures)");
    await db.delete(fabrics);
    console.log("  ✓ Purged ALL fabrics (will re-seed 6 technical fabric fixtures)");
    await db.delete(fibers);
    console.log("  ✓ Purged ALL fibers (will re-seed 5 certified fiber fixtures)");

    // Phase 0f: Stale sessions
    await db.delete(sessions);
    console.log("  ✓ Purged all stale sessions");

    // Phase 0g: Hero & Configuration singletons
    await db.delete(homepageHero);
    await db.delete(homepageFeaturedProductsSettings);
    await db.delete(manufacturingHero);
    await db.delete(sustainabilityHero);
    await db.delete(technologyHero);
    await db.delete(aboutHero);
    await db.delete(footerConfiguration);
    await db.delete(contactPageConfigurations);
    await db.delete(navigationItems);
    await db.delete(legalPolicies);
    console.log("  ✓ Purged all hero, settings, and configuration singleton tables");

    // Phase 0h: Media assets & Folders (now safe after all referencing rows are deleted)
    await db.delete(mediaAssets);
    await db.delete(folders);
    console.log("  ✓ Purged all media_assets and folders");

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
      profileImageUrl: "/images/about/hateem-jamshaid.webp",
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

    // ── 2. MEDIA ASSETS: Dedicated Central Library Seeding ───────────────────
    console.log("\n🖼️ [Media] Provisioning Media Assets Library...");
    const rawMediaAssets: (typeof mediaAssets.$inferInsert)[] = [
      // 1. Categories (5)
      createMediaItem(
        "/images/categories/team-wear.webp",
        "Team Wear Category - Professional Custom Athletic Uniforms & Wetsuits",
        ["category", "team-wear", "b2b"],
      ),
      createMediaItem(
        "/images/categories/active-wear.webp",
        "Active Wear Category - Compressive Seamless Motion Apparel",
        ["category", "active-wear", "seamless"],
      ),
      createMediaItem(
        "/images/categories/casual-wear.webp",
        "Casual Wear Category - Organic Cotton Heavyweight Lifestyle Apparel",
        ["category", "casual-wear", "gots-organic"],
      ),
      createMediaItem(
        "/images/categories/outer-wear.webp",
        "Outer Wear Category - Technical 3-Layer Weatherproof Shells & Sherpa",
        ["category", "outer-wear", "waterproof"],
      ),
      createMediaItem(
        "/images/categories/sports-accessories.webp",
        "Sports Accessories Category - Powerlifting Belts & Performance Gloves",
        ["category", "accessories", "gym-gear"],
      ),

      // 2. Products (17 + variants)
      createMediaItem(
        "/images/products/pro-sublimated-soccer-match-kit.webp",
        "Pro Sublimated Soccer Match Kit - Italian Inks & Mesh Panels",
        ["product", "team-wear", "soccer", "sublimation"],
      ),
      createMediaItem(
        "/images/products/aero-team-cycling-jersey-bib-set.webp",
        "Aero Team Cycling Jersey & Bib Set - AeroWeave Boundary Layer Mesh",
        ["product", "team-wear", "cycling", "aerodynamic"],
      ),
      createMediaItem(
        "/images/products/championship-tennis-court-polo-skirt.webp",
        "Championship Tennis Court Polo & Skirt Set - Moisture Wicking Pique",
        ["product", "team-wear", "tennis", "b2b"],
      ),
      createMediaItem(
        "/images/products/gridiron-elite-football-uniform.webp",
        "Gridiron Elite Football Uniform - Reinforced Yoke & Heavy Dazzle",
        ["product", "team-wear", "football", "durable"],
      ),
      createMediaItem(
        "/images/products/wetsuit-edition-hydro-flex-3-2mm-scuba-suit.webp",
        "Wetsuit Edition Hydro-Flex 3/2mm Scuba Suit - Limestone Eco-Neoprene",
        ["product", "team-wear", "wetsuit", "scuba"],
      ),
      createMediaItem(
        "/images/products/biomechanical-high-impact-sports-bra.webp",
        "Biomechanical High-Impact Sports Bra - Encapsulated Molded Support",
        ["product", "active-wear", "sports-bra", "high-impact"],
      ),
      createMediaItem(
        "/images/products/hydro-dri-aerobic-compression-top.webp",
        "Hydro-Dri Aerobic Compression Top - Targeted Mesh Ventilation",
        ["product", "active-wear", "compression", "base-layer"],
      ),
      createMediaItem(
        "/images/products/pro-compression-seamless-training-tights.webp",
        "Pro-Compression Seamless Training Tights - Santoni Circular Knit",
        ["product", "active-wear", "seamless", "tights"],
      ),
      createMediaItem(
        "/images/products/kinetic-seamless-motion-suit.webp",
        "Kinetic Seamless Motion Suit - Full Body Ergonomic Zonal Support",
        ["product", "active-wear", "full-body", "seamless"],
      ),
      createMediaItem(
        "/images/products/heritage-organic-cotton-heavyweight-hoodie.webp",
        "Heritage Organic Cotton Heavyweight Hoodie - 450 GSM French Terry",
        ["product", "casual-wear", "hoodie", "organic-cotton"],
      ),
      createMediaItem(
        "/images/products/engineered-pique-performance-polo.webp",
        "Engineered Pique Performance Polo - Anti-Curl Collar & Quick Dry",
        ["product", "casual-wear", "polo", "corporate"],
      ),
      createMediaItem(
        "/images/products/gots-organic-cotton-heavyweight-tee.webp",
        "GOTS Organic Cotton Heavyweight Tee - 240 GSM Combed Jersey",
        ["product", "casual-wear", "t-shirt", "gots-organic"],
      ),
      createMediaItem(
        "/images/products/tapered-fleece-training-tracksuit.webp",
        "Tapered Fleece Training Tracksuit - Brushed Interior & Custom Trim",
        ["product", "casual-wear", "tracksuit", "fleece"],
      ),
      createMediaItem(
        "/images/products/alpine-storm-shield-3-layer-shell-jacket.webp",
        "Alpine Storm-Shield 3-Layer Shell Jacket - 20K/20K HydroShield Membrane",
        ["product", "outer-wear", "shell-jacket", "waterproof"],
      ),
      createMediaItem(
        "/images/products/high-loft-thermal-sherpa-fleece-jacket.webp",
        "High-Loft Thermal Sherpa Fleece Jacket - Deep Pile Recycled Fleece",
        ["product", "outer-wear", "sherpa", "thermal"],
      ),
      createMediaItem(
        "/images/products/precision-grip-weightlifting-gloves.webp",
        "Precision Grip Weightlifting Gloves - Silicone Palm & 18in Wrist Wrap",
        ["product", "accessories", "gloves", "strength"],
      ),
      createMediaItem(
        "/images/products/olympic-powerlifting-leather-belt.webp",
        "Olympic Powerlifting Leather Belt - 10mm Top-Grain Cowhide & Steel Lever",
        ["product", "accessories", "belt", "powerlifting"],
      ),
      createMediaItem(
        "/images/products/pro-team-jersey.webp",
        "Pro Team Jersey - Sublimated Technical Teamwear",
        ["product", "team-wear", "jersey"],
      ),
      createMediaItem(
        "/images/products/aero-tech-shell.webp",
        "Aero Tech Shell - Waterproof Technical Alpine Shell",
        ["product", "outer-wear", "shell"],
      ),
      createMediaItem(
        "/images/products/seamless-compression-tight.webp",
        "Seamless Compression Tight - Circular Knit Active Leggings",
        ["product", "active-wear", "leggings"],
      ),
      createMediaItem(
        "/images/products/hydro-dri-base.webp",
        "Hydro Dri Base - Moisture Wicking Performance Base Layer",
        ["product", "active-wear", "base-layer"],
      ),
      createMediaItem(
        "/images/products/thermal-storm-hoodie.webp",
        "Thermal Storm Hoodie - Heavyweight Brushed Cotton Fleece",
        ["product", "casual-wear", "hoodie"],
      ),

      // 3. Certificates (10)
      createMediaItem(
        "/images/certificates/smeta.webp",
        "SMETA 4-Pillar Ethical Trade Audit Certification Badge",
        ["certificate", "compliance", "smeta", "sedex"],
      ),
      createMediaItem(
        "/images/certificates/sedex.webp",
        "Sedex Supply Chain Transparency Member Badge",
        ["certificate", "compliance", "sedex"],
      ),
      createMediaItem(
        "/images/certificates/oeko-tex.webp",
        "OEKO-TEX Standard 100 Non-Toxic Chemical Safety Badge",
        ["certificate", "sustainability", "oeko-tex"],
      ),
      createMediaItem(
        "/images/certificates/made-in-green.webp",
        "OEKO-TEX Made in Green Traceable Production Badge",
        ["certificate", "sustainability", "made-in-green"],
      ),
      createMediaItem(
        "/images/certificates/gots.webp",
        "GOTS Global Organic Textile Standard Ecosystem Badge",
        ["certificate", "sustainability", "gots", "organic"],
      ),
      createMediaItem(
        "/images/certificates/grs.webp",
        "GRS Global Recycled Standard Chain-of-Custody Badge",
        ["certificate", "sustainability", "grs", "recycled"],
      ),
      createMediaItem(
        "/images/certificates/iso-9001.webp",
        "ISO 9001:2015 Quality Management System Certification Badge",
        ["certificate", "quality", "iso-9001"],
      ),
      createMediaItem(
        "/images/certificates/bsci.webp",
        "amfori BSCI Social Compliance System Member Badge",
        ["certificate", "compliance", "bsci"],
      ),
      createMediaItem(
        "/images/certificates/tdap.webp",
        "TDAP Trade Development Authority of Pakistan Export Registry",
        ["certificate", "compliance", "tdap"],
      ),
      createMediaItem(
        "/images/certificates/secp.webp",
        "SECP Corporate Entity Registration Badge",
        ["certificate", "compliance", "secp"],
      ),

      // 4. Fabrics (6)
      createMediaItem(
        "/images/fabrics/aeroweave-mesh.webp",
        "AeroWeave Technical Mesh Fabric Swatch",
        ["fabric", "mesh", "aerodynamic"],
      ),
      createMediaItem(
        "/images/fabrics/hydroshield-membrane.webp",
        "HydroShield Bio-Membrane Waterproof Fabric Swatch",
        ["fabric", "membrane", "waterproof"],
      ),
      createMediaItem(
        "/images/fabrics/ecotech-cotton.webp",
        "EcoTech Organic Cotton Interlock Fabric Swatch",
        ["fabric", "cotton", "organic"],
      ),
      createMediaItem(
        "/images/fabrics/flexiweave-knit.webp",
        "FlexiWeave Compression Knit Fabric Swatch",
        ["fabric", "compression", "seamless"],
      ),
      createMediaItem(
        "/images/fabrics/merinoshield-thermal.webp",
        "MerinoShield Thermal Blend Wool Fabric Swatch",
        ["fabric", "wool", "merino", "thermal"],
      ),
      createMediaItem(
        "/images/fabrics/hydro-flex-neoprene.webp",
        "Hydro-Flex Limestone Eco-Neoprene Swatch",
        ["fabric", "neoprene", "wetsuit"],
      ),
      createMediaItem("/images/fabrics/dri-fit-mesh.webp", "Dri-Fit Mesh Technical Swatch", [
        "fabric",
        "mesh",
      ]),
      createMediaItem("/images/fabrics/cordura-nylon.webp", "Cordura High-Tenacity Nylon Swatch", [
        "fabric",
        "nylon",
      ]),
      createMediaItem("/images/fabrics/organic-fleece.webp", "Organic Heavyweight Fleece Swatch", [
        "fabric",
        "fleece",
      ]),
      createMediaItem("/images/fabrics/merino-blend.webp", "Merino Blend Active Swatch", [
        "fabric",
        "wool",
      ]),

      // 5. Blog Articles (4)
      createMediaItem(
        "/images/blog/solar-powered-manufacturing.webp",
        "Decarbonizing Athletic Apparel: 80% Solar Infrastructure Facility",
        ["blog", "sustainability", "solar", "manufacturing"],
      ),
      createMediaItem(
        "/images/blog/circular-polyester-supply-chain.webp",
        "Circular Polyester & GOTS Supply Chain Integrity in B2B Sportswear",
        ["blog", "materials", "grs", "gots"],
      ),
      createMediaItem(
        "/images/blog/santoni-seamless-knitting-tech.webp",
        "Santoni Seamless Circular Knitting Biomechanical Compression Tech",
        ["blog", "technology", "santoni", "seamless"],
      ),
      createMediaItem(
        "/images/blog/smeta-ethical-compliance-guide.webp",
        "SMETA 4-Pillar Ethical Trade Audit & Factory Social Governance",
        ["blog", "compliance", "smeta", "ethics"],
      ),

      // 6. Homepage & Heroes
      createMediaItem(
        "/images/homepage/hero-1.webp",
        "High-Performance Athletic Apparel Engineering Hero",
        ["homepage", "hero"],
      ),
      createMediaItem(
        "/images/homepage/hero-2.webp",
        "Vertical Manufacturing Campus Overview Hero",
        ["homepage", "hero"],
      ),
      createMediaItem(
        "/images/homepage/process-1.webp",
        "Certified Sustainable Sourcing Process Step",
        ["homepage", "process"],
      ),
      createMediaItem("/images/homepage/process-2.webp", "Precision 3D Engineering Process Step", [
        "homepage",
        "process",
      ]),
      createMediaItem(
        "/images/homepage/process-3.webp",
        "Automated Assembly & Laser Bonding Process Step",
        ["homepage", "process"],
      ),
      createMediaItem(
        "/images/homepage/process-4.webp",
        "AQL 1.5 Quality Inspection & Export Process Step",
        ["homepage", "process"],
      ),
      createMediaItem(
        "/images/homepage/stats-bg.webp",
        "Manufacturing Facility Performance Stats Background",
        ["homepage", "stats"],
      ),
      createMediaItem(
        "/images/homepage/values-1.webp",
        "135+ Years Craftsmanship Heritage Value Card",
        ["homepage", "values"],
      ),
      createMediaItem("/images/homepage/values-2.webp", "80% Solar Energy Transition Value Card", [
        "homepage",
        "values",
      ]),
      createMediaItem(
        "/images/homepage/values-3.webp",
        "Biomechanical Computational Construction Value Card",
        ["homepage", "values"],
      ),
      createMediaItem(
        "/images/homepage/values-4.webp",
        "Global Tier-1 Export Partnerships Value Card",
        ["homepage", "values"],
      ),

      // 7. Manufacturing & Sustainability Heroes & Steps
      createMediaItem(
        "/images/manufacturing/facility-solar-overview.webp",
        "193,000+ sqm Vertical Manufacturing Campus with Rooftop Solar",
        ["manufacturing", "campus", "solar"],
      ),
      createMediaItem(
        "/images/manufacturing/laser-cutting.webp",
        "Lectra Automated CNC Laser Cutting Line",
        ["manufacturing", "cutting", "machinery"],
      ),
      createMediaItem(
        "/images/manufacturing/automated-sewing.webp",
        "200+ High-Precision Sewing Workstations",
        ["manufacturing", "sewing", "assembly"],
      ),
      createMediaItem(
        "/images/manufacturing/quality-testing-lab.webp",
        "In-House Textile Tensile & Colorfastness Testing Lab",
        ["manufacturing", "quality", "lab"],
      ),
      createMediaItem(
        "/images/manufacturing/export-logistics.webp",
        "Global Logistics & Barcoded Container Dispatch",
        ["manufacturing", "logistics", "export"],
      ),
      createMediaItem(
        "/images/manufacturing/process-sourcing.webp",
        "Material Sourcing & Pre-Treatment Inspection",
        ["manufacturing", "process"],
      ),
      createMediaItem(
        "/images/manufacturing/process-laser-cutting.webp",
        "Algorithmic Pattern Nesting & Precision Cutting",
        ["manufacturing", "process"],
      ),
      createMediaItem(
        "/images/manufacturing/process-assembly.webp",
        "Precision Overlock & Flatlock Seam Assembly",
        ["manufacturing", "process"],
      ),
      createMediaItem(
        "/images/manufacturing/process-finishing.webp",
        "Final Finishing, Steam Pressing & Traceability",
        ["manufacturing", "process"],
      ),
      createMediaItem(
        "/images/manufacturing/process-digital-cad.webp",
        "3D Virtual Sampling & CAD Pattern Engineering",
        ["manufacturing", "process"],
      ),
      createMediaItem(
        "/images/sustainability/solar-rooftop.webp",
        "Clean Renewable Solar Rooftop Array",
        ["sustainability", "solar"],
      ),
      createMediaItem(
        "/images/sustainability/organic-cotton.webp",
        "GOTS Certified Organic Cotton Fiber Cultivation",
        ["sustainability", "cotton"],
      ),
      createMediaItem(
        "/images/sustainability/recycled-polyester.webp",
        "GRS Certified Recycled PET Polymer Pellets",
        ["sustainability", "recycled"],
      ),

      // 8. About & Technology
      createMediaItem(
        "/images/about/hq-campus.webp",
        "RUN APPAREL Headquarters & Manufacturing Complex Sialkot",
        ["about", "campus", "headquarters"],
      ),
      createMediaItem(
        "/images/about/master-craftsmen.webp",
        "Master Artisans & Technical Garment Engineers",
        ["about", "craftsmen", "heritage"],
      ),
      createMediaItem(
        "/images/about/heritage-1889.webp",
        "1889 Foundational Leather Crafting Origins",
        ["about", "heritage", "history"],
      ),
      createMediaItem(
        "/images/about/hateem-jamshaid.webp",
        "M. Hateem Jamshaid Iqbal - CEO & 4th Generation Director",
        ["about", "team", "executive"],
      ),
      createMediaItem(
        "/images/technology/3d-digital-twin.webp",
        "3D Digital Twin Garment Simulation & Stress Modeling",
        ["technology", "3d-twin", "cad"],
      ),
      createMediaItem(
        "/images/technology/seamless-knitting.webp",
        "Santoni Circular Seamless Knitting Machinery",
        ["technology", "santoni", "knitting"],
      ),
      createMediaItem(
        "/images/technology/automated-inspection.webp",
        "Automated In-Line Optical Quality Inspection",
        ["technology", "inspection", "quality"],
      ),

      // 9. Gallery Assets (6)
      createMediaItem(
        "/images/gallery/cotton-blending.webp",
        "Organic Cotton Fiber Blending & Spinning",
        ["gallery", "spinning"],
      ),
      createMediaItem(
        "/images/gallery/pattern-cuts.webp",
        "Precision Pattern Nesting & Laser Cut Panels",
        ["gallery", "cutting"],
      ),
      createMediaItem(
        "/images/gallery/performance-fitting.webp",
        "Biomechanical Athlete Performance Fit Session",
        ["gallery", "fitting"],
      ),
      createMediaItem(
        "/images/gallery/precision-knitting.webp",
        "Santoni High-Gauge Seamless Tubular Knitting",
        ["gallery", "knitting"],
      ),
      createMediaItem(
        "/images/gallery/seam-sealing.webp",
        "Ultrasonic Seam Bonding & Waterproof Seam Taping",
        ["gallery", "bonding"],
      ),
      createMediaItem(
        "/images/gallery/teamwear-printing.webp",
        "Italian Sublimation Ink Transfer Printing",
        ["gallery", "sublimation"],
      ),

      // 10. Placeholders
      createMediaItem(
        "/images/placeholders/category-placeholder.webp",
        "Category Placeholder Asset",
        ["placeholder", "category"],
      ),
      createMediaItem(
        "/images/placeholders/product-placeholder.webp",
        "Product Placeholder Asset",
        ["placeholder", "product"],
      ),
      createMediaItem(
        "/images/placeholders/certificate-placeholder.webp",
        "Certificate Placeholder Asset",
        ["placeholder", "certificate"],
      ),
      createMediaItem("/images/placeholders/fabric-placeholder.webp", "Fabric Placeholder Asset", [
        "placeholder",
        "fabric",
      ]),
      createMediaItem("/images/placeholders/blog-placeholder.webp", "Blog Placeholder Asset", [
        "placeholder",
        "blog",
      ]),
      createMediaItem("/images/placeholders/avatar-placeholder.webp", "Avatar Placeholder Asset", [
        "placeholder",
        "avatar",
      ]),
    ];

    const mediaMap = new Map<string, number>();

    for (const item of rawMediaAssets) {
      const [inserted] = await db.insert(mediaAssets).values(item).returning();
      mediaMap.set(item.url, inserted.id);
    }
    console.log(`  ✓ Configured ${mediaMap.size} Media Asset records in centralized library`);

    // ── 3. THE 5 CORE APPAREL CATEGORIES ─────────────────────────────────────
    console.log("\n📦 [Catalog] Provisioning 5 Core Apparel Categories...");
    const categoryFixtures = [
      {
        name: "Team Wear",
        slug: "team-wear",
        description:
          "High-performance uniforms for cycling, tennis, American football, soccer, and surf; featuring the specialized Wetsuit Edition line.",
        imageUrl: "/images/categories/team-wear.webp",
        bannerUrl: "/images/categories/team-wear.webp",
        primaryImageId: mediaMap.get("/images/categories/team-wear.webp"),
        metaTitle: "B2B Team Wear Manufacturing | RUN APPAREL",
        metaDescription:
          "Custom sublimated soccer match kits, aerodynamic cycling jerseys, tennis uniforms, and technical wetsuits engineered for professional teams.",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Active Wear",
        slug: "active-wear",
        description:
          "Engineered sports bras, compression training tops, athletic leggings, and seamless full-body motion suits.",
        imageUrl: "/images/categories/active-wear.webp",
        bannerUrl: "/images/categories/active-wear.webp",
        primaryImageId: mediaMap.get("/images/categories/active-wear.webp"),
        metaTitle: "Active Wear & Seamless Apparel Manufacturing | RUN APPAREL",
        metaDescription:
          "High-impact sports bras, circular knit seamless compression leggings, and motion suits manufactured on Santoni machinery.",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Casual Wear",
        slug: "casual-wear",
        description:
          "Premium sustainable organic cotton T-shirts, pique polos, heavyweight French Terry sweatshirts, hoodies, and tapered tracksuits.",
        imageUrl: "/images/categories/casual-wear.webp",
        bannerUrl: "/images/categories/casual-wear.webp",
        primaryImageId: mediaMap.get("/images/categories/casual-wear.webp"),
        metaTitle: "Sustainable Casual Wear & Heavyweight Hoodies | RUN APPAREL",
        metaDescription:
          "GOTS certified organic cotton 450 GSM hoodies, French Terry tracksuits, and performance pique polos for premium lifestyle brands.",
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "Outer Wear",
        slug: "outer-wear",
        description:
          "Weather-resistant technical windbreakers, high-loft thermal sherpa jackets, ultralight puffer jackets, ski wear, and heritage leather jackets.",
        imageUrl: "/images/categories/outer-wear.webp",
        bannerUrl: "/images/categories/outer-wear.webp",
        primaryImageId: mediaMap.get("/images/categories/outer-wear.webp"),
        metaTitle: "Technical Outer Wear & 3-Layer Shells | RUN APPAREL",
        metaDescription:
          "20K/20K waterproof breathable storm jackets, thermal sherpa fleece, and heritage leather jackets engineered with fully taped seams.",
        isActive: true,
        sortOrder: 4,
      },
      {
        name: "Sports Accessories",
        slug: "sports-accessories",
        description:
          "Elite performance weightlifting gloves, reinforced power belts, moisture-wicking wristbands, technical running caps, and branded athletic gear.",
        imageUrl: "/images/categories/sports-accessories.webp",
        bannerUrl: "/images/categories/sports-accessories.webp",
        primaryImageId: mediaMap.get("/images/categories/sports-accessories.webp"),
        metaTitle: "Sports Accessories & Strength Gear | RUN APPAREL",
        metaDescription:
          "Handcrafted 10mm top-grain leather powerlifting belts, silicone grip gym gloves, and custom branded athletic accessories.",
        isActive: true,
        sortOrder: 5,
      },
    ];

    const categoryMap = new Map<string, number>();

    for (const cat of categoryFixtures) {
      const [inserted] = await db.insert(categories).values(cat).returning();
      categoryMap.set(cat.slug, inserted.id);
    }
    console.log(`  ✓ Configured ${categoryMap.size} Core B2B Apparel Categories with Media Assets`);

    // ── 4. TECHNICAL FABRICS & CERTIFIED FIBERS ──────────────────────────────
    console.log("\n🧵 [Materials] Provisioning Technical Fabrics & Sustainable Fibers...");
    const fabricFixtures = [
      {
        name: "AeroWeave™ Technical Mesh",
        description: "Engineered boundary-layer reduction mesh for high-speed aerodynamics.",
        fabricType: "Warp Knit Mesh",
        sport: "Cycling / Running",
        marketSegment: "Elite Performance",
        seasonality: "All-Season",
        weight: "135 GSM",
        weave: "Warp Knit Micro-Dimpled",
        weaveType: "Warp Knit",
        stretch: "4-Way Compressive",
        finishTreatment: "Aerodynamic Hydrophilic Bio-Finish",
        sustainabilityScore: 4,
        certifications: ["GRS", "OEKO-TEX Standard 100"],
        visualSwatchId: mediaMap.get("/images/fabrics/aeroweave-mesh.webp"),
        keyApplications: ["Cycling Jerseys", "Speed Skating", "Aerodynamic Running Tops"],
        isActive: true,
      },
      {
        name: "HydroShield™ Bio-Membrane",
        description:
          "PFAS-free durable water-repellent breathable membrane for technical outerwear.",
        fabricType: "3-Layer Composite",
        sport: "Outdoor / Alpine",
        marketSegment: "Technical Mountain",
        seasonality: "Winter / All-Weather",
        weight: "175 GSM",
        weave: "Ripstop Laminate",
        weaveType: "3-Layer",
        stretch: "2-Way Mechanical",
        finishTreatment: "C0 PFAS-Free Bio-DWR",
        sustainabilityScore: 5,
        certifications: ["OEKO-TEX Made in Green", "GRS"],
        visualSwatchId: mediaMap.get("/images/fabrics/hydroshield-membrane.webp"),
        keyApplications: ["Alpine Shells", "Storm Windbreakers", "Ski Jackets"],
        isActive: true,
      },
      {
        name: "EcoTech Organic Cotton Interlock",
        description: "100% GOTS certified organic combed cotton with superior tensile strength.",
        fabricType: "Double Knit Interlock",
        sport: "Lifestyle / Training",
        marketSegment: "Premium Sustainable",
        seasonality: "All-Season",
        weight: "240 GSM",
        weave: "Double Knit Interlock",
        weaveType: "Interlock",
        stretch: "Natural Mechanical",
        finishTreatment: "Carbon Peached Bio-Softness",
        sustainabilityScore: 5,
        certifications: ["GOTS", "OEKO-TEX Standard 100"],
        visualSwatchId: mediaMap.get("/images/fabrics/ecotech-cotton.webp"),
        keyApplications: ["Heavyweight Tees", "Premium Polos", "French Terry Hoodies"],
        isActive: true,
      },
      {
        name: "FlexiWeave™ Compression Knit",
        description: "Four-way stretch warp knit designed for maximum muscle support and recovery.",
        fabricType: "Circular Seamless Knit",
        sport: "Fitness / Training",
        marketSegment: "Athletic Performance",
        seasonality: "All-Season",
        weight: "280 GSM",
        weave: "Tubular Seamless",
        weaveType: "Seamless Knit",
        stretch: "4-Way Ergonomic High-Recovery",
        finishTreatment: "Anti-Chafing Smooth Finish",
        sustainabilityScore: 4,
        certifications: ["GRS", "OEKO-TEX Standard 100"],
        visualSwatchId: mediaMap.get("/images/fabrics/flexiweave-knit.webp"),
        keyApplications: ["Compression Tights", "Sports Bras", "Motion Suits"],
        isActive: true,
      },
      {
        name: "MerinoShield™ Thermal Blend",
        description:
          "Natural moisture-regulating merino wool blended with recycled synthetic fibers.",
        fabricType: "Thermal Single Jersey",
        sport: "Alpine / Trail Running",
        marketSegment: "Premium Outdoor",
        seasonality: "Fall / Winter",
        weight: "200 GSM",
        weave: "Single Jersey",
        weaveType: "Jersey",
        stretch: "2-Way Natural",
        finishTreatment: "Anti-Odor Natural Lanolin",
        sustainabilityScore: 5,
        certifications: ["Ethical Wool Standard", "OEKO-TEX Standard 100"],
        visualSwatchId: mediaMap.get("/images/fabrics/merinoshield-thermal.webp"),
        keyApplications: ["Thermal Base Layers", "Running Hoodies", "Cold Weather Polos"],
        isActive: true,
      },
      {
        name: "Hydro-Flex Neoprene (Wetsuit Edition)",
        description: "Limestone-based eco-neoprene with thermal plush lining and sealed seams.",
        fabricType: "Limestone Closed-Cell Foam",
        sport: "Surfing / Scuba / Watersports",
        marketSegment: "Marine Grade",
        seasonality: "All-Season Marine",
        weight: "3mm / 2mm Dual-Gauge",
        weave: "Cellular Foam with Recycled Nylon Lamination",
        weaveType: "Laminate",
        stretch: "4-Way Super-Stretch",
        finishTreatment: "Hydrophobic Thermal Seal",
        sustainabilityScore: 4,
        certifications: ["RoHS Compliant", "REACH Certified"],
        visualSwatchId: mediaMap.get("/images/fabrics/hydro-flex-neoprene.webp"),
        keyApplications: ["Scuba Suits", "Surfing Wetsuits", "Cropped Swimwear"],
        isActive: true,
      },
    ];

    const fabricMap = new Map<string, number>();
    for (const fab of fabricFixtures) {
      const [inserted] = await db.insert(fabrics).values(fab).returning();
      fabricMap.set(fab.name, inserted.id);
    }

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
      `  ✓ Configured ${fabricFixtures.length} Fabrics and ${fiberFixtures.length} Fibers with Media Swatches`,
    );

    // ── 5. BACKED COMPLIANCE & CERTIFICATION FIXTURES ────────────────────────
    console.log("\n📜 [Compliance] Provisioning Ecosystem Certifications (Durus Backed)...");
    const certificateFixtures = [
      {
        slug: "smeta",
        name: "SMETA Ethical Audit",
        type: "compliance",
        issuingOrganization: "Sedex Information Exchange",
        issuingBody: "Sedex (Ref: ZAA600143761)",
        description:
          "Comprehensive 4-Pillar ethical audit covering labor standards, health & safety, environment, and business ethics. Latest audit July 2025.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/smeta-audit-summary.pdf",
        imageUrl: "/images/certificates/smeta.webp",
        imageId: mediaMap.get("/images/certificates/smeta.webp"),
        status: "active",
        isActive: true,
      },
      {
        slug: "sedex",
        name: "Sedex Member",
        type: "compliance",
        issuingOrganization: "Sedex",
        issuingBody: "Sedex Global",
        description:
          "Registered Sedex membership (Ref: ZC5000065244) for complete supply chain transparency.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/sedex-membership-summary.pdf",
        imageUrl: "/images/certificates/sedex.webp",
        imageId: mediaMap.get("/images/certificates/sedex.webp"),
        status: "active",
        isActive: true,
      },
      {
        slug: "oeko-tex",
        name: "OEKO-TEX Standard 100",
        type: "sustainability",
        issuingOrganization: "International OEKO-TEX Association",
        issuingBody: "OEKO-TEX Association",
        description:
          "Tested and certified free from harmful chemical substances across all yarn, fabric, and trim components.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/oeko-tex-standard-100-summary.pdf",
        imageUrl: "/images/certificates/oeko-tex.webp",
        imageId: mediaMap.get("/images/certificates/oeko-tex.webp"),
        status: "active",
        isActive: true,
      },
      {
        slug: "made-in-green",
        name: "OEKO-TEX Made in Green",
        type: "sustainability",
        issuingOrganization: "OEKO-TEX Association",
        issuingBody: "OEKO-TEX Association",
        description:
          "Traceable product label verifying sustainable production facilities and socially responsible workplaces.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/oeko-tex-made-in-green-summary.pdf",
        imageUrl: "/images/certificates/made-in-green.webp",
        imageId: mediaMap.get("/images/certificates/made-in-green.webp"),
        status: "active",
        isActive: true,
      },
      {
        slug: "gots",
        name: "GOTS",
        type: "sustainability",
        issuingOrganization: "GOTS International Working Group",
        issuingBody: "GOTS Working Group",
        description:
          "Ecosystem certification for organic fibers including ecological and social criteria throughout processing.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/gots-summary.pdf",
        imageUrl: "/images/certificates/gots.webp",
        imageId: mediaMap.get("/images/certificates/gots.webp"),
        status: "active",
        isActive: true,
      },
      {
        slug: "grs",
        name: "GRS",
        type: "sustainability",
        issuingOrganization: "Textile Exchange",
        issuingBody: "Textile Exchange",
        description:
          "Chain of custody tracking verifying recycled content, environmental management, and chemical restrictions.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/grs-summary.pdf",
        imageUrl: "/images/certificates/grs.webp",
        imageId: mediaMap.get("/images/certificates/grs.webp"),
        status: "active",
        isActive: true,
      },
      {
        slug: "iso-9001",
        name: "ISO 9001:2015",
        type: "quality",
        issuingOrganization: "International Organization for Standardization",
        issuingBody: "ISO Certification Body",
        description:
          "Standardized quality management system ensuring consistent product excellence and rigorous AQL 1.5 protocols.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/iso-9001-summary.pdf",
        imageUrl: "/images/certificates/iso-9001.webp",
        imageId: mediaMap.get("/images/certificates/iso-9001.webp"),
        status: "active",
        isActive: true,
      },
      {
        slug: "bsci",
        name: "BSCI Member",
        type: "compliance",
        issuingOrganization: "amfori BSCI",
        issuingBody: "amfori",
        description:
          "Ecosystem compliance monitoring fair remuneration, workplace safety, and zero discrimination across facilities.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/bsci-summary.pdf",
        imageUrl: "/images/certificates/bsci.webp",
        imageId: mediaMap.get("/images/certificates/bsci.webp"),
        status: "active",
        isActive: true,
      },
      {
        slug: "tdap",
        name: "TDAP Registered",
        type: "compliance",
        issuingOrganization: "Government of Pakistan",
        issuingBody: "TDAP",
        description:
          "Official export registration verifying accredited international commercial shipping status.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/tdap-export-registry.pdf",
        imageUrl: "/images/certificates/tdap.webp",
        imageId: mediaMap.get("/images/certificates/tdap.webp"),
        status: "active",
        isActive: true,
      },
      {
        slug: "secp",
        name: "SECP Registered",
        type: "compliance",
        issuingOrganization: "Government of Pakistan",
        issuingBody: "SECP",
        description: "Corporate legal entity registration: RUN APPAREL (PVT) LTD.",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/secp-corporate-incorporation.pdf",
        imageUrl: "/images/certificates/secp.webp",
        imageId: mediaMap.get("/images/certificates/secp.webp"),
        status: "active",
        isActive: true,
      },
    ];

    const certMap = new Map<string, number>();
    for (const cert of certificateFixtures) {
      const { slug, ...certRow } = cert;
      const [inserted] = await db.insert(certificates).values(certRow).returning();
      certMap.set(slug, inserted.id);
    }
    console.log(
      `  ✓ Configured ${certMap.size} Backed Certification Fixtures with Badges and Documents`,
    );

    // ── 6. 17 VERIFIED B2B PRODUCTS (ACROSS ALL 5 CATEGORIES) ────────────────
    console.log("\n👕 [Products] Provisioning 17 Authentic B2B Product Fixtures...");
    const teamWearId = categoryMap.get("team-wear")!;
    const activeWearId = categoryMap.get("active-wear")!;
    const casualWearId = categoryMap.get("casual-wear")!;
    const outerWearId = categoryMap.get("outer-wear")!;
    const accessoriesId = categoryMap.get("sports-accessories")!;

    const defaultCertIds = [
      certMap.get("smeta")!,
      certMap.get("oeko-tex")!,
      certMap.get("grs")!,
    ].filter(Boolean);

    const productFixtures = [
      // 1. Team Wear (5 Products)
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
        primaryImageId:
          mediaMap.get("/images/products/pro-sublimated-soccer-match-kit.webp") ||
          mediaMap.get("/images/products/pro-team-jersey.webp"),
        imageIds: [
          mediaMap.get("/images/products/pro-sublimated-soccer-match-kit.webp") ||
            mediaMap.get("/images/products/pro-team-jersey.webp")!,
          mediaMap.get("/images/gallery/teamwear-printing.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("AeroWeave™ Technical Mesh"),
        certificateIds: defaultCertIds,
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
        careInstructions: [
          "Machine wash cold (30°C)",
          "Do not bleach",
          "Tumble dry low",
          "Do not iron print",
        ],
        customWeight: "155 GSM",
        customFit: "Athletic Pro Fit",
        customizationOptions: [
          "Sublimated Club Crest",
          "Heat-Transfer Sponsor Logos",
          "Custom Player Numbering",
        ],
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
        primaryImageId:
          mediaMap.get("/images/products/aero-team-cycling-jersey-bib-set.webp") ||
          mediaMap.get("/images/products/pro-team-jersey.webp"),
        imageIds: [
          mediaMap.get("/images/products/aero-team-cycling-jersey-bib-set.webp") ||
            mediaMap.get("/images/products/pro-team-jersey.webp")!,
          mediaMap.get("/images/gallery/performance-fitting.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("AeroWeave™ Technical Mesh"),
        certificateIds: defaultCertIds,
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
        careInstructions: [
          "Wash inside out",
          "Use mild detergent",
          "Do not tumble dry",
          "Line dry in shade",
        ],
        customWeight: "135 GSM",
        customFit: "Aero Race Fit",
        customizationOptions: ["Full Custom Sublimation", "Reflective Piping", "Silicon Grippers"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Championship Tennis Court Polo & Skirt Set",
        slug: "championship-tennis-court-polo-skirt",
        description:
          "Match-grade tennis uniform engineered with moisture-evacuating pique and built-in compression ball short liner for tour performance.",
        shortDescription: "High-performance tennis polo and pleated skirt set with ball pocket.",
        categoryId: teamWearId,
        sku: "RUN-TW-TEN-003",
        urlPath: "/categories/team-wear/championship-tennis-court-polo-skirt",
        primaryImageId:
          mediaMap.get("/images/products/championship-tennis-court-polo-skirt.webp") ||
          mediaMap.get("/images/products/hydro-dri-base.webp"),
        imageIds: [
          mediaMap.get("/images/products/championship-tennis-court-polo-skirt.webp") ||
            mediaMap.get("/images/products/hydro-dri-base.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("EcoTech Organic Cotton Interlock"),
        certificateIds: defaultCertIds,
        minimumOrderQuantity: 50,
        leadTime: "2-3 weeks",
        specifications: [
          "UPF 50+ Sun Blocking",
          "Moisture-Wicking Knit",
          "Ball Storage Pocket Liner",
          "Laser-Cut Pleat Ventilation",
        ],
        technicalSpecs: {
          GSM: 180,
          Weave: "Micro-Pique",
          Stretch: "4-Way Dynamic",
          Finish: "Silicone Soft Touch",
        },
        fiberComposition: "88% Recycled Polyester, 12% Elastane",
        tags: ["Team Wear", "Tennis", "Court Apparel", "B2B"],
        careInstructions: ["Machine wash warm", "Wash with like colors", "Tumble dry medium"],
        customWeight: "180 GSM",
        customFit: "Tailored Court Fit",
        customizationOptions: [
          "Custom Club Crest",
          "Contrast Collar Knits",
          "Embroidered Monogram",
        ],
        isActive: true,
        isFeatured: false,
      },
      {
        name: "Gridiron Elite American Football Uniform",
        slug: "gridiron-elite-football-uniform",
        description:
          "Heavyweight abrasion-resistant tackle jersey and integrated pant system designed for full-contact competitive collegiate and club leagues.",
        shortDescription: "Heavy-duty 4-way stretch tackle football uniform with reinforced yoke.",
        categoryId: teamWearId,
        sku: "RUN-TW-FTB-004",
        urlPath: "/categories/team-wear/gridiron-elite-football-uniform",
        primaryImageId:
          mediaMap.get("/images/products/gridiron-elite-football-uniform.webp") ||
          mediaMap.get("/images/products/pro-team-jersey.webp"),
        imageIds: [
          mediaMap.get("/images/products/gridiron-elite-football-uniform.webp") ||
            mediaMap.get("/images/products/pro-team-jersey.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("AeroWeave™ Technical Mesh"),
        certificateIds: defaultCertIds,
        minimumOrderQuantity: 30,
        leadTime: "3-4 weeks",
        specifications: [
          "Cordura® Reinforced Shoulder Yoke",
          "Heavy Dazzle Cowl Panels",
          "Elasticized Cinch Sleeves",
          "Triple-Stitched Stress Points",
        ],
        technicalSpecs: {
          GSM: 320,
          Weave: "High-Tenacity Warp Knit",
          TearStrength: "> 450 N",
          Finish: "Tack-Grip Coating",
        },
        fiberComposition: "85% Heavyweight Nylon 6.6, 15% Spandex",
        tags: ["Team Wear", "American Football", "Gridiron", "Heavy-Duty"],
        careInstructions: ["Machine wash cold", "Heavy cycle", "Hang dry"],
        customWeight: "320 GSM",
        customFit: "Pad-Lock Contoured Fit",
        customizationOptions: [
          "Tackle Twill Numbering",
          "Direct Embroidered League Emblems",
          "Custom Sublimated Side Inserts",
        ],
        isActive: true,
        isFeatured: false,
      },
      {
        name: "Wetsuit Edition Hydro-Flex 3/2mm Scuba Suit",
        slug: "wetsuit-edition-hydro-flex-3-2mm-scuba-suit",
        description:
          "Premium cold-water wetsuit designed for dive centers, surf schools, and watersports brands. Built from limestone-based eco-neoprene with blind-stitched, glued, and taped seams.",
        shortDescription:
          "Eco-neoprene watersports suit with thermal chest barrier and sealed seams.",
        categoryId: teamWearId,
        sku: "RUN-TW-WET-005",
        urlPath: "/categories/team-wear/wetsuit-edition-hydro-flex-3-2mm-scuba-suit",
        primaryImageId:
          mediaMap.get("/images/products/wetsuit-edition-hydro-flex-3-2mm-scuba-suit.webp") ||
          mediaMap.get("/images/products/seamless-compression-tight.webp"),
        imageIds: [
          mediaMap.get("/images/products/wetsuit-edition-hydro-flex-3-2mm-scuba-suit.webp") ||
            mediaMap.get("/images/products/seamless-compression-tight.webp")!,
          mediaMap.get("/images/gallery/seam-sealing.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("Hydro-Flex Neoprene (Wetsuit Edition)"),
        certificateIds: defaultCertIds,
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
        careInstructions: [
          "Rinse with fresh cold water",
          "Do not dry in direct sunlight",
          "Store on wide hanger",
        ],
        customWeight: "3/2mm Dual Gauge",
        customFit: "Anatomical Marine Fit",
        customizationOptions: [
          "Screen-Printed Custom Silicone Branding",
          "Custom Zipper Pullers",
          "Integrated Key Loop",
        ],
        isActive: true,
        isFeatured: true,
      },

      // 2. Active Wear (4 Products)
      {
        name: "Biomechanical High-Impact Sports Bra",
        slug: "biomechanical-high-impact-sports-bra",
        description:
          "Engineered for maximum motion control and breast support during high-impact athletic training. Features laser-cut ventilation zones, encapsulated molded cups, and bonded chafe-free straps.",
        shortDescription: "High-support compressive sports bra for athletic and fitness brands.",
        categoryId: activeWearId,
        sku: "RUN-AW-BRA-001",
        urlPath: "/categories/active-wear/biomechanical-high-impact-sports-bra",
        primaryImageId:
          mediaMap.get("/images/products/biomechanical-high-impact-sports-bra.webp") ||
          mediaMap.get("/images/products/seamless-compression-tight.webp"),
        imageIds: [
          mediaMap.get("/images/products/biomechanical-high-impact-sports-bra.webp") ||
            mediaMap.get("/images/products/seamless-compression-tight.webp")!,
          mediaMap.get("/images/gallery/performance-fitting.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("FlexiWeave™ Compression Knit"),
        certificateIds: defaultCertIds,
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
        careInstructions: ["Machine wash cold in laundry bag", "Do not iron", "Air dry"],
        customWeight: "260 GSM",
        customFit: "Encapsulated Compressive Fit",
        customizationOptions: ["Custom Band Jacquard", "Laser-Cut Back Patterns", "Custom Sizing"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Hydro-Dri Aerobic Compression Top",
        slug: "hydro-dri-aerobic-compression-top",
        description:
          "Second-skin athletic compression top with targeted mesh ventilation underarms and along the spine for optimized core temperature regulation during endurance training.",
        shortDescription: "Zonal compression long-sleeve base layer for marathoners and athletes.",
        categoryId: activeWearId,
        sku: "RUN-AW-TOP-002",
        urlPath: "/categories/active-wear/hydro-dri-aerobic-compression-top",
        primaryImageId:
          mediaMap.get("/images/products/hydro-dri-aerobic-compression-top.webp") ||
          mediaMap.get("/images/products/hydro-dri-base.webp"),
        imageIds: [
          mediaMap.get("/images/products/hydro-dri-aerobic-compression-top.webp") ||
            mediaMap.get("/images/products/hydro-dri-base.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("FlexiWeave™ Compression Knit"),
        certificateIds: defaultCertIds,
        minimumOrderQuantity: 50,
        leadTime: "2-3 weeks",
        specifications: [
          "Targeted Mesh Underarm Gussets",
          "Ergonomic Raglan Sleeves",
          "Flatlock Anti-Chafing Seams",
          "UPF 50+ Sun Protection",
        ],
        technicalSpecs: {
          GSM: 210,
          Weave: "Warp Knit Interlock",
          Stretch: "4-Way Compressive",
          Finish: "Microbial Odor Block",
        },
        fiberComposition: "84% Recycled Polyester, 16% Spandex",
        tags: ["Active Wear", "Compression", "Base Layer", "Endurance"],
        careInstructions: ["Machine wash cold", "Do not tumble dry", "Do not iron"],
        customWeight: "210 GSM",
        customFit: "Second-Skin Compression",
        customizationOptions: [
          "Sublimated Sleeve Accents",
          "Reflective Heat-Seal Graphics",
          "Thumbhole Cuffs",
        ],
        isActive: true,
        isFeatured: false,
      },
      {
        name: "Pro-Compression Seamless Training Tights",
        slug: "pro-compression-seamless-training-tights",
        description:
          "Engineered circular-knit leggings manufactured on Santoni seamless machines. Delivers graduated compression to enhance blood circulation, reduce muscle vibration, and accelerate recovery.",
        shortDescription: "Seamless high-waisted compression tights for endurance athletes.",
        categoryId: activeWearId,
        sku: "RUN-AW-TGT-003",
        urlPath: "/categories/active-wear/pro-compression-seamless-training-tights",
        primaryImageId:
          mediaMap.get("/images/products/pro-compression-seamless-training-tights.webp") ||
          mediaMap.get("/images/products/seamless-compression-tight.webp"),
        imageIds: [
          mediaMap.get("/images/products/pro-compression-seamless-training-tights.webp") ||
            mediaMap.get("/images/products/seamless-compression-tight.webp")!,
          mediaMap.get("/images/gallery/precision-knitting.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("FlexiWeave™ Compression Knit"),
        certificateIds: defaultCertIds,
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
        careInstructions: ["Machine wash cold", "Tumble dry low", "Do not bleach"],
        customWeight: "280 GSM",
        customFit: "High-Waist Compressive",
        customizationOptions: [
          "Engineered Jacquard Textures",
          "Concealed Key Pocket",
          "Custom Ankle Cut",
        ],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Kinetic Seamless Full-Body Motion Suit",
        slug: "kinetic-seamless-motion-suit",
        description:
          "Full-body anatomical catsuit engineered for gymnastics, speedskating dryland training, and contemporary athletic dance with 360-degree range of motion.",
        shortDescription:
          "Full-body Santoni seamless motion suit with integrated postural support.",
        categoryId: activeWearId,
        sku: "RUN-AW-SUT-004",
        urlPath: "/categories/active-wear/kinetic-seamless-motion-suit",
        primaryImageId:
          mediaMap.get("/images/products/kinetic-seamless-motion-suit.webp") ||
          mediaMap.get("/images/products/seamless-compression-tight.webp"),
        imageIds: [
          mediaMap.get("/images/products/kinetic-seamless-motion-suit.webp") ||
            mediaMap.get("/images/products/seamless-compression-tight.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("FlexiWeave™ Compression Knit"),
        certificateIds: defaultCertIds,
        minimumOrderQuantity: 40,
        leadTime: "3 weeks",
        specifications: [
          "Full Body Tubular Construction",
          "Posture-Aligning Back Matrix",
          "Concealed Invisible Back Zipper",
          "Stirrup Foot Retention",
        ],
        technicalSpecs: {
          GSM: 290,
          Weave: "Santoni 3D Knit",
          ElasticRecovery: "> 98%",
          Finish: "Hydrophilic Wicking",
        },
        fiberComposition: "78% Recycled Polyamide, 22% Lycra",
        tags: ["Active Wear", "Full-Body", "Motion Suit", "Seamless"],
        careInstructions: ["Hand wash or gentle cycle", "Hang dry only", "Do not iron"],
        customWeight: "290 GSM",
        customFit: "3D Anatomical Second-Skin",
        customizationOptions: [
          "Zonal Color-Blocking",
          "Custom Neckline Configurations",
          "Open/Closed Back Styling",
        ],
        isActive: true,
        isFeatured: false,
      },

      // 3. Casual Wear (4 Products)
      {
        name: "Heritage Organic Cotton Heavyweight Hoodie",
        slug: "heritage-organic-cotton-heavyweight-hoodie",
        description:
          "Ultra-luxurious 450 GSM French Terry hoodie constructed from 100% GOTS certified organic cotton. Features double-layered hood, ribbed side gussets, and pre-shrunk anti-pilling wash.",
        shortDescription: "450 GSM heavyweight organic cotton French Terry pullover hoodie.",
        categoryId: casualWearId,
        sku: "RUN-CW-HOD-001",
        urlPath: "/categories/casual-wear/heritage-organic-cotton-heavyweight-hoodie",
        primaryImageId:
          mediaMap.get("/images/products/heritage-organic-cotton-heavyweight-hoodie.webp") ||
          mediaMap.get("/images/products/thermal-storm-hoodie.webp"),
        imageIds: [
          mediaMap.get("/images/products/heritage-organic-cotton-heavyweight-hoodie.webp") ||
            mediaMap.get("/images/products/thermal-storm-hoodie.webp")!,
          mediaMap.get("/images/gallery/cotton-blending.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("EcoTech Organic Cotton Interlock"),
        certificateIds: defaultCertIds,
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
        careInstructions: ["Machine wash cold", "Wash inside out", "Tumble dry low"],
        customWeight: "450 GSM",
        customFit: "Relaxed Boxy Fit",
        customizationOptions: [
          "Custom Garment Dyeing / Pigment Wash",
          "High-Density Chest Embroidery",
          "Custom Woven Neck Labels",
        ],
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
        primaryImageId:
          mediaMap.get("/images/products/engineered-pique-performance-polo.webp") ||
          mediaMap.get("/images/products/hydro-dri-base.webp"),
        imageIds: [
          mediaMap.get("/images/products/engineered-pique-performance-polo.webp") ||
            mediaMap.get("/images/products/hydro-dri-base.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("EcoTech Organic Cotton Interlock"),
        certificateIds: defaultCertIds,
        minimumOrderQuantity: 50,
        leadTime: "2 weeks",
        specifications: [
          "Structured Anti-Curl Knit Collar",
          "Custom Branded Pearlized Buttons",
          "Split Hem with Bartack Reinforcement",
          "Anti-Odor Bio-Treatment",
        ],
        technicalSpecs: {
          GSM: 210,
          Weave: "Honeycombed Pique",
          Finish: "Silicone Wash Softness",
        },
        fiberComposition: "60% Organic Cotton, 40% Recycled Polyester",
        tags: ["Casual Wear", "Polo", "Corporate Apparel", "Clubwear"],
        careInstructions: ["Machine wash warm", "Do not bleach", "Iron medium heat"],
        customWeight: "210 GSM",
        customFit: "Modern Tailored Fit",
        customizationOptions: [
          "Laser-Engraved Buttons",
          "Embroidered Chest Monogram",
          "Jacquard Tipped Collar",
        ],
        isActive: true,
        isFeatured: false,
      },
      {
        name: "GOTS Organic Cotton Heavyweight Tee",
        slug: "gots-organic-cotton-heavyweight-tee",
        description:
          "Substantial 240 GSM single-jersey t-shirt manufactured from combed organic cotton. Features twin-needle collar topstitching and seamless drop-shoulder construction.",
        shortDescription: "240 GSM organic combed cotton luxury streetwear heavyweight tee.",
        categoryId: casualWearId,
        sku: "RUN-CW-TEE-003",
        urlPath: "/categories/casual-wear/gots-organic-cotton-heavyweight-tee",
        primaryImageId:
          mediaMap.get("/images/products/gots-organic-cotton-heavyweight-tee.webp") ||
          mediaMap.get("/images/products/hydro-dri-base.webp"),
        imageIds: [
          mediaMap.get("/images/products/gots-organic-cotton-heavyweight-tee.webp") ||
            mediaMap.get("/images/products/hydro-dri-base.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("EcoTech Organic Cotton Interlock"),
        certificateIds: defaultCertIds,
        minimumOrderQuantity: 100,
        leadTime: "2 weeks",
        specifications: [
          "240 GSM Single Jersey",
          "1x1 Ribbed High-Neck Collar",
          "Pre-Shrunk Organic Yarn",
          "Blind-Hem Sleeve Finish",
        ],
        technicalSpecs: {
          GSM: 240,
          Weave: "Single Jersey 20s Ring-Spun",
          Colorfastness: "Grade 4.5",
          Finish: "Enzyme Soft Wash",
        },
        fiberComposition: "100% GOTS Certified Organic Cotton",
        tags: ["Casual Wear", "T-Shirt", "Heavyweight", "Organic"],
        careInstructions: ["Machine wash cold", "Wash inside out", "Tumble dry low"],
        customWeight: "240 GSM",
        customFit: "Oversized Streetwear Fit",
        customizationOptions: [
          "Screen Printing / Puff Print",
          "Custom Pantone Dyeing",
          "Woven Hem Label",
        ],
        isActive: true,
        isFeatured: false,
      },
      {
        name: "Tapered Fleece Training Tracksuit",
        slug: "tapered-fleece-training-tracksuit",
        description:
          "Two-piece athletic tracksuit combining a streamlined quarter-zip pullover with ergonomic tapered sweatpants featuring waterproof zippered pockets.",
        shortDescription: "Brushed French Terry training tracksuit with custom hardware.",
        categoryId: casualWearId,
        sku: "RUN-CW-TRK-004",
        urlPath: "/categories/casual-wear/tapered-fleece-training-tracksuit",
        primaryImageId:
          mediaMap.get("/images/products/tapered-fleece-training-tracksuit.webp") ||
          mediaMap.get("/images/products/thermal-storm-hoodie.webp"),
        imageIds: [
          mediaMap.get("/images/products/tapered-fleece-training-tracksuit.webp") ||
            mediaMap.get("/images/products/thermal-storm-hoodie.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("EcoTech Organic Cotton Interlock"),
        certificateIds: defaultCertIds,
        minimumOrderQuantity: 50,
        leadTime: "3 weeks",
        specifications: [
          "360 GSM Brushed French Terry",
          "Waterproof Reverse-Coil YKK Zips",
          "Ribbed Ankle Cuffs & Gusset",
          "Braided Drawcord with Metal Aglets",
        ],
        technicalSpecs: {
          GSM: 360,
          Weave: "French Terry Brushed Back",
          PillingGrade: "4.5",
          Finish: "Silicon Comfort Softener",
        },
        fiberComposition: "70% Organic Cotton, 30% Recycled Polyester",
        tags: ["Casual Wear", "Tracksuit", "Joggers", "Fleece"],
        careInstructions: ["Machine wash warm", "Do not iron zips", "Tumble dry low"],
        customWeight: "360 GSM",
        customFit: "Tapered Athletic Fit",
        customizationOptions: [
          "Custom Metal Aglets & Eyelets",
          "Silicone 3D Thigh Branding",
          "Zipped Ankle Expander",
        ],
        isActive: true,
        isFeatured: false,
      },

      // 4. Outer Wear (2 Products)
      {
        name: "Alpine Storm-Shield 3-Layer Shell Jacket",
        slug: "alpine-storm-shield-3-layer-shell-jacket",
        description:
          "Hardcore mountain shell engineered with HydroShield™ membrane (20,000mm hydrostatic head waterproof, 20,000g/m² breathability). Features 100% seam taping, waterproof zippers, and cohort helmet-compatible hood.",
        shortDescription: "20K/20K technical waterproof 3-layer breathable mountain jacket.",
        categoryId: outerWearId,
        sku: "RUN-OW-JKT-001",
        urlPath: "/categories/outer-wear/alpine-storm-shield-3-layer-shell-jacket",
        primaryImageId:
          mediaMap.get("/images/products/alpine-storm-shield-3-layer-shell-jacket.webp") ||
          mediaMap.get("/images/products/aero-tech-shell.webp"),
        imageIds: [
          mediaMap.get("/images/products/alpine-storm-shield-3-layer-shell-jacket.webp") ||
            mediaMap.get("/images/products/aero-tech-shell.webp")!,
          mediaMap.get("/images/gallery/seam-sealing.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("HydroShield™ Bio-Membrane"),
        certificateIds: defaultCertIds,
        minimumOrderQuantity: 50,
        leadTime: "4 weeks",
        specifications: [
          "20,000mm Waterproof / 20,000g Breathable",
          "Fully Taped Micro-Seams",
          "Aquaguard® Waterproof YKK Zippers",
          "Underarm Pit-Zip Ventilation",
        ],
        technicalSpecs: {
          GSM: 175,
          Membrane: "HydroShield™ 3-Layer",
          DWR: "C0 PFAS-Free Bio-DWR",
        },
        fiberComposition: "100% Recycled Nylon Ripstop with HydroShield™ Membrane",
        tags: ["Outer Wear", "Technical Shell", "Waterproof", "Alpine"],
        careInstructions: [
          "Machine wash gentle with tech wash",
          "Tumble dry warm to reactivate DWR",
          "Do not dry clean",
        ],
        customWeight: "175 GSM",
        customFit: "Alpine Articulated Fit",
        customizationOptions: [
          "Custom Seam Tape Branding",
          "Cohaesive™ Cord Lock System",
          "Reflective RECCO® Integration",
        ],
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
        primaryImageId:
          mediaMap.get("/images/products/high-loft-thermal-sherpa-fleece-jacket.webp") ||
          mediaMap.get("/images/products/thermal-storm-hoodie.webp"),
        imageIds: [
          mediaMap.get("/images/products/high-loft-thermal-sherpa-fleece-jacket.webp") ||
            mediaMap.get("/images/products/thermal-storm-hoodie.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("MerinoShield™ Thermal Blend"),
        certificateIds: defaultCertIds,
        minimumOrderQuantity: 50,
        leadTime: "3-4 weeks",
        specifications: [
          "380 GSM High-Loft Sherpa",
          "Taslan Nylon Reinforcement Yoke",
          "Elastic Bound Cuffs and Hem",
          "Zippered Security Pockets",
        ],
        technicalSpecs: {
          GSM: 380,
          Pile: "Deep Sherpa Fleece",
          Lining: "Breathable Mesh",
        },
        fiberComposition: "100% Recycled Polyester Fleece, 100% Nylon Overlays",
        tags: ["Outer Wear", "Sherpa Jacket", "Thermal", "Fleece"],
        careInstructions: [
          "Machine wash cold delicate",
          "Do not use fabric softeners",
          "Air dry only",
        ],
        customWeight: "380 GSM",
        customFit: "Relaxed Layering Fit",
        customizationOptions: [
          "Contrast Nylon Colorblocking",
          "Custom Molded Zipper Pulls",
          "Embroidered Heritage Patch",
        ],
        isActive: true,
        isFeatured: true,
      },

      // 5. Sports Accessories (2 Products)
      {
        name: "Precision Grip Weightlifting Gloves",
        slug: "precision-grip-weightlifting-gloves",
        description:
          "Ergonomic strength training gloves engineered with silicone micro-patterned palm grip, breathable mesh backhand, and integrated 18-inch elastic wrist stabilization wrap.",
        shortDescription: "High-durability gym gloves with integrated wrist wrap support.",
        categoryId: accessoriesId,
        sku: "RUN-AC-GLV-001",
        urlPath: "/categories/sports-accessories/precision-grip-weightlifting-gloves",
        primaryImageId:
          mediaMap.get("/images/products/precision-grip-weightlifting-gloves.webp") ||
          mediaMap.get("/images/products/hydro-dri-base.webp"),
        imageIds: [
          mediaMap.get("/images/products/precision-grip-weightlifting-gloves.webp") ||
            mediaMap.get("/images/products/hydro-dri-base.webp")!,
        ].filter(Boolean),
        fabricId: fabricMap.get("AeroWeave™ Technical Mesh"),
        certificateIds: defaultCertIds,
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
        careInstructions: ["Hand wash in mild soap", "Air dry flat", "Do not iron"],
        customWeight: "120g per pair",
        customFit: "Ergonomic Pre-Curved Fit",
        customizationOptions: [
          "Embossed Rubber Wrist Strap Logo",
          "Custom Silicone Palm Grip Design",
          "Custom Packaging",
        ],
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
        primaryImageId:
          mediaMap.get("/images/products/olympic-powerlifting-leather-belt.webp") ||
          mediaMap.get("/images/products/aero-tech-shell.webp"),
        imageIds: [
          mediaMap.get("/images/products/olympic-powerlifting-leather-belt.webp") ||
            mediaMap.get("/images/products/aero-tech-shell.webp")!,
        ].filter(Boolean),
        fabricId: null,
        certificateIds: defaultCertIds,
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
        careInstructions: ["Wipe clean with damp cloth", "Condition leather semi-annually"],
        customWeight: "1.4 kg",
        customFit: "Rigid Powerlifting Core Support",
        customizationOptions: [
          "Laser-Engraved Steel Lever",
          "Debossed Exterior Leather Logo",
          "Custom Suede Inner Lining Color",
        ],
        isActive: true,
        isFeatured: true,
      },
    ];

    for (const prod of productFixtures) {
      await db.insert(products).values(prod);
    }
    console.log(
      `  ✓ Configured ${productFixtures.length} Verified B2B Product Fixtures across 5 categories with Image References`,
    );

    // ── 7. BLOG CATEGORIES & 4 REALISTIC B2B ARTICLES ────────────────────────
    console.log("\n📰 [Blog] Provisioning 4 Realistic B2B Articles...");
    const blogCategoryFixtures = [
      {
        name: "Sustainability & ESG",
        slug: "sustainability-esg",
        description:
          "Insights into renewable energy, carbon reduction, and circular manufacturing.",
      },
      {
        name: "Material Innovation",
        slug: "material-innovation",
        description: "Technical breakthroughs in organic cotton, recycled fibers, and membranes.",
      },
      {
        name: "Textile Engineering",
        slug: "textile-engineering",
        description:
          "Advanced seamless knitting, laser bonding, and biomechanical fit engineering.",
      },
      {
        name: "Compliance & Governance",
        slug: "compliance-governance",
        description: "SMETA 4-Pillar audits, Sedex traceability, and ethical trade standards.",
      },
    ];

    const blogCategoryMap = new Map<string, number>();
    for (const bCat of blogCategoryFixtures) {
      const [inserted] = await db.insert(blogCategories).values(bCat).returning();
      blogCategoryMap.set(bCat.slug, inserted.id);
    }

    const blogPostFixtures = [
      {
        title:
          "Decarbonizing Athletic Apparel: How 80% Solar Infrastructure Drives Sustainable B2B Production",
        slug: "decarbonizing-athletic-apparel-solar-infrastructure",
        excerpt:
          "An in-depth analysis of RUN APPAREL's 193,000+ sqm vertical campus in Sialkot, where rooftop solar energy and closed-loop ZLD water recycling cut Scope 1 & 2 emissions.",
        content: `## The Imperative of Clean Energy in Tier-1 Sportswear Manufacturing

As international athletic brands navigate aggressive Scope 1, 2, and 3 decarbonization mandates, the traditional energy-intensive textile mill is undergoing a fundamental transformation. At RUN APPAREL's 193,000+ square meter vertical manufacturing campus in Sialkot, Pakistan, the transition from fossil grid dependence to clean renewable generation is already operational at enterprise scale.

### 80% Solar Power Transition
By installing high-efficiency monocrystalline solar arrays across our primary facility rooftops, RUN APPAREL generates over 80% of our daily operational electrical demand. This direct clean power feeds our 200+ specialized sewing workstations, 48 Santoni seamless circular knitting machines, and computerized CAD laser cutting lines.

### Zero Liquid Discharge (ZLD) Water Recycling
In addition to rooftop solar power, our closed-loop Zero Liquid Discharge (ZLD) effluent treatment plant purifies and recycles up to 85% of industrial water back into initial scouring and washing processes. This eliminates toxic effluent discharge into regional waterways and secures full compliance with OEKO-TEX Standard 100 and Made in Green criteria.

### Measurable ESG Benefits for Global Partners
When athletic brands partner with RUN APPAREL, every production run is accompanied by verified energy source metrics and chain-of-custody documentation—empowering our partners to report authentic, third-party audited carbon reductions to stakeholders and consumers alike.`,
        featuredImageId: mediaMap.get("/images/blog/solar-powered-manufacturing.webp"),
        categoryId: blogCategoryMap.get("sustainability-esg"),
        authorId: adminId,
        status: "published" as const,
        isFeatured: true,
        publishedAt: new Date("2026-07-15T09:00:00Z"),
        metaTitle: "Decarbonizing Athletic Apparel via Solar Power | RUN APPAREL",
        metaDescription:
          "Learn how RUN APPAREL's 80% solar powered facility and ZLD water treatment deliver verifiable carbon reduction for B2B athletic brands.",
        keywords:
          "solar apparel manufacturing, sustainable sportswear, B2B ESG, ZLD water recycling",
      },
      {
        title:
          "From Post-Consumer PET to High-Tenacity Teamwear: The GRS & GOTS Material Integrity Guide",
        slug: "circular-polyester-gots-material-integrity-guide",
        excerpt:
          "Navigating chain-of-custody verification, OEKO-TEX Standard 100 testing, and chemical restrictions across international B2B sportswear supply chains.",
        content: `## Verifying Raw Material Authenticity in Athletic Apparel

In an era of rampant greenwashing, technical sportswear buyers require rigorous chain-of-custody audits rather than marketing assurances. RUN APPAREL operates within a strictly verified compliance ecosystem backed by parent company Durus Industries (est. 1889).

### Global Recycled Standard (GRS) Verification
Our recycled polyester yarns originate from post-consumer PET bottles, mechanically shredded, melted, and spun into filament fibers with zero loss in tensile strength or moisture wicking capability. Each batch is accompanied by GRS transaction certificates verifying true recycled origin and environmental management protocols.

### GOTS Certified Organic Cotton
For our heavyweight lifestyle and training apparel—such as our 450 GSM French Terry hoodies and 240 GSM combed tees—we source 100% GOTS certified organic cotton. Cultivated without synthetic organophosphates or genetically modified seeds, these long-staple fibers provide unmatched durability, hand-feel, and colorfastness under repeated commercial laundry cycles.`,
        featuredImageId: mediaMap.get("/images/blog/circular-polyester-supply-chain.webp"),
        categoryId: blogCategoryMap.get("material-innovation"),
        authorId: adminId,
        status: "published" as const,
        isFeatured: true,
        publishedAt: new Date("2026-07-22T10:30:00Z"),
        metaTitle: "GRS & GOTS Material Integrity in B2B Sportswear | RUN APPAREL",
        metaDescription:
          "A technical guide to certified recycled polyester and GOTS organic cotton sourcing for athletic apparel brands.",
        keywords: "GRS polyester, GOTS organic cotton, technical fabrics, sustainable textiles",
      },
      {
        title:
          "Seamless Biomechanics: Engineering Targeted Zonal Compression on Santoni Circular Knitting Lines",
        slug: "seamless-biomechanics-targeted-zonal-compression",
        excerpt:
          "How 48 Santoni SM8-TOP2V machines weave graduated compression gradients that minimize muscle vibration and eliminate chafing for endurance athletes.",
        content: `## Eliminating Seams: The Santoni Circular Knitting Revolution

Traditional cut-and-sew garment construction introduces bulky flatlock seams that create friction points, restrict stretch, and risk seam failure under high-intensity athletic motion. RUN APPAREL resolves this challenge through advanced Santoni SM8-TOP2V circular seamless knitting technology.

### Computational Zonal Compression
Using CAD needle-by-needle programming, our engineering team maps specific compression zones directly into the knit matrix:
1. **High Compression Bands:** Strategically placed around quads and hamstrings to attenuate muscle oscillation and reduce energy loss during sprinting.
2. **Breathable Open-Knit Meshes:** Placed behind the knees and along the spine for dynamic thermodynamic ventilation.
3. **Ergonomic Ribbed Core Support:** High-tensile elastic bands that eliminate waistband slippage without painful drawstring pressure.

### Zero-Waste Fabrication
Seamless knitting creates tubular garment blanks with near-zero yarn clipping waste, pushing material efficiency above 95% while producing second-skin activewear that withstands rigorous AQL 1.5 inspection standards.`,
        featuredImageId: mediaMap.get("/images/blog/santoni-seamless-knitting-tech.webp"),
        categoryId: blogCategoryMap.get("textile-engineering"),
        authorId: adminId,
        status: "published" as const,
        isFeatured: true,
        publishedAt: new Date("2026-08-05T14:00:00Z"),
        metaTitle: "Seamless Biomechanics & Santoni Circular Knitting | RUN APPAREL",
        metaDescription:
          "Discover how RUN APPAREL utilizes 48 Santoni seamless machines to engineer zonal compression and zero-waste activewear.",
        keywords: "Santoni seamless knitting, compression activewear, biomechanical sportswear",
      },
      {
        title:
          "Ethical Compliance in Modern Sportswear: The Strategic Imperative of SMETA 4-Pillar Audits",
        slug: "ethical-compliance-sportswear-smeta-4-pillar-audits",
        excerpt:
          "Why Tier-1 international sportswear brands demand transparent Sedex audit trails, fair living wages, and zero-defect AQL 1.5 quality gates.",
        content: `## Social Governance & Supply Chain Transparency

Global athletic brands face increasing scrutiny regarding workplace conditions and labor standards in overseas manufacturing hubs. In Sialkot, Pakistan, RUN APPAREL and parent company Durus Industries operate under validated SMETA (Sedex Members Ethical Trade Audit) 4-Pillar compliance.

### The Four Pillars of SMETA Auditing
1. **Labor Standards:** Transparent working hours, overtime restrictions, freedom of association, and guaranteed fair living wages exceeding statutory minimums.
2. **Health & Safety:** Ergonomic workstations, comprehensive fire safety infrastructure, well-ventilated production floors, and certified first-aid personnel.
3. **Environmental Management:** Chemical storage controls, hazardous waste minimization, and zero liquid discharge water purification.
4. **Business Ethics:** Strict anti-bribery policies, transparent accounting, and secure intellectual property protection for partner tech packs.

### A Reliable Partner for Global Brand Due Diligence
With audited Sedex registration (Ref: ZC5000065244) and latest SMETA audit completed in July 2025, RUN APPAREL provides global brands with bulletproof compliance documentation for international retail distribution.`,
        featuredImageId: mediaMap.get("/images/blog/smeta-ethical-compliance-guide.webp"),
        categoryId: blogCategoryMap.get("compliance-governance"),
        authorId: adminId,
        status: "published" as const,
        isFeatured: true,
        publishedAt: new Date("2026-08-18T11:15:00Z"),
        metaTitle: "SMETA 4-Pillar Audits in Sportswear Manufacturing | RUN APPAREL",
        metaDescription:
          "Explore the importance of SMETA 4-Pillar audits and Sedex compliance in ethical B2B sportswear production.",
        keywords: "SMETA audit, Sedex compliance, ethical manufacturing, Sialkot sports goods",
      },
    ];

    for (const post of blogPostFixtures) {
      await db.insert(blogPosts).values(post);
    }
    console.log(
      `  ✓ Configured ${blogPostFixtures.length} Authentic B2B Blog Articles with Media Assets`,
    );

    // ── 8. HOMEPAGE CMS FIXTURES ─────────────────────────────────────────────
    console.log("\n🏠 [CMS: Homepage] Populating Authentic B2B Content...");
    const heroData = {
      title: "ENGINEERING HIGH-PERFORMANCE ATHLETIC APPAREL",
      subtitle:
        "Sustainable, high-performance, ethically manufactured sportswear engineered with biomechanical precision since 1889.",
      ctaText: "EXPLORE OUR CAPABILITIES",
      ctaLink: "/products",
      backgroundImageId: mediaMap.get("/images/homepage/hero-1.webp"),
      isActive: true,
    };

    await db.insert(homepageHero).values(heroData);

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

    await db.insert(homepageProcessCards).values([
      {
        title: "Certified Sustainable Sourcing",
        description:
          "GOTS organic cotton and GRS recycled fibers procured with verified chain-of-custody tracking.",
        step: 1,
        iconName: "IconLeaf",
        imageId: mediaMap.get("/images/homepage/process-1.webp"),
        isActive: true,
      },
      {
        title: "Precision 3D Engineering",
        description:
          "AI-assisted pattern nesting achieving 90-95% material utilization with Santoni seamless knitting.",
        step: 2,
        iconName: "IconCpu",
        imageId: mediaMap.get("/images/homepage/process-2.webp"),
        isActive: true,
      },
      {
        title: "Automated Assembly & Bonding",
        description:
          "High-speed CNC laser cutting and ultrasonic bonding for chafe-free ergonomic athletic seams.",
        step: 3,
        iconName: "IconScissors",
        imageId: mediaMap.get("/images/homepage/process-3.webp"),
        isActive: true,
      },
      {
        title: "AQL 1.5 Quality Inspection",
        description:
          "100% in-line optical inspection and global customs documentation for reliable export delivery.",
        step: 4,
        iconName: "IconTruck",
        imageId: mediaMap.get("/images/homepage/process-4.webp"),
        isActive: true,
      },
    ]);

    await db.insert(homepageFeaturedProductsSettings).values({
      title: "Featured B2B Manufacturing Collections",
      isActive: true,
    });

    await db.insert(homepageSections).values([
      {
        name: "manufacturing",
        title: "Precision Manufacturing",
        heroTitle: "End-to-End Vertical Infrastructure",
        content:
          "Our state-of-the-art facility integrates advanced circular knitting, precision CNC laser cutting, and automated sewing systems to deliver consistent high-performance athletic wear at scale.",
        sectionType: "manufacturing",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "technology",
        title: "Technological Edge",
        heroTitle: "Virtual Prototyping & 3D Engineering",
        content:
          "Using virtual prototyping and 3D fit visualization tools, we accelerate the R&D process from concept to approved design, drastically reducing sample lead times and fabric waste.",
        sectionType: "technology",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "sustainability",
        title: "Circular Sustainability",
        heroTitle: "Eco-Forward Manufacturing & Zero-Discharge",
        content:
          "We offer certified GOTS organic cotton, GRS recycled polyester, and biodegradable synthetics. Our facility is zero-discharge certified, reusing 95% of water in our closed-loop dyehouse.",
        sectionType: "sustainability",
        isActive: true,
        sortOrder: 3,
      },
    ]);

    // ── 9. MANUFACTURING CMS FIXTURES ────────────────────────────────────────
    console.log("\n🏭 [CMS: Manufacturing] Populating 193,000+ sqm Facility Specifications...");
    const mfgHeroData = {
      headline: "PRECISION AT SCALE",
      subheadline: "Advanced Textile Engineering & 193,000+ sqm Vertical Campus",
      description:
        "Operating 200+ precision machines and 3 automated cutting lines in Sialkot, Pakistan, delivering 100,000+ units monthly with end-to-end quality assurance.",
      ctaText: "REQUEST SPECIFICATIONS",
      ctaLink: "/contact",
      imageId: mediaMap.get("/images/manufacturing/facility-solar-overview.webp"),
      backgroundMediaId: mediaMap.get("/images/manufacturing/facility-solar-overview.webp"),
      bottomCtaTitle: "Ready to Scale Your B2B Production?",
      bottomCtaDescription:
        "Connect with our engineering team for technical capacity audits, sample development, and custom fabrication timelines.",
      bottomCtaText: "CONTACT ENGINEERING",
      bottomCtaLink: "/contact",
      isActive: true,
    };

    await db.insert(manufacturingHero).values(mfgHeroData);

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
        imageId: mediaMap.get("/images/manufacturing/process-sourcing.webp"),
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
        imageId: mediaMap.get("/images/manufacturing/quality-testing-lab.webp"),
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
        imageId: mediaMap.get("/images/manufacturing/process-laser-cutting.webp"),
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
        imageId: mediaMap.get("/images/manufacturing/process-assembly.webp"),
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
        imageId: mediaMap.get("/images/manufacturing/process-finishing.webp"),
        isActive: true,
      },
    ]);

    await db.insert(manufacturingCapabilities).values([
      {
        name: "Vertical Assembly Lines",
        capacity: "100,000+ Units / Month",
        description: "3 automated cutting lines and 200+ specialized sewing workstations.",
        imageId: mediaMap.get("/images/manufacturing/automated-sewing.webp"),
        isActive: true,
      },
      {
        name: "Santoni Seamless Circular Knitting",
        capacity: "48 Machines Operating 24/7",
        description: "High-gauge tubular seamless knitting for compressive activewear.",
        imageId: mediaMap.get("/images/technology/seamless-knitting.webp"),
        isActive: true,
      },
      {
        name: "Closed-Loop Eco Dyeing",
        capacity: "80,000 kg / Day",
        description: "Zero Liquid Discharge (ZLD) dyeing facility recycling 85% of effluent.",
        imageId: mediaMap.get("/images/manufacturing/facility-solar-overview.webp"),
        isActive: true,
      },
    ]);

    await db.insert(manufacturingQualities).values([
      {
        title: "AQL 1.5 Standard Quality Gate",
        standards: ["ISO 9001:2015", "AQL 1.5 Protocol", "SMETA 4-Pillar"],
        description:
          "Zero defect tolerance on high-performance athletic apparel, verified by digital twin variance scanning.",
        certificateId: certMap.get("iso-9001"),
        imageId: mediaMap.get("/images/certificates/iso-9001.webp"),
        isActive: true,
      },
    ]);

    // ── 10. SUSTAINABILITY CMS FIXTURES ──────────────────────────────────────
    console.log("\n🌱 [CMS: Sustainability] Populating 80% Solar & Zero Liquid Discharge Facts...");
    const sustHeroData = {
      title: "Sustainability Woven Into Every Thread",
      subtitle: "80% Solar Powered Manufacturing with Closed-Loop Water Recycling",
      description:
        "Leading the global transition to ethical, circular sportswear manufacturing through rooftop solar energy, zero liquid discharge filtration, and zero-waste pattern optimization.",
      imageId: mediaMap.get("/images/sustainability/solar-rooftop.webp"),
      isActive: true,
    };

    await db.insert(sustainabilityHero).values(sustHeroData);

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

    await db.insert(sustainabilityInitiatives).values([
      {
        title: "Zero Liquid Discharge (ZLD) Water Plant",
        description:
          "Closed-loop wastewater purification facility treating and recycling 1.2M liters of water daily.",
        impact: "Saves 1.2M Liters Daily",
        category: "Water Conservation",
        imageId: mediaMap.get("/images/sustainability/solar-rooftop.webp"),
        isActive: true,
      },
      {
        title: "100% GOTS & GRS Supply Chain Transparency",
        description:
          "End-to-end supply chain certification tracking organic cotton and recycled plastic polyester.",
        impact: "Zero Harmful Chemicals",
        category: "Responsible Materials",
        imageId: mediaMap.get("/images/sustainability/organic-cotton.webp"),
        isActive: true,
      },
    ]);

    await db.insert(sustainabilityGoals).values([
      {
        title: "Carbon-Neutral Net-Zero Manufacturing by 2030",
        targetDate: new Date("2030-12-31"),
        currentProgress: "72.00",
        description:
          "Complete decarbonization of logistics, heat generation, and power grid infrastructure.",
        isActive: true,
      },
    ]);

    // ── 11. TECHNOLOGY & R&D CMS FIXTURES ────────────────────────────────────
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
      imageId: mediaMap.get("/images/technology/3d-digital-twin.webp"),
      backgroundMediaId: mediaMap.get("/images/technology/3d-digital-twin.webp"),
      isActive: true,
    };

    await db.insert(technologyHero).values(techHeroData);

    await db.insert(technologyInnovations).values([
      {
        name: "AeroWeave™ Aerodynamic Structure",
        shortDescription:
          "Turbulent boundary layer reduction fabric structure for elite cycling and speed sports.",
        description:
          "Micro-dimpled surface texture reducing parasitic aerodynamic drag across high-velocity movements.",
        category: "Textile Engineering",
        status: "Active",
        imageId: mediaMap.get("/images/technology/3d-digital-twin.webp"),
        isActive: true,
      },
      {
        name: "HydroShield™ Bio-Membrane",
        shortDescription: "PFAS-free durable water-repellent breathable membrane.",
        description:
          "20,000mm hydrostatic head waterproof barrier with microporous molecular vapor evacuation.",
        category: "Weather Protection",
        status: "Active",
        imageId: mediaMap.get("/images/fabrics/hydroshield-membrane.webp"),
        isActive: true,
      },
      {
        name: "Zonal Compression Mapping",
        shortDescription: "Santoni seamless circular-knit graduated support.",
        description:
          "Biomechanical pressure gradients calibrated to enhance venous blood return and reduce muscle fatigue.",
        category: "Biomechanical",
        status: "Active",
        imageId: mediaMap.get("/images/technology/seamless-knitting.webp"),
        isActive: true,
      },
    ]);

    await db.insert(technologyEquipment).values([
      {
        name: "Santoni Seamless Circular Knitting Machines",
        manufacturer: "Santoni S.p.A. (Italy)",
        model: "SM8-TOP2V",
        category: "Knitting",
        quantity: 48,
        capacity: "24/7 Precision Tubular Weaving",
        imageId: mediaMap.get("/images/technology/seamless-knitting.webp"),
        isActive: true,
      },
      {
        name: "Lectra Automated CNC Laser Cutters",
        manufacturer: "Lectra (France)",
        model: "VectorFashion iX",
        category: "Cutting",
        quantity: 6,
        capacity: "95% Material Yield at Micron Accuracy",
        imageId: mediaMap.get("/images/manufacturing/laser-cutting.webp"),
        isActive: true,
      },
    ]);

    // ── 12. ABOUT PAGE CMS FIXTURES (1889 HERITAGE TIMELINE) ─────────────────
    console.log("\n🏢 [CMS: About] Populating 1889 Heritage Timeline & Sialkot HQ Complex...");
    const aboutHeroData = {
      title: "135+ Years of Mastery in Athletic Engineering",
      subtitle: "From Heritage Leather Craftsmanship to Sustainable B2B Sportswear Innovation",
      description:
        "Based in Sialkot, Pakistan, RUN APPAREL (PVT) LTD (a division of Durus Industries, est. 1889) operates a 193,000+ sqm manufacturing complex powered by 80% solar energy, producing 100,000+ units monthly for international athletic brands.",
      imageId: mediaMap.get("/images/about/hq-campus.webp"),
      backgroundMediaId: mediaMap.get("/images/about/hq-campus.webp"),
      isActive: true,
    };

    await db.insert(aboutHero).values(aboutHeroData);

    await db.insert(aboutSections).values([
      {
        title: "Our Mission",
        content:
          "To empower global partners with sustainable, high-performance apparel that drives unity, endurance, and excellence — combining ethical craftsmanship with technological precision.",
        sectionType: "mission",
        imageId: mediaMap.get("/images/about/master-craftsmen.webp"),
        sortOrder: 1,
        isActive: true,
      },
      {
        title: "Our Vision",
        content:
          "A world where athletic apparel transcends fashion, becoming a catalyst for positive change — where every garment reflects commitment to sustainability, human dignity, and boundless athletic potential.",
        sectionType: "vision",
        imageId: mediaMap.get("/images/about/hq-campus.webp"),
        sortOrder: 2,
        isActive: true,
      },
    ]);

    await db.insert(aboutTimelineEntries).values([
      {
        year: "1889",
        title: "Foundational Leather Mastery",
        description:
          "Allah Ditta Ghafuree establishes tanning and stretching innovations in Sialkot, pioneering sports goods manufacturing.",
        imageId: mediaMap.get("/images/about/heritage-1889.webp"),
        isActive: true,
        sortOrder: 1,
      },
      {
        year: "1904",
        title: "Ghafuree Industries Expansion",
        description:
          "Allah Ditta Sandal scales football output to 200,000 daily, training over 380,000 skilled artisans across the region.",
        imageId: mediaMap.get("/images/about/master-craftsmen.webp"),
        isActive: true,
        sortOrder: 2,
      },
      {
        year: "1942–1952",
        title: "International Export Footprint",
        description:
          "Founding of Sandal Trading Corporation and Loyal Sports, pioneering Star of Pakistan gear and exporting to Europe by 1958.",
        imageId: mediaMap.get("/images/about/master-craftsmen.webp"),
        isActive: true,
        sortOrder: 3,
      },
      {
        year: "1972–1974",
        title: "Synthetic Lamination & Adidas Era",
        description:
          "M. Iqbal Sandal invents PU-on-leather and fiber-texture lamination for match balls, bringing Adidas manufacturing to Pakistan.",
        imageId: mediaMap.get("/images/about/heritage-1889.webp"),
        isActive: true,
        sortOrder: 4,
      },
      {
        year: "1992",
        title: "Durus Industries Consolidation",
        description:
          "Family businesses unite under Durus Industries (Pvt) Ltd ('Durus' = strength, durability, and endurance in Arabic).",
        imageId: mediaMap.get("/images/about/hq-campus.webp"),
        isActive: true,
        sortOrder: 5,
      },
      {
        year: "Present",
        title: "RUN APPAREL Division",
        description:
          "Spun off as a dedicated sustainable B2B apparel manufacturer led by 4th generation director M. Hateem Jamshaid Iqbal.",
        imageId: mediaMap.get("/images/about/hateem-jamshaid.webp"),
        isActive: true,
        sortOrder: 6,
      },
    ]);

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

    await db.insert(aboutTeamMessages).values([
      {
        name: "M. Hateem Jamshaid Iqbal",
        position: "Chief Executive Officer & 4th Generation Director",
        title: "CEO & 4th Generation Director",
        message:
          "RUN is more than just a name—it's a commitment to going the extra mile. Every stitch reflects dedication to sustainability, quality, and ethical craftsmanship. Built for those who chase progress and never look back.",
        imageId: mediaMap.get("/images/about/hateem-jamshaid.webp"),
        isActive: true,
      },
    ]);

    // ── 13. NAVIGATION, FOOTER, CONTACT & LEGAL POLICIES ─────────────────────
    console.log("\n🧭 [Configuration] Populating Navigation, Footer & Authoritative Contacts...");
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
    console.log(`   - Media Assets Library: ${mediaMap.size} records inserted`);
    console.log(
      `   - 5 Core Categories: Team Wear, Active Wear, Casual Wear, Outer Wear, Sports Accessories`,
    );
    console.log(`   - 17 B2B Products: Fully linked to categories, media, fabrics & certs`);
    console.log(`   - 6 Technical Fabrics & 5 Certified Fibers: Swatch media connected`);
    console.log(`   - 10 Backed Certifications: Badges & document paths configured`);
    console.log(`   - 4 B2B Blog Articles: Linked to featured media & super admin author`);
    console.log(`   - CMS Singletons: Homepage, Manufacturing, Sustainability, Tech & About`);
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
