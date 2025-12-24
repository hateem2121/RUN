#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Seed Missing CMS Entities
 * Adds missing HomepageFeaturedProductsSettings and other entities
 */

import { db } from '../server/db.js';
import { 
  aboutTeamMessages,
  homepageFeaturedProductsSettings,
  manufacturingCapabilities,
  manufacturingHero,
  manufacturingQualities,
  sustainabilityGoals,
  sustainabilityInitiatives,
  technologyEquipment,
  technologyHero,
  technologyResearch
} from '../shared/schema.js';

console.log('🌱 Seeding missing CMS entities...');

async function seedMissingEntities() {
  try {
    console.log('📊 Phase 1: Homepage Featured Products Settings');
    
    // Homepage Featured Products Settings
    const featuredProductsData = [{
      title: 'Featured Athletic Wear Collection',
      maxProducts: 8,
      autoSelect: true,
      selectedProductIds: [1, 2, 3, 4, 5, 6, 7, 8],
      sortBy: 'featured',
      isActive: true
    }];
    
    const insertedFeaturedProducts = await db.insert(homepageFeaturedProductsSettings)
      .values(featuredProductsData).returning();
    console.log(`✅ Seeded ${insertedFeaturedProducts.length} featured products settings`);

    console.log('📊 Phase 2: About Team Messages');
    
    // About Team Messages
    const teamMessagesData = [
      {
        name: 'Sarah Chen',
        position: 'CEO & Founder',
        message: 'Our vision at RUN APPAREL has always been to create exceptional athletic wear while maintaining the highest standards of sustainability and ethical manufacturing.',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Michael Rodriguez',
        position: 'Head of Manufacturing',
        message: 'With over 15 years in textile manufacturing, I ensure every piece meets our rigorous quality standards while embracing innovative production methods.',
        isActive: true,
        sortOrder: 2
      }
    ];
    
    const insertedTeamMessages = await db.insert(aboutTeamMessages)
      .values(teamMessagesData).returning();
    console.log(`✅ Seeded ${insertedTeamMessages.length} team messages`);

    console.log('📊 Phase 3: Sustainability Initiatives & Goals');
    
    // Sustainability Initiatives
    const sustainabilityInitiativesData = [
      {
        title: 'Zero Waste Manufacturing',
        description: 'Implementing comprehensive waste reduction strategies across all production facilities.',
        impact: 'Achieved 95% waste diversion from landfills, saving over 1,200 tons of material annually.',
        status: 'active',
        startDate: new Date('2023-01-01'),
        targetDate: new Date('2025-12-31'),
        isActive: true,
        sortOrder: 1
      },
      {
        title: 'Renewable Energy Transition',
        description: 'Converting all manufacturing facilities to 100% renewable energy sources.',
        impact: 'Reduced carbon footprint by 60% and achieved carbon neutrality in 3 facilities.',
        status: 'active',
        startDate: new Date('2022-06-01'),
        targetDate: new Date('2024-12-31'),
        isActive: true,
        sortOrder: 2
      }
    ];
    
    const insertedInitiatives = await db.insert(sustainabilityInitiatives)
      .values(sustainabilityInitiativesData).returning();
    console.log(`✅ Seeded ${insertedInitiatives.length} sustainability initiatives`);

    // Sustainability Goals
    const sustainabilityGoalsData = [
      {
        title: 'Carbon Neutral Manufacturing',
        description: 'Achieve complete carbon neutrality across all manufacturing operations by 2025.',
        target: '100% Carbon Neutral',
        currentProgress: 75.5,
        targetDate: new Date('2025-12-31'),
        category: 'emissions',
        priority: 'high',
        isActive: true,
        sortOrder: 1
      },
      {
        title: 'Circular Economy Implementation',
        description: 'Implement closed-loop manufacturing with 90% material reuse and recycling.',
        target: '90% Material Reuse',
        currentProgress: 45.0,
        targetDate: new Date('2026-06-30'),
        category: 'materials',
        priority: 'high',
        isActive: true,
        sortOrder: 2
      }
    ];
    
    const insertedGoals = await db.insert(sustainabilityGoals)
      .values(sustainabilityGoalsData).returning();
    console.log(`✅ Seeded ${insertedGoals.length} sustainability goals`);

    console.log('📊 Phase 4: Manufacturing Content');
    
    // Manufacturing Hero
    const manufacturingHeroData = [{
      title: 'Advanced Manufacturing Excellence',
      subtitle: 'Precision, Quality, Innovation',
      description: 'Our state-of-the-art manufacturing facilities combine traditional craftsmanship with cutting-edge technology to deliver exceptional athletic wear for global brands.',
      isActive: true
    }];
    
    const insertedManufacturingHero = await db.insert(manufacturingHero)
      .values(manufacturingHeroData).returning();
    console.log(`✅ Seeded ${insertedManufacturingHero.length} manufacturing hero entries`);

    // Manufacturing Capabilities
    const manufacturingCapabilitiesData = [
      {
        name: 'High-Volume Production',
        description: 'Large-scale manufacturing capabilities with consistent quality control.',
        capacity: '1,000,000',
        unit: 'units/month',
        category: 'production',
        specifications: {
          dailyCapacity: '35,000 units',
          qualityRate: '99.5%',
          leadTime: '14-21 days'
        },
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Custom Design Services',
        description: 'Full-service design and development from concept to production.',
        capacity: '50+',
        unit: 'designs/month',
        category: 'design',
        specifications: {
          designTeam: '12 specialists',
          turnaroundTime: '5-7 days',
          prototyping: 'Available'
        },
        isActive: true,
        sortOrder: 2
      }
    ];
    
    const insertedCapabilities = await db.insert(manufacturingCapabilities)
      .values(manufacturingCapabilitiesData).returning();
    console.log(`✅ Seeded ${insertedCapabilities.length} manufacturing capabilities`);

    console.log('📊 Phase 5: Technology Content');
    
    // Technology Hero
    const technologyHeroData = [{
      title: 'Innovation at Every Thread',
      subtitle: 'Advanced Technology Driving Athletic Performance',
      description: 'Our research and development team continuously innovates to create breakthrough technologies that enhance athletic performance and sustainability.',
      isActive: true
    }];
    
    const insertedTechnologyHero = await db.insert(technologyHero)
      .values(technologyHeroData).returning();
    console.log(`✅ Seeded ${insertedTechnologyHero.length} technology hero entries`);

    // Technology Equipment
    const technologyEquipmentData = [
      {
        name: 'Automated Cutting System',
        manufacturer: 'Lectra',
        model: 'Vector iX9',
        description: 'High-precision automated cutting system with AI-optimized fabric utilization.',
        specifications: {
          accuracy: '±0.1mm',
          speed: '120m/min',
          efficiency: '98% fabric utilization',
          maintenance: 'Predictive AI monitoring'
        },
        installationDate: new Date('2022-03-15'),
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Digital Textile Printer',
        manufacturer: 'EFI Reggiani',
        model: 'TERRA 320',
        description: 'Advanced digital textile printing system for custom designs and small batches.',
        specifications: {
          width: '3200mm',
          speed: '550 sqm/h',
          resolution: '1800 dpi',
          colorGamut: 'Extended RGB'
        },
        installationDate: new Date('2023-01-10'),
        isActive: true,
        sortOrder: 2
      }
    ];
    
    const insertedEquipment = await db.insert(technologyEquipment)
      .values(technologyEquipmentData).returning();
    console.log(`✅ Seeded ${insertedEquipment.length} technology equipment entries`);

    // Technology Research
    const technologyResearchData = [
      {
        title: 'Bio-Based Performance Fibers',
        description: 'Development of high-performance athletic wear using bio-based and biodegradable fiber technologies.',
        researchArea: 'Sustainable Materials',
        status: 'ongoing',
        startDate: new Date('2023-06-01'),
        expectedCompletion: new Date('2024-12-31'),
        partners: ['University of Technology', 'Bio-Materials Institute', 'Sustainable Textiles Research Center'],
        funding: 2500000,
        isActive: true
      },
      {
        title: 'Smart Fabric Integration',
        description: 'Research into integrating sensor technology and smart materials into athletic wear for performance monitoring.',
        researchArea: 'Wearable Technology',
        status: 'planning',
        startDate: new Date('2024-03-01'),
        expectedCompletion: new Date('2025-09-30'),
        partners: ['Tech Innovation Lab', 'Sports Science Institute'],
        funding: 1800000,
        isActive: true
      }
    ];
    
    const insertedResearch = await db.insert(technologyResearch)
      .values(technologyResearchData).returning();
    console.log(`✅ Seeded ${insertedResearch.length} technology research entries`);

    console.log('\n📋 MISSING ENTITIES SEEDING COMPLETED ✅');
    console.log('==========================================');
    console.log(`🎯 Featured Products Settings: ${insertedFeaturedProducts.length}`);
    console.log(`👥 Team Messages: ${insertedTeamMessages.length}`);
    console.log(`🌱 Sustainability Initiatives: ${insertedInitiatives.length}`);
    console.log(`🎯 Sustainability Goals: ${insertedGoals.length}`);
    console.log(`🏭 Manufacturing Hero: ${insertedManufacturingHero.length}`);
    console.log(`⚙️ Manufacturing Capabilities: ${insertedCapabilities.length}`);
    console.log(`🔬 Technology Hero: ${insertedTechnologyHero.length}`);
    console.log(`🛠️ Technology Equipment: ${insertedEquipment.length}`);
    console.log(`📊 Technology Research: ${insertedResearch.length}`);
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Seeding missing entities failed:', error);
    throw error;
  }
}

seedMissingEntities()
  .then(() => {
    console.log('✅ Missing entities seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
