// GRADE の「確実性」の格付けを、判断の結果から段階に直す計算(練習用)。
// 出典: Cochrane Handbook for Systematic Reviews of Interventions v6.5, 第 14 章(Schünemann ら)の 14.2.1〜14.2.3。
//  - 確実性は 4 段階: 高 / 中 / 低 / 非常に低(high, moderate, low, very low)。「非常に低」より下には、評価できない。
//  - 出発点: ランダム化試験は「高」、非ランダム化の研究(観察研究など)は「低」。
//  - 下げる 5 つの要因: バイアスのリスク、結果の非一貫性、非直接性、不精確さ、公表バイアス。
//    「深刻」なら 1 段階、「非常に深刻」なら 2 段階下げる(ふつう、要因ごとに最大 2 段階。全体で最大 3 段階)。
//  - 上げる 3 つの要因(おもに非ランダム化の研究。下げたランダム化試験にも、例外的に使える): 大きな効果、用量反応関係、もっともらしい交絡が効果を小さく見せる方向であること。
// 実際の格付けは、各要因の判断と、その理由の記録が中心。ここでの足し引きは、判断のあとの、段階の計算だけ。
// 簡略化: 上げる要因は 1 つにつき 1 段階(ハンドブックは、非常に大きな効果などで、さらに上げうるとしている)。上げるための「ほかに方法上の問題がない」という条件は、確かめない。
export type Design = 'randomized' | 'observational'
export const DOWN_DOMAINS = ['riskOfBias', 'inconsistency', 'indirectness', 'imprecision', 'publicationBias'] as const
export const UP_DOMAINS = ['largeEffect', 'doseResponse', 'confoundingWouldReduce'] as const
export type DownDomain = (typeof DOWN_DOMAINS)[number]
export type UpDomain = (typeof UP_DOMAINS)[number]
export type Down = 0 | 1 | 2 // 0: 問題なし、1: 深刻、2: 非常に深刻
export const LEVELS = ['非常に低', '低', '中', '高'] as const // 添え字 0〜3

export function certainty(design: Design, down: Partial<Record<DownDomain, Down>>, up: Partial<Record<UpDomain, boolean>> = {}) {
  const start = design === 'randomized' ? 3 : 1
  const lowered = DOWN_DOMAINS.reduce((s, d) => s + (down[d] ?? 0), 0)
  const raised = UP_DOMAINS.reduce((s, d) => s + (up[d] ? 1 : 0), 0)
  const index = Math.max(0, Math.min(3, start - lowered + raised))
  return { start, lowered, raised, index, label: LEVELS[index], symbol: '⊕'.repeat(index + 1) + '◯'.repeat(3 - index) }
}
