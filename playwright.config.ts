import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * End-to-end configuration for the Instant Estimate flow.
 *
 * The server runs against a throwaway data directory so the file-backed store
 * used in development is never touched, and with a known admin password so the
 * console specs can sign in. No Redis, QStash or Resend account is required:
 * the store falls back to a file and the mailer logs instead of sending.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.spec\.ts/,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
      testIgnore: /.*mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: /.*mobile\.spec\.ts/,
    },
  ],

  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ADMIN_DATA_DIR: ".e2e-data",
      // The hash is set explicitly (rather than the plain-password fallback) so
      // it wins over any ADMIN_PASSWORD_HASH a developer keeps in .env.local.
      // Throwaway credentials for a local test server only.
      ADMIN_PASSWORD_HASH:
        "scrypt:07070707070707070707070707070707:9d76a046732d27d5a5c57f5e27c5c04ad94e2f375a44718a3b6c8e1baa2b722d5172348ad9f089a4dcac5825bfb578d3ea8ad65036bf5afd2418b25e1cfa8904",
      ADMIN_PASSWORD: "e2e-admin-password",
      ADMIN_SESSION_SECRET: "e2e-session-secret",
      QUOTATION_REVIEW_MINUTES: "10",
      // Every spec submits from 127.0.0.1; the production default of 5 per
      // 15 minutes would rate-limit the suite itself.
      QUOTATION_RATE_LIMIT_MAX: "500",
      // Force the file-backed store even if .env.local points at a real Redis.
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      KV_REST_API_URL: "",
      KV_REST_API_TOKEN: "",
      RESEND_API_KEY: "",
      QSTASH_TOKEN: "",
      NEXT_PUBLIC_PLAUSIBLE_ENABLED: "false",
    },
  },
});
