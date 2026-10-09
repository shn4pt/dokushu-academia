import { useState } from 'react'
import { Slider } from '../components'
import { nForConversion, runtimeMultiplier } from '../data/sampleSize'

const fmt = (v: number) => Math.ceil(v).toLocaleString('ja-JP')

/** 転換率の A/B テストに、何人のユーザーが要るか(Kohavi らの目安の式)。 */
export default function SampleSizeLab() {
  const [pPct, setPPct] = useState(5)
  const [rel, setRel] = useState(5)
  const [power, setPower] = useState<80 | 90>(80)
  const [share, setShare] = useState(50)
  const p = pPct / 100
  const n = nForConversion(p, rel / 100, power)
  return (
    <div className="demo samplesize-lab">
      <h4>試す:A/B テストに、何人のユーザーが要るか</h4>
      <p className="muted">転換率(たとえば、購入した人の割合)を、指標にするとします。信頼水準 95%。Kohavi らの目安の式 n = 16σ²/Δ²(検出力 90% なら 21)を使います。</p>
      <Slider label="いまの転換率" value={pPct} min={1} max={50} step={1} onChange={setPPct} format={(v) => `${v}%`} />
      <Slider label="検出したい変化(相対)" value={rel} min={1} max={50} step={1} onChange={setRel} format={(v) => `${v}%`} />
      <fieldset className="plain-fieldset">
        <legend className="muted">検出力</legend>
        <label><input type="radio" name="ss-power" checked={power === 80} onChange={() => setPower(80)} /> 80%(係数 16)</label>
        <label><input type="radio" name="ss-power" checked={power === 90} onChange={() => setPower(90)} /> 90%(係数 21)</label>
      </fieldset>
      <p role="status">
        各バリアントに必要なユーザー数: <strong id="ss-n">{fmt(n)}</strong> 人(A と B の合計: <span id="ss-total">{fmt(n * 2)}</span> 人)
      </p>
      <Slider label="処理(B)に割り当てる割合" value={share} min={1} max={50} step={1} onChange={setShare} format={(v) => `${v}%`} />
      <p role="status">
        50% / 50% に比べて、実験の期間は、およそ <strong id="ss-runtime">{runtimeMultiplier(share / 100).toFixed(2)}</strong> 倍になります。
      </p>
    </div>
  )
}
