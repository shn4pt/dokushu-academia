// 検出力(power)の計算: 母集団の標準偏差 σ が分かっているときの、平均についての、両側の z 検定。
//   検定統計量 Z = (Ȳ − μ0) / (σ/√N)。H0: μ = μ0 を、|Z| > z(1 − α/2) のとき棄却する(NIST/SEMATECH e-Handbook 7.1.5 の例と同じ型)。
//   真の平均が μ0 から δ だけずれているとき、検出力 = Φ(δ√N/σ − z) + Φ(−δ√N/σ − z)(z = z(1 − α/2)、Φ は標準正規分布の累積分布関数)。
// 臨界値 z は、NIST の t 分布の表の「Normal Values」の行(0.95 → 1.645、0.975 → 1.960、0.995 → 2.576)の値を使う。
// この検出力の式は、標準的な導出で、出典の本文からは取っていない。モンテカルロ・シミュレーションとの照合を e2e/power.spec.ts で行う。
export const Z_CRIT: Record<string, number> = { '0.1': 1.645, '0.05': 1.96, '0.01': 2.576 }

/** 標準正規分布の累積分布関数(Abramowitz and Stegun 7.1.26 の erf の近似。誤差は 1.5e-7 以下) */
export function Phi(x: number) {
  const s = x < 0 ? -1 : 1
  const z = Math.abs(x) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * z)
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t
  const erf = 1 - poly * Math.exp(-z * z)
  return 0.5 * (1 + s * erf)
}

/** effect = δ/σ(差の大きさを、標準偏差で割ったもの)、n = 標本の大きさ、alpha = 有意水準(0.1・0.05・0.01) */
export function power(effect: number, n: number, alpha: number) {
  const z = Z_CRIT[String(alpha)]
  const shift = effect * Math.sqrt(n)
  return Phi(shift - z) + Phi(-shift - z)
}
