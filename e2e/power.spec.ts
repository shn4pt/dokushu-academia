import { expect, test } from '@playwright/test'
import { normal, rng } from '../src/data/ci'
import { Phi, power } from '../src/data/power'
import { go, expect as pageExpect, test as pageTest } from './fixtures'

// 検出力と、検定の誤り(統計-4)。手計算(Python の math.erf)と、モンテカルロ・シミュレーションで照合する。
test.describe('標準正規分布の累積分布関数', () => {
  test('Python の erf から出した値と一致する(誤差 2e-7 以内)', () => {
    const table: [number, number][] = [[0, 0.5], [1.96, 0.975002105], [-0.5, 0.308537539], [2.5, 0.993790335], [-3, 0.001349898]]
    for (const [x, p] of table) expect(Math.abs(Phi(x) - p), `Phi(${x})`).toBeLessThan(2e-7)
  })
})

test.describe('検出力の式', () => {
  test('手計算の値(有意水準 α、差の大きさ δ/σ、標本の大きさ n)', () => {
    const table: [number, number, number, number][] = [
      [0.5, 30, 0.05, 0.781897], [0.2, 30, 0.05, 0.194765], [1.0, 10, 0.05, 0.885372], [0.5, 100, 0.01, 0.992325],
      [0.5, 30, 0.1, 0.862943], [0.1, 5, 0.05, 0.055743], [1.5, 500, 0.05, 1],
    ]
    for (const [d, n, a, p] of table) expect(Math.abs(power(d, n, a) - p), `d=${d} n=${n} α=${a}`).toBeLessThan(5e-7)
  })

  test('差が 0 のときの、棄却の確率は、有意水準(第 1 種の誤り)と、ほぼ等しい', () => {
    expect(Math.abs(power(0, 30, 0.05) - 0.05)).toBeLessThan(1e-3)
    expect(Math.abs(power(0, 30, 0.01) - 0.01)).toBeLessThan(1e-3)
    expect(Math.abs(power(0, 30, 0.1) - 0.1)).toBeLessThan(2e-3)
  })

  test('性質: 差が大きいほど・n が大きいほど、検出力は高い。α を厳しくすると低い', () => {
    expect(power(0.8, 30, 0.05)).toBeGreaterThan(power(0.5, 30, 0.05))
    expect(power(0.5, 100, 0.05)).toBeGreaterThan(power(0.5, 30, 0.05))
    expect(power(0.5, 30, 0.01)).toBeLessThan(power(0.5, 30, 0.05)) // 第 2 種の誤り β が、増える
    expect(1 - power(0.5, 30, 0.01)).toBeGreaterThan(1 - power(0.5, 30, 0.05))
  })

  test('モンテカルロ: 同じ検定を何度も行った、棄却の割合が、式と一致する', () => {
    const run = (d: number, n: number, z: number, trials: number, seed: number) => {
      const r = rng(seed)
      let rej = 0
      for (let k = 0; k < trials; k++) {
        let s = 0
        for (let i = 0; i < n; i++) s += d + normal(r) // σ = 1。真の平均は μ0 から d だけずれている
        const Z = s / n / (1 / Math.sqrt(n))
        if (Math.abs(Z) > z) rej++
      }
      return rej / trials
    }
    expect(Math.abs(run(0.5, 30, 1.96, 20000, 11) - power(0.5, 30, 0.05))).toBeLessThan(0.013) // 約 78%
    expect(Math.abs(run(0.2, 30, 1.96, 20000, 12) - power(0.2, 30, 0.05))).toBeLessThan(0.013) // 約 19%
    expect(Math.abs(run(0, 30, 1.96, 20000, 13) - 0.05)).toBeLessThan(0.008) // 第 1 種の誤り
  })

  test('検定を 20 回行ったとき(独立、すべて帰無仮説が正しい)、少なくとも 1 回、有意になる確率は約 64%', () => {
    expect(1 - 0.95 ** 20).toBeCloseTo(0.641514, 5)
    const r = rng(99)
    let atLeastOne = 0
    const trials = 20000
    for (let k = 0; k < trials; k++) {
      for (let j = 0; j < 20; j++) if (Math.abs(normal(r)) > 1.96) { atLeastOne++; break }
    }
    expect(Math.abs(atLeastOne / trials - (1 - 0.95 ** 20))).toBeLessThan(0.012)
  })
})

pageTest('検出力のデモ: 初期値(差 0.5、n=30、α=0.05)で 78.2%。差・n・α を変える', async ({ page }) => {
  await page.goto(go('/lesson/st-4'))
  const lab = page.locator('.power-lab')
  await pageExpect(lab.locator('#pw-power')).toHaveText('78.2%')
  await pageExpect(lab.locator('#pw-beta')).toHaveText('21.8%')
  await lab.locator('input[type=range]').nth(0).fill('0.2')
  await pageExpect(lab.locator('#pw-power')).toHaveText('19.5%')
  await lab.locator('input[type=range]').nth(0).fill('0.5')
  await lab.getByLabel('有意水準').selectOption('0.01')
  await pageExpect(lab.locator('#pw-power')).toHaveText('56.5%') // (0.5, 30, 0.01)
  await lab.locator('input[type=range]').nth(1).fill('5') // n = 100
  await pageExpect(lab.locator('#pw-power')).toHaveText('99.2%')
})
