// 交絡のある観察データの、単純な比較と、調整と、ランダム化の比較(解析解。乱数は使わない)。
// 設定: L(重症度。0/1)、A(処置を受けたか。0/1)、Y(悪い結果の確率)。
//   P(L = 1) = pL。処置を受ける確率は、L で違う: P(A = 1 | L = 1) = a1、P(A = 1 | L = 0) = a0(重症の人ほど、処置を受けやすい)。
//   悪い結果の確率: P(Y = 1 | A, L) = base + gamma · L + tau · A(tau が、処置の、本当の効果。リスク差)。
// 単純な比較(処置を受けた人 − 受けなかった人)は、tau + gamma · (P(L = 1 | A = 1) − P(L = 1 | A = 0))。
// L で層に分けて、層ごとの差を、全体の L の分布で平均する(標準化)と、tau になる。ランダムに処置を割り当てると、L と A が独立になり、単純な比較が、tau になる。
// 考え方の出典: Hernán & Robins, Causal Inference: What If の 3 章・7 章(数値は、このサービスの例)。
export type ConfoundingInput = { pL: number; a1: number; a0: number; base: number; gamma: number; tau: number }

export function confounding({ pL, a1, a0, base, gamma, tau }: ConfoundingInput) {
  const pA1 = pL * a1 + (1 - pL) * a0
  const pLgivenA1 = (pL * a1) / pA1
  const pLgivenA0 = (pL * (1 - a1)) / (1 - pA1)
  const risk = (A: 0 | 1, L: 0 | 1) => base + gamma * L + tau * A
  const treated = pLgivenA1 * risk(1, 1) + (1 - pLgivenA1) * risk(1, 0)
  const untreated = pLgivenA0 * risk(0, 1) + (1 - pLgivenA0) * risk(0, 0)
  const naive = treated - untreated
  // L で標準化: 層ごとの差(= tau)を、全体の L の分布で平均する
  const adjusted = pL * (risk(1, 1) - risk(0, 1)) + (1 - pL) * (risk(1, 0) - risk(0, 0))
  return { pA1, pLgivenA1, pLgivenA0, treated, untreated, naive, adjusted, randomized: tau }
}
