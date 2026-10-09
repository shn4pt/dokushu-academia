import { go, expect, test, PROGRESS_KEY } from './fixtures'
import { ids } from './lessons'
import { answerQuiz, quizOf } from './quiz'

const stored = (page: import('@playwright/test').Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), PROGRESS_KEY)

test.beforeEach(async ({ page }) => {
  await page.goto(go('/'))
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('はじめは 0%', async ({ page }) => {
  await expect(page.locator('main')).toContainText(`0%(0 / ${ids.length} レッスン)`)
  await expect(page.locator('a.button')).toContainText('LLM の全体像')
})

test('クイズに全問正解すると、成績が記録される', async ({ page }) => {
  await page.goto(go('/lesson/0-1'))
  await answerQuiz(page, '0-1')
  const n = quizOf('0-1').length
  await expect(page.locator('.quiz')).toContainText(`${n} / ${n}`)
  expect((await stored(page)).quiz['0-1']).toEqual({ best: n, total: n })
})

test('レッスンを完了にすると、進捗率・ホーム・進捗ページに反映され、取り消せる', async ({ page }) => {
  await page.goto(go('/lesson/0-1'))
  await page.getByRole('button', { name: 'このレッスンを完了にする' }).click()
  await expect(page.getByRole('button', { name: /完了済み/ })).toBeVisible()
  await expect(page.locator('.site-header')).toContainText('進捗 1%')
  await page.goto(go('/'))
  await expect(page.locator('main')).toContainText(`1%(1 / ${ids.length}`)
  await expect(page.locator('main')).toContainText('続きから学ぶ')
  await page.goto(go('/progress'))
  await expect(page.locator('.card', { hasText: 'ベクトルと行列積' }).first()).toContainText('✓')
  await page.goto(go('/lesson/0-1'))
  await page.getByRole('button', { name: /完了済み/ }).click()
  expect(Object.keys((await stored(page)).completed)).toHaveLength(0)
})

test('エクスポートした進捗を、リセット後にインポートして復元できる', async ({ page }) => {
  await page.goto(go('/lesson/0-1'))
  await page.getByRole('button', { name: 'このレッスンを完了にする' }).click()
  await page.goto(go('/progress'))
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'エクスポート' }).click()])
  const path = await download.path()

  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'リセット' }).click()
  await expect(page.locator('main')).toContainText(`0%(0 / ${ids.length})`)

  await page.locator('input[type=file]').setInputFiles(path)
  await expect(page.getByRole('status').filter({ hasText: '進捗を読み込みました' })).toBeVisible()
  await expect(page.locator('main')).toContainText(`1%(1 / ${ids.length})`)
})

test('不正な JSON は拒否し、進捗は保たれる', async ({ page }) => {
  await page.goto(go('/lesson/0-1'))
  await page.getByRole('button', { name: 'このレッスンを完了にする' }).click()
  await page.goto(go('/progress'))
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{ これは JSON ではない') })
  await expect(page.getByRole('status').filter({ hasText: '読み込めませんでした' })).toBeVisible()
  await expect(page.locator('main')).toContainText(`1%(1 / ${ids.length})`)
})

test('壊れた保存データや、古い形式のデータでも起動する', async ({ page }) => {
  await page.evaluate((k) => localStorage.setItem(k, '{broken'), PROGRESS_KEY)
  await page.reload()
  await expect(page.locator('main')).toContainText(`0%(0 / ${ids.length}`)
  // questions・reading のない旧形式
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ version: 1, completed: { '0-1': '2026-01-01T00:00:00.000Z' }, quiz: {} })), PROGRESS_KEY)
  await page.reload()
  await expect(page.locator('main')).toContainText(`1%(1 / ${ids.length}`)
})

test('API キーは、進捗の保存データやエクスポートに含まれない', async ({ page }) => {
  await page.goto(go('/api-key'))
  await page.locator('input[type=password]').fill('sk-ant-TEST-KEY-should-never-be-stored')
  await page.getByRole('button', { name: '保存する' }).click()
  await expect(page.locator('main')).toContainText('設定済み')
  await page.goto(go('/lesson/0-1'))
  await page.getByRole('button', { name: 'このレッスンを完了にする' }).click()
  const all = await page.evaluate(() => JSON.stringify({ ...localStorage }))
  expect(all).not.toContain('sk-ant-TEST')
})
