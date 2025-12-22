
import { eq } from 'drizzle-orm';
import { db } from '../server/db.js';
import { fabrics } from '../shared/schema.js';

// Hardcoded map of fiber names to IDs based on previous analysis
const FIBER_MAP: Record<string, number> = {
  "Virgin Polyester": 35,
  "Polyester": 35,
  "Polyester Micro-Fiber": 35,
  "Spun Polyester": 35,
  "Polyester Ripstop": 35,
  "Mechanical Poly": 35,
  
  "Recycled Polyester": 36,
  "rPET": 36,
  "rPET Face": 36,
  
  "Conventional Cotton": 37,
  "Combed Cotton": 37,
  "Cotton": 37,
  
  "Organic Cotton": 38,
  
  "Standard Elastane": 39,
  "Elastane": 39,
  "Spandex": 39,
  "Lycra® Black": 39,
  "High-Modulus Elastane": 39,
  
  "Eco-Smart Elastane": 40,
  "Eco-Elastane": 40,
  "Eco-Spandex": 40,
  
  "Virgin Nylon 6": 41,
  "Nylon 6": 41,
  "Nylon": 41,
  "Nylon Jersey": 41,
  "Nylon Face": 41,
  "Nylon 6.6": 41,
  
  "Recycled Nylon": 42,
  "Bio-Based Polyamide": 42, // Mapping Bio to Recycled/Sustainable
  
  "Standard Micro-Fleece": 43,
  "Fleece Lining": 43,
  
  "Recycled Performance Fleece": 44,
  
  "Standard Neoprene": 45,
  "Petroleum Neoprene": 45,
  
  "Eco-Limestone Neoprene": 46,
  "Limestone Rubber": 46,
  "Smooth Skin": 46, // Coating/Finish, mapping to base material
  "Natural Rubber": 46, // Mapping Bio-Rubber to Eco-Limestone
  
  "Polypropylene": 47,
  
  "Performance Hemp": 48,
  
  "MicroModal": 49,
  "Bamboo Viscose": 49,
  "Bamboo Lyocell": 49,
  "Bamboo Charcoal Viscose": 49,
  "Tencel™ Active Lyocell": 49,
  "Rayon": 49,
  
  "Graphene-Infused Polyester": 50,
  "Merino Wool": 52
};

// Source data from seed-fabrics.ts
const fabricsData = [
  {
    name: "RunTech™ Aero-Mesh 145",
    properties: {
      compositions: [
        { name: "Standard Poly", isDefault: true, fibers: [{ name: "Virgin Polyester", percentage: "100" }] },
        { name: "Eco-Poly", isDefault: false, fibers: [{ name: "Recycled Polyester", percentage: "100" }] },
        { name: "Poly-Flex", isDefault: false, fibers: [{ name: "Polyester", percentage: "95" }, { name: "Elastane", percentage: "5" }] },
        { name: "Eco-Poly Flex", isDefault: false, fibers: [{ name: "Recycled Polyester", percentage: "95" }, { name: "Eco-Smart Elastane", percentage: "5" }] },
        { name: "Tech-Graphene", isDefault: false, fibers: [{ name: "Polyester", percentage: "92" }, { name: "Graphene-Infused Polyester", percentage: "8" }] },
        { name: "Promo-Poly", isDefault: false, fibers: [{ name: "Spun Polyester", percentage: "100" }] }
      ]
    }
  },
  {
    name: "Sculpt-Core™ 260",
    properties: {
      compositions: [
        { name: "Nylon-Flex", isDefault: true, fibers: [{ name: "Nylon 6.6", percentage: "75" }, { name: "High-Modulus Elastane", percentage: "25" }] },
        { name: "Bio-Nylon Flex", isDefault: false, fibers: [{ name: "Bio-Based Polyamide", percentage: "75" }, { name: "Eco-Smart Elastane", percentage: "25" }] },
        { name: "Tencel-Flex", isDefault: false, fibers: [{ name: "Tencel™ Active Lyocell", percentage: "80" }, { name: "Elastane", percentage: "20" }] },
        { name: "Eco-Poly Flex", isDefault: false, fibers: [{ name: "Recycled Polyester", percentage: "77" }, { name: "Elastane", percentage: "23" }] },
        { name: "Elite-Matte", isDefault: false, fibers: [{ name: "Nylon 6", percentage: "70" }, { name: "Lycra® Black", percentage: "30" }] },
        { name: "Heather-Blend", isDefault: false, fibers: [{ name: "Nylon", percentage: "45" }, { name: "Polyester", percentage: "45" }, { name: "Elastane", percentage: "10" }] }
      ]
    }
  },
  {
    name: "Heritage French Terry 350",
    properties: {
      compositions: [
        { name: "Standard Cotton", isDefault: true, fibers: [{ name: "Combed Cotton", percentage: "100" }] },
        { name: "Organic Cotton", isDefault: false, fibers: [{ name: "Organic Cotton", percentage: "100" }] },
        { name: "CVC Blend", isDefault: false, fibers: [{ name: "Cotton", percentage: "60" }, { name: "Polyester", percentage: "40" }] },
        { name: "Eco-CVC Blend", isDefault: false, fibers: [{ name: "Organic Cotton", percentage: "60" }, { name: "Recycled Polyester", percentage: "40" }] },
        { name: "Cotton-Flex", isDefault: false, fibers: [{ name: "Cotton", percentage: "95" }, { name: "Elastane", percentage: "5" }] },
        { name: "Bamboo-Blend", isDefault: false, fibers: [{ name: "Bamboo Viscose", percentage: "70" }, { name: "Organic Cotton", percentage: "30" }] }
      ]
    }
  },
  {
    name: "Storm-Shield™ 3L Softshell",
    properties: {
      compositions: [
        { name: "Poly-Shield", isDefault: true, fibers: [{ name: "Polyester", percentage: "94" }, { name: "Spandex", percentage: "6" }] },
        { name: "Eco-Poly Shield", isDefault: false, fibers: [{ name: "Recycled Polyester", percentage: "94" }, { name: "Spandex", percentage: "6" }] },
        { name: "Nylon-Shield", isDefault: false, fibers: [{ name: "Nylon 6", percentage: "92" }, { name: "Spandex", percentage: "8" }] },
        { name: "Thermal-Shield", isDefault: false, fibers: [{ name: "Polyester", percentage: "90" }, { name: "Spandex", percentage: "10" }] },
        { name: "Flex-Shield", isDefault: false, fibers: [{ name: "Polyester", percentage: "88" }, { name: "Spandex", percentage: "12" }] },
        { name: "Workwear-Shield", isDefault: false, fibers: [{ name: "Polyester Ripstop", percentage: "100" }] }
      ]
    }
  },
  {
    name: "Zen-Luxe™ Performance Jersey",
    properties: {
      compositions: [
        { name: "Hybrid-Bamboo", isDefault: true, fibers: [{ name: "Cotton", percentage: "50" }, { name: "Bamboo Viscose", percentage: "45" }, { name: "Elastane", percentage: "5" }] },
        { name: "Eco-Hybrid Bamboo", isDefault: false, fibers: [{ name: "Organic Cotton", percentage: "50" }, { name: "Bamboo Lyocell", percentage: "45" }, { name: "Eco-Elastane", percentage: "5" }] },
        { name: "Tri-Blend", isDefault: false, fibers: [{ name: "Polyester", percentage: "50" }, { name: "Cotton", percentage: "25" }, { name: "Rayon", percentage: "25" }] },
        { name: "Pure-Bamboo Flex", isDefault: false, fibers: [{ name: "Bamboo Charcoal Viscose", percentage: "95" }, { name: "Elastane", percentage: "5" }] },
        { name: "Modal-Flex", isDefault: false, fibers: [{ name: "MicroModal", percentage: "95" }, { name: "Elastane", percentage: "5" }] },
        { name: "CVC Blend", isDefault: false, fibers: [{ name: "Cotton", percentage: "60" }, { name: "Polyester", percentage: "40" }] }
      ]
    }
  },
  {
    name: "Thermo-Skin™ Pro",
    properties: {
      compositions: [
        { name: "Polypro-Flex", isDefault: true, fibers: [{ name: "Polypropylene", percentage: "90" }, { name: "Elastane", percentage: "10" }] },
        { name: "Eco-Poly Thermal", isDefault: false, fibers: [{ name: "Recycled Polyester", percentage: "90" }, { name: "Elastane", percentage: "10" }] },
        { name: "Pure-Merino", isDefault: false, fibers: [{ name: "Merino Wool", percentage: "100" }] },
        { name: "Merino-Blend", isDefault: false, fibers: [{ name: "Merino Wool", percentage: "50" }, { name: "Recycled Polyester", percentage: "50" }] },
        { name: "Nylon-Thermal", isDefault: false, fibers: [{ name: "Nylon 6.6", percentage: "85" }, { name: "Spandex", percentage: "15" }] },
        { name: "Poly-Thermal", isDefault: false, fibers: [{ name: "Polyester", percentage: "92" }, { name: "Spandex", percentage: "8" }] }
      ]
    }
  },
  {
    name: "Eco-Flex™ Scuba 3.0",
    properties: {
      compositions: [
        { name: "Limestone-Nylon", isDefault: true, fibers: [{ name: "Limestone Rubber", percentage: "100" }, { name: "Nylon Jersey", percentage: "0" }] },
        { name: "Limestone-Eco Poly", isDefault: false, fibers: [{ name: "Limestone Rubber", percentage: "100" }, { name: "rPET Face", percentage: "0" }] },
        { name: "Limestone-Thermal", isDefault: false, fibers: [{ name: "Limestone Rubber", percentage: "100" }, { name: "Fleece Lining", percentage: "0" }] },
        { name: "Standard-Petroleum", isDefault: false, fibers: [{ name: "Petroleum Neoprene", percentage: "100" }, { name: "Nylon Face", percentage: "0" }] },
        { name: "Limestone-Smooth", isDefault: false, fibers: [{ name: "Limestone Rubber", percentage: "100" }, { name: "Smooth Skin", percentage: "0" }] },
        { name: "Bio-Rubber", isDefault: false, fibers: [{ name: "Natural Rubber", percentage: "100" }, { name: "Recycled Nylon", percentage: "0" }] }
      ]
    }
  },
  {
    name: "Velocity™ Diamond Ripstop",
    properties: {
      compositions: [
        { name: "Standard Poly", isDefault: true, fibers: [{ name: "Polyester Micro-Fiber", percentage: "100" }] },
        { name: "Eco-Poly", isDefault: false, fibers: [{ name: "Recycled Polyester", percentage: "100" }] },
        { name: "Poly-Flex Woven", isDefault: false, fibers: [{ name: "Polyester", percentage: "90" }, { name: "Spandex", percentage: "10" }] },
        { name: "Eco-Poly Flex Woven", isDefault: false, fibers: [{ name: "rPET", percentage: "90" }, { name: "Eco-Spandex", percentage: "10" }] },
        { name: "Standard Nylon", isDefault: false, fibers: [{ name: "Nylon 6", percentage: "100" }] },
        { name: "Mechanical Poly", isDefault: false, fibers: [{ name: "Polyester", percentage: "100" }] }
      ]
    }
  }
];

async function fixFabrics() {
  try {
    console.log('🔧 Fixing fabric compositions...\n');

    // Fetch all fabrics
    const allFabrics = await db.select().from(fabrics);

    for (const fabric of allFabrics) {
      // Find matching source data
      const sourceFabric = fabricsData.find(f => f.name === fabric.name);
      
      if (!sourceFabric) {
        // Skip fabrics not in our source list (e.g. older ones)
        continue;
      }

      console.log(`Processing "${fabric.name}"...`);
      
      const properties = fabric.properties as any;
      
      // Re-map compositions using source data to ensure we have names and correct IDs
      const updatedCompositions = sourceFabric.properties.compositions.map(comp => {
        const updatedFibers = comp.fibers.map(f => {
          let fiberId = FIBER_MAP[f.name];
          
          if (!fiberId) {
             console.warn(`  ⚠️ Could not map "${f.name}" for fabric "${fabric.name}"`);
             fiberId = null as any;
          } else {
             // console.log(`  - Mapped "${f.name}" to ID ${fiberId}`);
          }
          
          return {
            name: f.name, // IMPORTANT: Keep the name this time!
            percentage: f.percentage,
            fiberId: fiberId
          };
        });
        
        return {
          ...comp,
          fibers: updatedFibers
        };
      });

      // Update the database
      await db.update(fabrics)
        .set({ 
          properties: { ...properties, compositions: updatedCompositions } 
        })
        .where(eq(fabrics.id, fabric.id));
      
      console.log(`  ✅ Updated compositions for "${fabric.name}"`);
    }

    console.log('\n✨ Fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing fabrics:', error);
    process.exit(1);
  }
}

fixFabrics();
