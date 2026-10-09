import { readFileSync } from 'node:fs'
import { go, expect, test } from './fixtures'
import { ids } from './lessons'

test('すべてのレッスンに、学習時間の統計がある', () => {
  const stats = JSON.parse(readFileSync('src/data/lesson-stats.json', 'utf8')) as Record<string, unknown>
  for (const id of ids) expect(stats[id], `${id} の統計`).toBeTruthy()
})

test('ロードマップの時間と、レッスンページの時間が一致する', async ({ page }) => {
  await page.goto(go('/roadmap'))
  const chip = page.locator('a.lesson-chip', { hasText: 'ベクトルと行列積' })
  const chipMin = (await chip.locator('.chip-time').innerText()).trim() // 例: 12分
  await page.goto(go('/lesson/0-1'))
  await expect(page.locator('.time-line strong')).toContainText(chipMin)
})

test('レッスンを完了にすると、残り時間が減る', async ({ page }) => {
  await page.goto(go('/llm'))
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  const remaining = async () => (await page.locator('main .time-line strong').first().innerText()).trim()
  const before = await remaining()
  await page.goto(go('/lesson/0-1'))
  await page.getByRole('button', { name: 'このレッスンを完了にする' }).click()
  await page.goto(go('/llm'))
  expect(await remaining()).not.toBe(before)
})
