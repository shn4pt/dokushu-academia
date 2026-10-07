import type { LessonContent } from './types'

// 登録したレッスンだけが公開扱い。本文は動的importで遅延読み込みする。
const loaders: Record<string, () => Promise<{ default: LessonContent }>> = {
  '3-1': () => import('./Tokenization'),
  '3-2': () => import('./Embedding'),
  '3-3': () => import('./LanguageModel'),
  '4-1': () => import('./WhyAttention'),
  '4-2': () => import('./SelfAttention'),
  '4-3': () => import('./PositionalEncoding'),
  '4-4': () => import('./TransformerBlock'),
}

export const isReady = (id: string) => id in loaders
export const loadLessonContent = (id: string) => loaders[id]().then((m) => m.default)
