#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Seed Missing CMS Entities
 * Adds missing HomepageFeaturedProductsSettings and other entities
 */

import { db } from "../server/db.js";
import {
  aboutTeamMessages,
  homepageFeaturedProductsSettings,
  manufacturingCapabilities,
  manufacturingHero,
  sustainabilityGoals,
  sustainabilityInitiatives,
  technologyEquipment,
  technologyHero,
  technologyResearch,
} from "../shared/schema.js";

async function seedMissingEntities() {
  // Homepage Featured Products Settings
  const featuredProductsData = [
    {
      title: "Featured Athletic Wear Collection",
      maxProducts: 8,
      autoSelect: true,
      selectedProductIds: [1, 2, 3, 4, 5, 6, 7, 8],
      sortBy: "featured",
      isActive: true,
    },
  ];

  const _insertedFeaturedProducts = await db
    .insert(homepageFeaturedProductsSettings)
    .values(featuredProductsData)
    .returning();

  // About Team Messages
  const teamMessagesData = [
    {
      name: "Sarah Chen",
      position: "CEO & Founder",
      message:
        "Our vision at RUN APPAREL has always been to create exceptional athletic wear while maintaining the highest standards of sustainability and ethical manufacturing.",
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Michael Rodriguez",
      position: "Head of Manufacturing",
      message:
        "With over 15 years in textile manufacturing, I ensure every piece meets our rigorous quality standards while embracing innovative production methods.",
      isActive: true,
      sortOrder: 2,
    },
  ];

  const _insertedTeamMessages = await db
    .insert(aboutTeamMessages)
    .values(teamMessagesData)
    .returning();

  // Sustainability Initiatives
  const sustainabilityInitiativesData = [
    {
      title: "Zero Waste Manufacturing",
      description:
        "Implementing comprehensive waste reduction strategies across all production facilities.",
      impact:
        "Achieved 95% waste diversion from landfills, saving over 1,200 tons of material annually.",
      status: "active",
      startDate: new Date("2023-01-01"),
      targetDate: new Date("2025-12-31"),
      isActive: true,
      sortOrder: 1,
    },
    {
      title: "Renewable Energy Transition",
      description: "Converting all manufacturing facilities to 100% renewable energy sources.",
      impact: "Reduced carbon footprint by 60% and achieved carbon neutrality in 3 facilities.",
      status: "active",
      startDate: new Date("2022-06-01"),
      targetDate: new Date("2024-12-31"),
      isActive: true,
      sortOrder: 2,
    },
  ];

  const _insertedInitiatives = await db
    .insert(sustainabilityInitiatives)
    .values(sustainabilityInitiativesData)
    .returning();

  // Sustainability Goals
  const sustainabilityGoalsData = [
    {
      title: "Carbon Neutral Manufacturing",
      description:
        "Achieve complete carbon neutrality across all manufacturing operations by 2025.",
      target: "100% Carbon Neutral",
      currentProgress: 75.5,
      targetDate: new Date("2025-12-31"),
      category: "emissions",
      priority: "high",
      isActive: true,
      sortOrder: 1,
    },
    {
      title: "Circular Economy Implementation",
      description: "Implement closed-loop manufacturing with 90% material reuse and recycling.",
      target: "90% Material Reuse",
      currentProgress: 45.0,
      targetDate: new Date("2026-06-30"),
      category: "materials",
      priority: "high",
      isActive: true,
      sortOrder: 2,
    },
  ];

  const _insertedGoals = await db
    .insert(sustainabilityGoals)
    .values(sustainabilityGoalsData)
    .returning();

  // Manufacturing Hero
  const manufacturingHeroData = [
    {
      title: "Advanced Manufacturing Excellence",
      subtitle: "Precision, Quality, Innovation",
      description:
        "Our state-of-the-art manufacturing facilities combine traditional craftsmanship with cutting-edge technology to deliver exceptional athletic wear for global brands.",
      isActive: true,
    },
  ];

  const _insertedManufacturingHero = await db
    .insert(manufacturingHero)
    .values(manufacturingHeroData)
    .returning();

  // Manufacturing Capabilities
  const manufacturingCapabilitiesData = [
    {
      name: "High-Volume Production",
      description: "Large-scale manufacturing capabilities with consistent quality control.",
      capacity: "1,000,000",
      unit: "units/month",
      category: "production",
      specifications: {
        dailyCapacity: "35,000 units",
        qualityRate: "99.5%",
        leadTime: "14-21 days",
      },
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Custom Design Services",
      description: "Full-service design and development from concept to production.",
      capacity: "50+",
      unit: "designs/month",
      category: "design",
      specifications: {
        designTeam: "12 specialists",
        turnaroundTime: "5-7 days",
        prototyping: "Available",
      },
      isActive: true,
      sortOrder: 2,
    },
  ];

  const _insertedCapabilities = await db
    .insert(manufacturingCapabilities)
    .values(manufacturingCapabilitiesData)
    .returning();

  // Technology Hero
  const technologyHeroData = [
    {
      title: "Innovation at Every Thread",
      subtitle: "Advanced Technology Driving Athletic Performance",
      description:
        "Our research and development team continuously innovates to create breakthrough technologies that enhance athletic performance and sustainability.",
      isActive: true,
    },
  ];

  const _insertedTechnologyHero = await db
    .insert(technologyHero)
    .values(technologyHeroData)
    .returning();

  // Technology Equipment
  const technologyEquipmentData = [
    {
      name: "Automated Cutting System",
      manufacturer: "Lectra",
      model: "Vector iX9",
      description: "High-precision automated cutting system with AI-optimized fabric utilization.",
      specifications: {
        accuracy: "±0.1mm",
        speed: "120m/min",
        efficiency: "98% fabric utilization",
        maintenance: "Predictive AI monitoring",
      },
      installationDate: new Date("2022-03-15"),
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "Digital Textile Printer",
      manufacturer: "EFI Reggiani",
      model: "TERRA 320",
      description: "Advanced digital textile printing system for custom designs and small batches.",
      specifications: {
        width: "3200mm",
        speed: "550 sqm/h",
        resolution: "1800 dpi",
        colorGamut: "Extended RGB",
      },
      installationDate: new Date("2023-01-10"),
      isActive: true,
      sortOrder: 2,
    },
  ];

  const _insertedEquipment = await db
    .insert(technologyEquipment)
    .values(technologyEquipmentData)
    .returning();

  // Technology Research
  const technologyResearchData = [
    {
      title: "Bio-Based Performance Fibers",
      description:
        "Development of high-performance athletic wear using bio-based and biodegradable fiber technologies.",
      researchArea: "Sustainable Materials",
      status: "ongoing",
      startDate: new Date("2023-06-01"),
      expectedCompletion: new Date("2024-12-31"),
      partners: [
        "University of Technology",
        "Bio-Materials Institute",
        "Sustainable Textiles Research Center",
      ],
      funding: 2500000,
      isActive: true,
    },
    {
      title: "Smart Fabric Integration",
      description:
        "Research into integrating sensor technology and smart materials into athletic wear for performance monitoring.",
      researchArea: "Wearable Technology",
      status: "planning",
      startDate: new Date("2024-03-01"),
      expectedCompletion: new Date("2025-09-30"),
      partners: ["Tech Innovation Lab", "Sports Science Institute"],
      funding: 1800000,
      isActive: true,
    },
  ];

  const _insertedResearch = await db
    .insert(technologyResearch)
    .values(technologyResearchData)
    .returning();
}

seedMissingEntities()
  .then(() => {
    process.exit(0);
  })
  .catch((_error) => {
    process.exit(1);
  });
