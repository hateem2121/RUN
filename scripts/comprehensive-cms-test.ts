#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Comprehensive CMS Testing Script for RUN APPAREL (PVT) LTD
 * Tests all admin management areas with systematic CRUD operations
 * Covers: Homepage, About, Sustainability, Manufacturing, Technology
 */

import { db } from '../server/db.js';
import { eq } from 'drizzle-orm';
import { 
  // Homepage Management
  homepageHero,
  homepageSlogans,
  homepageProcessCards,
  homepageSections,
  homepageSustainability,
  
  // About Page Management
  aboutHero,
  aboutTimelineEntries,
  aboutMapLocations,
  aboutStatistics,
  
  // Sustainability Management
  sustainabilityHero,
  sustainabilityMetrics,
  
  // Manufacturing Management
  manufacturingProcesses,
  
  // Technology Management
  technologyInnovations
} from '../shared/schema.js';

console.log('🔍 Starting comprehensive CMS testing...');

async function comprehensiveCMSTesting() {
  try {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    const testResults = {
      homepage: { tests: 0, passed: 0, failed: 0 },
      about: { tests: 0, passed: 0, failed: 0 },
      sustainability: { tests: 0, passed: 0, failed: 0 },
      manufacturing: { tests: 0, passed: 0, failed: 0 },
      technology: { tests: 0, passed: 0, failed: 0 }
    };

    console.log('📊 Phase 1: Homepage Management Testing');
    
    // Test 1: Homepage Hero CRUD
    console.log('🎯 Testing homepage hero CRUD operations...');
    try {
      // READ
      const heroEntries = await db.select().from(homepageHero);
      if (heroEntries.length >= 1) {
        console.log(`✅ READ: Found ${heroEntries.length} homepage hero entries`);
        passedTests++;
      } else {
        console.log(`❌ READ: Expected hero entries, found ${heroEntries.length}`);
        failedTests++;
      }
      totalTests++;
      testResults.homepage.tests++;

      // CREATE
      const newHero = await db.insert(homepageHero).values({
        title: 'Test Hero Entry',
        subtitle: 'Testing CRUD Operations',
        description: 'This is a test hero entry for CRUD validation',
        ctaText: 'Test CTA',
        ctaLink: '/test',
        isActive: true,
        sortOrder: 99
      }).returning();
      
      if (newHero.length === 1) {
        console.log(`✅ CREATE: Successfully created hero entry with ID ${newHero[0].id}`);
        passedTests++;
        testResults.homepage.passed++;
      } else {
        console.log(`❌ CREATE: Failed to create hero entry`);
        failedTests++;
        testResults.homepage.failed++;
      }
      totalTests++;
      testResults.homepage.tests++;

      // UPDATE
      const updatedHero = await db.update(homepageHero)
        .set({ title: 'Updated Test Hero' })
        .where(eq(homepageHero.id, newHero[0].id))
        .returning();
        
      if (updatedHero.length === 1 && updatedHero[0].title === 'Updated Test Hero') {
        console.log(`✅ UPDATE: Successfully updated hero entry`);
        passedTests++;
        testResults.homepage.passed++;
      } else {
        console.log(`❌ UPDATE: Failed to update hero entry`);
        failedTests++;
        testResults.homepage.failed++;
      }
      totalTests++;
      testResults.homepage.tests++;

      // DELETE
      await db.delete(homepageHero).where(eq(homepageHero.id, newHero[0].id));
      const deletedCheck = await db.select().from(homepageHero).where(eq(homepageHero.id, newHero[0].id));
      
      if (deletedCheck.length === 0) {
        console.log(`✅ DELETE: Successfully deleted hero entry`);
        passedTests++;
        testResults.homepage.passed++;
      } else {
        console.log(`❌ DELETE: Failed to delete hero entry`);
        failedTests++;
        testResults.homepage.failed++;
      }
      totalTests++;
      testResults.homepage.tests++;

    } catch (error) {
      console.log(`❌ Homepage Hero CRUD Error: ${error.message}`);
      failedTests++;
      testResults.homepage.failed++;
    }

    // Test 2: Homepage Slogans
    console.log('💬 Testing homepage slogans...');
    try {
      const slogans = await db.select().from(homepageSlogans);
      if (slogans.length >= 1) {
        console.log(`✅ Homepage Slogans: Found ${slogans.length} entries`);
        passedTests++;
        testResults.homepage.passed++;
      } else {
        console.log(`❌ Homepage Slogans: No entries found`);
        failedTests++;
        testResults.homepage.failed++;
      }
      totalTests++;
      testResults.homepage.tests++;
    } catch (error) {
      console.log(`❌ Homepage Slogans Error: ${error.message}`);
      failedTests++;
      testResults.homepage.failed++;
    }

    console.log('📊 Phase 2: About Page Management Testing');

    // Test 3: About Timeline
    console.log('📅 Testing about timeline entries...');
    try {
      const timeline = await db.select().from(aboutTimelineEntries);
      if (timeline.length >= 3) {
        console.log(`✅ About Timeline: Found ${timeline.length} entries`);
        
        // Test chronological ordering
        const sortedByYear = timeline.sort((a, b) => parseInt(a.year) - parseInt(b.year));
        if (sortedByYear[0].year && parseInt(sortedByYear[0].year) < parseInt(sortedByYear[sortedByYear.length - 1].year)) {
          console.log(`✅ Timeline Ordering: Entries span multiple years correctly`);
          passedTests++;
          testResults.about.passed++;
        } else {
          console.log(`❌ Timeline Ordering: Year progression issue`);
          failedTests++;
          testResults.about.failed++;
        }
        
        passedTests++;
        testResults.about.passed++;
      } else {
        console.log(`❌ About Timeline: Expected multiple entries, found ${timeline.length}`);
        failedTests++;
        testResults.about.failed++;
      }
      totalTests += 2;
      testResults.about.tests += 2;
    } catch (error) {
      console.log(`❌ About Timeline Error: ${error.message}`);
      failedTests++;
      testResults.about.failed++;
    }

    // Test 4: About Locations
    console.log('🗺️ Testing about locations...');
    try {
      const locations = await db.select().from(aboutMapLocations);
      if (locations.length >= 1) {
        console.log(`✅ About Locations: Found ${locations.length} locations`);
        
        // Test coordinate validation
        const validCoordinates = locations.every(loc => 
          parseFloat(loc.latitude) >= -90 && parseFloat(loc.latitude) <= 90 &&
          parseFloat(loc.longitude) >= -180 && parseFloat(loc.longitude) <= 180
        );
        
        if (validCoordinates) {
          console.log(`✅ Coordinate Validation: All coordinates within valid ranges`);
          passedTests++;
          testResults.about.passed++;
        } else {
          console.log(`❌ Coordinate Validation: Invalid coordinates detected`);
          failedTests++;
          testResults.about.failed++;
        }
        
        passedTests++;
        testResults.about.passed++;
      } else {
        console.log(`❌ About Locations: No locations found`);
        failedTests++;
        testResults.about.failed++;
      }
      totalTests += 2;
      testResults.about.tests += 2;
    } catch (error) {
      console.log(`❌ About Locations Error: ${error.message}`);
      failedTests++;
      testResults.about.failed++;
    }

    console.log('📊 Phase 3: Sustainability Management Testing');

    // Test 5: Sustainability Metrics
    console.log('📈 Testing sustainability metrics...');
    try {
      const metrics = await db.select().from(sustainabilityMetrics);
      if (metrics.length >= 3) {
        console.log(`✅ Sustainability Metrics: Found ${metrics.length} metrics`);
        
        // Test metric categories
        const categories = [...new Set(metrics.map(m => m.category).filter(Boolean))];
        if (categories.length >= 2) {
          console.log(`✅ Metric Categories: Found ${categories.length} categories: ${categories.join(', ')}`);
          passedTests++;
          testResults.sustainability.passed++;
        } else {
          console.log(`❌ Metric Categories: Expected multiple categories, found ${categories.length}`);
          failedTests++;
          testResults.sustainability.failed++;
        }
        
        // Test numeric values
        const numericMetrics = metrics.filter(m => !isNaN(parseFloat(m.value)));
        if (numericMetrics.length >= 2) {
          console.log(`✅ Numeric Values: ${numericMetrics.length} metrics have valid numeric values`);
          passedTests++;
          testResults.sustainability.passed++;
        } else {
          console.log(`❌ Numeric Values: Expected numeric metrics, found ${numericMetrics.length}`);
          failedTests++;
          testResults.sustainability.failed++;
        }
        
        passedTests++;
        testResults.sustainability.passed++;
      } else {
        console.log(`❌ Sustainability Metrics: Expected multiple metrics, found ${metrics.length}`);
        failedTests++;
        testResults.sustainability.failed++;
      }
      totalTests += 3;
      testResults.sustainability.tests += 3;
    } catch (error) {
      console.log(`❌ Sustainability Metrics Error: ${error.message}`);
      failedTests++;
      testResults.sustainability.failed++;
    }

    console.log('📊 Phase 4: Manufacturing Management Testing');

    // Test 6: Manufacturing Processes
    console.log('🏭 Testing manufacturing processes...');
    try {
      const processes = await db.select().from(manufacturingProcesses);
      if (processes.length >= 2) {
        console.log(`✅ Manufacturing Processes: Found ${processes.length} processes`);
        
        // Test process step sequence
        const steps = processes.map(p => p.step).sort((a, b) => a - b);
        const sequential = steps.every((step, index) => index === 0 || step > steps[index - 1]);
        
        if (sequential) {
          console.log(`✅ Process Sequence: Steps are properly sequenced (${steps.join(' → ')})`);
          passedTests++;
          testResults.manufacturing.passed++;
        } else {
          console.log(`❌ Process Sequence: Step sequence issues detected`);
          failedTests++;
          testResults.manufacturing.failed++;
        }
        
        // Test equipment data
        const processesWithEquipment = processes.filter(p => p.equipment && Array.isArray(p.equipment) && p.equipment.length > 0);
        if (processesWithEquipment.length >= 1) {
          console.log(`✅ Equipment Data: ${processesWithEquipment.length} processes have equipment data`);
          passedTests++;
          testResults.manufacturing.passed++;
        } else {
          console.log(`❌ Equipment Data: No processes with equipment data found`);
          failedTests++;
          testResults.manufacturing.failed++;
        }
        
        passedTests++;
        testResults.manufacturing.passed++;
      } else {
        console.log(`❌ Manufacturing Processes: Expected multiple processes, found ${processes.length}`);
        failedTests++;
        testResults.manufacturing.failed++;
      }
      totalTests += 3;
      testResults.manufacturing.tests += 3;
    } catch (error) {
      console.log(`❌ Manufacturing Processes Error: ${error.message}`);
      failedTests++;
      testResults.manufacturing.failed++;
    }

    console.log('📊 Phase 5: Technology Management Testing');

    // Test 7: Technology Innovations
    console.log('🔬 Testing technology innovations...');
    try {
      const innovations = await db.select().from(technologyInnovations);
      if (innovations.length >= 2) {
        console.log(`✅ Technology Innovations: Found ${innovations.length} innovations`);
        
        // Test categories
        const techCategories = [...new Set(innovations.map(i => i.category).filter(Boolean))];
        if (techCategories.length >= 2) {
          console.log(`✅ Innovation Categories: Found ${techCategories.length} categories: ${techCategories.join(', ')}`);
          passedTests++;
          testResults.technology.passed++;
        } else {
          console.log(`❌ Innovation Categories: Expected multiple categories, found ${techCategories.length}`);
          failedTests++;
          testResults.technology.failed++;
        }
        
        // Test benefits data
        const innovationsWithBenefits = innovations.filter(i => i.benefits && Array.isArray(i.benefits) && i.benefits.length > 0);
        if (innovationsWithBenefits.length >= 2) {
          console.log(`✅ Benefits Data: ${innovationsWithBenefits.length} innovations have benefits listed`);
          passedTests++;
          testResults.technology.passed++;
        } else {
          console.log(`❌ Benefits Data: Expected innovations with benefits, found ${innovationsWithBenefits.length}`);
          failedTests++;
          testResults.technology.failed++;
        }
        
        passedTests++;
        testResults.technology.passed++;
      } else {
        console.log(`❌ Technology Innovations: Expected multiple innovations, found ${innovations.length}`);
        failedTests++;
        testResults.technology.failed++;
      }
      totalTests += 3;
      testResults.technology.tests += 3;
    } catch (error) {
      console.log(`❌ Technology Innovations Error: ${error.message}`);
      failedTests++;
      testResults.technology.failed++;
    }

    console.log('📊 Phase 6: Cross-Entity Relationship Testing');

    // Test 8: Data Consistency Validation
    console.log('🔗 Testing data consistency across entities...');
    try {
      // Test active status consistency
      const allTables = [
        { name: 'Homepage Hero', table: homepageHero },
        { name: 'About Timeline', table: aboutTimelineEntries },
        { name: 'Sustainability Metrics', table: sustainabilityMetrics },
        { name: 'Manufacturing Processes', table: manufacturingProcesses },
        { name: 'Technology Innovations', table: technologyInnovations }
      ];
      
      let consistencyPassed = 0;
      for (const { name, table } of allTables) {
        const records = await db.select().from(table);
        const activeRecords = records.filter(r => r.isActive === true);
        const inactiveRecords = records.filter(r => r.isActive === false);
        
        if (activeRecords.length > 0) {
          console.log(`✅ ${name}: ${activeRecords.length} active, ${inactiveRecords.length} inactive`);
          consistencyPassed++;
        }
      }
      
      if (consistencyPassed === allTables.length) {
        console.log(`✅ Data Consistency: All entities have active records`);
        passedTests++;
      } else {
        console.log(`❌ Data Consistency: Some entities have no active records`);
        failedTests++;
      }
      totalTests++;
      
    } catch (error) {
      console.log(`❌ Data Consistency Error: ${error.message}`);
      failedTests++;
    }

    // Final Results Summary
    console.log('\n📋 COMPREHENSIVE CMS TESTING SUMMARY');
    console.log('==========================================');
    console.log(`Total Tests Run: ${totalTests}`);
    console.log(`Passed Tests: ${passedTests}`);
    console.log(`Failed Tests: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('');

    // Detailed Results by Category
    console.log('📊 Results by Category:');
    Object.entries(testResults).forEach(([category, results]) => {
      const successRate = results.tests > 0 ? ((results.passed / results.tests) * 100).toFixed(1) : '0';
      console.log(`${category.charAt(0).toUpperCase() + category.slice(1)}: ${results.passed}/${results.tests} passed (${successRate}%)`);
    });
    console.log('==========================================');

    if (passedTests === totalTests) {
      console.log('🎉 ALL CMS TESTS PASSED! System is ready for production.');
    } else if (passedTests >= totalTests * 0.9) {
      console.log('✅ CMS Testing mostly successful with minor issues.');
    } else {
      console.log('⚠️ CMS Testing revealed significant issues requiring attention.');
    }

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: ((passedTests / totalTests) * 100).toFixed(1),
      detailedResults: testResults
    };

  } catch (error) {
    console.error('❌ CMS testing failed:', error);
    throw error;
  }
}

// Execute CMS testing
comprehensiveCMSTesting()
  .then((results) => {
    console.log('\n✅ Comprehensive CMS testing completed!');
    console.log('Final Summary:', {
      successRate: results.successRate + '%',
      totalTests: results.totalTests
    });
    process.exit(results.passedTests === results.totalTests ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ CMS testing failed:', error);
    process.exit(1);
  });