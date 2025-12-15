#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Admin Pages Validation Script for RUN APPAREL (PVT) LTD
 * Tests that admin interface components work with actual database schema
 * Identifies schema mismatches between frontend and backend
 */

import { db } from '../server/db.js';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';

console.log('🔍 Starting admin pages validation...');

async function validateAdminPages() {
  try {
    let totalChecks = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    const issues: string[] = [];

    console.log('📊 Phase 1: Database Schema Validation');
    
    // Test 1: Verify all seeded CMS entities exist
    console.log('🗃️ Checking database entities...');
    
    const dbChecks = [
      { name: 'Homepage Hero', query: () => db.query.homepageHero.findMany() },
      { name: 'Homepage Slogans', query: () => db.query.homepageSlogans.findMany() },
      { name: 'Homepage Process Cards', query: () => db.query.homepageProcessCards.findMany() },
      { name: 'Homepage Sections', query: () => db.query.homepageSections.findMany() },
      { name: 'Homepage Sustainability', query: () => db.query.homepageSustainability.findMany() },
      { name: 'Homepage Featured Products Settings', query: () => db.query.homepageFeaturedProductsSettings.findMany() },
      { name: 'About Hero', query: () => db.query.aboutHero.findMany() },
      { name: 'About Timeline', query: () => db.query.aboutTimelineEntries.findMany() },
      { name: 'About Locations', query: () => db.query.aboutMapLocations.findMany() },
      { name: 'About Statistics', query: () => db.query.aboutStatistics.findMany() },
      { name: 'Sustainability Hero', query: () => db.query.sustainabilityHero.findMany() },
      { name: 'Sustainability Metrics', query: () => db.query.sustainabilityMetrics.findMany() },
      { name: 'Manufacturing Processes', query: () => db.query.manufacturingProcesses.findMany() },
      { name: 'Technology Innovations', query: () => db.query.technologyInnovations.findMany() },
    ];

    for (const check of dbChecks) {
      try {
        const data = await check.query();
        if (data && data.length > 0) {
          console.log(`✅ ${check.name}: Found ${data.length} records`);
          passedChecks++;
        } else {
          console.log(`⚠️ ${check.name}: No records found`);
          issues.push(`${check.name}: No seeded data found`);
          failedChecks++;
        }
        totalChecks++;
      } catch (error) {
        console.log(`❌ ${check.name}: Database error - ${error.message}`);
        issues.push(`${check.name}: Database query failed`);
        failedChecks++;
        totalChecks++;
      }
    }

    console.log('📊 Phase 2: API Endpoints Validation');
    
    // Test 2: Verify API endpoints respond correctly
    console.log('🔗 Testing API endpoints...');
    
    const apiEndpoints = [
      '/api/homepage-hero',
      '/api/homepage-slogans', 
      '/api/homepage-process-cards',
      '/api/homepage-sections',
      '/api/homepage-sustainability',
      '/api/about-hero',
      '/api/about-timeline',
      '/api/about-locations',
      '/api/about-statistics',
      '/api/sustainability-hero',
      '/api/sustainability-metrics',
      '/api/manufacturing-processes',
      '/api/technology-innovations'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: API responds (${Array.isArray(data) ? data.length : 1} items)`);
          passedChecks++;
        } else {
          console.log(`❌ ${endpoint}: API error ${response.status}`);
          issues.push(`${endpoint}: API endpoint failed (${response.status})`);
          failedChecks++;
        }
        totalChecks++;
      } catch (error) {
        console.log(`❌ ${endpoint}: Network error - ${error.message}`);
        issues.push(`${endpoint}: Network/connection error`);
        failedChecks++;
        totalChecks++;
      }
    }

    console.log('📊 Phase 3: Schema Structure Validation');
    
    // Test 3: Validate actual data structure matches expected formats
    console.log('🔍 Checking data structure compatibility...');
    
    try {
      // Check Homepage Sustainability structure
      const sustainabilityData = await db.query.homepageSustainability.findFirst();
      if (sustainabilityData) {
        console.log(`✅ Homepage Sustainability: Found structure with ${Object.keys(sustainabilityData).length} fields`);
        console.log(`   Fields: ${Object.keys(sustainabilityData).join(', ')}`);
        
        // Check if metrics field is properly formatted
        if (sustainabilityData.metrics && typeof sustainabilityData.metrics === 'object') {
          console.log(`✅ Metrics field: Contains ${Object.keys(sustainabilityData.metrics).length} metrics`);
          passedChecks++;
        } else {
          console.log(`⚠️ Metrics field: Missing or not properly structured`);
          issues.push(`Homepage Sustainability: Metrics field structure issue`);
          failedChecks++;
        }
        totalChecks++;
      }

      // Check Featured Products Settings structure  
      const featuredProductsData = await db.query.homepageFeaturedProductsSettings.findFirst();
      if (featuredProductsData) {
        console.log(`✅ Featured Products: Found structure with ${Object.keys(featuredProductsData).length} fields`);
        console.log(`   Fields: ${Object.keys(featuredProductsData).join(', ')}`);
        passedChecks++;
      } else {
        console.log(`⚠️ Featured Products: No settings found - may need seeding`);
        issues.push(`Homepage Featured Products: No settings record found`);
        failedChecks++;
      }
      totalChecks++;

    } catch (error) {
      console.log(`❌ Schema Structure Validation Error: ${error.message}`);
      issues.push(`Schema validation failed: ${error.message}`);
      failedChecks++;
      totalChecks++;
    }

    console.log('📊 Phase 4: Admin Route Accessibility Test');
    
    // Test 4: Check if admin routes are accessible
    console.log('🌐 Testing admin route accessibility...');
    
    const adminRoutes = [
      '/admin',
      '/admin/homepage',
      '/admin/about',
      '/admin/sustainability', 
      '/admin/manufacturing',
      '/admin/technology'
    ];

    for (const route of adminRoutes) {
      try {
        const response = await fetch(`http://localhost:5000${route}`);
        if (response.ok) {
          const html = await response.text();
          if (html.includes('<!DOCTYPE html') && html.includes('<script')) {
            console.log(`✅ ${route}: Route accessible and serves React app`);
            passedChecks++;
          } else {
            console.log(`⚠️ ${route}: Route accessible but may have loading issues`);
            issues.push(`${route}: Route serves content but may not be fully functional`);
            failedChecks++;
          }
        } else {
          console.log(`❌ ${route}: Route not accessible (${response.status})`);
          issues.push(`${route}: Admin route not accessible`);
          failedChecks++;
        }
        totalChecks++;
      } catch (error) {
        console.log(`❌ ${route}: Connection error - ${error.message}`);
        issues.push(`${route}: Admin route connection failed`);
        failedChecks++;
        totalChecks++;
      }
    }

    // Final Summary
    console.log('\n📋 ADMIN PAGES VALIDATION SUMMARY');
    console.log('==========================================');
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Passed: ${passedChecks}`);
    console.log(`Failed: ${failedChecks}`);
    console.log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);
    console.log('');

    // Issues Report
    if (issues.length > 0) {
      console.log('🚨 Issues Found:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
      console.log('');
    }

    // Recommendations
    console.log('💡 Recommendations:');
    if (failedChecks === 0) {
      console.log('🎉 All admin pages and systems are working correctly!');
    } else if (failedChecks <= totalChecks * 0.2) {
      console.log('✅ System mostly functional with minor issues that can be addressed.');
      console.log('📝 Focus on resolving API endpoint issues and missing data.');
    } else {
      console.log('⚠️ System has significant issues requiring attention.');
      console.log('🔧 Schema mismatches and missing admin components need to be resolved.');
      console.log('📋 Consider updating admin components to match current database schema.');
    }
    console.log('==========================================');

    return {
      totalChecks,
      passedChecks,
      failedChecks,
      successRate: ((passedChecks / totalChecks) * 100).toFixed(1),
      issues
    };

  } catch (error) {
    console.error('❌ Admin pages validation failed:', error);
    throw error;
  }
}

// Execute validation
validateAdminPages()
  .then((results) => {
    console.log('\n✅ Admin pages validation completed!');
    console.log(`Final Success Rate: ${results.successRate}%`);
    if (results.issues.length > 0) {
      console.log(`Issues to address: ${results.issues.length}`);
    }
    process.exit(results.failedChecks > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });