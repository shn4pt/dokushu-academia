import ClassifyItems from '../ui/ClassifyItems'
import StepThrough from '../ui/StepThrough'
import type { LessonContent } from './types'

function Body() {
  return (
    <>
      <h3>L4:課題を渡して、成果物を受け取る</h3>
      <p>
        L3 では、人が AI のそばで作業を見守り、途中で軌道修正していました。L4 では、<strong>課題(issue)を渡すと、AI が別の環境で実装とテストを行い、
        変更の提案(PR)を出してくる</strong>ようになります。人は作業中に立ち会わず、受け取った PR をレビューします。
      </p>
      <p>
        この変化で、2つのことが重要になります。1つは、途中で質問できないので、<strong>課題の書き方だけで意図が伝わる</strong>こと。
        もう1つは、PR が次々に届くので、<strong>レビューと検証が追いつく</strong>ことです(17-2)。
      </p>

      <h3>任せられる課題の書き方</h3>
      <p>16-2 の仕様と同じく、課題は「それだけで読める」形にします。次のようなテンプレートを、issue の雛形として用意しておくと便利です。</p>
      <pre>{`## 背景
2ページ目の先頭が、1ページ目の最後と重複して表示される。

## やること
src/paging.ts の getPage が、1ページにちょうど size 件を返すように直す。

## やらないこと
- ページ分けの UI の変更
- 既存の公開している関数名の変更

## 完了の条件
- 0件、10件、11件、25件のときの境界のテストを追加し、すべて通る
- npm run build が通る

## 参考
- 関係するテスト: src/paging.test.ts`}</pre>

      <ClassifyItems
        title="判定:この課題は、そのまま任せられる?"
        description="それぞれの課題を、そのまま AI に任せられるか、先に人が書き直す(または自分で進める)べきかを判定してください。"
        options={['任せられる', '先に書き直す']}
        items={[
          { text: '「アプリを使いやすくする」', ok: ['先に書き直す'], why: '何をすれば完了か分かりません。具体的な問題と完了の条件に分けます。' },
          { text: '「README の手順で、npm start を npm run dev に直す。ほかの記述は変えない」', ok: ['任せられる'], why: '範囲と完了が明確で、差分を見ればすぐ確かめられます。' },
          { text: '「getPage の重複のバグを直す。境界のテスト(0・10・11・25件)を追加し、すべて通すこと」', ok: ['任せられる'], why: '再現の条件と、検証の手段が書かれています。' },
          { text: '「決済の処理を、新しい決済サービスに移行する」', ok: ['先に書き直す'], why: 'リスクが高く、判断も多い作業です(14-3)。設計は人が主導し、確かめやすい小さな課題に分けてから任せます。' },
          { text: '「ログの出力をすべて新しい形式にそろえる。形式は docs/logging.md の例に従う。既存のテストがすべて通ること」', ok: ['任せられる'], why: '従うべき見本と、完了の条件があります。' },
        ]}
      />

      <h3>GitHub の上で任せる:Claude Code GitHub Actions</h3>
      <p>
        Claude Code GitHub Actions(<code>anthropics/claude-code-action</code>)を使うと、issue や PR のコメントで <code>@claude</code> と呼びかけるだけで、
        GitHub Actions の実行環境の中で Claude Code が動き、コードを調べて変更し、コミットや PR を作ります。手元の Claude Code で <code>/install-github-app</code> を実行すると、
        GitHub App の導入、認証情報のシークレットへの登録、ワークフローの追加までを案内してくれます。
      </p>
      <pre className="code-file">{`name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}`}</pre>
      <ul>
        <li><strong>2つの動き方</strong>:<code>prompt</code> を指定しなければ、<code>@claude</code> の呼びかけに応える「対話」の動き方。指定すれば、PR が開かれたときや毎朝など、決まったきっかけで自動で動く。</li>
        <li><strong>誰が動かせるか</strong>:既定では、リポジトリへの書き込み権限を持つ人のコメントにだけ応え、ボットからのきっかけは拒否する(ボット同士の無限ループを防ぐ)。</li>
        <li><strong>認証情報</strong>:API キーは必ず GitHub のシークレットに入れ、ワークフローのファイルに直接書かない。</li>
        <li><strong>コスト</strong>:実行のたびに、GitHub Actions の実行時間と API のトークンを使う。<code>claude_args</code> に <code>--max-turns</code> を渡して繰り返しの回数を制限し、ワークフローにタイムアウトを設定する。</li>
      </ul>

      <StepThrough
        title="見る:issue から PR がマージされるまで"
        description="L4 での1つの課題の流れです。人が関わるのは、課題を書くところと、レビューして判断するところです。"
        steps={[
          { label: '人が課題を書く', body: 'issue: getPage の重複のバグ(上のテンプレートのとおり)\nコメント: @claude この issue を直して、PR を作って', note: '完了の条件まで書いてあるので、途中で質問されずに進められます。' },
          { label: 'AI が別の環境で作業する', body: '・リポジトリを取得して、関係するコードとテストを読む\n・CLAUDE.md の決まりに従って修正する\n・境界のテストを追加して、テストとビルドを実行する', note: 'あなたの PC ではなく、GitHub Actions の実行環境の中で動きます。' },
          { label: 'AI が PR を出す', body: 'PR: getPage が size+1 件を返すバグを修正\n- 変更の内容と理由\n- 追加したテストと、その実行結果', note: '何をどう確かめたかが書かれていると、レビューが速くなります。' },
          { label: 'CI と自動レビューが確かめる', body: '✓ 型チェック  ✓ lint  ✓ テスト  ✓ ビルド\nAI レビュー: 指摘なし', note: '機械で確かめられることは、人が見る前に済ませます(17-2)。' },
          { label: '人がレビューしてマージする', body: '差分を読み、テストが妥当かを確かめ、説明できることを確認してマージする。', note: '最後の判断と責任は人に残ります。' },
        ]}
      />

      <h3>並行して任せる</h3>
      <p>
        L4 では、複数の課題を同時に任せられます。手元では、git の <strong>worktree</strong>(同じリポジトリの、別々の作業フォルダ)を使うと、
        複数の Claude Code のセッションが互いの編集をぶつけずに作業できます。クラウドの実行環境で動かす方法もあります。
        スクリプトから使うときは、対話なしで実行する <code>claude -p "依頼"</code> を使い、<code>--allowedTools</code> で使ってよいツールを絞ります。
      </p>
      <p className="muted">
        ただし、並行して任せるほど、レビューを待つ PR が積み上がります。<strong>チームがレビューできる量</strong>が、任せられる量の上限になります。
      </p>
    </>
  )
}

const content: LessonContent = {
  Body,
  quiz: [
    {
      question: 'L4(委任)で、課題(issue)に特に書いておくべきものはどれですか?',
      choices: ['担当者の好きな食べ物', 'やること、やらないこと、完了の条件(検証の手段)', 'できるだけあいまいな目標'],
      answer: 1,
      explanation: '作業中に質問できないので、課題だけで意図と完了の条件が伝わるようにします。',
    },
    {
      question: 'Claude Code GitHub Actions で API キーを扱う方法として、正しいものはどれですか?',
      choices: ['ワークフローの YAML に直接書く', 'GitHub のシークレットに登録し、ワークフローから参照する', 'issue のコメントに貼る'],
      answer: 1,
      explanation: 'キーはシークレットに入れ、${{ secrets.ANTHROPIC_API_KEY }} のように参照します。',
    },
    {
      question: '複数の課題を並行して任せるときの、実際の上限になりやすいものはどれですか?',
      choices: ['AI の入力の速さ', 'チームがレビューできる量', 'リポジトリのファイル数'],
      answer: 1,
      explanation: '成果物は人がレビューして判断する必要があるため、レビューの量が上限になりやすいです。',
    },
  ],
}

export default content
