// 平均の信頼区間: Ȳ ± t(1 − α/2, N − 1) · s / √N(NIST/SEMATECH e-Handbook 1.3.5.2)。ここでは 95%(α = 0.05)。
// 「標本を取り直して、区間を作り直すと、何回に 1 回、真の平均を含むか」を試すための、乱数と計算。
import { mean, sd } from './descriptive'
import { tCritical975 } from './tTable'

export function ciMean95(values: number[]) {
  const n = values.length
  const m = mean(values)
  const half = (tCritical975(n - 1) * sd(values)) / Math.sqrt(n)
  return { n, mean: m, half, low: m - half, high: m + half }
}

/** 乱数(mulberry32)。同じ種からは、同じ列が出る(画面の再現と、テストのため)。 */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 標準正規分布の乱数(Box–Muller 法) */
export function normal(rand: () => number) {
  const u = 1 - rand() // (0, 1]
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** 平均 mu・標準偏差 sigma の正規分布から、大きさ n の標本を trials 回取り、そのたびに 95% 信頼区間を作る。 */
export function simulateIntervals(seed: number, n: number, trials: number, mu = 50, sigma = 10) {
  const rand = rng(seed)
  const out = []
  for (let i = 0; i < trials; i++) {
    const sample = Array.from({ length: n }, () => mu + sigma * normal(rand))
    const ci = ciMean95(sample)
    out.push({ ...ci, covers: ci.low <= mu && mu <= ci.high })
  }
  return out
}
