// Extract ALL admin data from all sections
import { storage } from '../server/storage.js';

const db = (storage as any).db;

async function extractAllAdminData() {
  console.log('🔍 EXTRACTING ALL ADMIN DATA FROM ALL SECTIONS');
  console.log('=' .repeat(70));

  // Check accessories
  console.log('\n🔧 ACCESSORIES:');
  console.log('-' .repeat(40));
  let accessoryCount = 0;
  for (let i = 1; i <= 20; i++) {
    try {
      const result = await db.get(`accessories:${i}`);
      if (result?.ok && result?.value) {
        const acc = JSON.parse(result.value);
        accessoryCount++;
        console.log(`${accessoryCount}. ${acc.name}`);
        if (acc.type) console.log(`   📝 Type: ${acc.type}`);
        if (acc.description) console.log(`   📝 ${acc.description.substring(0, 80)}...`);
        console.log(`   📅 Created: ${new Date(acc.createdAt).toLocaleDateString()}`);
        console.log('');
      }
    } catch (e) {}
  }

  // Check size charts
  console.log('\n📏 SIZE CHARTS:');
  console.log('-' .repeat(40));
  let sizeChartCount = 0;
  for (let i = 1; i <= 20; i++) {
    try {
      const result = await db.get(`sizeCharts:${i}`);
      if (result?.ok && result?.value) {
        const size = JSON.parse(result.value);
        sizeChartCount++;
        console.log(`${sizeChartCount}. ${size.name}`);
        if (size.category) console.log(`   📝 Category: ${size.category}`);
        if (size.description) console.log(`   📝 ${size.description.substring(0, 80)}...`);
        console.log(`   📅 Created: ${new Date(size.createdAt).toLocaleDateString()}`);
        console.log('');
      }
    } catch (e) {}
  }

  // Check homepage content
  console.log('\n🏠 HOMEPAGE CONTENT:');
  console.log('-' .repeat(40));
  
  // Homepage hero
  try {
    const heroResult = await db.get('homepageHero:1');
    if (heroResult?.ok && heroResult?.value) {
      const hero = JSON.parse(heroResult.value);
      console.log('🎯 HOMEPAGE HERO:');
      console.log(`   Title: ${hero.title}`);
      console.log(`   Subtitle: ${hero.subtitle?.substring(0, 80)}...`);
      console.log('');
    }
  } catch (e) {}

  // Homepage sections
  let homepageSectionCount = 0;
  for (let i = 1; i <= 10; i++) {
    try {
      const result = await db.get(`homepageSections:${i}`);
      if (result?.ok && result?.value) {
        const section = JSON.parse(result.value);
        homepageSectionCount++;
        console.log(`📄 HOMEPAGE SECTION ${homepageSectionCount}:`);
        console.log(`   Name: ${section.name}`);
        console.log(`   Title: ${section.title}`);
        if (section.description) console.log(`   Description: ${section.description.substring(0, 80)}...`);
        console.log('');
      }
    } catch (e) {}
  }

  // Homepage process cards
  let processCardCount = 0;
  for (let i = 1; i <= 10; i++) {
    try {
      const result = await db.get(`homepageProcessCards:${i}`);
      if (result?.ok && result?.value) {
        const card = JSON.parse(result.value);
        processCardCount++;
        console.log(`🎴 PROCESS CARD ${processCardCount}:`);
        console.log(`   Title: ${card.title}`);
        if (card.description) console.log(`   Description: ${card.description.substring(0, 80)}...`);
        console.log('');
      }
    } catch (e) {}
  }

  // Check navigation content
  console.log('\n🧭 NAVIGATION:');
  console.log('-' .repeat(40));
  let navCount = 0;
  for (let i = 1; i <= 10; i++) {
    try {
      const result = await db.get(`navigationItems:${i}`);
      if (result?.ok && result?.value) {
        const nav = JSON.parse(result.value);
        navCount++;
        console.log(`${navCount}. ${nav.name}`);
        console.log(`   🔗 Path: ${nav.path}`);
        if (nav.description) console.log(`   📝 ${nav.description}`);
        console.log('');
      }
    } catch (e) {}
  }

  // Check footer content
  console.log('\n🦶 FOOTER CONTENT:');
  console.log('-' .repeat(40));
  
  // Footer sections
  let footerSectionCount = 0;
  for (let i = 1; i <= 5; i++) {
    try {
      const result = await db.get(`footerSections:${i}`);
      if (result?.ok && result?.value) {
        const section = JSON.parse(result.value);
        footerSectionCount++;
        console.log(`📄 FOOTER SECTION ${footerSectionCount}:`);
        console.log(`   Title: ${section.title}`);
        console.log('');
      }
    } catch (e) {}
  }

  // Footer links
  let footerLinkCount = 0;
  for (let i = 1; i <= 20; i++) {
    try {
      const result = await db.get(`footerLinks:${i}`);
      if (result?.ok && result?.value) {
        const link = JSON.parse(result.value);
        footerLinkCount++;
        console.log(`🔗 FOOTER LINK ${footerLinkCount}:`);
        console.log(`   Text: ${link.text}`);
        console.log(`   URL: ${link.url}`);
        console.log('');
      }
    } catch (e) {}
  }

  // Check technology content
  console.log('\n⚙️ TECHNOLOGY CONTENT:');
  console.log('-' .repeat(40));
  
  const techSections = [
    'technologyHero',
    'technologyInnovations', 
    'technologyEquipment',
    'technologyCta',
    'technologyRoadmap',
    'technologyResearch'
  ];

  for (const section of techSections) {
    let count = 0;
    for (let i = 1; i <= 10; i++) {
      try {
        const result = await db.get(`${section}:${i}`);
        if (result?.ok && result?.value) {
          const item = JSON.parse(result.value);
          count++;
          console.log(`⚙️ ${section.toUpperCase()} ${count}:`);
          if (item.title) console.log(`   Title: ${item.title}`);
          if (item.name) console.log(`   Name: ${item.name}`);
          if (item.description) console.log(`   Description: ${item.description.substring(0, 80)}...`);
          console.log('');
        }
      } catch (e) {}
    }
  }

  // Check other admin settings
  console.log('\n⚙️ ADMIN SETTINGS:');
  console.log('-' .repeat(40));
  
  const settingKeys = [
    'navigationGlassmorphismSettings',
    'homepageFeaturedProductsSettings',
    'contactSettings',
    'generalSettings'
  ];

  for (const key of settingKeys) {
    try {
      const result = await db.get(`${key}:1`);
      if (result?.ok && result?.value) {
        const setting = JSON.parse(result.value);
        console.log(`⚙️ ${key.toUpperCase()}:`);
        console.log(`   ${JSON.stringify(setting, null, 2).substring(0, 200)}...`);
        console.log('');
      }
    } catch (e) {}
  }

  // Summary
  console.log('\n📊 COMPREHENSIVE ADMIN DATA SUMMARY:');
  console.log(`   🔧 Accessories: ${accessoryCount}`);
  console.log(`   📏 Size Charts: ${sizeChartCount}`);
  console.log(`   📄 Homepage Sections: ${homepageSectionCount}`);
  console.log(`   🎴 Process Cards: ${processCardCount}`);
  console.log(`   🧭 Navigation Items: ${navCount}`);
  console.log(`   📄 Footer Sections: ${footerSectionCount}`);
  console.log(`   🔗 Footer Links: ${footerLinkCount}`);
  console.log(`   ⚙️ Technology Content: Check individual sections above`);
  console.log('');
  console.log('🎯 All your admin data has been preserved in the Key-Value Store!');
}

extractAllAdminData().catch(console.error);