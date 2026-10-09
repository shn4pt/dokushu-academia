import { expect, test } from '@playwright/test'
import { expectedCounts, ppv } from '../src/data/ppv'
import { go, expect as pageExpect, test as pageTest } from './fixtures'

// Ioannidis (2005) の PPV の式と、レッスン(根拠-3)の表・デモの照合。
test.describe('PPV の式', () => {
  test('手計算: R=1/10、検出力 80%、α=0.05 なら、0.08 / 0.13 = 約 61.5%', () => {
    expect(ppv(0.1, 0.8, 0.05)).toBeCloseTo(0.08 / 0.13, 12)
  })

  test('レッスンの表(α=0.05): 検出力 80% / 20% × 1:1・1:10・1:100', () => {
    const table: [number, number, number][] = [[1, 94, 80], [10, 62, 29], [100, 14, 4]]
    for (const [N, p80, p20] of table) {
      expect(Math.round(ppv(1 / N, 0.8, 0.05) * 100), `1:${N} 検出力80`).toBe(p80)
      expect(Math.round(ppv(1 / N, 0.2, 0.05) * 100), `1:${N} 検出力20`).toBe(p20)
    }
  })

  test('自然な頻度での内訳(1,000 個)から数えた割合と、式の値が一致する', () => {
    for (const [N, power, alpha] of [[1, 0.8, 0.05], [10, 0.8, 0.05], [100, 0.2, 0.05], [30, 0.5, 0.01], [1000, 0.99, 0.1]] as const) {
      const c = expectedCounts(1000, 1 / N, power, alpha)
      expect(c.truePositive / c.significant, `1:${N}`).toBeCloseTo(ppv(1 / N, power, alpha), 12)
      expect(c.trueN + c.falseN).toBeCloseTo(1000, 9)
    }
  })

  test('性質: R が小さいほど PPV は低い。検出力が低いほど低い。α が小さいほど高い。(1-β)R > α なら 0.5 より大きい', () => {
    expect(ppv(0.01, 0.8, 0.05)).toBeLessThan(ppv(0.1, 0.8, 0.05))
    expect(ppv(0.1, 0.2, 0.05)).toBeLessThan(ppv(0.1, 0.8, 0.05))
    expect(ppv(0.1, 0.8, 0.01)).toBeGreaterThan(ppv(0.1, 0.8, 0.05))
    for (const [R, power, alpha] of [[0.1, 0.8, 0.05], [0.05, 0.8, 0.05], [1, 0.2, 0.05], [0.2, 0.9, 0.1]] as const) {
      expect(ppv(R, power, alpha) > 0.5, `${R} ${power} ${alpha}`).toBe(power * R > alpha) // 論文: 本当である確率が偽より大きい条件は (1-β)R > α
    }
  })

  test('検出力 100% なら PPV = R / (R + α)', () => {
    expect(ppv(0.1, 1, 0.05)).toBeCloseTo(0.1 / 0.15, 12)
  })
})

pageTest('PPV のデモ: 初期値(1 : 10、検出力 80%、有意水準 0.05)で 61.5%。内訳は 90.9 / 909.1、72.7、45.5', async ({ page }) => {
  await page.goto(go('/lesson/e-3'))
  const lab = page.locator('.ppv-lab')
  await pageExpect(lab.locator('#ppv-ppv')).toHaveText('61.5%')
  await pageExpect(lab.locator('#ppv-split')).toHaveText('90.9 / 909.1')
  await pageExpect(lab.locator('#ppv-tp')).toHaveText('72.7')
  await pageExpect(lab.locator('#ppv-fp')).toHaveText('45.5')
  await lab.locator('input[type=range]').nth(0).fill('5') // 1 : 100
  await pageExpect(lab.locator('#ppv-ppv')).toHaveText('13.8%')
  await lab.locator('input[type=range]').nth(1).fill('20') // 検出力 20%
  await pageExpect(lab.locator('#ppv-ppv')).toHaveText('3.8%')
  await lab.getByLabel('有意水準').selectOption({ label: '0.01' })
  await pageExpect(lab.locator('#ppv-ppv')).not.toHaveText('3.8%')
})
