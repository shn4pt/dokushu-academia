import CodeOrder from '../ui/CodeOrder'
import ToolLoopPlayground from '../ui/ToolLoopPlayground'
import { supportTools } from '../ui/mockTools'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>ループの形</h3>
      <p>
        ツールを使う会話は、1回の呼び出しでは終わりません。モデルが <code>tool_use</code> を返す限り、
        <strong>ツールを実行して結果を返し、もう一度呼ぶ</strong>を繰り返します。<code>stop_reason</code> が
        <code>end_turn</code> になったら、それが最終的な回答です。
      </p>
      <pre>{`const MAX_STEPS = 10;
const messages: Anthropic.MessageParam[] = [{ role: "user", content: input }];

for (let step = 0; step < MAX_STEPS; step++) {
  const response = await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    tools,
    messages,
  });

  // 途中で切れた・断られたときは、ツールを実行しない
  if (response.stop_reason === "max_tokens" || response.stop_reason === "refusal") {
    throw new Error(\`中断: \${response.stop_reason}\`);
  }
  // 応答の content は、テキストだけでなく全体をそのまま履歴に加える
  messages.push({ role: "assistant", content: response.content });
  if (response.stop_reason !== "tool_use") return response; // end_turn: 完了

  // 1回の応答に複数の tool_use があれば、すべて実行する
  const results: Anthropic.ToolResultBlockParam[] = [];
  for (const block of response.content) {
    if (block.type !== "tool_use") continue;
    try {
      const output = await runTool(block.name, block.input); // 中で引数を検証する
      results.push({ type: "tool_result", tool_use_id: block.id, content: output });
    } catch (e) {
      // 失敗も結果として返すと、モデルが別の方法を考えられる
      results.push({ type: "tool_result", tool_use_id: block.id, content: String(e), is_error: true });
    }
  }
  // 結果は、まとめて1つの user メッセージで返す
  messages.push({ role: "user", content: results });
}
throw new Error("ステップ数の上限に達しました");`}</pre>

      <h3>守るべきルール</h3>
      <ol>
        <li><strong>応答は丸ごと履歴に加える</strong>。<code>tool_use</code> や思考のブロックが欠けると、次の呼び出しで対応が取れなくなります。</li>
        <li><strong><code>tool_use_id</code> を必ず対応させる</strong>。どの呼び出しへの結果かを、ID で示します。</li>
        <li>
          <strong>並列の呼び出しは、結果を1つのメッセージにまとめて返す</strong>。1回の応答に複数の <code>tool_use</code> が含まれることがあります
          (たとえば注文状況と FAQ を同時に調べる)。結果を別々のメッセージに分けて返すと、並列の呼び出しが使われにくくなります。
        </li>
        <li>
          <strong>失敗は <code>is_error: true</code> の結果として返す</strong>。黙って捨てたり、ループごと止めたりせず、何が悪かったかを
          伝えると、モデルが引数を直したり、別の手段を選んだりできます。
        </li>
        <li><strong>引数を検証してから実行する</strong>(10-1)。</li>
        <li><strong>回数の上限を設ける</strong>。モデルが同じ呼び出しを繰り返すなどの暴走を止める最後の安全装置です。</li>
      </ol>

      <ToolLoopPlayground
        title="試す:ツール呼び出しループ"
        description="注文の確認と FAQ 検索ができるサポート用の設定です。実行すると、モデルがどのツールを、どの順で、どんな引数で呼んだかが、すべて表示されます。"
        system="あなたはネットショップのサポート担当です。ツールで調べた事実だけをもとに、丁寧かつ簡潔に答えてください。分からないことは推測せず、そう伝えてください。"
        prompt="注文 A-1002 はいつ届きますか?あと、返品の条件も教えてください。"
        tools={supportTools}
        sample={[
          { kind: 'user', text: '注文 A-1002 はいつ届きますか?あと、返品の条件も教えてください。' },
          { kind: 'assistant', text: '注文の状況と、返品の条件を確認します。' },
          { kind: 'tool_use', name: 'get_order_status', input: { order_id: 'A-1002' } },
          { kind: 'tool_use', name: 'search_faq', input: { query: '返品の条件' } },
          { kind: 'tool_result', name: 'get_order_status', content: '{"order_id":"A-1002","status":"倉庫で準備中","item":"USB-C 充電器","eta":"10月14日(予定)"}' },
          { kind: 'tool_result', name: 'search_faq', content: '【返品・交換の条件】商品到着後14日以内で、未使用・付属品がそろっている場合に返品できます。初期不良は送料当社負担で交換します。' },
          { kind: 'assistant', text: 'ご注文 A-1002(USB-C 充電器)は現在倉庫で準備中で、10月14日にお届けの予定です。\n\n返品は、商品到着後14日以内で、未使用かつ付属品がそろっている場合に承ります。初期不良の場合は、送料当社負担で交換いたします。' },
          { kind: 'info', text: '完了しました(stop_reason: end_turn)。' },
        ]}
      />
      <p className="muted">
        2つのツールが1回の応答で同時に呼ばれ、結果がまとめて返されている点に注目してください。注文番号を存在しないもの(A-9999)にしたり、
        形式を崩したりすると、<code>is_error</code> の結果を受けてモデルがどう対応するかも確かめられます。
      </p>

      <h3>SDK のツールランナー</h3>
      <p>
        上のループは、TypeScript SDK の<strong>ツールランナー</strong>(ベータ)に任せることもできます。Zod でスキーマを書くと、
        引数の検証、ツールの実行、結果の返却、繰り返しを SDK が行います。承認やログなどの処理も、ループの各回に差し込めます。
      </p>
      <pre>{`import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const getOrderStatus = betaZodTool({
  name: "get_order_status",
  description: "注文番号から注文の状況を調べる。利用者が注文の状況や届く日を尋ねたときに使う。",
  inputSchema: z.object({ order_id: z.string().describe("注文番号。A-1234 の形式") }),
  run: async ({ order_id }) => JSON.stringify(await db.findOrder(order_id)),
});

const finalMessage = await client.beta.messages.toolRunner({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  tools: [getOrderStatus],
  messages: [{ role: "user", content: input }],
});`}</pre>
      <p>
        仕組みを理解するために、まずは手でループを書いてみるのがおすすめです。理解したうえで、実務ではランナーを使うと、
        書き漏れ(結果をまとめ忘れる、検証を忘れる)を防げます。
      </p>

      <CodeOrder
        title="並べ替え:ループの1回分"
        description="ツール呼び出しループの1回分の処理です。正しい順番に並べ替えてください。"
        lines={[
          'const response = await client.messages.create({ model, max_tokens, tools, messages });',
          'messages.push({ role: "assistant", content: response.content });',
          'if (response.stop_reason !== "tool_use") return response;',
          'const results = await runAllTools(response.content);',
          'messages.push({ role: "user", content: results });',
        ]}
        explanation="応答を受け取ったら、まず丸ごと履歴に加えます。ツールを呼ぶ必要がなければ完了です。呼ぶ場合は、すべてのツールを実行し、結果をまとめて1つの user メッセージとして加え、次の回に進みます。"
      />
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '1回の応答に tool_use が2つ含まれていました。結果はどう返しますか?',
      choices: [
        '2つの結果を、1つの user メッセージにまとめて返す',
        '1つずつ別の user メッセージで返す',
        '最初の1つだけ実行して返す',
      ],
      answer: 0,
      explanation: '並列の呼び出しの結果は、まとめて1つのメッセージで返します。',
    },
    {
      question: 'ツールの実行に失敗したとき、適切な対応はどれですか?',
      choices: [
        'その tool_use を無視して次に進む',
        'is_error: true の tool_result で、失敗の内容を返す',
        'ループ全体をすぐに例外で止める',
      ],
      answer: 1,
      explanation: '失敗の内容を伝えると、モデルが引数を直したり、別の方法を選んだりできます。',
    },
    {
      question: 'ループに回数の上限を設ける理由はどれですか?',
      choices: [
        'API の仕様で、10回までしか呼べないから',
        'モデルが同じ呼び出しを繰り返すなどの暴走を止めるため',
        '回数が多いほど精度が下がるから',
      ],
      answer: 1,
      explanation: '想定外の繰り返しから、費用と時間を守る最後の安全装置です。',
    },
  ],
}

export default content
