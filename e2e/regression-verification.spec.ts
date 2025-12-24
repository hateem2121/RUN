import { expect, test } from "@playwright/test";

const routes = [
	"/",
	"/products",
	"/about",
	"/services",
	"/technology",
	"/contact",
	"/resources",
	"/categories",
];

test.describe("UI/UX Regression Verification", () => {
	// 1. Light/Dark Mode Toggle & Persistence
	test("Theme toggle functionality and persistence", async ({ page }) => {
		await page.goto("/");

		// Check initial state (should be system or light default, we assume light for test baseline or check class)
		// Actually, checking if html has class 'dark'
		const isDarkInitially = await page.locator("html").getAttribute("class");

		// Toggle theme
		const toggleBtn = page.locator('button[aria-label="Toggle theme"]');
		await toggleBtn.waitFor({ state: "visible" });
		await toggleBtn.click();
		await page.waitForTimeout(500); // Wait for transition

		const isDarkAfterClick = await page.locator("html").getAttribute("class");
		expect(isDarkAfterClick).not.toBe(isDarkInitially); // Should toggle

		// Reload to check persistence
		await page.reload();
		await page.waitForTimeout(500);
		const isDarkAfterReload = await page.locator("html").getAttribute("class");
		expect(isDarkAfterReload).toBe(isDarkAfterClick);
	});

	// 2. Footer Overlay Bleed Check
	test("Footer should not bleed content", async ({ page }) => {
		// Check a long page like products or contact
		await page.goto("/contact");

		// Scroll to bottom
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await page.waitForTimeout(1000);

		// Ensure footer is visible and not covering content unexpectedly (hard to test exact visual overlap without VRT, but can check interactivity)
		const footer = page.locator("footer");
		await expect(footer).toBeVisible();

		// Check z-index of main content vs footer
		const main = page.locator("main");
		await expect(main).toHaveCSS("z-index", "10");
	});

	// 3. Visual Regression Snapshots (Light & Dark)
	for (const route of routes) {
		test(`Visual Regression - ${route}`, async ({ page }) => {
			// Light Mode
			await page.goto(route);
			await page.evaluate(() => localStorage.setItem("theme", "light")); // Force light
			await page.reload();
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(1000); // Stabilize

			await expect(page).toHaveScreenshot(
				`${route.replace("/", "") || "home"}-light.png`,
				{
					fullPage: true,
				},
			);

			// Dark Mode
			await page.evaluate(() => localStorage.setItem("theme", "dark")); // Force dark
			await page.reload();
			await page.waitForLoadState("networkidle");
			await page.waitForTimeout(1000); // Stabilize

			await expect(page).toHaveScreenshot(
				`${route.replace("/", "") || "home"}-dark.png`,
				{
					fullPage: true,
				},
			);
		});
	}

	// 4. Element Specific Checks (Borders, Focus)
	test("UI Component Checks (Borders & Focus)", async ({ page }) => {
		await page.goto("/products");

		// Check card border
		const card = page.locator(".rounded-lg.border").first();
		if ((await card.count()) > 0) {
			await expect(card).toHaveCSS("border-style", "solid");
			// We can't easily check 'variable' usage via CSS value in puppeteer/playwright without computed style parsing,
			// but existence of border class and visual check is good.
		}

		// Check Button Focus
		await page.goto("/contact");
		const input = page.locator("input").first();
		await input.focus();
		await expect(input).toHaveCSS("outline-style", "none"); // Tailwind 'outline-none' often maps to visible ring shadow, not actual outline property.
		// Tailwind 'ring' uses box-shadow.
		// Wait, we moved to outline-hidden which is outline: none.
		// And we added ring-2.

		// Let's screenshot the focused element to verify 'ring' visibility visually
		await expect(input).toHaveScreenshot("input-focus.png");
	});
});
