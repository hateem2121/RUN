import { expect, test } from "@playwright/test";

test.describe("UI/UX Regression Guardrails", () => {
	test("Homepage loads without FOUC and Hydration Errors", async ({ page }) => {
		// 1. Monitor console for hydration errors
		const consoleErrors: string[] = [];
		page.on("console", (msg) => {
			const text = msg.text();
			// Filter for React hydration/rendering errors
			if (
				msg.type() === "error" ||
				text.includes("Hydration") ||
				text.includes("Minified React error") ||
				text.includes("Text content does not match")
			) {
				consoleErrors.push(text);
			}
		});

		// 2. Load Homepage
		// Assuming baseURL is set in playwright.config.ts, otherwise relative to that.
		await page.goto("/");

		// 3. Assert Javascript has executed and we have an interactive app
		await expect(page.locator("body")).toBeVisible();

		// 4. Assert Critical CSS is present in head (Vite Manifest Injection Guardrail)
		// We expect at least one link rel=stylesheet injected by our SSR handler
		const cssLinks = await page.locator('head link[rel="stylesheet"]');
		// Soft assertion for link presence
		await expect(cssLinks.first()).toBeAttached();

		// 5. Assert COMPUTED Styles (Tailwind Application) - Proof of CSS loading
		// "bg-background" class should map to a specific color (e.g. oklch/white)
		// Since we don't know the exact token value easily, we check if variable is defined?
		//  test("Homepage & Nested Route Hydration", async ({ page }) => {
		// 1. Visit Homepage
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		// Homepage Checks
		const h1 = page.locator("h1").first(); // Target first H1 (Hero)
		await expect(h1).toHaveCSS("font-family", /Neue Stance/);

		// Check for Critical CSS (any stylesheet loaded)
		const cssLinksCount = await page.evaluate(
			() => document.querySelectorAll('link[rel="stylesheet"]').length,
		);
		expect(cssLinksCount).toBeGreaterThan(0);

		// 2. Visit Nested Route (/about) to verify SSR Routing
		await page.goto("/about");
		await page.waitForLoadState("networkidle");
		const aboutHeader = page.getByRole("heading", { level: 1 }).first();
		await expect(aboutHeader).toBeVisible(); // Just ensure it renders

		// 6. Assert No Hydration Errors
		// Filter out known/benign errors if any
		const realErrors = consoleErrors.filter(
			(e) =>
				!e.includes("[HMR]") &&
				!e.includes("Future React versions") &&
				!e.includes("Warning: ") && // React warnings
				!e.includes("was not found in the map") && // Sourcemap warnings
				!e.includes("Failed to load resource"), // Network/Resource errors (not hydration)
		);
		expect(
			realErrors,
			`Hydration errors detected: ${JSON.stringify(realErrors)}`,
		).toHaveLength(0);
	});
});
