import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { LessonContent } from './types'

type Step = { who: 'user' | 'model' | 'tool'; text: string; note?: string }
// 動作を説明するための台本。実際にLLMや外部ツールを呼んでいるわけではない。
const script: Step[] = [
  { who: 'user', text: '東京の気温を華氏で教えて。' },
  { who: 'model', text: 'tool_call: get_weather({"city": "東京"})', note: 'モデルはツールの呼び出しを(テキストとして)出力する。' },
  { who: 'tool', text: '{"temp_c": 22}', note: 'アプリ側がツールを実行し、結果を会話に追加する。' },
  { who: 'model', text: 'tool_call: calculator("22 * 9 / 5 + 32")', note: '結果を見て、次の行動(計算)を決める。' },
  { who: 'tool', text: '71.6', note: '計算はモデルではなく、ツールが確実に行う。' },
  { who: 'model', text: '東京は現在22℃で、華氏では約71.6°Fです。', note: 'ツール呼び出しが不要になったら、最終回答を出して終了。' },
]
const label = { user: 'ユーザー', model: 'モデル', tool: 'ツールの結果' }

function LoopDemo() {
  const [n, setN] = useState(1)
  return (
    <div className="demo">
      <h4>デモ(台本):エージェントのループ</h4>
      <p className="muted">実際のモデルは呼んでいません。典型的なやりとりの流れを順に見せるための台本です。</p>
      <ol className="plain">
        {script.slice(0, n).map((s, i) => (
          <li key={i} className="card" style={{ margin: '6px 0' }}>
            <strong>{label[s.who]}</strong>
            <div className="mono">{s.text}</div>
            {s.note && <div className="muted">{s.note}</div>}
          </li>
        ))}
      </ol>
      <div className="row">
        <button onClick={() => setN(n + 1)} disabled={n >= script.length}>次のステップ</button>
        <button className="secondary" onClick={() => setN(1)}>最初から</button>
        <span className="muted">{n} / {script.length}</span>
      </div>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>LLMだけでは「行動」できない</h3>
      <p>
        モデルがするのはテキストの生成だけです。最新の天気を調べる、正確に計算する、ファイルを読む、メールを送る、
        といったことは、そのままではできません。そこで、<strong>ツール</strong>(関数)を呼び出す仕組みを使います。
      </p>

      <h3>ツール利用(関数呼び出し)</h3>
      <ol>
        <li>アプリが、使えるツールの名前・説明・引数の形式(スキーマ)をモデルに伝える。</li>
        <li>モデルは、必要と判断したら「このツールをこの引数で呼びたい」という構造化された出力を返す。</li>
        <li><strong>アプリが</strong>実際にツールを実行し、結果をモデルに返す。</li>
        <li>モデルは結果を踏まえて、回答するか、次のツールを呼ぶ。</li>
      </ol>
      <p>
        重要なのは、モデルは<strong>呼び出しを「依頼」するだけで、実行するのはアプリ</strong>だという点です。
        何を許可するかを、アプリ側で制御できます。
      </p>

      <LoopDemo />

      <h3>エージェント</h3>
      <p>
        上のループを、<strong>目的が達成されるまで繰り返す</strong>仕組みがエージェントです。モデルが「考える → ツールで行動する →
        結果を観察する」を回します(ReAct と呼ばれるパターンが代表的)。
      </p>
      <pre>{`messages = [user_goal]
while True:
    reply = llm(messages, tools)
    if reply has no tool_call:
        return reply                  # 最終回答
    result = run_tool(reply.tool_call)   # アプリ側で実行
    messages += [reply, result]`}</pre>

      <h3>難しさと注意点</h3>
      <ul>
        <li><strong>誤りの累積</strong>:途中の1つの誤りが、後続のステップに影響して広がる。ステップが増えるほど成功率は下がる。</li>
        <li><strong>終わらない/脱線する</strong>:最大ステップ数や予算の上限が必要。</li>
        <li><strong>権限とリスク</strong>:ファイル削除、送金、送信など、取り返しのつかない操作は、人間の確認を挟む。最小権限で動かす。</li>
        <li><strong>プロンプトインジェクション</strong>:ツールが取得したWebページやメールの文中に、悪意のある指示が紛れ込む可能性がある。</li>
        <li><strong>コストと遅延</strong>:ステップごとにモデルを呼ぶため、時間と費用が増える。</li>
      </ul>
      <p>
        単純なタスクなら、固定の手順(ワークフロー)で組んだ方が、確実で安価なことも多いです。
        柔軟性が本当に必要な場合にだけ、エージェントを選ぶのがよいでしょう。
      </p>
      <div className="card bridge">
        <strong>第2部で実装する</strong>
        <p>
          ここで見たループを、Claude API で実際に作ります。ツールの定義と呼び出しループは <Link to="/lesson/10-1">Stage 10</Link>、
          ワークフローとの使い分け、止める条件、承認は <Link to="/lesson/11-1">Stage 11</Link>、安全な設計は <Link to="/lesson/12-2">12-2</Link> で扱います。
        </p>
      </div>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'ツール利用(関数呼び出し)で、実際にツールを実行するのは誰ですか?',
      choices: ['アプリケーション側', 'モデル自身', 'ユーザー'],
      answer: 0,
      explanation: 'モデルは呼び出しの依頼を出力するだけで、実行と結果の返却はアプリが行います。',
    },
    {
      question: 'エージェントの基本的なループはどれですか?',
      choices: [
        'モデルが行動を決める → ツールで実行 → 結果を見て次を決める、を繰り返す',
        '一度だけモデルを呼ぶ',
        'モデルを再学習し続ける',
      ],
      answer: 0,
      explanation: '目的を達成するか、上限に達するまで、思考と行動と観察を繰り返します。',
    },
    {
      question: 'エージェントに取り返しのつかない操作(送金など)を任せるときの対策はどれですか?',
      choices: [
        '人間の確認を挟み、権限を最小限にする',
        'モデルのtemperatureを上げる',
        '制限を設けず自由に実行させる',
      ],
      answer: 0,
      explanation: '誤りやインジェクションの可能性を前提に、重要な操作は人が承認する設計にします。',
    },
  ],
}

export default content
