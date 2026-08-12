import type { Page } from "@playwright/test";

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
  await page.waitForURL("/");
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
