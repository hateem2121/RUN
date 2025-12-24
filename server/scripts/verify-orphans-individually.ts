import { execSync } from "child_process";
import fs from "fs";

interface OrphanFile {
	path: string;
	status: string;
	reason: string;
	size?: number;
}

interface VerificationResult {
	path: string;
	isOrphaned: boolean;
	importCount: number;
	importedBy: string[];
	evidence: string;
	recommendation: "SAFE_TO_REMOVE" | "FALSE_POSITIVE" | "NEEDS_REVIEW";
}

async function verifyOrphansIndividually() {
	// Read categorized results
	const categorized = JSON.parse(
		fs.readFileSync("server/docs/orphaned-files-categorized.json", "utf-8"),
	);

	const highConfidenceFiles: OrphanFile[] =
		categorized.true_orphans_high_confidence;
	const results: VerificationResult[] = [];

	for (const file of highConfidenceFiles) {
		// Extract filename without extension for search
		const filename =
			file.path
				.split("/")
				.pop()
				?.replace(/\.(tsx?|jsx?)$/, "") || "";
		const filenameWithExt = file.path.split("/").pop() || "";

		// Build comprehensive search patterns
		const patterns = [
			filename, // Exact filename match
			filenameWithExt, // Filename with extension
			file.path
				.replace("client/src/", "")
				.replace(/\.(tsx?|jsx?)$/, ""), // Relative path without extension
			`@/${file.path.replace(/\.(tsx?|jsx?)$/, "")}`, // Alias import
			`"${file.path}"`, // String literal reference
			`'${file.path}'`, // String literal reference (single quotes)
		];

		let totalImports = 0;
		const importedBy: string[] = [];

		// Search for each pattern
		for (const pattern of patterns) {
			try {
				// Escape special regex characters for grep
				const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

				// Search in client/src (excluding the file itself)
				const grepCmd = `cd /home/runner/workspace && grep -r "${escapedPattern}" client/src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "${file.path}" || true`;
				const output = execSync(grepCmd, { encoding: "utf-8" }).trim();

				if (output) {
					const lines = output.split("\n").filter(Boolean);
					lines.forEach((line) => {
						const filePath = line.split(":")[0]!;
						if (!importedBy.includes(filePath!)) {
							importedBy.push(filePath);
							totalImports++;
						}
					});
				}
			} catch (error) {
				// Ignore grep errors (no matches)
			}
		}

		// Check if file is exported from index.ts (barrel export pattern)
		const dirPath = file.path.substring(0, file.path.lastIndexOf("/"));
		const indexPath = `client/src/${dirPath}/index.ts`;
		if (fs.existsSync(indexPath)) {
			const indexContent = fs.readFileSync(indexPath, "utf-8");
			if (indexContent.includes(filename)) {
				// Search for imports of the parent directory
				const dirName = dirPath.split("/").pop();
				try {
					const parentImportCmd = `cd /home/runner/workspace && grep -r "from.*${dirName}" client/src --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "${dirPath}" || true`;
					const parentOutput = execSync(parentImportCmd, {
						encoding: "utf-8",
					}).trim();

					if (parentOutput) {
						const lines = parentOutput.split("\n").filter(Boolean);
						lines.forEach((line) => {
							const filePath = line.split(":")[0]!;
							if (!importedBy.includes(filePath)) {
								importedBy.push(`${filePath} (via index.ts barrel export)`);
								totalImports++;
							}
						});
					}
				} catch (error) {
					// Ignore
				}
			}
		}

		// Determine recommendation
		let recommendation: "SAFE_TO_REMOVE" | "FALSE_POSITIVE" | "NEEDS_REVIEW";
		let evidence: string;

		if (totalImports === 0) {
			recommendation = "SAFE_TO_REMOVE";
			evidence =
				"No imports found via comprehensive grep search (checked filename, path, aliases, string literals)";
		} else {
			recommendation = "FALSE_POSITIVE";
			evidence = `Found ${totalImports} import(s): ${importedBy.slice(0, 3).join(", ")}${importedBy.length > 3 ? ` and ${importedBy.length - 3} more` : ""}`;
		}

		results.push({
			path: file.path,
			isOrphaned: totalImports === 0,
			importCount: totalImports,
			importedBy: importedBy.slice(0, 10), // Store max 10 examples
			evidence,
			recommendation,
		});
	}

	// Categorize results
	const safeToRemove = results.filter(
		(r) => r.recommendation === "SAFE_TO_REMOVE",
	);
	const falsePositives = results.filter(
		(r) => r.recommendation === "FALSE_POSITIVE",
	);

	// Export results
	fs.writeFileSync(
		"server/docs/orphans-verification-evidence.json",
		JSON.stringify(
			{
				verified: results,
				summary: {
					total: results.length,
					safe_to_remove: safeToRemove.length,
					false_positives: falsePositives.length,
				},
				safe_to_remove: safeToRemove.map((r) => r.path),
				false_positives: falsePositives,
			},
			null,
			2,
		),
	);

	if (falsePositives.length > 0) {
		falsePositives.forEach((fp) => {});
	}

	return results;
}

// Run verification
verifyOrphansIndividually()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		process.exit(1);
	});
