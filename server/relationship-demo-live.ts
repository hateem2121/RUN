// Live Performance Demonstration: PostgreSQL vs Key-Value Store
// Real-time comparison with your actual data
//
// NOTE: This is a DEMO/BENCHMARK file - not used in production
// Requires: native-postgresql.js module (not included in main codebase)
// To use: Implement native-postgresql.js with performance comparison methods

// import { nativeDB } from './native-postgresql.js';
import { storage } from "./storage.js";

// Demo placeholder - uncomment and implement native-postgresql.js to enable
const nativeDB: any = null;

/**
 * LIVE PERFORMANCE COMPARISON
 * This demonstrates real performance differences with your actual data
 */

export class LivePerformanceDemo {
	async runCompleteDemo() {
		// Test database connectivity first
		const isConnected = await nativeDB.testConnection();

		if (isConnected) {
			await this.runFullComparison();
		} else {
			await this.showKeyValueLimitations();
		}
	}

	private async runFullComparison() {
		// Demo 1: Single Product Retrieval
		await this.demoSingleProductRetrieval();

		// Demo 2: Complex Filtering
		await this.demoComplexFiltering();

		// Demo 3: Data Integrity
		await this.demoDataIntegrity();

		// Demo 4: Bulk Operations
		await this.demoBulkOperations();
	}

	private async demoSingleProductRetrieval() {
		// Get first product ID from your data
		const products = await storage.getProducts();
		if (products.length === 0) {
			return;
		}

		const productId = products[0]?.id;
		const startPG = Date.now();
		const pgProduct = await nativeDB.getProductWithRelationships(productId);
		const pgTime = Date.now() - startPG;

		if (pgProduct) {
		} else {
		}
		const startKV = Date.now();
		let queryCount = 0;

		// Query 1: Get product
		const kvProduct = await storage.getProduct(productId!);
		queryCount++;

		let category = null,
			fabric = null,
			primaryImage = null;

		if (kvProduct) {
			// Query 2: Get category
			if (kvProduct.categoryId) {
				category = await storage.getCategory(kvProduct.categoryId);
				queryCount++;
			}

			// Query 3: Get fabric
			if (kvProduct.fabricId) {
				fabric = await storage.getFabric(kvProduct.fabricId);
				queryCount++;
			}

			// Query 4: Get primary image
			if (kvProduct.primaryImageId) {
				primaryImage = await storage.getMediaAsset(kvProduct.primaryImageId);
				queryCount++;
			}
		}

		const kvTime = Date.now() - startKV;
	}

	private async demoComplexFiltering() {
		const startPG = Date.now();
		const ecoProducts = await nativeDB.getEcoFriendlyProducts("sportswear", 4);
		const pgTime = Date.now() - startPG;
		if (ecoProducts.length > 0) {
		}
		const startKV = Date.now();

		// Get all data separately
		// Get all data separately
		const allProducts = await storage.getProducts();
		const allCategories = await storage.getCategories();

		// Manual filtering
		const sportswearCategory = allCategories.find(
			(c: any) => c.slug === "sportswear",
		);
		let filteredProducts = [];

		if (sportswearCategory) {
			filteredProducts = allProducts.filter(
				(p: any) => p.categoryId === sportswearCategory.id && p.isActive,
			);
		}

		const kvTime = Date.now() - startKV;
	}

	private async demoDataIntegrity() {
		// Test with a category that has products
		const categories = await storage.getCategories();
		const products = await storage.getProducts();

		// Find a category with products
		const categoryWithProducts = categories.find((cat: any) =>
			products.some((p: any) => p.categoryId === cat.id),
		);

		if (categoryWithProducts) {
			const pgResult = await nativeDB.testReferentialIntegrity(
				categoryWithProducts.id,
			);

			if (pgResult.integrity === "protected") {
			} else {
			}
		}
	}

	private async demoBulkOperations() {
		const startPG = Date.now();
		const pgProducts = await nativeDB.getAllProductsWithRelationships();
		const pgTime = Date.now() - startPG;
		const startKV = Date.now();

		const allProducts = await storage.getProducts();
		const allCategories = await storage.getCategories();
		const allFabrics = await storage.getFabrics();
		const allMedia = await storage.getMediaAssets();

		// Manual relationship building (simplified)
		const kvProducts = allProducts.map((product: any) => ({
			...product,
			category: allCategories.find((c: any) => c.id === product.categoryId),
			fabric: allFabrics.find((f: any) => f.id === product.fabricId),
			primaryImage: allMedia.find((m: any) => m.id === product.primaryImageId),
		}));

		const kvTime = Date.now() - startKV;
	}

	private async showKeyValueLimitations() {
		const products = await storage.getProducts();
		const categories = await storage.getCategories();
	}

	// Summary of benefits
	showBenefitsSummary() {}
}

// Export for use in routes or direct execution
export const liveDemo = new LivePerformanceDemo();

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	liveDemo
		.runCompleteDemo()
		.then(() => {
			liveDemo.showBenefitsSummary();
			process.exit(0);
		})
		.catch((error) => {
			process.exit(1);
		});
}
