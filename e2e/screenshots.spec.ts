import { test } from "@playwright/test";
import { signIn } from "./helpers";

/**
 * Design review captures.
 *
 * Not assertions, these exist so a person (or an agent) can look at the app
 * rather than reason about it. Several defects in this codebase were only ever
 * found by looking: the plant stages that were indistinguishable at 76px, and
 * the milestone chip whose label was the tier colour.
 *
 * Tagged so the normal suite stays fast: `npx playwright test --grep @shots`.
 */
test.describe("@shots design review", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  const SHOTS: [string, string][] = [
    ["/today", "today"],
    ["/growth", "growth"],
    ["/calendar", "calendar"],
    ["/medals", "medals"],
  ];

  for (const [path, name] of SHOTS) {
    test(`phone ${name}`, async ({ page }) => {
      await page.goto(path);
      // Let the entrance choreography settle before capturing.
      await page.waitForTimeout(900);
      await page.screenshot({
        path: `test-results/shots/phone-${name}.png`,
        fullPage: true,
      });
    });
  }

  test("phone log sheet", async ({ page }) => {
    await page.getByRole("button", { name: "Record something" }).first().click();
    const sheet = page.getByRole("dialog", { name: "Record something" });
    await sheet.getByRole("button", { name: /Japanese/ }).first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "test-results/shots/phone-sheet.png" });
  });

  test("phone watering", async ({ page }) => {
    await page.getByRole("button", { name: "Record something" }).first().click();
    const sheet = page.getByRole("dialog", { name: "Record something" });
    await sheet.getByRole("button", { name: /Japanese/ }).first().click();
    await sheet.getByRole("button", { name: "1h", exact: true }).click();

    // Mid-sequence: the can is tipped and droplets are in the air.
    await page.waitForTimeout(600);
    await page.screenshot({ path: "test-results/shots/phone-watering.png" });
  });

  test("desktop today", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/today");
    await page.waitForTimeout(900);
    await page.screenshot({ path: "test-results/shots/desktop-today.png" });
  });
});
