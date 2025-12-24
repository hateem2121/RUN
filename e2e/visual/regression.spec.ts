import { test } from "@playwright/test";
import { expectVisualMatch } from "../helpers/visual-test";

/**
 * Visual Regression Safeguards v2
 * High-governance snapshots with stabilization helpers.
 */

const ROUTES = [
	{ name: "homepage", path: "/" },
	{ name: "visual-contracts", path: "/visual-contracts" },
	{ name: "services", path: "/services" },
	{ name: "manufacturing", path: "/manufacturing" },
	{ name: "e2e-overlay", path: "/e2e-overlay" },
];

test.describe("Visual Regression Safeguards", () => {
	for (const route of ROUTES) {
		test(`Snapshot: ${route.name}`, async ({ page }) => {
			await page.goto(route.path, { waitUntil: "networkidle" });

			// Use the shared stabilization helper
			await expectVisualMatch(page, `${route.name}-desktop`);
		});
	}
});
