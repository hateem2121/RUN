
import { eq } from 'drizzle-orm';
import { db } from '../server/db.js';
import { fabrics } from '../shared/schema.js';

async function fixWetsuitPercentages() {
  try {
    console.log('🤿 Fixing Wetsuit percentages...\n');

    // Fetch the Wetsuit fabric
    const wetsuit = await db.query.fabrics.findFirst({
      where: eq(fabrics.name, "Eco-Flex™ Scuba 3.0")
    });

    if (!wetsuit) {
      console.error('❌ Could not find "Eco-Flex™ Scuba 3.0"');
      process.exit(1);
    }

    const properties = wetsuit.properties as any;
    const compositions = properties.compositions;

    const updatedCompositions = compositions.map((comp: any) => {
      // Check if this composition has a 100% / 0% split
      const hasZeroPercent = comp.fibers.some((f: any) => f.percentage === "0" || f.percentage === 0);
      
      if (hasZeroPercent && comp.fibers.length === 2) {
        console.log(`  - Updating "${comp.name}" from 100%/0% to 80%/20%`);
        
        // Assuming the first fiber is the core (Rubber) and second is the face (Fabric)
        return {
          ...comp,
          fibers: [
            { ...comp.fibers[0], percentage: "80" },
            { ...comp.fibers[1], percentage: "20" }
          ]
        };
      }
      
      // Special case for Smooth Skin if it was 100% + 0%
      // If the second fiber is "Smooth Skin" or similar, maybe we treat it differently?
      // User input: "100% Limestone Rubber + Smooth Skin (Coated)"
      // If we want to represent the coating, maybe 98/2? 
      // For now, 80/20 is a safe "laminated fabric" assumption for the others. 
      // For "Limestone-Smooth", if it's truly just rubber, maybe we should remove the second component?
      // But the user included it as a "+" component. Let's stick to 80/20 for consistency or maybe 90/10 for coating?
      // Let's use 80/20 for all "100% + X" patterns to be consistent with the "Face" logic.
      
      return comp;
    });

    await db.update(fabrics)
      .set({ 
        properties: { ...properties, compositions: updatedCompositions } 
      })
      .where(eq(fabrics.id, wetsuit.id));

    console.log('\n✅ Wetsuit percentages updated!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing wetsuit:', error);
    process.exit(1);
  }
}

fixWetsuitPercentages();
