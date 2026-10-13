import { defineConfig } from '@playwright/test';

if (!process.env.E2E_WEB_URL || !process.env.E2E_FIXTURE_PATH) {
  throw new Error('Run npm run test:browser to start isolated servers and PostgreSQL.');
}

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  globalTimeout: 10 * 60_000,
  reporter: 'list',
  use: { baseURL: process.env.E2E_WEB_URL, screenshot: 'only-on-failure', trace: 'retain-on-failure', video: 'off' },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
