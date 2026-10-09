import { useMemo, useState } from 'react'
import { peekFalsePositiveRate } from '../data/peek'

const LOOKS = [1, 2, 5, 10, 20, 50]
const TRIALS = 20000

/** A/A テスト(本当は差がない)を、結果を見ながら続けて、有意になったら止めると、何%で「有意」と誤って判断するか。 */
export default function PeekLab() {
  const [idx, setIdx] = useState(2)
  const looks = LOOKS[idx]
  const rate = useMemo(() => peekFalsePositiveRate(20261009 + looks, looks, TRIALS), [looks])
  return (
    <div className="demo peek-lab">
      <h4>試す:途中で結果を見て、有意になったら止める</h4>
      <p className="muted">本当は、差のない 2 つの群(A/A テスト)で、データが増えるたびに結果を見て、1 回でも「有意(5% の水準)」になったら止める、とします。そのとき、誤って「有意」と判断する割合を、{TRIALS.toLocaleString('ja-JP')} 回のシミュレーションで見ます。</p>
      <label className="row slider-row">
        <span className="slider-label">結果を見る回数 = {looks} 回</span>
        <input type="range" min={0} max={LOOKS.length - 1} step={1} value={idx} onChange={(e) => setIdx(Number(e.target.value))} aria-label="結果を見る回数" />
      </label>
      <p role="status">
        誤って「有意」と判断する割合: <strong id="peek-rate">{(rate * 100).toFixed(1)}%</strong>(決めた水準は 5%)
      </p>
      <p className="muted">見る回数が増えるほど、誤りが増えます。1 回だけ(あらかじめ決めた標本の大きさで見る)なら、約 5% です。</p>
    </div>
  )
}
