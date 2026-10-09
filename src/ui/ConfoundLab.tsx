import { useState } from 'react'
import { Slider } from '../components'
import { confounding } from '../data/confounding'

const pct = (v: number) => `${(v * 100).toFixed(1)}%`
const pp = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)} ポイント`

/** 重症の人ほど処置を受けやすいとき、単純な比較は、処置の効果を、どれだけ取り違えるか。 */
export default function ConfoundLab() {
  const [tau, setTau] = useState(-10) // 処置の本当の効果(悪い結果の確率の変化、ポイント)
  const [gamma, setGamma] = useState(40) // 重症のときの、悪い結果の確率の上乗せ(ポイント)
  const [a1, setA1] = useState(80) // 重症の人が、処置を受ける確率(%)
  const [a0, setA0] = useState(20) // 軽症の人が、処置を受ける確率(%)
  const [measured, setMeasured] = useState(true)
  const r = confounding({ pL: 0.5, a1: a1 / 100, a0: a0 / 100, base: 0.1, gamma: gamma / 100, tau: tau / 100 })
  return (
    <div className="demo confound-lab">
      <h4>試す:重症の人ほど処置を受けるとき、効果は、どう見えるか</h4>
      <p className="muted">患者の半分が重症、半分が軽症とします。悪い結果になる確率は、軽症で 10%、重症は、それに上乗せがあり、処置には、本当の効果があります。</p>
      <Slider label="処置の本当の効果(悪い結果の確率の変化)" value={tau} min={-30} max={30} step={1} onChange={setTau} format={(v) => `${v >= 0 ? '+' : ''}${v} ポイント`} />
      <Slider label="重症であることの、悪い結果の確率への上乗せ" value={gamma} min={0} max={60} step={1} onChange={setGamma} format={(v) => `+${v} ポイント`} />
      <Slider label="重症の人が、処置を受ける確率" value={a1} min={5} max={95} step={1} onChange={setA1} format={(v) => `${v}%`} />
      <Slider label="軽症の人が、処置を受ける確率" value={a0} min={5} max={95} step={1} onChange={setA0} format={(v) => `${v}%`} />
      <label className="choice"><input type="checkbox" checked={measured} onChange={(e) => setMeasured(e.target.checked)} /> 重症度を、測っている(データにある)</label>
      <table className="calc text">
        <thead><tr><th>比べ方</th><th>処置を受けた人 − 受けなかった人の、悪い結果の確率の差</th></tr></thead>
        <tbody>
          <tr><td>処置を受けた人と、受けなかった人の、単純な比較</td><td><strong id="cf-naive">{pp(r.naive)}</strong></td></tr>
          <tr><td>重症度で分けて比べ、平均する(調整)</td><td id="cf-adjusted">{measured ? pp(r.adjusted) : '重症度を測っていないので、できない'}</td></tr>
          <tr><td>処置を、ランダムに割り当てた実験</td><td id="cf-random">{pp(r.randomized)}</td></tr>
        </tbody>
      </table>
      <p className="muted" id="cf-note">
        処置を受けた人のうち、重症の割合は {pct(r.pLgivenA1)}、受けなかった人では {pct(r.pLgivenA0)} です。
        {r.naive > 0 && r.randomized < 0 ? ' 単純な比較では、処置が、有害に見えます(本当は、効果がある)。' : ''}
      </p>
    </div>
  )
}
