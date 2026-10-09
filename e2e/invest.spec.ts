import { expect, test } from '@playwright/test'
import { arr, futureValue, irr, npv, payback, presentValue, profitabilityIndex } from '../src/data/invest'

// 投資の判断(経営-5)。OpenStax の管理会計の教科書の例の値と、別実装(Python)の値と照合する。
test.describe('投資の判断の式', () => {
  test('回収期間: 150,000 ÷ 20,000 = 7.5 年。均等でない場合は年の途中を按分する(40,000 → 5.33 年)', () => {
    expect(payback(150000, Array(20).fill(20000))).toBeCloseTo(7.5, 12)
    expect(payback(40000, [10000, 10000, 5000, 5000, 7500, 7500, 7500])).toBeCloseTo(5 + 2500 / 7500, 12)
    expect(payback(1000, [100, 100])).toBeNull()
  })
  test('ARR: ピアノの調律機(投資 300,000、増分の収益 200,000、費用 125,000)は 25%', () => {
    expect(arr(200000, 125000, 300000)).toBeCloseTo(0.25, 12)
    expect(arr(30000, 15000, 60000)).toBeCloseTo(0.25, 12) // Turner Printing
  })
  test('時間価値: 5,000 を 6% で 3 年 → 5,955.08。n 年後の金額の割引', () => {
    expect(futureValue(5000, 0.06, 3)).toBeCloseTo(5955.08, 2)
    expect(presentValue(5955.08, 0.06, 3)).toBeCloseTo(5000, 2)
    expect(presentValue(5000, 0.08, 3)).toBeCloseTo(3969.16, 2) // 3 年後に 5,000 が要る場合、今 3,969.16
  })
  test('NPV: X 線装置(投資 200,000、年 40,000 を 10 年、8%)。教科書の表は 6.710 で 68,400、正確には 68,403', () => {
    const flows = Array(10).fill(40000)
    expect(npv(0.08, 200000, flows)).toBeCloseTo(68403.26, 2)
    expect(profitabilityIndex(0.08, 200000, flows)).toBeCloseTo(1.342, 3)
    expect(payback(200000, flows)).toBe(5)
  })
  test('NPV: 郵便料金計器(投資 135,000、年 40,000 を 5 年、10%)は 16,6xx', () => {
    expect(npv(0.1, 135000, Array(5).fill(40000))).toBeCloseTo(16631.47, 1)
  })
  test('IRR: 投資 312,000、年 49,944 を 9 年 → 約 8%。NPV が 0 になる率', () => {
    const r = irr(312000, Array(9).fill(49944)) as number
    expect(r).toBeCloseTo(0.08, 3)
    expect(npv(r, 312000, Array(9).fill(49944))).toBeCloseTo(0, 6)
    expect(irr(30000, Array(5).fill(10000)) as number).toBeCloseTo(0.1986, 4) // 教科書の 19.86%
    expect(npv(0.08, 30000, Array(5).fill(10000))).toBeCloseTo(9927.1, 1) // 教科書の +9,927
  })
  test('レッスンの例: 投資 1,000(万円)。A は年 400 を 3 年、B は年 250 を 8 年', () => {
    const A = Array(3).fill(400)
    const B = Array(8).fill(250)
    expect([payback(1000, A), payback(1000, B)]).toEqual([2.5, 4])
    expect(npv(0.08, 1000, A)).toBeCloseTo(30.84, 2)
    expect(npv(0.08, 1000, B)).toBeCloseTo(436.66, 2)
    expect(irr(1000, A) as number).toBeCloseTo(0.0970, 4)
    expect(irr(1000, B) as number).toBeCloseTo(0.1862, 4)
    expect(npv(0.12, 1000, A)).toBeCloseTo(-39.27, 2) // 割引率を 12% に見積もり直すと、A の NPV は負
    expect(npv(0.12, 1000, B)).toBeCloseTo(241.91, 2)
    expect(npv(0, 1000, A)).toBe(200) // 割り引かなければ、単純な合計
  })
})
