import { Link } from 'react-router-dom'
import CodeReview from '../ui/CodeReview'
import serverSource from '../capstone2/mcpServer.ts?raw'
import stdioSource from '../capstone2/mcpStdio.ts?raw'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>なぜ、MCP サーバーを自分で作るのか</h3>
      <p>
        <Link to="/lesson/10-4">10-4</Link> では、MCP が、AI アプリと外部のツールやデータを、共通の方式でつなぐ仕組みだと学びました。
        13 章までで作ったサポートエージェントのツール(FAQ の検索、注文の確認)は、そのエージェントの中でしか使えません。
        同じツールを <strong>MCP サーバー</strong>として公開すると、Claude Code など、MCP に対応する別のアプリからも、作り直さずに使えます。
        逆に、自分のサービスを、ほかの人の AI アプリから使ってもらうための入口にもなります。
      </p>
      <p>
        MCP サーバーが提供できるものは、<strong>ツール</strong>(モデルが呼ぶ関数)、<strong>リソース</strong>(読み取れるデータ)、<strong>プロンプト</strong>(定型の指示)の3つです。
        このレッスンでは、いちばんよく使う<strong>ツール</strong>を作ります。
      </p>

      <h3>最小のサーバー</h3>
      <p>
        TypeScript の公式 SDK の、現在の版(v2)では、サーバーのためのパッケージ <code>@modelcontextprotocol/server</code> と、入力の検証に使う Zod を使います
        (以前の版の <code>@modelcontextprotocol/sdk</code> とは、パッケージも書き方も違うので、古い記事のコードをそのまま使わないでください)。
        サーバーを作って、<code>registerTool</code> でツールを登録するだけです。
      </p>
      <pre className="code-file">{`import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

const server = new McpServer({ name: "support", version: "1.0.0" });

server.registerTool(
  "get_order_status",
  {
    title: "注文の状況を調べる",
    description: "注文番号から、ログイン中の利用者の注文の状況を調べる。…",
    inputSchema: z.object({ order_id: z.string().regex(/^A-\\d{4}$/) }),
    annotations: { readOnlyHint: true },
  },
  async ({ order_id }) => ({ content: [{ type: "text", text: "…" }] }),
);`}</pre>
      <details>
        <summary>mcpServer.ts の全文を見る</summary>
        <pre className="code-file">{serverSource}</pre>
      </details>

      <h3>ツールの設計は、10-3 と同じ</h3>
      <p>
        MCP のツールも、モデルが読んで使うので、<Link to="/lesson/10-3">10-3</Link> の原則がそのまま当てはまります。
      </p>
      <ul>
        <li><strong>説明文</strong>に、何をするか、いつ使うか、ほかのツールとの境界を書く(<code>search_faq</code> の説明に、「注文の状況は get_order_status を使う」と書いたように)。</li>
        <li><strong>少数の、目的がはっきりしたツール</strong>にする。ツール名は、英数字・<code>_</code>・<code>-</code>・<code>.</code> で、サーバーの中で一意にする(仕様)。複数のサーバーをつなぐクライアントは、名前の衝突を避けるために、サーバー名などを前に付けることがある。</li>
        <li><strong>読み取りだけ</strong>のツールには、<code>readOnlyHint: true</code> などの注釈(アノテーション)を付ける。ただし注釈は<strong>ヒント</strong>で、仕様は、クライアントが、信頼できるサーバーからでない限り、注釈を信用してはいけないと定めています。安全は、注釈ではなく、サーバーの実装(権限・検証)で守ります。</li>
        <li>ツールの<strong>一覧の順序は、毎回同じ</strong>にする。仕様は、決まった順序で返すことを勧めています(クライアントが一覧をキャッシュしやすくなり、LLM のプロンプトキャッシュも効きやすくなる。<Link to="/lesson/20-3">20-3</Link>)。</li>
      </ul>

      <h3>エラーは2種類ある</h3>
      <table className="calc text">
        <thead><tr><th>種類</th><th>例</th><th>どう返るか</th></tr></thead>
        <tbody>
          <tr><td><strong>ツールの実行のエラー</strong></td><td>注文が見つからない、引数の形式が違う、外部の API の失敗</td><td>結果の中で <code>isError: true</code>。モデルが読んで、直して再試行できる</td></tr>
          <tr><td><strong>プロトコルのエラー</strong></td><td>存在しないツール、リクエストの形そのものの誤り、サーバーの故障</td><td>JSON-RPC のエラー(例外)。モデルには、直しにくい</td></tr>
        </tbody>
      </table>
      <p>
        モデルが自分で直せる失敗は、<code>isError: true</code> の結果として、<strong>直し方を含めて</strong>返します(10-2 の <code>is_error</code> と同じ考え方です)。
        SDK は、Zod のスキーマに合わない引数を、実行する前に、検証のエラーとして <code>isError</code> の結果で返します。
        このレッスンのコードは、実物の MCP クライアントと、メモリ上でつないだテストで、これらの動きを確かめています。
      </p>

      <h3>利用者は、引数ではなく、接続で決める</h3>
      <p>
        <code>createSupportMcpServer</code> は、<strong>利用者の ID を、サーバーを作るときに受け取り</strong>、ツールの引数には含めません。
        モデルが <code>user_id</code> を渡せると、他人の ID を指定して、他人の注文を見られてしまうからです(12-2、13-2 と同じ考え方)。
        実際のサービスでは、接続の認証(ログイン情報、OAuth のトークン)から利用者を決めます。
        仕様は、サーバーが複数の呼び出しにまたがる状態を持つ場合も、<strong>状態を指すハンドル(カートの ID など)を持っていること自体を、認証として扱ってはいけない</strong>と述べています。
        ハンドルは推測できない値にし、呼び出した利用者に結びつけて、毎回確かめます。
      </p>

      <h3>標準入出力(stdio)で動かす</h3>
      <p>
        自分の PC で動かすサーバーは、MCP クライアントが<strong>子プロセスとして起動し、標準入出力で JSON-RPC をやりとり</strong>します。入口は、短いファイルです。
      </p>
      <details>
        <summary>mcpStdio.ts の全文を見る</summary>
        <pre className="code-file">{stdioSource}</pre>
      </details>
      <p>
        <strong>最大の落とし穴は、標準出力に何も書かないこと</strong>です。<code>console.log()</code> は標準出力に書くため、JSON-RPC のメッセージが壊れ、サーバーが動かなくなります。
        ログは、標準エラー(<code>console.error()</code>)に出します。HTTP のサーバーでは、標準出力のログは問題ありません。
      </p>

      <h3>つなぐ</h3>
      <ul>
        <li>
          <strong>Claude Code から使う(自分の PC のサーバー)</strong>:ビルドしたファイルを、子プロセスとして登録します。<code>--</code> は、Claude Code 自身のオプションと、サーバーを起動するコマンドを分ける区切りです。
          <pre>{`claude mcp add --transport stdio support -- node build/mcpStdio.js`}</pre>
          登録の範囲(スコープ)は、自分のこのプロジェクトだけ(既定)、プロジェクトのチームで共有(<code>.mcp.json</code>)、自分のすべてのプロジェクト、の3つです。<code>claude mcp list</code> で、接続の状態を確かめられます。
        </li>
        <li>
          <strong>リモートのサーバー(HTTP)</strong>:公開した URL を、<code>claude mcp add --transport http 名前 URL</code> で登録します。
        </li>
        <li>
          <strong>Claude API から使う</strong>:Messages API の <strong>MCP コネクタ</strong>(ベータ。ヘッダは <code>mcp-client-2025-11-20</code>)は、<strong>リモートの MCP サーバー</strong>に、API から直接つなぎます。
          自分の PC の stdio のサーバーには、つなげません。API から使いたいときは、サーバーを HTTP で公開します。
        </li>
      </ul>

      <h3>安全のために</h3>
      <p>MCP サーバーは、AI に、実際の操作をさせる入口です。仕様と、セキュリティの手引きが求めていることを、押さえます。</p>
      <ul>
        <li><strong>サーバーは、入力を検証し、アクセスを制御し、呼び出しの頻度を制限し、出力を無害にする</strong>(仕様の、サーバーが守ることの一覧)。</li>
        <li><strong>最小の権限</strong>にする。読み取りだけのツールと、書き込みのツールを分け、書き込みのツールは、クライアントの確認(人の承認)を前提にする。権限(スコープ)は、まず小さく始め、必要になったときに、段階的に広げる。</li>
        <li><strong>トークンの素通しをしない</strong>。サーバーは、自分あてに発行されたトークンだけを受け入れ、受け取ったトークンを、そのまま別の API に渡さない(権限の境界が崩れ、「混乱した代理人」の問題になる)。</li>
        <li><strong>自分の PC のサーバーは、自分と同じ権限で動く</strong>。他人の作ったサーバーを登録するときは、実行されるコマンドを、省略せずに確認する。Claude Code の公式のドキュメントも、信頼できるサーバーだけをつなぐこと、外部の内容を取り込むサーバーはプロンプトインジェクションの危険があることを、注意しています。</li>
        <li>ツールの<strong>結果にも、外部の文が混ざる</strong>(12-2)。サーバーが外部のデータを返すなら、それは指示ではなくデータとして扱われるよう、クライアント側の設計(承認、権限の分離)も合わせて考える。</li>
      </ul>

      <h3>テストする</h3>
      <p>
        サーバーは、実際の AI や Claude Code につなぐ前に、<strong>実物の MCP クライアントと、メモリ上でつないで</strong>テストできます(SDK が、そのための、つなぎ口を用意しています)。
        ツールの一覧、呼び出し、エラーを、自動のテストで確かめておくと、説明文や検証を直したときの退行に気づけます。
      </p>
      <pre className="code-file">{`const server = createSupportMcpServer({ userId: "u1", db, faq });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await server.connect(serverTransport);
const client = new Client({ name: "test", version: "1.0.0" });
await client.connect(clientTransport);

const { tools } = await client.listTools();
const result = await client.callTool({ name: "get_order_status", arguments: { order_id: "A-9999" } });
// result.isError === true、直し方が結果の文に入っている`}</pre>

      <CodeReview
        title="レビュー1:標準入出力のサーバー"
        description="標準入出力で動かす MCP サーバーの入口です。サーバーが動かなくなる原因の行を、1つ選んでください。"
        lines={[
          'const server = createSupportMcpServer({ userId, db, faq });',
          'console.log("support MCP server starting...");',
          'await server.connect(new StdioServerTransport());',
          'console.error("support MCP server running on stdio");',
        ]}
        answers={[1]}
        explanation="2行目の console.log は、標準出力に書きます。標準入出力で動かすサーバーでは、標準出力は、JSON-RPC のメッセージの通り道なので、ほかの文字が混ざると、クライアントが読めなくなります。ログは、console.error(標準エラー)に出します。"
      />
      <CodeReview
        title="レビュー2:注文を調べるツール"
        description="注文の状況を調べるツールの定義です。他人の注文を見られてしまう原因の行を、1つ選んでください。"
        lines={[
          'server.registerTool("get_order_status", {',
          '  description: "注文の状況を調べる。",',
          '  inputSchema: z.object({ user_id: z.string(), order_id: z.string() }),',
          '}, async ({ user_id, order_id }) => {',
          '  const order = await db.findOrder(user_id, order_id);',
          '  return { content: [{ type: "text", text: JSON.stringify(order) }] };',
          '});',
        ]}
        answers={[2, 4]}
        explanation="利用者の ID を、モデルが渡せる引数にしているため(3行目)、他人の ID を指定すれば、他人の注文を調べられます。利用者は、接続の認証から決め、サーバーを作るときに受け取って、データベースの呼び出しに使います(5行目も、その ID を使うよう直します)。注文番号の形式の検証や、見つからないときの isError の結果も、あわせて必要です。"
      />
      <CodeReview
        title="レビュー3:外部の API を呼ぶサーバー"
        description="MCP サーバーが、受け取ったトークンを使って、社内の API を呼ぶ部分です。安全上の問題がある行を、1つ選んでください。"
        lines={[
          'async function callInternalApi(request, path) {',
          '  const token = request.headers.get("authorization");',
          '  // クライアントから受け取ったトークンを、そのまま社内の API に渡す',
          '  return fetch(`https://internal.example.com${path}`, { headers: { authorization: token } });',
          '}',
        ]}
        answers={[3]}
        explanation="トークンの素通し(token passthrough)です。MCP の仕様は、サーバーが、自分あてに発行されていないトークンを受け入れること、そして、それを下流の API に渡すことを、禁止しています。権限の境界が崩れ、下流の API の制限や記録を回避され、誰の操作か分からなくなります。サーバーは、自分あてのトークンだけを検証して受け入れ、下流の API には、サーバー自身の権限で(必要な最小限の範囲で)アクセスします。"
      />
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'MCP のツールで、モデルが自分で直せる失敗(引数の形式の誤り、注文が見つからない)は、どう返すのが適切ですか?',
      choices: [
        'プロトコルのエラー(例外)にして、接続を切る',
        '結果の中で isError: true にして、直し方を含む説明を返す',
        '何も返さずに、成功として扱う',
      ],
      answer: 1,
      explanation: 'モデルが読んで、直して再試行できるように、ツールの実行のエラーは isError の結果で返します。存在しないツールなど、リクエストそのものの誤りは、プロトコルのエラーです。',
    },
    {
      question: '標準入出力(stdio)で動かす MCP サーバーで、ログを出す方法として、正しいものはどれですか?',
      choices: ['console.log を使う', 'console.error など、標準エラーに出す', 'ログは出せない'],
      answer: 1,
      explanation: '標準出力は JSON-RPC のメッセージの通り道なので、書くと壊れます。ログは標準エラーに出します。',
    },
    {
      question: 'MCP サーバーで、利用者の ID を扱う方法として、最も適切なものはどれですか?',
      choices: [
        'ツールの引数に user_id を入れて、モデルに渡させる',
        '接続の認証から利用者を決め、ツールの引数には含めない',
        '全利用者で、同じ ID を使う',
      ],
      answer: 1,
      explanation: 'モデルが利用者の ID を決められると、他人の ID を指定して、他人のデータを読めてしまいます。',
    },
    {
      question: 'Claude API の MCP コネクタ(ベータ)でつなげるのは、どれですか?',
      choices: ['自分の PC の、標準入出力で動くサーバー', 'リモートの(URL で公開した)MCP サーバー', 'どちらにもつなげない'],
      answer: 1,
      explanation: 'MCP コネクタは、リモートの MCP サーバーに、Messages API から直接つなぎます。自分の PC の stdio のサーバーには、つなげません。',
    },
  ],
}

export default content
