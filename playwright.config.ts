import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // one seeded database, shared across specs
  workers: 1,
  retries: 0,
  reporter: [["list"]],
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
