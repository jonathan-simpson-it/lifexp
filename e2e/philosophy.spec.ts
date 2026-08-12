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
    await page.getByRole("button", { name: "Record something" }).first().click();
    const sheet = page.getByRole("dialog", { name: "Record something" });

    await sheet.getByRole("button", { name: "Describe it" }).click();
    await sheet
      .getByPlaceholder(/Japanese class/)
      .fill("Went to Japanese class for 90 minutes today");
    await sheet.getByRole("button", { name: "Record this" }).click();

    await expect(
      sheet.locator(".card").filter({ hasText: "Japanese class" }).first(),
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
        // 4.5:1 — the AA bar for body text, not the 3:1 graphical one.
        //
        // This was 3:1, and that gap is exactly how the milestone chip on
        // skill cards shipped with the tier colour as its text colour: gold
        // measures 3.24:1 on cream, which cleared the old threshold and fails
        // the real one. Every colour used for text in this app is meant to
        // clear 4.5, so the test now asserts that rather than something looser.
        if (contrast < 4.5) {
          offenders.push(`${text.slice(0, 30)} (${contrast.toFixed(2)}:1)`);
        }
      }
      return offenders;
    });

    expect(unreadable).toEqual([]);
  });
});

/**
 * Typography.
 *
 * A webfont that fails to load does not look broken — it looks *almost right*,
 * because the fallback stack is deliberately close. That makes it the one
 * visual regression nobody notices by eye, so it is asserted instead.
 */
test.describe("typefaces", () => {
  test("the chosen faces are actually applied", async ({ page }) => {
    await signIn(page);

    const body = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(body).toContain("Hanken Grotesk");

    // Any number in the app is set in the display face.
    const numeral = await page
      .locator(".numeral")
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(numeral).toContain("Newsreader");
  });

  test("the voice is set in the display italic", async ({ page }) => {
    await signIn(page);
    // A month with nothing in it — no day is preselected, so the calendar
    // shows its "nothing recorded is just a day that went unrecorded" line.
    // Every other place the voice appears is conditional on a quiet week or an
    // empty garden, none of which the seed guarantees.
    await page.goto("/calendar?y=2020&m=1");

    const voice = page.locator(".voice").first();
    await expect(voice).toHaveCSS("font-style", "italic");
    expect(
      await voice.evaluate((el) => getComputedStyle(el).fontFamily),
    ).toContain("Newsreader");
  });
});

/**
 * Motion.
 *
 * Two rules, both of which are easy to break by adding an animation and
 * forgetting the people who asked not to see one.
 */
test.describe("motion", () => {
  test("reduced motion silences the watering animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await signIn(page);

    // The watering keyframes must be covered by the global reduced-motion
    // block. Asserting on a real element rather than the stylesheet, so a rule
    // added outside that block fails here.
    const durations = await page.evaluate(() => {
      const probe = document.createElement("div");
      document.body.append(probe);

      // Read as seconds rather than as a string: browsers serialise the
      // collapsed 0.01ms as "1e-05s" here and "0.00001s" elsewhere, and the
      // assertion should be about the duration, not the formatting.
      const read = (className: string) => {
        probe.className = className;
        return parseFloat(getComputedStyle(probe).animationDuration);
      };

      const result = {
        can: read("water-can"),
        drop: read("water-drop"),
        grow: read("grow-in"),
        sway: read("plant-sway"),
      };
      probe.remove();
      return result;
    });

    for (const [name, seconds] of Object.entries(durations)) {
      expect(seconds, `${name} should be silenced`).toBeLessThan(0.001);
    }
  });

  test("no plant ever renders a wilted state", async ({ page }) => {
    await signIn(page);

    // Growth is the only direction. If a browning or drooping stage is ever
    // added, the accessible names are where it would surface first.
    const labels = await page
      .locator("[aria-label]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label") ?? ""));

    const decay = /wilt|wither|dying|dead|dried|neglect|drooping|browning/i;
    expect(labels.filter((l) => decay.test(l))).toEqual([]);
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
