import { expect, test, type Page } from "@playwright/test";
import { signIn } from "./helpers";

/** Opens the quick-log sheet from the centre button. */
async function openSheet(page: Page) {
  await page.getByRole("button", { name: "Record something" }).first().click();
  await expect(page.getByRole("dialog", { name: "Record something" })).toBeVisible();
}

test.describe("recording an experience", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("two taps logs a known skill", async ({ page }) => {
    await openSheet(page);

    const sheet = page.getByRole("dialog", { name: "Record something" });
    await sheet.getByRole("button", { name: "Japanese" }).click();

    // Durations only appear once a skill is chosen, so the first tap is never
    // ambiguous.
    await expect(sheet.getByRole("button", { name: "1h", exact: true })).toBeVisible();
    await sheet.getByRole("button", { name: "1h", exact: true }).click();

    // Sheet closes and the quiet confirmation appears — no blocking dialog.
    await expect(sheet).toBeHidden();
    await expect(page.getByText(/Recorded — 1h of Japanese/)).toBeVisible();
  });

  test("chat extracts a draft and only saves once confirmed", async ({ page }) => {
    await openSheet(page);
    const sheet = page.getByRole("dialog", { name: "Record something" });

    await sheet.getByRole("button", { name: "Describe it" }).click();
    await sheet
      .getByPlaceholder(/Japanese class/)
      .fill("Went to Japanese class for 90 minutes today");
    await sheet.getByRole("button", { name: "Record this" }).click();

    const draft = sheet.locator(".card").filter({ hasText: "Japanese class" }).first();
    await expect(draft).toBeVisible();
    await expect(draft).toContainText("1.5h");

    await draft.getByRole("button", { name: "Save" }).click();
    await expect(sheet).toBeHidden();
  });

  test("a plan is refused rather than invented into a record", async ({ page }) => {
    await openSheet(page);
    const sheet = page.getByRole("dialog", { name: "Record something" });

    await sheet.getByRole("button", { name: "Describe it" }).click();
    await sheet.getByPlaceholder(/Japanese class/).fill("I should practise piano tomorrow");
    await sheet.getByRole("button", { name: "Record this" }).click();

    await expect(sheet.getByText(/sounds like a plan/i)).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Save" })).toHaveCount(0);
  });

  test("the structured form records the same thing", async ({ page }) => {
    await openSheet(page);
    const sheet = page.getByRole("dialog", { name: "Record something" });

    await sheet.getByRole("button", { name: "Add detail" }).click();
    await sheet.getByPlaceholder("What did you do?").fill("Evening reading");
    await sheet.getByRole("spinbutton", { name: "Hours" }).fill("0.75");
    await sheet.getByRole("button", { name: "Reading", exact: true }).click();
    await sheet.getByRole("button", { name: "Save" }).click();

    await expect(sheet).toBeHidden();
  });

  test("the sheet closes without recording anything", async ({ page }) => {
    await openSheet(page);
    const sheet = page.getByRole("dialog", { name: "Record something" });

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page.getByText(/Recorded —/)).toHaveCount(0);
  });
});
