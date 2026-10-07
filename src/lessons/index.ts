import type { LessonContent } from './types'

// 登録したレッスンだけが公開扱い。本文は動的importで遅延読み込みする。
const loaders: Record<string, () => Promise<{ default: LessonContent }>> = {
  '0-1': () => import('./VectorMatrix'),
  '0-2': () => import('./Probability'),
  '0-3': () => import('./Gradient'),
  '1-1': () => import('./LossFunction'),
  '1-2': () => import('./GradientDescent'),
  '1-3': () => import('./Overfitting'),
  '2-1': () => import('./Neuron'),
  '2-2': () => import('./Activation'),
  '2-3': () => import('./Backprop'),
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
