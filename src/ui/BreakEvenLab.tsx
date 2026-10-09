import { useState } from 'react'
import { Slider } from '../components'
import { cvp } from '../data/cvp'

const yen = (v: number) => `${Math.round(v).toLocaleString('ja-JP')} 円`
const pct = (v: number) => `${(v * 100).toFixed(1)}%`

/** 価格・変動費・固定費・販売数を動かして、損益分岐点と利益の変わり方を見る。 */
export default function BreakEvenLab() {
  const [price, setPrice] = useState(1000)
  const [vc, setVc] = useState(600)
  const [fc, setFc] = useState(200000)
  const [units, setUnits] = useState(700)
  const r = cvp({ price, vc, fc, units })
  return (
    <div className="demo breakeven-lab">
      <h4>試す:何個売れば、赤字を脱するか</h4>
      <p className="muted">1 つの商品を売る小さな事業とします。固定費は、売れても売れなくても、かかる月の費用です。税は考えません(このサービスの例です)。</p>
      <Slider label="1 個あたりの価格" value={price} min={200} max={3000} step={50} onChange={setPrice} format={yen} />
      <Slider label="1 個あたりの変動費" value={vc} min={0} max={3000} step={50} onChange={setVc} format={yen} />
      <Slider label="月の固定費" value={fc} min={0} max={1000000} step={10000} onChange={setFc} format={yen} />
      <Slider label="月の販売数" value={units} min={0} max={3000} step={10} onChange={setUnits} format={(v) => `${v} 個`} />
      <table className="calc text">
        <tbody>
          <tr><td>1 個あたりの貢献利益(価格 − 変動費)</td><td id="be-cm">{yen(r.cmUnit)}</td></tr>
          <tr><td>貢献利益率</td><td id="be-ratio">{pct(r.cmRatio)}</td></tr>
          <tr><td>損益分岐点(個数)</td><td id="be-units">{r.breakEvenUnits === null ? '売るほど赤字になるため、なし' : `${Math.ceil(r.breakEvenUnits - 1e-9)} 個`}</td></tr>
          <tr><td>損益分岐点(売上高)</td><td id="be-revenue">{r.breakEvenRevenue === null ? '—' : yen(r.breakEvenRevenue)}</td></tr>
          <tr><td>この販売数での営業利益</td><td id="be-income"><strong>{r.income >= 0 ? '' : '−'}{yen(Math.abs(r.income))}</strong></td></tr>
          <tr><td>安全余裕(売上が、分岐点から離れている割合)</td><td id="be-mos">{r.marginOfSafetyPct === null ? '—' : pct(r.marginOfSafetyPct)}</td></tr>
          <tr><td>営業レバレッジ度(貢献利益 ÷ 営業利益)</td><td id="be-dol">{r.dol === null ? '利益が出ていないので、なし' : r.dol.toFixed(2)}</td></tr>
        </tbody>
      </table>
    </div>
  )
}
