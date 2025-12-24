import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
	getComponentForPath,
	routeManifest,
} from "../../shared/route-manifest";

describe("Route Manifest", () => {
	const PROJECT_ROOT = path.resolve(__dirname, "../../client");

	it("should map to existing files on disk", () => {
		Object.entries(routeManifest).forEach(([route, componentPath]) => {
			const fullPath = path.join(PROJECT_ROOT, componentPath);
			const exists = fs.existsSync(fullPath);
			expect(exists).toBe(true);
		});
	});

	it("should resolve fuzzy routes correctly", () => {
		// Exact match
		expect(getComponentForPath("/")).toBe("src/pages/homepage.tsx");

		// Fuzzy match for categories
		expect(getComponentForPath("/categories/running")).toBe(
			"src/pages/enhanced-product-detail.tsx",
		);

		// Unknown route
		expect(getComponentForPath("/unknown-route")).toBeUndefined();
	});
});
