import { expect, test } from "@playwright/test";
import { deleteUser, signIn } from "./helpers";

/**
 * Every write path in the app.
 *
 * These exist because two of them shipped broken. Creating a skill and creating
 * a maintenance item both 500ed with a foreign-key violation and nothing caught
 * it, the suite covered reading every page and logging via the sheet, but
 * never the two plain forms. Reads scoped to a missing user return empty rather
 * than throwing, so the app looked fine right up until someone tried to save.
 *
 * A page rendering 200 is not evidence that the page works.
 */
test.describe("write paths", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("creates a skill from the growth page", async ({ page }) => {
    await page.goto("/growth");

    const name = `Pottery ${Date.now()}`;
    await page.getByLabel("Skill name").fill(name);
    await page.getByRole("button", { name: "Add", exact: true }).click();

    // The skill appears with a freshly seeded milestone ladder.
    await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
    await expect(page.getByText("to First Steps").first()).toBeVisible();
  });

  test("creates a maintenance item", async ({ page }) => {
    await page.goto("/maintenance");

    const name = `Descale kettle ${Date.now()}`;
    await page.getByLabel("Item name").fill(name);
    await page.getByLabel("Days between").fill("21");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    const row = page.locator("li.card").filter({ hasText: name });
    await expect(row).toBeVisible();
    await expect(row).toContainText("not yet logged");
  });

  test("adds a suggested maintenance item in one tap", async ({ page }) => {
    await page.goto("/maintenance");

    const suggestion = page.getByRole("button", { name: /^\+ / }).first();
    const label = (await suggestion.textContent())?.replace("+ ", "").trim();
    await suggestion.click();

    await expect(
      page.locator("li.card").filter({ hasText: label! }),
    ).toBeVisible();
  });

  test("logs and un-logs a maintenance item", async ({ page }) => {
    await page.goto("/maintenance");

    const row = page.locator("li.card").first();
    const name = (await row.locator("span").first().textContent())!;

    await row.getByRole("button", { name: /^Log / }).click();
    await expect(
      page.locator("li.card").filter({ hasText: name }).first(),
    ).toContainText("today");

    await page
      .locator("li.card")
      .filter({ hasText: name })
      .first()
      .getByRole("button", { name: /^Undo/ })
      .click();

    await expect(
      page.locator("li.card").filter({ hasText: name }).first(),
    ).not.toContainText("today");
  });

  test("exports data as valid JSON", async ({ page }) => {
    const response = await page.request.get("/api/export");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");

    const body = await response.json();
    expect(body.format).toBe("lifexp.export.v1");
    expect(body.skills.length).toBeGreaterThan(0);
    expect(body.experiences.length).toBeGreaterThan(0);
  });
});

/**
 * Sessions are JWTs, so a token keeps asserting a user id after that user is
 * gone. This is the exact failure that shipped: the token stays
 * cryptographically valid, reads scoped to the missing user return empty
 * instead of throwing, so every page renders 200 and merely looks empty, and
 * the first write dies on a foreign key.
 *
 * Reproduced properly by deleting the user out from under a live session,
 * rather than by corrupting the cookie (which is the easy, loud case).
 */
test.describe("a session pointing at a deleted user", () => {
  const email = "stale-session@lifexp.local";

  test.afterEach(async () => {
    deleteUser(email);
  });

  test("is treated as signed out, not half-working", async ({ page }) => {
    await signIn(page, email);
    await expect(page).toHaveURL(/\/today$/);

    // The session is still perfectly valid; the user it names is not.
    deleteUser(email);

    await page.goto("/today");
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByLabel("Development sign-in")).toBeVisible();
  });

  test("does not bounce between sign-in and the app", async ({ page }) => {
    await signIn(page, email);
    deleteUser(email);

    // Both the landing page and sign-in must agree the session is dead. If
    // either trusted the token, these two would redirect to each other forever.
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Start free" }).first()).toBeVisible();

    await page.goto("/signin");
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByLabel("Development sign-in")).toBeVisible();
  });

  test("signing in again recovers cleanly", async ({ page }) => {
    await signIn(page, email);
    deleteUser(email);

    await page.goto("/today");
    await expect(page).toHaveURL(/\/signin$/);

    // A fresh sign-in mints a token for the newly created user and everything
    // works again, including writes, which is what broke before.
    await page.getByLabel("Development sign-in").fill(email);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL("/today");

    await page.goto("/growth");
    await page.getByLabel("Skill name").fill("Recovered skill");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    await expect(
      page.getByRole("link", { name: /Recovered skill/ }),
    ).toBeVisible();
  });
});
