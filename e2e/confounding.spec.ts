import { expect, test } from '@playwright/test'
import { confounding } from '../src/data/confounding'
import { go, expect as pageExpect, test as pageTest } from './fixtures'

// 交絡のデモ(統計-6)の式を、手計算(別実装)の値と照合する。
const base = { pL: 0.5, a1: 0.8, a0: 0.2, base: 0.1, gamma: 0.4, tau: -0.1 }
test.describe('交絡の式', () => {
  test('初期値: 単純な比較 +0.14、調整 −0.10', () => {
    const r = confounding(base)
    expect(r.naive).toBeCloseTo(0.14, 10)
    expect(r.adjusted).toBeCloseTo(-0.1, 10)
    expect(r.pLgivenA1).toBeCloseTo(0.8, 10)
    expect(r.pLgivenA0).toBeCloseTo(0.2, 10)
  })
  test('別の設定', () => {
    const r = confounding({ pL: 0.3, a1: 0.9, a0: 0.1, base: 0.1, gamma: 0.3, tau: -0.05 })
    expect(r.naive).toBeCloseTo(0.1746, 4)
    expect(r.pLgivenA1).toBeCloseTo(0.79412, 5)
    expect(r.pLgivenA0).toBeCloseTo(0.04545, 5)
    expect(r.adjusted).toBeCloseTo(-0.05, 10)
  })
  test('処置を受ける確率が、重症度で同じなら、単純な比較は本当の効果に一致する', () => {
    expect(confounding({ ...base, a1: 0.5, a0: 0.5 }).naive).toBeCloseTo(-0.1, 10)
  })
  test('重症度の影響 γ が 0 でも、一致する', () => {
    expect(confounding({ ...base, gamma: 0 }).naive).toBeCloseTo(-0.1, 10)
  })
})

pageTest('交絡のデモ: 初期値で、単純な比較は有害に見える。測っていないと調整できない', async ({ page }) => {
  await page.goto(go('/lesson/st-6'))
  const lab = page.locator('.confound-lab')
  await pageExpect(lab.locator('#cf-naive')).toContainText('14')
  await pageExpect(lab.locator('#cf-adjusted')).toContainText('10')
  await pageExpect(lab.locator('#cf-note')).toContainText('有害に見えます')
  await lab.getByLabel('重症度を、測っている').uncheck()
  await pageExpect(lab.locator('#cf-adjusted')).toContainText('できない')
})
