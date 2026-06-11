import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config for the storefront. The backend must already be running on :3000
 * (started by the test runner script); Playwright boots `ng serve` on :4200.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Boots the backend (needs MongoDB) and the storefront dev server. Both are
  // reused if already running.
  webServer: [
    {
      command: 'node server.js',
      cwd: 'server',
      url: 'http://localhost:3000/api/health',
      timeout: 60_000,
      reuseExistingServer: true,
    },
    {
      command: 'npm start',
      url: 'http://localhost:4200',
      timeout: 240_000,
      reuseExistingServer: true,
    },
  ],
});
