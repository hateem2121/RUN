import { expect, test } from "@playwright/test";

test.describe("CustomDropdown Keyboard Accessibility", () => {
  test.use({ storageState: ".auth/user.json" });

  test("should close the dropdown and return focus to the trigger button on Escape", async ({
    page,
  }) => {
    // 1. Navigate to the admin about page
    await page.goto("/admin/about");

    // 2. Wait for page header to be visible and hydration to finish
    await expect(page.getByRole("heading", { name: /About.*Management/i })).toBeVisible({
      timeout: 25000,
    });
    await expect(page.getByText("Loading hero data...")).toBeHidden();

    // 3. Switch to the Locations tab
    await page.getByRole("tab", { name: "Locations" }).click();
    await expect(page.getByText("Loading...", { exact: true })).toBeHidden();
    await expect(page.getByText("Global Presence")).toBeVisible({ timeout: 15000 });

    // 4. Click the Add Location button to open the dialog containing CustomDropdown
    await page.getByRole("button", { name: /Add Location/i }).click();

    // 5. Assert the dialog is open and visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // 6. Find the CustomDropdown trigger button
    // It has the label "Location Type" and default selected option "Manufacturing Facility"
    const trigger = page.locator('button[aria-haspopup="listbox"]').first();
    await expect(trigger).toBeVisible({ timeout: 10000 });

    // 7. Focus the trigger button
    await trigger.focus();
    await expect(trigger).toBeFocused();

    // 8. Press ArrowDown to open the listbox and focus the first option
    await page.keyboard.press("ArrowDown");

    // 9. Assert the listbox is visible and the option is focused
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 10000 });

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
    await page.goto("/admin/about");

    // 2. Wait for page header to be visible and hydration to finish
    await expect(page.getByRole("heading", { name: /About.*Management/i })).toBeVisible({
      timeout: 25000,
    });
    await expect(page.getByText("Loading hero data...")).toBeHidden();

    // 3. Switch to the Locations tab
    await page.getByRole("tab", { name: "Locations" }).click();
    await expect(page.getByText("Loading...", { exact: true })).toBeHidden();
    await expect(page.getByText("Global Presence")).toBeVisible({ timeout: 15000 });

    // 4. Click the Add Location button to open the dialog containing CustomDropdown
    await page.getByRole("button", { name: /Add Location/i }).click();

    // 5. Assert the dialog is open and visible
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    // 6. Find the CustomDropdown trigger button
    const trigger = page.locator('button[aria-haspopup="listbox"]').first();
    await expect(trigger).toBeVisible({ timeout: 10000 });

    // 7. Focus the trigger button
    await trigger.focus();
    await expect(trigger).toBeFocused();

    // 8. Press ArrowDown to open the listbox and focus the first option
    await page.keyboard.press("ArrowDown");

    // 9. Assert the listbox is visible and the option is focused
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 10000 });

    const firstOption = page.getByRole("option", { name: "Manufacturing Facility" });
    await expect(firstOption).toBeFocused();

    // 10. Press Tab to close listbox
    await page.keyboard.press("Tab");

    // 11. Assert listbox is closed and focus returns to the trigger
    await expect(listbox).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
});
