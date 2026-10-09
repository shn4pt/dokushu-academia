// Markdown 形式のレッスンの読み取り(React を使わない純粋な処理。ビルドの検査とテストからも使う)。
//
// 形式(詳しくは docs/lesson-format.md):
//  - 本文は Markdown。見出しは「### 」(これが、しおり・検索の単位になる)。
//  - 対話的な部品は、「```component 名前」で始まる囲みの中に、JSON で書く。
//  - クイズは「```component quiz」の囲み(本文には表示されず、レッスンのクイズになる)。
//  - 内部リンクは [文字](/lesson/e-1) のように書く(ハッシュのルーターに合わせて、自動で #/ に直す)。
import { marked } from 'marked'
import type { QuizQuestion } from './types'

export type Segment = { kind: 'html'; html: string } | { kind: 'component'; name: string; props: Record<string, unknown>; line: number }
export type ParsedLesson = { segments: Segment[]; quiz: QuizQuestion[] }

/** 本文に差し込める部品の名前と、必須の項目(部品の実体は markdown.tsx に登録する) */
export const componentSpecs: Record<string, { required: string[] }> = {
  classify: { required: ['title', 'description', 'options', 'items'] },
  codereview: { required: ['title', 'description', 'lines', 'answers', 'explanation'] },
  anscombe: { required: [] },
  ucb: { required: [] },
  ppv: { required: [] },
  grade: { required: [] },
  spread: { required: [] },
  ci: { required: [] },
  power: { required: [] },
  samplesize: { required: [] },
  peek: { required: [] },
  confound: { required: [] },
}

export class LessonFormatError extends Error {}

const FENCE = /^```component[ \t]+([a-z0-9-]+)[ \t]*\n([\s\S]*?)\n```[ \t]*$/gm

function fail(where: string, message: string): never {
  throw new LessonFormatError(`${where}: ${message}`)
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

function validateQuiz(raw: unknown, where: string): QuizQuestion[] {
  if (!Array.isArray(raw) || raw.length === 0) fail(where, 'quiz は、1問以上の配列にしてください')
  return raw.map((q, i) => {
    const w = `${where} の ${i + 1} 問目`
    if (!q || typeof q !== 'object') fail(w, 'オブジェクトにしてください')
    const { question, choices, answer, explanation } = q as Record<string, unknown>
    if (!isStr(question)) fail(w, 'question が空です')
    if (!Array.isArray(choices) || choices.length < 2 || !choices.every(isStr)) fail(w, 'choices は、2つ以上の文字列の配列にしてください')
    if (!Number.isInteger(answer) || (answer as number) < 0 || (answer as number) >= choices.length) fail(w, `answer は、0〜${choices.length - 1} の整数にしてください`)
    if (!isStr(explanation)) fail(w, 'explanation(解説)が空です')
    return { question, choices: choices as string[], answer: answer as number, explanation }
  })
}

/** 本文の HTML を整える: 内部リンクをハッシュルーターの形に、表を既存の見た目に */
export function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false, gfm: true }) as string
  return html
    .replace(/<a href="\/(?!\/)/g, '<a href="#/')
    .replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" rel="noopener noreferrer"')
    .replace(/<table>/g, '<table class="calc text">')
}

export function parseLesson(source: string, name = 'レッスン'): ParsedLesson {
  const segments: Segment[] = []
  let quiz: QuizQuestion[] | undefined
  let last = 0
  const opens = (source.match(/^```component/gm) ?? []).length
  const pushText = (text: string) => {
    if (text.trim()) segments.push({ kind: 'html', html: renderMarkdown(text) })
  }
  for (const m of source.matchAll(FENCE)) {
    const start = m.index ?? 0
    const line = source.slice(0, start).split('\n').length
    const where = `${name}(${line} 行目の ${m[1]})`
    pushText(source.slice(last, start))
    last = start + m[0].length
    let data: unknown
    try {
      data = JSON.parse(m[2])
    } catch (e) {
      fail(where, `JSON として読めません(${(e as Error).message})。文字列は二重引用符で囲み、囲みの中の二重引用符は \\" にしてください`)
    }
    if (m[1] === 'quiz') {
      if (quiz) fail(where, 'quiz は1つだけにしてください')
      quiz = validateQuiz(data, where)
      continue
    }
    const spec = componentSpecs[m[1]]
    if (!spec) fail(where, `知らない部品です(使えるもの: ${Object.keys(componentSpecs).join(', ')}, quiz)`)
    if (!data || typeof data !== 'object' || Array.isArray(data)) fail(where, 'JSON のオブジェクトにしてください')
    for (const key of spec.required) if (!(key in (data as object))) fail(where, `${key} がありません`)
    segments.push({ kind: 'component', name: m[1], props: data as Record<string, unknown>, line })
  }
  pushText(source.slice(last))
  if (segments.filter((s) => s.kind === 'component').length + (quiz ? 1 : 0) !== opens) fail(name, '```component の囲みを読み取れないところがあります(閉じ忘れ、「```component 名前」の書き方の誤り、など)')
  if (!quiz) fail(name, 'クイズ(```component quiz)がありません')
  return { segments, quiz }
}
