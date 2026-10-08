import { useState } from 'react'

type Step = { label: string; body: string; note?: string }

/** 手順やメッセージのやりとりを、1段ずつ見せる。 */
export default function StepThrough({ title, description, steps }: { title: string; description: string; steps: Step[] }) {
  const [i, setI] = useState(0)
  const s = steps[i]
  return (
    <div className="demo step-through">
      <h4>{title}</h4>
      <p className="muted">{description}</p>
      <div className="card">
        <span className="trace-label">{i + 1} / {steps.length} ・ {s.label}</span>
        <pre>{s.body}</pre>
        {s.note && <div className="muted">{s.note}</div>}
      </div>
      <div className="row">
        <button className="secondary" onClick={() => setI(i - 1)} disabled={i === 0}>前へ</button>
        <button onClick={() => setI(i + 1)} disabled={i === steps.length - 1}>次へ</button>
      </div>
    </div>
  )
}
