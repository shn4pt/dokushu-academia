import { useState } from 'react'
import { datasets, summarize } from '../data/anscombe'

const W = 360
const H = 260
const PAD = 36
const sx = (x: number) => PAD + ((x - 2) / 18) * (W - PAD * 2)
const sy = (y: number) => H - PAD - ((y - 2) / 12) * (H - PAD * 2)

/** 要約の数字は同じなのに、図にすると全く違う、4 組のデータ。 */
export default function AnscombeDemo() {
  const [id, setId] = useState<'I' | 'II' | 'III' | 'IV'>('I')
  const d = datasets.find((x) => x.id === id)!
  const s = summarize(d.points)
  const line = [2, 20].map((x) => ({ x, y: s.intercept + s.slope * x }))
  return (
    <div className="demo anscombe-demo">
      <h4>試す:同じ数字の、4 組のデータ</h4>
      <p className="muted">下の表の数字は、4 組とも(ほぼ)同じです。組を切り替えて、図を見比べてください。</p>
      <fieldset className="plain-fieldset">
        <legend className="muted">データの組</legend>
        {datasets.map((x) => (
          <label key={x.id}>
            <input type="radio" name="anscombe-set" checked={id === x.id} onChange={() => setId(x.id)} /> {x.id}
          </label>
        ))}
      </fieldset>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`データの組 ${d.id} の散布図と、回帰直線。${d.note}`} className="plot-svg">
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="currentColor" opacity="0.4" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="currentColor" opacity="0.4" />
        <line x1={sx(line[0].x)} y1={sy(line[0].y)} x2={sx(line[1].x)} y2={sy(line[1].y)} stroke="var(--accent)" strokeWidth="1.5" />
        {d.points.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="4" fill="var(--accent)" fillOpacity="0.55" stroke="var(--accent)" />
        ))}
        <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="currentColor">x</text>
        <text x={12} y={H / 2} textAnchor="middle" fontSize="11" fill="currentColor">y</text>
      </svg>
      <p role="status" id="anscombe-note"><strong>組 {d.id}</strong>:{d.note}</p>
      <table className="calc text anscombe-table">
        <tbody>
          <tr><td>x の平均</td><td id="an-mx">{s.meanX.toFixed(2)}</td></tr>
          <tr><td>y の平均</td><td id="an-my">{s.meanY.toFixed(2)}</td></tr>
          <tr><td>x の分散</td><td id="an-vx">{s.varX.toFixed(2)}</td></tr>
          <tr><td>y の分散</td><td id="an-vy">{s.varY.toFixed(2)}</td></tr>
          <tr><td>x と y の相関係数</td><td id="an-r">{s.r.toFixed(3)}</td></tr>
          <tr><td>回帰直線</td><td id="an-line">y = {s.intercept.toFixed(2)} + {s.slope.toFixed(3)}x</td></tr>
        </tbody>
      </table>
    </div>
  )
}
