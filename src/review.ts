import { useEffect, useMemo, useState } from 'react'
import { useProgress, type ProgressState, type QuestionStat } from './progress'
import type { QuizQuestion } from './lessons/types'

/** 復習で、この回数だけ連続で正解すると「卒業」する。 */
export const GRADUATE_STREAK = 2
export const SESSION_SIZE = 10

function hash(s: string) {
  let h = 5381
  for (const ch of s) h = ((h << 5) + h + ch.codePointAt(0)!) >>> 0
  return h.toString(36)
}

/** 問題文から作るキー。問題文を変えると別の問題として扱われる(並び順に依存しない)。 */
export const questionKey = (lessonId: string, question: string) => `${lessonId}:${hash(question)}`

/** 一度でも間違えていて、まだ卒業していない問題が復習の対象。 */
export const isDue = (s: QuestionStat | undefined) => !!s && s.wrong > 0 && s.streak < GRADUATE_STREAK

export const dueKeys = (p: ProgressState) =>
  Object.entries(p.questions)
    .filter(([, s]) => isDue(s))
    .sort(([, a], [, b]) => a.at.localeCompare(b.at))
    .map(([k]) => k)

export function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type Bank = Record<string, QuizQuestion[]>
export type BankEntry = { key: string; lessonId: string; q: QuizQuestion }

export const bankEntries = (bank: Bank): BankEntry[] =>
  Object.entries(bank).flatMap(([lessonId, qs]) => qs.map((q) => ({ key: questionKey(lessonId, q.question), lessonId, q })))

let bankPromise: Promise<Bank> | null = null
let bankCache: Bank | null = null
const loadBank = () =>
  (bankPromise ??= import('./data/quiz-bank.json').then((m) => (bankCache = m.default as Bank)).catch((e) => {
    bankPromise = null
    throw e
  }))

/** 全レッスンのクイズ(ビルド時に生成)。最初に必要になったときだけ読み込む。 */
export function useBank() {
  const [bank, setBank] = useState<Bank | null>(bankCache)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (bankCache) return
    loadBank().then(setBank, () => setFailed(true))
  }, [])
  return { bank, failed }
}

/** 復習が必要な問題のキー。問題文の変更で対応する問題がなくなった記録は除く。 */
export function useDueKeys() {
  const p = useProgress()
  const { bank } = useBank()
  return useMemo(() => {
    const keys = dueKeys(p)
    if (!bank) return keys
    const valid = new Set(bankEntries(bank).map((e) => e.key))
    return keys.filter((k) => valid.has(k))
  }, [p, bank])
}
