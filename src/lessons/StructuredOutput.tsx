import ApiPlayground from '../ui/ApiPlayground'
import CodeOrder from '../ui/CodeOrder'
import type { LessonContent } from './types'

const ticketSchema = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: ['billing', 'account', 'bug', 'feature_request', 'other'] },
    urgency: { type: 'string', enum: ['high', 'medium', 'low'] },
    summary: { type: 'string', description: '担当者向けの1文の要約' },
    needs_human: { type: 'boolean', description: '人間の担当者の判断が必要か' },
  },
  required: ['category', 'urgency', 'summary', 'needs_human'],
  additionalProperties: false,
}

function Body() {
  return (
    <>
      <h3>プログラムで扱える形で受け取る</h3>
      <p>
        エージェントや業務システムでは、モデルの出力を<strong>人が読むのではなく、プログラムが読む</strong>場面が増えます。
        分類して振り分ける、項目を抜き出してデータベースに入れる、次の処理の条件にする、などです。
        自由な文章を正規表現で切り出すのは壊れやすいので、最初から決まった構造で受け取ります。
      </p>

      <h3>3つの方法</h3>
      <table className="calc text">
        <thead><tr><th>方法</th><th>形式の保証</th><th>向いている場面</th></tr></thead>
        <tbody>
          <tr><td>プロンプトで「JSONで」と頼む</td><td>なし(崩れることがある)</td><td>試作、人が読む場合</td></tr>
          <tr><td>構造化出力(<code>output_config.format</code>)</td><td>スキーマに沿うよう生成が制約される</td><td>抽出・分類など、応答そのものを JSON にしたい</td></tr>
          <tr><td>strict なツール(<code>strict: true</code>)</td><td>ツールの引数がスキーマに沿う</td><td>ツール呼び出しの引数(Stage 10)</td></tr>
        </tbody>
      </table>

      <h3>JSON Schema で形式を指定する</h3>
      <p>
        <code>output_config.format</code> に <code>type: "json_schema"</code> と JSON Schema を渡します。
        モデルの生成そのものがスキーマに沿うよう制約されるため、応答のテキストは JSON として解析できます。
      </p>
      <pre>{`const response = await client.messages.create({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  messages: [{ role: "user", content: \`次の問い合わせを分類して: \${inquiry}\` }],
  output_config: {
    format: {
      type: "json_schema",
      schema: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["billing", "account", "bug", "feature_request", "other"] },
          urgency: { type: "string", enum: ["high", "medium", "low"] },
          summary: { type: "string" },
          needs_human: { type: "boolean" },
        },
        required: ["category", "urgency", "summary", "needs_human"],
        additionalProperties: false, // 必須
      },
    },
  },
});

if (response.stop_reason !== "end_turn") throw new Error(\`想定外の停止: \${response.stop_reason}\`);
const text = response.content.find((b) => b.type === "text");
const ticket = JSON.parse(text!.text);`}</pre>

      <ApiPlayground
        title="試す:問い合わせを分類して JSON で受け取る"
        description="応答が、指定したスキーマどおりの JSON になることを確かめましょう。"
        prompt={'次の問い合わせを分類してください。\n\n先月から有料プランに切り替えたのですが、今月の請求が2回来ています。片方は返金してもらえますか?'}
        jsonSchema={ticketSchema}
        sample={{
          text: '{"category":"billing","urgency":"high","summary":"有料プランへの切り替え後、今月分が二重に請求されており、片方の返金を希望している。","needs_human":true}',
          stopReason: 'end_turn',
          usage: { input: 312, output: 88 },
        }}
      />

      <h3>SDK の補助関数で、型付きで受け取る</h3>
      <p>
        TypeScript SDK の <code>messages.parse()</code> と Zod のスキーマを組み合わせると、スキーマの生成、送信、応答の検証までをまとめて行い、
        型の付いた結果(<code>parsed_output</code>)を受け取れます。Zod を使わない場合は、JSON Schema を渡す
        <code>jsonSchemaOutputFormat()</code> もあります。
      </p>
      <pre>{`import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const Ticket = z.object({
  category: z.enum(["billing", "account", "bug", "feature_request", "other"]),
  urgency: z.enum(["high", "medium", "low"]),
  summary: z.string(),
  needs_human: z.boolean(),
});

const response = await client.messages.parse({
  model: "claude-opus-5-5",
  max_tokens: 16000,
  messages: [{ role: "user", content: inquiry }],
  output_config: { format: zodOutputFormat(Ticket) },
});

const ticket = response.parsed_output; // 解析・検証に失敗したときは null
if (!ticket) throw new Error(\`解析できませんでした: \${response.stop_reason}\`);`}</pre>

      <h3>スキーマの制約</h3>
      <ul>
        <li>オブジェクトには <code>additionalProperties: false</code> が必須。</li>
        <li>使える:基本の型、<code>enum</code>、<code>const</code>、<code>anyOf</code>、<code>required</code>、文字列の <code>format</code>(<code>date</code>、<code>email</code>、<code>uuid</code> など)。</li>
        <li>使えない:数値の範囲(<code>minimum</code> など)、文字列の長さ(<code>minLength</code> など)、再帰するスキーマ。使うとエラーになる(SDK の補助関数は、一部を説明文に変換する)。</li>
      </ul>
      <p>
        つまり、「0〜100 の整数」「50字以内」のような<strong>業務上のルールは、受け取ったあとに自分のコードで検証</strong>します。
      </p>

      <h3>失敗に備える</h3>
      <p>形式が制約されていても、次の場合はスキーマどおりにならないことがあります。</p>
      <ul>
        <li><code>stop_reason: "max_tokens"</code>:途中で切れて、JSON が閉じていない。</li>
        <li><code>stop_reason: "refusal"</code>:断りの文が優先される。</li>
      </ul>
      <p>
        そのため、<strong><code>stop_reason</code> を確認してから解析</strong>し、解析の失敗も想定しておきます。
        再試行する場合は回数の上限を決め、失敗した入力は記録して後で調べられるようにします。
      </p>

      <CodeOrder
        title="並べ替え:構造化出力を安全に使う"
        description="分類結果を受け取り、システムに登録するまでの処理です。正しい順番に並べ替えてください。"
        lines={[
          'const response = await client.messages.create({ ...params, output_config: { format } });',
          'if (response.stop_reason !== "end_turn") return retryOrLog(response);',
          'const ticket = JSON.parse(textOf(response));',
          'if (!isValidBusinessRule(ticket)) return retryOrLog(response);',
          'await saveTicket(ticket);',
        ]}
        explanation="送信して応答を受け取り、まず stop_reason を確かめます。JSON として解析したあと、スキーマでは表せない業務ルールを自分で検証し、問題がなければ登録します。"
      />
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '構造化出力の JSON Schema で、オブジェクトに必須の指定はどれですか?',
      choices: ['additionalProperties: false', 'minLength: 1', 'type: "any"'],
      answer: 0,
      explanation: 'オブジェクトには additionalProperties: false を指定する必要があります。',
    },
    {
      question: '構造化出力を使っても、応答がスキーマどおりにならない可能性があるのはどんなときですか?',
      choices: [
        'stop_reason が max_tokens や refusal のとき',
        'stop_reason が end_turn のとき',
        'system プロンプトがあるとき',
      ],
      answer: 0,
      explanation: '上限で切れた場合や、断りの文が優先された場合は、スキーマに沿わないことがあります。',
    },
    {
      question: '「スコアは 0〜100 の整数」というルールはどう扱いますか?',
      choices: [
        'スキーマの minimum / maximum で指定すれば保証される',
        'スキーマでは指定できないので、受け取ったあとにコードで検証する',
        'ルールは不要なので扱わない',
      ],
      answer: 1,
      explanation: '数値の範囲などはスキーマで指定できないため、業務ルールとして自分で検証します。',
    },
  ],
}

export default content
