import type { ProgressState } from '../progress'
import { isReady } from '../lessons'
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
