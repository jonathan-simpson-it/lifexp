import { test, type Page } from "@playwright/test";
import { revokeBadge, signIn } from "./helpers";

/**
 * Design review captures.
 *
 * Not assertions. These exist so a person, or an agent, can look at the app
 * rather than reason about it. Several defects in this codebase were only ever
 * found by looking: the plant stages that were indistinguishable at 76px, the
 * milestone chip whose label was the tier colour, and the calendar day pill
 * that rendered behind its own card.
 *
 * Output goes to `screenshots/` at the repo root rather than `test-results/`,
 * which Playwright wipes at the start of every run.
 *
 * Run with `npm run shots`. Excluded from the normal suite by grepInvert.
 */

const OUT = "screenshots";

async function settle(page: Page) {
  // Long enough for the entrance choreography to finish.
  await page.waitForTimeout(900);
}

test.describe("@shots design review", () => {
  const PAGES: [string, string][] = [
    ["/today", "01-today"],
    ["/growth", "02-growth"],
    ["/calendar", "03-calendar"],
    ["/medals", "04-medals"],
    ["/maintenance", "05-maintenance"],
    ["/timeline", "06-timeline"],
    ["/settings", "07-settings"],
  ];

  for (const [path, name] of PAGES) {
    test(`phone ${name}`, async ({ page }) => {
      await signIn(page);
      await page.goto(path);
      await settle(page);
      await page.screenshot({
        path: `${OUT}/phone-${name}.png`,
        fullPage: true,
      });
    });
  }

  test("phone 08-skill-detail", async ({ page }) => {
    await signIn(page);
    await page.goto("/growth");
    await page.getByRole("link", { name: /Japanese/ }).first().click();
    await settle(page);
    await page.screenshot({
      path: `${OUT}/phone-08-skill-detail.png`,
      fullPage: true,
    });
  });

  test("phone 09-log-sheet", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Record something" }).first().click();
    const sheet = page.getByRole("dialog", { name: "Record something" });
    await sheet.getByRole("button", { name: /Japanese/ }).first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/phone-09-log-sheet.png` });
  });

  test("phone 10-watering", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Record something" }).first().click();
    const sheet = page.getByRole("dialog", { name: "Record something" });
    await sheet.getByRole("button", { name: /Japanese/ }).first().click();
    await sheet.getByRole("button", { name: "1h", exact: true }).click();
    // Mid-sequence: the can is tipped and droplets are in the air.
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/phone-10-watering.png` });
  });

  test("phone 10b-medal-moment", async ({ page }) => {
    // Revoke a badge the demo user already holds, then earn it again. The
    // moment is otherwise unreachable: ten of the twelve are already awarded
    // and the other two depend on the time of day.
    revokeBadge("first-experience");

    await signIn(page);
    await page.getByRole("button", { name: "Record something" }).first().click();
    const sheet = page.getByRole("dialog", { name: "Record something" });
    await sheet.getByRole("button", { name: /Japanese/ }).first().click();
    await sheet.getByRole("button", { name: "30m", exact: true }).click();

    // Mid-strike: the ring is still expanding and the ribbon is unfurling.
    await page.waitForTimeout(420);
    await page.screenshot({ path: `${OUT}/phone-10b-medal-moment.png` });
  });

  test("landing 11-public", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    await page.screenshot({ path: `${OUT}/phone-11-landing.png`, fullPage: true });
  });

  const DESKTOP: [string, string][] = [
    ["/today", "12-today"],
    ["/medals", "13-medals"],
    ["/calendar", "14-calendar"],
  ];

  for (const [path, name] of DESKTOP) {
    test(`desktop ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await signIn(page);
      await page.goto(path);
      await settle(page);
      await page.screenshot({ path: `${OUT}/desktop-${name}.png` });
    });
  }
});
