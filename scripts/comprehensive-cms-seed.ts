#!/usr/bin/env tsx

/**
 * Comprehensive CMS Seeding Script for RUN APPAREL (PVT) LTD
 * Seeds all admin management areas with realistic B2B content
 * Covers: Homepage, About, Sustainability, Manufacturing, Technology, Navigation
 */

import { db } from "../server/db.js";
// import { eq } from 'drizzle-orm'; // Unused
import {
  // About Page Management
  aboutHero,
  aboutMapLocations,
  aboutSections,
  aboutStatistics,
  aboutTeamMessages,
  aboutTimelineEntries,
  // Footer Management
  footerConfiguration,
  homepageFeaturedProductsSettings,
  // Core Business Entities (commented out - not used in this script)
  // categories,
  // products,
  // mediaAssets,
  // fabrics,
  // fibers,
  // certificates,
  // sizeCharts,
  // accessories,

  // Homepage Management
  homepageHero,
  homepageProcessCards,
  homepageSections,
  homepageSlogans,
  manufacturingCapabilities,
  // Manufacturing Management
  manufacturingHero,
  manufacturingProcesses,
  manufacturingQualities,
  sustainabilityGoals,
  // Sustainability Management
  sustainabilityHero,
  sustainabilityInitiatives,
  sustainabilityMetrics,
  technologyEquipment,
  // Technology Management
  technologyHero,
  technologyInnovations,
  technologyResearch,
} from "../shared/schema.js";

async function comprehensiveCMSSeeding() {
  try {
    await db.delete(homepageHero);
    await db.delete(homepageSlogans);
    await db.delete(homepageProcessCards);
    await db.delete(homepageSections);

    await db.delete(homepageFeaturedProductsSettings);

    await db.delete(aboutHero);
    await db.delete(aboutTimelineEntries);
    await db.delete(aboutMapLocations);
    await db.delete(aboutSections);
    await db.delete(aboutStatistics);
    await db.delete(aboutTeamMessages);

    await db.delete(sustainabilityHero);
    await db.delete(sustainabilityMetrics);
    await db.delete(sustainabilityInitiatives);
    await db.delete(sustainabilityGoals);

    await db.delete(manufacturingHero);
    await db.delete(manufacturingProcesses);
    await db.delete(manufacturingCapabilities);
    await db.delete(manufacturingQualities);

    await db.delete(technologyHero);
    await db.delete(technologyInnovations);
    await db.delete(technologyEquipment);
    await db.delete(technologyResearch);

    await db.delete(footerConfiguration);
    const homepageHeroData = [
      {
        title: "Professional B2B Sportswear Manufacturing",
        subtitle: "Your Trusted Partner in Athletic Apparel Excellence",
        description:
          "RUN APPAREL delivers premium sportswear manufacturing solutions with cutting-edge technology, sustainable practices, and unmatched quality for global brands.",
        ctaText: "Explore Our Capabilities",
        ctaLink: "/manufacturing",
        isActive: true,
        sortOrder: 1,
      },
      {
        title: "Innovation Meets Performance",
        subtitle: "Advanced Materials & Manufacturing Excellence",
        description:
          "Discover our state-of-the-art manufacturing processes, premium fabric selection, and commitment to delivering exceptional athletic wear for your brand.",
        ctaText: "View Our Technology",
        ctaLink: "/technology",
        isActive: true,
        sortOrder: 2,
      },
    ];

    const insertedHomepageHero = await db.insert(homepageHero).values(homepageHeroData).returning();
    const homepageSloganData = [
      {
        text: "Crafting Excellence in Every Thread",
        position: "hero-overlay",
        fontSize: "large",
        color: "white",
        animationType: "fade-in",
        isActive: true,
        sortOrder: 1,
      },
      {
        text: "Where Innovation Meets Athletic Performance",
        position: "section-divider",
        fontSize: "medium",
        color: "dark",
        animationType: "slide-up",
        isActive: true,
        sortOrder: 2,
      },
      {
        text: "Sustainable Manufacturing for Tomorrow's Champions",
        position: "sustainability-section",
        fontSize: "medium",
        color: "green",
        animationType: "typewriter",
        isActive: true,
        sortOrder: 3,
      },
    ];

    const insertedHomepageSlogans = await db
      .insert(homepageSlogans)
      .values(homepageSloganData)
      .returning();
    const homepageProcessData = [
      {
        title: "Design Consultation",
        description:
          "Collaborative design process with your team to create custom athletic wear that meets your brand specifications and performance requirements.",
        iconName: "design-tools",
        step: 1,
        isActive: true,
        sortOrder: 1,
      },
      {
        title: "Material Selection",
        description:
          "Choose from our premium fabric collection including moisture-wicking, sustainable, and performance-enhanced materials.",
        iconName: "fabric-roll",
        step: 2,
        isActive: true,
        sortOrder: 2,
      },
      {
        title: "Prototype Development",
        description:
          "Rapid prototyping and sampling to ensure perfect fit, comfort, and performance before full-scale production.",
        iconName: "prototype",
        step: 3,
        isActive: true,
        sortOrder: 3,
      },
      {
        title: "Quality Manufacturing",
        description:
          "State-of-the-art manufacturing with rigorous quality control and compliance with international standards.",
        iconName: "manufacturing",
        step: 4,
        isActive: true,
        sortOrder: 4,
      },
    ];

    const insertedProcessCards = await db
      .insert(homepageProcessCards)
      .values(homepageProcessData)
      .returning();
    const homepageSectionData = [
      {
        name: "capabilities-overview",
        title: "Our Manufacturing Capabilities",
        content:
          "With over two decades of experience in sportswear manufacturing, RUN APPAREL combines traditional craftsmanship with cutting-edge technology to deliver exceptional athletic wear for leading global brands.",
        sectionType: "content-block",
        data: {
          features: [
            "Custom Design Services",
            "Sustainable Materials",
            "Global Shipping",
            "Quality Assurance",
          ],
          metrics: {
            experience: "20+ Years",
            capacity: "1M+ Units/Month",
            clients: "150+ Brands",
          },
        },
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "sustainability-commitment",
        title: "Sustainability at Our Core",
        content:
          "Environmental responsibility drives our manufacturing processes, from eco-friendly materials to energy-efficient production methods.",
        sectionType: "sustainability-highlight",
        data: {
          initiatives: [
            "Carbon Neutral Production",
            "Recycled Materials Program",
            "Water Conservation",
            "Renewable Energy",
          ],
          certifications: ["GOTS Certified", "OEKO-TEX Standard", "ISO 14001"],
        },
        isActive: true,
        sortOrder: 2,
      },
    ];

    const insertedHomepageSections = await db
      .insert(homepageSections)
      .values(homepageSectionData)
      .returning();
    const aboutHeroData = [
      {
        title: "Crafting Athletic Excellence Since 2003",
        subtitle: "Two Decades of Innovation in Sportswear Manufacturing",
        description:
          "From humble beginnings as a small textile workshop to becoming a leading B2B sportswear manufacturer, RUN APPAREL has consistently delivered quality, innovation, and sustainability to global athletic brands.",
        isActive: true,
      },
    ];

    const insertedAboutHero = await db.insert(aboutHero).values(aboutHeroData).returning();
    const aboutTimelineData = [
      {
        year: "2003",
        title: "Company Founded",
        description:
          "Started as a small textile workshop with a vision to create premium athletic wear for local sports teams.",
        isActive: true,
        sortOrder: 1,
      },
      {
        year: "2007",
        title: "First International Client",
        description:
          "Expanded operations to serve international sports brands, establishing our reputation for quality and reliability.",
        isActive: true,
        sortOrder: 2,
      },
      {
        year: "2012",
        title: "Sustainability Initiative Launch",
        description:
          "Launched our comprehensive sustainability program, focusing on eco-friendly materials and carbon reduction.",
        isActive: true,
        sortOrder: 3,
      },
      {
        year: "2018",
        title: "Advanced Technology Integration",
        description:
          "Invested in state-of-the-art manufacturing equipment and digital design capabilities for enhanced efficiency.",
        isActive: true,
        sortOrder: 4,
      },
      {
        year: "2023",
        title: "20th Anniversary & Global Expansion",
        description:
          "Celebrated two decades of excellence while expanding our global footprint to serve 150+ brands worldwide.",
        isActive: true,
        sortOrder: 5,
      },
    ];

    const insertedAboutTimeline = await db
      .insert(aboutTimelineEntries)
      .values(aboutTimelineData)
      .returning();
    const aboutLocationData = [
      {
        name: "Headquarters & Main Factory",
        latitude: "6.9271",
        longitude: "79.8612",
        description:
          "Our main manufacturing facility and corporate headquarters in Colombo, Sri Lanka.",
        address: "123 Industrial Zone, Colombo 15, Sri Lanka",
        locationType: "headquarters",
        isActive: true,
      },
      {
        name: "European Distribution Center",
        latitude: "52.5200",
        longitude: "13.4050",
        description: "Strategic distribution hub serving European markets.",
        address: "Distribution Center, Berlin, Germany",
        locationType: "distribution",
        isActive: true,
      },
      {
        name: "North American Office",
        latitude: "40.7128",
        longitude: "-74.0060",
        description: "Sales and customer service office for North American clients.",
        address: "Business Center, New York, USA",
        locationType: "office",
        isActive: true,
      },
    ];

    const insertedAboutLocations = await db
      .insert(aboutMapLocations)
      .values(aboutLocationData)
      .returning();
    const aboutStatisticsData = [
      {
        label: "Years of Experience",
        value: "20+",
        unit: "Years",
        description: "Two decades of excellence in sportswear manufacturing",
        iconName: "calendar",
        isActive: true,
        sortOrder: 1,
      },
      {
        label: "Global Brands Served",
        value: "150+",
        unit: "Brands",
        description: "Trusted manufacturing partner for leading athletic brands worldwide",
        iconName: "global",
        isActive: true,
        sortOrder: 2,
      },
      {
        label: "Monthly Production Capacity",
        value: "1M+",
        unit: "Units",
        description: "Large-scale production capabilities with consistent quality",
        iconName: "factory",
        isActive: true,
        sortOrder: 3,
      },
      {
        label: "Countries Shipping To",
        value: "45+",
        unit: "Countries",
        description: "Global reach with reliable international shipping networks",
        iconName: "shipping",
        isActive: true,
        sortOrder: 4,
      },
    ];

    const insertedAboutStatistics = await db
      .insert(aboutStatistics)
      .values(aboutStatisticsData)
      .returning();
    const sustainabilityHeroData = [
      {
        title: "Sustainable Manufacturing for a Better Tomorrow",
        subtitle: "Environmental Responsibility in Every Thread",
        description:
          "Our commitment to sustainability goes beyond compliance—it's at the heart of everything we do. From renewable energy to recycled materials, we're building a more sustainable future for the athletic wear industry.",
        isActive: true,
      },
    ];

    const insertedSustainabilityHero = await db
      .insert(sustainabilityHero)
      .values(sustainabilityHeroData)
      .returning();
    const sustainabilityMetricsData = [
      {
        name: "Carbon Footprint Reduction",
        value: "45",
        unit: "%",
        description: "Reduction in carbon emissions since 2020",
        category: "emissions",
        iconName: "carbon-footprint",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Renewable Energy Usage",
        value: "80",
        unit: "%",
        description: "Percentage of operations powered by renewable energy",
        category: "energy",
        iconName: "solar-panel",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Water Conservation",
        value: "2.3M",
        unit: "Liters",
        description: "Liters of water saved through conservation initiatives",
        category: "water",
        iconName: "water-drop",
        isActive: true,
        sortOrder: 3,
      },
      {
        name: "Recycled Materials",
        value: "65",
        unit: "%",
        description: "Products incorporating recycled or sustainable materials",
        category: "materials",
        iconName: "recycle",
        isActive: true,
        sortOrder: 4,
      },
    ];

    const insertedSustainabilityMetrics = await db
      .insert(sustainabilityMetrics)
      .values(sustainabilityMetricsData)
      .returning();
    const manufacturingProcessData = [
      {
        name: "Fabric Inspection & Preparation",
        description:
          "Rigorous quality inspection of incoming fabrics followed by pre-treatment processes to ensure optimal manufacturing conditions.",
        step: 1,
        duration: "2-4 hours",
        equipment: [
          "Quality Control Scanners",
          "Fabric Relaxing Systems",
          "Pre-treatment Machines",
        ],
        specifications: {
          tolerance: "±0.5%",
          inspectionStandards: ["4-Point System", "Color Matching", "Shrinkage Testing"],
        },
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Pattern Making & Cutting",
        description:
          "Precision pattern creation using CAD systems followed by automated cutting for consistent piece accuracy.",
        step: 2,
        duration: "4-6 hours",
        equipment: ["CAD Systems", "Automated Cutting Machines", "Laser Cutters"],
        specifications: {
          accuracy: "±1mm",
          efficiency: "95%+ fabric utilization",
          capacity: "10,000 pieces/day",
        },
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Assembly & Sewing",
        description:
          "Skilled craftspeople assemble garments using advanced sewing equipment with automated quality checks.",
        step: 3,
        duration: "8-12 hours",
        equipment: ["Industrial Sewing Machines", "Overlock Machines", "Computerized Embroidery"],
        specifications: {
          stitchQuality: "Grade A",
          seamsPerInch: "12-14 SPI",
          qualityRate: "99.5%",
        },
        isActive: true,
        sortOrder: 3,
      },
    ];

    const insertedManufacturingProcesses = await db
      .insert(manufacturingProcesses)
      .values(manufacturingProcessData)
      .returning();
    const technologyInnovationData = [
      {
        name: "Moisture-Wicking Technology",
        description:
          "Advanced fiber treatment that pulls moisture away from skin for enhanced comfort during athletic activities.",
        category: "fabric-technology",
        benefits: ["Enhanced Comfort", "Quick Drying", "Odor Resistance", "Temperature Regulation"],
        developmentYear: "2018",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Seamless Construction",
        description:
          "Innovative knitting technology that creates garments without traditional seams for improved comfort and performance.",
        category: "manufacturing",
        benefits: [
          "Reduced Chafing",
          "Enhanced Fit",
          "Improved Durability",
          "Streamlined Production",
        ],
        developmentYear: "2020",
        isActive: true,
        sortOrder: 2,
      },
      {
        name: "Eco-Friendly Dyeing Process",
        description:
          "Waterless dyeing technology that reduces environmental impact while maintaining vibrant, long-lasting colors.",
        category: "sustainability",
        benefits: [
          "90% Water Reduction",
          "Zero Chemical Discharge",
          "Energy Efficient",
          "Color Fastness",
        ],
        developmentYear: "2021",
        isActive: true,
        sortOrder: 3,
      },
    ];

    const insertedTechnologyInnovations = await db
      .insert(technologyInnovations)
      .values(technologyInnovationData)
      .returning();
    const footerConfigData = {
      id: 1,
      navigationColumns: [
        {
          title: "Company",
          links: [
            { label: "Company", href: "/about" },
            { label: "About Us", href: "/about" },
            { label: "Manufacturing", href: "/manufacturing" },
            { label: "Technology", href: "/technology" },
            { label: "Sustainability", href: "/sustainability" },
          ],
        },
        {
          title: "Products",
          links: [
            { label: "All Products", href: "/products" },
            { label: "Categories", href: "/categories" },
            { label: "Fabrics", href: "/resources/fabrics" },
            { label: "Accessories", href: "/accessories" },
          ],
        },
        {
          title: "Resources",
          links: [
            { label: "Size Charts", href: "/size-charts" },
            { label: "Certifications", href: "/certifications" },
            { label: "Contact Us", href: "/contact" },
          ],
        },
      ],
      socialLinks: [
        {
          name: "LinkedIn",
          href: "https://linkedin.com/company/run-apparel",
          icon: "linkedin",
          hoverColor: "#0077b5",
        },
        {
          name: "Facebook",
          href: "https://facebook.com/runapparel",
          icon: "facebook",
          hoverColor: "#1877f2",
        },
        {
          name: "Instagram",
          href: "https://instagram.com/runapparel",
          icon: "instagram",
          hoverColor: "#e4405f",
        },
      ],
      certifications: [
        { name: "ISO 9001", imageUrl: "/certifications/iso9001.png" },
        { name: "OEKO-TEX", imageUrl: "/certifications/oekotex.png" },
        { name: "GOTS", imageUrl: "/certifications/gots.png" },
      ],
      legalLinks: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Cookie Policy", href: "/cookies" },
      ],
      companyName: "RUN APPAREL (PVT) LTD",
      companyAddress: "Colombo, Sri Lanka",
      companyEmail: "info@runapparel.com",
      companyPhone: "+94 11 234 5678",
      brandText:
        "Leading B2B sportswear manufacturer committed to quality, innovation, and sustainability.",
      brandTagline: "Your Partner in Premium Sportswear",
      brandSubtext: "Delivering excellence in athletic apparel manufacturing",
      contactFormHeading: "Get in Touch",
      contactFormEnabled: true,
      isActive: true,
    };

    const insertedFooterConfig = await db
      .insert(footerConfiguration)
      .values([footerConfigData])
      .returning();

    // Final Summary
    const finalCMSCounts = {
      homepageHero: insertedHomepageHero.length,
      homepageSlogans: insertedHomepageSlogans.length,
      homepageProcessCards: insertedProcessCards.length,
      homepageSections: insertedHomepageSections.length,

      aboutHero: insertedAboutHero.length,
      aboutTimeline: insertedAboutTimeline.length,
      aboutLocations: insertedAboutLocations.length,
      aboutStatistics: insertedAboutStatistics.length,
      sustainabilityHero: insertedSustainabilityHero.length,
      sustainabilityMetrics: insertedSustainabilityMetrics.length,
      manufacturingProcesses: insertedManufacturingProcesses.length,
      technologyInnovations: insertedTechnologyInnovations.length,
      footerConfiguration: insertedFooterConfig.length,
    };

    return finalCMSCounts;
  } catch (error) {
    throw error;
  }
}

// Execute CMS seeding
comprehensiveCMSSeeding()
  .then((results) => {
    process.exit(0);
  })
  .catch((error) => {
    process.exit(1);
  });
