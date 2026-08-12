import { expect, test } from "@playwright/test";
import { FORBIDDEN_COPY, signIn } from "./helpers";

/**
 * The design principles, asserted against the rendered app.
 *
 * A comment in a file is a good intention; this is the thing that actually
 * fails a build if someone ships a red overdue badge.
 */
test.describe("no pressure", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  const pages = ["/", "/growth", "/maintenance", "/medals", "/timeline", "/settings"];

  for (const path of pages) {
    test(`${path} never uses punitive language`, async ({ page }) => {
      await page.goto(path);
      const body = ((await page.locator("body").innerText()) || "").toLowerCase();

      for (const word of FORBIDDEN_COPY) {
        // "No streaks, no guilt" in the marketing copy is the one legitimate
        // use, and it only appears on the signed-out page.
        expect(body).not.toContain(word);
      }
    });
  }

  test("maintenance shows freshness without an alarm colour", async ({ page }) => {
    await page.goto("/maintenance");

    // Something long-untouched should read as faded, not failed.
    await expect(page.getByText("been a while").first()).toBeVisible();

    // No element on the page renders in a red hue. The palette has no red
    // token at all, so anything red would have to be hardcoded.
    const reds = await page.evaluate(() => {
      const isRed = (value: string) => {
        const match = value.match(/rgba?\(([^)]+)\)/);
        if (!match) return false;
        const [r, g, b] = match[1].split(",").map((n) => parseFloat(n));
        return r > 150 && g < 90 && b < 90;
      };
      return [...document.querySelectorAll("*")].filter((el) => {
        const style = getComputedStyle(el);
        return isRed(style.color) || isRed(style.backgroundColor);
      }).length;
    });

    expect(reds).toBe(0);
  });

  test("logging maintenance resets its freshness", async ({ page }) => {
    await page.goto("/maintenance");

    const row = page.locator("li.card").first();
    const name = await row.locator("span").first().textContent();

    await row.getByRole("button", { name: /^Log / }).click();

    const updated = page.locator("li.card").filter({ hasText: name! }).first();
    await expect(updated).toContainText("today");
  });
});

test.describe("medals", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("shows unearned badges as something still to find", async ({ page }) => {
    await page.goto("/medals");

    await expect(page.getByText("? ? ?").first()).toBeVisible();
    await expect(page.getByText("Still out there").first()).toBeVisible();
  });

  test("earned milestones are attributed to their skill", async ({ page }) => {
    await page.goto("/medals");

    await expect(page.getByRole("heading", { name: "Skill milestones" })).toBeVisible();
    await expect(page.getByText("Foundation").first()).toBeVisible();
  });
});
