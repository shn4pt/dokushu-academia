import { useState } from 'react'
import type { LessonContent } from './types'

const checklist = [
  '誰の、どんな困りごとを解決するかを1文で言える',
  'やること・やらないこと(範囲)を決めた',
  '成功の基準を数字で決めた(品質、費用、時間)',
  '1回の呼び出し・ワークフロー・エージェントのどれにするかを、理由とともに決めた',
  'ツールの一覧と、それぞれの権限を決めた',
  '取り消せない操作と、その承認の方法を決めた',
  '止める条件(回数、予算)を決めた',
  '3つの危険な組み合わせ(私的なデータ・信頼できない内容・外部への送信)を確認した',
  '評価セットの最初の案を作った',
]

function DesignChecklist() {
  const [on, setOn] = useState<boolean[]>(() => checklist.map(() => false))
  const done = on.filter(Boolean).length
  return (
    <div className="demo">
      <h4>確認:設計のチェックリスト</h4>
      <p className="muted">自分の作りたい機能に当てはめて、決めたものにチェックを入れてください。</p>
      {checklist.map((c, i) => (
        <label key={c} className="check-row">
          <input type="checkbox" checked={on[i]} onChange={(e) => setOn(on.map((v, j) => (j === i ? e.target.checked : v)))} /> {c}
        </label>
      ))}
      <p role="status"><strong>{done} / {checklist.length}</strong>{done === checklist.length ? ' ・ 実装に進む準備ができました。' : ''}</p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>この Stage で作るもの</h3>
      <p>
        ここまでの内容を使って、1つのエージェント機能を、要件から評価まで通して作ります。題材は、これまでの演習で使ってきた
        <strong>ネットショップのサポートエージェント</strong>です。このレッスンでは、コードを書く前に決めることを整理します。
      </p>

      <h3>1. 要件</h3>
      <table className="calc text">
        <tbody>
          <tr><td>誰のため</td><td>ネットショップで買い物をしたお客様</td></tr>
          <tr><td>解決すること</td><td>注文の状況や、返品・配送などの手続きを、問い合わせ窓口の営業時間を待たずに知りたい</td></tr>
          <tr><td>やること</td><td>注文状況の案内、FAQ に基づく回答、人の対応が必要なときの問い合わせチケットの作成</td></tr>
          <tr><td>やらないこと</td><td>返金の実行、注文やアカウントの変更、FAQ にない方針の判断(担当者につなぐ)</td></tr>
          <tr><td>成功の基準</td><td>評価セットで合格率 90% 以上、不要なチケットの作成 0 件、1件あたりの費用 $0.05 以下、応答の開始 2 秒以内</td></tr>
        </tbody>
      </table>
      <p className="muted">数字は例です。自分の機能では、利用者と相談して決めます。成功の基準は、評価(13-3)でそのまま確かめられる形にします。</p>

      <h3>2. 方式を選ぶ</h3>
      <p>
        11-1 の考え方で選びます。質問の種類によって、注文を調べる、FAQ を調べる、両方調べる、担当者につなぐ、と手順が変わり、
        事前に1つの手順には決められません。一方、使う道具は少なく、手順も数ステップで終わります。そこで、
        <strong>ツールを3つに絞った小さなエージェント</strong>にし、ループの回数に上限を設けます。
      </p>

      <h3>3. ツールと権限</h3>
      <table className="calc text">
        <thead><tr><th>ツール</th><th>権限</th><th>設計上の決めごと</th></tr></thead>
        <tbody>
          <tr><td><code>get_order_status</code></td><td>読むだけ</td><td>ログイン中の利用者の注文だけを返す。利用者 ID はログイン情報から取り、モデルに決めさせない</td></tr>
          <tr><td><code>search_faq</code></td><td>読むだけ</td><td>結果は上位3件、2,000字まで。該当なしなら「推測しないで」と返す</td></tr>
          <tr><td><code>create_support_ticket</code></td><td>書き込み</td><td>実行前に利用者が承認する。同じ呼び出しで二重に作られないようにする</td></tr>
        </tbody>
      </table>

      <h3>4. 構成</h3>
      <div className="flow" aria-label="構成">
        {['お客様のブラウザ', 'サーバー:ログイン確認 → エージェントのループ(ツールの実行・承認待ちの管理・記録)', 'Claude API'].map((f, i, a) => (
          <span key={i} className="flow-item">
            <span className="flow-box">{f}</span>
            {i < a.length - 1 && <span className="flow-arrow" aria-hidden>↓</span>}
          </span>
        ))}
      </div>
      <p>
        承認が必要な操作では、サーバーはループを一度止めて「承認待ち」をブラウザに返します。お客様が許可または拒否すると、
        その結果を <code>tool_result</code> として渡して、ループを再開します。
      </p>

      <h3>5. 止める条件と予算</h3>
      <ul>
        <li>1回の依頼で API を呼ぶのは最大8回。超えたら止めて、担当者につなぐ案内を出す。</li>
        <li>1回の依頼で使うトークンの上限を決める(例: 20万トークン)。</li>
        <li><code>stop_reason</code> が <code>max_tokens</code> や <code>refusal</code> のときは、ツールを実行せずに止める。</li>
      </ul>

      <h3>6. 安全性の確認</h3>
      <p>12-2 の「3つの危険な組み合わせ」で確かめます。</p>
      <ul>
        <li><strong>私的なデータ</strong>:あり(注文情報)。ただし、本人の注文だけに限定する。</li>
        <li><strong>信頼できない内容</strong>:お客様の入力は信頼できない。FAQ は社内で管理された内容。</li>
        <li><strong>外部への送信</strong>:社外へは送らない。チケットは社内の担当者に届くだけで、作成には承認が必要。</li>
      </ul>
      <p>外部への送信手段がないので、危険な組み合わせにはなっていません。もし将来「お客様にメールで回答を送る」機能を足すなら、ここを見直します。</p>

      <h3>7. 評価の計画</h3>
      <p>
        作る前に、評価セットの最初の案を作ります。注文の質問、FAQ の質問、該当する FAQ がない質問、担当者につなぐべき相談、範囲外の依頼、
        悪意のある入力を、それぞれ数件ずつ用意します(13-3 で実行します)。
      </p>

      <DesignChecklist />
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'get_order_status で、どの利用者の注文を調べるかはどう決めますか?',
      choices: [
        'モデルが会話から推測した利用者 ID を引数で受け取る',
        'サーバーがログイン情報から利用者 ID を決め、その人の注文だけを返す',
        'すべての利用者の注文を返し、モデルに選ばせる',
      ],
      answer: 1,
      explanation: '誰のデータを見られるかは、モデルではなくコードで決めます。',
    },
    {
      question: '承認が必要な操作のとき、サーバー側のループはどう振る舞いますか?',
      choices: [
        '承認を待たずに実行してから、事後に報告する',
        'ループを止めて承認待ちを返し、利用者の判断を受けてから再開する',
        'その操作を無視して終了する',
      ],
      answer: 1,
      explanation: '利用者の判断を tool_result として渡して、ループを再開します。',
    },
    {
      question: '成功の基準を数字で決めておく主な理由はどれですか?',
      choices: [
        '見た目がよいから',
        '評価で達成できたかをそのまま確かめられ、改善の判断に使えるから',
        'API の利用に必要だから',
      ],
      answer: 1,
      explanation: '基準が数字なら、評価の結果と比べて、完成か改善が必要かを判断できます。',
    },
  ],
}

export default content
