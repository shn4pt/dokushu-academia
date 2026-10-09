import ApiPlayground from '../ui/ApiPlayground'
import CodeOrder from '../ui/CodeOrder'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>まず stop_reason を確かめる</h3>
      <p>
        応答が返ってきても、それが「書き終えた結果」とは限りません。<code>content</code> を使う前に、
        <strong>なぜ止まったのか(<code>stop_reason</code>)</strong>を確認する習慣をつけましょう。
      </p>
      <table className="calc text">
        <thead><tr><th>stop_reason</th><th>意味</th><th>アプリ側の対応</th></tr></thead>
        <tbody>
          <tr><td><code>end_turn</code></td><td>書き終えた</td><td>そのまま使う</td></tr>
          <tr><td><code>max_tokens</code></td><td>出力の上限で途中で切れた</td><td>上限を上げて再実行する。切れた結果をそのまま使わない</td></tr>
          <tr><td><code>stop_sequence</code></td><td>指定した停止文字列に達した</td><td>想定どおりなら使う</td></tr>
          <tr><td><code>tool_use</code></td><td>ツールを呼びたい</td><td>ツールを実行して結果を返す(Stage 10)</td></tr>
          <tr><td><code>pause_turn</code></td><td>サーバー側ツールの途中で一時停止</td><td>応答を履歴に加えて、もう一度送って続けさせる</td></tr>
          <tr><td><code>refusal</code></td><td>安全上の理由で応答を断った</td><td>断られた旨を扱う(後述のフォールバック)。エラーではなく、通常の応答(HTTP 200)として返る</td></tr>
          <tr><td><code>model_context_window_exceeded</code></td><td>応答がモデルのコンテキストウィンドウを埋めた</td><td>切り詰められた結果として扱う</td></tr>
        </tbody>
      </table>

      <h3>ストリーミング:生成された分から受け取る</h3>
      <p>
        応答を最後まで待つと、長い出力では数十秒以上かかり、利用者は何も見えないまま待つことになります。
        <strong>ストリーミング</strong>では、生成されたトークンを少しずつ受け取り、すぐに表示できます。
        長い出力でも HTTP のタイムアウトにかかりにくい、という利点もあります。
      </p>
      <pre>{`const stream = client.messages.stream({
  model: "claude-opus-5-5",
  max_tokens: 64000,
  messages,
});

stream.on("text", (delta) => process.stdout.write(delta)); // 届いた分を表示

// 最後に、完全な応答(stop_reason や usage を含む)を受け取る
const message = await stream.finalMessage();
console.log(message.stop_reason, message.usage.output_tokens);`}</pre>
      <p>内部では、次の順にイベントが届きます。</p>
      <ol>
        <li><code>message_start</code>:応答の開始</li>
        <li><code>content_block_start</code> → <code>content_block_delta</code>(複数回) → <code>content_block_stop</code>:ブロックごとに繰り返す</li>
        <li><code>message_delta</code>:<code>stop_reason</code> と使用量</li>
        <li><code>message_stop</code>:終了</li>
      </ol>
      <p className="muted">
        SDK の <code>finalMessage()</code> を使えば、イベントを自分で組み立てる必要はありません。途中に、接続を保つための <code>ping</code> が混ざることがあります。
        また、いったん 200 で始まったあとの混雑などは、エラーのイベント(<code>overloaded_error</code> など)として、ストリームの途中で届くことがあります。
      </p>

      <ApiPlayground
        title="試す:ストリーミングで受け取る"
        description="実行すると、生成された文字から順に表示されます。設定で最大出力を 256 にして長い文章を頼むと、stop_reason が max_tokens になるのも確認できます。"
        prompt="TypeScript の Promise と async/await の関係を、初めて学ぶ人向けに説明して"
        sample={{
          text: 'Promise は「あとで結果が届く約束」を表すオブジェクトです。たとえば fetch() はすぐには結果を返せないので、代わりに Promise を返し、通信が終わったときに結果(または失敗)が届きます。\n\nasync/await は、この Promise を読みやすく書くための書き方です。async を付けた関数の中では、await を付けると Promise の結果が届くまで待ち、届いた値をそのまま変数に入れられます。\n\nconst res = await fetch(url) と書けば、then() をつなげなくても、上から下へ順に読めるコードになります。失敗は try/catch で受け止めます。',
          stopReason: 'end_turn',
          usage: { input: 41, output: 312 },
        }}
      />

      <h3>エラーと再試行</h3>
      <p>API の呼び出しは失敗することがあります。<strong>再試行してよい失敗</strong>と、<strong>直さない限り何度やっても失敗するもの</strong>を区別します。</p>
      <table className="calc text">
        <thead><tr><th>状況</th><th>例</th><th>対応</th></tr></thead>
        <tbody>
          <tr><td>リクエストの誤り</td><td>400(不正なパラメータ)、413(リクエストが大きすぎる)</td><td>再試行しても直らない。リクエストを直す</td></tr>
          <tr><td>認証・権限</td><td>401、403</td><td>キーや権限を確認する</td></tr>
          <tr><td>レート制限</td><td>429</td><td>待ってから再試行(<code>retry-after</code> の秒数を目安に)</td></tr>
          <tr><td>API 側の一時的な問題</td><td>500 系、504(タイムアウト)、529(混雑)</td><td>間隔を空けて再試行。長い出力は、ストリーミングで受け取る</td></tr>
          <tr><td>通信の失敗</td><td>ネットワーク切断、タイムアウト</td><td>再試行</td></tr>
        </tbody>
      </table>
      <p>
        SDK は、429 と 500 系、通信エラー(408・409 も)を<strong>自動で再試行</strong>します(既定で2回、間隔を伸ばしながら)。回数やタイムアウトは
        クライアントの設定で変えられます。TypeScript SDK のタイムアウトはミリ秒です。
      </p>
      <pre>{`const client = new Anthropic({ maxRetries: 3, timeout: 60_000 });

try {
  const message = await client.messages.create({ /* ... */ });
} catch (error) {
  // 具体的な種類から順に判定する(文字列のメッセージで判定しない)
  if (error instanceof Anthropic.BadRequestError) {
    // リクエストを直す必要がある
  } else if (error instanceof Anthropic.RateLimitError) {
    // 自動再試行でも足りなかった。時間をおく
  } else if (error instanceof Anthropic.APIConnectionError) {
    // 通信の問題
  } else if (error instanceof Anthropic.APIError) {
    console.error(error.status, error.message);
  }
}`}</pre>

      <h3>断られたときへの備え</h3>
      <p>
        モデルには安全のための判定があり、まれに無害な依頼でも断る(<code>stop_reason: "refusal"</code>)ことがあります。
        Opus 5.5 などでは、断られたときに<strong>サーバー側で別の推奨モデルに切り替えて続ける</strong>設定(フォールバック)を使えます。
        本番では最初から有効にしておくのがおすすめです。このサイトのプレイグラウンドでも、対応するモデルでは有効にしています。
      </p>
      <pre>{`const response = await client.beta.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default", // 断られた理由に応じて、推奨モデルで続行する
  messages,
});

if (response.stop_reason === "refusal") {
  // フォールバック先でも断られた。断られた旨を利用者に伝える
}`}</pre>

      <CodeOrder
        title="並べ替え:1回の呼び出しを安全に処理する"
        description="ストリーミングで応答を受け取り、会話の履歴に加えるまでの処理です。正しい順番に並べ替えてください。"
        lines={[
          'messages.push({ role: "user", content: input });',
          'const stream = client.messages.stream({ model, max_tokens, messages });',
          'stream.on("text", (delta) => render(delta));',
          'const message = await stream.finalMessage();',
          'if (message.stop_reason === "refusal") return showRefusal();',
          'messages.push({ role: "assistant", content: message.content });',
        ]}
        explanation="利用者の発言を履歴に加えてから送信し、届いた分を表示しながら、最後に完全な応答を受け取ります。stop_reason を確かめてから、応答を履歴に加えます。"
      />
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'ストリーミングを使う主な利点はどれですか?',
      choices: [
        '料金が安くなる',
        '生成された分からすぐ表示でき、長い出力でもタイムアウトしにくい',
        'モデルが賢くなる',
      ],
      answer: 1,
      explanation: '待ち時間の体感が改善し、長い応答での HTTP タイムアウトも避けやすくなります。',
    },
    {
      question: 'API から 400(不正なリクエスト)が返りました。適切な対応はどれですか?',
      choices: ['同じリクエストを何度も再試行する', 'リクエストの内容を直す', '別のAPIキーに替える'],
      answer: 1,
      explanation: '400 はリクエスト自体の誤りなので、再試行しても成功しません。',
    },
    {
      question: 'SDK が既定で自動的に再試行するエラーはどれですか?',
      choices: ['400(不正なリクエスト)', '401(認証エラー)', '429(レート制限)'],
      answer: 2,
      explanation: '429 と 500 系、通信エラーは一時的な問題なので、SDK が間隔を空けて再試行します。',
    },
  ],
}

export default content
