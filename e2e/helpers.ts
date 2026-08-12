import { execFileSync } from "node:child_process";
import type { Page } from "@playwright/test";

/**
 * Removes a user, for the stale-session tests.
 *
 * Shells out rather than importing Prisma: specs are transpiled as CommonJS and
 * the generated client is ESM, so a direct import fails on `import.meta`.
 */
export function deleteUser(email: string) {
  execFileSync("npx", ["tsx", "e2e/support/delete-user.ts", email], {
    stdio: "pipe",
  });
}

/**
 * Signs in through the development credentials provider.
 *
 * These tests run against the app as configured for local development, where
 * Google credentials are absent. That is deliberate: it means the suite needs
 * no OAuth secrets and no network.
 */
export async function signIn(page: Page, email = "demo@lifexp.local") {
  await page.goto("/signin");
  await page.getByLabel("Development sign-in").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("/today");
}

/** Words this product must never say to a user. */
export const FORBIDDEN_COPY = [
  "overdue",
  "streak",
  "you failed",
  "you missed",
  "days late",
  "keep your streak",
];
