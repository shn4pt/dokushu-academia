import { expect, test } from '@playwright/test'
import { peekFalsePositiveRate } from '../src/data/peek'
import { go, expect as pageExpect, test as pageTest } from './fixtures'

// 結果を見る回数と、第 1 種の誤り(統計-5)。別実装(Python、20 万回)の値: K=1 0.0494, 2 0.0837, 5 0.1415, 10 0.1950, 20 0.2476, 50 0.3186
test.describe('結果を見ながら続けたときの、誤って有意になる割合', () => {
  test('モンテカルロの値が、別実装の値と近い', () => {
    const ref: [number, number][] = [[1, 0.0494], [2, 0.0837], [5, 0.1415], [10, 0.195], [20, 0.2476], [50, 0.3186]]
    for (const [k, v] of ref) expect(Math.abs(peekFalsePositiveRate(7 + k, k, 20000) - v), `K=${k}`).toBeLessThan(0.012)
  })
  test('見る回数が増えるほど、割合は増える', () => {
    const r = [1, 2, 5, 10, 20, 50].map((k) => peekFalsePositiveRate(100 + k, k, 20000))
    for (let i = 1; i < r.length; i++) expect(r[i]).toBeGreaterThan(r[i - 1])
  })
  test('同じ種なら、同じ値(再現できる)', () => {
    expect(peekFalsePositiveRate(5, 5, 2000)).toBe(peekFalsePositiveRate(5, 5, 2000))
  })
})

pageTest('結果を見る回数のデモ: 1 回なら約 5%、50 回なら 30% 台', async ({ page }) => {
  await page.goto(go('/lesson/st-5'))
  const lab = page.locator('.peek-lab')
  const rate = async () => parseFloat((await lab.locator('#peek-rate').innerText()).replace('%', ''))
  await lab.getByLabel('結果を見る回数').fill('0')
  await pageExpect(lab.locator('#peek-rate')).toHaveText(/^[3-7]\.\d%$/)
  await lab.getByLabel('結果を見る回数').fill('5')
  expect(await rate()).toBeGreaterThan(28)
})
