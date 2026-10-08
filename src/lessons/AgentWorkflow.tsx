import { Link } from 'react-router-dom'
import StepThrough from '../ui/StepThrough'
import TraceReading from '../ui/TraceReading'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>エージェント型(L3)の基本の流れ</h3>
      <p>
        L3 では、AI がコードを調べ、複数のファイルを編集し、テストを実行します。人の仕事は、<strong>何をするかを伝え、計画と結果を確かめる</strong>ことです。
        Claude Code の公式のベストプラクティスは、次の4つの段階に分けることを勧めています。
      </p>
      <ol>
        <li><strong>調べる</strong>:関係するコードを読ませ、現状を理解させる。まだ変更はさせない。</li>
        <li><strong>計画する</strong>:どのファイルをどう変えるかの計画を出させ、人が確認して直す。</li>
        <li><strong>実装する</strong>:計画に沿って変更させ、テストを書いて実行させる。</li>
        <li><strong>コミットする</strong>:説明の付いたコミットと、変更の提案(PR)を作らせる。</li>
      </ol>
      <p>
        Claude Code では、調べる・計画するの段階に<strong>plan モード</strong>を使います。<code>Shift+Tab</code> でモードを切り替えるか、
        <code>claude --permission-mode plan</code> で起動すると、AI はファイルを読んで答えますが、変更はしません。出てきた計画は <code>Ctrl+G</code> でエディタに開き、直接書き直せます。
      </p>
      <p className="muted">
        計画には手間もかかります。誤字の修正やログを1行足すような、<strong>差分を1文で説明できる作業</strong>なら、計画を省いて直接頼みます。
        計画が役立つのは、やり方に迷うとき、複数のファイルにまたがるとき、よく知らないコードを変えるときです。
      </p>

      <StepThrough
        title="見る:機能を1つ追加するセッション"
        description="このアプリの「しおり機能」(前回の続きから再開する機能)を追加したときの流れを、段階ごとに整理した例です。"
        steps={[
          {
            label: '調べる(plan モード)',
            body: 'レッスンページの構成と、進捗の保存(src/progress.ts)のしくみを読んで。\nスクロール位置を覚える方法として、何が使えそうかも調べて。',
            note: 'まだ何も変えさせません。どこに何があるかを把握させます。',
          },
          {
            label: '計画する(plan モード)',
            body: '計画:\n1. 進捗の状態に reading(最も先まで読んだ見出し)を追加する\n2. 古い保存データも読めるよう、読み込み時の補正を直す\n3. スクロールに合わせて、通過した見出しを記録する\n4. ホームの「続きから学ぶ」から、その見出しまで移動する\n5. エクスポート・インポート・リセットに対応する\n6. Playwright のテストを追加する',
            note: '人が確認して条件を足します。たとえば「位置は先へ進むときだけ更新する」「完了にしたら、しおりを消す」「検索結果から開いたときは、検索の移動を優先する」など。',
          },
          {
            label: '実装する',
            body: '計画どおりに実装して。テストを書いて実行し、失敗したら直して。\n古い形式の保存データを読み込むテストも入れて。',
            note: '確かめる手段(テスト)を、依頼の中で指定します。',
          },
          {
            label: '証拠を見る',
            body: '$ npx playwright test bookmark.spec.ts\n  5 passed\n$ npm run build\n  ✓ built',
            note: '「できました」という報告ではなく、実行したコマンドと結果を見て判断します。',
          },
          {
            label: '差分をレビューして、コミットする',
            body: '差分を読み、説明できない部分がないかを確かめてから、コミットを頼む。',
            note: '最後に責任を持つのは人です(15-3)。',
          },
        ]}
      />

      <h3>確かめる手段を渡す</h3>
      <p>
        AI は、作業が<strong>終わったように見えた</strong>ところで止まります。実行できる確認の手段がないと、「終わったように見える」以外の合図がなく、
        誤りに気づく役目は、すべて人に回ってきます。テスト、ビルド、型チェック、画面のスクリーンショットなど、<strong>成功か失敗かがはっきり出るもの</strong>を渡すと、
        AI は「実行して、結果を読み、直す」を自分で繰り返せます。
      </p>
      <table className="calc text">
        <thead><tr><th>あいまいな頼み方</th><th>確かめる手段を渡した頼み方</th></tr></thead>
        <tbody>
          <tr><td>メールアドレスを検証する関数を書いて</td><td>validateEmail を書いて。user@example.com は true、invalid は false、user@.com は false。実装したらテストを実行して</td></tr>
          <tr><td>ビルドが失敗するので直して</td><td>ビルドがこのエラーで失敗する:(エラーを貼る)。原因を直して、ビルドが通ることを確かめて。エラーを握りつぶさないで</td></tr>
          <tr><td>画面をいい感じにして</td><td>(デザインの画像を貼る)このとおりに実装して。結果のスクリーンショットを撮って比べ、違いを直して</td></tr>
        </tbody>
      </table>

      <TraceReading
        title="トレース読解:人が止めるべきだったのは?"
        description="「ページ分けのバグを直して、テストを通して」と頼んだときの、コーディングエージェントの実行ログです。人が介入すべきだったステップを選んでください。"
        steps={[
          { kind: 'user', text: 'getPage で、2ページ目の先頭が1ページ目の最後と重複するバグを直して。テストも通して。' },
          { kind: 'tool_use', name: 'read_file', input: { path: 'src/paging.ts' } },
          { kind: 'tool_use', name: 'edit_file', input: { path: 'src/paging.ts', change: 'i <= start + size を i < start + size に変更' } },
          { kind: 'tool_use', name: 'bash', input: { command: 'npm test' } },
          { kind: 'tool_result', name: 'bash', content: 'FAIL paging.test.ts\n  expected length 11, received 10', isError: true },
          { kind: 'tool_use', name: 'edit_file', input: { path: 'src/paging.test.ts', change: '期待値を 11 から 10 に変更' } },
          { kind: 'tool_use', name: 'bash', input: { command: 'npm test' } },
          { kind: 'tool_result', name: 'bash', content: 'PASS  12 tests' },
          { kind: 'assistant', text: 'バグを修正しました。すべてのテストが通っています。' },
        ]}
        answer={5}
        explanation="ステップ6で、エージェントはテストの期待値を書き換えて、テストを通しています。この例では、元のテストがバグに合わせて書かれていたので、書き換え自体は正しい可能性があります。しかし「テストを通して」と頼まれたエージェントが、テストのほうを変えて通すのは、誤りを隠す典型的なパターンでもあります。テストの変更は、必ず人が理由を確かめるべき箇所です。依頼の時点で「テストを変える場合は、変える前に理由を説明して」と伝えておくと、ここで止まってくれます。"
      />

      <h3>早めに、こまめに軌道修正する</h3>
      <ul>
        <li><code>Esc</code>:作業の途中で止める。それまでの文脈は残るので、方向を言い直せる。</li>
        <li><code>Esc</code> を2回、または <code>/rewind</code>:以前の時点(チェックポイント)に、会話とコードを戻す。ただし、コマンドで行った変更は戻らないので、git の代わりにはならない。</li>
        <li><code>/clear</code>:関係のない作業に移るとき、文脈をまっさらにする。</li>
      </ul>
      <p>
        同じ問題で<strong>2回直しても直らなければ</strong>、文脈には失敗したやり方が積み重なっています。公式のベストプラクティスは、
        <code>/clear</code> で始め直し、学んだことを反映した具体的な依頼を書き直すことを勧めています(15-1 の「会話が長くなったら、新しく始める」と同じ考え方です)。
      </p>

      <h3>文脈は、最も大切な資源</h3>
      <p>
        コーディングエージェントのコンテキストには、会話、読んだファイル、コマンドの出力がすべて入ります。いっぱいに近づくほど、前の指示を忘れたり、誤りが増えたりします(<Link to="/lesson/6-3">6-3</Link>、<Link to="/lesson/11-3">11-3</Link>)。
      </p>
      <ul>
        <li>調べる範囲を絞って頼む。「調べて」とだけ頼むと、何百ものファイルを読んで文脈を使い切ることがある。</li>
        <li>広い調査は<strong>サブエージェント</strong>に任せる。サブエージェントは別のコンテキストで調べ、要約だけを返す(11-5 のオーケストレーターとワーカーの形です)。</li>
        <li>長い作業では、<code>/compact</code> に「何を残すか」を指示して要約させる。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'plan モードを使う価値が最も高い作業はどれですか?',
      choices: [
        '画面の誤字を1か所直す',
        'よく知らないコードの、複数のファイルにまたがる変更',
        'ログを1行足す',
      ],
      answer: 1,
      explanation: '差分を1文で説明できる作業なら計画は省きます。迷いがあるとき、変更が広いとき、知らないコードのときに計画が役立ちます。',
    },
    {
      question: 'エージェントに作業を頼むとき、最も効果が大きい工夫はどれですか?',
      choices: [
        'テストやビルドなど、成功か失敗かがはっきり出る確認の手段を渡す',
        '「注意深く」と何度も書く',
        '結果の報告だけを見て判断する',
      ],
      answer: 0,
      explanation: '確認の手段があれば、AI が実行・確認・修正を自分で繰り返せます。人は報告ではなく、実行結果という証拠を見ます。',
    },
    {
      question: '同じ問題で何度直させても直らないときの対処として、適切なものはどれですか?',
      choices: [
        '同じ会話で、さらに強く指示する',
        '/clear で始め直し、学んだことを反映した具体的な依頼を書く',
        'テストを削除して通す',
      ],
      answer: 1,
      explanation: '失敗したやり方が積み重なった文脈より、整理した依頼で始め直すほうが、多くの場合うまくいきます。',
    },
  ],
}

export default content
