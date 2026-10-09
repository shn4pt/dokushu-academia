// A/B テストの、最小の標本の大きさ(各バリアントのユーザー数)の目安。
// 出典: Kohavi, Longbotham, Sommerfield, Henne (2009) "Controlled experiments on the web: survey and practical guide", 3.2 の式(2)。
//   n = 16 σ² / Δ²  ... 信頼水準 95%・検出力 80%(van Belle 2002 による)。検出力 90% なら、16 を 21 に置き換える。
//   n: 各バリアントのユーザー数(バリアントは同じ大きさ)、σ²: OEC の分散、Δ: 検出したい変化の大きさ。
// また、6.2.4: 処理(Treatment)に、全体の割合 p を割り当てると、50%/50% に比べて、実験の期間は、1 / (4p(1 − p)) 倍になる。
export const C_POWER: Record<80 | 90, number> = { 80: 16, 90: 21 }

export const nPerVariant = (sigma2: number, delta: number, power: 80 | 90 = 80) => (C_POWER[power] * sigma2) / (delta * delta)

/** 転換率(購入した人の割合)のような、0/1 の指標。σ² = p(1 − p)、Δ = p × 相対的な変化 */
export const nForConversion = (p: number, relativeChange: number, power: 80 | 90 = 80) => nPerVariant(p * (1 - p), p * relativeChange, power)

/** 処理に、全体の割合 share を割り当てたときの、実験期間の、50%/50% に対する倍率 */
export const runtimeMultiplier = (share: number) => 1 / (4 * share * (1 - share))
