import StepThrough from '../ui/StepThrough'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>モデルは「呼びたい」と言うだけ</h3>
      <p>
        LLM はテキストを生成するだけで、データベースを調べたり、メールを送ったりはできません(8-2)。そこで、使える操作を
        <strong>ツール</strong>として API に伝えます。モデルは必要だと判断すると、「このツールを、この引数で呼びたい」という
        <code>tool_use</code> ブロックを返します。実際に実行するのは<strong>あなたのプログラム</strong>で、結果を
        <code>tool_result</code> として返すと、モデルはそれを踏まえて続きを書きます。
      </p>

      <h3>ツールの定義</h3>
      <p>ツールは、名前、説明、引数の JSON Schema の3つで定義します。</p>
      <pre>{`const tools: Anthropic.Tool[] = [
  {
    name: "get_order_status",
    description:
      "注文番号から、注文の状況(発送状況、配送業者、お届け予定日)を調べる。" +
      "利用者が注文の状況や届く日を尋ねたときに使う。",
    input_schema: {
      type: "object",
      properties: {
        order_id: { type: "string", description: "注文番号。A-1234 の形式" },
      },
      required: ["order_id"],
    },
  },
];

const response = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  tools,
  messages: [{ role: "user", content: "注文 A-1002 はいつ届きますか?" }],
});
// response.stop_reason は "tool_use"
// response.content に { type: "tool_use", id: "toolu_...", name: "get_order_status",
//                      input: { order_id: "A-1002" } } が含まれる`}</pre>

      <StepThrough
        title="見る:ツールを使う1往復"
        description="送るリクエスト、モデルの tool_use、アプリが返す tool_result、最後の回答までを、1段ずつ見ていきます(JSON は要点だけに省略しています)。"
        steps={[
          {
            label: 'アプリ → API:ツールの一覧と依頼を送る',
            body: `{
  "model": "claude-opus-5-5",
  "tools": [{ "name": "get_order_status", "description": "...", "input_schema": {...} }],
  "messages": [{ "role": "user", "content": "注文 A-1002 はいつ届きますか?" }]
}`,
          },
          {
            label: 'API → アプリ:モデルがツールを呼びたいと返す',
            body: `{
  "stop_reason": "tool_use",
  "content": [
    { "type": "text", "text": "注文の状況を確認します。" },
    { "type": "tool_use", "id": "toolu_01A", "name": "get_order_status",
      "input": { "order_id": "A-1002" } }
  ]
}`,
            note: 'ここで止まります。モデル自身はツールを実行しません。',
          },
          {
            label: 'アプリ:ツールを実行する',
            body: `getOrderStatus({ order_id: "A-1002" })
→ { "status": "倉庫で準備中", "eta": "10月14日(予定)" }`,
            note: '引数はモデルが作ったものなので、実行前に検証します(次のレッスン)。',
          },
          {
            label: 'アプリ → API:会話の続きとして結果を返す',
            body: `"messages": [
  { "role": "user", "content": "注文 A-1002 はいつ届きますか?" },
  { "role": "assistant", "content": [ ...前の応答の content をそのまま... ] },
  { "role": "user", "content": [
    { "type": "tool_result", "tool_use_id": "toolu_01A",
      "content": "{\\"status\\":\\"倉庫で準備中\\",\\"eta\\":\\"10月14日(予定)\\"}" }
  ]}
]`,
            note: 'tool_use_id で、どの呼び出しへの結果かを対応づけます。',
          },
          {
            label: 'API → アプリ:結果を踏まえた回答',
            body: `{
  "stop_reason": "end_turn",
  "content": [{ "type": "text",
    "text": "ご注文 A-1002 は現在倉庫で準備中で、10月14日にお届けの予定です。" }]
}`,
          },
        ]}
      />

      <h3>説明文が、使われ方を決める</h3>
      <p>
        モデルは、ツールを使うかどうか、どの引数を渡すかを、<strong>名前と説明文</strong>から判断します。説明文は、新しく入った同僚に
        渡す手順書のつもりで書きます。
      </p>
      <ul>
        <li><strong>何をするか</strong>に加えて、<strong>いつ使うか</strong>を書く(「利用者が〜を尋ねたときに使う」)。</li>
        <li>引数ごとに説明を付け、形式や例を書く(「A-1234 の形式」)。選択肢が決まっているなら <code>enum</code> にする。</li>
        <li>引数の名前はあいまいにしない(<code>user</code> より <code>user_id</code>)。</li>
        <li>似たツールがあるなら、使い分けの境界を書く。</li>
        <li>本当に必須の引数だけを <code>required</code> にする。</li>
      </ul>
      <pre>{`// あいまいな定義: いつ使うのか、id が何の id なのか分からない
{ name: "lookup", description: "データを取得する",
  input_schema: { type: "object", properties: { id: { type: "string" } } } }

// 分かりやすい定義
{ name: "get_order_status",
  description: "注文番号から注文の状況を調べる。利用者が注文の状況や届く日を尋ねたときに使う。",
  input_schema: { type: "object",
    properties: { order_id: { type: "string", description: "注文番号。A-1234 の形式" } },
    required: ["order_id"] } }`}</pre>

      <h3>ツールを使わせる・使わせない</h3>
      <ul>
        <li><code>tool_choice</code> の既定は <code>auto</code>(モデルが判断する)。<code>none</code> にするとツールを使わない。</li>
        <li>
          特定のツールを強制する指定(<code>any</code>、<code>tool</code>)は、Opus 5.5 や Sonnet 5.5 では使えません(エラーになります)。
          使ってほしいときは、プロンプトでそう依頼し、実際に呼ばれたかを確認します。
        </li>
        <li>
          ツールの定義に <code>strict: true</code> を付けると、引数が必ずスキーマに沿います(スキーマには
          <code>additionalProperties: false</code> と <code>required</code> が必要。9-4 と同じ制約)。
        </li>
      </ul>

      <h3>引数は「信用しない入力」</h3>
      <p>
        <code>tool_use</code> の引数はモデルが生成したもので、形式の誤りや、想定外の値が入ることがあります。
        利用者の入力と同じように扱い、<strong>実行前に必ず検証</strong>します。ファイルのパスや SQL など、危険な値になりうる引数は特に注意が必要です。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'モデルが tool_use ブロックを返したとき、ツールを実行するのは誰ですか?',
      choices: ['モデル自身', 'あなたのプログラム', 'Anthropic のサーバーが自動で実行する'],
      answer: 1,
      explanation: '自分で定義したツールは、アプリ側で実行し、結果を tool_result として返します。',
    },
    {
      question: 'ツールの説明文に書くべき内容として、特に重要なものはどれですか?',
      choices: ['実装に使ったライブラリの名前', '何をするかと、いつ使うべきか', '作成者の名前'],
      answer: 1,
      explanation: 'モデルは説明文を読んで、ツールを使うかどうかと引数を判断します。',
    },
    {
      question: 'tool_use の引数(input)の扱いとして正しいものはどれですか?',
      choices: [
        'モデルが作ったものなので、そのまま信用して実行してよい',
        '形式や値を検証してから実行する',
        'スキーマを書いたので検証は不要',
      ],
      answer: 1,
      explanation: '引数はモデルの出力で、誤りや想定外の値がありえます。実行前に検証します。',
    },
  ],
}

export default content
