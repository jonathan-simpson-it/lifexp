import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.describe("navigation shell", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("shows the bottom bar on a phone, not the sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const bars = page.getByRole("navigation", { name: "Primary" });
    // Both exist in the DOM; exactly one is visible at any width.
    await expect(bars.filter({ hasText: "Today" }).first()).toBeVisible();

    const addButtons = page.getByRole("button", { name: "Record something" });
    await expect(addButtons.first()).toBeVisible();

    // The sidebar's labelled add button is hidden below md.
    await expect(page.getByRole("link", { name: "Settings" })).toBeHidden();
  });

  test("shows the sidebar on a desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("the centre button opens the log sheet", async ({ page }) => {
    await expect(
      page.getByRole("dialog", { name: "Record something" }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Record something" }).first().click();
    await expect(
      page.getByRole("dialog", { name: "Record something" }),
    ).toBeVisible();
  });

  test("every primary destination is reachable", async ({ page }) => {
    for (const label of ["Growth", "Calendar", "Medals", "Today"]) {
      await page.getByRole("link", { name: label, exact: true }).first().click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("the landing page is public and redirects once signed in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/today$/);
  });
});

test.describe("landing page", () => {
  test("sells the product to a signed-out visitor", async ({ page }) => {
    await page.goto("/");

    // Matched without the apostrophe: the page renders a typographic ’ (U+2019)
    // and a straight quote here would never match.
    await expect(
      page.getByRole("heading", { name: /done more\s+than you remember/i }),
    ).toBeVisible();
    // The differentiator has to be on the page, next to the CTA.
    await expect(page.getByText("No streaks. Ever.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Start free" }).first()).toBeVisible();
  });

  test("the CTA leads somewhere that works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start free" }).first().click();
    await expect(page).toHaveURL(/\/signin$/);
  });
});

test.describe("the garden", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("shows a plant per skill, sized by what was earned", async ({ page }) => {
    const garden = page.getByRole("region", { name: "Your garden" });
    await expect(garden).toBeVisible();

    // The seed gives Japanese a deep history and Reading a shallow one, so
    // their accessible descriptions must differ.
    await expect(garden.getByLabel(/Japanese, a /)).toBeVisible();
    await expect(garden.getByLabel(/Reading, a /)).toBeVisible();
  });

  /**
   * The anti-streak rule, made testable. A plant has no time input at all, so
   * there is no code path that can wilt one, this asserts the vocabulary never
   * appears even as a class name or label.
   */
  test("no plant can ever wilt", async ({ page }) => {
    const html = (await page.content()).toLowerCase();
    for (const word of ["wilt", "wither", "dead", "dying", "neglected"]) {
      expect(html).not.toContain(word);
    }
  });
});
