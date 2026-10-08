import StepThrough from '../ui/StepThrough'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>ツールの「つなぎ方」を標準化する</h3>
      <p>
        エージェントに社内の文書、チケット管理、カレンダー、データベースなどを使わせたいとき、アプリごとに、サービスごとに
        連携のコードを書くと、組み合わせの数だけ実装が必要になります。<strong>MCP(Model Context Protocol)</strong>は、
        AI アプリと外部のツールやデータをつなぐための<strong>共通のプロトコル</strong>です。Anthropic が公開した仕様で、
        現在は Claude Code や Claude Desktop、VS Code など、さまざまなアプリが対応しています。
      </p>
      <p>
        サービス側が一度 MCP サーバーを用意すれば、MCP に対応したどのアプリからも使えます。アプリ側も、MCP に対応すれば、
        多くのサーバーをつなげるようになります。
      </p>

      <h3>3つの登場人物</h3>
      <ul>
        <li><strong>MCP ホスト</strong>:AI アプリ本体(例: Claude Code)。1つ以上のサーバーとの接続を管理する。</li>
        <li><strong>MCP クライアント</strong>:ホストの中で、1つのサーバーとの接続を受け持つ部品。サーバーごとに1つ作られる。</li>
        <li><strong>MCP サーバー</strong>:ツールやデータを提供するプログラム。同じマシンで動く「ローカル」と、ネットワーク越しの「リモート」がある。</li>
      </ul>
      <p>サーバーが提供できるものは、主に次の3種類です。</p>
      <table className="calc text">
        <thead><tr><th>種類</th><th>内容</th><th>例</th></tr></thead>
        <tbody>
          <tr><td>Tools</td><td>実行できる操作</td><td>チケットの検索・作成、DB への問い合わせ</td></tr>
          <tr><td>Resources</td><td>参照できるデータ</td><td>ファイルの内容、DB のスキーマ</td></tr>
          <tr><td>Prompts</td><td>再利用できる指示のひな形</td><td>定型の作業手順、例示つきのプロンプト</td></tr>
        </tbody>
      </table>

      <h3>通信のしくみ</h3>
      <p>
        メッセージの形式は JSON-RPC 2.0 です。通信の手段(トランスポート)は2つあります。
      </p>
      <ul>
        <li><strong>stdio</strong>:同じマシン上で、標準入出力でやりとりする。ローカルのサーバー向け。</li>
        <li><strong>Streamable HTTP</strong>:HTTP の POST で送り、必要ならストリーミングで受け取る。リモートのサーバー向けで、認証には OAuth が推奨されている。</li>
      </ul>

      <StepThrough
        title="見る:ツールを見つけて、呼び出すまで"
        description="MCP クライアントとサーバーのやりとりです(仕様の 2026-07-28 版の例をもとに、毎回付くメタ情報 _meta を省略しています)。"
        steps={[
          {
            label: 'クライアント → サーバー:何ができるかを尋ねる',
            body: `{ "jsonrpc": "2.0", "id": 1, "method": "server/discover" }`,
            note: 'サーバーは、対応するバージョンと機能(tools、resources など)を返します。',
          },
          {
            label: 'クライアント → サーバー:ツールの一覧を取得する',
            body: `{ "jsonrpc": "2.0", "id": 2, "method": "tools/list" }`,
          },
          {
            label: 'サーバー → クライアント:ツールの一覧',
            body: `{ "jsonrpc": "2.0", "id": 2, "result": { "tools": [
  { "name": "weather_current",
    "description": "Get current weather information for any location worldwide",
    "inputSchema": { "type": "object",
      "properties": { "location": { "type": "string" } },
      "required": ["location"] } }
] } }`,
            note: 'name、description、inputSchema は、Claude API のツール定義(name、description、input_schema)とほぼ同じ形です。',
          },
          {
            label: 'クライアント → サーバー:ツールを呼び出す',
            body: `{ "jsonrpc": "2.0", "id": 3, "method": "tools/call",
  "params": { "name": "weather_current",
              "arguments": { "location": "San Francisco" } } }`,
            note: 'モデルが tool_use を返したら、ホストがこのリクエストに変換して送ります。',
          },
          {
            label: 'サーバー → クライアント:結果',
            body: `{ "jsonrpc": "2.0", "id": 3, "result": { "content": [
  { "type": "text", "text": "Current weather in San Francisco: 68°F, partly cloudy ..." }
] } }`,
            note: 'ホストは、この内容を tool_result としてモデルに返します。',
          },
        ]}
      />

      <h3>Claude API から MCP サーバーを使う方法</h3>
      <p><strong>1. MCP コネクタ(ベータ)</strong>:API にサーバーの URL を渡すと、Anthropic 側でサーバーに接続し、ツールを呼び出します。自分で MCP クライアントを実装する必要はありません。</p>
      <pre>{`const response = await client.beta.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  betas: ["mcp-client-2025-11-20"],
  mcp_servers: [
    { type: "url", url: "https://example.com/mcp", name: "tickets", authorization_token: token },
  ],
  tools: [
    {
      type: "mcp_toolset",
      mcp_server_name: "tickets", // mcp_servers の name と対応させる
      default_config: { enabled: false }, // 既定ですべて無効にして、
      configs: { search_tickets: { enabled: true } }, // 必要なツールだけ許可する
    },
  ],
  messages,
});`}</pre>
      <ul>
        <li>使えるのはツールの呼び出しだけ(Resources や Prompts は対象外)。</li>
        <li>インターネットから HTTP で接続できるサーバーが対象で、ローカルの stdio のサーバーにはつなげない。</li>
        <li>新しいベータ(<code>mcp-client-2026-09-15</code>)では、会話の途中でサーバーのツールが変わらないよう、ツールの一覧を固定する機能が加わっています。</li>
      </ul>
      <p>
        <strong>2. 自分のアプリを MCP ホストにする</strong>:MCP の公式 SDK でクライアントを作り、サーバーのツール一覧を Claude API の
        ツール定義に変換して渡します。モデルが <code>tool_use</code> を返したら <code>tools/call</code> で実行し、結果を
        <code>tool_result</code> として返します。10-2 のループの <code>runTool</code> の中身が、MCP の呼び出しになるだけです。
        ローカルのサーバーや、Resources なども使えます。
      </p>

      <h3>安全に使うために</h3>
      <ul>
        <li>
          <strong>信頼できるサーバーだけを使う</strong>。サーバーが返すツールの説明や結果は、モデルにそのまま読まれます。悪意のある、あるいは
          乗っ取られたサーバーが、説明文や結果に指示を紛れ込ませる攻撃(プロンプトインジェクション)がありえます。
        </li>
        <li><strong>必要なツールだけを許可する</strong>。上の例のように、既定で無効にして、使うものだけを有効にする。</li>
        <li><strong>書き込みや送信をするツールには承認を挟む</strong>(11-2、12-2)。</li>
        <li><strong>権限を絞ったトークンを使う</strong>。サーバーに渡す認証情報は、その用途に必要な範囲に限る。</li>
      </ul>
      <p className="muted">
        MCP の仕様は更新が続いています(たとえば 2026-07-28 版では、サーバーがモデルの生成を依頼する sampling が非推奨になりました)。
        実装するときは、公式サイトで最新の仕様と SDK を確認してください。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'MCP の主な目的はどれですか?',
      choices: [
        'LLM を高速に学習させる',
        'AI アプリと外部のツールやデータを、共通の方式でつなぐ',
        'API キーを安全に保管する',
      ],
      answer: 1,
      explanation: 'サービスごとに個別の連携を書かなくても、共通のプロトコルでつなげるようにするのが MCP です。',
    },
    {
      question: 'Claude API の MCP コネクタについて正しいものはどれですか?',
      choices: [
        'ローカルの stdio のサーバーにも直接つなげる',
        'HTTP で接続できるリモートのサーバーのツールを、API 側から呼び出せる',
        'Resources と Prompts も使える',
      ],
      answer: 1,
      explanation: 'MCP コネクタは、リモートのサーバーのツール呼び出しに対応しています。',
    },
    {
      question: 'MCP サーバーを使うときのリスクとして、特に注意すべきものはどれですか?',
      choices: [
        'ツールの説明や結果に指示が紛れ込み、モデルが従ってしまう',
        'JSON-RPC は暗号化できない',
        'ツールが多すぎると API が拒否する',
      ],
      answer: 0,
      explanation: 'サーバーの出力はモデルに読まれるため、信頼できるサーバーに限り、権限と許可するツールを絞ります。',
    },
  ],
}

export default content
