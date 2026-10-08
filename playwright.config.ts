import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests (UNT-33). They drive a running copy of the app, so start it first:
 *   docker compose --env-file .env.selfhost --profile app up -d --build     (or `npm run dev`)
 * then, once on your machine:  npx playwright install chromium   and   npm run test:e2e
 *
 * The full "sign up → note → task → sign out" journey needs sign-ups that don't wait for an email, so it only runs when
 * E2E_SIGNUP=1 and the app was started with AUTH_REQUIRE_EMAIL_VERIFICATION=false (it creates a throwaway account each run).
 */
export default defineConfig({
  testDir: "./e2e",
  globalTeardown: "./e2e/global-teardown.ts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Optional: use a Chromium-based browser you already have (Chrome, Brave, Edge) instead of downloading Playwright's own.
        ...(process.env.E2E_BROWSER_PATH ? { launchOptions: { executablePath: process.env.E2E_BROWSER_PATH } } : {}),
      },
    },
  ],
});
