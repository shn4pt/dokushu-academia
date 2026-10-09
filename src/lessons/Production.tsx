import { useState } from 'react'
import { Slider } from '../components'
import { MODELS } from '../api/settings'
import type { LessonContent } from './types'

// キャッシュ読み込みの料金(100万トークンあたり)。公式の料金表の値(Haiku 5.5 は、プロンプトが10万トークンまでの料金)
const cacheRead: Record<string, number> = { 'claude-opus-5-5': 0.2, 'claude-sonnet-5-5': 0.1, 'claude-haiku-5-5': 0.01 }

function CostCalc() {
  const [model, setModel] = useState(MODELS[0].id)
  const [perDay, setPerDay] = useState(1000)
  const [input, setInput] = useState(20000)
  const [output, setOutput] = useState(1500)
  const [cacheHit, setCacheHit] = useState(0)
  const [batch, setBatch] = useState(false)
  const m = MODELS.find((x) => x.id === model)!
  const perReq =
    ((input * (1 - cacheHit / 100) * m.input + input * (cacheHit / 100) * cacheRead[model] + output * m.output) / 1_000_000) * (batch ? 0.5 : 1)
  const monthly = perReq * perDay * 30
  return (
    <div className="demo">
      <h4>試す:月額費用の見積もり</h4>
      <p className="muted">
        1回の依頼(エージェントなら、ループ全体)で使うトークン数から、月の費用を見積もります。キャッシュの書き込み料金などは省いた概算です。
        単価は公式の料金表の値(2026年10月時点。Haiku 5.5 は、プロンプトが10万トークンまでの料金)です。最新の料金は公式の料金表で確認してください。
      </p>
      <label className="field">
        <span className="muted">モデル</span>
        <select className="sel-input" value={model} onChange={(e) => setModel(e.target.value)}>
          {MODELS.map((x) => <option key={x.id} value={x.id}>{x.label}(入力 ${x.input} / 出力 ${x.output})</option>)}
        </select>
      </label>
      <Slider label="1日の依頼数" value={perDay} min={100} max={50000} step={100} onChange={setPerDay} format={(v) => v.toLocaleString()} />
      <Slider label="1回の入力トークン" value={input} min={1000} max={200000} step={1000} onChange={setInput} format={(v) => v.toLocaleString()} />
      <Slider label="1回の出力トークン" value={output} min={100} max={20000} step={100} onChange={setOutput} format={(v) => v.toLocaleString()} />
      <Slider label="入力のうちキャッシュから読む割合" value={cacheHit} min={0} max={95} step={5} onChange={setCacheHit} format={(v) => `${v}%`} />
      <label className="check-row"><input type="checkbox" checked={batch} onChange={(e) => setBatch(e.target.checked)} /> バッチ API を使う(すぐに結果が要らない処理。料金が半額)</label>
      <table className="calc">
        <tbody>
          <tr><td>1回あたり</td><td><strong>${perReq.toFixed(4)}</strong></td></tr>
          <tr><td>1か月(30日)</td><td><strong>${monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></td></tr>
        </tbody>
      </table>
      <p className="muted">キャッシュの割合を上げたり、モデルを替えたりして、どの要素が費用に効くかを確かめましょう。</p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>本番の構成</h3>
      <div className="flow" aria-label="本番の構成">
        {['利用者のブラウザ・アプリ', 'あなたのサーバー(認証、回数制限、APIキーを保持、ツールを実行、記録)', 'Claude API'].map((f, i, a) => (
          <span key={i} className="flow-item">
            <span className="flow-box">{f}</span>
            {i < a.length - 1 && <span className="flow-arrow" aria-hidden>↓</span>}
          </span>
        ))}
      </div>
      <ul>
        <li>API キーはサーバーだけが持つ(9-1)。ブラウザからはサーバーを呼ぶ。</li>
        <li>ツールの実行(データベース、社内システム)もサーバー側で行い、利用者ごとの権限で絞る(12-2)。</li>
        <li>利用者ごとの回数制限と、1回の依頼あたりの上限(ループ回数、トークン)を設ける。</li>
      </ul>

      <h3>信頼性</h3>
      <ul>
        <li><strong>再試行</strong>:SDK は 429 と 500 系、通信エラーを、間隔を空けて自動で再試行する(9-2)。回数とタイムアウトを用途に合わせて設定する。</li>
        <li><strong>長い出力はストリーミング</strong>:タイムアウトを避け、利用者に途中経過を見せる。</li>
        <li><strong>断られたときの備え</strong>:<code>fallbacks: "default"</code> で、推奨モデルに切り替えて続行する(9-2)。</li>
        <li><strong>二重実行への備え</strong>:再試行で同じ操作が二度届いても、結果が1回分になるようにする(10-3)。</li>
        <li><strong>失敗したときの振る舞い</strong>:API が使えないときに、利用者にどう伝えるか、人の窓口にどうつなぐかを決めておく。</li>
      </ul>

      <h3>費用</h3>
      <p>費用は「1回の呼び出し」ではなく、<strong>1つの仕事を終えるまで</strong>の合計で考えます。安い設定でも、回数や再試行が増えれば高くつきます。</p>
      <ul>
        <li><strong>キャッシュ</strong>:変わらない system とツール定義を先頭に置き、キャッシュを効かせる(11-3)。まず試すべき、品質を落とさない節約。</li>
        <li><strong>コンテキストを小さく</strong>:ツールが返す量を絞る、古い結果を消す(10-3、11-3)。</li>
        <li><strong>effort とモデル</strong>:用途ごとに選ぶ。簡単な分類やチャットは低い effort や小さいモデルで足りることが多い。変えたら評価で確かめる(12-1)。</li>
        <li><strong>バッチ API</strong>:夜間の一括処理など、すぐに結果が要らない処理は、非同期のバッチ API で半額になる。結果は順不同で返るので、依頼ごとの ID で対応づける。</li>
      </ul>
      <CostCalc />

      <h3>速さ</h3>
      <ul>
        <li>ストリーミングで、最初の文字が出るまでの時間を短くする。</li>
        <li>キャッシュは、費用だけでなく応答の速さにも効く。</li>
        <li>独立したツール呼び出しは並列にし(10-2)、ループの回数を減らす。</li>
        <li>effort を下げたり、小さいモデルを使ったりする。品質との兼ね合いは評価で決める。</li>
      </ul>

      <h3>記録と監視</h3>
      <ul>
        <li>呼び出しごとに、モデル名、<code>stop_reason</code>、<code>usage</code>(キャッシュを含む)、所要時間、ツールの呼び出しと結果を記録する。</li>
        <li>1つの依頼の中の呼び出しを、共通の ID で追えるようにする。</li>
        <li>費用(利用者あたり、仕事あたり)、エラー率、断られた割合、ループの上限に達した割合を監視し、急な変化に警告を出す。</li>
        <li>記録には個人情報が含まれうる。保存する範囲、マスク、保存期間を決める。</li>
      </ul>

      <h3>モデルの更新に追従する</h3>
      <ul>
        <li><strong>モデル名は固定して使う</strong>。知らないうちに挙動が変わらないようにする。</li>
        <li>新しいモデルは、性能や料金が改善する一方で、パラメータの扱いや振る舞いが変わることがある。たとえば Opus 5.5 では、思考を無効にする設定や、特定のツールの強制ができなくなった。</li>
        <li>切り替える前に、<strong>同じ評価セットで比べる</strong>(12-1)。プロンプトや effort も、新しいモデルに合わせて調整し直す。</li>
        <li>一部の利用者から段階的に切り替え、監視しながら広げる。</li>
        <li>古いモデルには提供終了の予定があるので、公式の案内を確認し、計画的に移行する。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'エージェントの費用を考えるとき、適切な単位はどれですか?',
      choices: [
        '1回の API 呼び出しの費用',
        '1つの仕事を終えるまでの合計の費用',
        'モデルの単価だけ',
      ],
      answer: 1,
      explanation: '1回が安くても、回数や再試行が増えれば高くつきます。仕事あたりで比べます。',
    },
    {
      question: '夜間に大量の文書を分類する処理で、費用を下げるのに有効な方法はどれですか?',
      choices: ['バッチ API を使う', 'max_tokens を最大にする', '毎回モデルを切り替える'],
      answer: 0,
      explanation: 'すぐに結果が要らない処理は、非同期のバッチ API で料金が半額になります。',
    },
    {
      question: '新しいモデルに切り替えるときの進め方として適切なものはどれですか?',
      choices: [
        'モデル名を書き換えて、すぐに全員に公開する',
        '同じ評価セットで比べ、プロンプトなどを調整し、段階的に切り替える',
        '新しいモデルは必ず良いので、評価は不要',
      ],
      answer: 1,
      explanation: '振る舞いやパラメータの扱いが変わることがあるため、評価と段階的な移行が必要です。',
    },
  ],
}

export default content
