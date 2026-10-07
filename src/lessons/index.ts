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
  '5-1': () => import('./NextToken'),
  '5-2': () => import('./TrainingData'),
  '5-3': () => import('./ScalingLaw'),
  '6-1': () => import('./Sampling'),
  '6-2': () => import('./KvCache'),
  '6-3': () => import('./ContextWindow'),
  '7-1': () => import('./Sft'),
  '7-2': () => import('./Rlhf'),
  '7-3': () => import('./Alignment'),
  '8-1': () => import('./Rag'),
  '8-2': () => import('./Agent'),
  '8-3': () => import('./Hallucination'),
  '4-1': () => import('./WhyAttention'),
  '4-2': () => import('./SelfAttention'),
  '4-3': () => import('./PositionalEncoding'),
  '4-4': () => import('./TransformerBlock'),
}

export const isReady = (id: string) => id in loaders
export const loadLessonContent = (id: string) => loaders[id]().then((m) => m.default)
