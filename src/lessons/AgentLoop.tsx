import ToolLoopPlayground from '../ui/ToolLoopPlayground'
import TraceReading from '../ui/TraceReading'
import { supportTools } from '../ui/mockTools'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>エージェントは「ループ+判断」</h3>
      <p>
        エージェントの中身は、10-2 のツール呼び出しループと同じです。違いは、扱う課題の自由度が高く、ループが長くなりやすいことです。
        そのため、<strong>どこで止めるか</strong>、<strong>何を人に確認するか</strong>、<strong>途中経過をどう見せるか</strong>を、
        あらかじめ設計しておく必要があります。
      </p>
      <ol>
        <li><strong>目的を受け取る</strong>:何をすれば完了かを、できるだけ最初に具体的に伝える。</li>
        <li><strong>考えて行動する</strong>:モデルが次の一手(ツール呼び出し)を決める。</li>
        <li><strong>結果を観察する</strong>:ツールの結果を見て、計画を修正する。</li>
        <li><strong>止まる</strong>:完了、または止める条件に当たったら終える。</li>
      </ol>

      <h3>止める条件を、複数用意する</h3>
      <table className="calc text">
        <thead><tr><th>条件</th><th>例</th></tr></thead>
        <tbody>
          <tr><td>完了</td><td><code>stop_reason: "end_turn"</code>(ツールを呼ばずに回答した)</td></tr>
          <tr><td>回数の上限</td><td>ツール呼び出しループを最大20回まで</td></tr>
          <tr><td>予算の上限</td><td>合計トークン数や費用が上限を超えたら止める</td></tr>
          <tr><td>時間の上限</td><td>一定時間を超えたら止めて、途中経過を報告する</td></tr>
          <tr><td>繰り返しの検出</td><td>同じツールを同じ引数で何度も呼んでいたら止める</td></tr>
          <tr><td>失敗の連続</td><td>エラーが続いたら、人に引き継ぐ</td></tr>
        </tbody>
      </table>
      <p className="muted">
        Claude API には、エージェントのループ全体のトークン予算をモデル自身に伝え、予算内で区切りよく終えるようにする機能(task budget、ベータ)もあります。
        これは目安をモデルに伝えるもので、アプリ側の上限の代わりにはなりません。
      </p>

      <TraceReading
        title="トレース読解:止まらないエージェント"
        description="FAQ を調べて答えるエージェントの実行ログです。止める条件を入れていれば、ここで止められたはず、というステップを選んでください。"
        steps={[
          { kind: 'user', text: '海外への配送はできますか?' },
          { kind: 'tool_use', name: 'search_faq', input: { query: '海外配送' } },
          { kind: 'tool_result', name: 'search_faq', content: '該当する FAQ はありませんでした。' },
          { kind: 'tool_use', name: 'search_faq', input: { query: '海外配送' } },
          { kind: 'tool_result', name: 'search_faq', content: '該当する FAQ はありませんでした。' },
          { kind: 'tool_use', name: 'search_faq', input: { query: '海外配送' } },
          { kind: 'tool_result', name: 'search_faq', content: '該当する FAQ はありませんでした。' },
          { kind: 'info', text: '(このあとも同じ呼び出しが続き、回数の上限で止まった)' },
        ]}
        answer={3}
        explanation="ステップ4で、直前と同じツールを同じ引数で呼んでいます。結果が変わらない呼び出しの繰り返しは、ほぼ確実に無駄です。繰り返しを検出したら止めるか、「同じ検索はすでに結果なしでした。別の方法を検討するか、分からないと伝えてください」と結果に添えて返すと、無駄な呼び出しと費用を防げます。"
      />

      <h3>取り消せない操作の前に、人に確認する</h3>
      <p>
        エージェントは、誤った判断のまま行動することがあります。チケットの作成、メールの送信、データの削除、支払いなど、
        <strong>外部に影響し、取り消しにくい操作</strong>の前には、利用者の承認を挟みます。承認されなかったときは、その旨を
        <code>tool_result</code> で返せば、モデルは別の方法を提案できます。
      </p>
      <ToolLoopPlayground
        title="試す:承認つきのエージェント"
        description="問い合わせチケットの作成(create_support_ticket)だけは、実行前にあなたの承認を求めます。許可と拒否の両方を試して、モデルの対応の違いを見てみましょう。"
        system="あなたはネットショップのサポート担当です。ツールで事実を確認してから答えてください。担当者の対応が必要な場合だけ、問い合わせチケットを作成してください。"
        prompt="注文 A-1003 がキャンセルになっていますが、自分ではキャンセルしていません。調べて、担当の方に連絡してください。"
        tools={supportTools}
        maxSteps={8}
        sample={[
          { kind: 'user', text: '注文 A-1003 がキャンセルになっていますが、自分ではキャンセルしていません。調べて、担当の方に連絡してください。' },
          { kind: 'assistant', text: 'まず注文の状況を確認します。' },
          { kind: 'tool_use', name: 'get_order_status', input: { order_id: 'A-1003' } },
          { kind: 'tool_result', name: 'get_order_status', content: '{"order_id":"A-1003","status":"キャンセル済み","item":"モバイルバッテリー"}' },
          { kind: 'assistant', text: 'ご注文はキャンセル済みになっていました。ご本人の操作ではないとのことなので、担当者への問い合わせを作成します。' },
          { kind: 'tool_use', name: 'create_support_ticket', input: { summary: '注文 A-1003 が、利用者の操作なしにキャンセル済みになっている。原因の調査と、注文の復旧可否の確認を依頼。', priority: 'high', order_id: 'A-1003' } },
          { kind: 'approval', name: 'create_support_ticket', decision: 'approved' },
          { kind: 'tool_result', name: 'create_support_ticket', content: '{"ticket_id":"T-1001","status":"created"}' },
          { kind: 'assistant', text: 'ご注文 A-1003(モバイルバッテリー)は、キャンセル済みになっていました。担当者への問い合わせ(番号 T-1001)を作成しましたので、原因と、注文を元に戻せるかを確認のうえ、ご連絡いたします。' },
          { kind: 'info', text: '完了しました(stop_reason: end_turn)。' },
        ]}
      />

      <h3>途中経過を見せる</h3>
      <ul>
        <li>エージェントが今何をしているか(「注文を確認しています」)を表示すると、利用者は待ちやすく、誤りにも早く気づける。</li>
        <li>実行ログ(どのツールを、どの引数で呼び、何が返ったか)を残す。問題の調査と、品質の改善(12-1)に欠かせない。</li>
      </ul>

      <h3>作り方の選択肢</h3>
      <table className="calc text">
        <thead><tr><th>方法</th><th>書くもの</th><th>向いている場面</th></tr></thead>
        <tbody>
          <tr><td>ループを手で書く(10-2)</td><td>ループ全体</td><td>制御の流れをすべて自分で持ちたい</td></tr>
          <tr><td>SDK のツールランナー(ベータ)</td><td>ツールの関数</td><td>自前のツールを使うエージェントの多く。承認を挟むなど細かな制御が中心なら、手で書くループが向く</td></tr>
          <tr><td>Claude Agent SDK</td><td>指示と設定</td><td>ファイル操作やコマンド実行などの組み込みツール付きで、Claude Code と同じ仕組みを自分の環境で動かしたい</td></tr>
          <tr><td>Managed Agents(ベータ)</td><td>エージェントの設定</td><td>ループの実行と作業用の環境を Anthropic 側に任せたい</td></tr>
        </tbody>
      </table>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'エージェントに「止める条件」を複数用意する理由はどれですか?',
      choices: [
        'API の制限で、1種類しか使えないから',
        '完了以外にも、繰り返しや予算超過などで、無駄な実行や費用の増加が起きうるから',
        'モデルの精度が上がるから',
      ],
      answer: 1,
      explanation: '暴走や同じ呼び出しの繰り返しを、早めに止めるための安全装置です。',
    },
    {
      question: '利用者の承認を挟むべき操作として、最も適切なものはどれですか?',
      choices: ['FAQ の検索', '注文状況の参照', 'メールの送信や、データの削除'],
      answer: 2,
      explanation: '外部に影響し、取り消しにくい操作の前には、承認を挟みます。',
    },
    {
      question: '利用者が操作を拒否したとき、エージェント側の適切な処理はどれですか?',
      choices: [
        '拒否を無視して実行する',
        '拒否されたことを tool_result で返し、モデルに別の方法を考えさせる',
        'エラーとしてアプリを終了する',
      ],
      answer: 1,
      explanation: '拒否も結果として返すと、モデルが代わりの提案や説明をできます。',
    },
  ],
}

export default content
