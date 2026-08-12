import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("recording an experience", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("chat extracts a draft and only saves once confirmed", async ({ page }) => {
    const before = await page.getByText(/experiences\./).first().textContent();

    await page.getByPlaceholder("What did you do?").first().fill(
      "Went to Japanese class for 90 minutes today",
    );
    await page.getByRole("button", { name: "Record this" }).click();

    // The draft appears for confirmation — nothing has been written yet.
    const draft = page.locator(".card").filter({ hasText: "Japanese class" }).first();
    await expect(draft).toBeVisible();
    await expect(draft).toContainText("1.5h");
    await expect(draft).toContainText("Japanese");

    // The week summary must not have moved before the user confirms.
    expect(await page.getByText(/experiences\./).first().textContent()).toBe(before);

    await draft.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Recorded.")).toBeVisible();
    await expect(draft).toBeHidden();
  });

  test("a draft can be discarded without touching the record", async ({ page }) => {
    await page.getByPlaceholder("What did you do?").first().fill(
      "Piano practice for 25 minutes",
    );
    await page.getByRole("button", { name: "Record this" }).click();

    const draft = page.locator(".card").filter({ hasText: "Piano practice" }).first();
    await expect(draft).toBeVisible();

    await draft.getByRole("button", { name: "Discard this draft" }).click();
    await expect(draft).toBeHidden();
  });

  test("a plan is refused rather than invented into a record", async ({ page }) => {
    await page.getByPlaceholder("What did you do?").first().fill(
      "I should practise piano tomorrow",
    );
    await page.getByRole("button", { name: "Record this" }).click();

    await expect(page.getByText(/sounds like a plan/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toHaveCount(0);
  });

  test("the structured form records the same thing", async ({ page }) => {
    await page.getByRole("button", { name: "Add with a form instead" }).click();

    const form = page.locator("form").filter({ hasText: "Save" }).first();
    await form.getByPlaceholder("What did you do?").fill("Evening reading");
    await form.getByRole("spinbutton", { name: "Hours" }).fill("0.75");
    await form.getByRole("button", { name: "Reading", exact: true }).click();
    await form.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Recorded.")).toBeVisible();
  });
});
