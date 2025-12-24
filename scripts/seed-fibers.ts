import { db } from "../server/db.js";
import { fibers } from "../shared/schema.js";

const fibersData = [
	{
		name: "Virgin Polyester (Standard Performance)",
		type: "Synthetic (Petroleum-Based)",
		sustainabilityScore: 1,
		description:
			"The industrial standard for athletic apparel. Engineered from purified terephthalic acid (PTA), this fiber offers the legendary durability and wrinkle resistance that defined the modern sportswear era. It provides a sharper price point than rPET while maintaining identical moisture management and tensile strength profiles. Ideally suited for high-volume promotional runs or budget-tier team kits.",
		environmentalImpact:
			"High energy consumption in production and non-biodegradable. However, it remains highly durable, preventing early garment disposal.",
		properties: {
			"Moisture Wicking": "Excellent (Hydrophobic)",
			Durability: "High (Resists abrasion)",
			Colorfastness: "Grade 5 (Sublimation Ready)",
		},
		isActive: true,
	},
	{
		name: "Recycled Polyester (rPET)",
		type: "Synthetic (Recycled Polymer)",
		sustainabilityScore: 5,
		description:
			'The cornerstone of our "Uncompromising Sustainability" pillar. Sourced from post-consumer plastic bottles (PET), this fiber is mechanically recycled and extruded into high-performance yarns. It mimics virgin polyester\'s properties perfectly—you cannot feel the difference—making it the responsible choice for brands aiming for carbon neutrality by 2030.',
		environmentalImpact:
			"Diverts waste from landfills and requires up to 50% less energy to produce. Fully GRS Certified.",
		properties: {
			"Moisture Wicking": "Excellent (Hydrophobic)",
			Durability: "Very High",
			Consistency: "Matches Virgin Poly standards",
		},
		isActive: true,
	},
	{
		name: "Conventional Cotton (Carded/Combed)",
		type: "Natural (Cellulose)",
		sustainabilityScore: 2,
		description:
			'The traditional choice for "Casual Wear" and promo basics. We utilize high-grade combed cotton to ensure a smooth surface for screen printing. While it lacks the organic certification, it offers the classic, breathable comfort associated with heritage sportswear. It is the volume driver for corporate events and entry-level merchandise.',
		environmentalImpact:
			"A natural, biodegradable fiber, but conventionally grown with standard water usage and crop protection methods.",
		properties: {
			Breathability: "High",
			Absorbency: "High (Hydrophilic)",
			"Cost-Efficiency": "Excellent",
		},
		isActive: true,
	},
	{
		name: "Organic Cotton (GOTS)",
		type: "Natural (Cellulose)",
		sustainabilityScore: 5,
		description:
			'The soul of our premium "Casual Wear". Grown without toxic pesticides or synthetic fertilizers, this fiber protects the farmer and the soil. It offers a noticeably softer "hand-feel" than conventional cotton, appealing to partners seeking "Authentic brand storytelling".',
		environmentalImpact:
			"Strictly GOTS Certified. Rain-fed cultivation reduces water consumption significantly and eliminates chemical runoff.",
		properties: {
			Breathability: "Superior",
			"Hand-Feel": "Ultra-Soft / Premium",
			Hypoallergenic: "Yes",
		},
		isActive: true,
	},
	{
		name: "Standard Elastane (Spandex/Lycra)",
		type: "Synthetic (Petroleum-based)",
		sustainabilityScore: 2,
		description:
			'The essential ingredient for "Active Wear". This is the industry-standard power-stretch fiber. It provides the necessary "snap-back" recovery for leggings and compression gear. Without it, performance wear would simply be a plastic bag. We use high-modulus variants to ensure garments don\'t bag out after 10 washes.',
		environmentalImpact:
			"Standard production requires significant energy. It is difficult to recycle once blended, necessitating responsible end-of-life planning.",
		properties: {
			Elongation: "500-600%",
			Recovery: "98% (Memory)",
			Compression: "High",
		},
		isActive: true,
	},
	{
		name: "Eco-Smart Elastane (Recycled Content)",
		type: "Synthetic (Recycled Blend)",
		sustainabilityScore: 4,
		description:
			'The future of fit. This innovative elastomer incorporates up to 50% pre-consumer recycled content (industrial waste) without compromising the "Power Stretch" capabilities. It allows our partners to claim a "Full Sustainable Blend" (e.g., Recycled Poly + Recycled Elastane) rather than having to asterisk the stretch component.',
		environmentalImpact:
			"Reduces reliability on virgin petroleum feedstock. GRS Certified for the recycled portion.",
		properties: {
			Elongation: "400-500%",
			Recovery: "95%",
			Durability: "Matches Virgin Elastane",
		},
		isActive: true,
	},
	{
		name: "Virgin Nylon 6 (Polyamide)",
		type: "Synthetic (Polyamide)",
		sustainabilityScore: 1,
		description:
			'Known as the "Tough Guy" of synthetics. Used in our "Outer Wear" and "Sports Accessories" (like bags or reinforced panels). Virgin Nylon offers superior abrasion resistance compared to polyester. It has a cooler, silkier touch, making it a favorite for seamless yoga wear, though at a higher carbon cost than poly.',
		environmentalImpact:
			"High energy intensity in production. Not biodegradable.",
		properties: {
			"Abrasion Resistance": "Extreme",
			Touch: "Cool & Silky",
			"Tensile Strength": "Superior",
		},
		isActive: true,
	},
	{
		name: "Recycled Nylon (pre-consumer)",
		type: "Synthetic (Recycled Polyamide)",
		sustainabilityScore: 5,
		description:
			'A miracle of engineering. This fiber is regenerated from waste (such as industrial fishing nets and fabric scraps). It depolymerizes the waste back into its building blocks, creating a "brand new" nylon yarn that is indistinguishable from virgin nylon. It is the perfect story for our "Wetsuit Edition" and ocean-conscious partners.',
		environmentalImpact:
			"Cleans up ocean waste and industrial landfills. Reduces the global warming impact of nylon by up to 90%.",
		properties: {
			"Abrasion Resistance": "Extreme (Identical to Virgin)",
			Touch: "Cool & Silky",
			Purity: "100% Regenerated",
		},
		isActive: true,
	},
	{
		name: "Standard Micro-Fleece",
		type: "Synthetic (Polyester)",
		sustainabilityScore: 1,
		description:
			"The cost-effective solution for warmth. A brushed polyester knit that traps air for insulation. It is lightweight, hydrophobic (doesn't hold water like wool), and dries rapidly. Ideal for sideline bench jackets and mass-market winter training gear where budget is the primary driver.",
		environmentalImpact:
			"Sheds microfibers during washing; we recommend washing bags. Sourced from standard petrochemicals.",
		properties: {
			Insulation: "High",
			Weight: "Lightweight",
			Pilling: "Standard Grade 3",
		},
		isActive: true,
	},
	{
		name: "Recycled Performance Fleece",
		type: "Synthetic (Recycled Construction)",
		sustainabilityScore: 5,
		description:
			'Warmth without waste. This fleece takes the rPET chip and engineers it into a high-loft thermal fabric. By using longer staple fibers in the yarn spinning process, we significantly reduce shedding (micro-plastic release) compared to standard fleece, while delivering the same thermal efficiency for our "Outer Wear".',
		environmentalImpact:
			"100% Recycled Content. Supports the circular economy by creating demand for waste plastic.",
		properties: {
			Insulation: "High",
			Shedding: "Reduced (Low-Shed Tech)",
			Pilling: "Grade 4 (Anti-Pill Finish)",
		},
		isActive: true,
	},
	{
		name: "Standard Neoprene (Petroleum)",
		type: "Synthetic Rubber (Polychloroprene)",
		sustainabilityScore: 1,
		description:
			"The historic standard for wetsuits. Derived from oil, this rubber offers the classic durability and heavy-duty insulation required for cold-water diving. It is the accessible choice for dive schools and rental fleets needing rugged, affordable gear.",
		environmentalImpact:
			"High carbon footprint extraction and processing. Non-biodegradable.",
		properties: {
			Insulation: "Good",
			Durability: "High (Resists compression)",
			Cost: "Moderate",
		},
		isActive: true,
	},
	{
		name: "Eco-Limestone Neoprene",
		type: "Mineral-Based Polymer",
		sustainabilityScore: 3,
		description:
			'The "Premium" upgrade for our Wetsuit Edition. We replace the oil base with limestone (calcium carbonate). This creates a cell structure that is 98% water impermeable (warmer) and significantly lighter/stretchier than petroleum neoprene. It is the choice for pro-surfers and eco-conscious dive brands.',
		environmentalImpact:
			"Lower carbon footprint than oil. Limestone reserves are vast (est. 3 billion years supply), though it is still an extractive resource.",
		properties: {
			Insulation: "Superior (Warmer)",
			Weight: "Lightweight",
			Stretch: "Superior Elongation",
		},
		isActive: true,
	},
	{
		name: "Polypropylene (Olefin)",
		type: "Synthetic (Thermoplastic Polymer)",
		sustainabilityScore: 2,
		description:
			'The "Secret Weapon" of thermal base layers. Polypropylene is the lightest textile fiber in existence (lighter than water) and has the lowest thermal conductivity, meaning it retains body heat better than any other synthetic. It is 100% hydrophobic—it cannot absorb moisture—making it the ultimate choice for "next-to-skin" winter layers where keeping dry is a safety requirement.',
		environmentalImpact:
			"Low energy impact during production and fully recyclable (Grade 5 plastic), though rarely recycled in municipal systems.",
		properties: {
			"Moisture Wicking": "Extreme (Zero Absorption)",
			Weight: "Ultra-Light (Specific Gravity 0.91)",
			"Thermal Retention": "Superior",
		},
		isActive: true,
	},
	{
		name: "Performance Hemp",
		type: "Natural (Bast Fiber)",
		sustainabilityScore: 5,
		description:
			'The "Iron Man" of natural fibers. Hemp is 4x stronger than cotton and naturally antimicrobial. Historically rough, modern processing allows us to blend it with organic cotton or recycled polyester to create a fabric that is incredibly durable yet breathable. It is trending heavily in the "Outdoor Adventure" and "Lifestyle" sectors for its rugged, earthy aesthetic and ability to soften with every wash.',
		environmentalImpact:
			'A "Super-Crop" that regenerates soil, requires zero pesticides, and uses significantly less water than cotton. It is carbon-negative in cultivation.',
		properties: {
			Antimicrobial: "Natural / High",
			Durability: "Extreme (Tensile strength)",
			Breathability: "Excellent (Porous fiber)",
		},
		isActive: true,
	},
	{
		name: "MicroModal (Beechwood)",
		type: "Regenerated Cellulosic",
		sustainabilityScore: 4,
		description:
			'The definition of "Second Skin." Sourced from sustainably harvested beechwood trees, MicroModal is finer than silk and significantly softer than cotton. It is the gold standard for premium "Lounge-Active" wear and luxury underwear. Unlike cotton, it resists mineral deposits from hard water, meaning it stays soft through repeated wash cycles without stiffening.',
		environmentalImpact:
			"Produced in a closed-loop ozone bleaching process. Biodegradable and compostable at end-of-life.",
		properties: {
			"Hand-Feel": "Silky / Premium",
			"Moisture Management": "50% more absorbent than cotton",
			Elasticity: "Moderate",
		},
		isActive: true,
	},
	{
		name: "Graphene-Infused Polyester",
		type: "Smart-Synthetic Composite",
		sustainabilityScore: 3,
		description:
			'The frontier of material science. We coat or infuse standard polyester yarns with Graphene—a material consisting of a single layer of carbon atoms. This transforms a standard fabric into a "Smart Fabric" that naturally conducts heat (cooling the body in summer) and retains far-infrared radiation (warming the body in winter). It is also bacteriostatic and anti-static.',
		environmentalImpact:
			'Extends the functionality of the garment, potentially reducing the need for multiple layers ("buy less, buy better"), though the graphene production process is energy-intensive.',
		properties: {
			"Thermo-Regulation": "Dynamic (Adaptive cooling/warming)",
			"Tensile Strength": "Enhanced",
			"Anti-Odor": "Permanent (Non-chemical)",
		},
		isActive: true,
	},
];

async function seedFibers() {
	try {
		const inserted = await db.insert(fibers).values(fibersData).returning();
		inserted.forEach((fiber) => {});
		process.exit(0);
	} catch (error) {
		process.exit(1);
	}
}

await seedFibers();
