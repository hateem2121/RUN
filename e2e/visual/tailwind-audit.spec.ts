import { expect, test } from "@playwright/test";
import { GOLDEN_ROUTES } from "./golden-routes";

test.describe("Tailwind v4 Visual Regression Audit", () => {
	// Use a fixed viewport for consistent snapshots
	test.use({
		viewport: { width: 1280, height: 800 },
		locale: "en-US",
		timezoneId: "UTC",
		colorScheme: "light", // Force light mode for consistency
	});

	for (const route of GOLDEN_ROUTES) {
		test(`Visual Snapshot: ${route.name}`, async ({ page }) => {
			// 1. Navigate to route
			await page.goto(route.path, { waitUntil: "networkidle" });

			// 2. Wait for hydration/content
			if (route.waitForSelector) {
				await page.waitForSelector(route.waitForSelector);
			}

			// 3. Forced deterministic styles (disable animations/transitions)
			await page.addStyleTag({
				content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            caret-color: transparent !important; 
          }
        `,
			});

			// 4. Wait a bit for any layout shifts
			await page.waitForTimeout(1000);

			// 5. Take full page snapshot
			await expect(page).toHaveScreenshot(`${route.name}-desktop.png`, {
				fullPage: true,
				maxDiffPixelRatio: 0.05, // Tolerate minor font rendering diffs
			});
		});
	}
});
