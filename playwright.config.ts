import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for SmartRoadmap / Devotopia.
 *
 * `tests/e2e` drives the running stack. Suites that exercise API behaviour use
 * Playwright's request fixture rather than a browser, because the rules under
 * test — authorization, validation, vote idempotency — are enforced on the
 * server and asserting them through the UI would test the navigation instead.
 *
 * Both servers must already be running:
 *   API  → http://localhost:3002   (override with API_URL)
 *   Web  → http://localhost:3001   (override with WEB_URL)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.WEB_URL ?? 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'e2e',
      testDir: './tests/e2e',
      // The API rate-limits auth routes to 15 requests per minute, and each
      // Playwright worker runs its own `beforeAll`. Fanning out across six
      // workers registers enough accounts to trip the limiter, so these suites
      // would fail on throttling rather than on behaviour. One worker keeps the
      // signal honest; the limiter itself is covered by scripts/smoke-test.mjs.
      fullyParallel: false,
      workers: 1,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
