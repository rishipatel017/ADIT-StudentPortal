import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for ADIT CampusHub ERP frontend tests.
 * Assumes:
 *   - Frontend:  http://localhost:3000
 *   - Backend:   http://localhost:3001
 *
 * Run with:
 *   npx playwright test
 *   npx playwright test --ui
 *   npx playwright test --headed
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,          // Run tests sequentially for ERP flows
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,                    // 1 worker — avoids DB race conditions
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Reasonable timeouts
    actionTimeout:     15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // You can optionally start the Next.js dev server automatically:
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 60_000,
  // },
});
