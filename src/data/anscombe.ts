// Anscombe の 4 組のデータ(Anscombe, 1973, The American Statistician 27(1):17-21 にもとづく、統計の例題として広く使われるデータ)。
// 値は、公開されているデータセット(seaborn-data の anscombe.csv)から取った。論文の本文は読んでいない。
// 要約の値(平均・分散・相関・回帰直線)は、下の関数で計算する。手計算(別の実装)との照合は、e2e/anscombe.spec.ts にある。
export type Point = { x: number; y: number }
export type Dataset = { id: 'I' | 'II' | 'III' | 'IV'; points: Point[]; note: string }

const mk = (xs: number[], ys: number[]): Point[] => xs.map((x, i) => ({ x, y: ys[i] }))
const X123 = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5]

export const datasets: Dataset[] = [
  { id: 'I', points: mk(X123, [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68]), note: 'ばらつきのある、ふつうの直線的な関係' },
  { id: 'II', points: mk(X123, [9.14, 8.14, 8.74, 8.77, 9.26, 8.1, 6.13, 3.1, 9.13, 7.26, 4.74]), note: '直線ではなく、曲線(山のかたち)' },
  { id: 'III', points: mk(X123, [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73]), note: '1点だけ、直線から大きく外れている' },
  { id: 'IV', points: mk([8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8], [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.5, 5.56, 7.91, 6.89]), note: '1点だけ、x が大きく離れている(ほかは x が同じ)' },
]

export const mean = (v: number[]) => v.reduce((s, a) => s + a, 0) / v.length
/** 標本分散(n-1 で割る) */
export const variance = (v: number[]) => {
  const m = mean(v)
  return v.reduce((s, a) => s + (a - m) ** 2, 0) / (v.length - 1)
}

export function summarize(points: Point[]) {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const mx = mean(xs)
  const my = mean(ys)
  const sxx = xs.reduce((s, a) => s + (a - mx) ** 2, 0)
  const syy = ys.reduce((s, b) => s + (b - my) ** 2, 0)
  const sxy = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0)
  const slope = sxy / sxx
  return { n: points.length, meanX: mx, meanY: my, varX: variance(xs), varY: variance(ys), r: sxy / Math.sqrt(sxx * syy), slope, intercept: my - slope * mx }
}
