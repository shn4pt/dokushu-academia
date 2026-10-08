import StepThrough from '../ui/StepThrough'
import TraceReading from '../ui/TraceReading'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>人が頼まなくても、ループが回る</h3>
      <p>
        L4 までは、人が依頼したときに AI が動きました。L5 では、<strong>きっかけ</strong>に応じて AI が自分から動き出します。きっかけには、次の3種類があります。
      </p>
      <ul>
        <li><strong>出来事</strong>:PR が開かれた、CI が失敗した、issue に特定のラベルが付いた。</li>
        <li><strong>時刻</strong>:毎晩の依存関係の更新、毎朝の issue の整理。</li>
        <li><strong>条件</strong>:完了の条件を満たすまで作業を続ける(18-1 の <code>/goal</code>)。</li>
      </ul>

      <h3>ループを動かす場所</h3>
      <table className="calc text">
        <thead><tr><th>仕組み</th><th>どこで動くか</th><th>向いている使い方</th></tr></thead>
        <tbody>
          <tr><td><code>/loop</code></td><td>開いている Claude Code のセッションの中。繰り返しの予定は7日で自動的に消える</td><td>作業中の PR の CI やレビューを見張る、デプロイの完了を待つ</td></tr>
          <tr><td>デスクトップの予定タスク</td><td>自分の PC(セッションを開いていなくてよい)</td><td>手元のファイルや道具が必要な定期作業</td></tr>
          <tr><td>クラウドのルーチン</td><td>Anthropic が管理するクラウド。PC を閉じていても動く(最短1時間ごと)</td><td>毎朝の整理など、確実に定期実行したい作業</td></tr>
          <tr><td>GitHub Actions</td><td>GitHub の実行環境。出来事や cron のスケジュールで起動</td><td>PR や issue の出来事への反応、チームの共有の自動化(17-1)</td></tr>
          <tr><td>Code Review(管理型のレビュー)</td><td>Anthropic のインフラ。PR ごとに複数のエージェントがレビューし、誤検知を確かめてから指摘する</td><td>すべての PR の自動レビュー(研究プレビュー。Team・Enterprise 向け)</td></tr>
        </tbody>
      </table>
      <p className="muted">
        <code>/loop</code> の繰り返しが7日で消えるのは、<strong>忘れられたループがいつまでも動き続けないように</strong>するためです。自動化を設計するときも、
        「いつ止まるか」を最初から決めておくのは良い習慣です。Code Review の指摘は重要度つきで出ますが、PR の承認やマージの阻止はしません(既存のレビューの流れは変えません)。
      </p>

      <StepThrough
        title="見る:毎晩の依存関係の更新ループ"
        description="L5 の典型的なループの例です。人が関わるのは、ルールを決めることと、ルールの外に出たときの判断です。"
        steps={[
          { label: 'きっかけ:毎晩 2:00(スケジュール)', body: 'GitHub Actions の schedule で起動\nprompt: 依存関係の更新を確認し、ルールに従って PR を作る', note: 'ルール(何を自動で進めてよいか)は、人があらかじめ書いておきます。' },
          { label: 'AI が作業する', body: '・更新のあるパッケージを調べる\n・パッチ版とマイナー版を更新し、変更履歴を読む\n・テスト・型チェック・ビルドを実行する', note: '作業は隔離した実行環境で、必要な権限だけで行います。' },
          { label: '自動の検証が判定する', body: '✓ テスト  ✓ 型  ✓ ビルド  ✓ バンドルの大きさ +0.4%(上限 5%)\n✓ 脆弱性の検査', note: '検証の基準が、人のレビューの代わりを担います(18-1)。' },
          { label: 'ルールの内側:自動で進める', body: 'パッチ版の更新で、すべての検査が通った\n→ PR を作り、自動マージの対象にする', note: '低リスクと決めた変更だけを、自動で進めます(19-1 の「レビューとプロセス」の段階3)。' },
          { label: 'ルールの外側:人に回す', body: 'メジャー版の更新(破壊的な変更あり)\n→ PR を作り、変更の要点と影響の調査を添えて、担当者に依頼する', note: '例外を人に回す「出口」を設計しておくことが、L5 の要です。' },
        ]}
      />

      <h3>人に回す条件を、先に決める</h3>
      <p>自動のループには、<strong>止まって人を呼ぶ条件</strong>を必ず組み込みます。</p>
      <ul>
        <li><strong>守られた場所に触れる</strong>:テストや検証の設定、認証・権限、お金の計算、データベースの移行、CI の設定ファイル。</li>
        <li><strong>同じ失敗を繰り返す</strong>:同じエラーで N 回失敗したら、直そうとし続けずに止まる。</li>
        <li><strong>上限に達する</strong>:ターン数、時間、費用の上限(<code>--max-turns</code>、ワークフローのタイムアウト、月の予算)。</li>
        <li><strong>取り消せない操作</strong>:本番のデータの変更、公開、削除。</li>
        <li><strong>信頼できない入力がきっかけ</strong>:外部の人の issue や PR の内容で動くときは、権限を最小にし、書き込みや外部への送信を人の承認に回す(12-2)。</li>
      </ul>

      <TraceReading
        title="トレース読解:自動の修正ループ"
        description="main ブランチの CI が失敗したら、AI が自動で原因を調べて直す、というループの記録です。仕組みとして、人の判断に回すべきだったステップを選んでください。"
        steps={[
          { kind: 'info', text: 'きっかけ:main ブランチの CI が失敗(checkout.test.ts)' },
          { kind: 'tool_use', name: 'read_ci_log', input: { job: 'test' } },
          { kind: 'tool_result', name: 'read_ci_log', content: 'checkout.test.ts › 合計金額 › Timeout 5000ms exceeded\n(過去10回の実行のうち3回失敗)' },
          { kind: 'assistant', text: '不安定なテスト(flaky test)と判断します。テストを一時的に無効化します。' },
          { kind: 'tool_use', name: 'edit_file', input: { path: 'test/checkout.test.ts', change: "it('合計金額', ...) を it.skip('合計金額', ...) に変更" } },
          { kind: 'tool_use', name: 'create_pr', input: { title: '不安定なテストを無効化', auto_merge: true } },
          { kind: 'tool_result', name: 'create_pr', content: 'CI: すべて成功 → 自動マージされました' },
        ]}
        answer={4}
        explanation="ステップ5で、決済の合計金額のテストを無効化しています。テストの無効化は「守られた場所に触れる」変更で、リスクの高いお金の計算の検証が丸ごと消えます。タイムアウトの原因は、テストの不安定さではなく、本当の性能の劣化かもしれません。テストの変更・無効化は自動マージの対象から外し、原因の調査を添えて人に回すべきでした。また、テストを1つ消せば CI が通ってしまうため、ステップ7の「CI がすべて成功」は安全の証拠になっていません。"
      />
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: '自動のループに組み込むべき「人を呼ぶ条件」として、適切でないものはどれですか?',
      choices: [
        'テストや認証の設定など、守られた場所に触れる',
        '同じ失敗を何度も繰り返す',
        'lint の自動修正で、すべての検査が通った',
      ],
      answer: 2,
      explanation: '低リスクで、検証が通った変更は自動で進めてよい対象です。守られた場所、繰り返す失敗、上限、取り消せない操作は人に回します。',
    },
    {
      question: '開いているセッションがなくても、PC を閉じていても定期的に動かしたい作業に向くのはどれですか?',
      choices: ['/loop', 'クラウドのルーチンや GitHub Actions のスケジュール', '手元のターミナルで待つ'],
      answer: 1,
      explanation: '/loop は開いているセッションの中で動きます。PC やセッションに依存しない定期実行には、クラウドのルーチンや GitHub Actions を使います。',
    },
    {
      question: '自動の修正ループが、失敗するテストを無効化して CI を通したとき、何が問題ですか?',
      choices: [
        '問題はない。CI が通っている',
        '検証そのものを消しており、CI の成功が安全の証拠にならない',
        'PR のタイトルが短い',
      ],
      answer: 1,
      explanation: 'テストの無効化は検証の基準を変える操作です。人の判断に回す対象にします。',
    },
  ],
}

export default content
