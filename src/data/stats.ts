import type { ProgressState } from '../progress'
import { isReady } from '../lessons'
import { lessonMinutes } from '../time'
import { stages, type Stage } from './curriculum'

export type StageStatus = 'todo' | 'doing' | 'done' | 'empty'

export function stageStats(stage: Stage, p: ProgressState) {
  const ready = stage.lessons.filter((l) => isReady(l.id))
  const done = ready.filter((l) => p.completed[l.id]).length
  const status: StageStatus =
    ready.length === 0 ? 'empty' : done === ready.length ? 'done' : done > 0 ? 'doing' : 'todo'
  return { done, total: ready.length, status }
}

export function overallStats(p: ProgressState) {
  let done = 0
  let total = 0
  for (const s of stages) {
    const st = stageStats(s, p)
    done += st.done
    total += st.total
  }
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
}

/** 次に学ぶべき公開済みレッスン(未完了の先頭)。 */
export function nextLessonId(p: ProgressState): string | undefined {
  if (p.lastVisited && isReady(p.lastVisited) && !p.completed[p.lastVisited]) return p.lastVisited
  for (const s of stages) for (const l of s.lessons) if (isReady(l.id) && !p.completed[l.id]) return l.id
  return undefined
}

/** 公開済みのレッスンの所要時間の目安(分)。remaining は、未完了のレッスンの合計。 */
export function stageMinutes(stage: Stage, p: ProgressState) {
  let total = 0
  let remaining = 0
  for (const l of stage.lessons) {
    if (!isReady(l.id)) continue
    const m = lessonMinutes(l.id)
    total += m
    if (!p.completed[l.id]) remaining += m
  }
  return { total, remaining }
}

export function overallMinutes(p: ProgressState) {
  return stages.reduce(
    (acc, s) => {
      const m = stageMinutes(s, p)
      return { total: acc.total + m.total, remaining: acc.remaining + m.remaining }
    },
    { total: 0, remaining: 0 },
  )
}
