import { useState } from 'react'

type Item = { text: string; ok: string[]; why: string }
type Props = { title: string; description: string; options: string[]; items: Item[] }

/** 分類問題: 項目ごとに選択肢を1つ選び、まとめて答え合わせする(正解が複数ある項目もある)。 */
export default function ClassifyItems({ title, description, options, items }: Props) {
  const [picks, setPicks] = useState<(string | null)[]>(() => items.map(() => null))
  const [checked, setChecked] = useState(false)
  const isOk = (i: number) => picks[i] !== null && items[i].ok.includes(picks[i]!)
  const score = items.filter((_, i) => isOk(i)).length
  return (
    <div className="demo">
      <h4>{title}</h4>
      <p className="muted">{description}</p>
      {items.map((t, i) => (
        <div key={t.text} className={'task-row' + (checked ? (isOk(i) ? ' ok' : ' ng') : '')}>
          <div><strong>{t.text}</strong></div>
          <div className="row">
            {options.map((o) => (
              <button key={o} className={picks[i] === o ? '' : 'secondary'} onClick={() => { setPicks(picks.map((p, j) => (j === i ? o : p))); setChecked(false) }}>{o}</button>
            ))}
          </div>
          {checked && <p className="muted">答え: {t.ok.join(' または ')}。{t.why}</p>}
        </div>
      ))}
      <div className="row">
        <button onClick={() => setChecked(true)} disabled={picks.some((p) => p === null)}>答え合わせ</button>
        {checked && <strong>{score} / {items.length}</strong>}
      </div>
    </div>
  )
}
