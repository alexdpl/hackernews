// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/playwright',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',

  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },

  webServer: {
    command: 'node .output/server/index.mjs',
    url: 'http://127.0.0.1:3000/robots.txt',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      PORT: '3000',
      NITRO_PORT: '3000',
      HOST: '127.0.0.1',
      NITRO_HOST: '127.0.0.1',
      NODE_ENV: 'production',
      NUXT_PUBLIC_SITE_URL: 'https://devkernelpulse.org',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})