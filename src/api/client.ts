import Anthropic from '@anthropic-ai/sdk'
import { apiActions, findModel, getApiState } from './settings'

export type RunInput = {
  system?: string
  messages: Anthropic.Beta.BetaMessageParam[]
  /** 構造化出力: JSON Schema を指定すると、応答をそのスキーマに沿った JSON に制約する */
  jsonSchema?: Record<string, unknown>
  onText?: (delta: string) => void
  signal?: AbortSignal
}

export type RunResult = {
  message: Anthropic.Beta.BetaMessage
  /** 画面に表示する、実際に送ったリクエスト(APIキーは含まない) */
  request: Anthropic.Beta.MessageCreateParamsNonStreaming
  cost: number
}

/** 学習用: ブラウザから直接 Claude API を呼ぶ。本番では、キーを持つサーバー側から呼ぶこと。 */
function client() {
  const { apiKey } = getApiState()
  if (!apiKey) throw new Error('APIキーが設定されていません')
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

export function buildRequest(input: Omit<RunInput, 'onText' | 'signal'> & { tools?: Anthropic.Beta.BetaToolUnion[] }) {
  const { settings } = getApiState()
  const model = findModel(settings.model)
  const request: Anthropic.Beta.MessageCreateParamsNonStreaming = {
    model: model.id,
    max_tokens: settings.maxTokens,
    ...(input.system ? { system: input.system } : {}),
    messages: input.messages,
    ...(input.tools ? { tools: input.tools } : {}),
    thinking: settings.showThinking ? { type: 'adaptive', display: 'summarized' } : { type: 'adaptive' },
    output_config: {
      effort: settings.effort,
      ...(input.jsonSchema ? { format: { type: 'json_schema', schema: input.jsonSchema } } : {}),
    },
    // 安全のための拒否が起きたとき、サーバー側で推奨モデルに切り替えて続行する(対応モデルのみ)
    ...(model.fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
  }
  return request
}

export async function runMessage(input: RunInput): Promise<RunResult> {
  const request = buildRequest(input)
  // 長い出力でもタイムアウトしにくいよう、ストリーミングで受け取り、最後に完全な応答を組み立てる
  const stream = client().beta.messages.stream(request, { signal: input.signal })
  if (input.onText) stream.on('text', input.onText)
  const message = await stream.finalMessage()
  const cost = apiActions.addUsage(request.model, message.usage.input_tokens, message.usage.output_tokens)
  return { message, request, cost }
}

/**
 * ツール付きの1回の呼び出し(ツール呼び出しループの1ステップ)。
 * 出力は短いので、ストリーミングせずに完全な応答を受け取る。
 */
export async function createWithTools(input: {
  system?: string
  messages: Anthropic.Beta.BetaMessageParam[]
  tools: Anthropic.Beta.BetaToolUnion[]
  signal?: AbortSignal
}): Promise<RunResult> {
  const request = buildRequest({ system: input.system, messages: input.messages, tools: input.tools })
  const message = await client().beta.messages.create(request, { signal: input.signal })
  const cost = apiActions.addUsage(request.model, message.usage.input_tokens, message.usage.output_tokens)
  return { message, request, cost }
}

/** 組み立て済みのリクエストを、そのまま1回送る(プロンプトキャッシュの実験など、リクエストの中身を自分で決めたいとき) */
export async function sendRequest(request: Anthropic.Beta.MessageCreateParamsNonStreaming, signal?: AbortSignal) {
  const message = await client().beta.messages.create(request, { signal })
  apiActions.addUsage(request.model, message.usage.input_tokens + (message.usage.cache_creation_input_tokens ?? 0) + (message.usage.cache_read_input_tokens ?? 0), message.usage.output_tokens)
  return message
}

/** キーの確認。モデル情報の取得はトークンを消費しない。 */
export async function checkKey() {
  const { settings } = getApiState()
  return client().models.retrieve(findModel(settings.model).id)
}

/** エラーを、学習者に分かる日本語にする(SDK の型付き例外で判定する)。 */
export function describeError(e: unknown): string {
  if (e instanceof Anthropic.APIUserAbortError) return '中断しました。'
  if (e instanceof Anthropic.AuthenticationError) return 'APIキーが無効です(401)。キーを確認してください。'
  if (e instanceof Anthropic.PermissionDeniedError) return 'このキーでは、この操作の権限がありません(403)。'
  if (e instanceof Anthropic.NotFoundError) return 'モデルなどが見つかりません(404)。'
  if (e instanceof Anthropic.RateLimitError) return 'レート制限に達しました(429)。少し待ってから再実行してください。'
  if (e instanceof Anthropic.BadRequestError) return `リクエストが不正です(400): ${e.message}`
  if (e instanceof Anthropic.InternalServerError) return `API側のエラーです(${e.status})。時間をおいて再実行してください。`
  if (e instanceof Anthropic.APIConnectionError) return '接続できませんでした。ネットワークを確認してください。'
  if (e instanceof Anthropic.APIError) return `APIエラー(${e.status}): ${e.message}`
  return e instanceof Error ? e.message : String(e)
}
