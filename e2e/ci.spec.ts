import { expect, test } from '@playwright/test'
import { ciMean95, normal, rng, simulateIntervals } from '../src/data/ci'
import { T975, tCritical975 } from '../src/data/tTable'
import { go, expect as pageExpect, test as pageTest } from './fixtures'

// 信頼区間(統計-3): NIST の t 分布の表との照合、式と例の照合、乱数の性質、「95%」の約束(シミュレーション)。
test.describe('t 分布の表', () => {
  test('NIST の表(0.975 の列)の、いくつかの値と一致する。自由度 100 まで、単調に減る', () => {
    const expected: Record<number, number> = { 1: 12.706, 2: 4.303, 4: 2.776, 5: 2.571, 9: 2.262, 10: 2.228, 19: 2.093, 29: 2.045, 30: 2.042, 50: 2.009, 60: 2.0, 99: 1.984, 100: 1.984 }
    for (const [df, t] of Object.entries(expected)) expect(tCritical975(Number(df)), `df=${df}`).toBe(t)
    expect(T975).toHaveLength(100)
    for (let i = 1; i < T975.length; i++) expect(T975[i]).toBeLessThanOrEqual(T975[i - 1])
    expect(Math.min(...T975)).toBeGreaterThan(1.96) // 正規分布の値(1.960)より、常に大きい
    expect(tCritical975(101)).toBe(1.96)
  })
})

test.describe('信頼区間の式', () => {
  test('標本 1〜5: 平均 3、標準偏差 1.5811、t = 2.776、区間は約 (1.0371, 4.9629)', () => {
    const ci = ciMean95([1, 2, 3, 4, 5])
    expect(ci.mean).toBe(3)
    expect(ci.half).toBeCloseTo((2.776 * Math.sqrt(2.5)) / Math.sqrt(5), 12)
    expect(ci.low).toBeCloseTo(1.0371, 4)
    expect(ci.high).toBeCloseTo(4.9629, 4)
  })

  test('NIST の例: N=195、平均 9.261460、標準偏差 0.022789、t=1.9723 → (9.258242, 9.264679)', () => {
    const half = (1.9723 * 0.022789) / Math.sqrt(195)
    expect(9.26146 - half).toBeCloseTo(9.258242, 5)
    expect(9.26146 + half).toBeCloseTo(9.264679, 5)
  })

  test('区間の幅は、標準偏差に比例し、N が大きいほど狭い(√N)', () => {
    const a = ciMean95([10, 12, 14, 16, 18, 20, 22, 24, 26, 28])
    const b = ciMean95([20, 24, 28, 32, 36, 40, 44, 48, 52, 56]) // 値を 2 倍 → 幅も 2 倍
    expect(b.half / a.half).toBeCloseTo(2, 9)
    const big = ciMean95([...Array(40).keys()].map((i) => i % 10))
    const small = ciMean95([...Array(10).keys()])
    expect(big.half).toBeLessThan(small.half)
  })
})

test.describe('乱数と、「95%」の約束', () => {
  test('同じ種からは、同じ列。違う種からは、違う列', () => {
    const a = rng(7), b = rng(7), c = rng(8)
    const xs = [a(), a(), a()], ys = [b(), b(), b()], zs = [c(), c(), c()]
    expect(xs).toEqual(ys)
    expect(xs).not.toEqual(zs)
    expect(xs.every((v) => v >= 0 && v < 1)).toBe(true)
  })

  test('標準正規乱数: 平均 0・標準偏差 1 に近い', () => {
    const r = rng(2024)
    const v = Array.from({ length: 100000 }, () => normal(r))
    const m = v.reduce((s, a) => s + a, 0) / v.length
    const s = Math.sqrt(v.reduce((s2, a) => s2 + (a - m) ** 2, 0) / (v.length - 1))
    expect(Math.abs(m)).toBeLessThan(0.015)
    expect(Math.abs(s - 1)).toBeLessThan(0.015)
  })

  for (const n of [5, 10, 30, 100]) {
    test(`n=${n}: 多数の標本で、真の平均を含む区間の割合が、約 95%`, () => {
      let hits = 0
      let total = 0
      for (let seed = 1; seed <= 200; seed++) {
        for (const i of simulateIntervals(seed * 7919 + n, n, 100)) { total++; if (i.covers) hits++ }
      }
      expect(Math.abs(hits / total - 0.95), `${hits}/${total}`).toBeLessThan(0.008)
    })
  }

  test('t の値の代わりに 1.96 を使うと、小さな n では、95% を下回る(t 分布の値が必要な理由)', () => {
    let hits = 0, total = 0
    for (let seed = 1; seed <= 200; seed++) {
      const r = rng(seed * 104729)
      for (let k = 0; k < 100; k++) {
        const v = Array.from({ length: 5 }, () => 50 + 10 * normal(r))
        const m = v.reduce((s, a) => s + a, 0) / 5
        const s = Math.sqrt(v.reduce((s2, a) => s2 + (a - m) ** 2, 0) / 4)
        const h = (1.96 * s) / Math.sqrt(5)
        total++; if (Math.abs(m - 50) <= h) hits++
      }
    }
    expect(hits / total).toBeLessThan(0.9) // n=5 で、1.96 を使うと、約 88%
  })
})

pageTest('信頼区間のデモ: 100 個の区間、含む個数は 95 個の前後、n を変えると幅が変わる', async ({ page }) => {
  await page.goto(go('/lesson/st-3'))
  const lab = page.locator('.ci-lab')
  await pageExpect(lab.locator('line.ci-hit, line.ci-miss')).toHaveCount(100)
  const hits = async () => Number(await lab.locator('#ci-hits').innerText())
  const misses = async () => Number(await lab.locator('#ci-misses').innerText())
  const h0 = await hits()
  expect(h0 + (await misses())).toBe(100)
  expect(h0).toBeGreaterThan(82)
  const w10 = Number(await lab.locator('#ci-width').innerText())
  await lab.getByLabel('標本の大きさ').selectOption('100')
  const w100 = Number(await lab.locator('#ci-width').innerText())
  expect(w100).toBeLessThan(w10 / 2)
  await lab.getByRole('button', { name: /取り直す/ }).click()
  await pageExpect(lab.locator('line.ci-hit, line.ci-miss')).toHaveCount(100)
  expect((await hits()) + (await misses())).toBe(100)
})
