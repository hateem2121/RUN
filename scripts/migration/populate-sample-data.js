// Script to populate sample data for size charts and accessories
async function populateSampleData() {
	const baseUrl = "http://localhost:5000";

	// Sample Size Charts
	const sizeCharts = [
		{
			name: "Men's Standard (XS-3XL)",
			measurements: {
				XS: { chest: "32-34", waist: "26-28", hip: "32-34" },
				S: { chest: "34-36", waist: "28-30", hip: "34-36" },
				M: { chest: "38-40", waist: "32-34", hip: "38-40" },
				L: { chest: "42-44", waist: "36-38", hip: "42-44" },
				XL: { chest: "46-48", waist: "40-42", hip: "46-48" },
				"2XL": { chest: "50-52", waist: "44-46", hip: "50-52" },
				"3XL": { chest: "54-56", waist: "48-50", hip: "54-56" },
			},
			description: "Standard men's athletic wear sizing",
			isActive: true,
		},
		{
			name: "Women's Standard (XS-3XL)",
			measurements: {
				XS: { chest: "30-32", waist: "24-26", hip: "34-36" },
				S: { chest: "32-34", waist: "26-28", hip: "36-38" },
				M: { chest: "34-36", waist: "28-30", hip: "38-40" },
				L: { chest: "36-38", waist: "30-32", hip: "40-42" },
				XL: { chest: "38-40", waist: "32-34", hip: "42-44" },
				"2XL": { chest: "40-42", waist: "34-36", hip: "44-46" },
				"3XL": { chest: "42-44", waist: "36-38", hip: "46-48" },
			},
			description: "Standard women's athletic wear sizing",
			isActive: true,
		},
		{
			name: "Youth Sizing (XS-XL)",
			measurements: {
				XS: { chest: "26-28", age: "6-8" },
				S: { chest: "28-30", age: "8-10" },
				M: { chest: "30-32", age: "10-12" },
				L: { chest: "32-34", age: "12-14" },
				XL: { chest: "34-36", age: "14-16" },
			},
			description: "Youth athletic wear sizing",
			isActive: true,
		},
		{
			name: "International Conversion",
			measurements: {
				US: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
				EU: ["44", "46", "48-50", "52-54", "56-58", "60-62", "64-66"],
				UK: ["34", "36", "38-40", "42-44", "46-48", "50-52", "54-56"],
			},
			description: "International size conversion chart",
			isActive: true,
		},
	];

	// Sample Accessories
	const accessories = [
		{
			name: "YKK Performance Zipper",
			type: "zipper",
			description: "High-quality water-resistant zipper for athletic jackets",
			placement: ["front", "pockets"],
			isActive: true,
		},
		{
			name: "3M Reflective Strip",
			type: "safety",
			description: "High-visibility reflective material for night training",
			placement: ["back", "sleeves", "legs"],
			isActive: true,
		},
		{
			name: "Velcro Patch Area",
			type: "customization",
			description: "Hook and loop patch area for team logos or badges",
			placement: ["chest", "shoulder", "back"],
			isActive: true,
		},
		{
			name: "Mesh Ventilation Panels",
			type: "performance",
			description: "Strategic mesh inserts for enhanced breathability",
			placement: ["underarm", "back", "sides"],
			isActive: true,
		},
		{
			name: "Silicone Gripper Hem",
			type: "functional",
			description: "Anti-slip silicone band to keep garment in place",
			placement: ["waist", "cuffs", "hem"],
			isActive: true,
		},
		{
			name: "TPU Logo Badge",
			type: "branding",
			description: "Thermoplastic polyurethane logo application",
			placement: ["chest", "sleeve"],
			isActive: true,
		},
		{
			name: "Drawcord with Toggle",
			type: "adjustment",
			description: "Adjustable drawstring with secure toggle lock",
			placement: ["hood", "waist", "hem"],
			isActive: true,
		},
		{
			name: "Thumbholes",
			type: "comfort",
			description: "Built-in thumb loops for extended sleeve coverage",
			placement: ["cuffs"],
			isActive: true,
		},
	];
	for (const chart of sizeCharts) {
		try {
			const response = await fetch(`${baseUrl}/api/size-charts`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(chart),
			});
			const result = await response.json();
		} catch (error) {}
	}
	for (const accessory of accessories) {
		try {
			const response = await fetch(`${baseUrl}/api/accessories`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(accessory),
			});
			const result = await response.json();
		} catch (error) {}
	}
}

// Run the script
populateSampleData().catch(console.error);
