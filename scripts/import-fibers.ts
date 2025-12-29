import { storage } from "../server/storage.js";
import type { InsertFiber } from "../shared/schema.js";

const fiberData = [
  {
    name: "Polyester",
    type: "Synthetic (Petroleum-based)",
    description:
      "Polyester revolutionized the sportswear industry as the world's most widely used synthetic fiber, derived from petroleum through a complex polymerization process. This thermoplastic polymer creates incredibly versatile fabric that has become the backbone of modern athletic wear, transforming how athletes experience comfort and performance during intense physical activities.",
    properties: {
      "Moisture-wicking":
        "Superior moisture-wicking properties that draw sweat away from skin and allow rapid evaporation",
      Durability: "Exceptional durability and resistance to stretching, shrinking, and wrinkling",
      "Cost-effectiveness":
        "Cost-effective manufacturing makes it an affordable option without compromising performance",
      "Quick-drying":
        "Quick-drying capabilities that keep athletes comfortable during extended workouts",
      "Color retention":
        "Color retention excellence that maintains vibrancy even after multiple washes",
      Lightweight: "Lightweight construction that doesn't add bulk to athletic garments",
    },
    sustainabilityScore: 2,
    environmentalImpactNotes:
      "Traditional polyester production carries significant environmental concerns as it relies heavily on non-renewable petroleum resources and generates substantial carbon emissions during manufacturing. The fiber's non-biodegradable nature means polyester garments can persist in landfills for hundreds of years, contributing to textile waste accumulation. However, the industry is evolving with innovations in chemical recycling and bio-based alternatives that promise to reduce polyester's environmental footprint while maintaining its performance advantages.",
    isActive: true,
  },
  {
    name: "Recycled Polyester (rPET)",
    type: "Synthetic (Recycled)",
    description:
      "Recycled polyester represents a groundbreaking approach to sustainable sportswear manufacturing, transforming discarded plastic bottles and textile waste into high-performance athletic fabrics. This innovative material is made from recycled plastic bottles, giving new life to materials that would otherwise pollute our environment while delivering the same moisture-wicking and durability benefits as virgin polyester.",
    properties: {
      Performance:
        "Identical performance characteristics to virgin polyester including moisture management",
      "Energy efficiency":
        "Reduces energy consumption by 30-50% and carbon emissions by 60% compared to virgin polyester",
      Durability: "Maintains excellent durability and color retention properties",
      "Waste reduction":
        "Diverts plastic waste from landfills and oceans into functional sportswear",
      "Manufacturing compatibility":
        "Compatible with existing textile manufacturing processes and equipment",
      "Quick-drying":
        "Offers the same quick-drying and wrinkle-resistant benefits as traditional polyester",
    },
    sustainabilityScore: 4,
    environmentalImpactNotes:
      "Recycled polyester significantly reduces environmental impact with 30-50% lower energy consumption and 60% fewer carbon emissions compared to virgin polyester production. This circular approach diverts millions of plastic bottles from landfills and oceans annually, though the recycling process still requires energy and chemical processing. The main challenge lies in microplastic shedding during washing, but ongoing research focuses on developing filtration systems and fiber modifications to minimize this impact.",
    isActive: true,
  },
  {
    name: "Nylon",
    type: "Synthetic (Petroleum-based)",
    description:
      "Nylon stands as one of the strongest synthetic fibers ever created, originally developed as a silk substitute but now dominating high-performance sportswear applications. This incredibly stretchy, quick-drying, and mildew-resistant fabric is breathable and allows cool air to reach the skin while wicking sweat away, making it indispensable for demanding athletic activities requiring exceptional durability and flexibility.",
    properties: {
      Stretchability: "Exceptional stretchability and elasticity that moves with the body",
      "Quick-drying": "Superior quick-drying capabilities and mildew resistance",
      Strength: "Outstanding strength and durability that enhances sportswear lifespan",
      Breathability:
        "Excellent breathability that promotes air circulation and temperature regulation",
      "Abrasion resistance":
        "Abrasion resistance that withstands intense physical activity and frequent washing",
      Texture: "Smooth texture that prevents chafing during extended wear",
    },
    sustainabilityScore: 2,
    environmentalImpactNotes:
      "Nylon production involves energy-intensive processes and petroleum-based raw materials, contributing to significant carbon emissions and environmental degradation. The manufacturing process releases nitrous oxide, a potent greenhouse gas, and requires substantial water resources. However, regenerated nylon (made from fishing nets and textile waste) offers a more sustainable alternative, though it still faces challenges with microplastic pollution and end-of-life disposal.",
    isActive: true,
  },
  {
    name: "Spandex (Elastane/Lycra)",
    type: "Synthetic (Polyurethane-based)",
    description:
      "Spandex revolutionized athletic wear by providing unprecedented stretch and recovery properties that allow garments to move seamlessly with the human body. This stretchable fabric is used across various athletic applications including yoga pants, jerseys, athleisure, activewear, dancewear, and compression garments, enabling the form-fitting designs that enhance both performance and comfort in modern sportswear.",
    properties: {
      Elasticity: "Exceptional elasticity with ability to stretch up to 600% of original length",
      Recovery:
        "Superior recovery properties that return fabric to original shape after stretching",
      Versatility:
        "Versatile application across multiple sportswear categories from compression wear to swimwear",
      Lightweight: "Lightweight construction that doesn't add bulk to garments",
      "Chemical resistance":
        "Chemical resistance that maintains performance through multiple wash cycles",
      Texture: "Smooth texture that reduces friction and prevents skin irritation",
    },
    sustainabilityScore: 1,
    environmentalImpactNotes:
      "Spandex production relies heavily on petroleum-based chemicals and energy-intensive manufacturing processes, resulting in significant carbon emissions and environmental pollution. The fiber's synthetic nature means it doesn't biodegrade naturally, contributing to long-term textile waste accumulation. Additionally, spandex garments are difficult to recycle due to their complex chemical composition and are often blended with other fibers, making separation and processing challenging for circular economy initiatives.",
    isActive: true,
  },
  {
    name: "Cotton",
    type: "Natural (Plant-based)",
    description:
      "Cotton remains one of the world's most beloved natural fibers, prized for its softness, breathability, and comfort in casual sportswear applications. While traditional cotton absorbs moisture rather than wicking it away, modern cotton blends and treatments have enhanced its performance characteristics, making it suitable for low-intensity activities and lifestyle athletic wear where comfort and natural feel take precedence over high-performance moisture management.",
    properties: {
      Breathability: "Natural breathability that allows air circulation and temperature regulation",
      "Moisture absorption":
        "Absorbs moisture but retains it within the fabric rather than wicking it away",
      Comfort: "Soft, comfortable texture that feels natural against the skin",
      Hypoallergenic:
        "Hypoallergenic properties that reduce risk of skin irritation and allergic reactions",
      Durability: "Durability that improves with proper care and washing",
      "Dye absorption": "Excellent dye absorption that produces vibrant, long-lasting colors",
    },
    sustainabilityScore: 3,
    environmentalImpactNotes:
      "Conventional cotton cultivation presents significant environmental challenges, requiring substantial water resources (approximately 2,700 liters per t-shirt) and extensive pesticide use that can contaminate soil and water systems. However, organic cotton production eliminates synthetic pesticides and fertilizers, reducing environmental impact by up to 88% in water pollution and 62% in energy consumption. The natural biodegradability of cotton fibers makes it environmentally superior to synthetic alternatives at end-of-life, though sustainable farming practices remain crucial for minimizing overall environmental impact.",
    isActive: true,
  },
  {
    name: "Merino Wool",
    type: "Natural (Animal-based)",
    description:
      "Merino wool represents the pinnacle of natural performance fibers, harvested from Merino sheep and renowned for its exceptional temperature regulation, odor resistance, and moisture management properties. For sportswear applications, merino wool is often blended with synthetic or cellulose fibers to improve drying time and moisture management while maintaining durability, creating garments that perform exceptionally in both hot and cold conditions.",
    properties: {
      "Temperature regulation":
        "Natural temperature regulation that keeps body comfortable in various climates",
      "Moisture management":
        "Enhanced moisture management when blended with synthetic fibers for improved drying time",
      "Odor resistance": "Outstanding odor resistance due to natural antimicrobial properties",
      Comfort: "Soft, non-itchy texture that provides superior comfort against skin",
      "UV protection": "Natural UV protection that shields skin from harmful sun exposure",
      Biodegradability: "Biodegradable composition that breaks down naturally at end-of-life",
    },
    sustainabilityScore: 4,
    environmentalImpactNotes:
      "Wool is increasingly recognized as an eco-friendly alternative to synthetic fabrics due to its renewable, biodegradable nature and carbon-sequestering properties of sheep farming. However, methane emissions from sheep farming and land use concerns require careful management through regenerative agriculture practices. Responsible merino wool production focuses on animal welfare, sustainable grazing practices, and ecosystem restoration, making it one of the most environmentally conscious fiber choices when sourced from certified sustainable farms.",
    isActive: true,
  },
  {
    name: "Bamboo Fiber",
    type: "Semi-synthetic (Plant-based)",
    description:
      "Bamboo fiber emerges as a revolutionary sustainable alternative in sportswear manufacturing, created from one of the world's fastest-growing plants that requires no pesticides, fertilizers, or irrigation. The transformation of bamboo into textile fiber involves processing the plant cellulose into a soft, silky material that combines the best of natural comfort with enhanced performance characteristics ideal for athletic applications.",
    properties: {
      Antimicrobial: "Natural antimicrobial properties that prevent odor-causing bacteria growth",
      "Moisture-wicking":
        "Superior moisture-wicking capabilities that keep skin dry during intense activities",
      Softness: "Exceptional softness and smooth texture that prevents chafing and irritation",
      "UV protection": "Natural UV protection that shields skin from harmful ultraviolet radiation",
      Thermoregulation: "Thermoregulating properties that adapt to body temperature changes",
      Biodegradability:
        "Biodegradable composition that breaks down naturally without environmental harm",
    },
    sustainabilityScore: 4,
    environmentalImpactNotes:
      "Bamboo is a plant that doesn't require many pesticides and grows rapidly without depleting soil nutrients, making it an environmentally superior raw material choice. Bamboo cultivation actually improves soil health and sequesters more carbon than traditional crops, contributing to climate change mitigation. However, the chemical processing required to transform bamboo into textile fiber can involve harsh chemicals, though closed-loop production systems are increasingly being adopted to minimize environmental impact and chemical waste.",
    isActive: true,
  },
  {
    name: "TENCEL™ Lyocell",
    type: "Semi-synthetic (Wood-based)",
    description:
      "TENCEL™ Lyocell represents breakthrough innovation in sustainable fiber technology, created from responsibly sourced wood through an environmentally conscious closed-loop production process. This natural fiber offers flattering drape and is soft, luxurious, breathable, naturally wrinkle-resistant, and environmentally sustainable, making it increasingly popular in high-performance sportswear applications where comfort and sustainability are paramount.",
    properties: {
      Softness: "Exceptional softness and luxurious feel with natural drape characteristics",
      Breathability: "Outstanding breathability and natural wrinkle resistance",
      "Moisture management": "Superior moisture absorption and quick-drying capabilities",
      Antimicrobial: "Natural antimicrobial properties that prevent odor development",
      Durability:
        "Excellent durability with long-lasting quality that withstands multiple wash cycles",
      "Friction reduction": "Smooth surface that reduces friction and prevents skin irritation",
    },
    sustainabilityScore: 5,
    environmentalImpactNotes:
      "TENCEL™ production involves a closed-loop process that recycles more than 99% of the solvent used in manufacturing while using less water and energy than conventional cotton production. TENCEL™ Lyocell fibers are made with at least 50% less carbon emissions and water consumption compared to conventional fibers, and are made from guaranteed sustainability harvested trees. The fiber is completely biodegradable and compostable, breaking down naturally without leaving harmful residues in the environment.",
    isActive: true,
  },
  {
    name: "TENCEL™ Modal",
    type: "Semi-synthetic (Wood-based)",
    description:
      "TENCEL™ Modal represents advanced sustainable fiber technology engineered specifically for enhanced durability and performance in demanding applications. Clothes made with TENCEL™ Modal can withstand more washes and dry cycles than cotton, making it ideal for sportswear that requires frequent laundering while maintaining shape, color, and performance characteristics throughout extended use.",
    properties: {
      Durability: "Superior durability that withstands more washes and dry cycles than cotton",
      "Color retention":
        "Exceptional color retention that maintains vibrancy after multiple wash cycles",
      "Moisture management": "Outstanding moisture absorption with quick-drying capabilities",
      Softness: "Incredibly soft texture that provides luxury comfort during athletic activities",
      Breathability:
        "Natural breathability that promotes air circulation and temperature regulation",
      "Wrinkle resistance": "Wrinkle resistance that maintains garment appearance without ironing",
    },
    sustainabilityScore: 5,
    environmentalImpactNotes:
      "TENCEL™ Modal has a significantly lower environmental impact than generic modal due to its advanced closed-loop production system and sustainable forestry practices. The manufacturing process recycles virtually all chemicals and solvents, minimizing waste and environmental contamination. Made from certified sustainable wood sources, TENCEL™ Modal contributes to responsible forest management while providing a completely biodegradable alternative to synthetic fibers.",
    isActive: true,
  },
  {
    name: "Hemp Fiber",
    type: "Natural (Plant-based)",
    description:
      "Hemp fiber emerges as one of the most sustainable and durable natural fibers available for sportswear manufacturing, cultivated from the Cannabis sativa plant without requiring pesticides, herbicides, or excessive water. Hemp is recognized as one of the best sustainable fabrics in sportswear, offering flexible, moisture-wicking, and sustainably sourced alternatives that improve with each wash while maintaining exceptional durability.",
    properties: {
      Flexibility:
        "Excellent flexibility and moisture-wicking capabilities suitable for athletic applications",
      Durability: "Outstanding durability that increases with washing and wear",
      Antimicrobial: "Natural antimicrobial properties that prevent odor development",
      "UV protection": "UV protection that shields skin from harmful ultraviolet radiation",
      Breathability:
        "Breathable structure that promotes air circulation and temperature regulation",
      Biodegradability:
        "Biodegradable composition that decomposes naturally without environmental harm",
    },
    sustainabilityScore: 5,
    environmentalImpactNotes:
      "Hemp cultivation requires minimal water, no pesticides, and actually improves soil health through natural nitrogen fixation and deep root systems that prevent soil erosion. The plant grows rapidly and sequesters significant amounts of carbon dioxide, contributing to climate change mitigation. Hemp processing requires minimal chemicals compared to other natural fibers, and the entire plant can be utilized with zero waste. At end-of-life, hemp fibers decompose completely, returning nutrients to the soil without leaving harmful residues.",
    isActive: true,
  },
  {
    name: "Recycled Wool",
    type: "Natural (Recycled Animal-based)",
    description:
      "Recycled wool represents sustainable innovation in natural fiber utilization, created by mechanically breaking down existing wool garments and textiles into new fibers suitable for sportswear applications. This sustainable option diverts used wool garments from landfills while saving considerable amounts of water, reducing land use for sheep grazing, and avoiding chemicals for dyeing.",
    properties: {
      "Temperature regulation": "Natural temperature regulation and insulation properties",
      "Moisture-wicking":
        "Excellent moisture-wicking capabilities enhanced through modern processing techniques",
      Comfort: "Soft, comfortable texture that improves with proper care",
      "Odor resistance": "Natural odor resistance due to wool's inherent antimicrobial properties",
      Durability: "Durable construction that maintains shape and performance over time",
      Biodegradability: "Biodegradable composition that breaks down naturally at end-of-life",
    },
    sustainabilityScore: 5,
    environmentalImpactNotes:
      "Recycled wool contributes to significant reduction of air, water, and soil pollution while diverting waste from landfills. The recycling process eliminates the need for new sheep farming, reducing methane emissions, land use, and water consumption associated with virgin wool production. By avoiding new dyeing processes, recycled wool prevents chemical pollution and water contamination, making it one of the most environmentally responsible fiber choices available for sustainable sportswear manufacturing.",
    isActive: true,
  },
];

async function importFibers() {
  try {
    // Check if fibers already exist to avoid duplicates
    const existingFibers = await storage.getFibers();

    let _importedCount = 0;
    let _skippedCount = 0;

    for (const fiber of fiberData) {
      // Check if fiber already exists by name
      const existingFiber = existingFibers.find(
        (f) => f.name.toLowerCase() === fiber.name.toLowerCase(),
      );

      if (existingFiber) {
        _skippedCount++;
        continue;
      }

      // Create new fiber
      const _newFiber = await storage.createFiber(fiber as InsertFiber);
      _importedCount++;
    }
  } catch (_error) {}
}

// Run the import
importFibers();
