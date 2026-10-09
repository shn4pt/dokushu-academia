import ToolLoopPlayground from '../ui/ToolLoopPlayground'
import { supportTools } from '../ui/mockTools'
import toolsSource from '../capstone/tools.ts?raw'
import agentSource from '../capstone/agent.ts?raw'
import promptSource from '../capstone/agentPrompt.ts?raw'
import { SYSTEM_PROMPT } from '../capstone/agentPrompt'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>実装の全体像</h3>
      <p>
        13-1 の設計を、サーバー側の TypeScript のコードにします。主なファイルは2つです(system プロンプトは別のファイルに分けています)。ここに載せているコードは、このサイトのビルドのたびに
        公式 SDK の型で型チェックしているもので、SDK の仕様とずれていないことを確かめてあります。さらに、API への通信を台本どおりの応答に差し替えて、ループ、承認待ちと再開、止める条件、ツールの検証の動作も、自動のテストで確かめています(実際の API には接続していません)。
      </p>
      <table className="calc text">
        <tbody>
          <tr><td><code>tools.ts</code></td><td>ツールの定義、引数の検証(Zod)、ツールの実行。データベースや FAQ の検索はアプリ側で実装する</td></tr>
          <tr><td><code>agent.ts</code></td><td>エージェントのループ、承認待ちと再開、止める条件、記録</td></tr>
          <tr><td><code>agentPrompt.ts</code></td><td>system プロンプト(このページのプレイグラウンドでも同じものを使う)</td></tr>
        </tbody>
      </table>

      <h3>tools.ts:ツール</h3>
      <p>注目する点:</p>
      <ul>
        <li>引数は、実行前に Zod で検証し、失敗したら直し方を含むエラーの結果を返す(10-2、10-3)。</li>
        <li>注文は <code>session.userId</code>(ログイン情報)で絞る。モデルには利用者 ID を渡させない(12-2)。</li>
        <li>チケットの作成には <code>tool_use</code> の ID を重複防止のキーとして渡す(10-3)。</li>
        <li>FAQ の結果は件数と文字数に上限を付ける(11-3)。</li>
      </ul>
      <details>
        <summary>tools.ts の全文を見る</summary>
        <pre className="code-file">{toolsSource}</pre>
      </details>

      <h3>agent.ts:ループ</h3>
      <p>注目する点:</p>
      <ul>
        <li>system はキャッシュの対象にし、毎回の入力の料金と待ち時間を減らす(11-3)。</li>
        <li><code>fallbacks: "default"</code> で、安全上の拒否に備える(9-2)。</li>
        <li>応答は丸ごと履歴に加え、<code>refusal</code> と <code>max_tokens</code> ではツールを実行しない(10-2)。</li>
        <li>承認が必要な操作では、実行せずに <code>needs_approval</code> を返して止まり、<code>resumeAfterApproval</code> で再開する(11-2)。</li>
        <li>回数とトークンの上限で止める(11-2)。呼び出しごとに使用量を記録する(12-3)。</li>
      </ul>
      <details>
        <summary>agentPrompt.ts(system プロンプト)を見る</summary>
        <pre className="code-file">{promptSource}</pre>
      </details>
      <details>
        <summary>agent.ts の全文を見る</summary>
        <pre className="code-file">{agentSource}</pre>
      </details>

      <h3>サーバーから使う</h3>
      <p>Web フレームワークに依存しない形で、使い方の流れを示します(状態の保存先は、セッションやデータベースなど、アプリに合わせて選びます)。</p>
      <pre>{`// POST /chat  { message }
const session = { userId: currentUser.id, db, faq };          // ログイン情報から作る
const state = loadState(currentUser.id) ?? newState();
const result = await runAgentTurn(session, state, body.message);
saveState(currentUser.id, result.state);
// result.status が "needs_approval" なら、画面に確認を出す
return result.status === "needs_approval"
  ? { status: "needs_approval", action: result.toolUse.name, input: result.toolUse.input }
  : { status: result.status, text: result.status === "done" ? result.text : "担当者におつなぎします。" };

// POST /chat/approve  { approved }
const resumed = await resumeAfterApproval(session, loadState(currentUser.id)!, body.approved);`}</pre>

      <h3>このサイトで動かしてみる</h3>
      <p>
        下のプレイグラウンドは、同じ system プロンプトと同じツールの設計で、ブラウザの中の模擬データを使って動きます。
        評価セット(13-3)に入れたい質問を、いくつか試してみましょう。
      </p>
      <ToolLoopPlayground
        title="試す:完成したサポートエージェント"
        description="注文の確認、FAQ の検索、承認つきのチケット作成ができます。範囲外の依頼(返金して、など)や、FAQ にない質問も試してみましょう。"
        system={SYSTEM_PROMPT}
        prompt="返品したいのですが、どうすればいいですか?注文は A-1001 です。"
        tools={supportTools}
        maxSteps={8}
        sample={[
          { kind: 'user', text: '返品したいのですが、どうすればいいですか?注文は A-1001 です。' },
          { kind: 'tool_use', name: 'get_order_status', input: { order_id: 'A-1001' } },
          { kind: 'tool_use', name: 'search_faq', input: { query: '返品の方法' } },
          { kind: 'tool_result', name: 'get_order_status', content: '{"order_id":"A-1001","status":"発送済み","item":"ワイヤレスイヤホン","carrier":"ヤマト運輸","eta":"10月10日"}' },
          { kind: 'tool_result', name: 'search_faq', content: '【返品・交換の条件】商品到着後14日以内で、未使用・付属品がそろっている場合に返品できます。初期不良は送料当社負担で交換します。' },
          { kind: 'assistant', text: 'ご注文 A-1001(ワイヤレスイヤホン)は発送済みで、10月10日にお届けの予定です。\n\n返品は、商品の到着後14日以内で、未使用かつ付属品がそろっている場合に承ります。初期不良の場合は、送料当社負担で交換いたします。返品の具体的なお手続きの方法は FAQ に記載がないため、ご希望でしたら担当者への問い合わせをお作りします。' },
          { kind: 'info', text: '完了しました(stop_reason: end_turn)。' },
        ]}
      />
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'agent.ts で、stop_reason が max_tokens のときにツールを実行しない理由はどれですか?',
      choices: [
        'ツールの引数が途中で切れていて、誤った内容で実行するおそれがあるから',
        'max_tokens のときは料金がかからないから',
        'API の仕様でツールを実行できないから',
      ],
      answer: 0,
      explanation: '途中で切れた引数でも形式上は解析できてしまうことがあるため、実行せずに止めます。',
    },
    {
      question: 'チケットの作成で tool_use の ID を重複防止のキーとして渡す目的はどれですか?',
      choices: [
        'チケットの番号を見やすくするため',
        '再試行などで同じ呼び出しが二度届いても、チケットを1つにするため',
        'モデルの精度を上げるため',
      ],
      answer: 1,
      explanation: '同じ操作が二度実行されても、結果が1回分になるようにする工夫です。',
    },
    {
      question: '承認が必要なとき、runAgentTurn は何を返しますか?',
      choices: [
        'チケットを作成した結果',
        'status が needs_approval の結果(実行はまだしていない)',
        '例外',
      ],
      answer: 1,
      explanation: 'ループを止めて承認待ちを返し、resumeAfterApproval で利用者の判断を受けて再開します。',
    },
  ],
}

export default content
