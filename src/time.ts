import stats from './data/lesson-stats.json'

/** レッスン本文の統計(ビルド時に scripts/build-search-index.mjs が生成する)。 */
type LessonStats = { chars: number; codeChars: number; formulas: number; demos: number; questions: number }
const lessonStats = stats as Record<string, LessonStats>

// 学習時間の目安の算出に使う前提。実測ではなく、初学者が理解しながら進む速さを見込んだ仮の値。
// 実際に使ってみて、ずれていれば、ここだけ調整すればよい。
export const CHARS_PER_MIN = 200 // 本文を、理解しながら読む速さ(字/分)
export const CODE_WEIGHT = 2 // コードは、同じ文字数の本文の何倍の時間がかかるか
export const MIN_PER_FORMULA = 0.5 // 数式1つを追う時間(分)
export const MIN_PER_DEMO = 3 // デモ1つを触って確かめる時間(分)
export const MIN_PER_QUESTION = 0.7 // クイズ1問(分)

export type LessonTime = { reading: number; demo: number; quiz: number; total: number }

export function lessonTime(id: string): LessonTime | undefined {
  const s = lessonStats[id]
  if (!s) return undefined
  const reading = Math.max(1, Math.round((s.chars + s.codeChars * CODE_WEIGHT) / CHARS_PER_MIN + s.formulas * MIN_PER_FORMULA))
  const demo = Math.round(s.demos * MIN_PER_DEMO)
  const quiz = Math.round(s.questions * MIN_PER_QUESTION)
  return { reading, demo, quiz, total: reading + demo + quiz }
}

export const lessonMinutes = (id: string) => lessonTime(id)?.total ?? 0

/** 「約8分」「約1時間20分」のように表す。合計など大きな値は、5分単位に丸めて、細かすぎる精度を見せない。 */
export function formatMinutes(minutes: number, coarse = false) {
  if (minutes === 0) return '0分'
  const m = coarse && minutes >= 10 ? Math.round(minutes / 5) * 5 : minutes
  if (m < 60) return `約${m}分`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest === 0 ? `約${h}時間` : `約${h}時間${rest}分`
}
