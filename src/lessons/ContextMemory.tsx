import { useState } from 'react'
import { Slider } from '../components'
import type { LessonContent } from './types'

const BASE = 4000 // system とツール定義
const PER_TURN_TEXT = 400 // モデルの文章とツール呼び出し
const KEEP = 3 // 古いツール結果を消すとき、残す件数

function simulate(turns: number, result: number, clear: boolean, cacheOn: boolean) {
  let billedNoCache = 0
  let billedCache = 0
  const sizes: number[] = []
  for (let t = 1; t <= turns; t++) {
    const kept = clear ? Math.min(t, KEEP) : t
    const size = BASE + t * PER_TURN_TEXT + kept * result
    sizes.push(size)
    billedNoCache += size
    // キャッシュあり: 前回までと同じ先頭部分は読み込み(1割の料金と仮定)、新しく加わった部分だけ通常料金
    const prev = sizes[t - 2] ?? 0
    const fresh = clear && t > KEEP ? size - prev + result : size - prev // 消した分は先頭が変わる(キャッシュが効かない部分が増える)の近似
    billedCache += cacheOn ? Math.max(0, size - fresh) * 0.1 + fresh : size
  }
  return { sizes, billedNoCache, billedCache }
}

const fmtK = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : `${Math.round(n / 1000)}K`)

function ContextSim() {
  const [turns, setTurns] = useState(20)
  const [result, setResult] = useState(5000)
  const [clear, setClear] = useState(false)
  const [cacheOn, setCacheOn] = useState(false)
  const r = simulate(turns, result, clear, cacheOn)
  const max = Math.max(...r.sizes)
  return (
    <div className="demo">
      <h4>試す:エージェントのコンテキストはどう増えるか</h4>
      <p className="muted">
        ツールを1回呼ぶたびに、ツールの結果が会話に積み上がります。API は毎回、会話の全体を送るので、入力トークンの合計は急速に増えます(模式的な計算です)。
      </p>
      <Slider label="ループの回数" value={turns} min={1} max={40} step={1} onChange={setTurns} />
      <Slider label="ツール結果の大きさ" value={result} min={500} max={20000} step={500} onChange={setResult} format={(v) => `${v.toLocaleString()} トークン`} />
      <label className="check-row"><input type="checkbox" checked={clear} onChange={(e) => setClear(e.target.checked)} /> 古いツール結果を消す(直近 {KEEP} 件だけ残す)</label>
      <label className="check-row"><input type="checkbox" checked={cacheOn} onChange={(e) => setCacheOn(e.target.checked)} /> プロンプトキャッシュを使う(読み込みは通常の1割の料金と仮定)</label>
      <div className="ctx-bars" role="img" aria-label="ループの回ごとのコンテキストの大きさ">
        {r.sizes.map((s, i) => (
          <div key={i} className="ctx-bar" style={{ height: `${(s / max) * 100}%` }} title={`${i + 1}回目: ${fmtK(s)}`} />
        ))}
      </div>
      <table className="calc">
        <tbody>
          <tr><td>最後の回のコンテキスト</td><td><strong>{fmtK(r.sizes[r.sizes.length - 1])}</strong> トークン</td></tr>
          <tr><td>入力トークンの合計(全回の合計)</td><td><strong>{fmtK(r.billedNoCache)}</strong></td></tr>
          <tr><td>料金換算の入力量{cacheOn ? '(キャッシュあり)' : ''}</td><td><strong>{fmtK(r.billedCache)}</strong> 相当</td></tr>
        </tbody>
      </table>
      <p className="muted">
        古い結果を消すと、コンテキストが一定の大きさに収まります。ただし会話の先頭部分が変わるため、キャッシュは効きにくくなります(このトレードオフも、この計算に近似で入れています)。
      </p>
    </div>
  )
}

function Body() {
  return (
    <>
      <h3>コンテキストは、エージェントの「作業机」</h3>
      <p>
        エージェントが覚えていられるのは、毎回送るコンテキストの中身だけです(6-3)。ループが長くなると、ツールの結果が積み上がり、
        次のような問題が起きます。
      </p>
      <ul>
        <li><strong>費用と遅延</strong>:毎回全体を送るので、入力トークンの合計は、回数のほぼ2乗で増える。</li>
        <li><strong>上限</strong>:コンテキストウィンドウ(Opus 5.5 では100万トークン)に近づく。</li>
        <li><strong>質の低下</strong>:古く無関係な情報が増えると、大事な情報が埋もれやすい。</li>
      </ul>

      <ContextSim />

      <h3>対策1:そもそも大きな結果を入れない</h3>
      <p>
        最も効くのは、ツールが必要な情報だけを返すようにすることです(10-3)。件数の上限、絞り込み、要約した形式の選択肢を用意します。
      </p>

      <h3>対策2:古いツール結果を消す(コンテキスト編集)</h3>
      <p>
        役目を終えた古いツール結果や思考のブロックを、会話から消します。Claude API にはこれをサーバー側で行う機能(ベータ)があります。
        要約はせず、消すだけなので、会話の構造は保たれます。
      </p>
      <pre>{`const response = await client.beta.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  betas: ["context-management-2025-06-27"],
  context_management: { edits: [{ type: "clear_tool_uses_20250919" }] },
  tools,
  messages,
});`}</pre>

      <h3>対策3:要約で置き換える(コンパクション)</h3>
      <p>
        会話が長くなり上限に近づいたら、それまでの内容を要約に置き換えます。Claude API のコンパクション(ベータ)では、
        既定で15万トークン程度に達すると、サーバー側で要約が作られます。応答に含まれる要約のブロックを次の呼び出しで必ず送り返す必要があるので、
        <strong>テキストだけでなく応答の <code>content</code> を丸ごと履歴に加えます</strong>(9-1 で学んだとおりです)。
      </p>
      <pre>{`const response = await client.beta.messages.create({
  betas: ["compact-2026-01-12"],
  model: "claude-opus-5-5",
  max_tokens: 16000,
  messages,
  context_management: { edits: [{ type: "compact_20260112" }] },
});
messages.push({ role: "assistant", content: response.content }); // 要約のブロックを保つ`}</pre>

      <h3>対策4:会話の外に記憶する(メモリ)</h3>
      <p>
        会話をまたいで覚えておきたいこと(利用者の好み、作業の進み具合、決まったこと)は、コンテキストの外に保存します。
        Claude API のメモリツール(<code>memory_20250818</code>)を使うと、モデルが <code>/memories</code> のファイルを読み書きでき、
        保存先はアプリ側で実装します。パスワードや API キーなどの秘密情報は保存しない、個人情報の扱いに注意する、
        利用者ごとに保存先を分ける、といった配慮が必要です。
      </p>

      <h3>対策5:作業を分けて、コンテキストを分ける(サブエージェント)</h3>
      <p>
        大量の資料を読む作業を別のエージェントに任せ、要点だけを受け取ると、メインのエージェントのコンテキストを小さく保てます(11-5)。
      </p>

      <h3>プロンプトキャッシュ:同じ先頭部分を再利用する</h3>
      <p>
        エージェントは、毎回ほぼ同じ内容(system、ツール定義、それまでの会話)を送ります。<strong>プロンプトキャッシュ</strong>を使うと、
        前回と同じ先頭部分の処理結果が再利用され、その部分の入力料金が大幅に安くなり(Opus 5.5 では通常の5%)、応答も速くなります。
      </p>
      <pre>{`const response = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  cache_control: { type: "ephemeral" }, // 自動でキャッシュの区切りを置く
  system: SYSTEM_PROMPT,
  tools,
  messages,
});
console.log(response.usage.cache_read_input_tokens); // キャッシュから読んだトークン数`}</pre>
      <ul>
        <li>キャッシュは<strong>先頭からの完全一致</strong>で効く。順番は tools → system → messages。</li>
        <li>変わらない内容を前に、変わる内容を後ろに置く。system に現在時刻のような毎回変わる値を入れると、キャッシュが効かなくなる。</li>
        <li>ツールの一覧やモデルを途中で変えると、キャッシュが効かなくなる。</li>
        <li><code>usage.cache_read_input_tokens</code> が0のままなら、どこかで先頭が変わっている。</li>
        <li>書き込み時は通常より少し高く(5分間保持で1.25倍)、短すぎる内容はキャッシュされない。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'エージェントのループで、入力トークンの合計が急速に増える主な理由はどれですか?',
      choices: [
        'API が毎回、会話の全体を受け取るため、積み上がったツール結果を毎回送るから',
        'モデルが勝手に入力を増やすから',
        'ツール定義が毎回2倍になるから',
      ],
      answer: 0,
      explanation: 'API は状態を持たないので、毎回すべてを送ります。結果が積み上がるほど合計は大きくなります。',
    },
    {
      question: 'コンパクションを使うときに必ず守ることはどれですか?',
      choices: [
        '応答のテキストだけを履歴に加える',
        '応答の content を丸ごと履歴に加え、要約のブロックを送り返す',
        '毎回 system を書き換える',
      ],
      answer: 1,
      explanation: '要約のブロックを送り返さないと、要約で置き換えた状態が失われます。',
    },
    {
      question: 'プロンプトキャッシュを効かせるための配置として正しいものはどれですか?',
      choices: [
        '毎回変わる値(現在時刻など)を system の先頭に置く',
        '変わらない内容を前に、変わる内容を後ろに置く',
        '毎回ツールの順番を入れ替える',
      ],
      answer: 1,
      explanation: 'キャッシュは先頭からの完全一致で効くため、先頭は変えないようにします。',
    },
  ],
}

export default content
