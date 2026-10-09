// UC Berkeley の大学院の入学データ(1973 年、応募者数が最も多い 6 学科、4,526 人)。
// R の datasets パッケージの UCBAdmissions(公開データセットの Rdatasets 経由)の値。元の分析は Bickel, Hammel, O'Connell (1975) Science 187(4175):398-404。
// 論文の本文は読んでいない。要約の数字(合格率など)は、この値から計算する。照合は e2e/ucb.spec.ts。
export type Dept = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type Sex = 'male' | 'female'
export type Cell = { admitted: number; rejected: number }

export const depts: Dept[] = ['A', 'B', 'C', 'D', 'E', 'F']

export const counts: Record<Dept, Record<Sex, Cell>> = {
  A: { male: { admitted: 512, rejected: 313 }, female: { admitted: 89, rejected: 19 } },
  B: { male: { admitted: 353, rejected: 207 }, female: { admitted: 17, rejected: 8 } },
  C: { male: { admitted: 120, rejected: 205 }, female: { admitted: 202, rejected: 391 } },
  D: { male: { admitted: 138, rejected: 279 }, female: { admitted: 131, rejected: 244 } },
  E: { male: { admitted: 53, rejected: 138 }, female: { admitted: 94, rejected: 299 } },
  F: { male: { admitted: 22, rejected: 351 }, female: { admitted: 24, rejected: 317 } },
}

export function tally(sex: Sex, which: Dept[] = depts) {
  const applicants = which.reduce((s, d) => s + counts[d][sex].admitted + counts[d][sex].rejected, 0)
  const admitted = which.reduce((s, d) => s + counts[d][sex].admitted, 0)
  return { applicants, admitted, rate: admitted / applicants }
}
