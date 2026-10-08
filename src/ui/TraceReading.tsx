import { useState } from 'react'
import type { TraceStep } from './ToolLoopPlayground'

type Props = {
  title: string
  description: string
  steps: TraceStep[]
  /** 問題のあるステップの番号(0始まり) */
  answer: number
  explanation: string
}

function label(s: TraceStep) {
  switch (s.kind) {
    case 'user': return 'user'
    case 'assistant': return 'assistant'
    case 'tool_use': return `tool_use: ${s.name}`
    case 'approval': return '利用者の承認'
    case 'tool_result': return `tool_result: ${s.name}${s.isError ? '(is_error)' : ''}`
    case 'info': return '情報'
  }
}

function body(s: TraceStep) {
  switch (s.kind) {
    case 'user':
    case 'assistant':
    case 'info':
      return s.text
    case 'tool_use': return JSON.stringify(s.input)
    case 'approval': return s.decision === 'approved' ? '許可' : '拒否'
    case 'tool_result': return s.content
  }
}

/** トレース読解: エージェントの実行ログを読み、問題のあるステップを選ぶ。 */
export default function TraceReading({ title, description, steps, answer, explanation }: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)

  return (
    <div className="demo trace-reading">
      <h4>{title}</h4>
      <p className="muted">{description}</p>
      <ol className="trace" role="radiogroup" aria-label="問題のあるステップを選ぶ">
        {steps.map((s, i) => {
          const state = checked ? (i === answer ? ' correct-step' : i === picked ? ' wrong-step' : '') : ''
          return (
            <li key={i} className={`trace-step ${s.kind}${state}`}>
              <label className="trace-pick">
                <input
                  type="radio"
                  name={title}
                  checked={picked === i}
                  onChange={() => {
                    setPicked(i)
                    setChecked(false)
                  }}
                />
                <span>
                  <span className="trace-label">{i + 1}. {label(s)}</span>
                  <span className="trace-body">{body(s)}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ol>
      <div className="row">
        <button onClick={() => setChecked(true)} disabled={picked === null}>答え合わせ</button>
      </div>
      {checked && (
        <div role="status">
          <p><strong>{picked === answer ? '正解です' : `正解はステップ ${answer + 1} です`}</strong></p>
          <p className="muted">{explanation}</p>
        </div>
      )}
    </div>
  )
}
