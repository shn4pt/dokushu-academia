import { go, expect, test, PROGRESS_KEY } from './fixtures'

const reading = (page: import('@playwright/test').Page) =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{}').reading ?? {}, PROGRESS_KEY)

test.beforeEach(async ({ page }) => {
  await page.goto(go('/'))
  await page.evaluate(() => localStorage.clear())
})

test('読み進めた見出しが記録され、ホームから、その見出しへ戻れる', async ({ page }) => {
  await page.goto(go('/lesson/5-3'))
  const headings = page.locator('article h3')
  await expect(headings.nth(3)).toBeAttached()
  await headings.nth(3).scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, 60))
  await expect.poll(async () => (await reading(page))['5-3']?.section?.trim()).toBeTruthy()
  const rec = (await reading(page))['5-3']
  expect(rec.index).toBeGreaterThanOrEqual(1)

  // 戻って読み返しても、しおりは戻らない
  const before = rec.index
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  expect((await reading(page))['5-3'].index).toBe(before)

  // ホームの「続きから学ぶ」で、記録した見出しに戻る
  await page.goto(go('/'))
  await expect(page.locator('main')).toContainText(`前回は「${rec.section}」まで読みました`)
  await page.getByRole('link', { name: /続きから学ぶ/ }).click()
  await expect(page.locator('article h1')).toContainText('5-3')
  await expect(page.locator('.resume-toast')).toContainText(`前回の続き(「${rec.section}」)から表示しています`)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300)
})

test('最初のレッスンの冒頭では、記録しない', async ({ page }) => {
  await page.goto(go('/lesson/0-1'))
  await page.waitForTimeout(500)
  expect(await reading(page)).toEqual({})
})

test('完了にすると、しおりが消える', async ({ page }) => {
  await page.goto(go('/lesson/5-3'))
  await page.locator('article h3').nth(3).scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, 60))
  await expect.poll(async () => Object.keys(await reading(page)).length).toBe(1)
  await page.getByRole('button', { name: 'このレッスンを完了にする' }).click()
  expect(await reading(page)).toEqual({})
})
