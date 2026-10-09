import { useState } from 'react'
import { DOWN_DOMAINS, UP_DOMAINS, certainty, type Design, type Down, type DownDomain, type UpDomain } from '../data/grade'

const downLabel: Record<DownDomain, string> = {
  riskOfBias: 'バイアスのリスク(研究のデザイン・実施の限界)',
  inconsistency: '結果の非一貫性(研究の間で、結果がばらつく)',
  indirectness: '非直接性(知りたい対象・条件と、研究の対象・条件がずれる)',
  imprecision: '不精確さ(信頼区間が広い、イベントが少ない)',
  publicationBias: '公表バイアス(結果によって、公表されやすさが違う)',
}
const upLabel: Record<UpDomain, string> = {
  largeEffect: '大きな効果(交絡を考えても、効果が大きい)',
  doseResponse: '用量反応関係がある',
  confoundingWouldReduce: 'もっともらしい交絡・バイアスは、効果を小さく見せる方向',
}

/** GRADE の、確実性の 4 段階を、判断の結果から、計算して確かめる練習。 */
export default function GradeLab() {
  const [design, setDesign] = useState<Design>('randomized')
  const [down, setDown] = useState<Partial<Record<DownDomain, Down>>>({})
  const [up, setUp] = useState<Partial<Record<UpDomain, boolean>>>({})
  const r = certainty(design, down, up)
  return (
    <div className="demo grade-lab">
      <h4>試す:根拠の確実性を、格付けする</h4>
      <p className="muted">研究の種類(出発点)と、5 つの「下げる」要因、3 つの「上げる」要因の判断から、確実性を計算します。実際の格付けでは、各要因の判断と、その理由を記録することが中心です。</p>
      <fieldset className="plain-fieldset">
        <legend className="muted">出発点(研究の種類)</legend>
        <label><input type="radio" name="grade-design" checked={design === 'randomized'} onChange={() => setDesign('randomized')} /> ランダム化試験(出発点は「高」)</label>
        <label><input type="radio" name="grade-design" checked={design === 'observational'} onChange={() => setDesign('observational')} /> 非ランダム化の研究・観察研究(出発点は「低」)</label>
      </fieldset>
      <table className="calc text">
        <thead><tr><th>下げる要因</th><th>判断</th></tr></thead>
        <tbody>
          {DOWN_DOMAINS.map((d) => (
            <tr key={d}>
              <td>{downLabel[d]}</td>
              <td>
                <select className="sel-input" aria-label={downLabel[d]} value={down[d] ?? 0} onChange={(e) => setDown({ ...down, [d]: Number(e.target.value) as Down })}>
                  <option value={0}>問題なし</option>
                  <option value={1}>深刻(1 段階下げる)</option>
                  <option value={2}>非常に深刻(2 段階下げる)</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <fieldset className="plain-fieldset">
        <legend className="muted">上げる要因(おもに非ランダム化の研究。下げたランダム化試験にも、例外的に使う)</legend>
        {UP_DOMAINS.map((d) => (
          <label key={d}><input type="checkbox" checked={!!up[d]} onChange={(e) => setUp({ ...up, [d]: e.target.checked })} /> {upLabel[d]}</label>
        ))}
      </fieldset>
      <p role="status" id="grade-result">
        確実性: <strong id="grade-label">{r.label}</strong> <span id="grade-symbol" aria-hidden>{r.symbol}</span>
        <span className="muted block">出発点 {['非常に低', '低', '中', '高'][r.start]} − {r.lowered} 段階 + {r.raised} 段階(「非常に低」より下には、ならない)</span>
      </p>
    </div>
  )
}
