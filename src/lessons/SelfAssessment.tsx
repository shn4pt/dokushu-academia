import { useState } from 'react'
import { Link } from 'react-router-dom'
import { clearAnswers, dimensions, loadAnswers, saveAnswers, summarize, type Answers } from '../assessment'
import type { LessonContent } from './types'

function Assessment() {
  const [answers, setAnswers] = useState<Answers>(() => loadAnswers())
  const pick = (id: string, v: number) => {
    const next = { ...answers, [id]: v }
    setAnswers(next)
    saveAnswers(next)
  }
  const s = summarize(answers)
  const answered = dimensions.filter((d) => answers[d.id] !== undefined).length
  return (
    <div className="demo assessment">
      <h4>診断:あなたのチーム(または自分)の現在地</h4>
      <p className="muted">6つの軸それぞれで、今の状態に最も近いものを選んでください。回答はこのブラウザにだけ保存され、19-2 の移行計画で使います。</p>
      {dimensions.map((d) => (
        <fieldset key={d.id} className="assess-dim">
          <legend>{d.name}</legend>
          {d.levels.map((text, v) => (
            <label key={v} className="choice">
              <input type="radio" name={`assess-${d.id}`} checked={answers[d.id] === v} onChange={() => pick(d.id, v)} />
              <span><strong>段階{v}</strong> {text}</span>
            </label>
          ))}
        </fieldset>
      ))}
      {s ? (
        <div role="status" className="assess-result">
          <table className="calc text">
            <tbody>
              {dimensions.map((d) => (
                <tr key={d.id} className={answers[d.id] === s.min ? 'weakest' : ''}>
                  <td>{d.name}</td>
                  <td>
                    <span className="assess-bar" aria-hidden><span style={{ width: `${(answers[d.id] / 3) * 100}%` }} /></span>
                    段階{answers[d.id]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p><strong>安全に任せられる水準の目安: {s.level}</strong></p>
          <p>
            最も弱い軸: {s.weakest.map((d) => d.name).join('、')}(段階{s.min})。
            {s.min < 3 ? <>次の一歩は <Link to="/lesson/19-2">19-2</Link> で計画します。</> : <>すべての軸が整っています。リスクの高い変更と例外の判断は、引き続き人に残します(18-3)。</>}
          </p>
        </div>
      ) : (
        <p className="muted" role="status">あと {dimensions.length - answered} 軸に答えると、結果が出ます。</p>
      )}
      <div className="row">
        <button className="secondary" onClick={() => { clearAnswers(); setAnswers({}) }} disabled={answered === 0}>回答を消す</button>
      </div>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>任せられる水準は、最も弱い軸で決まる</h3>
      <p>
        第3部を通して、AI に任せる範囲を広げるには、いくつもの仕組みが必要だと見てきました。確かめる仕組み(検証)、意図を伝える仕組み(文脈と仕様)、
        被害を防ぐ仕組み(権限と安全)、確かめる流れ(レビューとプロセス)、効果を知る仕組み(計測)、そして人の理解です。
      </p>
      <p>
        これらは鎖のようなもので、<strong>最も弱い輪が、全体の強さを決めます</strong>。テストが整っていても、権限を何も設定していなければ、
        自動のループを安全には回せません。仕様が明確でも、誰もコードを説明できなければ、障害のときに困ります。
        この診断では、6つの軸の現在地を確かめ、<strong>最も弱い軸</strong>を見つけます。
      </p>

      <Assessment />

      <h3>結果の読み方</h3>
      <ul>
        <li><strong>目安の水準</strong>は、最も弱い軸の段階から出しています(段階0 → L1〜L2、段階1 → L3、段階2 → L4、段階3 → L5)。チームの中で最も整った作業についての目安で、すべての作業をその水準にする、という意味ではありません(14-3)。</li>
        <li><strong>最も弱い軸</strong>から手を付けるのが、最も効果的です。強い軸をさらに伸ばしても、任せられる範囲は広がりません。</li>
        <li>個人で使っている場合は「チーム」を「自分」と読み替えてください。レビューは、自分で差分を読むことや、新しい文脈の AI に確かめさせることに当たります。</li>
        <li>この診断は、考えを整理するための簡単な目安です。正式な評価の方法ではありません。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '検証が段階3、権限と安全が段階0のチームで、任せられる範囲を広げるために最初にすべきことはどれですか?',
      choices: [
        '検証をさらに強化する',
        '権限のルールを設定し、危ない操作を拒否する',
        'すぐに L5 の自動ループを始める',
      ],
      answer: 1,
      explanation: '任せられる水準は最も弱い軸で決まります。弱い軸から手を付けます。',
    },
    {
      question: '診断の「目安の水準」の正しい理解はどれですか?',
      choices: [
        'すべての作業をその水準で行うべき',
        '最も整った作業について、安全に任せられる上限の目安',
        'AI の能力の水準',
      ],
      answer: 1,
      explanation: '水準は作業ごとに選びます。目安は、仕組みが許す上限です。',
    },
  ],
}

export default content
