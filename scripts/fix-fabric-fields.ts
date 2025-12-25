import { eq } from "drizzle-orm";
import { db } from "../server/db.js";
import { fabrics } from "../shared/schema.js";

async function fixAllFabrics() {
  try {
    // Fabric 1: RunTech™ Aero-Mesh 145
    await db
      .update(fabrics)
      .set({
        weight: "145",
        sport: "Soccer",
        marketSegment: "Professional Teamwear",
        seasonality: "Summer",
        description:
          'This is not your standard generic mesh; it is the engine of modern match-day performance. Engineered with a proprietary "Micro-Diamond" knit structure, it maximizes aerodynamic airflow while maintaining the high opacity required by pro leagues. The surface is chemically primed for high-definition sublimation printing, ensuring that sponsor logos and player numbers remain razor-sharp and vibrant without blocking the fabric\'s pores. It is the perfect balance of durability for the tackle and lightness for the sprint.',
        fabricType: "Micro-Eyelet Knit",
        weave: "Warp Knit (Tricot)",
        finishTreatment: "Hydrophilic Wicking Agent, Anti-Static",
        keyApplications: ["Match Jerseys", "Training Bibs", "Basketball Singlets"],
        weaveTypes: ["Micro-Pique Eyelet"],
        sustainabilityScore: 85,
        certifications: ["Recycled Content", "Harmful Chemical Free"],
        properties: {
          stretchPercentage: "20-40%",
          stretchDirection: ["2-Way"],
          breathability: "Excellent",
          moistureManagement: "Excellent",
          enhancedMoistureManagement: "Instant",
          wickingRate: "< 2 seconds",
          dryingTime: "< 30 mins",
          performanceFeatures: ["High Ventilation", "Sublimation Ready"],
          airPermeability: "300 l/m²/s",
          waterColumn: "0",
          yarnCountConstruction: "75D/72F Micro-Filament",
          colorfastness: "Grade 5",
          tensileStrength: "High",
          tearStrength: "15 N",
          abrasionResistance: "25,000",
          pillingGrade: "4",
          shrinkageTolerancePercentage: "2",
          washTemperature: "40",
          endOfLifeOptions: ["Recyclable"],
          recyclabilityNotes:
            "As a mono-material polyester (PET), this fabric is a prime candidate for circular recycling. It can be shredded and re-extruded into new yarn. Sublimation inks do not hinder this process in modern chemical recycling facilities.",
          useCases: ["Team Wear", "Professional Sports"],
          washCareInstructions: {
            instructions:
              "Machine wash inside out to protect prints. Do not use fabric softeners as they coat the fibers and block wicking pores. Line dry recommended to save energy.",
            careSymbols: [],
            restrictions: [],
          },
          compositions: [
            {
              name: "Standard Poly",
              isDefault: true,
              fibers: [{ fiberId: 35, percentage: "100" }],
            },
            {
              name: "Eco-Poly",
              isDefault: false,
              fibers: [{ fiberId: 34, percentage: "100" }],
            },
            {
              name: "Poly-Flex",
              isDefault: false,
              fibers: [
                { fiberId: 35, percentage: "95" },
                { fiberId: 39, percentage: "5" },
              ],
            },
            {
              name: "Eco-Poly Flex",
              isDefault: false,
              fibers: [
                { fiberId: 34, percentage: "95" },
                { fiberId: 40, percentage: "5" },
              ],
            },
            {
              name: "Tech-Graphene",
              isDefault: false,
              fibers: [
                { fiberId: 35, percentage: "92" },
                { fiberId: 50, percentage: "8" },
              ],
            },
            {
              name: "Promo-Poly",
              isDefault: false,
              fibers: [{ fiberId: 35, percentage: "100" }],
            },
          ],
        },
      })
      .where(eq(fabrics.name, "RunTech™ Aero-Mesh 145"));

    // Fabric 2: Sculpt-Core™ 260
    await db
      .update(fabrics)
      .set({
        weight: "260",
        sport: "Yoga",
        marketSegment: "Premium Activewear",
        seasonality: "All-Season",
        description:
          'The "Rolls Royce" of leggings fabrics, designed to instill confidence in motion. Using a high-density double-knit interlock construction, we guarantee "Squat-Proof" opacity even during deep stretches. The surface features a "Peach-Skin" matte finish that feels cool to the touch, while the high-modulus elastane core provides compressive support that sculpts the body without restricting blood flow.',
        fabricType: "Interlock Double-Knit",
        weave: "Weft Knit (Circular)",
        finishTreatment: "Peach-Skin (Sanding), Anti-Microbial",
        keyApplications: ["High-Waisted Leggings", "Sports Bras", "Cycling Shorts"],
        weaveTypes: ["Double-Knit Interlock"],
        sustainabilityScore: 75,
        certifications: ["Micro-Plastic Management", "Safe for Skin"],
        properties: {
          stretchPercentage: "200%",
          stretchDirection: ["4-Way"],
          breathability: "Good",
          moistureManagement: "Good",
          wickingRate: "Moderate",
          dryingTime: "2-4 hours",
          performanceFeatures: ["Squat-Proof", "Compressive"],
          airPermeability: "50 l/m²/s",
          yarnCountConstruction: "40D Full Dull Nylon",
          colorfastness: "Grade 4",
          tensileStrength: "Superior",
          tearStrength: "20 N",
          abrasionResistance: "50,000",
          pillingGrade: "5",
          shrinkageTolerancePercentage: "3",
          washTemperature: "30",
          endOfLifeOptions: ["Recyclable (Chemical)"],
          recyclabilityNotes:
            "Due to the elastane blend, this fabric requires advanced chemical recycling to separate polymers. We recommend partnering with specialized textile-to-textile recycling programs.",
          useCases: ["Activewear", "Yoga"],
          washCareInstructions: {
            instructions:
              "Wash cold on gentle cycle. Lay flat to dry to preserve elasticity—hanging wet leggings can distort the shape. Do not iron.",
            careSymbols: [],
            restrictions: [],
          },
          compositions: [
            {
              name: "Nylon-Flex",
              isDefault: true,
              fibers: [
                { fiberId: 41, percentage: "75" },
                { fiberId: 39, percentage: "25" },
              ],
            },
            {
              name: "Bio-Nylon Flex",
              isDefault: false,
              fibers: [
                { fiberId: 41, percentage: "75" },
                { fiberId: 40, percentage: "25" },
              ],
            },
            {
              name: "Tencel-Flex",
              isDefault: false,
              fibers: [
                { fiberId: 49, percentage: "80" },
                { fiberId: 39, percentage: "20" },
              ],
            },
            {
              name: "Eco-Poly Flex",
              isDefault: false,
              fibers: [
                { fiberId: 34, percentage: "77" },
                { fiberId: 39, percentage: "23" },
              ],
            },
            {
              name: "Elite-Matte",
              isDefault: false,
              fibers: [
                { fiberId: 41, percentage: "70" },
                { fiberId: 39, percentage: "30" },
              ],
            },
            {
              name: "Heather-Blend",
              isDefault: false,
              fibers: [
                { fiberId: 41, percentage: "45" },
                { fiberId: 35, percentage: "45" },
                { fiberId: 39, percentage: "10" },
              ],
            },
          ],
        },
      })
      .where(eq(fabrics.name, "Sculpt-Core™ 260"));

    // Fabric 3: Heritage French Terry 350
    await db
      .update(fabrics)
      .set({
        weight: "350",
        sport: "Lifestyle",
        marketSegment: "Premium Streetwear",
        seasonality: "Fall / Winter",
        description:
          'A substantial, heavyweight knit that defines "Quality" the moment you touch it. We use a tight-gauge knitting process to create a smooth face optimized for premium screen printing or embroidery. The interior features a structured loop-back pile that breathes significantly better than fleece, preventing overheating while offering that coveted "Vintage Sportswear" weight and drape.',
        fabricType: "French Terry",
        weave: "Weft Knit",
        finishTreatment: "Enzyme Wash (Bio-Polishing)",
        keyApplications: ["Heavyweight Hoodies", "Sweatpants", "Crewnecks"],
        weaveTypes: ["French Terry (Loop Back)"],
        sustainabilityScore: 90,
        certifications: ["Organic", "Biodegradable"],
        properties: {
          stretchPercentage: "10-15%",
          stretchDirection: ["2-Way"],
          breathability: "Moderate",
          moistureManagement: "High (Absorbent)",
          wickingRate: "Slow",
          dryingTime: "Slow",
          performanceFeatures: ["Loop Back Breathability"],
          airPermeability: "Moderate",
          yarnCountConstruction: "20/1 Face, 10/1 Loop",
          colorfastness: "Grade 4",
          tensileStrength: "Moderate",
          tearStrength: "25 N",
          abrasionResistance: "20,000",
          pillingGrade: "3-4",
          shrinkageTolerancePercentage: "5",
          washTemperature: "40",
          endOfLifeOptions: ["Biodegradable", "Compostable", "Recyclable"],
          recyclabilityNotes:
            "100% Cotton variants are fully biodegradable (breaking down in <6 months in industrial compost). Blended variants should be mechanically recycled into insulation or shoddy.",
          useCases: ["Lifestyle", "Corporate Merch"],
          washCareInstructions: {
            instructions:
              "Machine wash warm. Tumble dry medium. Warm iron if needed to restore smoothness.",
            careSymbols: [],
            restrictions: [],
          },
          compositions: [
            {
              name: "Standard Cotton",
              isDefault: true,
              fibers: [{ fiberId: 37, percentage: "100" }],
            },
            {
              name: "Organic Cotton",
              isDefault: false,
              fibers: [{ fiberId: 38, percentage: "100" }],
            },
            {
              name: "CVC Blend",
              isDefault: false,
              fibers: [
                { fiberId: 37, percentage: "60" },
                { fiberId: 35, percentage: "40" },
              ],
            },
            {
              name: "Eco-CVC Blend",
              isDefault: false,
              fibers: [
                { fiberId: 38, percentage: "60" },
                { fiberId: 34, percentage: "40" },
              ],
            },
            {
              name: "Cotton-Flex",
              isDefault: false,
              fibers: [
                { fiberId: 37, percentage: "95" },
                { fiberId: 39, percentage: "5" },
              ],
            },
            {
              name: "Bamboo-Blend",
              isDefault: false,
              fibers: [
                { fiberId: 31, percentage: "70" },
                { fiberId: 38, percentage: "30" },
              ],
            },
          ],
        },
      })
      .where(eq(fabrics.name, "Heritage French Terry 350"));

    // Fabric 4: Storm-Shield™ 3L Softshell
    await db
      .update(fabrics)
      .set({
        weight: "280",
        sport: "Outdoor",
        marketSegment: "Performance Outerwear",
        seasonality: "Winter",
        description:
          'The ultimate "One-Jacket" solution. This is a 3-Layer bonded fabric system engineered to replace bulky layering. The outer woven layer repels rain and snow; the middle membrane blocks wind entirely while allowing sweat vapor to escape; the inner micro-fleece layer traps body heat. It provides a sleek, professional silhouette for coaching staff and outdoor teams facing unpredictable weather.',
        fabricType: "Bonded Composite",
        weave: "Woven Face / Bonded Knit Back",
        finishTreatment: "DWR (C0 Formula)",
        keyApplications: ["Sideline Jackets", "Hiking Shells", "Winter Tracksuits"],
        weaveTypes: ["Plain Weave Face"],
        sustainabilityScore: 70,
        certifications: ["PFC-Free", "Recycled Content"],
        properties: {
          stretchPercentage: "10-15%",
          stretchDirection: ["2-Way"],
          breathability: "Breathable Membrane",
          moistureManagement: "MVTR 10,000",
          dryingTime: "Fast Surface Dry",
          performanceFeatures: ["Windproof", "Waterproof"],
          airPermeability: "Low (Windproof)",
          waterColumn: "10,000mm",
          yarnCountConstruction: "75D/144F Face",
          colorfastness: "Grade 4-5",
          tensileStrength: "High",
          tearStrength: "40 N",
          abrasionResistance: "40,000",
          pillingGrade: "4",
          shrinkageTolerancePercentage: "1",
          washTemperature: "30",
          endOfLifeOptions: ["Downcycling"],
          recyclabilityNotes:
            "As a bonded composite material, mechanical separation is difficult. The primary sustainable end-of-life path is downcycling into industrial insulation padding.",
          useCases: ["Outdoor Sports", "Outerwear"],
          washCareInstructions: {
            instructions:
              "Machine wash cold with technical detergent. Tumble dry low for 20 minutes to reactivate the DWR coating. Do not use bleach or fabric softeners.",
            careSymbols: [],
            restrictions: [],
          },
          compositions: [
            {
              name: "Poly-Shield",
              isDefault: true,
              fibers: [
                { fiberId: 35, percentage: "94" },
                { fiberId: 39, percentage: "6" },
              ],
            },
            {
              name: "Eco-Poly Shield",
              isDefault: false,
              fibers: [
                { fiberId: 34, percentage: "94" },
                { fiberId: 39, percentage: "6" },
              ],
            },
            {
              name: "Nylon-Shield",
              isDefault: false,
              fibers: [
                { fiberId: 41, percentage: "92" },
                { fiberId: 39, percentage: "8" },
              ],
            },
            {
              name: "Thermal-Shield",
              isDefault: false,
              fibers: [
                { fiberId: 35, percentage: "90" },
                { fiberId: 39, percentage: "10" },
              ],
            },
            {
              name: "Flex-Shield",
              isDefault: false,
              fibers: [
                { fiberId: 35, percentage: "88" },
                { fiberId: 39, percentage: "12" },
              ],
            },
            {
              name: "Workwear-Shield",
              isDefault: false,
              fibers: [{ fiberId: 35, percentage: "100" }],
            },
          ],
        },
      })
      .where(eq(fabrics.name, "Storm-Shield™ 3L Softshell"));

    // Fabric 5: Zen-Luxe™ Performance Jersey
    await db
      .update(fabrics)
      .set({
        weight: "180",
        sport: "Golf",
        marketSegment: "Premium Lifestyle",
        seasonality: "Summer / Spring",
        description:
          'The ultimate "Travel Tee" fabric that bridges nature and technology. By blending the durability of cotton with the technical properties of Bamboo and Modal, we create a fabric that is naturally bacteriostatic (resists odor) and thermal-regulating. It has a heavier, luxurious drape that doesn\'t cling, keeping the wearer cool, fresh, and polished from the flight deck to the fairway.',
        fabricType: "Single Jersey Knit",
        weave: "Weft Knit",
        finishTreatment: "Silicon Softener (Silky Hand)",
        keyApplications: ["Premium T-Shirts", "Golf Polos", "Lounge Wear"],
        weaveTypes: ["Single Jersey"],
        sustainabilityScore: 80,
        certifications: ["Sustainable Forestry", "Biodegradable"],
        properties: {
          stretchPercentage: "30-40%",
          stretchDirection: ["4-Way"],
          breathability: "High",
          moistureManagement: "High (Regulates humidity)",
          wickingRate: "Moderate",
          dryingTime: "Moderate",
          performanceFeatures: ["Anti-Odor", "Thermal Regulation"],
          airPermeability: "High",
          yarnCountConstruction: "30/1 Compact Spun",
          colorfastness: "Grade 4",
          tensileStrength: "Moderate",
          tearStrength: "15 N",
          abrasionResistance: "15,000",
          pillingGrade: "3-4",
          shrinkageTolerancePercentage: "4",
          washTemperature: "30",
          endOfLifeOptions: ["Biodegradable", "Compostable"],
          recyclabilityNotes:
            "Bamboo and Cotton blends decompose naturally. Avoid landfill; industrial composting is preferred to recover biomass energy.",
          useCases: ["Lifestyle", "Travel"],
          washCareInstructions: {
            instructions:
              "Wash cold. Line dry preferred to prevent torqueing (twisting) of the seams. Iron on low heat.",
            careSymbols: [],
            restrictions: [],
          },
          compositions: [
            {
              name: "Hybrid-Bamboo",
              isDefault: true,
              fibers: [
                { fiberId: 37, percentage: "50" },
                { fiberId: 31, percentage: "45" },
                { fiberId: 39, percentage: "5" },
              ],
            },
            {
              name: "Eco-Hybrid Bamboo",
              isDefault: false,
              fibers: [
                { fiberId: 38, percentage: "50" },
                { fiberId: 31, percentage: "45" },
                { fiberId: 40, percentage: "5" },
              ],
            },
            {
              name: "Tri-Blend",
              isDefault: false,
              fibers: [
                { fiberId: 35, percentage: "50" },
                { fiberId: 37, percentage: "25" },
                { fiberId: 49, percentage: "25" },
              ],
            },
            {
              name: "Pure-Bamboo Flex",
              isDefault: false,
              fibers: [
                { fiberId: 31, percentage: "95" },
                { fiberId: 39, percentage: "5" },
              ],
            },
            {
              name: "Modal-Flex",
              isDefault: false,
              fibers: [
                { fiberId: 49, percentage: "95" },
                { fiberId: 39, percentage: "5" },
              ],
            },
            {
              name: "CVC Blend",
              isDefault: false,
              fibers: [
                { fiberId: 37, percentage: "60" },
                { fiberId: 35, percentage: "40" },
              ],
            },
          ],
        },
      })
      .where(eq(fabrics.name, "Zen-Luxe™ Performance Jersey"));

    // Fabric 6: Thermo-Skin™ Pro
    await db
      .update(fabrics)
      .set({
        weight: "130",
        sport: "Skiing",
        marketSegment: "Technical Base Layer",
        seasonality: "Winter",
        description:
          'The lightest thermal fabric on the market, designed to be the "Invisible Shield" against the cold. Using hollow-core or hydrophobic polypropylene technology, it traps body heat without the weight or bulk of traditional fleece. Crucially, it is 100% hydrophobic, meaning it mechanically pushes sweat away from the skin instantly, keeping the athlete dry and warm even during stop-start interval training.',
        fabricType: "Seamless Circular Knit",
        weave: "Circular Knit (Seamless)",
        finishTreatment: "Hydrophobic, Brushed Interior",
        keyApplications: ["Base Layers", "Ski Underwear", "Winter Running Tops"],
        weaveTypes: ["1x1 Rib or Jersey"],
        sustainabilityScore: 60,
        certifications: ["Energy Efficient Production"],
        properties: {
          finishTreatments: ["Hydrophobic", "Brushed Interior"],
          stretchPercentage: "150%",
          stretchDirection: ["4-Way"],
          breathability: "Low to Moderate",
          moistureManagement: "Hydrophobic (Zero Absorption)",
          wickingRate: "Extreme",
          dryingTime: "Instant",
          performanceFeatures: ["Hydrophobic", "Thermal Insulation"],
          airPermeability: "Low to Moderate",
          yarnCountConstruction: "70D Textured",
          colorfastness: "Grade 4",
          tensileStrength: "Moderate",
          tearStrength: "20 N",
          abrasionResistance: "20,000",
          pillingGrade: "3",
          shrinkageTolerancePercentage: "1",
          washTemperature: "30",
          endOfLifeOptions: ["Recyclable (Thermoplastic)"],
          recyclabilityNotes:
            "Polypropylene is a pure thermoplastic (Type 5). It can be melted down and recycled indefinitely without significant degradation of properties if collected in a clean stream.",
          useCases: ["Base Layers", "Winter Sports"],
          washCareInstructions: {
            instructions:
              "Wash cool. Dries almost instantly out of the washer. Do not tumble dry (heat damages the fiber structure).",
            careSymbols: [],
            restrictions: [],
          },
          compositions: [
            {
              name: "Polypro-Flex",
              isDefault: true,
              fibers: [
                { fiberId: 47, percentage: "90" },
                { fiberId: 39, percentage: "10" },
              ],
            },
            {
              name: "Eco-Poly Thermal",
              isDefault: false,
              fibers: [
                { fiberId: 44, percentage: "90" },
                { fiberId: 39, percentage: "10" },
              ],
            },
            {
              name: "Pure-Merino",
              isDefault: false,
              fibers: [{ fiberId: 32, percentage: "100" }],
            },
            {
              name: "Merino-Blend",
              isDefault: false,
              fibers: [
                { fiberId: 32, percentage: "50" },
                { fiberId: 34, percentage: "50" },
              ],
            },
            {
              name: "Nylon-Thermal",
              isDefault: false,
              fibers: [
                { fiberId: 41, percentage: "85" },
                { fiberId: 39, percentage: "15" },
              ],
            },
            {
              name: "Poly-Thermal",
              isDefault: false,
              fibers: [
                { fiberId: 35, percentage: "92" },
                { fiberId: 39, percentage: "8" },
              ],
            },
          ],
        },
      })
      .where(eq(fabrics.name, "Thermo-Skin™ Pro"));

    // Fabric 7: Eco-Flex™ Scuba 3.0
    await db
      .update(fabrics)
      .set({
        weight: "0",
        sport: "Surfing",
        marketSegment: "Water Sports",
        seasonality: "All-Season (Water)",
        description:
          'A revolutionary neoprene alternative that redefines water sports performance. We prioritize limestone-derived rubber over crude oil. This material features a micro-cell structure containing 94% nitrogen bubbles, making it 20% lighter and 30% warmer than traditional petroleum wetsuits. It is completely impermeable to water, preventing the "water-logging" heaviness that drags athletes down.',
        fabricType: "Closed-Cell Foam",
        weave: "Laminated Foam",
        finishTreatment: "Smooth-Skin",
        keyApplications: ["Surfing Wetsuits", "Dive Skins", "Tri-Suits"],
        weaveTypes: ["Closed-Cell Sponge + Jersey Knit Face"],
        sustainabilityScore: 85,
        certifications: ["Limestone Based", "PAH Free"],
        properties: {
          finishTreatments: ["Smooth-Skin"],
          stretchPercentage: "400%",
          stretchDirection: ["4-Way"],
          breathability: "N/A",
          moistureManagement: "N/A",
          dryingTime: "Surface Dry Only",
          performanceFeatures: ["Waterproof", "Thermal Insulation"],
          airPermeability: "Zero (Air Impermeable)",
          waterColumn: "Infinite (Waterproof)",
          tearStrength: "High",
          abrasionResistance: "High (Nylon Face)",
          pillingGrade: "4",
          washTemperature: "Cold Rinse Only",
          endOfLifeOptions: ["Downcycling"],
          recyclabilityNotes:
            'Cured rubber cannot be melted down. The primary recycling path is shredding into "crumb rubber" for use in athletic tracks, playground safety surfaces, or padding.',
          useCases: ["Water Sports", "Diving"],
          washCareInstructions: {
            instructions:
              "Rinse with fresh water immediately after every use. Hang dry in the shade (UV damages rubber over time). Do not fold (creases are permanent).",
            careSymbols: [],
            restrictions: [],
          },
          compositions: [
            {
              name: "Limestone-Nylon",
              isDefault: true,
              fibers: [
                { fiberId: 46, percentage: "80" },
                { fiberId: 41, percentage: "20" },
              ],
            },
            {
              name: "Limestone-Eco Poly",
              isDefault: false,
              fibers: [
                { fiberId: 46, percentage: "80" },
                { fiberId: 34, percentage: "20" },
              ],
            },
            {
              name: "Limestone-Thermal",
              isDefault: false,
              fibers: [
                { fiberId: 46, percentage: "80" },
                { fiberId: 43, percentage: "20" },
              ],
            },
            {
              name: "Standard-Petroleum",
              isDefault: false,
              fibers: [
                { fiberId: 45, percentage: "80" },
                { fiberId: 41, percentage: "20" },
              ],
            },
            {
              name: "Limestone-Smooth",
              isDefault: false,
              fibers: [
                { fiberId: 46, percentage: "80" },
                { fiberId: 46, percentage: "20" },
              ],
            },
            {
              name: "Bio-Rubber",
              isDefault: false,
              fibers: [
                { fiberId: 46, percentage: "80" },
                { fiberId: 42, percentage: "20" },
              ],
            },
          ],
        },
      })
      .where(eq(fabrics.name, "Eco-Flex™ Scuba 3.0"));

    // Fabric 8: Velocity™ Diamond Ripstop
    await db
      .update(fabrics)
      .set({
        weight: "85",
        sport: "Running",
        marketSegment: "Performance Woven",
        seasonality: "Spring / Fall",
        description:
          'Featherweight protection for the speed-focused athlete. This woven fabric features a visible "Diamond" reinforcement grid that prevents small tears from spreading. It is engineered to be wind-resistant yet highly breathable, making it the perfect outer layer for running shorts or packable windbreakers. Treated with a DWR finish to shed light rain without sacrificing weight.',
        fabricType: "Woven Ripstop",
        weave: "Woven",
        finishTreatment: "DWR, Cire (Calendering)",
        keyApplications: ["Running Shorts", "Windbreakers", "Track Jackets"],
        weaveTypes: ["Ripstop (Reinforced Grid)"],
        sustainabilityScore: 80,
        certifications: ["Recycled Content", "PFC-Free DWR"],
        properties: {
          finishTreatments: ["DWR", "Cire (Calendering)"],
          stretchPercentage: "0-15%",
          stretchDirection: ["2-Way or 4-Way"],
          breathability: "High",
          moistureManagement: "Hydrophobic",
          wickingRate: "Low",
          dryingTime: "Very Fast",
          performanceFeatures: ["Windproof", "Water Repellent"],
          airPermeability: "Low (Windproof)",
          waterColumn: "Water Repellent",
          yarnCountConstruction: "50D/48F",
          colorfastness: "Grade 4",
          tensileStrength: "Very High",
          tearStrength: "Superior (Ripstop)",
          abrasionResistance: "20,000",
          pillingGrade: "4-5",
          shrinkageTolerancePercentage: "0-1",
          washTemperature: "30",
          endOfLifeOptions: ["Recyclable"],
          recyclabilityNotes:
            "100% Polyester variants are fully recyclable. The DWR finish must be stripped during the chemical recycling process, which is standard in modern facilities.",
          useCases: ["Running", "Cycling"],
          washCareInstructions: {
            instructions:
              "Machine wash cold. Tumble dry low to maintain the water-repellent finish. Do not iron (heat can melt the Cire finish).",
            careSymbols: [],
            restrictions: [],
          },
          compositions: [
            {
              name: "Standard Poly",
              isDefault: true,
              fibers: [{ fiberId: 35, percentage: "100" }],
            },
            {
              name: "Eco-Poly",
              isDefault: false,
              fibers: [{ fiberId: 34, percentage: "100" }],
            },
            {
              name: "Poly-Flex Woven",
              isDefault: false,
              fibers: [
                { fiberId: 35, percentage: "90" },
                { fiberId: 39, percentage: "10" },
              ],
            },
            {
              name: "Eco-Poly Flex Woven",
              isDefault: false,
              fibers: [
                { fiberId: 34, percentage: "90" },
                { fiberId: 40, percentage: "10" },
              ],
            },
            {
              name: "Standard Nylon",
              isDefault: false,
              fibers: [{ fiberId: 41, percentage: "100" }],
            },
            {
              name: "Mechanical Poly",
              isDefault: false,
              fibers: [{ fiberId: 35, percentage: "100" }],
            },
          ],
        },
      })
      .where(eq(fabrics.name, "Velocity™ Diamond Ripstop"));
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

fixAllFabrics();
