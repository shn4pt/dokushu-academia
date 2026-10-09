import { expect, test } from '@playwright/test'
import { datasets, summarize } from '../src/data/anscombe'

// Anscombe の 4 組のデータと、レッスンに載せた要約の数字の照合。
// 本体(summarize)とは別の式(正規方程式・E[x²]-E[x]² による分散・標準偏差による相関)で、手計算と同じ値になることを確かめる。
const sum = (v: number[]) => v.reduce((s, a) => s + a, 0)
function independent(pts: { x: number; y: number }[]) {
  const n = pts.length
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const sx = sum(xs), sy = sum(ys)
  const sxx = sum(xs.map((a) => a * a)), syy = sum(ys.map((a) => a * a)), sxy = sum(pts.map((p) => p.x * p.y))
  const varX = (sxx - (sx * sx) / n) / (n - 1)
  const varY = (syy - (sy * sy) / n) / (n - 1)
  const cov = (sxy - (sx * sy) / n) / (n - 1)
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx) // 正規方程式
  const intercept = (sy - slope * sx) / n
  return { meanX: sx / n, meanY: sy / n, varX, varY, r: cov / Math.sqrt(varX * varY), slope, intercept }
}

test.describe('Anscombe の 4 組', () => {
  test('データの写し間違いがない(各組の合計と、y の 2 乗和)', () => {
    // 公開データセット(seaborn-data の anscombe.csv)から、別の手段で数えた値
    const expected: Record<string, [number, number, number]> = { I: [99, 82.51, 660.1727], II: [99, 82.51, 660.1763], III: [99, 82.5, 659.9762], IV: [99, 82.51, 660.1325] }
    for (const d of datasets) {
      expect(d.points).toHaveLength(11)
      expect(sum(d.points.map((p) => p.x))).toBeCloseTo(expected[d.id][0], 6)
      expect(sum(d.points.map((p) => p.y))).toBeCloseTo(expected[d.id][1], 6)
      expect(sum(d.points.map((p) => p.y * p.y))).toBeCloseTo(expected[d.id][2], 3)
    }
  })

  test('要約の数字が、レッスンの表と一致する(4 組とも、ほぼ同じ)', () => {
    for (const d of datasets) {
      const s = summarize(d.points)
      expect(s.meanX).toBeCloseTo(9, 10)
      expect(s.meanY).toBeCloseTo(7.5, 2)
      expect(s.varX).toBeCloseTo(11, 10)
      expect(s.varY).toBeGreaterThan(4.12)
      expect(s.varY).toBeLessThan(4.13)
      expect(s.r).toBeGreaterThan(0.8161)
      expect(s.r).toBeLessThan(0.8166)
      expect(s.intercept).toBeCloseTo(3, 2)
      expect(s.slope).toBeCloseTo(0.5, 2)
    }
  })

  test('別の式での計算と一致する', () => {
    for (const d of datasets) {
      const a = summarize(d.points)
      const b = independent(d.points)
      for (const k of ['meanX', 'meanY', 'varX', 'varY', 'r', 'slope', 'intercept'] as const) expect(a[k], `${d.id}.${k}`).toBeCloseTo(b[k], 8)
    }
  })

  test('組 III から外れ値(13, 12.74)を除くと、傾き約 0.345、相関係数はほぼ 1', () => {
    const iii = datasets.find((d) => d.id === 'III')!
    expect(iii.points.some((p) => p.x === 13 && p.y === 12.74)).toBe(true)
    const s = summarize(iii.points.filter((p) => !(p.x === 13 && p.y === 12.74)))
    expect(s.slope).toBeCloseTo(0.3454, 3)
    expect(s.r).toBeGreaterThan(0.9999)
  })

  test('組 IV は、x が 8 の 10 点と、x が 19 の 1 点。1 点を除くと、x の分散が 0 で、回帰直線が決まらない', () => {
    const iv = datasets.find((d) => d.id === 'IV')!
    expect(new Set(iv.points.map((p) => p.x))).toEqual(new Set([8, 19]))
    expect(iv.points.filter((p) => p.x === 19)).toHaveLength(1)
    const s = summarize(iv.points.filter((p) => p.x !== 19))
    expect(s.varX).toBe(0)
    expect(Number.isFinite(s.slope)).toBe(false)
  })

  test('4 組の y の中央値は 7.58・8.14・7.11・7.04(平均は同じでも、中央値は違う)', () => {
    const med = (v: number[]) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)] // 11 個なので、真ん中
    expect(datasets.map((d) => med(d.points.map((p) => p.y)))).toEqual([7.58, 8.14, 7.11, 7.04])
  })
})
