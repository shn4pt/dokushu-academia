import type { Course } from './catalog'
import { courseStageIds } from './catalog'
import { allLessons, findStage } from './curriculum'
import { lessonMinutes } from '../time'

/** 講座の全レッスンの学習時間の目安の合計(分)。src/time.ts の式による見積もりで、実測ではない。 */
export const courseMinutes = (c: Course) =>
  courseStageIds(c).reduce((n, sid) => n + (findStage(sid)?.lessons.reduce((m, l) => m + lessonMinutes(l.id), 0) ?? 0), 0)

/** 公開中の全レッスンの学習時間の目安の分布(分)。「隙間時間に 1 レッスン」の説明を、実際の長さに合わせるために使う。 */
export function lessonLengthSummary() {
  const v = allLessons.map((l) => lessonMinutes(l.id)).filter((m) => m > 0).sort((a, b) => a - b)
  const mid = Math.floor(v.length / 2)
  return { count: v.length, min: v[0] ?? 0, max: v[v.length - 1] ?? 0, median: v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2) }
}
