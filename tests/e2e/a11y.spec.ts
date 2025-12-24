import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Accessibility (A11y)", () => {
	test("Homepage should have no automatically detectable a11y violations", async ({
		page,
	}) => {
		await page.goto("/");

		// Inject axe-core and run analysis
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("Products page should have no automatically detectable a11y violations", async ({
		page,
	}) => {
		await page.goto("/products");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("About page should have no automatically detectable a11y violations", async ({
		page,
	}) => {
		await page.goto("/about");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});
});
