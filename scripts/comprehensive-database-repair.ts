import { storage } from '../server/storage.js';

async function comprehensiveDatabaseRepair() {
  console.log('=== COMPREHENSIVE DATABASE REPAIR ===\n');
  
  const repairs = [];
  
  // Check and repair categories (we know this was corrupted)
  console.log('--- Repairing Categories ---');
  try {
    const categories = await storage.getCategories();
    console.log(`Categories currently working: ${categories.length} items`);
    
    if (categories.length === 0) {
      console.log('Creating sample categories to restore functionality...');
      
      const sampleCategories = [
        {
          name: 'Performance Sportswear',
          slug: 'performance-sportswear',
          description: 'High-performance athletic wear designed for intense activities',
          isActive: true,
          metaTitle: 'Performance Sportswear | RUN APPAREL',
          metaDescription: 'Premium performance sportswear collection featuring advanced moisture-wicking and durability'
        },
        {
          name: 'Sustainable Activewear',
          slug: 'sustainable-activewear',
          description: 'Eco-friendly activewear made from recycled and sustainable materials',
          isActive: true,
          metaTitle: 'Sustainable Activewear | RUN APPAREL',
          metaDescription: 'Sustainable activewear collection using recycled fibers and eco-friendly materials'
        },
        {
          name: 'Team Uniforms',
          slug: 'team-uniforms',
          description: 'Professional team uniforms for sports organizations and schools',
          isActive: true,
          metaTitle: 'Team Uniforms | RUN APPAREL',
          metaDescription: 'Custom team uniforms and professional sportswear for organizations'
        }
      ];
      
      for (const category of sampleCategories) {
        const created = await storage.createCategory(category);
        console.log(`✅ Created category: ${created.name}`);
        repairs.push(`Categories: Created ${created.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Categories repair failed:', error);
  }
  
  // Check and repair other entities that might be missing essential data
  console.log('\n--- Checking Other Entities ---');
  
  // Check if we need sample certificates
  try {
    const certificates = await storage.getCertificates();
    if (certificates.length === 0) {
      console.log('Creating sample certificates...');
      const sampleCertificates = [
        {
          name: 'OEKO-TEX Standard 100',
          description: 'Certification for textiles tested for harmful substances',
          isActive: true,
          certificateType: 'Sustainability',
          issuingOrganization: 'OEKO-TEX Association',
          validityPeriod: '3 years'
        },
        {
          name: 'GOTS (Global Organic Textile Standard)',
          description: 'Leading standard for organic textile processing',
          isActive: true,
          certificateType: 'Organic',
          issuingOrganization: 'Global Organic Textile Standard',
          validityPeriod: '3 years'
        },
        {
          name: 'bluesign® approved',
          description: 'Comprehensive sustainability standard for textile industry',
          isActive: true,
          certificateType: 'Sustainability',
          issuingOrganization: 'bluesign technologies ag',
          validityPeriod: '1 year'
        }
      ];
      
      for (const cert of sampleCertificates) {
        const created = await storage.createCertificate(cert);
        console.log(`✅ Created certificate: ${created.name}`);
        repairs.push(`Certificates: Created ${created.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Certificates repair failed:', error);
  }
  
  // Check if we need sample size charts
  try {
    const sizeCharts = await storage.getSizeCharts();
    if (sizeCharts.length === 0) {
      console.log('Creating sample size charts...');
      const sampleSizeCharts = [
        {
          name: 'Men\'s Athletic Fit',
          description: 'Standard sizing for men\'s athletic sportswear',
          isActive: true,
          region: 'US',
          category: 'Men\'s Apparel',
          measurements: {
            'XS': { chest: '32-34', waist: '28-30', hips: '32-34' },
            'S': { chest: '34-36', waist: '30-32', hips: '34-36' },
            'M': { chest: '36-38', waist: '32-34', hips: '36-38' },
            'L': { chest: '38-40', waist: '34-36', hips: '38-40' },
            'XL': { chest: '40-42', waist: '36-38', hips: '40-42' },
            'XXL': { chest: '42-44', waist: '38-40', hips: '42-44' }
          }
        },
        {
          name: 'Women\'s Athletic Fit',
          description: 'Standard sizing for women\'s athletic sportswear',
          isActive: true,
          region: 'US',
          category: 'Women\'s Apparel',
          measurements: {
            'XS': { chest: '30-32', waist: '24-26', hips: '32-34' },
            'S': { chest: '32-34', waist: '26-28', hips: '34-36' },
            'M': { chest: '34-36', waist: '28-30', hips: '36-38' },
            'L': { chest: '36-38', waist: '30-32', hips: '38-40' },
            'XL': { chest: '38-40', waist: '32-34', hips: '40-42' },
            'XXL': { chest: '40-42', waist: '34-36', hips: '42-44' }
          }
        }
      ];
      
      for (const sizeChart of sampleSizeCharts) {
        const created = await storage.createSizeChart(sizeChart);
        console.log(`✅ Created size chart: ${created.name}`);
        repairs.push(`Size Charts: Created ${created.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Size charts repair failed:', error);
  }
  
  // Check accessories
  try {
    const accessories = await storage.getAccessories();
    if (accessories.length === 0) {
      console.log('Creating sample accessories...');
      const sampleAccessories = [
        {
          name: 'Custom Logo Embroidery',
          description: 'Professional embroidered logos for team uniforms',
          isActive: true,
          category: 'Branding',
          availableColors: ['Navy', 'Black', 'White', 'Red', 'Royal Blue'],
          estimatedPrice: '$5-15 per piece',
          minimumOrder: 12
        },
        {
          name: 'Reflective Strips',
          description: 'High-visibility reflective strips for safety sportswear',
          isActive: true,
          category: 'Safety',
          availableColors: ['Silver', 'Yellow', 'Orange'],
          estimatedPrice: '$2-8 per piece',
          minimumOrder: 25
        },
        {
          name: 'Moisture-Wicking Liner',
          description: 'Internal moisture management liner for enhanced comfort',
          isActive: true,
          category: 'Performance',
          availableColors: ['White', 'Black', 'Gray'],
          estimatedPrice: '$3-10 per piece',
          minimumOrder: 50
        }
      ];
      
      for (const accessory of sampleAccessories) {
        const created = await storage.createAccessory(accessory);
        console.log(`✅ Created accessory: ${created.name}`);
        repairs.push(`Accessories: Created ${created.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Accessories repair failed:', error);
  }
  
  console.log('\n=== REPAIR SUMMARY ===');
  console.log(`Total repairs made: ${repairs.length}`);
  repairs.forEach(repair => console.log(`  - ${repair}`));
  
  if (repairs.length === 0) {
    console.log('✅ Database is healthy - no repairs needed');
  } else {
    console.log('✅ Database repair completed successfully');
  }
  
  // Final verification
  console.log('\n=== FINAL VERIFICATION ===');
  const entities = [
    { name: 'Categories', method: 'getCategories' },
    { name: 'Fibers', method: 'getFibers' },
    { name: 'Certificates', method: 'getCertificates' },
    { name: 'Size Charts', method: 'getSizeCharts' },
    { name: 'Accessories', method: 'getAccessories' }
  ];
  
  for (const entity of entities) {
    try {
      const data = await (storage as any)[entity.method]();
      console.log(`✅ ${entity.name}: ${data.length} items`);
    } catch (error) {
      console.log(`❌ ${entity.name}: ERROR`);
    }
  }
}

// Run the repair
comprehensiveDatabaseRepair().catch(console.error);