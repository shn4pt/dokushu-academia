import rawSources from './data/lesson-sources.json'
import rawHistory from './data/lesson-history.json'

export type SourceStatus = 'verified' | 'partial' | 'original' | 'unverified'
export type SourceHow = 'read' | 'search' | 'skill' | 'repo' | 'calc'
export type Source = { title: string; url?: string; how: SourceHow; use: string }
export type LessonSources = {
  status: SourceStatus
  checkedAt?: string
  versions?: string
  note?: string
  sources: Source[]
  changes?: { date: string; summary: string }[]
}
export type Commit = { date: string; hash: string; subject: string }

export const statusLabel: Record<SourceStatus, string> = {
  verified: '原典・公式で確認',
  partial: '一部を確認',
  original: 'このアプリ独自の整理',
  unverified: '未確認',
}

export const statusHelp: Record<SourceStatus, string> = {
  verified: '本文の主な事実を、原典や公式のドキュメントを読んで確かめた。',
  partial: '一部の記述だけを確かめた。残りは、原典との照合がまだ。',
  original: 'このアプリが整理した枠組みや、説明用の例。外部の資料に基づく事実の主張ではない。',
  unverified: '出典の記録がない。AI が持っている知識に基づいており、原典との照合がまだ。',
}

export const howLabel: Record<SourceHow, string> = {
  read: '原文を読んで確認',
  search: '検索結果で確認(原文は未取得)',
  skill: 'Claude API スキル同梱の資料で確認',
  repo: 'このリポジトリの記録で確認',
  calc: '計算し直して確認',
}

const sources = rawSources as Record<string, LessonSources>
const history = rawHistory as Record<string, { created: string; commits: Commit[] }>

const missing: LessonSources = { status: 'unverified', sources: [] }
export const sourcesFor = (id: string): LessonSources => sources[id] ?? missing
export const historyFor = (id: string) => history[id]
export const REPO = 'https://github.com/shn4pt/mygame1'
