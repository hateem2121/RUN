#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

interface OrphanedFile {
	path: string;
	size: number;
	lines: number;
	lastModified: string;
	reason: string;
}

interface FalsePositive {
	path: string;
	imported_by: string[];
}

interface TrueOrphan {
	path: string;
	size: number;
	reason: string;
}

interface NeedsReview {
	path: string;
	concern: string;
}

interface AnalysisResult {
	false_positives: FalsePositive[];
	true_orphans: TrueOrphan[];
	needs_review: NeedsReview[];
	stats: {
		total_csv: number;
		total_files_scanned: number;
		false_positives: number;
		true_orphans: number;
		needs_review: number;
	};
}

interface ImportInfo {
	importedPath: string;
	importingFile: string;
	importType: "standard" | "dynamic" | "lazy" | "require";
}

class OrphanedFilesAnalyzer {
	private projectRoot: string;
	private clientSrcRoot: string;
	private serverRoot: string;
	private allImports: Map<string, ImportInfo[]> = new Map();
	private allFiles: Set<string> = new Set();

	// Path aliases mapping
	private pathAliases: Record<string, string> = {
		"@/": "client/src/",
		"@": "client/src",
		"@shared": "shared",
		"@server": "server",
	};

	constructor() {
		// ES module compatible way to get current directory
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		this.projectRoot = path.resolve(__dirname, "../..");
		this.clientSrcRoot = path.join(this.projectRoot, "client/src");
		this.serverRoot = path.join(this.projectRoot, "server");
	}

	/**
	 * Main analysis function
	 */
	async analyze(): Promise<void> {
		await this.scanAllFiles();
		await this.parseAllImports();
		const csvFiles = await this.loadCSV();
		const results = await this.categorizeFiles(csvFiles);
		await this.exportResults(results);

		// Step 6: Print summary
		this.printSummary(results);
	}

	/**
	 * Recursively scan all TypeScript/JavaScript files
	 */
	private async scanAllFiles(): Promise<void> {
		const scanDirectory = (dir: string) => {
			if (!fs.existsSync(dir)) return;

			const entries = fs.readdirSync(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);

				// Skip node_modules, .git, dist, build, etc.
				if (
					entry.name === "node_modules" ||
					entry.name === ".git" ||
					entry.name === "dist" ||
					entry.name === "build" ||
					entry.name === "attached_assets"
				) {
					continue;
				}

				if (entry.isDirectory()) {
					scanDirectory(fullPath);
				} else if (entry.isFile()) {
					// Include .ts, .tsx, .js, .jsx files
					if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
						const relativePath = path.relative(this.projectRoot, fullPath);
						this.allFiles.add(relativePath);
					}
				}
			}
		};

		scanDirectory(this.clientSrcRoot);
		scanDirectory(this.serverRoot);
		scanDirectory(path.join(this.projectRoot, "shared"));
	}

	/**
	 * Parse all imports from all files
	 */
	private async parseAllImports(): Promise<void> {
		for (const file of this.allFiles) {
			const fullPath = path.join(this.projectRoot, file);

			try {
				const content = fs.readFileSync(fullPath, "utf-8");
				const imports = this.extractImports(content, file);

				for (const imp of imports) {
					const normalizedPath = this.normalizeImportPath(
						imp.importedPath,
						file,
					);

					if (normalizedPath) {
						if (!this.allImports.has(normalizedPath)) {
							this.allImports.set(normalizedPath, []);
						}
						this.allImports.get(normalizedPath)!.push(imp);
					}
				}
			} catch (error) {}
		}
	}

	/**
	 * Extract all import statements from file content
	 */
	private extractImports(content: string, sourceFile: string): ImportInfo[] {
		const imports: ImportInfo[] = [];

		// Pattern 1: Standard imports - import ... from "..."
		const standardImportRegex =
			/import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
		let match;
		while ((match = standardImportRegex.exec(content)) !== null) {
			imports.push({
				importedPath: match[1]!,
				importingFile: sourceFile,
				importType: "standard",
			});
		}

		// Pattern 2: Dynamic imports - import("...")
		const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
		while ((match = dynamicImportRegex.exec(content)) !== null) {
			imports.push({
				importedPath: match[1]!,
				importingFile: sourceFile,
				importType: "dynamic",
			});
		}

		// Pattern 3: React.lazy - lazy(() => import("..."))
		const lazyImportRegex =
			/lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
		while ((match = lazyImportRegex.exec(content)) !== null) {
			imports.push({
				importedPath: match[1]!,
				importingFile: sourceFile,
				importType: "lazy",
			});
		}

		// Pattern 4: Require statements - require("...")
		const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
		while ((match = requireRegex.exec(content)) !== null) {
			imports.push({
				importedPath: match[1]!,
				importingFile: sourceFile,
				importType: "require",
			});
		}

		return imports;
	}

	/**
	 * Normalize import path to match file system paths
	 */
	private normalizeImportPath(
		importPath: string,
		sourceFile: string,
	): string | null {
		// Skip external packages (not starting with . or @ or /)
		if (
			!importPath.startsWith(".") &&
			!importPath.startsWith("@") &&
			!importPath.startsWith("/")
		) {
			return null;
		}

		let resolvedPath = importPath;

		// Handle path aliases
		for (const [alias, realPath] of Object.entries(this.pathAliases)) {
			if (importPath.startsWith(alias)) {
				resolvedPath = importPath.replace(alias, realPath);
				break;
			}
		}

		// Handle relative imports
		if (resolvedPath.startsWith(".")) {
			const sourceDir = path.dirname(sourceFile);
			resolvedPath = path.join(sourceDir, resolvedPath);
		}

		// Normalize path
		resolvedPath = path.normalize(resolvedPath);

		// Try to resolve with common extensions
		const possibleExtensions = [
			"",
			".ts",
			".tsx",
			".js",
			".jsx",
			"/index.ts",
			"/index.tsx",
			"/index.js",
		];

		for (const ext of possibleExtensions) {
			const testPath = resolvedPath + ext;
			if (this.allFiles.has(testPath)) {
				return testPath;
			}
		}

		// If no exact match, try to find a file that matches
		for (const file of this.allFiles) {
			if (file.includes(resolvedPath) || resolvedPath.includes(file)) {
				return file;
			}
		}

		return null;
	}

	/**
	 * Load orphaned files from CSV
	 */
	private async loadCSV(): Promise<OrphanedFile[]> {
		const csvPath = path.join(
			this.projectRoot,
			"server/docs/orphaned-files.csv",
		);
		const content = fs.readFileSync(csvPath, "utf-8");
		const lines = content.split("\n").slice(1); // Skip header

		const files: OrphanedFile[] = [];

		for (const line of lines) {
			if (!line.trim()) continue;

			const parts = line.split(",");
			if (parts.length >= 5) {
				files.push({
					path: parts[0]!,
					size: parseInt(parts[1]!, 10),
					lines: parseInt(parts[2]!, 10),
					lastModified: parts[3]!,
					reason: parts[4]!,
				});
			}
		}

		return files;
	}

	/**
	 * Categorize files into false positives, true orphans, and needs review
	 */
	private async categorizeFiles(
		csvFiles: OrphanedFile[],
	): Promise<AnalysisResult> {
		const falsePositives: FalsePositive[] = [];
		const trueOrphans: TrueOrphan[] = [];
		const needsReview: NeedsReview[] = [];

		for (const csvFile of csvFiles) {
			// Normalize CSV path to match file system structure
			const normalizedPath = this.normalizeCsvPath(csvFile.path);

			// Check if this file is imported anywhere
			const importers = this.allImports.get(normalizedPath);

			if (importers && importers.length > 0) {
				// FALSE POSITIVE: CSV claims it's orphaned but it IS imported
				falsePositives.push({
					path: csvFile.path,
					imported_by: importers.map(
						(imp) => `${imp.importingFile} (${imp.importType})`,
					),
				});
			} else {
				// Check if file exists
				const fullPath = path.join(this.projectRoot, normalizedPath);

				if (!fs.existsSync(fullPath)) {
					// File doesn't exist - needs review
					needsReview.push({
						path: csvFile.path,
						concern: "File does not exist in filesystem",
					});
				} else {
					// Check if it's a special type that might have indirect usage
					// const fileName = path.basename(normalizedPath);
					const isTypeDeclaration = normalizedPath.endsWith(".d.ts");
					const isTestFile =
						normalizedPath.includes(".test.") ||
						normalizedPath.includes("/test/");
					const isScriptFile = normalizedPath.includes("/scripts/");
					const isMiddleware = normalizedPath.includes("/middleware/");
					const isRoute = normalizedPath.includes("/routes/");

					if (isTypeDeclaration) {
						needsReview.push({
							path: csvFile.path,
							concern:
								"Type declaration file - may be used without explicit imports",
						});
					} else if (isTestFile) {
						needsReview.push({
							path: csvFile.path,
							concern: "Test file - may be executed directly",
						});
					} else if (isScriptFile) {
						needsReview.push({
							path: csvFile.path,
							concern:
								"Script file - may be executed directly via npm scripts or CLI",
						});
					} else if (isMiddleware || isRoute) {
						needsReview.push({
							path: csvFile.path,
							concern:
								"Middleware/Route file - may be registered dynamically or in a way not detected by static analysis",
						});
					} else {
						// TRUE ORPHAN: Not imported and no special concerns
						trueOrphans.push({
							path: csvFile.path,
							size: csvFile.size,
							reason: "Never imported anywhere in the codebase",
						});
					}
				}
			}
		}

		return {
			false_positives: falsePositives,
			true_orphans: trueOrphans,
			needs_review: needsReview,
			stats: {
				total_csv: csvFiles.length,
				total_files_scanned: this.allFiles.size,
				false_positives: falsePositives.length,
				true_orphans: trueOrphans.length,
				needs_review: needsReview.length,
			},
		};
	}

	/**
	 * Normalize CSV path to match file system structure
	 */
	private normalizeCsvPath(csvPath: string): string {
		// CSV paths are relative to client/src
		if (
			csvPath.startsWith("components/") ||
			csvPath.startsWith("pages/") ||
			csvPath.startsWith("hooks/") ||
			csvPath.startsWith("lib/") ||
			csvPath.startsWith("utils/")
		) {
			return `client/src/${csvPath}`;
		}

		// Server-side files
		if (
			csvPath.startsWith("routes/") ||
			csvPath.startsWith("middleware/") ||
			csvPath.startsWith("scripts/") ||
			csvPath.startsWith("test/") ||
			csvPath.startsWith("types/") ||
			csvPath.endsWith("migration-service.ts") ||
			csvPath.endsWith("relationship-demo-live.ts") ||
			csvPath.endsWith("relationship-queries.ts")
		) {
			return `server/${csvPath}`;
		}

		return csvPath;
	}

	/**
	 * Export results to JSON file
	 */
	private async exportResults(results: AnalysisResult): Promise<void> {
		const outputPath = path.join(
			this.projectRoot,
			"server/docs/orphaned-files-verified.json",
		);
		fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), "utf-8");
	}

	/**
	 * Print summary to console
	 */
	private printSummary(results: AnalysisResult): void {
		if (results.false_positives.length > 0) {
			results.false_positives.slice(0, 10).forEach((fp) => {
				if (fp.imported_by.length > 3) {
				}
			});
			if (results.false_positives.length > 10) {
			}
		}

		if (results.true_orphans.length > 0) {
			results.true_orphans.slice(0, 15).forEach((orphan) => {});
			if (results.true_orphans.length > 15) {
			}
		}

		if (results.needs_review.length > 0) {
			results.needs_review.slice(0, 10).forEach((review) => {});
			if (results.needs_review.length > 10) {
			}
		}
	}
}

// Run the analyzer
const analyzer = new OrphanedFilesAnalyzer();
analyzer.analyze().catch((error) => {
	process.exit(1);
});
