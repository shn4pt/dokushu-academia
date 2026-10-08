import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type Anthropic from '@anthropic-ai/sdk'
import { createWithTools, describeError } from '../api/client'
import { findModel, formatUsd, useApi } from '../api/settings'
import type { ToolSpec } from './mockTools'

export type TraceStep =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool_use'; name: string; input: unknown }
  | { kind: 'approval'; name: string; decision: 'approved' | 'declined' }
  | { kind: 'tool_result'; name: string; content: string; isError?: boolean }
  | { kind: 'info'; text: string }

type Props = {
  title: string
  description?: string
  system: string
  prompt: string
  tools: ToolSpec[]
  maxSteps?: number
  /** キーがないときに見せる、説明用に用意したやりとりの例 */
  sample: TraceStep[]
}

export function TraceView({ steps }: { steps: TraceStep[] }) {
  return (
    <ol className="trace">
      {steps.map((s, i) => (
        <li key={i} className={`trace-step ${s.kind}${'isError' in s && s.isError ? ' error' : ''}`}>
          {s.kind === 'user' && (<><span className="trace-label">user</span><div className="response-text">{s.text}</div></>)}
          {s.kind === 'assistant' && (<><span className="trace-label">assistant</span><div className="response-text">{s.text}</div></>)}
          {s.kind === 'tool_use' && (<><span className="trace-label">tool_use: {s.name}</span><pre>{JSON.stringify(s.input, null, 2)}</pre></>)}
          {s.kind === 'approval' && (<><span className="trace-label">利用者の承認</span><div>{s.name} の実行を{s.decision === 'approved' ? '許可しました' : '拒否しました'}</div></>)}
          {s.kind === 'tool_result' && (<><span className="trace-label">tool_result: {s.name}{s.isError ? '(is_error)' : ''}</span><pre>{s.content}</pre></>)}
          {s.kind === 'info' && <div className="muted">{s.text}</div>}
        </li>
      ))}
    </ol>
  )
}

/** ツール呼び出しループを、実際の API と、ブラウザ内の模擬ツールで動かす。 */
export default function ToolLoopPlayground({ title, description, system, prompt, tools, maxSteps = 6, sample }: Props) {
  const api = useApi()
  const [text, setText] = useState(prompt)
  const [steps, setSteps] = useState<TraceStep[]>([])
  const [running, setRunning] = useState(false)
  const [isSample, setIsSample] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<{ name: string; input: unknown; resolve: (ok: boolean) => void } | null>(null)
  const [totals, setTotals] = useState({ calls: 0, input: 0, output: 0, cost: 0 })
  const abortRef = useRef<AbortController | null>(null)

  const push = (s: TraceStep) => setSteps((prev) => [...prev, s])

  async function run() {
    setError('')
    setIsSample(false)
    setSteps([{ kind: 'user', text }])
    setTotals({ calls: 0, input: 0, output: 0, cost: 0 })
    setRunning(true)
    const controller = new AbortController()
    abortRef.current = controller
    const toolDefs = tools.map((t) => t.def)
    const byName = new Map(tools.map((t) => [t.def.name, t]))
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: 'user', content: text }]
    try {
      for (let step = 1; ; step++) {
        if (step > maxSteps) {
          push({ kind: 'info', text: `呼び出しの上限(${maxSteps}回)に達したため、ループを止めました。` })
          break
        }
        const { message, cost } = await createWithTools({ system, messages, tools: toolDefs, signal: controller.signal })
        setTotals((t) => ({ calls: t.calls + 1, input: t.input + message.usage.input_tokens, output: t.output + message.usage.output_tokens, cost: t.cost + cost }))
        for (const b of message.content) {
          if (b.type === 'text' && b.text.trim()) push({ kind: 'assistant', text: b.text })
          if (b.type === 'tool_use') push({ kind: 'tool_use', name: b.name, input: b.input })
        }
        // 応答の内容(思考やツール呼び出しのブロックを含む)は、そのまま履歴に加える
        messages.push({ role: 'assistant', content: message.content })

        if (message.stop_reason === 'refusal') {
          push({ kind: 'info', text: '安全上の理由で断られたため、終了しました。' })
          break
        }
        if (message.stop_reason === 'max_tokens') {
          push({ kind: 'info', text: '出力の上限(max_tokens)に達したため、途中の結果は使わずに終了しました。' })
          break
        }
        const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
        if (message.stop_reason !== 'tool_use' || toolUses.length === 0) {
          push({ kind: 'info', text: `完了しました(stop_reason: ${message.stop_reason})。` })
          break
        }

        // 1回の応答に複数の呼び出しがあれば、すべて実行し、結果を1つの user メッセージにまとめて返す
        const results: Anthropic.Beta.BetaToolResultBlockParam[] = []
        for (const use of toolUses) {
          const spec = byName.get(use.name)
          const input = (use.input ?? {}) as Record<string, unknown>
          let outcome: { content: string; isError?: boolean }
          if (!spec) {
            outcome = { content: `ツール ${use.name} はありません。`, isError: true }
          } else if (spec.needsApproval) {
            const ok = await new Promise<boolean>((resolve) => setPending({ name: use.name, input, resolve }))
            setPending(null)
            push({ kind: 'approval', name: use.name, decision: ok ? 'approved' : 'declined' })
            outcome = ok ? spec.run(input) : { content: '利用者がこの操作を許可しませんでした。別の方法を提案してください。', isError: true }
          } else {
            outcome = spec.run(input)
          }
          push({ kind: 'tool_result', name: use.name, content: outcome.content, isError: outcome.isError })
          results.push({ type: 'tool_result', tool_use_id: use.id, content: outcome.content, ...(outcome.isError ? { is_error: true } : {}) })
        }
        messages.push({ role: 'user', content: results })
      }
    } catch (e) {
      setError(describeError(e))
    } finally {
      setPending(null)
      setRunning(false)
      abortRef.current = null
    }
  }

  function showSample() {
    setError('')
    setIsSample(true)
    setTotals({ calls: 0, input: 0, output: 0, cost: 0 })
    setSteps(sample)
  }

  const model = findModel(api.settings.model)

  return (
    <div className="demo playground tool-loop">
      <h4>{title}</h4>
      {description && <p className="muted">{description}</p>}
      <div className="api-status">
        {api.apiKey ? (
          <span className="muted">{model.label} ・ effort {api.settings.effort} ・ ループの上限 {maxSteps} 回 ・ <Link to="/api-key">設定を変更</Link></span>
        ) : (
          <span className="muted">APIキーが未設定です。用意したやりとりの例で流れを確認できます。実際に試すには <Link to="/api-key">APIキーを設定</Link> してください。</span>
        )}
      </div>
      <details>
        <summary>使えるツール({tools.length}個)と system</summary>
        <pre>{JSON.stringify({ system, tools: tools.map((t) => t.def) }, null, 2)}</pre>
        <p className="muted">ツールはこのページの中で動く模擬のもので、データは架空です。承認が必要なツール: {tools.filter((t) => t.needsApproval).map((t) => t.def.name).join(', ') || 'なし'}</p>
      </details>
      <label className="field">
        <span className="muted">user(依頼)</span>
        <textarea className="text-input text-area" rows={3} value={text} onChange={(e) => setText(e.target.value)} disabled={running} />
      </label>
      <div className="row">
        {api.apiKey &&
          (running ? (
            <button className="secondary" onClick={() => abortRef.current?.abort()} disabled={!!pending}>中断</button>
          ) : (
            <button onClick={run} disabled={!text.trim()}>実行する</button>
          ))}
        <button className="secondary" onClick={showSample} disabled={running}>やりとりの例を見る</button>
      </div>

      {error && <p className="notice" role="alert">{error}</p>}
      {isSample && <p className="muted">説明用に用意したやりとりの例です。実際の API の出力ではありません。</p>}
      {steps.length > 0 && <TraceView steps={steps} />}

      {pending && (
        <div className="card approval" role="alertdialog" aria-label="ツールの実行の承認">
          <strong>{pending.name} を実行しようとしています。許可しますか?</strong>
          <pre>{JSON.stringify(pending.input, null, 2)}</pre>
          <div className="row">
            <button onClick={() => pending.resolve(true)}>許可する</button>
            <button className="secondary" onClick={() => pending.resolve(false)}>拒否する</button>
          </div>
        </div>
      )}
      {running && !pending && <p className="muted" aria-live="polite">実行中…</p>}
      {totals.calls > 0 && (
        <p className="muted">
          API 呼び出し {totals.calls} 回 ・ 入力 {totals.input.toLocaleString()} ・ 出力 {totals.output.toLocaleString()} トークン ・ 概算 {formatUsd(totals.cost)}
        </p>
      )}
    </div>
  )
}
