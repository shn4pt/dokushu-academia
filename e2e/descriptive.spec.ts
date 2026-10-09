import { expect, test } from '@playwright/test'
import { mad, mean, median, range, sd, variance } from '../src/data/descriptive'
import { go, test as pageTest } from './fixtures'

// 記述統計(統計-2)。手計算(Python の statistics で出した値)と、別の式での計算で、照合する。
const base = [48, 50, 51, 52, 53, 54, 55, 57, 60]
const near = (a: number, b: number, d = 5e-5) => expect(Math.abs(a - b), `${a} vs ${b}`).toBeLessThan(d)

test.describe('記述統計', () => {
  test('9 個の値: 平均 53.3333、中央値 53、標準偏差 3.6742、範囲 12、MAD 2', () => {
    near(mean(base), 53.3333); expect(median(base)).toBe(53); near(sd(base), 3.6742); expect(range(base)).toBe(12); expect(mad(base)).toBe(2)
  })

  test('10 個目を足したときの、レッスンの数字(56・100・200・40)', () => {
    const table: [number, number, number, number, number, number][] = [
      [56, 53.6, 53.5, 3.5653, 12, 2.5],
      [100, 58, 53.5, 15.1584, 52, 3],
      [200, 68, 53.5, 46.5093, 152, 3],
      [40, 52, 52.5, 5.4569, 20, 2.5],
    ]
    for (const [x, m, med, s, r, d] of table) {
      const v = [...base, x]
      near(mean(v), m); near(median(v), med); near(sd(v), s); expect(range(v)).toBe(r); near(mad(v), d)
    }
  })

  test('別の式: 分散 = (Σx² − (Σx)²/N)/(N − 1)。標準偏差は、分散の平方根(N − 1 で割る)', () => {
    for (const v of [base, [...base, 200], [1, 2, 3, 4, 5], [10, 10, 10, 11]]) {
      const n = v.length
      const alt = (v.reduce((s, a) => s + a * a, 0) - v.reduce((s, a) => s + a, 0) ** 2 / n) / (n - 1)
      expect(variance(v)).toBeCloseTo(alt, 9)
      expect(sd(v)).toBeCloseTo(Math.sqrt(alt), 9)
    }
    expect(variance([1, 2, 3, 4, 5])).toBe(2.5) // 10 / 4
  })

  test('性質: 値が全部同じなら、ばらつきは 0。中央値は、偶数個・奇数個の両方', () => {
    expect([sd([7, 7, 7]), range([7, 7, 7]), mad([7, 7, 7])]).toEqual([0, 0, 0])
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  test('極端な値を 1 つ足すと、平均・標準偏差・範囲は大きく動き、中央値と MAD は、あまり動かない', () => {
    const a = [...base, 56]
    const b = [...base, 200]
    expect(mean(b) - mean(a)).toBeGreaterThan(10)
    expect(sd(b) / sd(a)).toBeGreaterThan(10)
    expect(median(b) - median(a)).toBe(0)
    expect(mad(b) - mad(a)).toBeLessThan(1)
  })
})

pageTest('ばらつきのデモ: 初期値と、10 個目を 200 にしたときの数字', async ({ page }) => {
  await page.goto(go('/lesson/st-2'))
  const lab = page.locator('.spread-lab')
  const vals = async () => [await lab.locator('#sp-mean').innerText(), await lab.locator('#sp-median').innerText(), await lab.locator('#sp-sd').innerText(), await lab.locator('#sp-range').innerText(), await lab.locator('#sp-mad').innerText()]
  expect(await vals()).toEqual(['53.60', '53.50', '3.57', '12.00', '2.50'])
  await lab.locator('input[type=range]').fill('200')
  expect(await vals()).toEqual(['68.00', '53.50', '46.51', '152.00', '3.00'])
  await lab.locator('input[type=range]').fill('40')
  expect(await vals()).toEqual(['52.00', '52.50', '5.46', '20.00', '2.50'])
})
