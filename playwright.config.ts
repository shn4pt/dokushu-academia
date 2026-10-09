import { defineConfig, devices } from '@playwright/test'

// 事前に npm run build を実行しておく(dist を vite preview で配信してテストする)。
// 実行: npm run test:e2e
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1000, height: 900 } }, testIgnore: /\.mobile\.spec\.ts$/ },
    // iPhone 13 の画面と、タッチ操作(pointer: coarse)で確かめる。ブラウザは Chromium を使う
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' }, testMatch: /\.mobile\.spec\.ts$/ },
  ],
})
