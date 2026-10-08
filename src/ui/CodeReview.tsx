import { useState } from 'react'

type Props = {
  title: string
  description: string
  lines: string[]
  /** 問題のある行の番号(0始まり)。どれを選んでも正解とする */
  answers: number[]
  explanation: string
}

/** コードレビュー問題: 生成されたコードを読み、問題のある行を選ぶ。 */
export default function CodeReview({ title, description, lines, answers, explanation }: Props) {
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const correct = picked !== null && answers.includes(picked)

  return (
    <div className="demo code-review">
      <h4>{title}</h4>
      <p className="muted">{description}</p>
      <ol className="review-lines" role="radiogroup" aria-label="問題のある行を選ぶ">
        {lines.map((line, i) => {
          const state = checked ? (answers.includes(i) ? ' correct-step' : i === picked ? ' wrong-step' : '') : ''
          return (
            <li key={i} className={'review-line' + state + (picked === i ? ' picked' : '')}>
              <label>
                <input
                  type="radio"
                  name={title}
                  checked={picked === i}
                  onChange={() => {
                    setPicked(i)
                    setChecked(false)
                  }}
                />
                <span className="line-no" aria-hidden>{i + 1}</span>
                <code>{line || ' '}</code>
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
          <p><strong>{correct ? '正解です' : `問題があるのは ${answers.map((a) => a + 1).join('・')} 行目です`}</strong></p>
          <p className="muted">{explanation}</p>
        </div>
      )}
    </div>
  )
}
