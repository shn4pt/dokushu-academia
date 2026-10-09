import { useMemo, useState } from 'react'
import { simulateIntervals } from '../data/ci'

const TRIALS = 100
const MU = 50
const SIGMA = 10
const W = 420
const lo = 25
const hi = 75
const sx = (v: number) => ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (W - 20) + 10

/** 標本を取り直して、95% 信頼区間を 100 回作ると、何回、真の平均を含むか。 */
export default function CiLab() {
  const [n, setN] = useState(10)
  const [seed, setSeed] = useState(1)
  const intervals = useMemo(() => simulateIntervals(seed * 1000 + n, n, TRIALS, MU, SIGMA), [seed, n])
  const hits = intervals.filter((i) => i.covers).length
  const avgWidth = intervals.reduce((s, i) => s + (i.high - i.low), 0) / intervals.length
  return (
    <div className="demo ci-lab">
      <h4>試す:標本を取り直して、信頼区間を作る</h4>
      <p className="muted">真の平均が 50、標準偏差が 10 の母集団から、n 個の標本を取って、95% 信頼区間を作ることを、{TRIALS} 回繰り返します。区間のうち、真の平均(縦の線)を含むものは、何個あるでしょうか。</p>
      <div className="row">
        <label className="row">
          標本の大きさ n
          <select className="sel-input" value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="標本の大きさ">
            {[5, 10, 30, 100].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <button className="secondary" onClick={() => setSeed(seed + 1)}>標本を取り直す(100 回)</button>
      </div>
      <svg viewBox={`0 0 ${W} 220`} role="img" aria-label={`${TRIALS} 個の信頼区間。真の平均を含むものは ${hits} 個`} className="plot-svg">
        <line x1={sx(MU)} y1={0} x2={sx(MU)} y2={220} stroke="currentColor" opacity="0.6" />
        {intervals.map((i, k) => (
          <line key={k} x1={sx(i.low)} x2={sx(i.high)} y1={4 + k * 2.1} y2={4 + k * 2.1} className={i.covers ? 'ci-hit' : 'ci-miss'} strokeWidth="1.4" />
        ))}
      </svg>
      <p role="status">
        <strong id="ci-hits">{hits}</strong> 個 / {TRIALS} 個の区間が、真の平均を含んでいます(含まないのは <span id="ci-misses">{TRIALS - hits}</span> 個)。区間の平均の幅: <span id="ci-width">{avgWidth.toFixed(1)}</span>
      </p>
      <p className="muted">n を大きくすると、区間の幅は狭くなります。取り直すたびに、含む個数は 95 個の前後で、ばらつきます。</p>
    </div>
  )
}
