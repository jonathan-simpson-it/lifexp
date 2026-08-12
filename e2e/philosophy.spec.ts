import { expect, test } from "@playwright/test";
import { FORBIDDEN_COPY, signIn } from "./helpers";
import { isAlarmRed } from "../src/lib/ui/alarm-red";

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

  const pages = [
    "/today",
    "/growth",
    "/calendar",
    "/maintenance",
    "/medals",
    "/timeline",
    "/settings",
  ];

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

    // Collect every computed colour in the browser, then judge them in Node
    // with the same `isAlarmRed` the unit tests cover. One implementation, so
    // the rule the suite enforces cannot drift from the rule that is tested.
    const colours = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll("*")) {
        const style = getComputedStyle(el);
        out.push(style.color, style.backgroundColor, style.borderTopColor);
      }
      return out;
    });

    expect(colours.filter(isAlarmRed)).toEqual([]);
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

/**
 * Every feature must be reachable with no API key and no credentials. These
 * tests run in exactly that configuration, so they fail if anything starts
 * requiring a vendor account to be seen at all.
 */
test.describe("usable without any keys", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("chat extracts without an AI key", async ({ page }) => {
    await page.getByPlaceholder("What did you do?").first().fill(
      "Went to Japanese class for 90 minutes today",
    );
    await page.getByRole("button", { name: "Record this" }).click();

    await expect(
      page.locator(".card").filter({ hasText: "Japanese class" }).first(),
    ).toBeVisible();
  });

  test("settings names the extractor actually running", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText(/Rule-based \(no API key\)/)).toBeVisible();
  });

  test("calendar is inspectable without Google credentials", async ({ page }) => {
    await page.goto("/settings");

    // The preview renders real event payloads, including the all-day form used
    // for an experience with no stated duration.
    await expect(page.getByText("What would be added").or(
      page.getByText(/see exactly what LifeXP would write/),
    ).first()).toBeVisible();

    const preview = page.locator("div").filter({ hasText: /^LifeXP/ }).last();
    await expect(preview).toBeVisible();
  });

  test("export downloads without any external service", async ({ page }) => {
    const response = await page.request.get("/api/export");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.format).toBe("lifexp.export.v1");
    expect(Array.isArray(body.experiences)).toBe(true);
  });
});

/**
 * The client asked for a light, cream app. The risk is not that someone edits
 * the token — it is that a `prefers-color-scheme: dark` rule creeps back in and
 * the app turns dark on exactly the phones nobody tests on.
 */
test.describe("cream ground", () => {
  const CREAM = "rgb(247, 241, 225)"; // --paper

  test("is cream when the device prefers light", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await signIn(page);

    await expect(page.locator("body")).toHaveCSS("background-color", CREAM);
  });

  test("is still cream when the device prefers dark", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await signIn(page);

    await expect(page.locator("body")).toHaveCSS("background-color", CREAM);
  });

  test("stays cream on every page", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await signIn(page);

    for (const path of ["/growth", "/maintenance", "/medals", "/timeline", "/settings"]) {
      await page.goto(path);
      await expect(page.locator("body")).toHaveCSS("background-color", CREAM);
    }
  });

  test("no text is light-on-light", async ({ page }) => {
    await signIn(page);

    // Light text is fine on a dark chip (the active nav pill is cream on ink).
    // The failure this guards against is light text on a LIGHT background —
    // what a half-applied dark theme looks like, and what would make the app
    // unreadable on the cream ground.
    const unreadable = await page.evaluate(() => {
      const parse = (value: string) => {
        const m = value.match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const parts = m[1].split(",").map((n) => parseFloat(n));
        const [r, g, b, a = 1] = parts;
        return a === 0 ? null : { r, g, b };
      };

      const lin = (c: number) =>
        c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      const lum = ({ r, g, b }: { r: number; g: number; b: number }) =>
        0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);

      /** First ancestor with a non-transparent background. */
      const groundOf = (el: Element) => {
        let node: Element | null = el;
        while (node) {
          const bg = parse(getComputedStyle(node).backgroundColor);
          if (bg) return bg;
          node = node.parentElement;
        }
        return { r: 255, g: 255, b: 255 };
      };

      const offenders: string[] = [];
      for (const el of document.querySelectorAll("p, span, h1, h2, h3, a, li, button")) {
        const text = el.textContent?.trim();
        if (!text || el.children.length > 0) continue;

        const fg = parse(getComputedStyle(el).color);
        if (!fg) continue;

        const [hi, lo] = [lum(fg), lum(groundOf(el))].sort((a, b) => b - a);
        const contrast = (hi + 0.05) / (lo + 0.05);
        if (contrast < 3) offenders.push(`${text.slice(0, 30)} (${contrast.toFixed(2)}:1)`);
      }
      return offenders;
    });

    expect(unreadable).toEqual([]);
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
