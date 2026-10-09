import { useState } from 'react'
import { Slider } from '../components'
import { expectedCounts, ppv } from '../data/ppv'

const N_CHOICES = [1, 2, 5, 10, 30, 100, 1000]

/** 「有意な結果」が本当である確率は、事前の見込み・検出力・有意水準で、どう変わるか(Ioannidis 2005 の式)。 */
export default function PpvLab() {
  const [oneIn, setOneIn] = useState(3) // 本当の関係は、検証した仮説の「1 : N」(N = N_CHOICES[oneIn])
  const [power, setPower] = useState(80)
  const [alphaIdx, setAlphaIdx] = useState(1)
  const alphas = [0.01, 0.05, 0.1]
  const N = N_CHOICES[oneIn]
  const R = 1 / N
  const alpha = alphas[alphaIdx]
  const p = ppv(R, power / 100, alpha)
  const c = expectedCounts(1000, R, power / 100, alpha)
  return (
    <div className="demo ppv-lab">
      <h4>試す:「有意な結果」は、どのくらい本当か</h4>
      <p className="muted">仮説を 1,000 個検証したとします。そのうち有意な結果が出たものが、どれだけ本当の関係だったかを、見積もります(偏りのない場合の式)。</p>
      <Slider label="本当の関係 : 関係なし(仮説の見込み)" value={oneIn} min={0} max={N_CHOICES.length - 1} step={1} onChange={setOneIn} format={() => `1 : ${N}`} />
      <Slider label="検出力(本当の関係を、有意と検出できる確率)" value={power} min={5} max={99} step={1} onChange={setPower} format={(v) => `${v}%`} />
      <label className="row">
        有意水準
        <select className="sel-input" value={alphaIdx} onChange={(e) => setAlphaIdx(Number(e.target.value))} aria-label="有意水準">
          {alphas.map((a, i) => <option key={a} value={i}>{a}</option>)}
        </select>
      </label>
      <table className="calc text">
        <tbody>
          <tr><td>本当の関係 / 関係なし(1,000 個のうち)</td><td id="ppv-split">{c.trueN.toFixed(1)} / {c.falseN.toFixed(1)}</td></tr>
          <tr><td>本当の関係で、有意になった数</td><td id="ppv-tp">{c.truePositive.toFixed(1)}</td></tr>
          <tr><td>関係なしなのに、有意になった数</td><td id="ppv-fp">{c.falsePositive.toFixed(1)}</td></tr>
          <tr><td>有意になった結果のうち、本当である割合</td><td><strong id="ppv-ppv">{(p * 100).toFixed(1)}%</strong></td></tr>
        </tbody>
      </table>
      <p className="muted">有意水準 0.05 のとき、見込みが低い(1 : 100 など)と、検出力が高くても、有意な結果の多くは、関係のないものになります。</p>
    </div>
  )
}
