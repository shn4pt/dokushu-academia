import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// パスの URL 版(試作。Issue #15)の検査は、`npm run build:path` と `npm run build:path:root` で出力があるときだけ行う(CI では、ビルドしてから実行する)。
const hasPathBuild = existsSync('dist-path') && existsSync('dist-path-root')
// 引き継ぎの診断(Issue #19)は、`npm run build:path:diag` の出力があるときだけ行う
const hasDiagBuild = existsSync('dist-path-diag')

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
  webServer: [
    {
      command: 'npx vite preview --port 4173 --strictPort',
      url: 'http://localhost:4173',
      reuseExistingServer: !process.env.CI,
    },
    // パスの URL 版(試作)の静的配信。GitHub Pages に近い挙動(ディレクトリの index.html、スラッシュへの 301、404.html を 404 で返す)。プロジェクト配下とルート配下の 2 通り
    ...(hasPathBuild
      ? [
          { command: 'node scripts/serve-static.mjs dist-path 4174 /dokushu-academia/', url: 'http://localhost:4174/dokushu-academia/', reuseExistingServer: !process.env.CI },
          { command: 'node scripts/serve-static.mjs dist-path-root 4175 /', url: 'http://localhost:4175/', reuseExistingServer: !process.env.CI },
        ]
      : []),
    ...(hasDiagBuild
      ? [{ command: 'node scripts/serve-static.mjs dist-path-diag 4176 /', url: 'http://localhost:4176/', reuseExistingServer: !process.env.CI }]
      : []),
  ],
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1000, height: 900 } }, testIgnore: /\.(mobile|path|diag)\.spec\.ts$/ },
    ...(hasPathBuild
      ? [{ name: 'path', use: { ...devices['Desktop Chrome'], viewport: { width: 1000, height: 900 }, baseURL: 'http://localhost:4174' }, testMatch: /\.path\.spec\.ts$/ }]
      : []),
    ...(hasDiagBuild
      ? [{ name: 'diag', use: { ...devices['Desktop Chrome'], viewport: { width: 1000, height: 900 }, baseURL: 'http://localhost:4176' }, testMatch: /\.diag\.spec\.ts$/ }]
      : []),
    // iPhone 13 の画面と、タッチ操作(pointer: coarse)で確かめる。ブラウザは Chromium を使う
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' }, testMatch: /\.mobile\.spec\.ts$/ },
  ],
})
