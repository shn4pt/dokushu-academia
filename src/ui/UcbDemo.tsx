import { useState } from 'react'
import { depts, tally, type Dept, type Sex } from '../data/ucb'

const pct = (v: number) => `${(v * 100).toFixed(1)}%`
const label: Record<Sex, string> = { male: '男性', female: '女性' }

/** バークレーの入学データ: 全体で見るときと、学科ごとに見るときで、男女の合格率の大小が逆になる。 */
export default function UcbDemo() {
  const [view, setView] = useState<'all' | Dept>('all')
  const which = view === 'all' ? depts : [view]
  const m = tally('male', which)
  const f = tally('female', which)
  return (
    <div className="demo ucb-demo">
      <h4>試す:全体で見る? 学科ごとに見る?</h4>
      <p className="muted">1973 年の、バークレーの大学院の入学データ(応募者数が最も多い 6 学科、4,526 人)です。見方を切り替えて、男女の合格率を比べてください。</p>
      <fieldset className="plain-fieldset">
        <legend className="muted">見方</legend>
        {(['all', ...depts] as const).map((v) => (
          <label key={v}>
            <input type="radio" name="ucb-view" checked={view === v} onChange={() => setView(v)} /> {v === 'all' ? '全体(6 学科の合計)' : `学科 ${v}`}
          </label>
        ))}
      </fieldset>
      <table className="calc text ucb-table">
        <thead><tr><th>性別</th><th>応募者</th><th>合格者</th><th>合格率</th></tr></thead>
        <tbody>
          {([['male', m], ['female', f]] as const).map(([sex, t]) => (
            <tr key={sex}>
              <td>{label[sex]}</td>
              <td id={`ucb-${sex}-n`}>{t.applicants}</td>
              <td id={`ucb-${sex}-a`}>{t.admitted}</td>
              <td>
                <span className="bar-track" aria-hidden><span className="bar-fill" style={{ width: `${t.rate * 100}%` }} /></span>{' '}
                <strong id={`ucb-${sex}-rate`}>{pct(t.rate)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p role="status" id="ucb-verdict">
        {m.rate === f.rate ? '男女の合格率は、同じです。' : `合格率が高いのは、${m.rate > f.rate ? '男性' : '女性'}です。`}
      </p>
    </div>
  )
}
