import { useState } from 'react'

type Props = { title: string; description: string; lines: string[]; explanation: string }

function shuffled(n: number) {
  const idx = Array.from({ length: n }, (_, i) => i)
  do {
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[idx[i], idx[j]] = [idx[j], idx[i]]
    }
  } while (n > 1 && idx.every((v, i) => v === i)) // 最初から正解の並びにならないように
  return idx
}

/** 並べ替え問題: コードの行を正しい順番に並べる。 */
export default function CodeOrder({ title, description, lines, explanation }: Props) {
  const [order, setOrder] = useState(() => shuffled(lines.length))
  const [checked, setChecked] = useState(false)
  const allCorrect = order.every((v, i) => v === i)

  const move = (pos: number, delta: number) => {
    const to = pos + delta
    if (to < 0 || to >= order.length) return
    const next = [...order]
    ;[next[pos], next[to]] = [next[to], next[pos]]
    setOrder(next)
    setChecked(false)
  }

  return (
    <div className="demo code-order">
      <h4>{title}</h4>
      <p className="muted">{description}</p>
      <ol className="order-list">
        {order.map((lineIndex, pos) => (
          <li key={lineIndex} className={checked ? (lineIndex === pos ? 'ok' : 'ng') : ''}>
            <code className="order-line">{lines[lineIndex]}</code>
            <span className="order-buttons">
              <button className="secondary" onClick={() => move(pos, -1)} disabled={pos === 0} aria-label={`「${lines[lineIndex]}」を上へ`}>↑</button>
              <button className="secondary" onClick={() => move(pos, 1)} disabled={pos === order.length - 1} aria-label={`「${lines[lineIndex]}」を下へ`}>↓</button>
            </span>
          </li>
        ))}
      </ol>
      <div className="row">
        <button onClick={() => setChecked(true)}>答え合わせ</button>
        <button className="secondary" onClick={() => { setOrder(lines.map((_, i) => i)); setChecked(true) }}>正解を見る</button>
        <button className="secondary" onClick={() => { setOrder(shuffled(lines.length)); setChecked(false) }}>並べ直す</button>
      </div>
      {checked && (
        <div role="status">
          <p><strong>{allCorrect ? '正しい順番です' : '順番が違う行があります(赤い行)'}</strong></p>
          {allCorrect && <p className="muted">{explanation}</p>}
        </div>
      )}
    </div>
  )
}
