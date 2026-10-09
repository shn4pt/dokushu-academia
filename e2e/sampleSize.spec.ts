import { expect, test } from '@playwright/test'
import { nForConversion, nPerVariant, runtimeMultiplier } from '../src/data/sampleSize'
import { go, expect as pageExpect, test as pageTest } from './fixtures'

// 必要なユーザー数の目安(統計-5)。Kohavi ら(2009)の式 n = 16σ²/Δ²(検出力 90% なら 21)を、別実装(Python)の値と照合する。
test.describe('必要なユーザー数の式', () => {
  test('論文の数値例を、式から計算し直した値', () => {
    expect(Math.round(nPerVariant(30 * 30, 3.75 * 0.05))).toBe(409600) // 売上の 5% の変化
    expect(Math.round(nForConversion(0.05, 0.05))).toBe(121600)
    expect(Math.round(nForConversion(0.05, 0.05, 90))).toBe(159600)
    expect(Math.round(nForConversion(0.05, 0.2))).toBe(7600)
    expect(Math.round(nForConversion(0.5, 0.05))).toBe(6400) // チェックアウト画面だけ
  })
  test('性質: 変化を 2 倍にすると 4 分の 1。検出力 90% は 21/16 倍', () => {
    expect(nPerVariant(1, 0.2) / nPerVariant(1, 0.4)).toBeCloseTo(4, 10)
    expect(nPerVariant(1, 0.1, 90) / nPerVariant(1, 0.1, 80)).toBeCloseTo(21 / 16, 10)
  })
  test('期間の倍率 1/(4p(1−p))', () => {
    const t: [number, number][] = [[0.5, 1], [0.1, 2.7778], [0.05, 5.2632], [0.01, 25.2525]]
    for (const [p, m] of t) expect(runtimeMultiplier(p)).toBeCloseTo(m, 3)
  })
})

pageTest('必要な数のデモ: 初期値と、スライダーでの変化', async ({ page }) => {
  await page.goto(go('/lesson/st-5'))
  const lab = page.locator('.samplesize-lab')
  await pageExpect(lab.locator('#ss-n')).toHaveText(/121,?600/)
  await lab.getByRole('radio', { name: /90%/ }).check()
  await pageExpect(lab.locator('#ss-n')).toHaveText(/159,?600/)
})
