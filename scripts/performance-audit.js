#!/usr/bin/env node

/**
 * Performance Optimization: Week 3 - Automated Performance Audit Script
 * Comprehensive performance analysis tool for RUN APPAREL homepage
 */

const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

class PerformanceAuditor {
	constructor() {
		this.results = {
			timestamp: new Date().toISOString(),
			bundleAnalysis: {},
			recommendations: [],
			score: 0,
		};
	}

	async runAudit() {
		try {
			await this.analyzeBundleSize();
			await this.analyzeDependencies();
			await this.checkLazyLoading();
			await this.analyzeAssets();
			this.calculateScore();
			this.generateReport();
		} catch (error) {
			process.exit(1);
		}
	}

	async analyzeBundleSize() {
		const distPath = path.join(process.cwd(), "dist");
		if (!fs.existsSync(distPath)) {
			return;
		}

		const assets = this.getAssetSizes(distPath);
		this.results.bundleAnalysis = assets;

		// Analyze bundle composition
		const jsSize = assets.js?.reduce((sum, file) => sum + file.size, 0) || 0;
		const cssSize = assets.css?.reduce((sum, file) => sum + file.size, 0) || 0;
		const totalSize = jsSize + cssSize;

		// Add recommendations based on size
		if (totalSize > 2 * 1024 * 1024) {
			this.results.recommendations.push(
				"Bundle size exceeds 2MB - implement code splitting",
			);
		}
		if (jsSize > 1 * 1024 * 1024) {
			this.results.recommendations.push(
				"JavaScript bundle is large - lazy load non-critical components",
			);
		}
		if (cssSize > 500 * 1024) {
			this.results.recommendations.push(
				"CSS bundle is large - consider purging unused styles",
			);
		}
	}

	getAssetSizes(dir, basePath = "") {
		const assets = { js: [], css: [], other: [] };

		const items = fs.readdirSync(dir);

		for (const item of items) {
			const fullPath = path.join(dir, item);
			const relativePath = path.join(basePath, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				const subAssets = this.getAssetSizes(fullPath, relativePath);
				assets.js.push(...subAssets.js);
				assets.css.push(...subAssets.css);
				assets.other.push(...subAssets.other);
			} else {
				const ext = path.extname(item);
				const fileInfo = {
					name: relativePath,
					size: stat.size,
					gzippedSize: this.estimateGzippedSize(stat.size, ext),
				};

				if (ext === ".js") {
					assets.js.push(fileInfo);
				} else if (ext === ".css") {
					assets.css.push(fileInfo);
				} else {
					assets.other.push(fileInfo);
				}
			}
		}

		return assets;
	}

	estimateGzippedSize(size, ext) {
		const compressionRatios = {
			".js": 0.35,
			".css": 0.25,
			".html": 0.3,
			".json": 0.2,
			".svg": 0.3,
		};

		return Math.round(size * (compressionRatios[ext] || 0.6));
	}

	async analyzeDependencies() {
		const packagePath = path.join(process.cwd(), "package.json");
		if (!fs.existsSync(packagePath)) {
			return;
		}

		const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
		const deps = {
			...packageJson.dependencies,
			...packageJson.devDependencies,
		};

		// Analyze heavy dependencies
		const heavyDeps = [
			"three",
			"@react-three/fiber",
			"@react-three/drei",
			"gsap",
			"framer-motion",
			"locomotive-scroll",
		];

		const foundHeavyDeps = heavyDeps.filter((dep) => deps[dep]);

		foundHeavyDeps.forEach((dep) => {});

		// Recommendations for heavy dependencies
		if (foundHeavyDeps.includes("three")) {
			this.results.recommendations.push(
				"Three.js found - ensure 3D components are lazy loaded",
			);
		}
		if (foundHeavyDeps.includes("gsap")) {
			this.results.recommendations.push(
				"GSAP found - lazy load for non-critical animations",
			);
		}
		if (foundHeavyDeps.includes("locomotive-scroll")) {
			this.results.recommendations.push(
				"Locomotive Scroll found - lazy load for non-critical pages",
			);
		}
	}

	async checkLazyLoading() {
		const srcPath = path.join(process.cwd(), "client", "src");
		const lazyComponents = this.findLazyComponents(srcPath);

		lazyComponents.forEach((component) => {});

		// Check for potential lazy loading opportunities
		const componentFiles = this.findComponentFiles(srcPath);
		const nonLazyComponents = componentFiles.filter(
			(file) =>
				!lazyComponents.some((lazy) => file.includes(lazy)) &&
				!file.includes("App.tsx") &&
				!file.includes("index.tsx"),
		);

		if (nonLazyComponents.length > 10) {
			this.results.recommendations.push(
				`${nonLazyComponents.length} components could be lazy loaded`,
			);
		}
	}

	findLazyComponents(dir, found = []) {
		const items = fs.readdirSync(dir);

		for (const item of items) {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory() && item !== "node_modules") {
				this.findLazyComponents(fullPath, found);
			} else if (item.endsWith(".tsx") || item.endsWith(".ts")) {
				const content = fs.readFileSync(fullPath, "utf8");
				if (content.includes("lazy(") || content.includes("React.lazy")) {
					found.push(path.relative(process.cwd(), fullPath));
				}
			}
		}

		return found;
	}

	findComponentFiles(dir, found = []) {
		const items = fs.readdirSync(dir);

		for (const item of items) {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory() && item !== "node_modules") {
				this.findComponentFiles(fullPath, found);
			} else if (
				item.endsWith(".tsx") &&
				!item.includes(".test.") &&
				!item.includes(".spec.")
			) {
				found.push(path.relative(process.cwd(), fullPath));
			}
		}

		return found;
	}

	async analyzeAssets() {
		const publicPath = path.join(process.cwd(), "public");
		if (!fs.existsSync(publicPath)) {
			return;
		}

		const assets = this.getStaticAssets(publicPath);
		const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);

		// Find large assets
		const largeAssets = assets.filter((asset) => asset.size > 500 * 1024); // 500KB
		if (largeAssets.length > 0) {
			largeAssets.forEach((asset) => {});
			this.results.recommendations.push(
				`${largeAssets.length} large assets found - consider optimization`,
			);
		}

		// Check for unoptimized images
		const images = assets.filter((asset) =>
			asset.name.match(/\.(jpg|jpeg|png|gif|bmp)$/i),
		);

		if (images.length > 0) {
			const largeImages = images.filter((img) => img.size > 200 * 1024); // 200KB
			if (largeImages.length > 0) {
				this.results.recommendations.push(
					`${largeImages.length} large images found - consider WebP format and compression`,
				);
			}
		}
	}

	getStaticAssets(dir, basePath = "", assets = []) {
		const items = fs.readdirSync(dir);

		for (const item of items) {
			const fullPath = path.join(dir, item);
			const relativePath = path.join(basePath, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				this.getStaticAssets(fullPath, relativePath, assets);
			} else {
				assets.push({
					name: relativePath,
					size: stat.size,
				});
			}
		}

		return assets;
	}

	calculateScore() {
		let score = 100;

		// Deduct points based on bundle size
		const { bundleAnalysis } = this.results;
		const jsSize =
			bundleAnalysis.js?.reduce((sum, file) => sum + file.size, 0) || 0;
		const cssSize =
			bundleAnalysis.css?.reduce((sum, file) => sum + file.size, 0) || 0;
		const totalSize = jsSize + cssSize;

		if (totalSize > 2 * 1024 * 1024)
			score -= 30; // 2MB
		else if (totalSize > 1 * 1024 * 1024)
			score -= 20; // 1MB
		else if (totalSize > 500 * 1024) score -= 10; // 500KB

		// Deduct points for recommendations
		score -= this.results.recommendations.length * 5;

		this.results.score = Math.max(0, score);
	}

	generateReport() {
		const report = `
🚀 RUN APPAREL Performance Audit Report
=======================================
Generated: ${this.results.timestamp}

Overall Score: ${this.results.score}/100 ${this.getScoreEmoji()}

Bundle Analysis:
${this.formatBundleAnalysis()}

Recommendations:
${this.formatRecommendations()}

Performance Targets:
✅ First Contentful Paint: < 2s
✅ Largest Contentful Paint: < 2.5s  
✅ First Input Delay: < 100ms
✅ Cumulative Layout Shift: < 0.1
✅ Total Bundle Size: < 1MB (gzipped)

Next Steps:
1. Implement code splitting for large components
2. Add lazy loading for below-the-fold content
3. Optimize images with WebP format
4. Monitor Core Web Vitals in production
5. Set up performance budgets

Generated by RUN APPAREL Performance Auditor
    `.trim();

		// Save report to file
		const reportPath = path.join(process.cwd(), "performance-audit-report.txt");
		fs.writeFileSync(reportPath, report);
	}

	getScoreEmoji() {
		const { score } = this.results;
		if (score >= 90) return "🟢 Excellent";
		if (score >= 70) return "🟡 Good";
		if (score >= 50) return "🟠 Needs Improvement";
		return "🔴 Poor";
	}

	formatBundleAnalysis() {
		const { bundleAnalysis } = this.results;
		if (!bundleAnalysis.js && !bundleAnalysis.css) {
			return "⚠️  No build artifacts found - run `npm run build` first";
		}

		let output = "";

		if (bundleAnalysis.js) {
			const jsSize = bundleAnalysis.js.reduce(
				(sum, file) => sum + file.size,
				0,
			);
			output += `JavaScript: ${this.formatSize(jsSize)} (${bundleAnalysis.js.length} files)\n`;
		}

		if (bundleAnalysis.css) {
			const cssSize = bundleAnalysis.css.reduce(
				(sum, file) => sum + file.size,
				0,
			);
			output += `CSS: ${this.formatSize(cssSize)} (${bundleAnalysis.css.length} files)\n`;
		}

		return output;
	}

	formatRecommendations() {
		if (this.results.recommendations.length === 0) {
			return "🎉 No recommendations - your bundle is well optimized!";
		}

		return this.results.recommendations
			.map((rec, index) => `${index + 1}. ${rec}`)
			.join("\n");
	}

	formatSize(bytes) {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / k ** i).toFixed(1)) + " " + sizes[i];
	}
}

// Run the audit
if (require.main === module) {
	const auditor = new PerformanceAuditor();
	auditor.runAudit();
}

module.exports = PerformanceAuditor;
