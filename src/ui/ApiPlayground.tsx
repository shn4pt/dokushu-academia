import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type Anthropic from '@anthropic-ai/sdk'
import { buildRequest, describeError, runMessage } from '../api/client'
import { estimateCost, findModel, formatUsd, useApi } from '../api/settings'

export type SampleResponse = {
  text: string
  stopReason: string
  usage: { input: number; output: number }
}

type Props = {
  title: string
  description?: string
  system?: string
  prompt: string
  /** それまでの会話(複数ターンの例)。表示のみで、編集はしない */
  history?: Anthropic.Beta.BetaMessageParam[]
  jsonSchema?: Record<string, unknown>
  /** キーがないときに見せる、説明用に用意した応答の例(実際の API の出力ではない) */
  sample: SampleResponse
}

const stopReasonText: Record<string, string> = {
  end_turn: '応答を書き終えた',
  max_tokens: '出力の上限(max_tokens)に達して途中で止まった',
  stop_sequence: '指定した停止文字列に達した',
  tool_use: 'ツールを呼び出したい',
  pause_turn: 'サーバー側ツールの処理の途中で一時停止した',
  refusal: '安全上の理由で応答を断った',
}

type View = {
  source: 'api' | 'sample'
  blocks: { kind: 'thinking' | 'text' | 'fallback'; text: string }[]
  stopReason: string
  usage: { input: number; output: number }
  model: string
  cost: number
}

function toView(message: Anthropic.Beta.BetaMessage, cost: number): View {
  const blocks: View['blocks'] = []
  for (const b of message.content) {
    if (b.type === 'thinking') blocks.push({ kind: 'thinking', text: b.thinking })
    else if (b.type === 'text') blocks.push({ kind: 'text', text: b.text })
    else if (b.type === 'fallback') blocks.push({ kind: 'fallback', text: `${b.from.model} が断ったため、${b.to.model} が続けました` })
  }
  return {
    source: 'api',
    blocks,
    stopReason: message.stop_reason ?? '',
    usage: { input: message.usage.input_tokens, output: message.usage.output_tokens },
    model: message.model,
    cost,
  }
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

export default function ApiPlayground({ title, description, system, prompt, history = [], jsonSchema, sample }: Props) {
  const api = useApi()
  const [sys, setSys] = useState(system ?? '')
  const [text, setText] = useState(prompt)
  const [view, setView] = useState<View | null>(null)
  const [live, setLive] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const model = findModel(api.settings.model)

  const messages: Anthropic.Beta.BetaMessageParam[] = useMemo(() => [...history, { role: 'user', content: text }], [history, text])
  // 設定(モデルや effort)が変わったら、表示するリクエストも変わる
  const request = useMemo(
    () => buildRequest({ system: sys || undefined, messages, jsonSchema }),
    [sys, messages, jsonSchema, api.settings],
  )

  async function run() {
    setError('')
    setView(null)
    setLive('')
    setRunning(true)
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const r = await runMessage({ system: sys || undefined, messages, jsonSchema, signal: controller.signal, onText: (d) => setLive((s) => s + d) })
      setView(toView(r.message, r.cost))
    } catch (e) {
      setError(describeError(e))
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }

  function showSample() {
    setError('')
    setLive('')
    setView({
      source: 'sample',
      blocks: [{ kind: 'text', text: sample.text }],
      stopReason: sample.stopReason,
      usage: sample.usage,
      model: model.id,
      cost: estimateCost(model.id, sample.usage.input, sample.usage.output),
    })
  }

  const finalText = view ? view.blocks.filter((b) => b.kind === 'text').map((b) => b.text).join('') : ''
  const json = view && jsonSchema && view.stopReason !== 'refusal' ? parseJson(finalText) : null

  return (
    <div className="demo playground">
      <h4>{title}</h4>
      {description && <p className="muted">{description}</p>}

      <div className="api-status">
        {api.apiKey ? (
          <span className="muted">
            {model.label} ・ effort {api.settings.effort} ・ 最大出力 {api.settings.maxTokens} トークン ・ <Link to="/api-key">設定を変更</Link>
          </span>
        ) : (
          <span className="muted">
            APIキーが未設定です。用意した応答の例で流れを確認できます。実際に試すには <Link to="/api-key">APIキーを設定</Link> してください。
          </span>
        )}
      </div>

      {history.length > 0 && (
        <div className="history">
          {history.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <span className="muted">{m.role}</span>
              <div>{typeof m.content === 'string' ? m.content : '(ブロック)'}</div>
            </div>
          ))}
        </div>
      )}
      {system !== undefined && (
        <label className="field">
          <span className="muted">system(モデルへの前提・役割の指示)</span>
          <textarea className="text-input text-area" rows={3} value={sys} onChange={(e) => setSys(e.target.value)} />
        </label>
      )}
      <label className="field">
        <span className="muted">user(送るメッセージ)</span>
        <textarea className="text-input text-area" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {jsonSchema && (
        <details>
          <summary>出力に指定する JSON Schema</summary>
          <pre>{JSON.stringify(jsonSchema, null, 2)}</pre>
        </details>
      )}
      <details>
        <summary>送信するリクエストの中身</summary>
        <pre>{JSON.stringify(request, null, 2)}</pre>
      </details>

      <div className="row">
        {api.apiKey &&
          (running ? (
            <button className="secondary" onClick={() => abortRef.current?.abort()}>中断</button>
          ) : (
            <button onClick={run} disabled={!text.trim()}>実行する</button>
          ))}
        <button className="secondary" onClick={showSample} disabled={running}>応答の例を見る</button>
      </div>

      {error && <p className="notice" role="alert">{error}</p>}

      {running && (
        <div className="response" aria-live="polite">
          <span className="muted">受信中…</span>
          <div className="response-text">{live}</div>
        </div>
      )}

      {view && !running && (
        <div className="response" role="status">
          {view.source === 'sample' && <p className="muted">説明用に用意した応答の例です。実際の API の出力ではありません(実際の出力は毎回異なります)。</p>}
          {view.blocks.map((b, i) =>
            b.kind === 'thinking' ? (
              <details key={i} className="thinking">
                <summary>thinking ブロック(モデルの思考)</summary>
                <div className="muted">{b.text || '(内容は表示しない設定です。設定で「思考の要約を表示」を選ぶと要約が届きます)'}</div>
              </details>
            ) : b.kind === 'fallback' ? (
              <p key={i} className="notice">フォールバック: {b.text}</p>
            ) : (
              <div key={i} className="response-text">{b.text}</div>
            ),
          )}
          {json && (
            <div className={json.ok ? 'json-ok' : 'notice'}>
              {json.ok ? (
                <>
                  <strong>JSON として解析できました</strong>
                  <pre>{JSON.stringify(json.value, null, 2)}</pre>
                </>
              ) : (
                <>JSON として解析できませんでした: {json.error}</>
              )}
            </div>
          )}
          <table className="calc">
            <tbody>
              <tr><td>stop_reason</td><td><code>{view.stopReason}</code> {stopReasonText[view.stopReason] ?? ''}</td></tr>
              <tr><td>入力トークン</td><td>{view.usage.input.toLocaleString()}</td></tr>
              <tr><td>出力トークン(思考を含む)</td><td>{view.usage.output.toLocaleString()}</td></tr>
              <tr><td>概算の費用</td><td>{formatUsd(view.cost)}({findModel(view.model).label} の標準料金で計算)</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
