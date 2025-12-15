#!/usr/bin/env tsx

/**
 * Seed script for adding accessories to the database
 * Adds 7 accessories with proper specifications
 */

import { db } from '../server/db.js';
import { accessories } from '../shared/schema.js';

const accessoriesData = [
  {
    name: "3D Raised Silicone Heat Transfer",
    category: "Heat Transfer / Branding",
    description: "Designed for the modern aesthetic of our \"Active Wear\" and \"Lifestyle\" collections. This technique creates a premium, matte-finish logo that stands up from the fabric surface. It offers a sophisticated, architectural look for brand logos on leggings and tech-fleece. Crucially, the silicone compound we use has high elasticity, meaning it stretches with the garment and snaps back without cracking.",
    specifications: {
      "Height/Thickness": "0.5mm - 1mm",
      "Stretchability": "High-Elasticity (Crack Resistant)",
      "Finish": "Matte, Gloss, or Satin",
      "Wash Durability": "50+ Cycles at 40°C"
    },
    isActive: true
  },
  {
    name: "High-Definition Satin Stitch Embroidery",
    category: "Embroidery / Heritage Branding",
    description: "Reflecting our 135 years of craftsmanship, this is not standard mass-market embroidery. We utilize high-speed, multi-head digitized machines to deliver \"Tight-Tension\" stitching. This is ideal for crests on corporate polos, baseball caps, and varsity jackets. We use high-sheen viscose threads to ensure the logo catches the light and conveys a sense of luxury and permanence.",
    specifications: {
      "Thread Type": "High-Sheen Viscose or Polyester",
      "Stitch Density": "High (No fabric show-through)",
      "Backing": "Soft-touch non-woven (Non-irritating)",
      "Application": "Heavyweight Fabrics, Caps, Outerwear"
    },
    isActive: true
  },
  {
    name: "Vislon® Teeth Auto-Lock Zipper",
    category: "Hardware / Zippers",
    description: "Essential for our \"Outer Wear\" and \"Tracksuits\". In sports, a zipper pull that bounces around is a distraction. We utilize auto-lock cam technology where the pull tab stays locked in place when flush against the zipper chain. The Vislon (molded plastic) teeth are lighter than metal and corrosion-resistant, making them perfect for sweat-heavy environments and all-weather training gear.",
    specifications: {
      "Mechanism": "Cam-Lock (Anti-Bounce)",
      "Material": "Injected Molded Acetal Resin (Plastic)",
      "Durability": "10,000+ Cycles",
      "Sizes": "#3 (Pockets), #5 (Main Closure)"
    },
    isActive: true
  },
  {
    name: "Ultrasonic Fabric Embossing",
    category: "Texture / Surface Finishing",
    description: "A subtle, premium branding technique used in our \"Casual Wear\" and \"Outer Layer\" lines. Instead of adding ink or thread, we use ultrasonic waves to heat and reshape the fabric itself, creating a permanent 3D pattern or logo. This is \"Stealth Branding\" at its finest—adding texture and depth without adding weight or compromising the garment's monochromatic aesthetic.",
    specifications: {
      "Tactile Feel": "3D Structured",
      "Weight": "Zero Added Weight",
      "Durability": "Permanent (Molecular bond)",
      "Best For": "Synthetic Fabrics (Polyester/Fleece)"
    },
    isActive: true
  },
  {
    name: "Tagless Heat Transfer Care Label",
    category: "Private Labeling / Branding",
    description: "The industry standard for high-performance activewear. We replace scratchy woven tags with smooth, skin-friendly heat transfers applied directly to the inside neck or waistband. This \"Friction-Free\" branding prevents irritation during intense movement (running/training) and provides a clean, professional canvas for our partner's sizing and care data.",
    specifications: {
      "Feel": "Soft-Hand (Undetectable)",
      "Skin Safety": "OEKO-TEX Class I (Safe for babies/sensitive skin)",
      "Durability": "Stretch-proof (Moves with the fabric)",
      "Application": "Inner Neck, Waistband"
    },
    isActive: true
  },
  {
    name: "Silver-Lite™ Reflective Safety Transfer",
    category: "Safety / Heat Transfer",
    description: "A non-negotiable for our \"Running\" and \"Outdoor\" categories. This transfer appears matte silver in daylight but reflects bright white when hit by headlights at night. It is an essential safety feature for urban running gear. We use high-candlepower glass bead technology to ensure maximum visibility without compromising the garment's flexibility.",
    specifications: {
      "Reflectivity": ">350 cd/lux/m² (High Visibility)",
      "Function": "Night Safety / Low-Light Visibility",
      "Certification": "EN ISO 20471 Compliant",
      "Wash Fastness": "25 Cycles (Home Wash)"
    },
    isActive: true
  },
  {
    name: "Silicone-Dipped Performance Drawcords",
    category: "Trims / Hardware",
    description: "Used in our premium hoodies and joggers. Cheap drawcords fray; ours define quality. We use high-density braided polyester cords finished with a \"Silicone Dip\" aglet (the tip). This creates a seamless, rubberized end that will never crack or peel. It adds a sleek, modern, and technical look that elevates a basic hoodie into a premium athleisure product.",
    specifications: {
      "Aglet Type": "Soft-Touch Matte Silicone Dip",
      "Cord Shape": "Round or Flat",
      "Customization": "DTM (Dyed to Match) or Contrast Color",
      "Durability": "Fray-Proof Construction"
    },
    isActive: true
  }
];

async function seedAccessories() {
  try {
    console.log('🚀 Starting accessories seed...\n');

    for (const accessory of accessoriesData) {
      console.log(`Adding: ${accessory.name}`);
      

      const result = await db.insert(accessories).values(accessory).returning();
      
      if (result && result[0]) {
        console.log(`✅ Created: ${result[0].name} (ID: ${result[0].id})\n`);
      }
    }

    console.log('✨ All accessories added successfully!');
    console.log(`📊 Total: ${accessoriesData.length} accessories created`);
    
  } catch (error) {
    console.error('❌ Error seeding accessories:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

try {
  await seedAccessories();
} catch (error) {
  console.error('❌ Script failed:', error);
  process.exit(1);
}
