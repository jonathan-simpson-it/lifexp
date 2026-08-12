import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // One seeded database shared across specs, reset once per run by globalSetup.
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  // The @shots specs capture screenshots for design review rather than
  // asserting anything, so they stay out of the normal run.
  // Capture them with: npx playwright test --grep @shots
  grepInvert: /@shots/,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    // Mobile-first product, so the default viewport is a phone.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/signin",
    // Never reuse: a server started without LIFEXP_E2E still renders the
    // dev-tools overlay, which covers the bottom-pinned capture bar.
    reuseExistingServer: false,
    timeout: 120_000,
    env: { LIFEXP_E2E: "1" },
  },
});
