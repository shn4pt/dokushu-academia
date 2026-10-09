import { useState } from 'react'
import { Slider } from '../components'
import { agreement, comparePaired, passRateInterval } from '../capstone2/stats'

const pct = (v: number) => `${(v * 100).toFixed(0)}%`

/** 評価の結果の「誤差」を体験する: 合格率の区間、2つの版の比較、採点役と人の一致。 */
export default function EvalStatsLab() {
  const [n, setN] = useState(25)
  const [passed, setPassed] = useState(20)
  const k = Math.min(passed, n)
  const ci = passRateInterval(k, n)

  const [onlyA, setOnlyA] = useState(1)
  const [onlyB, setOnlyB] = useState(5)
  const [both, setBoth] = useState(15)
  const cmp = comparePaired(
    [...Array(both).fill(true), ...Array(onlyA).fill(true), ...Array(onlyB).fill(false)],
    [...Array(both).fill(true), ...Array(onlyA).fill(false), ...Array(onlyB).fill(true)],
  )

  // 採点役(行)と人(列)の判定の件数
  const [pp, setPP] = useState(18) // 両方 合格
  const [pf, setPF] = useState(3) // 採点役 合格 / 人 不合格
  const [fp, setFP] = useState(1) // 採点役 不合格 / 人 合格
  const [ff, setFF] = useState(8) // 両方 不合格
  const judge = [...Array(pp + pf).fill('pass'), ...Array(fp + ff).fill('fail')]
  const human = [...Array(pp).fill('pass'), ...Array(pf).fill('fail'), ...Array(fp).fill('pass'), ...Array(ff).fill('fail')]
  const ag = judge.length > 0 ? agreement(judge, human) : null

  return (
    <div className="demo eval-lab">
      <h4>試す:評価の「誤差」を確かめる</h4>

      <h5>1. 合格率の95%信頼区間(Wilson の区間)</h5>
      <Slider label="ケースの件数" value={n} min={5} max={500} step={5} onChange={(v) => { setN(v); setPassed(Math.min(passed, v)) }} />
      <Slider label="合格した件数" value={k} min={0} max={n} step={1} onChange={setPassed} />
      <p role="status" id="lab-rate">
        合格率 <strong>{pct(ci.rate)}</strong>(本当の合格率は、<strong>{pct(ci.low)}〜{pct(ci.high)}</strong> の範囲にありそう)
      </p>
      <p className="muted">件数を増やすと、区間が狭まります。25件では、80% と測れても、60% 台から 90% 台までの幅があります。</p>

      <h5>2. 2つの版を、同じケースで比べる</h5>
      <Slider label="A だけ合格" value={onlyA} min={0} max={30} step={1} onChange={setOnlyA} />
      <Slider label="B だけ合格" value={onlyB} min={0} max={30} step={1} onChange={setOnlyB} />
      <Slider label="両方とも合格" value={both} min={0} max={50} step={1} onChange={setBoth} />
      <p role="status" id="lab-compare">
        A の合格率 {pct(cmp.aRate)} / B の合格率 {pct(cmp.bRate)}(全 {cmp.total} 件)。差の検定の p 値: <strong>{cmp.pValue.toFixed(3)}</strong>
        {' → '}{cmp.pValue < 0.05 ? '偶然とは言いにくい差' : '偶然の範囲かもしれない'}
      </p>
      <p className="muted">結果が分かれたケース({cmp.onlyA + cmp.onlyB} 件)だけが、手がかりです。両方とも合格のケースは、比べる役に立ちません。</p>

      <h5>3. 採点役(LLM)と人の判定の一致</h5>
      <div className="row">
        <label>両方 合格 <input className="num-input" type="number" min={0} max={200} value={pp} onChange={(e) => setPP(Math.max(0, Number(e.target.value) || 0))} /></label>
        <label>採点役だけ 合格 <input className="num-input" type="number" min={0} max={200} value={pf} onChange={(e) => setPF(Math.max(0, Number(e.target.value) || 0))} /></label>
        <label>人だけ 合格 <input className="num-input" type="number" min={0} max={200} value={fp} onChange={(e) => setFP(Math.max(0, Number(e.target.value) || 0))} /></label>
        <label>両方 不合格 <input className="num-input" type="number" min={0} max={200} value={ff} onChange={(e) => setFF(Math.max(0, Number(e.target.value) || 0))} /></label>
      </div>
      {ag ? (
        <p role="status" id="lab-kappa">
          一致率 <strong>{pct(ag.observed)}</strong> ・ 偶然の一致 {pct(ag.expected)} ・ κ(カッパ) <strong>{Number.isNaN(ag.kappa) ? '決められない' : ag.kappa.toFixed(2)}</strong>
        </p>
      ) : (
        <p className="muted" role="status">件数を入れてください。</p>
      )}
      <p className="muted">判定が合格に偏っていると、一致率は高くても、κ は低くなります。「採点役は人と合っている」と言えるのは、κ もある程度高いときです。</p>
    </div>
  )
}
