// 記述統計の計算(平均・中央値・分散・標準偏差・範囲・中央絶対偏差)。定義は NIST/SEMATECH e-Handbook の 1.3.5.1(位置)・1.3.5.6(ばらつき)。
//   分散 s² = Σ(Yi − Ȳ)² / (N − 1)(標本分散)、標準偏差は、その平方根、範囲 = 最大 − 最小、
//   中央絶対偏差 MAD = median(|Yi − 中央値|)(スケール調整はしない)。
export const mean = (v: number[]) => v.reduce((s, a) => s + a, 0) / v.length
export const median = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
export const variance = (v: number[]) => {
  const m = mean(v)
  return v.reduce((s, a) => s + (a - m) ** 2, 0) / (v.length - 1)
}
export const sd = (v: number[]) => Math.sqrt(variance(v))
export const range = (v: number[]) => Math.max(...v) - Math.min(...v)
export const mad = (v: number[]) => {
  const m = median(v)
  return median(v.map((a) => Math.abs(a - m)))
}
