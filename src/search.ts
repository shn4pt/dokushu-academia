import { allLessons } from './data/curriculum'

export type Section = { id: string; h: string; t: string }
export type Hit = { heading: string; snippet: string; score: number }
export type LessonResult = { lessonId: string; score: number; hits: Hit[] }

const MAX_HITS_PER_LESSON = 3

/** 全角/半角・大文字/小文字の違いを無視して比較するための正規化。 */
export const norm = (s: string) => s.normalize('NFKC').toLowerCase()

export const parseTerms = (q: string) => [...new Set(norm(q).split(/\s+/).filter(Boolean))]

const countOf = (hay: string, needle: string) => {
  let n = 0
  for (let i = hay.indexOf(needle); i !== -1; i = hay.indexOf(needle, i + needle.length)) n++
  return n
}

function snippetOf(text: string, terms: string[]) {
  const normalized = norm(text)
  // 正規化で文字数が変わると位置がずれるため、その場合は先頭から切り出す
  const pos = normalized.length === text.length ? Math.min(...terms.map((t) => normalized.indexOf(t)).filter((i) => i >= 0), Infinity) : Infinity
  const start = Number.isFinite(pos) ? Math.max(0, pos - 30) : 0
  const end = Math.min(text.length, start + 110)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

/** 各レッスンの「概要」(タイトルと要約)も、本文と同じく検索対象にする。 */
const overviews: Section[] = allLessons.map((l) => ({ id: l.id, h: '概要', t: `${l.title}。${l.summary}` }))
const order = new Map(allLessons.map((l, i) => [l.id, i]))

export function search(sections: Section[], query: string): LessonResult[] {
  const terms = parseTerms(query)
  if (terms.length === 0) return []

  const byLesson = new Map<string, Hit[]>()
  for (const s of [...overviews, ...sections]) {
    const h = norm(s.h)
    const t = norm(s.t)
    if (!terms.every((term) => h.includes(term) || t.includes(term))) continue
    const score = terms.reduce((sum, term) => sum + countOf(h, term) * 5 + countOf(t, term), 0)
    const hit: Hit = { heading: s.h, snippet: snippetOf(s.t, terms), score: s.h === '概要' ? score + 3 : score }
    byLesson.set(s.id, [...(byLesson.get(s.id) ?? []), hit])
  }

  return [...byLesson]
    .map(([lessonId, hits]) => {
      const top = hits.sort((a, b) => b.score - a.score).slice(0, MAX_HITS_PER_LESSON)
      return { lessonId, hits: top, score: top.reduce((sum, h) => sum + h.score, 0) }
    })
    .sort((a, b) => b.score - a.score || order.get(a.lessonId)! - order.get(b.lessonId)!)
}
