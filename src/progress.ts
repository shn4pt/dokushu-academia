import { useSyncExternalStore } from 'react'

export type QuizResult = { best: number; total: number }

/** 問題ごとの正誤の記録。復習の対象を決めるのに使う。 */
export type QuestionStat = {
  right: number
  wrong: number
  /** 現在の連続正解数(間違えると0に戻る) */
  streak: number
  last: 'right' | 'wrong'
  at: string
}

/**
 * レッスン内で、最も先まで読み進めた位置(しおり)。位置は座標ではなく、見出しのテキストで持つ。
 * index は、その見出しが本文で何番目か。以前のデータには無いことがある。
 */
export type ReadingPos = { section: string; index?: number; at: string }

export type ProgressState = {
  version: 1
  completed: Record<string, string>
  quiz: Record<string, QuizResult>
  /** キーは questionKey()。以前に書き出したデータには無いので、読み込み時に補う */
  questions: Record<string, QuestionStat>
  /** キーはレッスンID。以前に書き出したデータには無いので、読み込み時に補う */
  reading: Record<string, ReadingPos>
  lastVisited?: string
}

const KEY = 'llm-learning:progress'
const empty = (): ProgressState => ({ version: 1, completed: {}, quiz: {}, questions: {}, reading: {} })

const isObject = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)

type Stored = Omit<ProgressState, 'questions' | 'reading'> & { questions?: unknown; reading?: unknown }

function isValid(v: unknown): v is Stored {
  if (!isObject(v)) return false
  const s = v as Stored
  return (
    s.version === 1 && isObject(s.completed) && isObject(s.quiz) &&
    (s.questions === undefined || isObject(s.questions)) &&
    (s.reading === undefined || isObject(s.reading))
  )
}

const normalize = (v: Stored): ProgressState => ({
  ...v,
  questions: (v.questions as ProgressState['questions'] | undefined) ?? {},
  reading: (v.reading as ProgressState['reading'] | undefined) ?? {},
})

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isValid(parsed)) return normalize(parsed)
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
    const reading = { ...state.reading }
    if (done) {
      completed[lessonId] = new Date().toISOString()
      delete reading[lessonId] // 読み終えたので、しおりは不要
    } else delete completed[lessonId]
    commit({ ...state, completed, reading })
  },
  recordQuiz(lessonId: string, score: number, total: number) {
    const prev = state.quiz[lessonId]
    if (prev && prev.best >= score) return
    commit({ ...state, quiz: { ...state.quiz, [lessonId]: { best: score, total } } })
  },
  /** 最も先まで読み進めた位置だけを記録する(読み返して戻っても、しおりは戻らない)。 */
  setReading(lessonId: string, section: string, index: number) {
    const prev = state.reading[lessonId]
    if (prev && (prev.index ?? -1) >= index) return
    commit({ ...state, reading: { ...state.reading, [lessonId]: { section, index, at: new Date().toISOString() } } })
  },
  clearReading(lessonId: string) {
    if (!state.reading[lessonId]) return
    const reading = { ...state.reading }
    delete reading[lessonId]
    commit({ ...state, reading })
  },
  /** 答え合わせの結果を、問題ごとに記録する。 */
  recordAnswers(results: { key: string; correct: boolean }[]) {
    if (results.length === 0) return
    const at = new Date().toISOString()
    const questions = { ...state.questions }
    for (const { key, correct } of results) {
      const prev = questions[key] ?? { right: 0, wrong: 0, streak: 0, last: 'right' as const, at }
      questions[key] = correct
        ? { ...prev, right: prev.right + 1, streak: prev.streak + 1, last: 'right', at }
        : { ...prev, wrong: prev.wrong + 1, streak: 0, last: 'wrong', at }
    }
    commit({ ...state, questions })
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
      commit(normalize(parsed))
      return true
    } catch {
      return false
    }
  },
  reset: () => commit(empty()),
}
