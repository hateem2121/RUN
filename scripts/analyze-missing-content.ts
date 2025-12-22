
import { desc } from 'drizzle-orm';
import { db } from '../server/db.js';
import { fabrics } from '../shared/schema.js';

async function analyzeMissingContent() {
  try {
    console.log('🕵️ Analyzing missing content fields for the last 8 fabrics...\n');

    // Fetch the last 8 fabrics
    const recentFabrics = await db.select().from(fabrics).orderBy(desc(fabrics.id)).limit(8);
    const orderedFabrics = recentFabrics.reverse();

    const fieldsToCheck = [
      // Classification
      'weave',
      'finish',
      'keyApplications',
      'weaveTypes',
      'finishTreatments',
      
      // Performance
      'stretchDirection',
      'breathability',
      'enhancedMoistureManagement',
      'wickingRate',
      'dryingTime',
      'performanceFeatures',
      'airPermeability',
      'waterColumn',
      
      // Durability
      'yarnCountConstruction',
      'colorfastness',
      'tensileStrength',
      'tearStrength',
      'abrasionResistance',
      'pillingGrade',
      'shrinkageTolerancePercentage',
      
      // Sustainability
      'certificationIds',
      'certificationTags',
      'endOfLifeOptions',
      'recyclabilityNotes',
      'useCases',
      
      // Media
      'visualSwatchId' // This is on the root object, not properties
    ];

    const missingReport: Record<string, string[]> = {};

    orderedFabrics.forEach(f => {
      const props = f.properties as any || {};
      const missing: string[] = [];

      // Check root fields
      if (!f.visualSwatchId) missing.push('visualSwatchId (Visual Swatch Image)');

      // Check property fields
      fieldsToCheck.forEach(field => {
        if (field === 'visualSwatchId') return; // Already checked

        const value = props[field];
        
        // Check for empty/null/undefined
        if (value === undefined || value === null || value === "") {
          missing.push(field);
        } 
        // Check for empty arrays
        else if (Array.isArray(value) && value.length === 0) {
          missing.push(field);
        }
      });

      if (missing.length > 0) {
        missingReport[f.name] = missing;
      }
    });

    // Print Report
    console.log('📋 MISSING CONTENT REPORT\n');
    Object.entries(missingReport).forEach(([name, fields]) => {
      console.log(`🔹 ${name}`);
      fields.forEach(field => console.log(`   - ${field}`));
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error analyzing content:', error);
    process.exit(1);
  }
}

analyzeMissingContent();
