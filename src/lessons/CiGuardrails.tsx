import ClassifyItems from '../ui/ClassifyItems'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>レビューが、新しいボトルネックになる</h3>
      <p>
        AI が書く量が増えると、人のレビューが追いつかなくなります。かといって、レビューを軽くすれば誤りが通ります。解決の方向は、
        <strong>機械で確かめられることは、すべて機械で先に確かめ、人は人にしかできない判断に集中する</strong>ことです。
      </p>
      <table className="calc text">
        <thead><tr><th>段階</th><th>確かめること</th><th>担い手</th></tr></thead>
        <tbody>
          <tr><td>1. 機械的なチェック</td><td>型、lint、テスト、ビルド、秘密情報や脆弱性のある依存関係の検査</td><td>CI(必須のチェックにする)</td></tr>
          <tr><td>2. AI によるレビュー</td><td>バグの可能性、境界の扱い、決まりとの食い違い</td><td>別の文脈で動く AI</td></tr>
          <tr><td>3. 人のレビュー</td><td>要件に合っているか、設計は妥当か、リスクはないか、説明できるか</td><td>人(マージの権限を持つ)</td></tr>
        </tbody>
      </table>
      <p>
        GitHub では、ブランチの保護ルールで「必須のチェックが通り、人の承認があるまでマージできない」ようにできます。AI が出した PR でも、人が出した PR でも、同じ関門を通します。
      </p>

      <h3>AI によるレビューを、CI に組み込む</h3>
      <p>
        書いた本人(と同じ文脈)は、自分の誤りに気づきにくいものです。公式のベストプラクティスも、<strong>新しい文脈</strong>のレビュー役に差分を確かめさせることを勧めています。
        次は、PR が開かれたり更新されたりするたびに、Claude Code の code-review プラグインでレビューし、指摘を PR にコメントさせるワークフローの例です(公式ドキュメントの例)。
      </p>
      <pre className="code-file">{`name: Code Review
on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: "https://github.com/anthropics/claude-code.git"
          plugins: "code-review@claude-code-plugins"
          prompt: "/code-review:code-review --comment \${{ github.repository }}/pull/\${{ github.event.pull_request.number }}"
          claude_args: '--allowedTools "mcp__github_inline_comment__create_inline_comment"'`}</pre>
      <ul>
        <li>レビューだけをさせるので、権限は<strong>読み取り</strong>にとどめています(17-1 の例は、書き込みの権限を持っていました)。</li>
        <li>使ってよいツールを、PR にコメントするためのものだけに絞っています(最小権限)。</li>
        <li>公開リポジトリでは、フォークからの PR にはシークレットが渡されないため、このレビューは動きません。外部の人の PR に AI を自動で動かす設計には、特に注意が要ります。</li>
      </ul>
      <p className="muted">
        指摘を探すよう頼まれたレビュー役は、問題のないコードにも何かしら指摘を返しがちです。すべてに対応すると、不要な抽象化や、起こりえないケースのテストが増えていきます。
        「正しさと要件に関わる指摘だけ」に絞るよう頼み、残りは参考として扱います。AI のレビューは、人のレビューの代わりではなく、人が見る前の<strong>ふるい</strong>です。
      </p>

      <h3>ガードレール:どこで、何を守るか</h3>
      <p>
        16-3 で学んだ層(CLAUDE.md、権限のルール、フック、サンドボックス)に、チームの仕組み(CI、ブランチの保護、レビュー)が加わります。
        守りたいことごとに、<strong>確実に効く場所</strong>を選びます。
      </p>

      <ClassifyItems
        title="判定:このルールは、どこで守らせる?"
        description="それぞれのルールを守らせるのに、最も適した仕組みを選んでください(適切な答えが複数あるものもあります)。"
        options={['CLAUDE.md', '権限・フック', 'CI の必須チェック', '人のレビュー']}
        items={[
          { text: 'テストの実行には、このコマンドを使う', ok: ['CLAUDE.md'], why: '強制ではなく、知っておいてほしい情報です。' },
          { text: 'AI が main ブランチに直接 push しない', ok: ['権限・フック'], why: 'Bash(git push *) の拒否などで確実に止めます。リポジトリ側のブランチ保護も合わせて設定します。' },
          { text: '型エラーのあるコードをマージしない', ok: ['CI の必須チェック'], why: '機械で確実に判定でき、AI と人のどちらが書いたコードにも同じように効きます。' },
          { text: '秘密情報をリポジトリに入れない', ok: ['権限・フック', 'CI の必須チェック'], why: '手元ではフックで、リポジトリでは CI の秘密情報の検査で、二重に守ります。' },
          { text: 'この変更が、利用者の求めていることに合っている', ok: ['人のレビュー'], why: '要件の解釈や設計の妥当性は、人が判断します。' },
          { text: 'migrations フォルダのファイルを AI が書き換えない', ok: ['権限・フック'], why: 'PreToolUse のフックや、Edit の拒否ルールで止めます。' },
        ]}
      />

      <h3>小さく出して、元に戻せるようにする</h3>
      <ul>
        <li><strong>PR を小さく保つ</strong>:大きな PR はレビューの質が落ちる。AI に任せる課題そのものを小さく区切る。</li>
        <li><strong>段階的に公開する</strong>:機能フラグや一部の利用者への先行公開で、問題の影響を限る。</li>
        <li><strong>すぐ戻せる</strong>:デプロイを取り消す手順を用意しておく。取り消せることが、任せる範囲を広げる前提になる(14-3)。</li>
        <li><strong>記録を残す</strong>:どの変更が AI によるものか、どんな依頼と検証を経たかを PR に残すと、問題が起きたときに原因をたどれる。</li>
      </ul>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'AI が書く量が増えたときの、レビューの進め方として適切なものはどれですか?',
      choices: [
        'レビューを省略して、すべてマージする',
        '機械で確かめられることを CI で先に確かめ、人は要件や設計の判断に集中する',
        '人がすべての行を、これまでの何倍も時間をかけて読む',
      ],
      answer: 1,
      explanation: '機械的なチェック、AI のレビュー、人のレビューと段階を分け、人にしかできない判断に時間を使います。',
    },
    {
      question: 'AI のレビュー役の指摘への対応として、適切なものはどれですか?',
      choices: [
        'すべての指摘に必ず対応する',
        '正しさと要件に関わる指摘を優先し、それ以外は参考として扱う',
        'AI の指摘はすべて無視する',
      ],
      answer: 1,
      explanation: '指摘を探すよう頼まれたレビュー役は、問題のないコードにも指摘を返しがちです。すべてに対応すると過剰な設計になります。',
    },
    {
      question: '「型エラーのあるコードをマージしない」を確実に守る方法はどれですか?',
      choices: ['CLAUDE.md に書く', 'CI の型チェックを必須のチェックにする', 'PR の説明に書いてもらう'],
      answer: 1,
      explanation: '機械で判定できることは、必須のチェックにすれば、誰が書いたコードでも確実に止められます。',
    },
  ],
}

export default content
