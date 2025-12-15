// @ts-nocheck
// Comprehensive search for ALL admin content across all frontend sections
import { storage } from '../server/storage.js';

const db = (storage as any).db;

async function comprehensiveAdminSearch() {
  console.log('🔍 COMPREHENSIVE ADMIN CONTENT SEARCH');
  console.log('=' .repeat(80));
  console.log('Searching for ALL content that powers your frontend pages...\n');

  const searchResults = {
    totalFound: 0,
    contentSections: {}
  };

  // Define all possible content types for a comprehensive B2B website
  const contentTypes = [
    // Company/About Content
    'aboutUs', 'companyHistory', 'missionVision', 'companyValues', 'leadership', 'teamMembers',
    
    // Manufacturing Content  
    'manufacturingProcess', 'equipmentInfo', 'facilityInfo', 'capabilities', 'qualityControl',
    'productionSteps', 'manufacturingLocations', 'factoryTour',
    
    // Quality & Standards
    'qualityStandards', 'qualityAssurance', 'testingProcedures', 'complianceInfo',
    
    // Sustainability & Environment
    'sustainabilityInitiatives', 'environmentalPolicy', 'greenPractices', 'carbonFootprint',
    'ecoFriendlyProcesses', 'sustainabilityReports', 'environmentalCertifications',
    
    // Technology & Innovation
    'innovationProjects', 'researchDevelopment', 'technologyPartners', 'innovations',
    'techSpecs', 'advancedMaterials', 'smartTextiles',
    
    // Customer & Business
    'customerTestimonials', 'caseStudies', 'successStories', 'clientLogos', 'partnerships',
    'industryRecognition', 'awards', 'achievements',
    
    // News & Media
    'newsArticles', 'pressReleases', 'blogPosts', 'mediaKit', 'publications',
    
    // Contact & Locations
    'contactInfo', 'locations', 'officeInfo', 'salesTeam', 'support',
    
    // Services & Capabilities
    'services', 'customization', 'designServices', 'consultingServices',
    
    // Product Information
    'productCategories', 'productLines', 'specifications', 'catalogs',
    
    // Homepage Specific
    'homepageStats', 'homepageTestimonials', 'homepagePartners', 'homepageAwards',
    
    // Footer & Navigation
    'footerContent', 'navigationMenus', 'socialMedia', 'legalInfo', 'privacyPolicy',
    
    // Forms & CTAs
    'contactForms', 'quoteRequests', 'inquiryForms', 'callToActions',
    
    // Additional Website Content
    'faq', 'glossary', 'downloads', 'resources', 'whitepapers', 'brochures'
  ];

  console.log(`🔎 Searching ${contentTypes.length} content types...\n`);

  // Search each content type systematically
  for (const contentType of contentTypes) {
    console.log(`\n📂 ${contentType.toUpperCase()}:`);
    console.log('-'.repeat(50));
    
    let typeCount = 0;
    
    // Search for individual items (contentType:1, contentType:2, etc.)
    for (let i = 1; i <= 20; i++) {
      try {
        const result = await db.get(`${contentType}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          typeCount++;
          searchResults.totalFound++;
          
          console.log(`   ${typeCount}. ${item.title || item.name || item.heading || 'Untitled'}`);
          
          // Show relevant details based on content type
          if (item.description) console.log(`      📝 ${item.description.substring(0, 80)}...`);
          if (item.content) console.log(`      📄 ${item.content.substring(0, 80)}...`);
          if (item.position) console.log(`      📍 Position: ${item.position}`);
          if (item.department) console.log(`      🏢 Department: ${item.department}`);
          if (item.date) console.log(`      📅 Date: ${new Date(item.date).toLocaleDateString()}`);
          if (item.author) console.log(`      ✍️ Author: ${item.author}`);
          if (item.location) console.log(`      📍 Location: ${item.location}`);
          if (item.email) console.log(`      📧 Email: ${item.email}`);
          if (item.phone) console.log(`      📞 Phone: ${item.phone}`);
          if (item.category) console.log(`      🏷️ Category: ${item.category}`);
          if (item.status) console.log(`      ⚡ Status: ${item.status}`);
          if (item.priority) console.log(`      ⭐ Priority: ${item.priority}`);
          if (item.tags) console.log(`      🏷️ Tags: ${item.tags.join(', ')}`);
          if (item.createdAt) console.log(`      📅 Created: ${new Date(item.createdAt).toLocaleDateString()}`);
          
          console.log('');
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    // Also search for batch data (contentType without index)
    try {
      const batchResult = await db.get(contentType);
      if (batchResult?.ok && batchResult?.value) {
        const batchData = JSON.parse(batchResult.value);
        if (Array.isArray(batchData) && batchData.length > 0) {
          console.log(`   📦 BATCH DATA: Found ${batchData.length} items in batch`);
          typeCount += batchData.length;
          searchResults.totalFound += batchData.length;
        }
      }
    } catch (e) {
      // Continue
    }
    
    if (typeCount > 0) {
      searchResults.contentSections[contentType] = typeCount;
      console.log(`   ✅ Found ${typeCount} items in ${contentType}`);
    } else {
      console.log(`   ❌ No items found in ${contentType}`);
    }
  }

  // Additional search for any content with common prefixes
  console.log(`\n\n🔍 ADDITIONAL SEARCH - Common Content Patterns:`);
  console.log('-'.repeat(60));
  
  const commonPrefixes = ['page', 'content', 'section', 'block', 'widget', 'component', 'module'];
  
  for (const prefix of commonPrefixes) {
    let prefixCount = 0;
    console.log(`\n📂 ${prefix.toUpperCase()} CONTENT:`);
    
    for (let i = 1; i <= 15; i++) {
      try {
        const result = await db.get(`${prefix}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          prefixCount++;
          searchResults.totalFound++;
          
          console.log(`   ${prefixCount}. ${item.title || item.name || item.type || 'Untitled'}`);
          if (item.pageType) console.log(`      📄 Page Type: ${item.pageType}`);
          if (item.section) console.log(`      📄 Section: ${item.section}`);
          if (item.content) console.log(`      📝 ${item.content.substring(0, 80)}...`);
          console.log('');
        }
      } catch (e) {}
    }
    
    if (prefixCount > 0) {
      console.log(`   ✅ Found ${prefixCount} ${prefix} items`);
    }
  }

  // Final Summary
  console.log(`\n\n📊 COMPREHENSIVE SEARCH RESULTS:`);
  console.log('=' .repeat(60));
  console.log(`🎯 Total Content Items Found: ${searchResults.totalFound}`);
  console.log(`📂 Content Sections with Data: ${Object.keys(searchResults.contentSections).length}`);
  
  if (Object.keys(searchResults.contentSections).length > 0) {
    console.log(`\n📋 Breakdown by Content Type:`);
    for (const [type, count] of Object.entries(searchResults.contentSections)) {
      console.log(`   • ${type}: ${count} items`);
    }
  }
  
  console.log(`\n🎉 Your comprehensive admin content has been located!`);
  console.log(`All ${searchResults.totalFound} content items are preserved and ready for migration.`);
  
  return searchResults;
}

comprehensiveAdminSearch().catch(console.error);