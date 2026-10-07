import { useSyncExternalStore } from 'react'

export type QuizResult = { best: number; total: number }

export type ProgressState = {
  version: 1
  completed: Record<string, string>
  quiz: Record<string, QuizResult>
  lastVisited?: string
}

const KEY = 'llm-learning:progress'
const empty = (): ProgressState => ({ version: 1, completed: {}, quiz: {} })

function isValid(v: unknown): v is ProgressState {
  if (!v || typeof v !== 'object') return false
  const s = v as Partial<ProgressState>
  return (
    s.version === 1 &&
    !!s.completed && typeof s.completed === 'object' &&
    !!s.quiz && typeof s.quiz === 'object'
  )
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isValid(parsed)) return parsed
    }
  } catch {
    // localStorage unavailable or corrupted: start fresh
  }
  return empty()
}

let state = load()
const listeners = new Set<() => void>()

function commit(next: ProgressState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // keep working in memory when storage is blocked
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useProgress = () => useSyncExternalStore(subscribe, () => state)

export const progressActions = {
  setCompleted(lessonId: string, done: boolean) {
    const completed = { ...state.completed }
    if (done) completed[lessonId] = new Date().toISOString()
    else delete completed[lessonId]
    commit({ ...state, completed })
  },
  recordQuiz(lessonId: string, score: number, total: number) {
    const prev = state.quiz[lessonId]
    if (prev && prev.best >= score) return
    commit({ ...state, quiz: { ...state.quiz, [lessonId]: { best: score, total } } })
  },
  visit(lessonId: string) {
    if (state.lastVisited === lessonId) return
    commit({ ...state, lastVisited: lessonId })
  },
  exportJson: () => JSON.stringify(state, null, 2),
  importJson(text: string): boolean {
    try {
      const parsed = JSON.parse(text)
      if (!isValid(parsed)) return false
      commit(parsed)
      return true
    } catch {
      return false
    }
  },
  reset: () => commit(empty()),
}
