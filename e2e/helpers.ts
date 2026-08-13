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
 * Removes one badge award so the next qualifying write earns it again.
 *
 * The only way to reach the medal moment in a seeded database where the demo
 * user has already earned nearly everything. Nothing is faked: `syncProgress`
 * genuinely re-awards it.
 */
export function revokeBadge(badgeKey: string, email = "demo@lifexp.local") {
  execFileSync("npx", ["tsx", "e2e/support/revoke-badge.ts", email, badgeKey], {
    stdio: "pipe",
  });
}

/**
 * Pins the demo user's local hour, by picking the fixed-offset zone that puts
 * their clock at `hour` right now.
 *
 * The garden's light follows the user's local time, so a capture run at 04:00
 * UTC would show every screen under the night wash. `Etc/GMT±N` zones are real
 * IANA zones with no DST, and their sign is inverted by definition: Etc/GMT-8
 * is UTC+8.
 */
export function setLocalHour(hour: number, email = "demo@lifexp.local") {
  const utcHour = new Date().getUTCHours();
  // Normalised into the -12..+14 range the Etc zones actually cover.
  let offset = hour - utcHour;
  if (offset > 14) offset -= 24;
  if (offset < -12) offset += 24;

  const zone =
    offset === 0 ? "UTC" : `Etc/GMT${offset > 0 ? "-" : "+"}${Math.abs(offset)}`;

  execFileSync("npx", ["tsx", "e2e/support/set-timezone.ts", email, zone], {
    stdio: "pipe",
  });
  return zone;
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
