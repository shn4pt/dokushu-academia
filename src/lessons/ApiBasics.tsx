import ApiPlayground from '../ui/ApiPlayground'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>LLM を「部品」として呼び出す</h3>
      <p>
        第1部では LLM の内部を見てきました。第2部では、それを<strong>自分のプログラムから使う</strong>側に回ります。
        Claude の API は、基本的に <code>POST /v1/messages</code> という1つの入口(Messages API)だけでできています。
        ツールの利用も構造化出力も、この入口に渡すパラメータで指定します。
      </p>
      <ul>
        <li><strong>送るもの</strong>:モデル名、出力の上限(<code>max_tokens</code>)、会話(<code>messages</code>)、必要なら前提の指示(<code>system</code>)。</li>
        <li><strong>返るもの</strong>:内容のブロックの配列(<code>content</code>)、止まった理由(<code>stop_reason</code>)、使ったトークン数(<code>usage</code>)。</li>
      </ul>

      <h3>最小のコード</h3>
      <p>公式の TypeScript SDK を使います。サーバー側(Node.js)で動かす前提です。</p>
      <pre>{`npm install @anthropic-ai/sdk
export ANTHROPIC_API_KEY=sk-ant-...   # キーは環境変数で渡す`}</pre>
      <pre>{`import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // 環境変数 ANTHROPIC_API_KEY を読む

const response = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  system: "あなたは要点を短くまとめるアシスタントです。",
  messages: [{ role: "user", content: "TCP と UDP の違いを3行で教えて" }],
});

// content はブロックの配列。type で種類を確かめてから使う
for (const block of response.content) {
  if (block.type === "text") console.log(block.text);
}
console.log(response.stop_reason, response.usage);`}</pre>

      <ApiPlayground
        title="試す:最初の API 呼び出し"
        description="system と user を書き換えて実行してみましょう。「送信するリクエストの中身」で、実際に送る JSON も確認できます。"
        system="あなたは要点を短くまとめるアシスタントです。"
        prompt="TCP と UDP の違いを3行で教えて"
        sample={{
          text: '・TCP は接続を確立してから通信し、届いたかを確認して順番どおりに再送・整列する(信頼性重視)。\n・UDP は接続を作らずに送るだけで、届いたかの確認や再送はしない(速さ・軽さ重視)。\n・Web やファイル転送は TCP、動画配信・音声通話・オンラインゲームなど遅延を嫌う用途は UDP が多い。',
          stopReason: 'end_turn',
          usage: { input: 52, output: 168 },
        }}
      />

      <h3>メッセージの構造</h3>
      <ul>
        <li><code>messages</code> は <code>user</code> と <code>assistant</code> が交互に並ぶ会話です。最初は <code>user</code> から始めます。</li>
        <li><code>system</code> は会話とは別枠の「前提」です。役割、守ってほしい方針、背景知識などを書きます。</li>
        <li>
          <code>content</code> は文字列のほか、ブロックの配列でも渡せます(テキスト、画像、ツールの結果など)。応答の <code>content</code> も
          ブロックの配列で、テキストのほかに、モデルの思考を表す <code>thinking</code> ブロックやツール呼び出しが含まれることがあります。
        </li>
      </ul>

      <h3>API は会話を覚えていない</h3>
      <p>
        API は呼び出しの間で状態を持ちません(6-3 で見たとおりです)。続けて会話するには、<strong>それまでのやりとりを毎回すべて送ります</strong>。
        応答はテキストだけでなく、<code>content</code> 全体をそのまま履歴に加えるのが安全です(思考やツール呼び出しのブロックも次の呼び出しで必要になるため)。
      </p>
      <pre>{`const messages: Anthropic.MessageParam[] = [];

async function chat(input: string) {
  messages.push({ role: "user", content: input });
  const response = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    messages, // 毎回、会話の全体を送る
  });
  messages.push({ role: "assistant", content: response.content });
  return response;
}`}</pre>

      <h3>主なパラメータ</h3>
      <table className="calc text">
        <thead><tr><th>パラメータ</th><th>意味</th></tr></thead>
        <tbody>
          <tr><td><code>model</code></td><td>使うモデル。性能・速さ・料金が異なる</td></tr>
          <tr><td><code>max_tokens</code></td><td>出力トークンの上限。達すると途中で止まる。低すぎると答えが切れるので、余裕を持たせる</td></tr>
          <tr><td><code>system</code></td><td>会話の前提となる指示</td></tr>
          <tr><td><code>output_config.effort</code></td><td>考える深さ(<code>low</code>〜<code>max</code>)。高いほど丁寧だが、出力トークンと時間が増える。Opus 5.5 の既定は <code>medium</code></td></tr>
          <tr><td><code>thinking</code></td><td>思考の設定。最新のモデルは応答の前に考える(思考に使ったトークンも出力として課金される)</td></tr>
        </tbody>
      </table>
      <p className="muted">
        6-1 で学んだ temperature などのサンプリング設定は、最新のモデルでは API から指定できません(既定以外の値を送るとエラーになります)。
        仕組みとして理解しておけば十分です。
      </p>

      <h3>トークンと料金</h3>
      <p>
        料金は、入力トークンと出力トークンのそれぞれに、モデルごとの単価をかけたものです。応答の <code>usage</code> で実際の数を確認できます。
      </p>
      <table className="calc text">
        <thead><tr><th>モデル(2026年10月時点)</th><th>入力 / 100万トークン</th><th>出力 / 100万トークン</th></tr></thead>
        <tbody>
          <tr><td>Claude Opus 5.5</td><td>$4</td><td>$20</td></tr>
          <tr><td>Claude Sonnet 5.5</td><td>$2</td><td>$10</td></tr>
          <tr><td>Claude Haiku 5.5</td><td>$0.10</td><td>$0.50</td></tr>
        </tbody>
      </table>
      <p>
        例:Opus 5.5 で入力 2,000、出力 1,000 トークンなら、2,000 × $4 / 100万 + 1,000 × $20 / 100万 = <strong>約 $0.028</strong>。
        エージェントは1つの仕事で何度も API を呼ぶので、1回あたりは小さくても積み重なります(12-3 で扱います)。
      </p>

      <h3>APIキーの扱い(重要)</h3>
      <p>
        APIキーは、それを持つ人が<strong>あなたの費用で</strong> API を使えてしまう秘密情報です。
      </p>
      <ul>
        <li>コードに直接書かず、環境変数などで渡す。リポジトリにコミットしない。</li>
        <li>
          Webアプリでは、<strong>キーをブラウザに置かない</strong>。ブラウザからは自分のサーバーを呼び、サーバーが API を呼ぶ構成にする。
        </li>
      </ul>
      <p>
        SDK は、ブラウザでの利用を既定で無効にしています。このサイトのプレイグラウンドは、学習のために <code>dangerouslyAllowBrowser: true</code>
        を明示して有効にしています。名前のとおり、本番のアプリでは使わない設定です。
      </p>
      <pre>{`// 学習用(このサイトのプレイグラウンド)。本番では使わない
const client = new Anthropic({ apiKey: userKey, dangerouslyAllowBrowser: true });`}</pre>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '2回目以降の呼び出しで、前の会話の内容をモデルに踏まえさせるにはどうしますか?',
      choices: [
        'API が自動で覚えているので、新しいメッセージだけ送る',
        'それまでの会話をすべて messages に入れて送る',
        'system に「前の会話を思い出して」と書く',
      ],
      answer: 1,
      explanation: 'API は状態を持たないため、会話の履歴は毎回すべて送ります。',
    },
    {
      question: '応答の stop_reason が "max_tokens" でした。何が起きていますか?',
      choices: ['正常に書き終えた', '出力の上限に達して、途中で止まった', 'ツールを呼び出したい'],
      answer: 1,
      explanation: '上限で切れているので、max_tokens を増やすなどの対応が必要です。',
    },
    {
      question: '本番の Web アプリで、APIキーをどこに置くべきですか?',
      choices: ['ブラウザで動く JavaScript の中', '自分のサーバー側(環境変数など)', 'HTML のコメントの中'],
      answer: 1,
      explanation: 'ブラウザに置いたキーは利用者に見えてしまいます。サーバー側から API を呼びます。',
    },
  ],
}

export default content
