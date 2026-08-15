/**
 * Comprehensive Idempotent Database Seeding Engine for RUN APPAREL
 * Populates all B2B catalog items, materials, certificates, and CMS content fixtures.
 */

import "dotenv/config";
import {
  aboutHero,
  aboutMapLocations,
  aboutSections,
  aboutTeamMessages,
  aboutTimelineEntries,
  accessories,
  categories,
  certificates,
  contactPageConfigurations,
  fabrics,
  fibers,
  footerConfiguration,
  homepageFeaturedProductsSettings,
  homepageHero,
  homepageProcessCards,
  homepageSlogans,
  legalPolicies,
  manufacturingCapabilities,
  manufacturingHero,
  manufacturingProcesses,
  manufacturingQualities,
  navigationItems,
  products,
  sizeCharts,
  sustainabilityGoals,
  sustainabilityHero,
  sustainabilityInitiatives,
  sustainabilityMetrics,
  technologyEquipment,
  technologyHero,
  technologyInnovations,
} from "@run-remix/shared";
import { eq } from "drizzle-orm";
import { closeDatabaseConnection, db } from "../server/db.js";

async function seed() {
  console.log("🌱 [Seed Engine] Starting comprehensive B2B database provisioning...");
  const startTime = Date.now();

  try {
    // ── 1. Categories ────────────────────────────────────────────────────────
    console.log("📦 Seeding Categories...");
    const categoryData = [
      {
        name: "Athletic Wear",
        slug: "athletic-wear",
        description: "Engineered performance apparel for high-impact sports and athletic training.",
        isActive: true,
        sortOrder: 10,
      },
      {
        name: "EVERYDAY RUN",
        slug: "everyday-run",
        description: "Comfortable apparel for daily running activities",
        isActive: true,
        sortOrder: 20,
      },
      {
        name: "RUN AS ONE",
        slug: "run-as-one",
        description: "Team-focused running gear and apparel",
        isActive: true,
        sortOrder: 30,
      },
      {
        name: "ACTIVE RUN",
        slug: "active-run",
        description: "High-performance gear for intensive running",
        isActive: true,
        sortOrder: 40,
      },
      {
        name: "Outerwear",
        slug: "outerwear",
        description: "Weather-resistant technical outerwear for athletes",
        isActive: true,
        sortOrder: 50,
      },
      {
        name: "Tops",
        slug: "tops",
        description: "Performance tops, shirts, and technical jerseys",
        isActive: true,
        sortOrder: 60,
      },
    ];

    const categoryMap = new Map<string, number>();

    for (const cat of categoryData) {
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, cat.slug))
        .limit(1);

      if (existing.length > 0) {
        categoryMap.set(cat.slug, existing[0].id);
      } else {
        const [inserted] = await db.insert(categories).values(cat).returning();
        categoryMap.set(cat.slug, inserted.id);
      }
    }
    console.log(`  ✓ Seeded ${categoryMap.size} categories`);

    // ── 2. Fabrics ───────────────────────────────────────────────────────────
    console.log("🧵 Seeding Fabrics...");
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
      const existing = await db
        .select()
        .from(fabrics)
        .where(eq(fabrics.name, fabric.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(fabrics).values(fabric);
      }
    }
    console.log(`  ✓ Seeded ${fabricData.length} fabrics`);

    // ── 3. Fibers ────────────────────────────────────────────────────────────
    console.log("🌾 Seeding Fibers...");
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
      const existing = await db.select().from(fibers).where(eq(fibers.name, fiber.name)).limit(1);

      if (existing.length === 0) {
        await db.insert(fibers).values(fiber);
      }
    }
    console.log(`  ✓ Seeded ${fiberData.length} fibers`);

    // ── 4. Certificates ──────────────────────────────────────────────────────
    console.log("📜 Seeding Certificates...");
    const certificateData = [
      {
        name: "GOTS",
        fullName: "Global Organic Textile Standard",
        issuingOrganization: "Global Organic Textile Standard International",
        issuingBody: "Global Organic Textile Standard International",
        description: "Organic textile certification",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/gots-sample.pdf",
        status: "active",
        isActive: true,
      },
      {
        name: "OEKO-TEX Standard 100",
        fullName: "OEKO-TEX Standard 100",
        issuingOrganization: "OEKO-TEX Association",
        issuingBody: "OEKO-TEX Association",
        description: "Textile safety certification",
        showOnSustainabilityPage: true,
        documentUrl: "/docs/certificates/oeko-sample.pdf",
        status: "active",
        isActive: true,
      },
      {
        name: "Cradle to Cradle",
        fullName: "Cradle to Cradle Certified",
        issuingOrganization: "Cradle to Cradle Products Innovation Institute",
        issuingBody: "Cradle to Cradle Products Innovation Institute",
        description: "Circular economy certification",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "GRS",
        fullName: "Global Recycled Standard",
        issuingOrganization: "Textile Exchange",
        issuingBody: "Textile Exchange",
        description: "Recycled content verification",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "Better Cotton",
        fullName: "Better Cotton Initiative",
        issuingOrganization: "Better Cotton Initiative",
        issuingBody: "Better Cotton Initiative",
        description: "Sustainable cotton certification",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "Responsible Wool",
        fullName: "Responsible Wool Standard",
        issuingOrganization: "Textile Exchange",
        issuingBody: "Textile Exchange",
        description: "Ethical wool certification",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "bluesign®",
        fullName: "bluesign® approved",
        issuingOrganization: "bluesign technologies ag",
        issuingBody: "bluesign technologies ag",
        description: "Chemical safety certification",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "GREENGUARD",
        fullName: "GREENGUARD Gold",
        issuingOrganization: "UL Environment",
        issuingBody: "UL Environment",
        description: "Low chemical emissions",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "Fair Trade",
        fullName: "Fair Trade Certified",
        issuingOrganization: "Fair Trade USA",
        issuingBody: "Fair Trade USA",
        description: "Fair labor practices certification",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "ISO 14001",
        fullName: "ISO 14001 Environmental Management",
        issuingOrganization: "International Organization for Standardization",
        issuingBody: "International Organization for Standardization",
        description: "Environmental management system",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
      {
        name: "SA8000",
        fullName: "Social Accountability 8000",
        issuingOrganization: "Social Accountability International",
        issuingBody: "Social Accountability International",
        description: "Social accountability certification",
        showOnSustainabilityPage: true,
        status: "active",
        isActive: true,
      },
    ];

    for (const cert of certificateData) {
      const existing = await db
        .select()
        .from(certificates)
        .where(eq(certificates.name, cert.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(certificates).values(cert);
      }
    }
    console.log(`  ✓ Seeded ${certificateData.length} certificates`);

    // ── 5. Size Charts ───────────────────────────────────────────────────────
    console.log("📐 Seeding Size Charts...");
    const sizeChartData = [
      {
        name: "Unisex Performance Sizing",
        category: "Apparel",
        gender: "Unisex",
        type: "Standard",
        region: "Global",
        unit: "cm",
        sizeRange: ["XS", "S", "M", "L", "XL", "2XL"],
        fitNotes: "Athletic compression fit. Size up for relaxed fit.",
        isActive: true,
      },
      {
        name: "Men's Athletic Fit",
        category: "Tops",
        gender: "Men",
        type: "Athletic",
        region: "US/EU",
        unit: "cm",
        sizeRange: ["S", "M", "L", "XL", "2XL", "3XL"],
        fitNotes: "Tapered waist with broad shoulder room.",
        isActive: true,
      },
      {
        name: "Women's Elite Fit",
        category: "Tops",
        gender: "Women",
        type: "Fitted",
        region: "US/EU",
        unit: "cm",
        sizeRange: ["XS", "S", "M", "L", "XL"],
        fitNotes: "Ergonomic contouring for performance movement.",
        isActive: true,
      },
    ];

    for (const sc of sizeChartData) {
      const existing = await db
        .select()
        .from(sizeCharts)
        .where(eq(sizeCharts.name, sc.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(sizeCharts).values(sc);
      }
    }
    console.log(`  ✓ Seeded ${sizeChartData.length} size charts`);

    // ── 6. Accessories ───────────────────────────────────────────────────────
    console.log("🎒 Seeding Accessories...");
    const accessoryData = [
      {
        name: "Performance Running Socks",
        description:
          "Moisture-wicking running socks - Cushioned heel/toe, seamless construction, arch support",
        category: "Footwear",
        type: "Socks",
        material: "Synthetic Blend",
        isActive: true,
      },
      {
        name: "Reflective Running Vest",
        description:
          "High-visibility safety vest - 360° reflectivity, lightweight mesh, adjustable fit",
        category: "Safety",
        type: "Vest",
        material: "Mesh Polyester",
        isActive: true,
      },
      {
        name: "GPS Sports Watch",
        description:
          "Advanced running tracking device - GPS, heart rate monitor, 20-hour battery, waterproof",
        category: "Technology",
        type: "Electronics",
        material: "Silicone/Plastic",
        isActive: true,
      },
      {
        name: "Hydration Belt",
        description:
          "Multi-bottle hydration system - 4 x 8oz bottles, adjustable belt, bounce-free design",
        category: "Hydration",
        type: "Belt",
        material: "Nylon",
        isActive: true,
      },
      {
        name: "Compression Arm Sleeves",
        description:
          "Performance arm compression - Graduated compression, UV protection, moisture-wicking",
        category: "Compression",
        type: "Sleeves",
        material: "Elastane Blend",
        isActive: true,
      },
      {
        name: "Running Headband",
        description:
          "Sweat-absorbing headband - Non-slip grip, quick-dry fabric, one size fits all",
        category: "Headwear",
        type: "Headband",
        material: "Moisture-wicking Fabric",
        isActive: true,
      },
      {
        name: "LED Safety Light",
        description: "Rechargeable safety light - USB rechargeable, 3 light modes, water-resistant",
        category: "Safety",
        type: "Lighting",
        material: "Plastic/Electronics",
        isActive: true,
      },
      {
        name: "Insulated Water Bottle",
        description:
          "Temperature-controlled hydration - 24oz capacity, double-wall vacuum, 24hr cold retention",
        category: "Hydration",
        type: "Bottle",
        material: "Stainless Steel",
        isActive: true,
      },
      {
        name: "Running Gloves",
        description:
          "Lightweight performance gloves - Touchscreen compatible, reflective details, breathable palm",
        category: "Handwear",
        type: "Gloves",
        material: "Synthetic Leather",
        isActive: true,
      },
      {
        name: "Heart Rate Monitor",
        description:
          "Chest strap heart rate sensor - Bluetooth/ANT+ connectivity, soft textile strap, real-time data",
        category: "Technology",
        type: "Electronics",
        material: "Fabric/Electronics",
        isActive: true,
      },
      {
        name: "Running Hat",
        description: "Technical running cap - UPF 50+ sun protection, mesh panels, adjustable fit",
        category: "Headwear",
        type: "Cap",
        material: "Performance Polyester",
        isActive: true,
      },
      {
        name: "Calf Compression Sleeves",
        description:
          "Lower leg compression support - Graduated compression, shin splint relief, moisture management",
        category: "Compression",
        type: "Sleeves",
        material: "Elastane Blend",
        isActive: true,
      },
      {
        name: "Phone Armband",
        description:
          'Secure phone carrier - Fits 6.5" phones, sweat-resistant, easy access design',
        category: "Technology",
        type: "Carrier",
        material: "Neoprene",
        isActive: true,
      },
      {
        name: "Recovery Foam Roller",
        description: 'Muscle recovery tool - High-density foam, textured surface, 18" length',
        category: "Recovery",
        type: "Roller",
        material: "High-density Foam",
        isActive: true,
      },
      {
        name: "Running Belt",
        description:
          "Minimalist storage solution - Expandable pocket, bounce-free, fits phones/keys/gels",
        category: "Storage",
        type: "Belt",
        material: "Elastic Fabric",
        isActive: true,
      },
      {
        name: "Cooling Towel",
        description:
          "Instant cooling relief - Microfiber construction, activated by water, reusable",
        category: "Recovery",
        type: "Towel",
        material: "Microfiber",
        isActive: true,
      },
    ];

    for (const acc of accessoryData) {
      const existing = await db
        .select()
        .from(accessories)
        .where(eq(accessories.name, acc.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(accessories).values(acc);
      }
    }
    console.log(`  ✓ Seeded ${accessoryData.length} accessories`);

    // ── 7. Products ──────────────────────────────────────────────────────────
    console.log("👕 Seeding Products...");
    const athleticWearId = categoryMap.get("athletic-wear") || categoryMap.get("everyday-run") || 1;
    const outerwearId = categoryMap.get("outerwear") || athleticWearId;
    const topsId = categoryMap.get("tops") || athleticWearId;

    const productData = [
      {
        name: "Pro Performance Running Shirt",
        slug: "pro-performance-running-shirt",
        description:
          "Engineered for elite runners. Features ultra-breathable micro-mesh fabric, ergonomic flatlock stitching, and 360-degree reflective accents for low-light safety.",
        shortDescription: "Lightweight, moisture-wicking B2B performance running shirt.",
        categoryId: athleticWearId,
        sku: "RUN-SHIRT-001",
        urlPath: "/categories/athletic-wear/pro-performance-running-shirt",
        minimumOrderQuantity: 50,
        leadTime: "2-3 weeks",
        specifications: [
          "Moisture-wicking",
          "UPF 50+ UV Protection",
          "Anti-odor silver ion technology",
          "Seamless shoulder yoke",
        ],
        technicalSpecs: { GSM: 140, Weave: "Interlock", Finish: "Hydrophilic" },
        fiberComposition: "88% Recycled Polyester, 12% Elastane",
        tags: ["Running", "B2B", "Sustainable", "Performance"],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Elite Performance Aero-Jersey",
        slug: "elite-performance-aero-jersey",
        description:
          "A high-compression performance jersey engineered for maximum breathability and moisture-wicking capability.",
        shortDescription: "Professional grade performance jersey",
        categoryId: athleticWearId,
        sku: "RUN-AERO-002",
        urlPath: "/categories/athletic-wear/elite-performance-aero-jersey",
        minimumOrderQuantity: 100,
        leadTime: "3-4 weeks",
        specifications: [
          "Aerodynamic contouring",
          "Laser-cut ventilation",
          "Sublimation ready",
        ],
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Pro-Stretch Compression Leggings",
        slug: "pro-stretch-compression-leggings",
        description:
          "Seamless multi-panel leggings designed for high-intensity training with strategic ventilation zones.",
        shortDescription: "Technical compression leggings",
        categoryId: athleticWearId,
        sku: "RUN-LEG-003",
        urlPath: "/categories/athletic-wear/pro-stretch-compression-leggings",
        minimumOrderQuantity: 75,
        leadTime: "2-3 weeks",
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Urban Tech-Fleece Hoodie",
        slug: "urban-tech-fleece-hoodie",
        description:
          "A premium thermal layer combining street aesthetics with athletic functionality.",
        shortDescription: "Hybrid thermal hoodie",
        categoryId: outerwearId,
        sku: "RUN-FLEECE-004",
        urlPath: "/categories/outerwear/urban-tech-fleece-hoodie",
        minimumOrderQuantity: 50,
        leadTime: "4 weeks",
        isActive: true,
        isFeatured: true,
      },
      {
        name: "Velocity Marathon Singlet",
        slug: "velocity-marathon-singlet",
        description:
          "Ultralight racing singlet with bonded seams and zoned mesh panels for maximum airflow.",
        shortDescription: "Competition-grade racing singlet",
        categoryId: topsId,
        sku: "RUN-SING-005",
        urlPath: "/categories/tops/velocity-marathon-singlet",
        minimumOrderQuantity: 100,
        leadTime: "2-3 weeks",
        isActive: true,
        isFeatured: false,
      },
    ];

    for (const prod of productData) {
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.slug, prod.slug))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(products).values(prod);
      } else {
        await db
          .update(products)
          .set({
            name: prod.name,
            description: prod.description,
            shortDescription: prod.shortDescription,
            urlPath: prod.urlPath,
            isActive: true,
            isFeatured: prod.isFeatured,
          })
          .where(eq(products.slug, prod.slug));
      }
    }
    console.log(`  ✓ Seeded ${productData.length} products`);

    // ── 8. Homepage Content ──────────────────────────────────────────────────
    console.log("🏠 Seeding Homepage Content...");
    const heroRows = await db.select().from(homepageHero).limit(1);
    if (heroRows.length === 0) {
      await db.insert(homepageHero).values({
        title: "Next-Generation Sportswear Manufacturing",
        subtitle:
          "Engineering high-performance athletic apparel with precision, sustainability, and ethical excellence since 1889.",
        ctaText: "EXPLORE OUR CAPABILITIES",
        ctaLink: "/products",
        isActive: true,
      });
    } else {
      await db
        .update(homepageHero)
        .set({
          title: "Next-Generation Sportswear Manufacturing",
          subtitle:
            "Engineering high-performance athletic apparel with precision, sustainability, and ethical excellence since 1889.",
          ctaText: "EXPLORE OUR CAPABILITIES",
          isActive: true,
        })
        .where(eq(homepageHero.id, heroRows[0].id));
    }

    const sloganRows = await db.select().from(homepageSlogans).limit(1);
    if (sloganRows.length === 0) {
      await db.insert(homepageSlogans).values([
        {
          text: "Precision Engineering Meets Sustainable Performance",
          position: "top",
          isActive: true,
          sortOrder: 1,
        },
        {
          text: "Vertical Manufacturing for Global Athletic Brands",
          position: "middle",
          isActive: true,
          sortOrder: 2,
        },
        {
          text: "100% Ethical Sourcing & Net-Zero Carbon Commitment",
          position: "bottom",
          isActive: true,
          sortOrder: 3,
        },
      ]);
    }

    const processRows = await db.select().from(homepageProcessCards).limit(1);
    if (processRows.length === 0) {
      await db.insert(homepageProcessCards).values([
        {
          title: "Sustainable Sourcing",
          description: "Ethically certified organic and recycled raw materials.",
          step: 1,
          iconName: "IconLeaf",
          isActive: true,
        },
        {
          title: "Advanced Knitting & Weaving",
          description: "Precision computer-controlled textile engineering.",
          step: 2,
          iconName: "IconCpu",
          isActive: true,
        },
        {
          title: "Precision Assembly",
          description: "Laser cutting and automated ultrasonic bonding.",
          step: 3,
          iconName: "IconScissors",
          isActive: true,
        },
        {
          title: "Quality & Global Logistics",
          description: "Stringent quality control and seamless worldwide export.",
          step: 4,
          iconName: "IconTruck",
          isActive: true,
        },
      ]);
    }

    const featuredSettings = await db
      .select()
      .from(homepageFeaturedProductsSettings)
      .limit(1);
    if (featuredSettings.length === 0) {
      await db.insert(homepageFeaturedProductsSettings).values({
        title: "Featured B2B Collections",
        isActive: true,
      });
    }

    console.log("  ✓ Seeded Homepage CMS content");

    // ── 9. Manufacturing Content ─────────────────────────────────────────────
    console.log("🏭 Seeding Manufacturing Content...");
    const mfgHeroRows = await db.select().from(manufacturingHero).limit(1);
    if (mfgHeroRows.length === 0) {
      await db.insert(manufacturingHero).values({
        headline: "PRECISION AT SCALE",
        subheadline: "Advanced Textile Engineering & Vertical Production",
        description:
          "Operating regional state-of-the-art facilities with end-to-end quality assurance for international athletic brands.",
        ctaText: "REQUEST SPECIFICATIONS",
        ctaLink: "/contact",
        bottomCtaTitle: "Ready to Scale Your Production?",
        bottomCtaDescription:
          "Connect with our engineering team for technical capacity audits and custom fabrication timelines.",
        bottomCtaText: "CONTACT ENGINEERING",
        bottomCtaLink: "/contact",
        isActive: true,
      });
    } else {
      await db
        .update(manufacturingHero)
        .set({
          headline: "PRECISION AT SCALE",
          subheadline: "Advanced Textile Engineering & Vertical Production",
          description:
            "Operating regional state-of-the-art facilities with end-to-end quality assurance for international athletic brands.",
          isActive: true,
        })
        .where(eq(manufacturingHero.id, mfgHeroRows[0].id));
    }

    const standardProcesses = [
      {
        name: "Sustainable Material Sourcing",
        title: "Sourcing",
        description:
          "Procurement of high-performance technical fabrics from certified global partners. Carbon footprint analysis performed on every batch.",
        step: 1,
        duration: "24-48 hrs",
        efficiency: 98,
        category: "Sourcing",
        iconName: "IconLeaf",
        isActive: true,
      },
      {
        name: "Pattern Engineering & 3D CAD",
        title: "Digital CAD",
        description:
          "AI-assisted pattern making to maximize fabric utilization and fit precision. Generative design algorithms reduce waste by 18%.",
        step: 2,
        duration: "Continuous",
        efficiency: 99,
        category: "Design",
        iconName: "IconDraftingCompass",
        isActive: true,
      },
      {
        name: "Automated Laser Cutting",
        title: "Laser Cutting",
        description:
          "Automated high-speed laser cutting for sealed edges and micron-level accuracy. Zero-contact cutting preserves fabric integrity.",
        step: 3,
        duration: "Continuous",
        efficiency: 99,
        category: "Cutting",
        iconName: "IconScissors",
        isActive: true,
      },
      {
        name: "Ultrasonic Bonding & Assembly",
        title: "Assembly",
        description:
          "Ultrasonic bonding and flatlock stitching for seamless, chafe-free construction. Robotic arms assist in complex curvilinear seams.",
        step: 4,
        duration: "Continuous",
        efficiency: 97,
        category: "Assembly",
        iconName: "IconSparkles",
        isActive: true,
      },
      {
        name: "Optical QC & Steam Finishing",
        title: "Finishing",
        description:
          "Rigorous QC checks, steam finishing, and sustainable packaging protocols. Final product scanned against digital twin for variance.",
        step: 5,
        duration: "Per batch",
        efficiency: 100,
        category: "Finishing",
        iconName: "IconChecklist",
        isActive: true,
      },
    ];

    const mfgProcessRows = await db.select().from(manufacturingProcesses);
    if (mfgProcessRows.length < 5) {
      await db.delete(manufacturingProcesses);
      await db.insert(manufacturingProcesses).values(standardProcesses);
    }

    const mfgCapRows = await db.select().from(manufacturingCapabilities).limit(1);
    if (mfgCapRows.length === 0) {
      await db.insert(manufacturingCapabilities).values([
        {
          name: "High-Capacity Knitting",
          capacity: "500,000 Units / Month",
          description: "Seamless and multi-gauge circular knitting.",
          isActive: true,
        },
        {
          name: "Eco-Dyeing & Finishing",
          capacity: "80,000 kg / Day",
          description: "Closed-loop water recycling with zero liquid discharge.",
          isActive: true,
        },
      ]);
    }

    const mfgQualRows = await db.select().from(manufacturingQualities).limit(1);
    if (mfgQualRows.length === 0) {
      await db.insert(manufacturingQualities).values([
        {
          title: "100% In-Line Optical Inspection",
          standard: "AQL 1.5 Standard",
          description: "Zero defect tolerance on high-performance athletic apparel.",
          isActive: true,
        },
      ]);
    }
    console.log("  ✓ Seeded Manufacturing CMS content");

    // ── 10. Sustainability Content ───────────────────────────────────────────
    console.log("🌱 Seeding Sustainability Content...");
    const sustHeroRows = await db.select().from(sustainabilityHero).limit(1);
    if (sustHeroRows.length === 0) {
      await db.insert(sustainabilityHero).values({
        title: "Sustainability Woven Into Every Thread",
        subtitle:
          "Our commitment to ethical manufacturing and environmental stewardship.",
        description:
          "Leading the transition to circular apparel manufacturing through renewable energy, zero liquid discharge, and closed-loop recycling.",
        isActive: true,
      });
    } else {
      await db
        .update(sustainabilityHero)
        .set({
          title: "Sustainability Woven Into Every Thread",
          subtitle:
            "Our commitment to ethical manufacturing and environmental stewardship.",
          description:
            "Leading the transition to circular apparel manufacturing through renewable energy, zero liquid discharge, and closed-loop recycling.",
          isActive: true,
        })
        .where(eq(sustainabilityHero.id, sustHeroRows[0].id));
    }

    const sustMetricRows = await db.select().from(sustainabilityMetrics).limit(1);
    if (sustMetricRows.length === 0) {
      await db.insert(sustainabilityMetrics).values([
        {
          name: "Water Recycled",
          value: "85%",
          unit: "Recycled",
          description: "Closed-loop water treatment and ZLD filtration system.",
          category: "water",
          iconName: "Droplet",
          isActive: true,
          sortOrder: 1,
        },
        {
          name: "Renewable Energy",
          value: "65%",
          unit: "Solar & Wind",
          description: "Rooftop solar and wind powered manufacturing grid.",
          category: "energy",
          iconName: "Sun",
          isActive: true,
          sortOrder: 2,
        },
        {
          name: "Recycled Materials",
          value: "78%",
          unit: "Yarn Ratio",
          description: "Post-consumer recycled and bio-based yarn utilization.",
          category: "materials",
          iconName: "Recycle",
          isActive: true,
          sortOrder: 3,
        },
        {
          name: "Carbon Reduction",
          value: "-42%",
          unit: "vs 2020",
          description: "Emissions reduction across Scope 1 and Scope 2 operations.",
          category: "carbon",
          iconName: "Leaf",
          isActive: true,
          sortOrder: 4,
        },
      ]);
    }

    const sustInitRows = await db.select().from(sustainabilityInitiatives).limit(1);
    if (sustInitRows.length === 0) {
      await db.insert(sustainabilityInitiatives).values([
        {
          title: "Zero Liquid Discharge (ZLD) Facility",
          description:
            "Advanced membrane biological reactor recycling 85% of dye-house effluent back into production.",
          impact: "Saves 1.2M liters of water daily",
          category: "Water Conservation",
          isActive: true,
        },
        {
          title: "100% GOTS Certified Organic Cotton Program",
          description:
            "Direct-from-farm certified organic cotton sourcing with fair compensation for growers.",
          impact: "100% Pesticide-Free Supply Chain",
          category: "Raw Materials",
          isActive: true,
        },
      ]);
    }

    const sustGoalRows = await db.select().from(sustainabilityGoals).limit(1);
    if (sustGoalRows.length === 0) {
      await db.insert(sustainabilityGoals).values([
        {
          title: "Net-Zero Greenhouse Gas Emissions by 2030",
          targetDate: new Date("2030-12-31"),
          progress: 68,
          description: "Decarbonizing logistics, heat generation, and power grid.",
          isActive: true,
        },
      ]);
    }
    console.log("  ✓ Seeded Sustainability CMS content");

    // ── 11. Technology Content ───────────────────────────────────────────────
    console.log("🔬 Seeding Technology Content...");
    const techHeroRows = await db.select().from(technologyHero).limit(1);
    if (techHeroRows.length === 0) {
      await db.insert(technologyHero).values({
        title: "WHERE SCIENCE MEETS FABRIC",
        subtitle:
          "Advanced R&D and automated precision sportswear manufacturing.",
        description:
          "Integrating smart textiles, aerodynamic modeling, and thermal regulation technologies into B2B apparel production.",
        primaryButtonText: "EXPLORE INNOVATIONS",
        primaryButtonLink: "#innovations",
        secondaryButtonText: "TECHNICAL SPECS",
        secondaryButtonLink: "/contact",
        isActive: true,
      });
    } else {
      await db
        .update(technologyHero)
        .set({
          title: "WHERE SCIENCE MEETS FABRIC",
          subtitle:
            "Advanced R&D and automated precision sportswear manufacturing.",
          description:
            "Integrating smart textiles, aerodynamic modeling, and thermal regulation technologies into B2B apparel production.",
          isActive: true,
        })
        .where(eq(technologyHero.id, techHeroRows[0].id));
    }

    const techInnovRows = await db.select().from(technologyInnovations).limit(1);
    if (techInnovRows.length === 0) {
      await db.insert(technologyInnovations).values([
        {
          name: "AeroWeave™ Aerodynamic Structure",
          shortDescription: "Turbulent boundary layer reduction fabric structure.",
          description:
            "Engineered surface texture reducing drag in high-speed athletic movements.",
          category: "Textile Engineering",
          status: "Active",
          isActive: true,
        },
        {
          name: "HydroShield™ Bio-Membrane",
          shortDescription: "PFAS-free durable water repellent breathable membrane.",
          description:
            "High hydrostatic head waterproof protection with molecular vapor transmission.",
          category: "Weather Protection",
          status: "Active",
          isActive: true,
        },
      ]);
    }

    const techEquipRows = await db.select().from(technologyEquipment).limit(1);
    if (techEquipRows.length === 0) {
      await db.insert(technologyEquipment).values([
        {
          name: "Santoni Seamless Circular Knitting Machines",
          manufacturer: "Santoni S.p.A.",
          model: "SM8-TOP2V",
          category: "Knitting",
          quantity: 48,
          capacity: "24/7 Precision Tubular Weaving",
          isActive: true,
        },
      ]);
    }
    console.log("  ✓ Seeded Technology CMS content");

    // ── 12. About Page Content ───────────────────────────────────────────────
    console.log("🏢 Seeding About Page Content...");
    const aboutHeroRows = await db.select().from(aboutHero).limit(1);
    if (aboutHeroRows.length === 0) {
      await db.insert(aboutHero).values({
        title: "About RUN Apparel",
        subtitle:
          "From heritage craftsmanship to modern innovation, we define the future of B2B sportswear.",
        description:
          "Based in Sialkot and Faisalabad, RUN APPAREL (PVT) LTD operates one of the most advanced vertical manufacturing facilities in the region, serving global performance brands with speed and scale.",
        isActive: true,
      });
    } else {
      await db
        .update(aboutHero)
        .set({
          title: "About RUN Apparel",
          subtitle:
            "From heritage craftsmanship to modern innovation, we define the future of B2B sportswear.",
          isActive: true,
        })
        .where(eq(aboutHero.id, aboutHeroRows[0].id));
    }

    const aboutSectionRows = await db.select().from(aboutSections).limit(1);
    if (aboutSectionRows.length === 0) {
      await db.insert(aboutSections).values([
        {
          title: "Our Mission",
          content:
            "To empower global athletic brands with high-performance, sustainable, and ethically manufactured sportswear.",
          sectionType: "mission",
          sortOrder: 1,
          isActive: true,
        },
        {
          title: "Our Vision",
          content:
            "To lead the global textile manufacturing industry into an automated, carbon-neutral, and circular future.",
          sectionType: "vision",
          sortOrder: 2,
          isActive: true,
        },
      ]);
    }

    const mapRows = await db.select().from(aboutMapLocations).limit(1);
    if (mapRows.length === 0) {
      await db.insert(aboutMapLocations).values([
        {
          name: "Headquarters & Main Factory",
          city: "Sialkot",
          country: "Pakistan",
          address: "RUN Manufacturing Complex, Sialkot, Pakistan",
          latitude: "32.4945",
          longitude: "74.5229",
          locationType: "Headquarters",
          description: "Main vertical apparel manufacturing campus and R&D facility.",
          isActive: true,
        },
      ]);
    }

    const teamMsgRows = await db.select().from(aboutTeamMessages).limit(1);
    if (teamMsgRows.length === 0) {
      await db.insert(aboutTeamMessages).values([
        {
          name: "M. Hateem Jamshaid",
          position: "Founder & CEO",
          message:
            "Our commitment to quality, precision, and sustainability is woven into every garment we manufacture.",
          isActive: true,
        },
      ]);
    }

    const timelineRows = await db.select().from(aboutTimelineEntries).limit(1);
    if (timelineRows.length === 0) {
      await db.insert(aboutTimelineEntries).values([
        {
          year: "1889",
          title: "Heritage Craftsmanship Begins",
          description: "Foundational mastery in textile manufacturing.",
          isActive: true,
          sortOrder: 1,
        },
        {
          year: "2015",
          title: "Vertical Integration & Modernization",
          description:
            "Full digital supply chain and automated production lines.",
          isActive: true,
          sortOrder: 2,
        },
        {
          year: "2024",
          title: "Next-Gen Sustainable Performance",
          description:
            "Achieved GOTS and Zero Liquid Discharge certification milestones.",
          isActive: true,
          sortOrder: 3,
        },
      ]);
    }
    console.log("  ✓ Seeded About Page CMS content");

    // ── 13. Navigation & Footer ──────────────────────────────────────────────
    console.log("🧭 Seeding Navigation & Footer Configuration...");
    const navRows = await db.select().from(navigationItems).limit(1);
    if (navRows.length === 0) {
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
    }

    const footerRows = await db.select().from(footerConfiguration).limit(1);
    if (footerRows.length === 0) {
      await db.insert(footerConfiguration).values({
        companyName: "RUN APPAREL (PVT) LTD",
        companyAddress: "RUN Manufacturing Complex, Sialkot, Pakistan",
        companyEmail: "info@runapparel.com",
        companyPhone: "+92 52 1234567",
        brandText: "RUN APPAREL",
        brandTagline: "Precision Sportswear Manufacturing",
        brandSubtext: "Premium B2B Sustainable Apparel Manufacturing",
        contactFormHeading: "GET IN TOUCH WITH RUN APPAREL",
        contactFormEnabled: true,
        navigationColumns: [
          {
            title: "Capabilities",
            links: [
              { label: "Products", href: "/products" },
              { label: "Manufacturing", href: "/manufacturing" },
              { label: "Sustainability", href: "/sustainability" },
              { label: "Technology", href: "/technology" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About Us", href: "/about" },
              { label: "Certifications", href: "/certifications" },
              { label: "Fabrics", href: "/fabrics" },
              { label: "Contact", href: "/contact" },
            ],
          },
        ],
        legalLinks: [
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
          { label: "Ethical Sourcing", href: "/ethical-sourcing" },
        ],
      });
    }

    const contactConfigRows = await db
      .select()
      .from(contactPageConfigurations)
      .limit(1);
    if (contactConfigRows.length === 0) {
      await db.insert(contactPageConfigurations).values({
        title: "Contact RUN APPAREL",
        heroTitle: "Partner With Us for Precision Manufacturing",
        description:
          "Connect with our B2B production team for bespoke sportswear development and bulk manufacturing inquiries.",
        email: "sales@runapparel.com",
        phone: "+92 52 1234567",
        address: "RUN Manufacturing Complex, Sialkot, Pakistan",
        workingHours: "Monday - Friday: 08:00 - 18:00 PKT",
        formButtonText: "Get a Response Within 24 Hours",
        isActive: true,
      });
    }
    console.log("  ✓ Seeded Navigation & Footer configuration");

    // ── 14. Legal Policies ───────────────────────────────────────────────────
    console.log("⚖️ Seeding Legal Policies...");
    const legalData = [
      {
        slug: "privacy-policy",
        title: "Privacy Policy",
        content:
          "RUN APPAREL (PVT) LTD is committed to safeguarding customer data. We never share proprietary designs or customer information with unauthorized third parties.",
        isActive: true,
      },
      {
        slug: "terms-and-conditions",
        title: "Terms and Conditions",
        content:
          "All B2B manufacturing contracts are subject to agreed technical specifications, quality control criteria (AQL 1.5), and international trade terms (Incoterms 2020).",
        isActive: true,
      },
      {
        slug: "ethical-sourcing",
        title: "Ethical Sourcing Policy",
        content:
          "Our entire supply chain adheres strictly to SA8000 and fair labor standards, ensuring safe working conditions, fair living wages, and zero child labor.",
        isActive: true,
      },
    ];

    for (const policy of legalData) {
      const existing = await db
        .select()
        .from(legalPolicies)
        .where(eq(legalPolicies.slug, policy.slug))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(legalPolicies).values(policy);
      }
    }
    console.log(`  ✓ Seeded ${legalData.length} legal policies`);

    const elapsed = Date.now() - startTime;
    console.log(`\n🎉 [Seed Engine] Successfully seeded database in ${elapsed}ms! All B2B fixtures ready.`);
  } catch (error) {
    console.error("❌ [Seed Engine] Seeding failed:", error);
    process.exit(1);
  } finally {
    await closeDatabaseConnection();
  }
}

seed();
