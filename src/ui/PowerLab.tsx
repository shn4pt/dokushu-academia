import { useState } from 'react'
import { Slider } from '../components'
import { power } from '../data/power'

const NS = [5, 10, 20, 30, 50, 100, 200, 500]

/** 本当に差があるとき、検定で、その差を検出できる確率(検出力)。 */
export default function PowerLab() {
  const [d, setD] = useState(0.5)
  const [nIdx, setNIdx] = useState(3)
  const [alpha, setAlpha] = useState(0.05)
  const n = NS[nIdx]
  const p = power(d, n, alpha)
  return (
    <div className="demo power-lab">
      <h4>試す:差があるのに、見逃す確率</h4>
      <p className="muted">平均についての両側検定(母集団の標準偏差が、分かっているとします)。本当に、帰無仮説の値から、差があるとき、検定が、その差を検出できる確率(検出力)を見ます。</p>
      <Slider label="差の大きさ(標準偏差の何倍か)" value={d} min={0.1} max={1.5} step={0.05} onChange={setD} format={(v) => v.toFixed(2)} />
      <Slider label="標本の大きさ n" value={nIdx} min={0} max={NS.length - 1} step={1} onChange={setNIdx} format={() => String(n)} />
      <label className="row">
        有意水準 α
        <select className="sel-input" value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} aria-label="有意水準">
          {[0.1, 0.05, 0.01].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </label>
      <table className="calc text">
        <tbody>
          <tr><td>検出力(差を検出できる確率)</td><td><strong id="pw-power">{(p * 100).toFixed(1)}%</strong></td></tr>
          <tr><td>見逃す確率 β(第 2 種の誤り)</td><td id="pw-beta">{((1 - p) * 100).toFixed(1)}%</td></tr>
        </tbody>
      </table>
      <p className="muted">標本が小さいと、大きな差があっても、見逃すことがあります。有意水準を厳しくする(小さくする)と、見逃す確率は、増えます。</p>
    </div>
  )
}
