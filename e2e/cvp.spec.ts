import { expect, test } from '@playwright/test'
import { cvp } from '../src/data/cvp'
import { go, expect as pageExpect, test as pageTest } from './fixtures'

// 費用・数量・利益(経営-2)。OpenStax の管理会計の教科書の例の値と、別実装(Python)の値と照合する。
test.describe('CVP の式', () => {
  test('Hicks(価格 100、変動費 20、固定費 18,000): 損益分岐点 225 個、22,500', () => {
    const r = cvp({ price: 100, vc: 20, fc: 18000, units: 225 })
    expect(r.cmUnit).toBe(80)
    expect(r.cmRatio).toBeCloseTo(0.8, 12)
    expect(r.breakEvenUnits).toBe(225)
    expect(r.breakEvenRevenue).toBeCloseTo(22500, 8)
    expect(r.income).toBe(0)
  })
  test('Hicks: 175 個で 4,000 の損失。目標利益 16,000 なら 425 個', () => {
    expect(cvp({ price: 100, vc: 20, fc: 18000, units: 175 }).income).toBe(-4000)
    expect(cvp({ price: 100, vc: 20, fc: 18000, units: 0 }).targetUnits(16000)).toBe(425)
  })
  test('安全余裕の例(価格 90、変動費 40、固定費 85,000、2,500 個): 72,000、32%', () => {
    const r = cvp({ price: 90, vc: 40, fc: 85000, units: 2500 })
    expect(r.breakEvenUnits).toBe(1700)
    expect(r.breakEvenRevenue).toBeCloseTo(153000, 6)
    expect(r.marginOfSafety).toBeCloseTo(72000, 6)
    expect(r.marginOfSafetyPct).toBeCloseTo(0.32, 10)
  })
  test('Wallace: 貢献利益 58,560、営業利益 24,400 → レバレッジ度 2.4、売上 5% 増で営業利益 12% 増', () => {
    expect(58560 / 24400).toBeCloseTo(2.4, 10)
    expect((58560 / 24400) * 5).toBeCloseTo(12, 10)
  })
  test('レッスンの例: 会社 X と Y(同じ利益 2 万円、固定費の大きさが違う)', () => {
    const x = cvp({ price: 100, vc: 60, fc: 20000, units: 1000 })
    const y = cvp({ price: 100, vc: 40, fc: 40000, units: 1000 })
    expect(x.income).toBe(20000)
    expect(y.income).toBe(20000)
    expect(x.dol).toBeCloseTo(2, 12)
    expect(y.dol).toBeCloseTo(3, 12)
    expect(x.breakEvenUnits).toBe(500)
    expect(y.breakEvenUnits).toBeCloseTo(666.667, 3)
    for (const [u, ix, iy] of [[1100, 24000, 26000], [900, 16000, 14000]] as const) {
      expect(cvp({ price: 100, vc: 60, fc: 20000, units: u }).income).toBe(ix)
      expect(cvp({ price: 100, vc: 40, fc: 40000, units: u }).income).toBe(iy)
    }
  })
  test('部品の初期値: 貢献利益 400、損益分岐点 500 個、700 個で営業利益 80,000', () => {
    const r = cvp({ price: 1000, vc: 600, fc: 200000, units: 700 })
    expect([r.cmUnit, r.breakEvenUnits, r.income]).toEqual([400, 500, 80000])
    expect(r.dol).toBeCloseTo(3.5, 12)
  })
  test('レッスンの例: 低価格の会社 L と差別化の会社 D(経営-4)', () => {
    const L = (units: number) => cvp({ price: 80, vc: 56, fc: 240000, units })
    const D = (units: number) => cvp({ price: 140, vc: 70, fc: 560000, units })
    expect([L(0).cmUnit, L(0).breakEvenUnits, D(0).cmUnit, D(0).breakEvenUnits]).toEqual([24, 10000, 70, 8000])
    expect([L(10000).income, D(10000).income, L(20000).income, D(20000).income]).toEqual([0, 140000, 240000, 840000])
  })
  test('貢献利益が 0 以下なら、損益分岐点はなし', () => {
    expect(cvp({ price: 100, vc: 100, fc: 1000, units: 10 }).breakEvenUnits).toBeNull()
    expect(cvp({ price: 100, vc: 120, fc: 1000, units: 10 }).breakEvenRevenue).toBeNull()
  })
  test('性質: 固定費の合計は変わらず、1 個あたりは下がる(総費用 = 固定費 + 変動費 × 数)', () => {
    for (const u of [10, 100, 1000]) {
      const r = cvp({ price: 50, vc: 20, fc: 3000, units: u })
      expect(50 * u - (3000 + 20 * u)).toBeCloseTo(r.income, 8)
    }
  })
})

pageTest('損益分岐点のデモ: 初期値と、固定費を動かしたとき', async ({ page }) => {
  await page.goto(go('/lesson/sg-2'))
  const lab = page.locator('.breakeven-lab')
  await pageExpect(lab.locator('#be-units')).toHaveText('500 個')
  await pageExpect(lab.locator('#be-income')).toContainText('80,000')
  await pageExpect(lab.locator('#be-dol')).toHaveText('3.50')
  await lab.getByLabel('月の固定費').fill('400000') // 損益分岐点 1000 個、700 個では赤字
  await pageExpect(lab.locator('#be-units')).toHaveText('1000 個')
  await pageExpect(lab.locator('#be-income')).toContainText('−120,000')
  await pageExpect(lab.locator('#be-dol')).toContainText('なし')
  await lab.getByLabel('1 個あたりの変動費').fill('1000')
  await pageExpect(lab.locator('#be-units')).toContainText('なし')
})
