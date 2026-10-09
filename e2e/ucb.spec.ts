import { expect, test } from '@playwright/test'
import { counts, depts, tally } from '../src/data/ucb'
import { go, expect as pageExpect, test as pageTest } from './fixtures'

// バークレーの入学データと、レッスン(根拠-2)に載せた数字の照合。別の実装(行ごとの表から集計)で、同じ値になることを確かめる。
// 行は、公開データセット(Rdatasets の UCBAdmissions.csv)の値を、そのまま書き写したもの。
const rows: [string, 'Male' | 'Female', 'Admitted' | 'Rejected', number][] = [
  ['A', 'Male', 'Admitted', 512], ['A', 'Male', 'Rejected', 313], ['A', 'Female', 'Admitted', 89], ['A', 'Female', 'Rejected', 19],
  ['B', 'Male', 'Admitted', 353], ['B', 'Male', 'Rejected', 207], ['B', 'Female', 'Admitted', 17], ['B', 'Female', 'Rejected', 8],
  ['C', 'Male', 'Admitted', 120], ['C', 'Male', 'Rejected', 205], ['C', 'Female', 'Admitted', 202], ['C', 'Female', 'Rejected', 391],
  ['D', 'Male', 'Admitted', 138], ['D', 'Male', 'Rejected', 279], ['D', 'Female', 'Admitted', 131], ['D', 'Female', 'Rejected', 244],
  ['E', 'Male', 'Admitted', 53], ['E', 'Male', 'Rejected', 138], ['E', 'Female', 'Admitted', 94], ['E', 'Female', 'Rejected', 299],
  ['F', 'Male', 'Admitted', 22], ['F', 'Male', 'Rejected', 351], ['F', 'Female', 'Admitted', 24], ['F', 'Female', 'Rejected', 317],
]
const sum = (f: (r: (typeof rows)[number]) => boolean) => rows.filter(f).reduce((s, r) => s + r[3], 0)

test.describe('バークレーのデータ', () => {
  test('データを、行の表と、1 つずつ照合する', () => {
    for (const [d, g, a, n] of rows) expect(counts[d as 'A'][g === 'Male' ? 'male' : 'female'][a === 'Admitted' ? 'admitted' : 'rejected'], `${d} ${g} ${a}`).toBe(n)
    expect(sum(() => true)).toBe(4526) // データセットの説明にある総数
  })

  test('全体: 男性 1,198 / 2,691(44.5%)、女性 557 / 1,835(30.4%)(データセットの説明と同じ)', () => {
    const m = tally('male'), f = tally('female')
    expect([m.applicants, m.admitted, f.applicants, f.admitted]).toEqual([2691, 1198, 1835, 557])
    expect((m.rate * 100).toFixed(1)).toBe('44.5')
    expect((f.rate * 100).toFixed(1)).toBe('30.4')
    expect(sum((r) => r[1] === 'Male')).toBe(2691)
    expect(sum((r) => r[1] === 'Female')).toBe(1835)
  })

  test('学科ごと: 本文の表の数字(合格率・応募者)', () => {
    const expected: Record<string, [string, string, string, number, number]> = {
      A: ['64.4', '62.1', '82.4', 825, 108], B: ['63.2', '63.0', '68.0', 560, 25], C: ['35.1', '36.9', '34.1', 325, 593],
      D: ['34.0', '33.1', '34.9', 417, 375], E: ['25.2', '27.7', '23.9', 191, 393], F: ['6.4', '5.9', '7.0', 373, 341],
    }
    for (const d of depts) {
      const m = tally('male', [d]), f = tally('female', [d])
      const all = (m.admitted + f.admitted) / (m.applicants + f.applicants)
      const e = expected[d]
      expect([(all * 100).toFixed(1), (m.rate * 100).toFixed(1), (f.rate * 100).toFixed(1), m.applicants, f.applicants], d).toEqual(e)
    }
  })

  test('6 学科のうち 4 学科(A・B・D・F)で女性の合格率が高く、C と E は男性が高い。差は 3〜4 ポイントほど', () => {
    const higher = depts.filter((d) => tally('female', [d]).rate > tally('male', [d]).rate)
    expect(higher).toEqual(['A', 'B', 'D', 'F'])
    for (const d of ['C', 'E'] as const) {
      const diff = (tally('male', [d]).rate - tally('female', [d]).rate) * 100
      expect(diff).toBeGreaterThan(2.5)
      expect(diff).toBeLessThan(4)
    }
  })

  test('応募の分布: 学科 A・B への応募は、男性の 51.5%(1,385 人)、女性の 7.2%(133 人)', () => {
    const ab = (s: 'male' | 'female') => tally(s, ['A', 'B']).applicants
    expect([ab('male'), ab('female')]).toEqual([1385, 133])
    expect(((ab('male') / tally('male').applicants) * 100).toFixed(1)).toBe('51.5')
    expect(((ab('female') / tally('female').applicants) * 100).toFixed(1)).toBe('7.2')
    expect(((tally('female', ['C', 'D', 'E', 'F']).applicants / tally('female').applicants) * 100).toFixed(1)).toBe('92.8')
  })

  test('学科 A・B の合格率は 63〜64%、C〜F は 6〜35%', () => {
    const rate = (d: 'A') => (tally('male', [d]).admitted + tally('female', [d]).admitted) / (tally('male', [d]).applicants + tally('female', [d]).applicants)
    expect([rate('A'), rate('B' as 'A')].map((r) => Math.round(r * 100))).toEqual([64, 63])
    const others = (['C', 'D', 'E', 'F'] as const).map((d) => rate(d as 'A') * 100)
    expect(Math.min(...others)).toBeCloseTo(6.4, 1)
    expect(Math.max(...others)).toBeCloseTo(35.1, 1)
  })
})

pageTest('バークレーのデモ: 全体では男性、学科 A では女性、学科 C では男性が高い', async ({ page }) => {
  await page.goto(go('/lesson/e-2'))
  const demo = page.locator('.ucb-demo')
  await pageExpect(demo.locator('#ucb-male-rate')).toHaveText('44.5%')
  await pageExpect(demo.locator('#ucb-female-rate')).toHaveText('30.4%')
  await pageExpect(demo.locator('#ucb-verdict')).toContainText('男性')
  await demo.getByLabel('学科 A').check()
  await pageExpect(demo.locator('#ucb-male-rate')).toHaveText('62.1%')
  await pageExpect(demo.locator('#ucb-female-rate')).toHaveText('82.4%')
  await pageExpect(demo.locator('#ucb-verdict')).toContainText('女性')
  await demo.getByLabel('学科 C').check()
  await pageExpect(demo.locator('#ucb-verdict')).toContainText('男性')
  await pageExpect(demo.locator('#ucb-female-n')).toHaveText('593')
})
