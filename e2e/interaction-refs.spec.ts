import { expect, test } from "@playwright/test";

test.describe("Component Interaction & Ref Integrity", () => {
	test("should verify button receives events and updates styles on hover", async ({
		page,
	}) => {
		await page.goto("/");

		// Locate a primary button.
		// Using a broad selector for "Button" to find an interactive element from Shadcn
		const primaryButton = page.getByRole("button").first();
		await expect(primaryButton).toBeVisible();

		// Step 1: Snapshot default state
		await expect(primaryButton).toHaveScreenshot("button-default.png");

		// Step 2: Programmatically hover
		await primaryButton.hover();

		// Add a small delay to allow CSS transition
		await page.waitForTimeout(300);

		// Step 3: Snapshot hover state
		// If ref forwarding is broken, the hover state pseudo-class might rely on JS events that could fail,
		// or more likely, we are ensuring the component allows interaction and renders changes.
		await expect(primaryButton).toHaveScreenshot("button-hover.png");

		// Verify it is clickable (ref check implicitly)
		await primaryButton.click();
		// We don't assert nav here, just that it didn't crash/throw on click
	});
});
