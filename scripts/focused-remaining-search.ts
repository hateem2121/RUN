// Focused search for remaining admin content
import { storage } from '../server/storage.js';

const db = (storage as any).db;

async function findRemainingContent() {
  console.log('🔍 FOCUSED SEARCH FOR REMAINING CONTENT');
  console.log('=' .repeat(60));

  const allContent = [];

  // Focus on content types likely to have data based on the website structure
  const priorityContentTypes = [
    'aboutUs', 'companyHistory', 'teamMembers', 'leadership',
    'manufacturingProcess', 'qualityStandards', 'equipmentInfo',
    'customerTestimonials', 'caseStudies', 'newsArticles', 'blogPosts',
    'innovations', 'researchDevelopment', 'awards', 'achievements',
    'contactInfo', 'locations', 'services', 'capabilities',
    'faq', 'downloads', 'resources', 'socialMedia'
  ];

  for (const contentType of priorityContentTypes) {
    console.log(`\n📂 ${contentType.toUpperCase()}:`);
    let count = 0;
    
    for (let i = 1; i <= 15; i++) {
      try {
        const result = await db.get(`${contentType}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          count++;
          allContent.push({type: contentType, item});
          
          console.log(`   ${count}. ${item.title || item.name || item.heading || 'Untitled'}`);
          if (item.description) console.log(`      📝 ${item.description.substring(0, 60)}...`);
          if (item.content) console.log(`      📄 ${item.content.substring(0, 60)}...`);
          if (item.position || item.role) console.log(`      👤 ${item.position || item.role}`);
          if (item.date) console.log(`      📅 ${new Date(item.date).toLocaleDateString()}`);
          if (item.category) console.log(`      🏷️ ${item.category}`);
          console.log('');
        }
      } catch (e) {}
    }
    
    if (count > 0) {
      console.log(`   ✅ Found ${count} items`);
    }
  }

  // Search for any other content patterns
  console.log(`\n🔍 PATTERN SEARCH:`);
  const patterns = ['company', 'team', 'news', 'blog', 'case', 'story', 'award', 'innovation', 'research'];
  
  for (const pattern of patterns) {
    let patternCount = 0;
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${pattern}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          patternCount++;
          allContent.push({type: pattern, item});
          console.log(`📄 ${pattern}: ${item.title || item.name || 'Untitled'}`);
        }
      } catch (e) {}
    }
    if (patternCount > 0) console.log(`   ✅ ${pattern}: ${patternCount} items`);
  }

  console.log(`\n📊 TOTAL ADDITIONAL CONTENT: ${allContent.length} items`);
  return allContent;
}

findRemainingContent().catch(console.error);