import { expect, test } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:5002";

test.describe("CustomDropdown Keyboard Accessibility", () => {
  test.use({ storageState: ".auth/user.json" });

  test("should close the dropdown and return focus to the trigger button on Escape", async ({
    page,
  }) => {
    // 1. Navigate to the admin about page
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
    page.on("requestfailed", (req) =>
      console.log("REQUEST FAILED:", req.url(), req.failure()?.errorText),
    );

    await page.goto(`${BASE_URL}/admin/about`);

    // 2. Wait for page header to be visible and hydration to finish
    await expect(page.getByRole("heading", { name: /About page Management/i })).toBeVisible();
    await expect(page.getByText("Loading hero data...")).toBeHidden();

    // 3. Switch to the Locations tab
    await page.getByRole("tab", { name: "Locations" }).click();
    await expect(page.getByText("Loading...", { exact: true })).toBeHidden();
    await expect(page.getByText("Global Presence")).toBeVisible();

    // 4. Click the Add Location button to open the dialog containing CustomDropdown
    await page.getByRole("button", { name: /Add Location/i }).click();

    // 5. Assert the dialog is open and visible
    await expect(page.getByRole("dialog")).toBeVisible();

    // 6. Find the CustomDropdown trigger button
    // It has the label "Location Type" and default selected option "Manufacturing Facility"
    const trigger = page.locator('button[aria-haspopup="listbox"]').first();
    await expect(trigger).toBeVisible();

    // 7. Focus the trigger button
    await trigger.focus();
    await expect(trigger).toBeFocused();

    // 8. Press ArrowDown to open the listbox and focus the first option
    await page.keyboard.press("ArrowDown");

    // 9. Assert the listbox is visible and the option is focused
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    const firstOption = page.getByRole("option", { name: "Manufacturing Facility" });
    await expect(firstOption).toBeFocused();

    // 10. Press Escape to close listbox
    await page.keyboard.press("Escape");

    // 11. Assert listbox is closed and focus returns to the trigger
    await expect(listbox).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("should close the dropdown and return focus to the trigger button on Tab", async ({
    page,
  }) => {
    // 1. Navigate to the admin about page
    await page.goto(`${BASE_URL}/admin/about`);

    // 2. Wait for page header to be visible and hydration to finish
    await expect(page.getByRole("heading", { name: /About page Management/i })).toBeVisible();
    await expect(page.getByText("Loading hero data...")).toBeHidden();

    // 3. Switch to the Locations tab
    await page.getByRole("tab", { name: "Locations" }).click();
    await expect(page.getByText("Loading...", { exact: true })).toBeHidden();
    await expect(page.getByText("Global Presence")).toBeVisible();

    // 4. Click the Add Location button to open the dialog containing CustomDropdown
    await page.getByRole("button", { name: /Add Location/i }).click();

    // 5. Assert the dialog is open and visible
    await expect(page.getByRole("dialog")).toBeVisible();

    // 6. Find the CustomDropdown trigger button
    const trigger = page.locator('button[aria-haspopup="listbox"]').first();
    await expect(trigger).toBeVisible();

    // 7. Focus the trigger button
    await trigger.focus();
    await expect(trigger).toBeFocused();

    // 8. Press ArrowDown to open the listbox and focus the first option
    await page.keyboard.press("ArrowDown");

    // 9. Assert the listbox is visible and the option is focused
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();

    const firstOption = page.getByRole("option", { name: "Manufacturing Facility" });
    await expect(firstOption).toBeFocused();

    // 10. Press Tab to close listbox
    await page.keyboard.press("Tab");

    // 11. Assert listbox is closed and focus returns to the trigger
    await expect(listbox).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
});
