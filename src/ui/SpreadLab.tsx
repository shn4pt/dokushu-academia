import { useState } from 'react'
import { Slider } from '../components'
import { mad, mean, median, range, sd } from '../data/descriptive'

const BASE = [48, 50, 51, 52, 53, 54, 55, 57, 60]
const f = (v: number) => v.toFixed(2)

/** 10 個目の値を動かして、平均・中央値・標準偏差・範囲・中央絶対偏差が、どう変わるかを見る。 */
export default function SpreadLab() {
  const [x, setX] = useState(56)
  const data = [...BASE, x]
  const rows: [string, string, number][] = [
    ['sp-mean', '平均', mean(data)],
    ['sp-median', '中央値', median(data)],
    ['sp-sd', '標準偏差', sd(data)],
    ['sp-range', '範囲(最大 − 最小)', range(data)],
    ['sp-mad', '中央絶対偏差(MAD)', mad(data)],
  ]
  return (
    <div className="demo spread-lab">
      <h4>試す:1 つの値で、数字は、どれだけ動くか</h4>
      <p className="muted">9 個の値(48, 50, 51, 52, 53, 54, 55, 57, 60)に、10 個目の値を足します。10 個目の値を、動かしてください。</p>
      <Slider label="10 個目の値" value={x} min={40} max={200} step={1} onChange={setX} />
      <table className="calc text">
        <thead><tr><th>要約</th><th>値</th></tr></thead>
        <tbody>
          {rows.map(([id, label, v]) => (
            <tr key={id}><td>{label}</td><td id={id}>{f(v)}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="muted">標準偏差は、n − 1 で割る分散の平方根です。中央絶対偏差は、中央値からの隔たりの絶対値の、中央値です(NIST の定義)。</p>
    </div>
  )
}
