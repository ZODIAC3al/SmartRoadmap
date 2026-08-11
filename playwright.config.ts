import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for SmartRoadmap / Devotopia.
 *
 * Two kinds of suite live here:
 *   tests/e2e/   — behaviour: does the flow work?
 *   tests/perf/  — timing: how long does it take?
 *
 * Perf runs single-worker so parallel pages cannot compete for CPU and skew
 * the numbers. Run them with:  npm run test:perf
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
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'perf',
      testDir: './tests/perf',
      // Timing measurements must not share CPU with other workers.
      fullyParallel: false,
      workers: 1,
      retries: 0,
      use: {
        ...devices['Desktop Chrome'],
        // A cold, comparable profile for every run.
        launchOptions: { args: ['--disable-extensions', '--disable-background-networking'] },
      },
    },
    {
      name: 'mobile',
      testDir: './tests/e2e',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Point at servers that are already running in dev; start them in CI.
  webServer: process.env.CI
    ? [
        {
          command: 'npm run dev --workspace=@smartroadmap/web',
          url: 'http://localhost:3001',
          reuseExistingServer: false,
          timeout: 180_000,
        },
      ]
    : undefined,
});
