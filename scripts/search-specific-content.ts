// @ts-nocheck
// Search for specific content types the user mentioned
import { storage } from '../server/storage.js';

const db = (storage as any).db;

async function searchSpecificContent() {
  console.log('🎯 SEARCHING FOR SPECIFIC CONTENT SECTIONS');
  console.log('=' .repeat(60));

  const foundContent = {
    about: [],
    manufacturing: [],
    contact: [],
    sustainability: []
  };

  // About/Company Pages
  console.log('\n🏢 ABOUT/COMPANY CONTENT:');
  console.log('-'.repeat(40));
  
  const aboutKeywords = [
    'about', 'aboutUs', 'company', 'companyInfo', 'companyProfile', 
    'ourStory', 'history', 'mission', 'vision', 'values', 
    'team', 'leadership', 'founders', 'management'
  ];
  
  for (const keyword of aboutKeywords) {
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${keyword}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          foundContent.about.push(item);
          console.log(`   📄 ${keyword}: ${item.title || item.name || item.heading || 'Untitled'}`);
          if (item.content) console.log(`      📝 ${item.content.substring(0, 80)}...`);
          if (item.description) console.log(`      📝 ${item.description.substring(0, 80)}...`);
          console.log('');
        }
      } catch (e) {}
    }
    
    // Also check batch data
    try {
      const batchResult = await db.get(keyword);
      if (batchResult?.ok && batchResult?.value) {
        const batch = JSON.parse(batchResult.value);
        if (Array.isArray(batch)) {
          foundContent.about.push(...batch);
          console.log(`   📦 ${keyword} BATCH: ${batch.length} items`);
        }
      }
    } catch (e) {}
  }

  // Manufacturing Content
  console.log('\n🏭 MANUFACTURING CONTENT:');
  console.log('-'.repeat(40));
  
  const manufacturingKeywords = [
    'manufacturing', 'manufacturingProcess', 'production', 'facility', 
    'equipment', 'capabilities', 'processes', 'factory', 'operations',
    'qualityControl', 'qualityAssurance', 'testing', 'standards'
  ];
  
  for (const keyword of manufacturingKeywords) {
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${keyword}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          foundContent.manufacturing.push(item);
          console.log(`   🏭 ${keyword}: ${item.title || item.name || item.heading || 'Untitled'}`);
          if (item.content) console.log(`      📝 ${item.content.substring(0, 80)}...`);
          if (item.description) console.log(`      📝 ${item.description.substring(0, 80)}...`);
          console.log('');
        }
      } catch (e) {}
    }
  }

  // Contact Information
  console.log('\n📞 CONTACT INFORMATION:');
  console.log('-'.repeat(40));
  
  const contactKeywords = [
    'contact', 'contactInfo', 'contactUs', 'locations', 'offices', 
    'address', 'phone', 'email', 'sales', 'support', 'inquiry'
  ];
  
  for (const keyword of contactKeywords) {
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${keyword}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          foundContent.contact.push(item);
          console.log(`   📞 ${keyword}: ${item.title || item.name || item.heading || 'Untitled'}`);
          if (item.address) console.log(`      📍 ${item.address}`);
          if (item.phone) console.log(`      📞 ${item.phone}`);
          if (item.email) console.log(`      📧 ${item.email}`);
          if (item.content) console.log(`      📝 ${item.content.substring(0, 80)}...`);
          console.log('');
        }
      } catch (e) {}
    }
  }

  // Sustainability Content (we already found some, but let's search more)
  console.log('\n🌱 SUSTAINABILITY CONTENT:');
  console.log('-'.repeat(40));
  
  const sustainabilityKeywords = [
    'sustainability', 'sustainabilityPage', 'environmental', 'eco', 
    'green', 'climate', 'carbon', 'renewable', 'recycling', 'organic',
    'sustainabilityInitiatives', 'environmentalPolicy', 'greenPractices'
  ];
  
  for (const keyword of sustainabilityKeywords) {
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${keyword}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          foundContent.sustainability.push(item);
          console.log(`   🌱 ${keyword}: ${item.title || item.name || item.heading || 'Untitled'}`);
          if (item.content) console.log(`      📝 ${item.content.substring(0, 80)}...`);
          if (item.description) console.log(`      📝 ${item.description.substring(0, 80)}...`);
          if (item.category) console.log(`      🏷️ ${item.category}`);
          console.log('');
        }
      } catch (e) {}
    }
  }

  // Summary
  console.log('\n📊 SPECIFIC CONTENT SUMMARY:');
  console.log('=' .repeat(40));
  console.log(`🏢 About/Company: ${foundContent.about.length} items`);
  console.log(`🏭 Manufacturing: ${foundContent.manufacturing.length} items`);
  console.log(`📞 Contact: ${foundContent.contact.length} items`);
  console.log(`🌱 Sustainability: ${foundContent.sustainability.length} items`);
  
  const total = foundContent.about.length + foundContent.manufacturing.length + 
                foundContent.contact.length + foundContent.sustainability.length;
  console.log(`🎯 Total Specific Content: ${total} items`);

  return foundContent;
}

searchSpecificContent().catch(console.error);