import { useSyncExternalStore } from 'react'

// Claude API を学習用に呼び出すための設定。
// APIキーは秘密情報なので、localStorage や進捗データには保存しない(メモリか sessionStorage のみ)。

export type ModelInfo = {
  id: string
  label: string
  /** 100万トークンあたりの料金(USD) */
  input: number
  output: number
  /** サーバー側のフォールバック(fallbacks: "default")に対応しているか */
  fallback: boolean
  note: string
}

// 料金は 2026年10月時点の Claude API の標準料金(キャッシュ・バッチ割引は含まない)
export const MODELS: ModelInfo[] = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', input: 4, output: 20, fallback: true, note: '最も賢い標準モデル' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', input: 2, output: 10, fallback: true, note: '速さと性能のバランス' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5', input: 0.1, output: 0.5, fallback: false, note: '最も安価(入力10万トークンまでの料金)' },
]
export const findModel = (id: string) => MODELS.find((m) => m.id === id) ?? MODELS[0]

export type Effort = 'low' | 'medium' | 'high'
export type ApiSettings = { model: string; effort: Effort; maxTokens: number; showThinking: boolean }
type KeyMode = 'memory' | 'session'

const SETTINGS_KEY = 'llm-learning:api-settings' // 秘密でない設定のみ
const SESSION_KEY = 'llm-learning:api-key'
const defaults: ApiSettings = { model: 'claude-opus-5-5', effort: 'low', maxTokens: 2048, showThinking: false }

const hasWindow = typeof window !== 'undefined'
function readSettings(): ApiSettings {
  if (!hasWindow) return defaults
  try {
    const v = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null')
    if (v && typeof v === 'object') return { ...defaults, ...v }
  } catch {
    // 壊れていれば既定値
  }
  return defaults
}
function readSessionKey(): string {
  if (!hasWindow) return ''
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? ''
  } catch {
    return ''
  }
}

type State = {
  settings: ApiSettings
  apiKey: string
  keyMode: KeyMode
  /** このタブで使ったトークンと概算費用(再読み込みで消える) */
  usage: { input: number; output: number; cost: number; calls: number }
}

let state: State = {
  settings: readSettings(),
  apiKey: readSessionKey(),
  keyMode: readSessionKey() ? 'session' : 'memory',
  usage: { input: 0, output: 0, cost: 0, calls: 0 },
}
const serverState = state
const listeners = new Set<() => void>()
function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useApi = () => useSyncExternalStore(subscribe, () => state, () => serverState)
export const getApiState = () => state

export const apiActions = {
  setKey(key: string, mode: KeyMode) {
    const apiKey = key.trim()
    try {
      if (mode === 'session' && apiKey) sessionStorage.setItem(SESSION_KEY, apiKey)
      else sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // sessionStorage が使えない環境ではメモリだけに置く
    }
    set({ apiKey, keyMode: mode })
  },
  clearKey() {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // 何もしない
    }
    set({ apiKey: '' })
  },
  updateSettings(patch: Partial<ApiSettings>) {
    const settings = { ...state.settings, ...patch }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      // 保存できなくてもメモリで動く
    }
    set({ settings })
  },
  addUsage(model: string, input: number, output: number) {
    const m = findModel(model)
    const cost = (input * m.input + output * m.output) / 1_000_000
    const u = state.usage
    set({ usage: { input: u.input + input, output: u.output + output, cost: u.cost + cost, calls: u.calls + 1 } })
    return cost
  },
}

export const estimateCost = (model: string, input: number, output: number) => {
  const m = findModel(model)
  return (input * m.input + output * m.output) / 1_000_000
}

export const formatUsd = (v: number) => (v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(3)}`)
