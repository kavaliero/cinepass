import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:4321';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // En CI on lance api + web depuis le job; en local Playwright peut les démarrer
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: 'pnpm --filter @cinepass/api dev',
          url: 'http://localhost:3001/api/health',
          reuseExistingServer: true,
          timeout: 60_000,
        },
        {
          command: 'pnpm --filter @cinepass/web dev',
          url: BASE_URL,
          reuseExistingServer: true,
          timeout: 60_000,
        },
      ],
});
